// src/lib/step-delivery/index.ts
// ステップ配信モジュールエクスポート

export {
  canDeliverTo,
  deliver,
  deliverMultiChannel,
  type DeliveryPayload,
  type DeliveryResult,
} from './engine';

export {
  optimizeDelivery,
  getChannelCandidates,
  recommendOptimalHour,
} from './ai-optimizer';

export {
  deliverWithFallback,
  determineDeliveryOrder,
} from './fallback';
