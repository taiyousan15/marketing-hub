// src/lib/step-delivery/index.ts
// ステップ配信モジュールエクスポート

export {
  canDeliverTo,
  selectOptimalChannel,
  deliverMessage,
  executeStepDelivery,
  deliverWithFallback,
  type DeliveryPayload,
  type DeliveryResult,
} from './engine';

export {
  optimizeDelivery,
  optimizeBulkDelivery,
  getChannelStats,
} from './ai-optimizer';

export {
  deliverWithIntelligentFallback,
  deliverByPriority,
  deliverWithAIOptimization,
  batchDeliverWithFallback,
  calculateSuccessRate,
} from './fallback';
