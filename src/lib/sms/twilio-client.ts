// src/lib/sms/twilio-client.ts
// Twilio SMS送信クライアント（世界トップクラスD+アーキテクチャ）

import twilio from 'twilio';
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';
import { prisma } from '@/lib/db/prisma';
import type { SMSStatus } from '@prisma/client';

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
    // 既にE.164形式の場合
    if (phone.startsWith('+')) {
      if (isValidPhoneNumber(phone)) {
        const parsed = parsePhoneNumber(phone);
        return parsed?.format('E.164') || null;
      }
      return null;
    }

    // 日本の国内形式（090-xxxx-xxxx等）
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

    // 日本の携帯番号チェック（070, 080, 090）
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

  // URLを除去（日本のキャリアはURLをブロック）
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
  // Unicode（日本語含む）: 70文字/セグメント
  // ASCII: 160文字/セグメント
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
  const settings = await prisma.sMSSettings.findUnique({
    where: { tenantId }
  });

  if (!settings || !settings.enabled) {
    return null;
  }

  return {
    accountSid: settings.accountSid || process.env.TWILIO_ACCOUNT_SID || '',
    authToken: settings.authToken || process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: settings.fromNumber || process.env.TWILIO_PHONE_NUMBER || '',
    messagingServiceSid: settings.messagingServiceSid || undefined,
    enabled: settings.enabled,
    sendingHoursStart: settings.sendingHoursStart,
    sendingHoursEnd: settings.sendingHoursEnd,
    removeUrls: settings.removeUrls,
    maxPerMinute: settings.maxPerMinute,
    maxPerDay: settings.maxPerDay,
  };
}

/**
 * Twilioクライアント作成
 */
export function createTwilioClient(accountSid: string, authToken: string) {
  return twilio(accountSid, authToken);
}

/**
 * SMS送信
 */
export async function sendSMS(options: SMSSendOptions): Promise<SMSSendResult> {
  const { to, body, tenantId, contactId, stepMailId, campaignId, scheduleAt } = options;

  try {
    // 設定取得
    const settings = await getSMSSettings(tenantId);
    if (!settings) {
      return { success: false, error: 'SMS設定が無効または未設定です' };
    }

    // 電話番号バリデーション
    const validation = validatePhoneNumber(to);
    if (!validation.valid || !validation.formatted) {
      return { success: false, error: validation.error };
    }
    const formattedTo = validation.formatted;

    // コンタクトのオプトアウトチェック
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { smsOptIn: true }
      });
      if (contact && !contact.smsOptIn) {
        return { success: false, error: 'コンタクトはSMS配信を停止しています' };
      }
    }

    // 送信時間帯チェック（スケジュール配信でない場合）
    if (!scheduleAt && !isWithinSendingHours(settings.sendingHoursStart, settings.sendingHoursEnd)) {
      return { success: false, error: `送信可能時間帯外です（${settings.sendingHoursStart}:00-${settings.sendingHoursEnd}:00 JST）` };
    }

    // 日本向け最適化
    const optimizedBody = formattedTo.startsWith('+81')
      ? optimizeForJapan(body, settings.removeUrls)
      : body;

    // セグメント数計算
    const segments = calculateSegments(optimizedBody);

    // Twilioクライアント作成
    const client = createTwilioClient(settings.accountSid, settings.authToken);

    // 送信オプション
    const messageOptions: {
      body: string;
      to: string;
      from?: string;
      messagingServiceSid?: string;
      scheduleType?: 'fixed';
      sendAt?: Date;
    } = {
      body: optimizedBody,
      to: formattedTo,
    };

    // MessagingServiceSIDがある場合は使用（スケジュール配信に必要）
    if (settings.messagingServiceSid) {
      messageOptions.messagingServiceSid = settings.messagingServiceSid;
    } else {
      messageOptions.from = settings.fromNumber;
    }

    // スケジュール配信
    if (scheduleAt && settings.messagingServiceSid) {
      const now = new Date();
      const minScheduleTime = new Date(now.getTime() + 15 * 60 * 1000); // 15分後
      const maxScheduleTime = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000); // 35日後

      if (scheduleAt < minScheduleTime || scheduleAt > maxScheduleTime) {
        return { success: false, error: 'スケジュール時刻は15分後〜35日後の範囲で指定してください' };
      }

      messageOptions.scheduleType = 'fixed';
      messageOptions.sendAt = scheduleAt;
    }

    // SMS送信
    const message = await client.messages.create(messageOptions);

    // ログ記録
    await prisma.sMSLog.create({
      data: {
        tenantId,
        contactId,
        messageSid: message.sid,
        toNumber: formattedTo,
        fromNumber: settings.fromNumber,
        body: optimizedBody,
        segments,
        status: scheduleAt ? 'QUEUED' : 'SENDING',
        stepMailId,
        campaignId,
        queuedAt: new Date(),
      }
    });

    return {
      success: true,
      messageSid: message.sid,
      status: scheduleAt ? 'QUEUED' : 'SENDING',
      segments,
    };
  } catch (error) {
    console.error('SMS send error:', error);

    // エラーログ記録
    const validation = validatePhoneNumber(to);
    await prisma.sMSLog.create({
      data: {
        tenantId,
        contactId,
        toNumber: validation.formatted || to,
        body,
        segments: calculateSegments(body),
        status: 'FAILED',
        errorCode: error instanceof Error ? error.name : 'UNKNOWN',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        failedAt: new Date(),
      }
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS送信に失敗しました',
    };
  }
}

/**
 * オプトアウト処理
 */
export async function processOptout(
  tenantId: string,
  phone: string
): Promise<boolean> {
  const formatted = formatToE164(phone);
  if (!formatted) return false;

  const contact = await prisma.contact.findFirst({
    where: { tenantId, phone: formatted }
  });

  if (contact) {
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        smsOptIn: false,
        smsOptOutAt: new Date(),
      }
    });
    return true;
  }

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
  const statusMap: Record<string, SMSStatus> = {
    'queued': 'QUEUED',
    'sending': 'SENDING',
    'sent': 'SENT',
    'delivered': 'DELIVERED',
    'failed': 'FAILED',
    'undelivered': 'UNDELIVERED',
  };

  const prismaStatus = statusMap[status.toLowerCase()] || 'FAILED';

  await prisma.sMSLog.update({
    where: { messageSid },
    data: {
      status: prismaStatus,
      ...(prismaStatus === 'SENT' && { sentAt: new Date() }),
      ...(prismaStatus === 'DELIVERED' && { deliveredAt: new Date() }),
      ...(prismaStatus === 'FAILED' && {
        failedAt: new Date(),
        errorCode,
        errorMessage,
      }),
    }
  });
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
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const recipient of recipients) {
    const result = await sendSMS({
      to: recipient.phone,
      body,
      tenantId,
      contactId: recipient.contactId,
      campaignId,
    });

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${recipient.phone}: ${result.error}`);
    }

    // レート制限対策（1秒間隔）
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}
