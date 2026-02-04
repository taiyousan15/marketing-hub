// src/lib/step-delivery/ai-optimizer.ts
// AI最適化配信エンジン - チャンネル・タイミング自動最適化

import { prisma } from '@/lib/db/prisma';
import type { DeliveryChannel, MessageStatus } from '@prisma/client';

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
  const channels: DeliveryChannel[] = ['EMAIL', 'SMS', 'LINE', 'WHATSAPP'];
  const histories: EngagementHistory[] = [];

  for (const channel of channels) {
    const messages = await prisma.messageHistory.findMany({
      where: { contactId, channel },
      orderBy: { createdAt: 'desc' },
      take: 100, // 直近100件
    });

    const totalSent = messages.length;
    const delivered = messages.filter(
      (m) => m.status === 'DELIVERED' || m.status === 'SENT'
    ).length;
    const opened = messages.filter((m) => m.openedAt !== null).length;
    const clicked = messages.filter((m) => m.clickedAt !== null).length;

    // 最後のエンゲージメント（開封またはクリック）
    const engagedMessages = messages.filter(
      (m) => m.openedAt !== null || m.clickedAt !== null
    );
    const lastEngagementAt =
      engagedMessages.length > 0
        ? engagedMessages[0].openedAt || engagedMessages[0].clickedAt
        : null;

    histories.push({
      channel,
      totalSent,
      delivered,
      opened,
      clicked,
      responded: 0, // TODO: 返信追跡
      lastEngagementAt,
    });
  }

  return histories;
}

/**
 * コンタクトが利用可能なチャンネルを取得
 */
async function getAvailableChannels(
  contactId: string
): Promise<DeliveryChannel[]> {
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

  if (!contact) return [];

  const available: DeliveryChannel[] = [];

  if (contact.email && contact.emailOptIn) {
    available.push('EMAIL');
  }
  if (contact.phone && contact.smsOptIn) {
    available.push('SMS');
  }
  if (contact.lineUserId && contact.lineOptIn) {
    available.push('LINE');
  }
  // WhatsAppは携帯番号またはwhatsappNumberを使用
  const whatsappNumber = contact.whatsappNumber || contact.phone;
  if (whatsappNumber && contact.whatsappOptIn) {
    available.push('WHATSAPP');
  }

  return available;
}

/**
 * チャンネルスコアを計算
 */
function calculateChannelScore(
  history: EngagementHistory,
  isAvailable: boolean
): ChannelScore {
  if (!isAvailable) {
    return {
      channel: history.channel,
      score: 0,
      reason: 'チャンネル利用不可',
      metrics: {
        deliveryRate: 0,
        openRate: 0,
        clickRate: 0,
        responseRate: 0,
        recency: 0,
      },
    };
  }

  // 配信率
  const deliveryRate =
    history.totalSent > 0 ? (history.delivered / history.totalSent) * 100 : 50;

  // 開封率
  const openRate =
    history.delivered > 0 ? (history.opened / history.delivered) * 100 : 20;

  // クリック率
  const clickRate =
    history.opened > 0 ? (history.clicked / history.opened) * 100 : 5;

  // 返信率
  const responseRate = 0; // TODO

  // 最新性スコア（最後のエンゲージメントからの日数）
  let recency = 50;
  if (history.lastEngagementAt) {
    const daysSinceEngagement = Math.floor(
      (Date.now() - history.lastEngagementAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    recency = Math.max(0, 100 - daysSinceEngagement * 2);
  }

  // 総合スコア計算（重み付け）
  const score =
    deliveryRate * 0.3 +
    openRate * 0.3 +
    clickRate * 0.2 +
    recency * 0.2;

  // 理由生成
  let reason = '';
  if (score >= 70) {
    reason = '高いエンゲージメント率';
  } else if (score >= 50) {
    reason = '中程度のエンゲージメント';
  } else if (score >= 30) {
    reason = '改善の余地あり';
  } else {
    reason = 'エンゲージメント低下中';
  }

  // データ不足の場合はデフォルトスコアを使用
  if (history.totalSent < 5) {
    reason = 'データ不足（デフォルト値使用）';
  }

  return {
    channel: history.channel,
    score: Math.round(score),
    reason,
    metrics: {
      deliveryRate: Math.round(deliveryRate),
      openRate: Math.round(openRate),
      clickRate: Math.round(clickRate),
      responseRate: Math.round(responseRate),
      recency: Math.round(recency),
    },
  };
}

/**
 * 最適な送信時間を予測
 */
async function predictOptimalHour(
  contactId: string,
  channel: DeliveryChannel
): Promise<number> {
  // 過去の開封・クリック時間を分析
  const engagedMessages = await prisma.messageHistory.findMany({
    where: {
      contactId,
      channel,
      OR: [{ openedAt: { not: null } }, { clickedAt: { not: null } }],
    },
    select: {
      openedAt: true,
      clickedAt: true,
    },
    take: 50,
  });

  if (engagedMessages.length < 5) {
    // データ不足の場合はデフォルト
    const defaults: Record<DeliveryChannel, number> = {
      EMAIL: 10, // 朝10時
      SMS: 12, // 昼12時
      LINE: 20, // 夜8時
      WHATSAPP: 19, // 夜7時
    };
    return defaults[channel];
  }

  // 時間帯別のエンゲージメントカウント
  const hourCounts: number[] = new Array(24).fill(0);

  for (const msg of engagedMessages) {
    const engageTime = msg.openedAt || msg.clickedAt;
    if (engageTime) {
      const hour = new Date(engageTime).getHours();
      hourCounts[hour]++;
    }
  }

  // 最もエンゲージメントの高い時間帯を返す
  let maxHour = 10;
  let maxCount = 0;
  for (let h = 0; h < 24; h++) {
    if (hourCounts[h] > maxCount) {
      maxCount = hourCounts[h];
      maxHour = h;
    }
  }

  // SMS/LINEは9-20時の範囲に制限
  if (channel === 'SMS' || channel === 'LINE') {
    if (maxHour < 9) maxHour = 9;
    if (maxHour > 20) maxHour = 20;
  }

  return maxHour;
}

/**
 * デフォルトチャンネルスコア（履歴がない場合）
 */
function getDefaultScore(channel: DeliveryChannel): number {
  const defaults: Record<DeliveryChannel, number> = {
    LINE: 70, // LINEは日本で高い開封率
    WHATSAPP: 75, // WhatsAppは高い開封率（90%以上）
    SMS: 65, // SMSは到達率が高い
    EMAIL: 50, // Emailは一般的
  };
  return defaults[channel];
}

/**
 * AI最適化配信 - メイン関数
 */
export async function optimizeDelivery(
  contactId: string,
  preferredChannel?: DeliveryChannel
): Promise<OptimizationResult> {
  const reasoning: string[] = [];

  // 利用可能なチャンネルを取得
  const availableChannels = await getAvailableChannels(contactId);
  reasoning.push(`利用可能チャンネル: ${availableChannels.join(', ') || 'なし'}`);

  if (availableChannels.length === 0) {
    return {
      recommendedChannel: 'EMAIL',
      recommendedHour: 10,
      channelScores: [],
      confidence: 0,
      reasoning: ['配信可能なチャンネルがありません'],
    };
  }

  // エンゲージメント履歴を取得
  const histories = await getEngagementHistory(contactId);

  // 各チャンネルのスコアを計算
  const channelScores: ChannelScore[] = histories.map((history) =>
    calculateChannelScore(history, availableChannels.includes(history.channel))
  );

  // 利用可能なチャンネルのみフィルタ
  const availableScores = channelScores.filter((s) =>
    availableChannels.includes(s.channel)
  );

  // データ不足の場合はデフォルトスコアで補完
  for (const score of availableScores) {
    const history = histories.find((h) => h.channel === score.channel);
    if (!history || history.totalSent < 5) {
      score.score = getDefaultScore(score.channel);
      score.reason = 'デフォルトスコア（データ収集中）';
    }
  }

  // スコア順にソート
  availableScores.sort((a, b) => b.score - a.score);

  // 推奨チャンネル決定
  let recommendedChannel = availableScores[0]?.channel || 'EMAIL';

  // 優先チャンネルが指定されていて利用可能なら優先
  if (preferredChannel && availableChannels.includes(preferredChannel)) {
    const preferredScore = availableScores.find(
      (s) => s.channel === preferredChannel
    );
    const topScore = availableScores[0];

    // 優先チャンネルのスコアが最高スコアの70%以上なら採用
    if (preferredScore && topScore && preferredScore.score >= topScore.score * 0.7) {
      recommendedChannel = preferredChannel;
      reasoning.push(
        `優先チャンネル ${preferredChannel} を採用（スコア: ${preferredScore.score}）`
      );
    }
  }

  reasoning.push(
    `推奨チャンネル: ${recommendedChannel}（スコア: ${availableScores.find((s) => s.channel === recommendedChannel)?.score || 0}）`
  );

  // 最適な送信時間を予測
  const recommendedHour = await predictOptimalHour(contactId, recommendedChannel);
  reasoning.push(`推奨送信時間: ${recommendedHour}:00`);

  // 信頼度計算
  const topScore = availableScores[0]?.score || 0;
  const dataPoints = histories.reduce((sum, h) => sum + h.totalSent, 0);
  const dataConfidence = Math.min(100, dataPoints * 2);
  const confidence = Math.round((topScore + dataConfidence) / 2);

  return {
    recommendedChannel,
    recommendedHour,
    channelScores,
    confidence,
    reasoning,
  };
}

/**
 * 一括最適化（キャンペーン用）
 */
export async function optimizeBulkDelivery(
  contactIds: string[],
  preferredChannel?: DeliveryChannel
): Promise<Map<string, OptimizationResult>> {
  const results = new Map<string, OptimizationResult>();

  for (const contactId of contactIds) {
    const result = await optimizeDelivery(contactId, preferredChannel);
    results.set(contactId, result);
  }

  return results;
}

/**
 * チャンネル別の全体統計
 */
export async function getChannelStats(
  tenantId: string
): Promise<Record<DeliveryChannel, { sent: number; delivered: number; opened: number; clicked: number }>> {
  const channels: DeliveryChannel[] = ['EMAIL', 'SMS', 'LINE', 'WHATSAPP'];
  const stats: Record<DeliveryChannel, { sent: number; delivered: number; opened: number; clicked: number }> = {
    EMAIL: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
    SMS: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
    LINE: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
    WHATSAPP: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
  };

  for (const channel of channels) {
    const messages = await prisma.messageHistory.findMany({
      where: { tenantId, channel },
    });

    stats[channel] = {
      sent: messages.length,
      delivered: messages.filter(
        (m) => m.status === 'DELIVERED' || m.status === 'SENT'
      ).length,
      opened: messages.filter((m) => m.openedAt !== null).length,
      clicked: messages.filter((m) => m.clickedAt !== null).length,
    };
  }

  return stats;
}
