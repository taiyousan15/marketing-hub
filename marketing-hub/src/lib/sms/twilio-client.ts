// src/lib/sms/twilio-client.ts
// Twilio SMS送信クライアント - Stub Implementation

type SMSStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED";

// 型定義
export interface SMSSendOptions {
  to: string;
  body: string;
  tenantId: string;
  contactId?: string;
  stepMailId?: string;
  campaignId?: string;
  scheduleAt?: Date;
}

export interface SMSSendResult {
  success: boolean;
  messageSid?: string;
  status?: SMSStatus;
  error?: string;
  segments?: number;
}

export interface SMSSettings {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  messagingServiceSid?: string;
  enabled: boolean;
  sendingHoursStart: number;
  sendingHoursEnd: number;
  removeUrls: boolean;
  maxPerMinute: number;
  maxPerDay: number;
}

/**
 * SMS送信
 */
export async function sendSMS(options: SMSSendOptions): Promise<SMSSendResult> {
  return {
    success: false,
    error: "SMS service not implemented",
  };
}

/**
 * 複数宛先へのSMS送信
 */
export async function sendBulkSMS(
  options: Omit<SMSSendOptions, "to"> & { to: string[] }
): Promise<SMSSendResult[]> {
  return options.to.map(() => ({
    success: false,
    error: "SMS service not implemented",
  }));
}

/**
 * SMS設定を取得
 */
export async function getSMSSettings(tenantId: string): Promise<SMSSettings | null> {
  return null;
}

/**
 * SMS送信履歴を取得
 */
export async function getSMSHistory(
  tenantId: string,
  limit?: number
): Promise<unknown[]> {
  return [];
}

/**
 * SMS送信ステータスを更新
 */
export async function updateSMSStatus(
  messageSid: string,
  status: SMSStatus
): Promise<void> {
  // Stub
}
