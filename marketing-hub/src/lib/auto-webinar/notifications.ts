/**
 * オートウェビナー通知システム
 *
 * Stub implementation - notifications not fully implemented
 */

type WebinarNotificationType = "START_REMINDER" | "LIVE_REMINDER" | "SESSION_START" | "SESSION_END" | "FOLLOW_UP";
type NotificationChannel = "EMAIL" | "LINE" | "SMS";
type NotificationStatus = "PENDING" | "SENT" | "OPENED" | "CLICKED" | "FAILED";

/**
 * ウェビナー開始前のリマインダーを送信
 */
export async function sendStartReminder(webinarId: string, hoursBeforeStart: number): Promise<void> {
  // Not implemented
}

/**
 * ライブ配信開始の通知を送信
 */
export async function sendLiveReminder(webinarId: string): Promise<void> {
  // Not implemented
}

/**
 * セッション終了後のフォローアップを送信
 */
export async function sendFollowUp(webinarId: string, contactId: string, delayMinutes?: number): Promise<void> {
  // Not implemented
}

/**
 * メール送信
 */
export async function sendEmailNotification(
  contactId: string,
  subject: string,
  htmlContent: string
): Promise<boolean> {
  return false;
}

/**
 * LINE通知
 */
export async function sendLineNotification(
  lineUserId: string,
  message: string,
  flexMessage?: unknown
): Promise<boolean> {
  return false;
}
