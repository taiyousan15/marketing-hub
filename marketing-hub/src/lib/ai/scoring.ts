/**
 * AIスコアリングエンジン
 * リードスコア、エンゲージメントスコア、チャーンスコアを計算
 */

import { claude, isAIConfigured } from "./claude";

// スコア重み設定
export interface ScoringWeights {
  // エンゲージメント関連
  pageView: number;
  productView: number;
  cartAdd: number;
  messageOpen: number;
  linkClick: number;
  formSubmit: number;
  purchaseComplete: number;

  // ネガティブシグナル
  cartAbandon: number;
  unsubscribe: number;
  inactive: number;

  // プロファイル完成度
  profileComplete: number;
  emailVerified: number;
  phoneVerified: number;
}

// デフォルトの重み設定
export const DEFAULT_WEIGHTS: ScoringWeights = {
  pageView: 1,
  productView: 3,
  cartAdd: 10,
  messageOpen: 5,
  linkClick: 8,
  formSubmit: 15,
  purchaseComplete: 50,
  cartAbandon: -5,
  unsubscribe: -30,
  inactive: -2, // 非アクティブ日あたり
  profileComplete: 10,
  emailVerified: 5,
  phoneVerified: 5,
};

// 行動イベントの型定義
export interface BehaviorEvent {
  type:
    | "PAGE_VIEW"
    | "PRODUCT_VIEW"
    | "CART_ADD"
    | "CART_ABANDON"
    | "MESSAGE_OPEN"
    | "LINK_CLICK"
    | "FORM_SUBMIT"
    | "PURCHASE"
    | "UNSUBSCRIBE";
  timestamp: Date;
  data?: {
    value?: number;
    productId?: string;
    pageUrl?: string;
    campaignId?: string;
  };
}

// コンタクトプロファイル
export interface ContactProfile {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  tags: string[];
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastActiveAt?: Date;
  createdAt: Date;
}

// スコア結果
export interface ScoreResult {
  leadScore: number; // 0-100
  engagementScore: number; // 0-100
  churnScore: number; // 0-100 (高いほど離脱リスク)
  breakdown: {
    behavioral: number;
    profile: number;
    recency: number;
  };
  tier: "hot" | "warm" | "cold" | "frozen";
  recommendations: string[];
}

/**
 * 行動スコアを計算
 */
export function calculateBehavioralScore(
  events: BehaviorEvent[],
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  lookbackDays: number = 30
): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

  let score = 0;
  const recentEvents = events.filter((e) => e.timestamp >= cutoffDate);

  for (const event of recentEvents) {
    switch (event.type) {
      case "PAGE_VIEW":
        score += weights.pageView;
        break;
      case "PRODUCT_VIEW":
        score += weights.productView;
        break;
      case "CART_ADD":
        score += weights.cartAdd;
        break;
      case "CART_ABANDON":
        score += weights.cartAbandon;
        break;
      case "MESSAGE_OPEN":
        score += weights.messageOpen;
        break;
      case "LINK_CLICK":
        score += weights.linkClick;
        break;
      case "FORM_SUBMIT":
        score += weights.formSubmit;
        break;
      case "PURCHASE":
        score += weights.purchaseComplete * (event.data?.value ? Math.log10(event.data.value) : 1);
        break;
      case "UNSUBSCRIBE":
        score += weights.unsubscribe;
        break;
    }
  }

  return Math.max(0, score);
}

/**
 * プロファイル完成度スコアを計算
 */
export function calculateProfileScore(
  profile: ContactProfile,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  let score = 0;

  // プロファイル完成度チェック
  const fields = [profile.email, profile.phone, profile.name];
  const completedFields = fields.filter(Boolean).length;
  score += (completedFields / fields.length) * weights.profileComplete;

  // 認証状態
  if (profile.isEmailVerified) score += weights.emailVerified;
  if (profile.isPhoneVerified) score += weights.phoneVerified;

  // タグの有無（興味関心が明確）
  if (profile.tags.length > 0) score += Math.min(profile.tags.length * 2, 10);

  return score;
}

/**
 * 最終活動からの日数に基づく減衰スコアを計算
 */
export function calculateRecencyScore(
  lastActiveAt: Date | undefined,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  if (!lastActiveAt) return 0;

  const daysSinceActive = Math.floor(
    (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 最近のアクティビティほど高スコア
  if (daysSinceActive <= 1) return 30;
  if (daysSinceActive <= 3) return 25;
  if (daysSinceActive <= 7) return 20;
  if (daysSinceActive <= 14) return 15;
  if (daysSinceActive <= 30) return 10;
  if (daysSinceActive <= 60) return 5;

  return Math.max(0, 5 + (60 - daysSinceActive) * weights.inactive);
}

/**
 * チャーン（離脱）スコアを計算（0-100、高いほど離脱リスク）
 */
export function calculateChurnScore(
  events: BehaviorEvent[],
  lastActiveAt: Date | undefined
): number {
  // 最終アクティブ日からの日数
  const daysSinceActive = lastActiveAt
    ? Math.floor(
        (Date.now() - lastActiveAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    : 365;

  // ネガティブシグナルのカウント
  const negativeSignals = events.filter(
    (e) => e.type === "CART_ABANDON" || e.type === "UNSUBSCRIBE"
  ).length;

  // 最近の購入・エンゲージメント
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentPositiveEvents = events.filter(
    (e) =>
      e.timestamp >= thirtyDaysAgo &&
      (e.type === "PURCHASE" || e.type === "LINK_CLICK" || e.type === "FORM_SUBMIT")
  ).length;

  let churnScore = 0;

  // 非アクティブ期間に基づくスコア
  if (daysSinceActive > 90) churnScore += 40;
  else if (daysSinceActive > 60) churnScore += 30;
  else if (daysSinceActive > 30) churnScore += 20;
  else if (daysSinceActive > 14) churnScore += 10;

  // ネガティブシグナルによる加算
  churnScore += Math.min(negativeSignals * 10, 30);

  // ポジティブシグナルによる減算
  churnScore -= Math.min(recentPositiveEvents * 5, 20);

  return Math.min(100, Math.max(0, churnScore));
}

/**
 * ティア（温度）を決定
 */
export function determineTier(
  leadScore: number,
  engagementScore: number,
  churnScore: number
): "hot" | "warm" | "cold" | "frozen" {
  const combinedScore = (leadScore + engagementScore - churnScore) / 2;

  if (combinedScore >= 70 && churnScore < 20) return "hot";
  if (combinedScore >= 40 && churnScore < 50) return "warm";
  if (combinedScore >= 20 && churnScore < 70) return "cold";
  return "frozen";
}

/**
 * 総合スコアを計算
 */
export function calculateTotalScore(
  profile: ContactProfile,
  events: BehaviorEvent[],
  weights: ScoringWeights = DEFAULT_WEIGHTS
): ScoreResult {
  const behavioralScore = calculateBehavioralScore(events, weights);
  const profileScore = calculateProfileScore(profile, weights);
  const recencyScore = calculateRecencyScore(profile.lastActiveAt, weights);

  // リードスコア計算（0-100に正規化）
  const rawLeadScore = behavioralScore + profileScore + recencyScore;
  const leadScore = Math.min(100, Math.round((rawLeadScore / 150) * 100));

  // エンゲージメントスコア計算
  const engagementScore = Math.min(
    100,
    Math.round(((behavioralScore + recencyScore) / 100) * 100)
  );

  // チャーンスコア計算
  const churnScore = calculateChurnScore(events, profile.lastActiveAt);

  // ティア決定
  const tier = determineTier(leadScore, engagementScore, churnScore);

  // 推奨アクションを生成
  const recommendations = generateRecommendations(
    leadScore,
    engagementScore,
    churnScore,
    tier
  );

  return {
    leadScore,
    engagementScore,
    churnScore,
    breakdown: {
      behavioral: behavioralScore,
      profile: profileScore,
      recency: recencyScore,
    },
    tier,
    recommendations,
  };
}

/**
 * スコアに基づいて推奨アクションを生成
 */
function generateRecommendations(
  leadScore: number,
  engagementScore: number,
  churnScore: number,
  tier: string
): string[] {
  const recommendations: string[] = [];

  switch (tier) {
    case "hot":
      recommendations.push("セールスからの直接コンタクト推奨");
      recommendations.push("限定オファーの送付");
      if (leadScore < 90) {
        recommendations.push("アップセル/クロスセルの提案");
      }
      break;

    case "warm":
      recommendations.push("ナーチャリングシーケンスの継続");
      if (engagementScore < 60) {
        recommendations.push("エンゲージメント向上キャンペーン");
      }
      recommendations.push("パーソナライズドコンテンツの配信");
      break;

    case "cold":
      recommendations.push("リエンゲージメントキャンペーンの実施");
      if (churnScore > 50) {
        recommendations.push("特別割引オファーの検討");
      }
      recommendations.push("興味関心の再確認アンケート");
      break;

    case "frozen":
      recommendations.push("最終リエンゲージメントの試行");
      if (churnScore > 80) {
        recommendations.push("リスト整理の検討");
      }
      recommendations.push("復帰インセンティブの提供");
      break;
  }

  return recommendations;
}

/**
 * AIを使用してスコアを説明
 */
export async function explainScoreWithAI(
  score: ScoreResult,
  profile: ContactProfile,
  recentEvents: BehaviorEvent[]
): Promise<string> {
  if (!isAIConfigured) {
    return `リードスコア: ${score.leadScore}点、エンゲージメント: ${score.engagementScore}点、離脱リスク: ${score.churnScore}%`;
  }

  const prompt = `
以下の顧客スコアデータを分析し、日本語で簡潔に説明してください（3-4文程度）。

【スコア】
- リードスコア: ${score.leadScore}/100
- エンゲージメントスコア: ${score.engagementScore}/100
- 離脱リスク: ${score.churnScore}%
- ティア: ${score.tier}

【内訳】
- 行動スコア: ${score.breakdown.behavioral}
- プロファイルスコア: ${score.breakdown.profile}
- 最終活動スコア: ${score.breakdown.recency}

【プロファイル】
- タグ: ${profile.tags.join(", ") || "なし"}
- 最終活動: ${profile.lastActiveAt?.toLocaleDateString("ja-JP") || "不明"}

【最近の行動（5件）】
${recentEvents
  .slice(0, 5)
  .map((e) => `- ${e.type} (${e.timestamp.toLocaleDateString("ja-JP")})`)
  .join("\n")}

顧客の状態と推奨アクションを説明してください。
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      return content.text.trim();
    }
  } catch (error) {
    console.error("AI explanation error:", error);
  }

  return `リードスコア: ${score.leadScore}点、エンゲージメント: ${score.engagementScore}点、離脱リスク: ${score.churnScore}%`;
}

/**
 * スコアの変化をトラッキング
 */
export interface ScoreChange {
  previousScore: number;
  currentScore: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
}

export function calculateScoreChange(
  previousScore: number,
  currentScore: number
): ScoreChange {
  const change = currentScore - previousScore;
  const changePercent =
    previousScore > 0 ? Math.round((change / previousScore) * 100) : 0;

  let trend: "up" | "down" | "stable" = "stable";
  if (change > 5) trend = "up";
  else if (change < -5) trend = "down";

  return {
    previousScore,
    currentScore,
    change,
    changePercent,
    trend,
  };
}
