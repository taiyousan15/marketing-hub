// src/lib/step-delivery/fallback.ts
// フォールバック配信エンジン - Simplified stub

import type { DeliveryPayload, DeliveryResult } from './engine';

export type DeliveryChannel = 'EMAIL' | 'SMS' | 'LINE';

interface FallbackConfig {
  fallbackOrder: DeliveryChannel[];
  useAIOptimization: boolean;
  maxRetries: number;
  retryDelay: number;
}

/**
 * フォールバック配信
 */
export async function executeWithFallback(
  payload: DeliveryPayload,
  config?: Partial<FallbackConfig>
): Promise<DeliveryResult> {
  return {
    success: false,
    channel: payload.channel,
    timestamp: new Date(),
    error: 'Not implemented',
  };
}

/**
 * デフォルト設定を取得
 */
export function getDefaultFallbackConfig(): FallbackConfig {
  return {
    fallbackOrder: ['EMAIL', 'SMS', 'LINE'],
    useAIOptimization: false,
    maxRetries: 3,
    retryDelay: 1000,
  };
}

/**
 * インテリジェント フォールバック配信
 */
export async function deliverWithIntelligentFallback(
  payload: DeliveryPayload
): Promise<DeliveryResult> {
  return {
    success: false,
    channel: payload.channel,
    timestamp: new Date(),
    error: 'Not implemented',
  };
}

/**
 * 優先度付け配信
 */
export async function deliverByPriority(
  payload: DeliveryPayload,
  priority: DeliveryChannel[]
): Promise<DeliveryResult> {
  return {
    success: false,
    channel: payload.channel,
    timestamp: new Date(),
    error: 'Not implemented',
  };
}

/**
 * AI最適化配信
 */
export async function deliverWithAIOptimization(
  payload: DeliveryPayload
): Promise<DeliveryResult> {
  return {
    success: false,
    channel: payload.channel,
    timestamp: new Date(),
    error: 'Not implemented',
  };
}

/**
 * バッチ配信（フォールバック付き）
 */
export async function batchDeliverWithFallback(
  payloads: DeliveryPayload[]
): Promise<DeliveryResult[]> {
  return payloads.map(p => ({
    success: false,
    channel: p.channel,
    timestamp: new Date(),
    error: 'Not implemented',
  }));
}

/**
 * 配信成功率計算
 */
export function calculateSuccessRate(results: DeliveryResult[]): number {
  return 0;
}
