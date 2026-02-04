// src/lib/step-delivery/engine.ts
// 統合ステップ配信エンジン（D+ アーキテクチャ）
// EMAIL, SMS, LINE, WHATSAPP を統合してインテリジェントに配信

import { prisma } from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/resend-client';
import { sendSMS } from '@/lib/sms';
import { pushTextMessage } from '@/lib/line/client';
import { sendWhatsAppMessage } from '@/lib/whatsapp/twilio-whatsapp-client';
import type { DeliveryChannel } from '@prisma/client';

export interface DeliveryPayload {
  channel: DeliveryChannel;
  contactId: string;
  tenantId: string;
  stepId?: string;
  campaignId?: string;
  // Email
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  // SMS
  smsBody?: string;
  // LINE
  lineMessage?: string;
  // WhatsApp
  whatsappMessage?: string;
  whatsappMediaUrl?: string;
}

export interface DeliveryResult {
  success: boolean;
  channel: DeliveryChannel;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

/**
 * コンタクトが指定チャンネルで配信可能かチェック
 */
export async function canDeliverTo(
  contactId: string,
  channel: DeliveryChannel
): Promise<{ canDeliver: boolean; reason?: string }> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      email: true,
      phone: true,
      lineUserId: true,
      whatsappNumber: true,
      emailOptIn: true,
      smsOptIn: true,
      lineOptIn: true,
      whatsappOptIn: true,
    },
  });

  if (!contact) {
    return { canDeliver: false, reason: 'コンタクトが見つかりません' };
  }

  switch (channel) {
    case 'EMAIL':
      if (!contact.email) {
        return { canDeliver: false, reason: 'メールアドレスが未登録です' };
      }
      if (!contact.emailOptIn) {
        return { canDeliver: false, reason: 'メール配信が停止されています' };
      }
      return { canDeliver: true };

    case 'SMS':
      if (!contact.phone) {
        return { canDeliver: false, reason: '電話番号が未登録です' };
      }
      if (!contact.smsOptIn) {
        return { canDeliver: false, reason: 'SMS配信が停止されています' };
      }
      return { canDeliver: true };

    case 'LINE':
      if (!contact.lineUserId) {
        return { canDeliver: false, reason: 'LINE連携されていません' };
      }
      if (!contact.lineOptIn) {
        return { canDeliver: false, reason: 'LINE配信が停止されています' };
      }
      return { canDeliver: true };

    case 'WHATSAPP':
      // WhatsAppは携帯番号またはwhatsappNumberを使用
      const whatsappNumber = contact.whatsappNumber || contact.phone;
      if (!whatsappNumber) {
        return { canDeliver: false, reason: 'WhatsApp番号が未登録です' };
      }
      if (!contact.whatsappOptIn) {
        return { canDeliver: false, reason: 'WhatsApp配信が停止されています' };
      }
      return { canDeliver: true };

    default:
      return { canDeliver: false, reason: '不明な配信チャンネルです' };
  }
}

/**
 * 最適なチャンネルを自動選択（フォールバック対応）
 */
export async function selectOptimalChannel(
  contactId: string,
  preferredChannel: DeliveryChannel
): Promise<DeliveryChannel | null> {
  // 優先順位: 指定チャンネル → LINE → WHATSAPP → SMS → EMAIL
  const channels: DeliveryChannel[] = [preferredChannel, 'LINE', 'WHATSAPP', 'SMS', 'EMAIL'];
  const uniqueChannels = [...new Set(channels)];

  for (const channel of uniqueChannels) {
    const { canDeliver } = await canDeliverTo(contactId, channel);
    if (canDeliver) {
      return channel;
    }
  }

  return null;
}

/**
 * メッセージ配信（単一チャンネル）
 */
export async function deliverMessage(
  payload: DeliveryPayload
): Promise<DeliveryResult> {
  const { channel, contactId, tenantId, stepId, campaignId } = payload;
  const timestamp = new Date();

  try {
    // 配信可能性チェック
    const { canDeliver, reason } = await canDeliverTo(contactId, channel);
    if (!canDeliver) {
      return {
        success: false,
        channel,
        error: reason,
        timestamp,
      };
    }

    // コンタクト情報取得
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { email: true, phone: true, lineUserId: true, whatsappNumber: true, name: true },
    });

    if (!contact) {
      return {
        success: false,
        channel,
        error: 'コンタクトが見つかりません',
        timestamp,
      };
    }

    switch (channel) {
      case 'EMAIL':
        if (!contact.email || !payload.subject || !payload.htmlContent) {
          return {
            success: false,
            channel,
            error: 'メール送信に必要な情報が不足しています',
            timestamp,
          };
        }
        const emailResult = await sendEmail({
          to: contact.email,
          subject: payload.subject,
          html: payload.htmlContent,
          text: payload.textContent,
        });
        return {
          success: true,
          channel,
          messageId: emailResult?.id,
          timestamp,
        };

      case 'SMS':
        if (!contact.phone || !payload.smsBody) {
          return {
            success: false,
            channel,
            error: 'SMS送信に必要な情報が不足しています',
            timestamp,
          };
        }
        const smsResult = await sendSMS({
          to: contact.phone,
          body: payload.smsBody,
          tenantId,
          contactId,
          stepMailId: stepId,
          campaignId,
        });
        return {
          success: smsResult.success,
          channel,
          messageId: smsResult.messageSid,
          error: smsResult.error,
          timestamp,
        };

      case 'LINE':
        if (!contact.lineUserId || !payload.lineMessage) {
          return {
            success: false,
            channel,
            error: 'LINE送信に必要な情報が不足しています',
            timestamp,
          };
        }
        await pushTextMessage(contact.lineUserId, payload.lineMessage);
        return {
          success: true,
          channel,
          timestamp,
        };

      case 'WHATSAPP':
        const whatsappNumber = contact.whatsappNumber || contact.phone;
        if (!whatsappNumber || !payload.whatsappMessage) {
          return {
            success: false,
            channel,
            error: 'WhatsApp送信に必要な情報が不足しています',
            timestamp,
          };
        }
        const whatsappResult = await sendWhatsAppMessage(tenantId, {
          to: whatsappNumber,
          body: payload.whatsappMessage,
          mediaUrl: payload.whatsappMediaUrl,
          contactId,
          stepMailId: stepId,
          campaignId,
        });
        return {
          success: whatsappResult.success,
          channel,
          messageId: whatsappResult.messageSid,
          error: whatsappResult.error,
          timestamp,
        };

      default:
        return {
          success: false,
          channel,
          error: '不明な配信チャンネルです',
          timestamp,
        };
    }
  } catch (error) {
    console.error(`Delivery error (${channel}):`, error);
    return {
      success: false,
      channel,
      error: error instanceof Error ? error.message : '配信に失敗しました',
      timestamp,
    };
  }
}

/**
 * ステップ配信実行
 */
export async function executeStepDelivery(
  stepId: string,
  contactId: string
): Promise<DeliveryResult> {
  // ステップ情報取得
  const step = await prisma.campaignStep.findUnique({
    where: { id: stepId },
    include: {
      campaign: {
        select: { tenantId: true },
      },
    },
  });

  if (!step) {
    return {
      success: false,
      channel: 'EMAIL',
      error: 'ステップが見つかりません',
      timestamp: new Date(),
    };
  }

  // コンテンツ準備
  const content = step.content as Record<string, unknown>;
  const payload: DeliveryPayload = {
    channel: step.channel,
    contactId,
    tenantId: step.campaign.tenantId,
    stepId,
    campaignId: step.campaignId,
    subject: step.subject || undefined,
    htmlContent: content.html as string | undefined,
    textContent: content.text as string | undefined,
    smsBody: step.smsBody || (content.sms as string | undefined),
    lineMessage: content.line as string | undefined,
    whatsappMessage: content.whatsapp as string | undefined,
    whatsappMediaUrl: content.whatsappMedia as string | undefined,
  };

  // 配信実行
  const result = await deliverMessage(payload);

  // 配信ログ記録
  await prisma.messageHistory.create({
    data: {
      tenantId: step.campaign.tenantId,
      contactId,
      channel: step.channel,
      direction: 'OUTBOUND',
      status: result.success ? 'SENT' : 'FAILED',
      content: {
        subject: step.subject,
        body: payload.smsBody || payload.htmlContent || payload.lineMessage,
      },
      sentAt: result.success ? result.timestamp : null,
      errorMessage: result.error,
      campaignId: step.campaignId,
      stepId: step.id,
    },
  });

  return result;
}

/**
 * マルチチャンネル配信（フォールバック付き）
 */
export async function deliverWithFallback(
  payload: DeliveryPayload,
  fallbackChannels: DeliveryChannel[] = ['LINE', 'WHATSAPP', 'SMS', 'EMAIL']
): Promise<DeliveryResult> {
  // まず指定チャンネルで試行
  let result = await deliverMessage(payload);
  if (result.success) {
    return result;
  }

  // フォールバック
  for (const channel of fallbackChannels) {
    if (channel === payload.channel) continue;

    const fallbackPayload = { ...payload, channel };
    result = await deliverMessage(fallbackPayload);
    if (result.success) {
      return result;
    }
  }

  return result;
}
