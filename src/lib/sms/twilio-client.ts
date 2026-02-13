// src/lib/sms/twilio-client.ts
// Twilio SMS送信クライアント - Simplified stub

import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

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
  status?: string;
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

// 日本のキャリアでブロックされるURLパターン
const URL_PATTERN = /https?:\/\/[^\s]+/gi;

// オプトアウトキーワード（日本語対応）
const OPTOUT_KEYWORDS = [
  'stop', 'unsubscribe', 'cancel', 'quit', 'end', 'optout',
  '停止', '解除', '配信停止', 'ストップ'
];

/**
 * 電話番号をE.164形式に変換
 */
export function formatToE164(phone: string, defaultCountry: CountryCode = 'JP'): string | null {
  try {
    if (phone.startsWith('+')) {
      if (isValidPhoneNumber(phone)) {
        const parsed = parsePhoneNumber(phone);
        return parsed?.format('E.164') || null;
      }
      return null;
    }

    if (isValidPhoneNumber(phone, defaultCountry)) {
      const parsed = parsePhoneNumber(phone, defaultCountry);
      return parsed?.format('E.164') || null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 電話番号バリデーション
 */
export function validatePhoneNumber(phone: string, country: CountryCode = 'JP'): {
  valid: boolean;
  formatted?: string;
  error?: string;
} {
  try {
    const formatted = formatToE164(phone, country);
    if (!formatted) {
      return { valid: false, error: '無効な電話番号形式です' };
    }

    if (country === 'JP' && formatted.startsWith('+81')) {
      const localNumber = formatted.slice(3);
      if (!['70', '80', '90'].some(prefix => localNumber.startsWith(prefix))) {
        return { valid: false, error: '日本の携帯電話番号を入力してください（070, 080, 090）' };
      }
    }

    return { valid: true, formatted };
  } catch {
    return { valid: false, error: '電話番号の検証に失敗しました' };
  }
}

/**
 * 日本向けSMS最適化（URL除去）
 */
export function optimizeForJapan(body: string, removeUrls: boolean = true): string {
  if (!removeUrls) return body;
  const optimized = body.replace(URL_PATTERN, '[リンクは別途お送りします]');
  return optimized;
}

/**
 * 送信可能時間帯チェック（JST）
 */
export function isWithinSendingHours(
  startHour: number = 9,
  endHour: number = 20,
  timezone: string = 'Asia/Tokyo'
): boolean {
  const now = new Date();
  const jstTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  const hour = jstTime.getHours();
  return hour >= startHour && hour < endHour;
}

/**
 * メッセージセグメント数を計算
 */
export function calculateSegments(body: string): number {
  const hasUnicode = /[^\x00-\x7F]/.test(body);
  const charsPerSegment = hasUnicode ? 70 : 160;
  return Math.ceil(body.length / charsPerSegment);
}

/**
 * オプトアウトキーワードチェック
 */
export function isOptoutMessage(message: string): boolean {
  const normalized = message.toLowerCase().trim();
  return OPTOUT_KEYWORDS.some(keyword => normalized === keyword);
}

/**
 * テナントのSMS設定を取得
 */
export async function getSMSSettings(tenantId: string): Promise<SMSSettings | null> {
  return null;
}

/**
 * Twilioクライアント作成
 */
export function createTwilioClient(accountSid: string, authToken: string) {
  return null;
}

/**
 * SMS送信
 */
export async function sendSMS(options: SMSSendOptions): Promise<SMSSendResult> {
  return { success: false, error: 'SMS service not implemented' };
}

/**
 * オプトアウト処理
 */
export async function processOptout(
  tenantId: string,
  phone: string
): Promise<boolean> {
  return false;
}

/**
 * SMS配信状況を更新（Webhook用）
 */
export async function updateSMSStatus(
  messageSid: string,
  status: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  return;
}

/**
 * 一括SMS送信（キャンペーン用）
 */
export async function sendBulkSMS(
  tenantId: string,
  recipients: Array<{ contactId: string; phone: string }>,
  body: string,
  campaignId?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  return { sent: 0, failed: 0, errors: [] };
}
