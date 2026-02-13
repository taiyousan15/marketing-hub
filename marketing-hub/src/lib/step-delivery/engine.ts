// src/lib/step-delivery/engine.ts
// 統合ステップ配信エンジン - Stub Implementation

type DeliveryChannel = "EMAIL" | "SMS" | "LINE" | "WHATSAPP";

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
  return { canDeliver: false, reason: "Not implemented" };
}

/**
 * 配信
 */
export async function deliver(payload: DeliveryPayload): Promise<DeliveryResult> {
  return {
    success: false,
    channel: payload.channel,
    error: "Delivery not implemented",
    timestamp: new Date(),
  };
}

/**
 * 複数チャンネルで配信
 */
export async function deliverMultiChannel(
  payload: Omit<DeliveryPayload, "channel"> & { channels: DeliveryChannel[] }
): Promise<DeliveryResult[]> {
  return payload.channels.map((channel) => ({
    success: false,
    channel,
    error: "Delivery not implemented",
    timestamp: new Date(),
  }));
}
