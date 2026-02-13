// src/lib/step-delivery/engine.ts
// ステップメール配信エンジン - Simplified stub

export type DeliveryChannel = 'EMAIL' | 'SMS' | 'LINE';

export interface DeliveryPayload {
  channel: DeliveryChannel;
  contactId: string;
  tenantId: string;
  stepId: string;
  campaignId?: string;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  smsBody?: string;
  lineMessage?: string;
  whatsappMessage?: string;
  whatsappMediaUrl?: string;
}

export interface DeliveryResult {
  success: boolean;
  channel: DeliveryChannel;
  messageId?: string;
  timestamp: Date;
  error?: string;
}

/**
 * メッセージ配信
 */
export async function deliverMessage(payload: DeliveryPayload): Promise<DeliveryResult> {
  return {
    success: false,
    channel: payload.channel,
    timestamp: new Date(),
    error: 'Not implemented',
  };
}

/**
 * 配信可能かチェック
 */
export async function canDeliverTo(contactId: string, channel: DeliveryChannel): Promise<boolean> {
  return false;
}

/**
 * 最適なチャンネルを選択
 */
export async function selectOptimalChannel(contactId: string): Promise<DeliveryChannel> {
  return 'EMAIL';
}

/**
 * ステップメール配信
 */
export async function deliverStepMail(
  campaignId: string,
  contactId: string,
  stepId: string
): Promise<DeliveryResult> {
  return {
    success: false,
    channel: 'EMAIL',
    timestamp: new Date(),
    error: 'Not implemented',
  };
}

/**
 * ステップ配信実行
 */
export async function executeStepDelivery(
  campaignId: string,
  contactId: string,
  stepId: string
): Promise<DeliveryResult> {
  return {
    success: false,
    channel: 'EMAIL',
    timestamp: new Date(),
    error: 'Not implemented',
  };
}

/**
 * フォールバック付き配信
 */
export async function deliverWithFallback(payload: DeliveryPayload): Promise<DeliveryResult> {
  return {
    success: false,
    channel: payload.channel,
    timestamp: new Date(),
    error: 'Not implemented',
  };
}

/**
 * 保留中の配信を処理
 */
export async function processPendingDeliveries() {
  return { processed: 0, succeeded: 0, failed: 0 };
}

/**
 * 配信スケジュールをセット
 */
export async function scheduleDelivery(
  contactId: string,
  stepId: string,
  scheduledAt: Date
): Promise<boolean> {
  return false;
}
