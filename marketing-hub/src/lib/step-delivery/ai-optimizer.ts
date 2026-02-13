// src/lib/step-delivery/ai-optimizer.ts
// AI最適化配信エンジン - Stub Implementation

type DeliveryChannel = "EMAIL" | "SMS" | "LINE" | "WHATSAPP";
type MessageStatus = "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "FAILED";

// チャンネルスコア（0-100）
interface ChannelScore {
  channel: DeliveryChannel;
  score: number;
  reason: string;
  metrics: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    responseRate: number;
    recency: number;
  };
}

// 最適化結果
interface OptimizationResult {
  recommendedChannel: DeliveryChannel;
  recommendedHour: number;
  channelScores: ChannelScore[];
  confidence: number;
  reasoning: string[];
}

// コンタクトのエンゲージメント履歴
interface EngagementHistory {
  channel: DeliveryChannel;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  responded: number;
  lastEngagementAt: Date | null;
}

/**
 * コンタクトのエンゲージメント履歴を取得
 */
async function getEngagementHistory(
  contactId: string
): Promise<EngagementHistory[]> {
  return [];
}

/**
 * コンタクトに最適なチャンネルと配信時刻を推奨
 */
export async function optimizeDelivery(
  contactId: string
): Promise<OptimizationResult | null> {
  return null;
}

/**
 * AB テスト用に複数チャンネル候補を取得
 */
export async function getChannelCandidates(
  contactId: string,
  count?: number
): Promise<DeliveryChannel[]> {
  return [];
}

/**
 * 最適な配信時刻を推奨
 */
export async function recommendOptimalHour(
  contactId: string,
  channel: DeliveryChannel
): Promise<number> {
  return 9; // Default hour
}
