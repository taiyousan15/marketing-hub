/**
 * Scoring Engine
 *
 * RFM分析 + リードスコアリング + エンゲージメントスコア
 * 根拠: research/runs/20260201-082657__step-email-trends/evidence.jsonl (ev-005, ev-006)
 *
 * - ev-005: AIスコアリングで購買意欲の高いリードを優先対応 → 成約率向上
 * - ev-006: 有料化率20%→71%の実績
 */

import { prisma } from "@/lib/db/prisma";

// ==================== 型定義 ====================

export interface RFMScore {
  recency: number;    // 1-5 (5が最高)
  frequency: number;  // 1-5
  monetary: number;   // 1-5
  total: number;      // 合計 3-15
  segment: RFMSegment;
}

export type RFMSegment =
  | "champions"           // 最高顧客
  | "loyal_customers"     // ロイヤル顧客
  | "potential_loyalist"  // 潜在ロイヤル
  | "new_customers"       // 新規顧客
  | "promising"           // 有望顧客
  | "needs_attention"     // 要注意
  | "about_to_sleep"      // 休眠予備軍
  | "at_risk"             // リスク顧客
  | "cant_lose"           // 失いたくない
  | "hibernating"         // 休眠
  | "lost";               // 離脱

export interface LeadScoreFactors {
  profileCompleteness: number;  // プロフィール完成度 (0-20)
  emailEngagement: number;      // メール反応 (0-30)
  websiteActivity: number;      // サイト活動 (0-25)
  socialEngagement: number;     // SNS反応 (0-15)
  purchaseIntent: number;       // 購買意図シグナル (0-10)
}

export interface ScoreResult {
  contactId: string;
  rfm: RFMScore;
  leadScore: number;
  engagementScore: number;
  churnScore: number;
  tier: "hot" | "warm" | "cold" | "frozen";
  predictedIntent: "high" | "medium" | "low";
}

// ==================== RFMセグメント定義 ====================

const RFM_SEGMENTS: Record<string, { r: number[]; f: number[]; m: number[] }> = {
  champions: { r: [4, 5], f: [4, 5], m: [4, 5] },
  loyal_customers: { r: [3, 5], f: [3, 5], m: [3, 5] },
  potential_loyalist: { r: [4, 5], f: [2, 3], m: [2, 3] },
  new_customers: { r: [4, 5], f: [1, 1], m: [1, 2] },
  promising: { r: [3, 4], f: [1, 2], m: [1, 2] },
  needs_attention: { r: [2, 3], f: [2, 3], m: [2, 3] },
  about_to_sleep: { r: [2, 3], f: [1, 2], m: [1, 2] },
  at_risk: { r: [1, 2], f: [3, 5], m: [3, 5] },
  cant_lose: { r: [1, 2], f: [4, 5], m: [4, 5] },
  hibernating: { r: [1, 2], f: [1, 2], m: [1, 2] },
  lost: { r: [1, 1], f: [1, 1], m: [1, 1] },
};

// ==================== スコア計算 ====================

/**
 * RFMスコアを計算
 */
export function calculateRFMScore(
  lastOrderDays: number | null,
  orderCount: number,
  totalRevenue: number,
  // 閾値設定（業界/ビジネスに応じて調整）
  thresholds = {
    recency: [30, 60, 90, 180], // 日数の閾値
    frequency: [1, 2, 5, 10],   // 購入回数の閾値
    monetary: [5000, 15000, 50000, 100000], // 金額の閾値（円）
  }
): RFMScore {
  // Recency (最終購入からの日数 - 少ないほど高スコア)
  let recency = 1;
  if (lastOrderDays === null) {
    recency = 1;
  } else if (lastOrderDays <= thresholds.recency[0]) {
    recency = 5;
  } else if (lastOrderDays <= thresholds.recency[1]) {
    recency = 4;
  } else if (lastOrderDays <= thresholds.recency[2]) {
    recency = 3;
  } else if (lastOrderDays <= thresholds.recency[3]) {
    recency = 2;
  }

  // Frequency (購入回数 - 多いほど高スコア)
  let frequency = 1;
  if (orderCount >= thresholds.frequency[3]) {
    frequency = 5;
  } else if (orderCount >= thresholds.frequency[2]) {
    frequency = 4;
  } else if (orderCount >= thresholds.frequency[1]) {
    frequency = 3;
  } else if (orderCount >= thresholds.frequency[0]) {
    frequency = 2;
  }

  // Monetary (累計購入金額 - 多いほど高スコア)
  let monetary = 1;
  if (totalRevenue >= thresholds.monetary[3]) {
    monetary = 5;
  } else if (totalRevenue >= thresholds.monetary[2]) {
    monetary = 4;
  } else if (totalRevenue >= thresholds.monetary[1]) {
    monetary = 3;
  } else if (totalRevenue >= thresholds.monetary[0]) {
    monetary = 2;
  }

  const total = recency + frequency + monetary;
  const segment = determineRFMSegment(recency, frequency, monetary);

  return { recency, frequency, monetary, total, segment };
}

/**
 * RFMセグメントを決定
 */
function determineRFMSegment(r: number, f: number, m: number): RFMSegment {
  for (const [segment, ranges] of Object.entries(RFM_SEGMENTS)) {
    const rMatch = r >= ranges.r[0] && r <= ranges.r[1];
    const fMatch = f >= ranges.f[0] && f <= ranges.f[1];
    const mMatch = m >= ranges.m[0] && m <= ranges.m[1];

    if (rMatch && fMatch && mMatch) {
      return segment as RFMSegment;
    }
  }

  return "hibernating";
}

/**
 * リードスコアを計算 (0-100)
 */
export function calculateLeadScore(factors: LeadScoreFactors): number {
  const total =
    factors.profileCompleteness +
    factors.emailEngagement +
    factors.websiteActivity +
    factors.socialEngagement +
    factors.purchaseIntent;

  return Math.min(100, Math.max(0, total));
}

/**
 * エンゲージメントスコアを計算 (0-100)
 */
export function calculateEngagementScore(
  emailOpens: number,
  emailClicks: number,
  pageViews: number,
  lastActivityDays: number | null
): number {
  let score = 0;

  // メール開封 (max 30)
  score += Math.min(30, emailOpens * 3);

  // メールクリック (max 30)
  score += Math.min(30, emailClicks * 6);

  // ページビュー (max 25)
  score += Math.min(25, pageViews * 2.5);

  // アクティビティの新鮮さ (max 15)
  if (lastActivityDays === null) {
    score += 0;
  } else if (lastActivityDays <= 7) {
    score += 15;
  } else if (lastActivityDays <= 14) {
    score += 12;
  } else if (lastActivityDays <= 30) {
    score += 8;
  } else if (lastActivityDays <= 60) {
    score += 4;
  }

  return Math.min(100, Math.round(score));
}

/**
 * チャーンスコア（離脱リスク）を計算 (0-100)
 */
export function calculateChurnScore(
  lastActivityDays: number | null,
  engagementTrend: "up" | "stable" | "down",
  emailUnsubscribed: boolean,
  supportTickets: number
): number {
  let score = 0;

  // 最終アクティビティからの日数
  if (lastActivityDays === null) {
    score += 40;
  } else if (lastActivityDays > 90) {
    score += 40;
  } else if (lastActivityDays > 60) {
    score += 30;
  } else if (lastActivityDays > 30) {
    score += 15;
  }

  // エンゲージメントトレンド
  if (engagementTrend === "down") {
    score += 25;
  } else if (engagementTrend === "stable") {
    score += 10;
  }

  // メール配信停止
  if (emailUnsubscribed) {
    score += 20;
  }

  // サポート問い合わせ（多いとリスク）
  score += Math.min(15, supportTickets * 5);

  return Math.min(100, score);
}

/**
 * ティアを決定
 */
export function determineTier(
  leadScore: number,
  engagementScore: number
): "hot" | "warm" | "cold" | "frozen" {
  const avgScore = (leadScore + engagementScore) / 2;

  if (avgScore >= 70) return "hot";
  if (avgScore >= 50) return "warm";
  if (avgScore >= 25) return "cold";
  return "frozen";
}

/**
 * 購買意図を予測
 */
export function predictIntent(
  leadScore: number,
  rfmSegment: RFMSegment,
  recentPageViews: number
): "high" | "medium" | "low" {
  const highIntentSegments: RFMSegment[] = [
    "champions",
    "loyal_customers",
    "potential_loyalist",
  ];

  if (leadScore >= 70 || highIntentSegments.includes(rfmSegment)) {
    return "high";
  }

  if (leadScore >= 40 || recentPageViews >= 5) {
    return "medium";
  }

  return "low";
}

// ==================== データベース操作 ====================

/**
 * コンタクトのスコアを計算して保存
 */
export async function calculateAndSaveScore(
  contactId: string,
  tenantId: string
): Promise<ScoreResult | null> {
  // コンタクト情報を取得
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
      },
      messageHistories: {
        where: {
          channel: "EMAIL",
          direction: "OUTBOUND",
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      },
    },
  });

  if (!contact) return null;

  // RFMデータ計算
  const now = new Date();
  const lastOrder = contact.orders[0];
  const lastOrderDays = lastOrder
    ? Math.floor((now.getTime() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const orderCount = contact.orders.length;
  const totalRevenue = contact.orders.reduce((sum, o) => sum + o.amount, 0);

  // RFMスコア
  const rfm = calculateRFMScore(lastOrderDays, orderCount, totalRevenue);

  // エンゲージメントデータ
  const emailOpens = contact.messageHistories.filter((m) => m.openedAt).length;
  const emailClicks = contact.messageHistories.filter((m) => m.clickedAt).length;

  // リードスコア（簡易版）
  const leadScoreFactors: LeadScoreFactors = {
    profileCompleteness: contact.name && contact.email ? 15 : contact.email ? 10 : 5,
    emailEngagement: Math.min(30, emailOpens * 2 + emailClicks * 4),
    websiteActivity: 10, // TODO: 行動イベントから計算
    socialEngagement: 0, // TODO: LINE等から計算
    purchaseIntent: orderCount > 0 ? 10 : 0,
  };
  const leadScore = calculateLeadScore(leadScoreFactors);

  // エンゲージメントスコア
  const lastActivity = contact.messageHistories[0];
  const lastActivityDays = lastActivity
    ? Math.floor((now.getTime() - lastActivity.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const engagementScore = calculateEngagementScore(
    emailOpens,
    emailClicks,
    10, // TODO: 行動イベントから取得
    lastActivityDays
  );

  // チャーンスコア
  const churnScore = calculateChurnScore(
    lastActivityDays,
    "stable", // TODO: トレンド計算
    !contact.emailOptIn,
    0 // TODO: サポートチケット数
  );

  // ティアと意図予測
  const tier = determineTier(leadScore, engagementScore);
  const predictedIntent = predictIntent(leadScore, rfm.segment, 5);

  // スコアを保存
  await prisma.contactScore.upsert({
    where: { contactId },
    create: {
      contactId,
      tenantId,
      recency: rfm.recency,
      frequency: rfm.frequency,
      monetary: rfm.monetary,
      rfmSegment: rfm.segment,
      leadScore,
      engagementScore,
      churnScore,
      tier,
      calculatedAt: now,
    },
    update: {
      recency: rfm.recency,
      frequency: rfm.frequency,
      monetary: rfm.monetary,
      rfmSegment: rfm.segment,
      leadScore,
      engagementScore,
      churnScore,
      tier,
      calculatedAt: now,
    },
  });

  // Contact.scoreも更新
  await prisma.contact.update({
    where: { id: contactId },
    data: { score: leadScore },
  });

  return {
    contactId,
    rfm,
    leadScore,
    engagementScore,
    churnScore,
    tier,
    predictedIntent,
  };
}

/**
 * テナントの全コンタクトのスコアを再計算（バッチ処理）
 */
export async function recalculateAllScores(
  tenantId: string
): Promise<{ total: number; updated: number; errors: number }> {
  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    select: { id: true },
  });

  let updated = 0;
  let errors = 0;

  for (const contact of contacts) {
    try {
      await calculateAndSaveScore(contact.id, tenantId);
      updated++;
    } catch (error) {
      console.error(`Score calculation error for ${contact.id}:`, error);
      errors++;
    }
  }

  return { total: contacts.length, updated, errors };
}

/**
 * スコアサマリーを取得
 */
export async function getScoreSummary(tenantId: string) {
  const scores = await prisma.contactScore.findMany({
    where: { tenantId },
  });

  const tierCounts = {
    hot: scores.filter((s) => s.tier === "hot").length,
    warm: scores.filter((s) => s.tier === "warm").length,
    cold: scores.filter((s) => s.tier === "cold").length,
    frozen: scores.filter((s) => s.tier === "frozen").length,
  };

  const rfmSegmentCounts: Record<string, number> = {};
  for (const score of scores) {
    if (score.rfmSegment) {
      rfmSegmentCounts[score.rfmSegment] = (rfmSegmentCounts[score.rfmSegment] || 0) + 1;
    }
  }

  const avgLeadScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.leadScore, 0) / scores.length)
    : 0;

  const avgEngagementScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.engagementScore, 0) / scores.length)
    : 0;

  const highRiskCount = scores.filter((s) => s.churnScore >= 70).length;

  return {
    totalScored: scores.length,
    tierCounts,
    rfmSegmentCounts,
    avgLeadScore,
    avgEngagementScore,
    highRiskCount,
  };
}

/**
 * ホットリードを取得
 */
export async function getHotLeads(tenantId: string, limit = 10) {
  return prisma.contactScore.findMany({
    where: {
      tenantId,
      tier: "hot",
    },
    orderBy: { leadScore: "desc" },
    take: limit,
  });
}

/**
 * リスク顧客を取得
 */
export async function getAtRiskContacts(tenantId: string, limit = 10) {
  return prisma.contactScore.findMany({
    where: {
      tenantId,
      churnScore: { gte: 60 },
    },
    orderBy: { churnScore: "desc" },
    take: limit,
  });
}
