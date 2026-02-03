/**
 * 予測分析エンジン
 * コンバージョン確率、チャーンリスク、LTV、最適送信時間を予測
 *
 * 根拠:
 * - ev-004: 予測分析で2.9倍の収益成長（Forrester）
 * - ev-005: AIリードスコアリングは85-92%の精度
 * - ev-015: AI洞察マスター企業は2-3倍速い成長
 */

import { claude, isAIConfigured } from "./claude";
import type { ScoreResult } from "./scoring";
import type { RFMScore } from "../analytics/rfm";

// ==================== 予測タイプ ====================

export type PredictionType =
  | "conversion"      // コンバージョン確率
  | "churn"           // チャーンリスク
  | "ltv"             // 生涯価値
  | "next_purchase"   // 次回購入予測
  | "best_send_time"  // 最適送信時間
  | "best_channel"    // 最適チャネル
  | "next_action";    // 次のベストアクション

// ==================== 入力データ ====================

export interface PredictionInput {
  contactId: string;

  // 行動データ
  behaviors: Array<{
    type: string;
    timestamp: Date;
    data?: Record<string, unknown>;
  }>;

  // プロファイル
  profile: {
    createdAt: Date;
    tags: string[];
    customFields?: Record<string, unknown>;
  };

  // スコア
  scores?: {
    lead?: number;
    engagement?: number;
    churn?: number;
  };

  // RFM
  rfm?: RFMScore;

  // 購入履歴
  purchaseHistory?: Array<{
    date: Date;
    amount: number;
    productId?: string;
  }>;

  // メッセージ履歴
  messageHistory?: Array<{
    channel: string;
    sentAt: Date;
    openedAt?: Date;
    clickedAt?: Date;
  }>;
}

// ==================== 予測結果 ====================

export interface ConversionPrediction {
  probability: number; // 0-1
  confidence: number; // 0-1
  timeframe: string; // "7_days", "30_days", etc.
  factors: Array<{
    factor: string;
    impact: "positive" | "negative";
    weight: number;
  }>;
  recommendedActions: string[];
}

export interface ChurnPrediction {
  risk: number; // 0-100
  confidence: number; // 0-1
  predictedDate?: Date;
  signals: string[];
  preventionActions: string[];
}

export interface LTVPrediction {
  value: number; // 予測LTV（円）
  confidence: number; // 0-1
  segment: "high" | "medium" | "low";
  factors: string[];
  growthPotential: number; // 0-100
}

export interface SendTimePrediction {
  bestHour: number; // 0-23
  bestDayOfWeek: number; // 0-6 (日-土)
  bestTime: Date;
  confidence: number;
  reasoning: string;
  alternativeTimes: Array<{
    time: Date;
    score: number;
  }>;
}

export interface ChannelPrediction {
  bestChannel: "LINE" | "EMAIL" | "SMS";
  confidence: number;
  channelScores: {
    line: number;
    email: number;
    sms: number;
  };
  reasoning: string;
}

export interface NextActionPrediction {
  action: string;
  channel: "LINE" | "EMAIL" | "SMS" | "CALL";
  timing: Date;
  message?: string;
  confidence: number;
  alternatives: Array<{
    action: string;
    score: number;
  }>;
}

// ==================== コンバージョン予測 ====================

/**
 * コンバージョン確率を予測
 */
export async function predictConversion(
  input: PredictionInput,
  timeframeDays: number = 30
): Promise<ConversionPrediction> {
  // 基本スコア計算
  let baseScore = 0.3; // ベースライン30%
  const factors: ConversionPrediction["factors"] = [];

  // 最近の行動分析
  const recentDays = 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - recentDays);
  const recentBehaviors = input.behaviors.filter((b) => b.timestamp >= cutoff);

  // 行動ベースの調整
  const hasCartAdd = recentBehaviors.some((b) => b.type === "CART_ADD");
  const hasProductView = recentBehaviors.some((b) => b.type === "PRODUCT_VIEW");
  const hasCheckoutStart = recentBehaviors.some((b) => b.type === "CHECKOUT_START");

  if (hasCheckoutStart) {
    baseScore += 0.3;
    factors.push({ factor: "チェックアウト開始", impact: "positive", weight: 0.3 });
  }
  if (hasCartAdd) {
    baseScore += 0.15;
    factors.push({ factor: "カート追加", impact: "positive", weight: 0.15 });
  }
  if (hasProductView) {
    baseScore += 0.05;
    factors.push({ factor: "商品閲覧", impact: "positive", weight: 0.05 });
  }

  // RFMベースの調整
  if (input.rfm) {
    if (input.rfm.segment === "champions" || input.rfm.segment === "loyal_customers") {
      baseScore += 0.2;
      factors.push({ factor: "優良顧客セグメント", impact: "positive", weight: 0.2 });
    } else if (input.rfm.segment === "hibernating" || input.rfm.segment === "lost") {
      baseScore -= 0.2;
      factors.push({ factor: "休眠・離脱セグメント", impact: "negative", weight: 0.2 });
    }
  }

  // スコアベースの調整
  if (input.scores?.lead && input.scores.lead > 70) {
    baseScore += 0.1;
    factors.push({ factor: "高リードスコア", impact: "positive", weight: 0.1 });
  }

  // 購入履歴ベースの調整
  if (input.purchaseHistory && input.purchaseHistory.length > 0) {
    baseScore += 0.1;
    factors.push({ factor: "過去の購入実績", impact: "positive", weight: 0.1 });
  }

  // 0-1に正規化
  const probability = Math.max(0, Math.min(1, baseScore));

  // 推奨アクション生成
  const recommendedActions: string[] = [];
  if (probability < 0.3) {
    recommendedActions.push("ナーチャリングコンテンツを配信");
    recommendedActions.push("問題提起メッセージを送信");
  } else if (probability < 0.6) {
    recommendedActions.push("成功事例・社会的証明を共有");
    recommendedActions.push("限定オファーを提示");
  } else {
    recommendedActions.push("直接的な購入促進");
    recommendedActions.push("セールス担当へ通知");
  }

  return {
    probability,
    confidence: 0.75,
    timeframe: `${timeframeDays}_days`,
    factors,
    recommendedActions,
  };
}

// ==================== チャーン予測 ====================

/**
 * チャーンリスクを予測
 */
export async function predictChurn(
  input: PredictionInput
): Promise<ChurnPrediction> {
  let riskScore = 20; // ベースライン
  const signals: string[] = [];

  // 最終アクティブ日からの日数
  const lastActivity = input.behaviors[input.behaviors.length - 1]?.timestamp;
  if (lastActivity) {
    const daysSinceLastActivity = Math.floor(
      (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActivity > 60) {
      riskScore += 40;
      signals.push(`${daysSinceLastActivity}日間アクティビティなし`);
    } else if (daysSinceLastActivity > 30) {
      riskScore += 25;
      signals.push(`${daysSinceLastActivity}日間アクティビティなし`);
    } else if (daysSinceLastActivity > 14) {
      riskScore += 10;
      signals.push(`${daysSinceLastActivity}日間アクティビティなし`);
    }
  }

  // ネガティブ行動
  const hasCartAbandon = input.behaviors.some((b) => b.type === "CART_ABANDON");
  if (hasCartAbandon) {
    riskScore += 15;
    signals.push("カート放棄あり");
  }

  // RFMセグメント
  if (input.rfm) {
    if (input.rfm.segment === "at_risk" || input.rfm.segment === "cant_lose_them") {
      riskScore += 20;
      signals.push(`リスクセグメント: ${input.rfm.segment}`);
    } else if (input.rfm.segment === "hibernating" || input.rfm.segment === "lost") {
      riskScore += 30;
      signals.push(`休眠/離脱セグメント: ${input.rfm.segment}`);
    }
  }

  // チャーンスコア
  if (input.scores?.churn && input.scores.churn > 50) {
    riskScore += input.scores.churn * 0.3;
    signals.push(`高チャーンスコア: ${input.scores.churn}`);
  }

  // メッセージエンゲージメント低下
  if (input.messageHistory && input.messageHistory.length >= 5) {
    const recentMessages = input.messageHistory.slice(-5);
    const openRate = recentMessages.filter((m) => m.openedAt).length / recentMessages.length;
    if (openRate < 0.2) {
      riskScore += 15;
      signals.push(`低メッセージ開封率: ${Math.round(openRate * 100)}%`);
    }
  }

  // 正規化
  riskScore = Math.max(0, Math.min(100, riskScore));

  // 防止アクション
  const preventionActions: string[] = [];
  if (riskScore >= 70) {
    preventionActions.push("緊急リテンションオファーを送信");
    preventionActions.push("担当者から直接連絡");
    preventionActions.push("特別割引を提供");
  } else if (riskScore >= 40) {
    preventionActions.push("再エンゲージメントキャンペーンを開始");
    preventionActions.push("アンケートで理由を確認");
    preventionActions.push("パーソナライズドコンテンツを配信");
  } else {
    preventionActions.push("定期的なナーチャリングを継続");
    preventionActions.push("価値提供コンテンツを配信");
  }

  return {
    risk: riskScore,
    confidence: 0.7,
    signals,
    preventionActions,
  };
}

// ==================== LTV予測 ====================

/**
 * 顧客生涯価値を予測
 */
export async function predictLTV(
  input: PredictionInput
): Promise<LTVPrediction> {
  let predictedLTV = 0;
  const factors: string[] = [];

  // 過去の購入から平均購入額を計算
  if (input.purchaseHistory && input.purchaseHistory.length > 0) {
    const totalSpent = input.purchaseHistory.reduce((sum, p) => sum + p.amount, 0);
    const avgPurchase = totalSpent / input.purchaseHistory.length;

    // 顧客期間（月）
    const customerMonths = Math.max(
      1,
      Math.floor(
        (Date.now() - input.profile.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    );

    // 月間購入頻度
    const monthlyFrequency = input.purchaseHistory.length / customerMonths;

    // 予測期間（24ヶ月）
    const predictionMonths = 24;

    // 基本LTV = 平均購入額 × 月間頻度 × 予測期間
    predictedLTV = avgPurchase * monthlyFrequency * predictionMonths;

    factors.push(`平均購入額: ¥${Math.round(avgPurchase).toLocaleString()}`);
    factors.push(`購入頻度: ${monthlyFrequency.toFixed(1)}回/月`);
  }

  // RFMセグメントによる調整
  if (input.rfm) {
    const segmentMultipliers: Record<string, number> = {
      champions: 1.5,
      loyal_customers: 1.3,
      potential_loyalists: 1.2,
      new_customers: 1.0,
      promising: 1.1,
      need_attention: 0.8,
      about_to_sleep: 0.6,
      at_risk: 0.5,
      cant_lose_them: 0.7,
      hibernating: 0.3,
      lost: 0.1,
    };

    const multiplier = segmentMultipliers[input.rfm.segment] || 1.0;
    predictedLTV *= multiplier;
    factors.push(`セグメント係数: ${multiplier}x (${input.rfm.segment})`);
  }

  // エンゲージメントスコアによる調整
  if (input.scores?.engagement) {
    const engagementMultiplier = 0.5 + (input.scores.engagement / 100) * 0.5;
    predictedLTV *= engagementMultiplier;
    factors.push(`エンゲージメント係数: ${engagementMultiplier.toFixed(2)}x`);
  }

  // セグメント決定
  let segment: "high" | "medium" | "low";
  if (predictedLTV >= 100000) {
    segment = "high";
  } else if (predictedLTV >= 30000) {
    segment = "medium";
  } else {
    segment = "low";
  }

  // 成長ポテンシャル計算
  let growthPotential = 50;
  if (input.rfm?.segment === "potential_loyalists" || input.rfm?.segment === "promising") {
    growthPotential = 80;
  } else if (input.rfm?.segment === "new_customers") {
    growthPotential = 70;
  } else if (input.rfm?.segment === "champions") {
    growthPotential = 30; // すでに高い
  }

  return {
    value: Math.round(predictedLTV),
    confidence: input.purchaseHistory && input.purchaseHistory.length >= 3 ? 0.75 : 0.5,
    segment,
    factors,
    growthPotential,
  };
}

// ==================== 最適送信時間予測 ====================

/**
 * 最適なメッセージ送信時間を予測
 */
export async function predictBestSendTime(
  input: PredictionInput,
  channel: "LINE" | "EMAIL" = "LINE"
): Promise<SendTimePrediction> {
  // メッセージ履歴から開封時間を分析
  const openedMessages = input.messageHistory?.filter((m) => m.openedAt) || [];

  if (openedMessages.length < 3) {
    // データ不足時のデフォルト
    const defaultTime = new Date();
    defaultTime.setHours(12, 0, 0, 0);

    return {
      bestHour: 12,
      bestDayOfWeek: 2, // 火曜日
      bestTime: defaultTime,
      confidence: 0.3,
      reasoning: "データ不足のため、一般的に効果が高い時間帯を推奨",
      alternativeTimes: [
        { time: new Date(defaultTime.getTime() + 6 * 60 * 60 * 1000), score: 0.8 }, // 18:00
        { time: new Date(defaultTime.getTime() - 3 * 60 * 60 * 1000), score: 0.7 }, // 09:00
      ],
    };
  }

  // 時間帯別のエンゲージメント率を計算
  const hourCounts: Record<number, { opens: number; total: number }> = {};
  const dayCounts: Record<number, { opens: number; total: number }> = {};

  for (let h = 0; h < 24; h++) {
    hourCounts[h] = { opens: 0, total: 0 };
  }
  for (let d = 0; d < 7; d++) {
    dayCounts[d] = { opens: 0, total: 0 };
  }

  for (const msg of input.messageHistory || []) {
    const sentHour = msg.sentAt.getHours();
    const sentDay = msg.sentAt.getDay();

    hourCounts[sentHour].total++;
    dayCounts[sentDay].total++;

    if (msg.openedAt) {
      hourCounts[sentHour].opens++;
      dayCounts[sentDay].opens++;
    }
  }

  // 最高の時間帯と曜日を特定
  let bestHour = 12;
  let bestHourRate = 0;
  for (const [hour, data] of Object.entries(hourCounts)) {
    if (data.total > 0) {
      const rate = data.opens / data.total;
      if (rate > bestHourRate) {
        bestHourRate = rate;
        bestHour = parseInt(hour);
      }
    }
  }

  let bestDay = 2;
  let bestDayRate = 0;
  for (const [day, data] of Object.entries(dayCounts)) {
    if (data.total > 0) {
      const rate = data.opens / data.total;
      if (rate > bestDayRate) {
        bestDayRate = rate;
        bestDay = parseInt(day);
      }
    }
  }

  // 次のベストタイムを計算
  const now = new Date();
  const bestTime = new Date();
  bestTime.setHours(bestHour, 0, 0, 0);

  // 過去なら翌日に
  if (bestTime <= now) {
    bestTime.setDate(bestTime.getDate() + 1);
  }

  // 曜日を調整
  while (bestTime.getDay() !== bestDay) {
    bestTime.setDate(bestTime.getDate() + 1);
  }

  return {
    bestHour,
    bestDayOfWeek: bestDay,
    bestTime,
    confidence: Math.min(0.9, 0.3 + openedMessages.length * 0.05),
    reasoning: `過去${openedMessages.length}件のエンゲージメントデータに基づく推奨`,
    alternativeTimes: [
      { time: new Date(bestTime.getTime() + 24 * 60 * 60 * 1000), score: 0.9 },
      { time: new Date(bestTime.getTime() + 48 * 60 * 60 * 1000), score: 0.85 },
    ],
  };
}

// ==================== 最適チャネル予測 ====================

/**
 * 最適な配信チャネルを予測
 */
export async function predictBestChannel(
  input: PredictionInput
): Promise<ChannelPrediction> {
  const channelScores = {
    line: 50,
    email: 50,
    sms: 30,
  };

  // メッセージ履歴からチャネル別エンゲージメントを分析
  const channelEngagement: Record<string, { opens: number; clicks: number; total: number }> = {
    LINE: { opens: 0, clicks: 0, total: 0 },
    EMAIL: { opens: 0, clicks: 0, total: 0 },
    SMS: { opens: 0, clicks: 0, total: 0 },
  };

  for (const msg of input.messageHistory || []) {
    const channel = msg.channel.toUpperCase();
    if (channelEngagement[channel]) {
      channelEngagement[channel].total++;
      if (msg.openedAt) channelEngagement[channel].opens++;
      if (msg.clickedAt) channelEngagement[channel].clicks++;
    }
  }

  // エンゲージメント率でスコア調整
  for (const [channel, data] of Object.entries(channelEngagement)) {
    if (data.total >= 3) {
      const openRate = data.opens / data.total;
      const clickRate = data.clicks / data.total;
      const engagementScore = (openRate * 0.6 + clickRate * 0.4) * 100;

      if (channel === "LINE") channelScores.line = 30 + engagementScore;
      if (channel === "EMAIL") channelScores.email = 30 + engagementScore;
      if (channel === "SMS") channelScores.sms = 20 + engagementScore;
    }
  }

  // タグベースの調整
  if (input.profile.tags.includes("LINE_ACTIVE")) {
    channelScores.line += 20;
  }
  if (input.profile.tags.includes("EMAIL_ACTIVE")) {
    channelScores.email += 20;
  }

  // 最高スコアのチャネルを選択
  let bestChannel: "LINE" | "EMAIL" | "SMS" = "LINE";
  let maxScore = channelScores.line;

  if (channelScores.email > maxScore) {
    bestChannel = "EMAIL";
    maxScore = channelScores.email;
  }
  if (channelScores.sms > maxScore) {
    bestChannel = "SMS";
    maxScore = channelScores.sms;
  }

  // 正規化
  const total = channelScores.line + channelScores.email + channelScores.sms;
  const normalized = {
    line: channelScores.line / total,
    email: channelScores.email / total,
    sms: channelScores.sms / total,
  };

  return {
    bestChannel,
    confidence: maxScore / 100,
    channelScores: normalized,
    reasoning: `過去のエンゲージメントデータとプロファイルに基づき${bestChannel}を推奨`,
  };
}

// ==================== 次のベストアクション予測 ====================

/**
 * 次に取るべき最適なアクションを予測
 */
export async function predictNextAction(
  input: PredictionInput
): Promise<NextActionPrediction> {
  // 各予測を実行
  const [conversion, churn, channel, sendTime] = await Promise.all([
    predictConversion(input),
    predictChurn(input),
    predictBestChannel(input),
    predictBestSendTime(input),
  ]);

  let action: string;
  let message: string | undefined;
  const alternatives: Array<{ action: string; score: number }> = [];

  // チャーンリスクが高い場合
  if (churn.risk >= 70) {
    action = "緊急リテンションオファーを送信";
    message = "特別な復帰特典をご用意しました。ぜひご確認ください。";
    alternatives.push({ action: "担当者から直接連絡", score: 0.9 });
    alternatives.push({ action: "アンケートを送信", score: 0.7 });
  }
  // コンバージョン確率が高い場合
  else if (conversion.probability >= 0.7) {
    action = "購入促進オファーを送信";
    message = "今なら特別価格でご購入いただけます。";
    alternatives.push({ action: "セールス担当へ引き継ぎ", score: 0.85 });
    alternatives.push({ action: "限定クーポンを配布", score: 0.8 });
  }
  // 中程度の場合
  else if (conversion.probability >= 0.4) {
    action = "成功事例・社会的証明を共有";
    message = "多くのお客様にご満足いただいています。";
    alternatives.push({ action: "ウェビナーに招待", score: 0.7 });
    alternatives.push({ action: "無料トライアルを提案", score: 0.65 });
  }
  // 低い場合
  else {
    action = "ナーチャリングコンテンツを配信";
    message = "役立つ情報をお届けします。";
    alternatives.push({ action: "教育コンテンツを送信", score: 0.6 });
    alternatives.push({ action: "ブログ記事を共有", score: 0.5 });
  }

  return {
    action,
    channel: channel.bestChannel,
    timing: sendTime.bestTime,
    message,
    confidence: Math.max(conversion.confidence, churn.confidence) * channel.confidence,
    alternatives,
  };
}

// ==================== バッチ予測 ====================

/**
 * 複数の顧客に対してバッチ予測を実行
 */
export async function batchPredict(
  inputs: PredictionInput[],
  type: PredictionType
): Promise<Array<{ contactId: string; prediction: unknown }>> {
  const results: Array<{ contactId: string; prediction: unknown }> = [];

  for (const input of inputs) {
    let prediction: unknown;

    switch (type) {
      case "conversion":
        prediction = await predictConversion(input);
        break;
      case "churn":
        prediction = await predictChurn(input);
        break;
      case "ltv":
        prediction = await predictLTV(input);
        break;
      case "best_send_time":
        prediction = await predictBestSendTime(input);
        break;
      case "best_channel":
        prediction = await predictBestChannel(input);
        break;
      case "next_action":
        prediction = await predictNextAction(input);
        break;
      default:
        prediction = null;
    }

    results.push({
      contactId: input.contactId,
      prediction,
    });
  }

  return results;
}
