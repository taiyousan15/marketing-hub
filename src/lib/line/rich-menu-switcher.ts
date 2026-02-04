/**
 * リッチメニュー切り替えロジック
 *
 * セグメント条件に基づいてリッチメニューを自動切り替え
 */

import { prisma } from "@/lib/db/prisma";
import { lineClient } from "./client";

interface ConditionRule {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "in";
  value: string | number | boolean | string[];
}

interface MenuConditions {
  rules: ConditionRule[];
  logic: "AND" | "OR";
}

/**
 * コンタクトに適切なリッチメニューを設定
 */
export async function setRichMenuForContact(
  tenantId: string,
  lineUserId: string
): Promise<{ success: boolean; menuId?: string; error?: string }> {
  try {
    if (!lineClient) {
      return { success: false, error: "LINE client not configured" };
    }

    // コンタクト情報を取得
    const contact = await prisma.contact.findFirst({
      where: { tenantId, lineUserId },
      include: {
        tags: { include: { tag: true } },
      },
    });

    if (!contact) {
      return { success: false, error: "Contact not found" };
    }

    // コンタクトスコアを取得
    const score = await prisma.contactScore.findUnique({
      where: { contactId: contact.id },
    });

    // テナントのリッチメニュー一覧を取得（条件付きメニュー優先）
    const richMenus = await prisma.lineRichMenu.findMany({
      where: { tenantId },
      orderBy: [
        { isDefault: "asc" }, // デフォルトを後ろに
        { createdAt: "desc" },
      ],
    });

    if (richMenus.length === 0) {
      return { success: false, error: "No rich menus found" };
    }

    // 条件評価用のコンタクトデータを構築
    const contactData = {
      score: contact.score,
      leadScore: score?.leadScore || 0,
      engagementScore: score?.engagementScore || 0,
      tier: score?.tier || "cold",
      rfmSegment: score?.rfmSegment || null,
      tags: contact.tags.map((t) => t.tag.name),
      emailOptIn: contact.emailOptIn,
      lineOptIn: contact.lineOptIn,
      createdAt: contact.createdAt,
      source: contact.source,
    };

    // 条件に一致する最初のメニューを見つける
    let selectedMenu = null;

    for (const menu of richMenus) {
      if (!menu.conditions) {
        // 条件がない場合はデフォルトとして後で評価
        if (menu.isDefault && !selectedMenu) {
          selectedMenu = menu;
        }
        continue;
      }

      const conditions = menu.conditions as unknown as MenuConditions;
      if (evaluateConditions(conditions, contactData)) {
        selectedMenu = menu;
        break;
      }
    }

    // 一致するメニューがない場合はデフォルトを使用
    if (!selectedMenu) {
      selectedMenu = richMenus.find((m) => m.isDefault) || richMenus[0];
    }

    if (!selectedMenu?.lineRichMenuId) {
      return { success: false, error: "No valid rich menu found" };
    }

    // LINE APIでリッチメニューを設定
    await lineClient.linkRichMenuToUser(lineUserId, selectedMenu.lineRichMenuId);

    return { success: true, menuId: selectedMenu.id };
  } catch (error) {
    console.error("Error setting rich menu for contact:", error);
    return { success: false, error: "Failed to set rich menu" };
  }
}

/**
 * 条件を評価
 */
function evaluateConditions(
  conditions: MenuConditions,
  contactData: Record<string, unknown>
): boolean {
  if (!conditions.rules || conditions.rules.length === 0) {
    return false;
  }

  const results = conditions.rules.map((rule) => {
    return evaluateRule(rule, contactData);
  });

  if (conditions.logic === "OR") {
    return results.some((r) => r);
  }
  return results.every((r) => r);
}

/**
 * 単一ルールを評価
 */
function evaluateRule(
  rule: ConditionRule,
  contactData: Record<string, unknown>
): boolean {
  const fieldValue = getNestedValue(contactData, rule.field);

  switch (rule.operator) {
    case "equals":
      return fieldValue === rule.value;

    case "not_equals":
      return fieldValue !== rule.value;

    case "contains":
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(rule.value as string);
      }
      return String(fieldValue).includes(String(rule.value));

    case "greater_than":
      return Number(fieldValue) > Number(rule.value);

    case "less_than":
      return Number(fieldValue) < Number(rule.value);

    case "in":
      if (Array.isArray(rule.value)) {
        return rule.value.includes(fieldValue as string);
      }
      return false;

    default:
      return false;
  }
}

/**
 * ネストされた値を取得
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let value: unknown = obj;

  for (const part of parts) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * テナント内の全コンタクトのリッチメニューを更新
 */
export async function updateRichMenusForTenant(
  tenantId: string
): Promise<{ updated: number; failed: number }> {
  const results = { updated: 0, failed: 0 };

  try {
    // LINEユーザーIDを持つ全コンタクトを取得
    const contacts = await prisma.contact.findMany({
      where: {
        tenantId,
        lineUserId: { not: null },
        lineOptIn: true,
      },
      select: { lineUserId: true },
    });

    for (const contact of contacts) {
      if (contact.lineUserId) {
        const result = await setRichMenuForContact(tenantId, contact.lineUserId);
        if (result.success) {
          results.updated++;
        } else {
          results.failed++;
        }
      }
    }
  } catch (error) {
    console.error("Error updating rich menus for tenant:", error);
  }

  return results;
}

/**
 * Webhook受信時にリッチメニューを設定（友だち追加時など）
 */
export async function onFollowEvent(
  tenantId: string,
  lineUserId: string
): Promise<void> {
  await setRichMenuForContact(tenantId, lineUserId);
}

/**
 * セグメント変更時にリッチメニューを更新
 */
export async function onSegmentChange(
  tenantId: string,
  contactId: string
): Promise<void> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { lineUserId: true },
  });

  if (contact?.lineUserId) {
    await setRichMenuForContact(tenantId, contact.lineUserId);
  }
}
