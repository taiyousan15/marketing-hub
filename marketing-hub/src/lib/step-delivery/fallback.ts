// src/lib/step-delivery/fallback.ts
// インテリジェントフォールバックシステム - Stub Implementation

import { canDeliverTo, type DeliveryPayload, type DeliveryResult } from './engine';

type DeliveryChannel = "EMAIL" | "SMS" | "LINE" | "WHATSAPP";

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
 * インテリジェントフォールバック配信
 */
export async function deliverWithFallback(
  payload: DeliveryPayload,
  config?: Partial<FallbackConfig>
): Promise<IntelligentFallbackResult> {
  return {
    success: false,
    channel: payload.channel,
    error: "Fallback delivery not implemented",
    timestamp: new Date(),
    attempts: [],
    finalChannel: payload.channel,
    totalAttempts: 0,
    fallbackUsed: false,
  };
}

/**
 * 配信順序を決定
 */
export function determineDeliveryOrder(
  primaryChannel: DeliveryChannel,
  config?: Partial<FallbackConfig>
): DeliveryChannel[] {
  return [];
}
