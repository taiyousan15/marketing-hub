/**
 * LINEステップ配信エンジン
 *
 * キャンペーンのステップを自動実行する
 */

import { prisma } from "@/lib/db/prisma";
import { pushTextMessage, pushFlexMessage, multicastMessage } from "./client";
import { Message, TextMessage, FlexMessage } from "@line/bot-sdk";

// ステップタイプ
type StepType = "MESSAGE" | "WAIT" | "CONDITION" | "ACTION";

// メッセージ内容の型
interface MessageContent {
  type: "text" | "flex";
  text?: string;
  altText?: string;
  contents?: FlexMessage["contents"];
}

// 条件の型
interface StepCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: string | number;
}

/**
 * 保留中のステップを処理
 */
export async function processScheduledSteps() {
  const now = new Date();

  // 実行予定のステップを取得
  const pendingContacts = await prisma.campaignContact.findMany({
    where: {
      status: "ACTIVE",
      nextStepAt: {
        lte: now,
      },
    },
    include: {
      campaign: {
        include: {
          steps: {
            orderBy: { order: "asc" },
          },
        },
      },
      contact: true,
    },
    take: 100, // バッチサイズ
  });

  const results: { success: number; failed: number; skipped: number } = {
    success: 0,
    failed: 0,
    skipped: 0,
  };

  for (const campaignContact of pendingContacts) {
    try {
      const result = await executeNextStep(campaignContact);
      if (result.success) {
        results.success++;
      } else if (result.skipped) {
        results.skipped++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.error(
        `Error processing step for contact ${campaignContact.contactId}:`,
        error
      );
      results.failed++;
    }
  }

  return results;
}

/**
 * 次のステップを実行
 */
async function executeNextStep(
  campaignContact: {
    id: string;
    currentStep: number;
    campaign: {
      id: string;
      type: string;
      steps: Array<{
        id: string;
        order: number;
        type: string;
        content: unknown;
        conditions: unknown;
        delayDays: number;
        delayHours: number;
        delayMinutes: number;
        sendTime: string | null;
        trueBranchOrder: number | null;
        falseBranchOrder: number | null;
      }>;
    };
    contact: {
      id: string;
      tenantId: string;
      lineUserId: string | null;
      email: string | null;
      lineOptIn: boolean;
    };
  }
): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  const { campaign, contact, currentStep } = campaignContact;

  // 現在のステップを取得
  const step = campaign.steps.find((s) => s.order === currentStep);
  if (!step) {
    // キャンペーン完了
    await prisma.campaignContact.update({
      where: { id: campaignContact.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    return { success: true };
  }

  // LINE配信の場合、LINE User IDとオプトインを確認
  if (campaign.type.startsWith("LINE")) {
    if (!contact.lineUserId || !contact.lineOptIn) {
      return { success: false, skipped: true, error: "LINE not available" };
    }
  }

  // ステップタイプに応じた処理
  switch (step.type as StepType) {
    case "MESSAGE":
      await executeMessageStep(step, contact);
      break;

    case "WAIT":
      // WAITステップは次のステップの計算で処理される
      break;

    case "CONDITION":
      const conditionResult = await evaluateCondition(
        step.conditions as StepCondition[],
        contact
      );
      // 条件分岐の結果に応じて次のステップを決定
      const branchTargetOrder = conditionResult
        ? step.trueBranchOrder
        : step.falseBranchOrder;

      if (branchTargetOrder !== null && branchTargetOrder !== undefined) {
        // 分岐先が指定されている場合、そのステップへジャンプ
        const branchTargetStep = campaign.steps.find(
          (s) => s.order === branchTargetOrder
        );
        if (branchTargetStep) {
          const nextStepAt = calculateNextStepTime(branchTargetStep);
          await prisma.campaignContact.update({
            where: { id: campaignContact.id },
            data: {
              currentStep: branchTargetOrder,
              nextStepAt,
            },
          });
          return { success: true };
        }
      }
      // 分岐先が未設定なら通常通り次のステップへ
      break;

    case "ACTION":
      await executeActionStep(step, contact);
      break;
  }

  // 次のステップを計算
  const nextStep = campaign.steps.find((s) => s.order === currentStep + 1);
  if (nextStep) {
    const nextStepAt = calculateNextStepTime(nextStep);
    await prisma.campaignContact.update({
      where: { id: campaignContact.id },
      data: {
        currentStep: currentStep + 1,
        nextStepAt,
      },
    });
  } else {
    // キャンペーン完了
    await prisma.campaignContact.update({
      where: { id: campaignContact.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  // メッセージ履歴を記録
  if (step.type === "MESSAGE") {
    await prisma.messageHistory.create({
      data: {
        tenantId: campaign.id.split("_")[0] || "",
        contactId: contact.id,
        channel: campaign.type.startsWith("LINE") ? "LINE" : "EMAIL",
        direction: "OUTBOUND",
        content: JSON.stringify(step.content),
        campaignId: campaign.id,
        stepId: step.id,
      },
    });
  }

  return { success: true };
}

/**
 * メッセージステップを実行
 */
async function executeMessageStep(
  step: { content: unknown },
  contact: { lineUserId: string | null }
) {
  if (!contact.lineUserId) return;

  const content = step.content as MessageContent;

  if (content.type === "text" && content.text) {
    await pushTextMessage(contact.lineUserId, content.text);
  } else if (content.type === "flex" && content.contents) {
    await pushFlexMessage(
      contact.lineUserId,
      content.altText || "メッセージ",
      content.contents
    );
  }
}

/**
 * 条件を評価
 */
async function evaluateCondition(
  conditions: StepCondition[],
  contact: { id: string }
): Promise<boolean> {
  if (!conditions || conditions.length === 0) return true;

  // コンタクトの詳細情報を取得
  const fullContact = await prisma.contact.findUnique({
    where: { id: contact.id },
    include: {
      tags: { include: { tag: true } },
    },
  });

  if (!fullContact) return false;

  for (const condition of conditions) {
    const fieldValue = getFieldValue(fullContact, condition.field);
    const result = evaluateOperator(
      fieldValue,
      condition.operator,
      condition.value
    );
    if (!result) return false;
  }

  return true;
}

/**
 * フィールド値を取得
 */
function getFieldValue(contact: Record<string, unknown>, field: string): unknown {
  // ドット記法でネストされたフィールドにアクセス
  const parts = field.split(".");
  let value: unknown = contact;
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
 * 演算子を評価
 */
function evaluateOperator(
  fieldValue: unknown,
  operator: string,
  conditionValue: string | number
): boolean {
  switch (operator) {
    case "equals":
      return fieldValue === conditionValue;
    case "not_equals":
      return fieldValue !== conditionValue;
    case "contains":
      return String(fieldValue).includes(String(conditionValue));
    case "greater_than":
      return Number(fieldValue) > Number(conditionValue);
    case "less_than":
      return Number(fieldValue) < Number(conditionValue);
    default:
      return false;
  }
}

/**
 * アクションステップを実行
 */
async function executeActionStep(
  step: { content: unknown },
  contact: { id: string; tenantId: string }
) {
  const action = step.content as {
    type: string;
    tagId?: string;
    scoreField?: string;
    scoreValue?: number;
    segmentId?: string;
  };

  switch (action.type) {
    case "add_tag":
      if (action.tagId) {
        await prisma.contactTag.upsert({
          where: {
            contactId_tagId: {
              contactId: contact.id,
              tagId: action.tagId,
            },
          },
          create: {
            contactId: contact.id,
            tagId: action.tagId,
          },
          update: {},
        });
      }
      break;

    case "remove_tag":
      if (action.tagId) {
        await prisma.contactTag.deleteMany({
          where: {
            contactId: contact.id,
            tagId: action.tagId,
          },
        });
      }
      break;

    case "update_score":
      if (action.scoreField && action.scoreValue !== undefined) {
        await prisma.contactScore.upsert({
          where: { contactId: contact.id },
          create: {
            contactId: contact.id,
            tenantId: contact.tenantId,
            [action.scoreField]: action.scoreValue,
          },
          update: {
            [action.scoreField]: action.scoreValue,
          },
        });
      }
      break;
  }
}

/**
 * 次のステップの実行時刻を計算
 */
function calculateNextStepTime(step: {
  delayDays: number;
  delayHours: number;
  delayMinutes: number;
  sendTime: string | null;
}): Date {
  const now = new Date();
  let nextTime = new Date(now);

  // 遅延を追加
  nextTime.setDate(nextTime.getDate() + step.delayDays);
  nextTime.setHours(nextTime.getHours() + step.delayHours);
  nextTime.setMinutes(nextTime.getMinutes() + step.delayMinutes);

  // 送信時刻が指定されている場合
  if (step.sendTime) {
    const [hours, minutes] = step.sendTime.split(":").map(Number);
    nextTime.setHours(hours, minutes, 0, 0);

    // 指定時刻が過ぎていたら翌日
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }
  }

  return nextTime;
}

/**
 * コンタクトをキャンペーンに登録
 */
export async function enrollContactToCampaign(
  campaignId: string,
  contactId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // キャンペーンを取得
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        steps: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });

    if (!campaign) {
      return { success: false, error: "Campaign not found" };
    }

    if (campaign.status !== "ACTIVE") {
      return { success: false, error: "Campaign is not active" };
    }

    // 既に登録済みかチェック
    const existing = await prisma.campaignContact.findFirst({
      where: {
        campaignId,
        contactId,
        status: { in: ["ACTIVE", "PAUSED"] },
      },
    });

    if (existing) {
      return { success: false, error: "Already enrolled" };
    }

    // 最初のステップの実行時刻を計算
    const firstStep = campaign.steps[0];
    const nextStepAt = firstStep
      ? calculateNextStepTime(firstStep)
      : new Date();

    // キャンペーンに登録
    await prisma.campaignContact.create({
      data: {
        campaignId,
        contactId,
        status: "ACTIVE",
        currentStep: 1,
        nextStepAt,
        startedAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error enrolling contact to campaign:", error);
    return { success: false, error: "Failed to enroll" };
  }
}

/**
 * 一斉配信を実行
 */
export async function executeBroadcast(
  campaignId: string
): Promise<{ success: boolean; sent: number; error?: string }> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        steps: {
          orderBy: { order: "asc" },
          take: 1,
        },
        segment: true,
      },
    });

    if (!campaign || !campaign.steps[0]) {
      return { success: false, sent: 0, error: "Campaign or step not found" };
    }

    // 対象コンタクトを取得
    const contacts = await prisma.contact.findMany({
      where: {
        tenantId: campaign.tenantId,
        lineUserId: { not: null },
        lineOptIn: true,
        ...(campaign.segmentId && {
          // セグメント条件を適用
        }),
      },
      select: {
        lineUserId: true,
      },
    });

    const lineUserIds = contacts
      .map((c) => c.lineUserId)
      .filter((id): id is string => id !== null);

    if (lineUserIds.length === 0) {
      return { success: true, sent: 0 };
    }

    // メッセージを構築
    const content = campaign.steps[0].content as unknown as MessageContent;
    const messages: Message[] = [];

    if (content.type === "text" && content.text) {
      messages.push({
        type: "text",
        text: content.text,
      } as TextMessage);
    } else if (content.type === "flex" && content.contents) {
      messages.push({
        type: "flex",
        altText: content.altText || "メッセージ",
        contents: content.contents,
      } as FlexMessage);
    }

    // マルチキャストで送信
    await multicastMessage(lineUserIds, messages);

    // キャンペーンステータスを更新
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "COMPLETED" },
    });

    return { success: true, sent: lineUserIds.length };
  } catch (error) {
    console.error("Error executing broadcast:", error);
    return { success: false, sent: 0, error: "Failed to broadcast" };
  }
}
