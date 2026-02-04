// src/lib/step-delivery/fallback.ts
// インテリジェントフォールバックシステム

import { prisma } from '@/lib/db/prisma';
import { deliverMessage, canDeliverTo, type DeliveryPayload, type DeliveryResult } from './engine';
import { optimizeDelivery } from './ai-optimizer';
import type { DeliveryChannel } from '@prisma/client';

// フォールバック設定
interface FallbackConfig {
  maxRetries: number;
  retryDelayMs: number;
  fallbackOrder: DeliveryChannel[];
  useAIOptimization: boolean;
  logAllAttempts: boolean;
}

// デフォルト設定
const DEFAULT_CONFIG: FallbackConfig = {
  maxRetries: 2,
  retryDelayMs: 1000,
  fallbackOrder: ['LINE', 'WHATSAPP', 'SMS', 'EMAIL'],
  useAIOptimization: true,
  logAllAttempts: true,
};

// 配信試行ログ
interface DeliveryAttempt {
  channel: DeliveryChannel;
  success: boolean;
  error?: string;
  timestamp: Date;
  retryCount: number;
}

// インテリジェントフォールバック結果
interface IntelligentFallbackResult extends DeliveryResult {
  attempts: DeliveryAttempt[];
  finalChannel: DeliveryChannel;
  totalAttempts: number;
  fallbackUsed: boolean;
}

/**
 * 遅延ユーティリティ
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * リトライ付き配信
 */
async function deliverWithRetry(
  payload: DeliveryPayload,
  maxRetries: number,
  retryDelayMs: number
): Promise<{ result: DeliveryResult; retryCount: number }> {
  let lastResult: DeliveryResult | null = null;
  let retryCount = 0;

  for (let i = 0; i <= maxRetries; i++) {
    const result = await deliverMessage(payload);

    if (result.success) {
      return { result, retryCount: i };
    }

    lastResult = result;
    retryCount = i;

    // 最後の試行でなければ待機
    if (i < maxRetries) {
      await delay(retryDelayMs * (i + 1)); // 指数的バックオフ
    }
  }

  return { result: lastResult!, retryCount };
}

/**
 * インテリジェントフォールバック配信
 */
export async function deliverWithIntelligentFallback(
  payload: DeliveryPayload,
  config: Partial<FallbackConfig> = {}
): Promise<IntelligentFallbackResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const attempts: DeliveryAttempt[] = [];
  let finalChannel = payload.channel;
  let fallbackUsed = false;

  // AI最適化による推奨チャンネル取得（オプション）
  let optimizedOrder = cfg.fallbackOrder;
  if (cfg.useAIOptimization && payload.contactId) {
    try {
      const optimization = await optimizeDelivery(payload.contactId, payload.channel);
      // AI推奨を先頭に、残りを続ける
      optimizedOrder = [
        optimization.recommendedChannel,
        ...cfg.fallbackOrder.filter((c) => c !== optimization.recommendedChannel),
      ];
    } catch (error) {
      console.warn('AI optimization failed, using default order:', error);
    }
  }

  // 元のチャンネルを先頭に追加（重複除去）
  const channelOrder = [
    payload.channel,
    ...optimizedOrder.filter((c) => c !== payload.channel),
  ];

  // 各チャンネルで試行
  for (const channel of channelOrder) {
    // チャンネル利用可能性チェック
    if (payload.contactId) {
      const { canDeliver, reason } = await canDeliverTo(payload.contactId, channel);
      if (!canDeliver) {
        if (cfg.logAllAttempts) {
          attempts.push({
            channel,
            success: false,
            error: reason,
            timestamp: new Date(),
            retryCount: 0,
          });
        }
        continue;
      }
    }

    // チャンネル固有のペイロード調整
    const channelPayload = adjustPayloadForChannel({ ...payload, channel });

    // リトライ付き配信
    const { result, retryCount } = await deliverWithRetry(
      channelPayload,
      cfg.maxRetries,
      cfg.retryDelayMs
    );

    attempts.push({
      channel,
      success: result.success,
      error: result.error,
      timestamp: result.timestamp,
      retryCount,
    });

    if (result.success) {
      finalChannel = channel;
      fallbackUsed = channel !== payload.channel;

      // フォールバック使用時はログ記録
      if (fallbackUsed && cfg.logAllAttempts) {
        await logFallbackUsage(payload, channel, attempts);
      }

      return {
        ...result,
        attempts,
        finalChannel,
        totalAttempts: attempts.length,
        fallbackUsed,
      };
    }
  }

  // 全チャンネル失敗
  const lastAttempt = attempts[attempts.length - 1];
  return {
    success: false,
    channel: payload.channel,
    error: 'すべてのチャンネルで配信に失敗しました',
    timestamp: new Date(),
    attempts,
    finalChannel: lastAttempt?.channel || payload.channel,
    totalAttempts: attempts.length,
    fallbackUsed: true,
  };
}

/**
 * チャンネル固有のペイロード調整
 */
function adjustPayloadForChannel(payload: DeliveryPayload): DeliveryPayload {
  switch (payload.channel) {
    case 'SMS':
      // SMSは短いテキストのみ
      if (!payload.smsBody && payload.textContent) {
        payload.smsBody = payload.textContent.slice(0, 140); // 2セグメント以内
      }
      break;

    case 'LINE':
      // LINEはテキストメッセージ
      if (!payload.lineMessage && payload.textContent) {
        payload.lineMessage = payload.textContent;
      } else if (!payload.lineMessage && payload.smsBody) {
        payload.lineMessage = payload.smsBody;
      }
      break;

    case 'WHATSAPP':
      // WhatsAppはテキストメッセージ
      if (!payload.whatsappMessage && payload.textContent) {
        payload.whatsappMessage = payload.textContent;
      } else if (!payload.whatsappMessage && payload.lineMessage) {
        payload.whatsappMessage = payload.lineMessage;
      } else if (!payload.whatsappMessage && payload.smsBody) {
        payload.whatsappMessage = payload.smsBody;
      }
      break;

    case 'EMAIL':
      // Emailはそのまま
      break;
  }

  return payload;
}

/**
 * フォールバック使用ログを記録
 */
async function logFallbackUsage(
  originalPayload: DeliveryPayload,
  successChannel: DeliveryChannel,
  attempts: DeliveryAttempt[]
): Promise<void> {
  try {
    // 監査ログに記録（AuditLogがある場合）
    console.log('Fallback used:', {
      originalChannel: originalPayload.channel,
      successChannel,
      contactId: originalPayload.contactId,
      attempts: attempts.map((a) => ({
        channel: a.channel,
        success: a.success,
        error: a.error,
      })),
    });
  } catch (error) {
    console.error('Failed to log fallback usage:', error);
  }
}

/**
 * 優先度ベースの配信（シンプル版）
 */
export async function deliverByPriority(
  payload: DeliveryPayload,
  priorityOrder: DeliveryChannel[] = ['LINE', 'SMS', 'EMAIL']
): Promise<IntelligentFallbackResult> {
  return deliverWithIntelligentFallback(payload, {
    fallbackOrder: priorityOrder,
    useAIOptimization: false,
  });
}

/**
 * AI最適化配信（推奨）
 */
export async function deliverWithAIOptimization(
  payload: DeliveryPayload
): Promise<IntelligentFallbackResult> {
  return deliverWithIntelligentFallback(payload, {
    useAIOptimization: true,
    maxRetries: 2,
  });
}

/**
 * バッチ配信（フォールバック付き）
 */
export async function batchDeliverWithFallback(
  payloads: DeliveryPayload[],
  config: Partial<FallbackConfig> = {}
): Promise<IntelligentFallbackResult[]> {
  const results: IntelligentFallbackResult[] = [];

  for (const payload of payloads) {
    const result = await deliverWithIntelligentFallback(payload, config);
    results.push(result);

    // レート制限対策
    await delay(100);
  }

  return results;
}

/**
 * 配信成功率を計算
 */
export function calculateSuccessRate(results: IntelligentFallbackResult[]): {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  fallbackRate: number;
  channelBreakdown: Record<DeliveryChannel, number>;
} {
  const total = results.length;
  const successful = results.filter((r) => r.success).length;
  const failed = total - successful;
  const fallbackUsed = results.filter((r) => r.fallbackUsed && r.success).length;

  const channelBreakdown: Record<DeliveryChannel, number> = {
    EMAIL: 0,
    SMS: 0,
    LINE: 0,
    WHATSAPP: 0,
  };

  for (const result of results) {
    if (result.success) {
      channelBreakdown[result.finalChannel]++;
    }
  }

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    fallbackRate: successful > 0 ? (fallbackUsed / successful) * 100 : 0,
    channelBreakdown,
  };
}
