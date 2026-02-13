// src/lib/whatsapp/twilio-whatsapp-client.ts
// Twilio WhatsApp Business API クライアント - Stub Implementation

import type { WhatsAppStatus } from "@prisma/client";

interface WhatsAppMessage {
  to: string;
  body?: string;
  mediaUrl?: string;
  templateId?: string;
  templateParams?: Record<string, string>;
  contactId?: string;
  stepMailId?: string;
  campaignId?: string;
}

interface WhatsAppResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  status?: WhatsAppStatus;
}

/**
 * 電話番号をWhatsApp形式に変換
 */
export function formatToWhatsApp(phoneNumber: string): string {
  if (phoneNumber.startsWith("whatsapp:")) {
    return phoneNumber;
  }

  let normalized = phoneNumber.replace(/[\s\-\(\)]/g, "");

  if (normalized.startsWith("0")) {
    normalized = "+81" + normalized.slice(1);
  }

  if (!normalized.startsWith("+")) {
    normalized = "+" + normalized;
  }

  return `whatsapp:${normalized}`;
}

/**
 * WhatsApp番号からE.164形式を抽出
 */
export function extractPhoneNumber(whatsappNumber: string): string {
  return whatsappNumber.replace(/^whatsapp:/, "");
}

/**
 * テナントのWhatsApp設定を取得
 */
export async function getWhatsAppSettings(tenantId: string) {
  return null;
}

/**
 * 送信時間帯内かチェック（JST）
 */
export function isWithinSendingHours(
  sendingHoursStart: number,
  sendingHoursEnd: number
): boolean {
  const jstNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
  );
  const hour = jstNow.getHours();
  return hour >= sendingHoursStart && hour < sendingHoursEnd;
}

/**
 * WhatsAppメッセージを送信
 */
export async function sendWhatsAppMessage(
  tenantId: string,
  message: WhatsAppMessage
): Promise<WhatsAppResult> {
  return {
    success: false,
    error: "WhatsApp delivery not implemented",
  };
}

/**
 * WhatsAppステータスを更新（Webhook用）
 */
export async function updateWhatsAppStatus(
  messageSid: string,
  status: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  // Not implemented
}

/**
 * オプトアウト処理
 */
export async function processWhatsAppOptout(
  tenantId: string,
  phoneNumber: string
): Promise<void> {
  // Not implemented
}

/**
 * 一括WhatsApp送信
 */
export async function sendBulkWhatsApp(
  tenantId: string,
  messages: WhatsAppMessage[]
): Promise<WhatsAppResult[]> {
  return messages.map(() => ({
    success: false,
    error: "WhatsApp delivery not implemented",
  }));
}

/**
 * WhatsAppテンプレートメッセージを送信（要Meta承認）
 */
export async function sendWhatsAppTemplate(
  tenantId: string,
  to: string,
  templateId: string,
  params: Record<string, string>,
  options?: {
    contactId?: string;
    stepMailId?: string;
    campaignId?: string;
  }
): Promise<WhatsAppResult> {
  return {
    success: false,
    error: "WhatsApp template delivery not implemented",
  };
}
