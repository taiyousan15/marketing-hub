/**
 * LINEステップ配信エンジン - Simplified stub
 *
 * キャンペーンのステップを自動実行する
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
  return {
    success: 0,
    failed: 0,
    skipped: 0,
  };
}

/**
 * コンタクトをキャンペーンに登録
 */
export async function enrollContactToCampaign(
  campaignId: string,
  contactId: string
): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "Not implemented" };
}

/**
 * 一斉配信を実行
 */
export async function executeBroadcast(
  campaignId: string
): Promise<{ success: boolean; sent: number; error?: string }> {
  return { success: false, sent: 0, error: "Not implemented" };
}
