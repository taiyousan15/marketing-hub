/**
 * LINEステップ配信エンジン
 *
 * Stub implementation - LINE step delivery not fully implemented
 */

// ステップタイプ
type StepType = "MESSAGE" | "WAIT" | "CONDITION" | "ACTION";

// メッセージ内容の型
interface MessageContent {
  type: "text" | "flex";
  text?: string;
  altText?: string;
  contents?: unknown;
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
  // Stub
}

/**
 * キャンペーン参加者を追加
 */
export async function addCampaignContact(
  campaignId: string,
  lineUserId: string,
  contactId?: string
): Promise<void> {
  // Stub
}

/**
 * 参加者をキャンペーンから削除
 */
export async function removeCampaignContact(
  campaignId: string,
  lineUserId: string
): Promise<void> {
  // Stub
}

/**
 * 次のステップへ進める
 */
export async function moveToNextStep(
  campaignContactId: string
): Promise<void> {
  // Stub
}
