/**
 * Auto Webinar 分岐ロジック
 * 視聴時間、クリック、エンゲージメントに基づく条件分岐
 */

import { prisma } from "@/lib/db/prisma";

export interface BranchingCondition {
  type: "watch_time" | "offer_clicked" | "engagement" | "quiz_answer" | "custom";
  operator: "gte" | "lte" | "eq" | "ne" | "contains";
  value: string | number | boolean;
  metadata?: Record<string, any>;
}

export interface BranchingRule {
  id: string;
  name: string;
  conditions: BranchingCondition[];
  logicalOperator: "AND" | "OR";
  trueAction: BranchingAction;
  falseAction: BranchingAction;
}

export interface BranchingAction {
  type: "redirect" | "show_offer" | "send_email" | "add_tag" | "webhook";
  config: Record<string, any>;
}

/**
 * セッションデータから分岐条件を評価
 */
export async function evaluateBranchingConditions(
  sessionId: string,
  conditions: BranchingCondition[],
  logicalOperator: "AND" | "OR" = "AND"
): Promise<boolean> {
  const session = await prisma.autoWebinarSession.findUnique({
    where: { id: sessionId },
    include: {
      webinar: true,
    },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const results = await Promise.all(
    conditions.map((condition) => evaluateCondition(session, condition))
  );

  if (logicalOperator === "AND") {
    return results.every((result) => result === true);
  } else {
    return results.some((result) => result === true);
  }
}

/**
 * 単一の条件を評価
 */
async function evaluateCondition(
  session: any,
  condition: BranchingCondition
): Promise<boolean> {
  switch (condition.type) {
    case "watch_time":
      return evaluateWatchTime(session, condition);

    case "offer_clicked":
      return evaluateOfferClicked(session, condition);

    case "engagement":
      return evaluateEngagement(session, condition);

    case "quiz_answer":
      return evaluateQuizAnswer(session, condition);

    case "custom":
      return evaluateCustomCondition(session, condition);

    default:
      return false;
  }
}

/**
 * 視聴時間の条件評価
 * 例: 動画の50%以上視聴した
 */
function evaluateWatchTime(
  session: any,
  condition: BranchingCondition
): boolean {
  const watchedSeconds = session.maxWatchedSeconds;
  const totalDuration = session.webinar.videoDuration;
  const watchPercentage = (watchedSeconds / totalDuration) * 100;

  switch (condition.operator) {
    case "gte":
      return watchPercentage >= Number(condition.value);
    case "lte":
      return watchPercentage <= Number(condition.value);
    case "eq":
      return watchPercentage === Number(condition.value);
    case "ne":
      return watchPercentage !== Number(condition.value);
    default:
      return false;
  }
}

/**
 * オファークリックの条件評価
 * 例: 特定のオファーをクリックした
 */
function evaluateOfferClicked(
  session: any,
  condition: BranchingCondition
): boolean {
  const offersClicked = session.offersClicked as string[] | null;

  if (!offersClicked || offersClicked.length === 0) {
    return false;
  }

  const offerId = String(condition.value);

  switch (condition.operator) {
    case "contains":
      return offersClicked.includes(offerId);
    case "eq":
      return offersClicked.length === 1 && offersClicked[0] === offerId;
    case "ne":
      return !offersClicked.includes(offerId);
    default:
      return false;
  }
}

/**
 * エンゲージメントの条件評価
 * 例: 完視聴率が80%以上
 */
function evaluateEngagement(
  session: any,
  condition: BranchingCondition
): boolean {
  const completionPercent = session.completionPercent;

  switch (condition.operator) {
    case "gte":
      return completionPercent >= Number(condition.value);
    case "lte":
      return completionPercent <= Number(condition.value);
    case "eq":
      return completionPercent === Number(condition.value);
    case "ne":
      return completionPercent !== Number(condition.value);
    default:
      return false;
  }
}

/**
 * クイズ回答の条件評価
 * 例: クイズで正解した
 */
function evaluateQuizAnswer(
  session: any,
  condition: BranchingCondition
): boolean {
  const metadata = condition.metadata || {};
  const quizId = metadata.quizId;
  const expectedAnswer = String(condition.value);

  // セッションメタデータからクイズ回答を取得（将来の拡張用）
  // TODO: セッションにクイズ回答を保存する仕組みを追加

  return false; // 未実装
}

/**
 * カスタム条件の評価
 * メタデータに基づく柔軟な条件評価
 */
function evaluateCustomCondition(
  session: any,
  condition: BranchingCondition
): boolean {
  const metadata = condition.metadata || {};
  const field = metadata.field;
  const sessionValue = (session as any)[field];

  switch (condition.operator) {
    case "eq":
      return sessionValue === condition.value;
    case "ne":
      return sessionValue !== condition.value;
    case "gte":
      return sessionValue >= condition.value;
    case "lte":
      return sessionValue <= condition.value;
    case "contains":
      return String(sessionValue).includes(String(condition.value));
    default:
      return false;
  }
}

/**
 * 分岐アクションを実行
 */
export async function executeBranchingAction(
  sessionId: string,
  contactId: string | null,
  action: BranchingAction
): Promise<void> {
  switch (action.type) {
    case "redirect":
      // リダイレクトURL（クライアント側で処理）
      break;

    case "show_offer":
      // 特定のオファーを表示（クライアント側で処理）
      break;

    case "send_email":
      // メール送信
      if (contactId && action.config.emailTemplateId) {
        // TODO: メール送信ロジック
      }
      break;

    case "add_tag":
      // タグ追加
      if (contactId && action.config.tagId) {
        await prisma.contactTag.create({
          data: {
            contactId,
            tagId: action.config.tagId,
          },
        });
      }
      break;

    case "webhook":
      // Webhook送信
      if (action.config.webhookUrl) {
        await fetch(action.config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            contactId,
            action: "branching_executed",
            timestamp: new Date().toISOString(),
          }),
        });
      }
      break;

    default:
      console.warn("Unknown branching action type:", action.type);
  }
}

/**
 * セッション分析ヘルパー
 * セッションの視聴パターンを分析
 */
export function analyzeSessionBehavior(session: any) {
  const watchedSeconds = session.maxWatchedSeconds;
  const totalDuration = session.webinar.videoDuration;
  const completionPercent = session.completionPercent;
  const offersClicked = (session.offersClicked as string[] | null) || [];

  return {
    // 視聴率
    watchPercentage: (watchedSeconds / totalDuration) * 100,
    completionPercent,

    // エンゲージメント
    isHighlyEngaged: completionPercent >= 80,
    isModeratelyEngaged: completionPercent >= 50 && completionPercent < 80,
    isLowEngaged: completionPercent < 50,

    // オファー反応
    clickedAnyOffer: offersClicked.length > 0,
    clickedMultipleOffers: offersClicked.length > 1,
    offersClickedCount: offersClicked.length,

    // セグメント分類
    segment: classifyViewerSegment(completionPercent, offersClicked.length),
  };
}

/**
 * 視聴者セグメントの分類
 */
function classifyViewerSegment(
  completionPercent: number,
  offersClicked: number
): "hot" | "warm" | "cold" | "bounced" {
  if (completionPercent >= 80 && offersClicked > 0) {
    return "hot"; // 高い関心、購入見込み高
  } else if (completionPercent >= 50 || offersClicked > 0) {
    return "warm"; // 中程度の関心
  } else if (completionPercent >= 20) {
    return "cold"; // 低い関心
  } else {
    return "bounced"; // 離脱
  }
}
