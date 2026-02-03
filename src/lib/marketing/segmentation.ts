/**
 * Segmentation Engine
 *
 * 行動・属性ベースのハイパーセグメンテーション
 * 根拠: research/runs/20260201-082657__step-email-trends/evidence.jsonl (ev-003, ev-004)
 *
 * @see ADR: ハイパーセグメンテーションは2026年のトレンド
 */

import { prisma } from "@/lib/db/prisma";

// ==================== 型定義 ====================

export type SegmentOperator =
  | "eq"      // 等しい
  | "neq"     // 等しくない
  | "gt"      // より大きい
  | "gte"     // 以上
  | "lt"      // より小さい
  | "lte"     // 以下
  | "contains"    // 含む
  | "not_contains" // 含まない
  | "in"      // リスト内
  | "not_in"  // リスト外
  | "exists"  // 存在する
  | "not_exists"  // 存在しない
  | "before"  // 日付：以前
  | "after"   // 日付：以降
  | "within_days"; // 日付：N日以内

export interface SegmentRule {
  field: string;          // "score" | "tags" | "customFields.xxx" | "lastOrderAt"
  operator: SegmentOperator;
  value: string | number | boolean | string[] | number[];
}

export interface SegmentConfig {
  name: string;
  description?: string;
  color?: string;
  rules: SegmentRule[];
  rulesLogic?: "AND" | "OR";
  autoUpdate?: boolean;
  priority?: number;
}

// ==================== プリセットセグメント ====================

export const PRESET_SEGMENTS: Record<string, SegmentConfig> = {
  // 購買意欲別
  hot_leads: {
    name: "ホットリード",
    description: "スコア80以上の高購買意欲顧客",
    color: "#ef4444",
    rules: [{ field: "score", operator: "gte", value: 80 }],
  },
  warm_leads: {
    name: "ウォームリード",
    description: "スコア50-79の見込み顧客",
    color: "#f97316",
    rules: [
      { field: "score", operator: "gte", value: 50 },
      { field: "score", operator: "lt", value: 80 },
    ],
  },
  cold_leads: {
    name: "コールドリード",
    description: "スコア50未満の潜在顧客",
    color: "#3b82f6",
    rules: [{ field: "score", operator: "lt", value: 50 }],
  },

  // エンゲージメント別
  active_subscribers: {
    name: "アクティブ購読者",
    description: "30日以内にメールを開封した顧客",
    color: "#22c55e",
    rules: [{ field: "lastOpenedAt", operator: "within_days", value: 30 }],
  },
  inactive_subscribers: {
    name: "休眠顧客",
    description: "90日以上アクションのない顧客",
    color: "#6b7280",
    rules: [{ field: "lastActivityAt", operator: "before", value: 90 }],
  },

  // ライフサイクル別
  new_subscribers: {
    name: "新規登録",
    description: "7日以内に登録した顧客",
    color: "#a855f7",
    rules: [{ field: "createdAt", operator: "within_days", value: 7 }],
  },
  paying_customers: {
    name: "有料顧客",
    description: "購入履歴のある顧客",
    color: "#eab308",
    rules: [{ field: "totalOrders", operator: "gt", value: 0 }],
  },
};

// ==================== セグメント評価 ====================

/**
 * コンタクトがルールに一致するか評価
 */
export function evaluateRule(
  contact: Record<string, unknown>,
  rule: SegmentRule
): boolean {
  const fieldValue = getNestedValue(contact, rule.field);

  switch (rule.operator) {
    case "eq":
      return fieldValue === rule.value;
    case "neq":
      return fieldValue !== rule.value;
    case "gt":
      return typeof fieldValue === "number" && fieldValue > (rule.value as number);
    case "gte":
      return typeof fieldValue === "number" && fieldValue >= (rule.value as number);
    case "lt":
      return typeof fieldValue === "number" && fieldValue < (rule.value as number);
    case "lte":
      return typeof fieldValue === "number" && fieldValue <= (rule.value as number);
    case "contains":
      return String(fieldValue).includes(String(rule.value));
    case "not_contains":
      return !String(fieldValue).includes(String(rule.value));
    case "in":
      return Array.isArray(rule.value) && (rule.value as unknown[]).includes(fieldValue);
    case "not_in":
      return Array.isArray(rule.value) && !(rule.value as unknown[]).includes(fieldValue);
    case "exists":
      return fieldValue !== null && fieldValue !== undefined;
    case "not_exists":
      return fieldValue === null || fieldValue === undefined;
    case "before":
      return isDateBefore(fieldValue, rule.value as number);
    case "after":
      return isDateAfter(fieldValue, rule.value as number);
    case "within_days":
      return isWithinDays(fieldValue, rule.value as number);
    default:
      return false;
  }
}

/**
 * コンタクトがセグメントに一致するか評価
 */
export function evaluateSegment(
  contact: Record<string, unknown>,
  rules: SegmentRule[],
  logic: "AND" | "OR" = "AND"
): boolean {
  if (rules.length === 0) return false;

  if (logic === "AND") {
    return rules.every((rule) => evaluateRule(contact, rule));
  } else {
    return rules.some((rule) => evaluateRule(contact, rule));
  }
}

// ==================== セグメント操作 ====================

/**
 * セグメントを作成
 */
export async function createSegment(
  tenantId: string,
  config: SegmentConfig
) {
  const segment = await prisma.segment.create({
    data: {
      tenantId,
      name: config.name,
      description: config.description,
      color: config.color || "#6366f1",
      rules: JSON.parse(JSON.stringify(config.rules)),
      rulesLogic: config.rulesLogic || "AND",
      autoUpdate: config.autoUpdate ?? true,
      priority: config.priority || 0,
    },
  });

  // 自動更新が有効なら即座に評価
  if (segment.autoUpdate) {
    await updateSegmentMembers(segment.id);
  }

  return segment;
}

/**
 * セグメントメンバーを更新
 */
export async function updateSegmentMembers(segmentId: string) {
  const segment = await prisma.segment.findUnique({
    where: { id: segmentId },
  });

  if (!segment) throw new Error("Segment not found");

  const rules = segment.rules as unknown as SegmentRule[];
  const logic = segment.rulesLogic as "AND" | "OR";

  // テナントの全コンタクトを取得
  const contacts = await prisma.contact.findMany({
    where: { tenantId: segment.tenantId },
    include: {
      tags: { include: { tag: true } },
      orders: true,
    },
  });

  // 各コンタクトを評価
  const matchingContactIds: string[] = [];

  for (const contact of contacts) {
    // コンタクトデータを評価用に変換
    const contactData = transformContactForEvaluation(contact);

    if (evaluateSegment(contactData, rules, logic)) {
      matchingContactIds.push(contact.id);
    }
  }

  // 既存のメンバーシップを削除（自動追加のみ）
  await prisma.contactSegment.deleteMany({
    where: {
      segmentId,
      isAuto: true,
    },
  });

  // 新しいメンバーシップを作成
  if (matchingContactIds.length > 0) {
    await prisma.contactSegment.createMany({
      data: matchingContactIds.map((contactId) => ({
        contactId,
        segmentId,
        isAuto: true,
      })),
      skipDuplicates: true,
    });
  }

  // メンバー数を更新
  await prisma.segment.update({
    where: { id: segmentId },
    data: { memberCount: matchingContactIds.length },
  });

  return matchingContactIds.length;
}

/**
 * 全セグメントを更新（バッチ処理用）
 */
export async function updateAllSegments(tenantId: string) {
  const segments = await prisma.segment.findMany({
    where: {
      tenantId,
      autoUpdate: true,
    },
  });

  const results: { segmentId: string; memberCount: number }[] = [];

  for (const segment of segments) {
    const memberCount = await updateSegmentMembers(segment.id);
    results.push({ segmentId: segment.id, memberCount });
  }

  return results;
}

/**
 * コンタクトの所属セグメントを取得
 */
export async function getContactSegments(contactId: string) {
  const memberships = await prisma.contactSegment.findMany({
    where: { contactId },
    include: {
      // セグメント情報を直接取得（リレーションがないのでサブクエリ）
    },
  });

  const segmentIds = memberships.map((m) => m.segmentId);

  const segments = await prisma.segment.findMany({
    where: { id: { in: segmentIds } },
  });

  return segments;
}

/**
 * プリセットセグメントをテナントに追加
 */
export async function initializePresetSegments(tenantId: string) {
  const results = [];

  for (const [key, config] of Object.entries(PRESET_SEGMENTS)) {
    try {
      const segment = await createSegment(tenantId, {
        ...config,
        priority: Object.keys(PRESET_SEGMENTS).indexOf(key),
      });
      results.push({ key, success: true, segment });
    } catch (error) {
      // 既に存在する場合はスキップ
      results.push({ key, success: false, error: "Already exists" });
    }
  }

  return results;
}

// ==================== ヘルパー関数 ====================

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let value: unknown = obj;

  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = (value as Record<string, unknown>)[key];
  }

  return value;
}

function isDateBefore(fieldValue: unknown, daysAgo: number): boolean {
  if (!fieldValue) return false;
  const date = new Date(fieldValue as string);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysAgo);
  return date < threshold;
}

function isDateAfter(fieldValue: unknown, daysAgo: number): boolean {
  if (!fieldValue) return false;
  const date = new Date(fieldValue as string);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - daysAgo);
  return date > threshold;
}

function isWithinDays(fieldValue: unknown, days: number): boolean {
  if (!fieldValue) return false;
  const date = new Date(fieldValue as string);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  return date >= threshold;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformContactForEvaluation(contact: any): Record<string, unknown> {
  return {
    ...contact,
    // タグを配列に変換
    tagNames: contact.tags?.map((t: { tag: { name: string } }) => t.tag.name) || [],
    // 注文データを集計
    totalOrders: contact.orders?.length || 0,
    totalRevenue: contact.orders?.reduce((sum: number, o: { amount: number }) => sum + o.amount, 0) || 0,
    lastOrderAt: contact.orders?.length > 0
      ? Math.max(...contact.orders.map((o: { createdAt: Date }) => o.createdAt.getTime()))
      : null,
    // カスタムフィールドをフラット化
    customFields: contact.customFields || {},
  };
}
