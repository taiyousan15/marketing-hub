// src/lib/whatsapp/twilio-whatsapp-client.ts
// Twilio WhatsApp Business API クライアント

import twilio from "twilio";
import { prisma } from "@/lib/db/prisma";
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
 * 例: +818012345678 -> whatsapp:+818012345678
 */
export function formatToWhatsApp(phoneNumber: string): string {
  // 既にwhatsapp:形式の場合はそのまま
  if (phoneNumber.startsWith("whatsapp:")) {
    return phoneNumber;
  }

  // E.164形式に正規化
  let normalized = phoneNumber.replace(/[\s\-\(\)]/g, "");

  // 日本の番号を国際形式に
  if (normalized.startsWith("0")) {
    normalized = "+81" + normalized.slice(1);
  }

  // +がない場合は追加
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
  return prisma.whatsAppSettings.findUnique({
    where: { tenantId },
  });
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
  // 設定を取得
  const settings = await getWhatsAppSettings(tenantId);

  if (!settings?.enabled) {
    return {
      success: false,
      error: "WhatsApp配信が有効化されていません",
    };
  }

  if (!settings.accountSid || !settings.authToken) {
    return {
      success: false,
      error: "Twilio認証情報が設定されていません",
    };
  }

  if (!settings.whatsappNumber) {
    return {
      success: false,
      error: "WhatsApp送信元番号が設定されていません",
    };
  }

  // 送信時間帯チェック
  if (
    !isWithinSendingHours(settings.sendingHoursStart, settings.sendingHoursEnd)
  ) {
    return {
      success: false,
      error: `送信時間帯外です（${settings.sendingHoursStart}:00-${settings.sendingHoursEnd}:00 JST）`,
    };
  }

  // ログを作成（QUEUED状態）
  const log = await prisma.whatsAppLog.create({
    data: {
      tenantId,
      contactId: message.contactId,
      toNumber: formatToWhatsApp(message.to),
      fromNumber: settings.whatsappNumber,
      body: message.body,
      templateId: message.templateId,
      templateParams: message.templateParams,
      mediaUrl: message.mediaUrl,
      status: "QUEUED",
      stepMailId: message.stepMailId,
      campaignId: message.campaignId,
    },
  });

  try {
    // Twilioクライアント作成
    const client = twilio(settings.accountSid, settings.authToken);

    // メッセージ送信
    const twilioMessage = await client.messages.create({
      from: settings.whatsappNumber,
      to: formatToWhatsApp(message.to),
      body: message.body,
      mediaUrl: message.mediaUrl ? [message.mediaUrl] : undefined,
    });

    // ログを更新
    await prisma.whatsAppLog.update({
      where: { id: log.id },
      data: {
        messageSid: twilioMessage.sid,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      messageSid: twilioMessage.sid,
      status: "SENT",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // ログを更新（失敗）
    await prisma.whatsAppLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        errorMessage,
        failedAt: new Date(),
      },
    });

    return {
      success: false,
      error: errorMessage,
      status: "FAILED",
    };
  }
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
  const statusMap: Record<string, WhatsAppStatus> = {
    queued: "QUEUED",
    sending: "SENDING",
    sent: "SENT",
    delivered: "DELIVERED",
    read: "READ",
    failed: "FAILED",
    undelivered: "UNDELIVERED",
  };

  const prismaStatus = statusMap[status.toLowerCase()] || "SENT";

  const updateData: Record<string, unknown> = {
    status: prismaStatus,
  };

  if (prismaStatus === "DELIVERED") {
    updateData.deliveredAt = new Date();
  } else if (prismaStatus === "READ") {
    updateData.readAt = new Date();
  } else if (prismaStatus === "FAILED" || prismaStatus === "UNDELIVERED") {
    updateData.failedAt = new Date();
    if (errorCode) updateData.errorCode = errorCode;
    if (errorMessage) updateData.errorMessage = errorMessage;
  }

  await prisma.whatsAppLog.update({
    where: { messageSid },
    data: updateData,
  });
}

/**
 * オプトアウト処理
 */
export async function processWhatsAppOptout(
  tenantId: string,
  phoneNumber: string
): Promise<void> {
  const phone = extractPhoneNumber(phoneNumber);

  await prisma.contact.updateMany({
    where: {
      tenantId,
      OR: [{ phone }, { whatsappNumber: phoneNumber }],
    },
    data: {
      whatsappOptIn: false,
      whatsappOptOutAt: new Date(),
    },
  });
}

/**
 * 一括WhatsApp送信
 */
export async function sendBulkWhatsApp(
  tenantId: string,
  messages: WhatsAppMessage[]
): Promise<WhatsAppResult[]> {
  const results: WhatsAppResult[] = [];

  for (const message of messages) {
    const result = await sendWhatsAppMessage(tenantId, message);
    results.push(result);

    // レート制限対策（60 msg/min = 1 msg/sec）
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
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
  // テンプレートメッセージはTwilio Content API経由で送信
  // 実装は将来のMeta Cloud API統合時に拡張
  return sendWhatsAppMessage(tenantId, {
    to,
    templateId,
    templateParams: params,
    ...options,
  });
}
