/**
 * 感情分析エンジン
 * メッセージから感情を分析し、チャーン予兆を検出
 *
 * 根拠:
 * - ev-009: 感情分析市場は2026年に61億ドル規模
 * - ev-010: 感情分析使用企業は顧客維持率が25%高い（Gartner）
 */

import { claude, isAIConfigured } from "./claude";

// ==================== 感情タイプ ====================

export type SentimentType = "positive" | "neutral" | "negative";

export type EmotionType =
  | "joy"          // 喜び
  | "trust"        // 信頼
  | "anticipation" // 期待
  | "interest"     // 興味
  | "satisfaction" // 満足
  | "gratitude"    // 感謝
  | "frustration"  // 不満
  | "anger"        // 怒り
  | "disappointment" // 失望
  | "anxiety"      // 不安
  | "confusion"    // 混乱
  | "urgency"      // 緊急性
  | "indifference" // 無関心

// ==================== 分析結果 ====================

export interface SentimentAnalysisResult {
  sentiment: SentimentType;
  score: number; // 0-100 (0=非常にネガティブ, 50=中立, 100=非常にポジティブ)
  confidence: number; // 0-1

  // 検出された感情
  emotions: {
    type: EmotionType;
    intensity: number; // 0-1
  }[];

  // チャーンシグナル
  churnSignal: {
    detected: boolean;
    risk: "low" | "medium" | "high";
    triggers: string[];
  };

  // エスカレーション推奨
  escalation: {
    recommended: boolean;
    reason?: string;
    priority: "normal" | "high" | "urgent";
  };

  // 推奨アクション
  recommendedActions: string[];

  // 分析メタデータ
  metadata: {
    analyzedAt: Date;
    messageLength: number;
    language: string;
  };
}

// ==================== キーワードベース分析 ====================

// ポジティブキーワード
const POSITIVE_KEYWORDS = [
  { pattern: /ありがとう|感謝/i, weight: 2, emotion: "gratitude" as EmotionType },
  { pattern: /嬉しい|うれしい|喜/i, weight: 2, emotion: "joy" as EmotionType },
  { pattern: /素晴らしい|最高|すごい|すばらしい/i, weight: 3, emotion: "satisfaction" as EmotionType },
  { pattern: /期待|楽しみ|わくわく/i, weight: 2, emotion: "anticipation" as EmotionType },
  { pattern: /満足|良い|いい感じ/i, weight: 2, emotion: "satisfaction" as EmotionType },
  { pattern: /助かり|便利|役立/i, weight: 1, emotion: "gratitude" as EmotionType },
  { pattern: /おすすめ|推奨|オススメ/i, weight: 2, emotion: "trust" as EmotionType },
  { pattern: /購入したい|買いたい|申し込み/i, weight: 3, emotion: "interest" as EmotionType },
];

// ネガティブキーワード
const NEGATIVE_KEYWORDS = [
  { pattern: /不満|不便|使いにくい/i, weight: -2, emotion: "frustration" as EmotionType },
  { pattern: /怒|腹が立つ|ムカつく/i, weight: -3, emotion: "anger" as EmotionType },
  { pattern: /残念|がっかり|期待外れ/i, weight: -2, emotion: "disappointment" as EmotionType },
  { pattern: /不安|心配|懸念/i, weight: -1, emotion: "anxiety" as EmotionType },
  { pattern: /わからない|難しい|複雑/i, weight: -1, emotion: "confusion" as EmotionType },
  { pattern: /遅い|待たされ|対応が悪い/i, weight: -2, emotion: "frustration" as EmotionType },
  { pattern: /返金|キャンセル|解約/i, weight: -3, emotion: "frustration" as EmotionType },
  { pattern: /クレーム|苦情|問題/i, weight: -2, emotion: "anger" as EmotionType },
  { pattern: /詐欺|騙された|嘘/i, weight: -4, emotion: "anger" as EmotionType },
];

// チャーントリガーキーワード
const CHURN_TRIGGERS = [
  { pattern: /解約|退会|やめたい/i, risk: "high" as const, trigger: "解約意向" },
  { pattern: /返金|返品|払い戻し/i, risk: "high" as const, trigger: "返金要求" },
  { pattern: /使わな|もういい|必要ない/i, risk: "medium" as const, trigger: "利用意欲低下" },
  { pattern: /他の|別の|乗り換え/i, risk: "medium" as const, trigger: "競合検討" },
  { pattern: /高い|高額|値段/i, risk: "low" as const, trigger: "価格懸念" },
  { pattern: /対応が遅い|返事がない|無視/i, risk: "medium" as const, trigger: "サポート不満" },
  { pattern: /二度と|絶対|もう/i, risk: "high" as const, trigger: "強い否定" },
];

// エスカレーショントリガー
const ESCALATION_TRIGGERS = [
  { pattern: /訴え|弁護士|法的/i, priority: "urgent" as const, reason: "法的言及" },
  { pattern: /消費者センター|通報|告発/i, priority: "urgent" as const, reason: "通報示唆" },
  { pattern: /SNS|拡散|晒す/i, priority: "high" as const, reason: "SNS拡散示唆" },
  { pattern: /責任者|上司|マネージャー/i, priority: "high" as const, reason: "上席対応要求" },
  { pattern: /今すぐ|至急|緊急/i, priority: "high" as const, reason: "緊急性" },
];

// ==================== ルールベース分析 ====================

/**
 * キーワードベースで感情スコアを計算
 */
export function analyzeWithKeywords(message: string): {
  score: number;
  emotions: { type: EmotionType; intensity: number }[];
  churnTriggers: { risk: "low" | "medium" | "high"; trigger: string }[];
  escalationTriggers: { priority: "normal" | "high" | "urgent"; reason: string }[];
} {
  let score = 50; // 基準値（中立）
  const emotionMap = new Map<EmotionType, number>();
  const churnTriggers: { risk: "low" | "medium" | "high"; trigger: string }[] = [];
  const escalationTriggers: { priority: "normal" | "high" | "urgent"; reason: string }[] = [];

  // ポジティブキーワード検出
  for (const kw of POSITIVE_KEYWORDS) {
    if (kw.pattern.test(message)) {
      score += kw.weight * 5;
      const current = emotionMap.get(kw.emotion) || 0;
      emotionMap.set(kw.emotion, Math.min(1, current + 0.3));
    }
  }

  // ネガティブキーワード検出
  for (const kw of NEGATIVE_KEYWORDS) {
    if (kw.pattern.test(message)) {
      score += kw.weight * 5;
      const current = emotionMap.get(kw.emotion) || 0;
      emotionMap.set(kw.emotion, Math.min(1, current + 0.3));
    }
  }

  // チャーントリガー検出
  for (const trigger of CHURN_TRIGGERS) {
    if (trigger.pattern.test(message)) {
      churnTriggers.push({ risk: trigger.risk, trigger: trigger.trigger });
    }
  }

  // エスカレーショントリガー検出
  for (const trigger of ESCALATION_TRIGGERS) {
    if (trigger.pattern.test(message)) {
      escalationTriggers.push({ priority: trigger.priority, reason: trigger.reason });
    }
  }

  // スコアを0-100に正規化
  score = Math.max(0, Math.min(100, score));

  // 感情を配列に変換
  const emotions = Array.from(emotionMap.entries())
    .map(([type, intensity]) => ({ type, intensity }))
    .sort((a, b) => b.intensity - a.intensity);

  return { score, emotions, churnTriggers, escalationTriggers };
}

// ==================== AI分析 ====================

/**
 * AIを使用して詳細な感情分析を実行
 */
export async function analyzeSentimentWithAI(
  message: string,
  context?: {
    previousMessages?: string[];
    contactName?: string;
    tags?: string[];
  }
): Promise<SentimentAnalysisResult> {
  // まずルールベースで分析
  const keywordResult = analyzeWithKeywords(message);

  // 基本結果を構築
  const baseResult: SentimentAnalysisResult = {
    sentiment: keywordResult.score >= 60 ? "positive" : keywordResult.score <= 40 ? "negative" : "neutral",
    score: keywordResult.score,
    confidence: 0.7,
    emotions: keywordResult.emotions,
    churnSignal: {
      detected: keywordResult.churnTriggers.length > 0,
      risk: keywordResult.churnTriggers[0]?.risk || "low",
      triggers: keywordResult.churnTriggers.map(t => t.trigger),
    },
    escalation: {
      recommended: keywordResult.escalationTriggers.length > 0,
      reason: keywordResult.escalationTriggers[0]?.reason,
      priority: keywordResult.escalationTriggers[0]?.priority || "normal",
    },
    recommendedActions: [],
    metadata: {
      analyzedAt: new Date(),
      messageLength: message.length,
      language: "ja",
    },
  };

  // AI未設定の場合はルールベース結果を返す
  if (!isAIConfigured) {
    baseResult.recommendedActions = generateRecommendedActions(baseResult);
    return baseResult;
  }

  // AI分析を実行
  const prompt = `
あなたは顧客感情分析の専門家です。以下のメッセージを分析してください。

【メッセージ】
${message}

${context?.previousMessages ? `【過去のメッセージ】\n${context.previousMessages.slice(-3).join('\n')}` : ''}

${context?.contactName ? `【顧客名】${context.contactName}` : ''}
${context?.tags ? `【タグ】${context.tags.join(', ')}` : ''}

以下のJSON形式で分析結果を返してください：

{
  "sentiment": "positive|neutral|negative",
  "score": 0-100の数値（50が中立）,
  "confidence": 0-1の信頼度,
  "emotions": [
    {"type": "joy|trust|anticipation|interest|satisfaction|gratitude|frustration|anger|disappointment|anxiety|confusion|urgency|indifference", "intensity": 0-1}
  ],
  "churnSignal": {
    "detected": true/false,
    "risk": "low|medium|high",
    "triggers": ["検出されたトリガー"]
  },
  "escalation": {
    "recommended": true/false,
    "reason": "理由（任意）",
    "priority": "normal|high|urgent"
  },
  "recommendedActions": ["推奨アクション1", "推奨アクション2"]
}

日本語の文脈とニュアンスを正確に理解してください。
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiResult = JSON.parse(jsonMatch[0]);
        return {
          ...aiResult,
          metadata: {
            analyzedAt: new Date(),
            messageLength: message.length,
            language: "ja",
          },
        };
      }
    }
  } catch (error) {
    console.error("AI sentiment analysis error:", error);
  }

  // フォールバック
  baseResult.recommendedActions = generateRecommendedActions(baseResult);
  return baseResult;
}

/**
 * 推奨アクションを生成
 */
function generateRecommendedActions(result: SentimentAnalysisResult): string[] {
  const actions: string[] = [];

  // エスカレーション推奨
  if (result.escalation.recommended) {
    if (result.escalation.priority === "urgent") {
      actions.push("即座に上席へエスカレーション");
    } else if (result.escalation.priority === "high") {
      actions.push("優先的に対応し、必要に応じてエスカレーション");
    }
  }

  // チャーンリスク対応
  if (result.churnSignal.detected) {
    if (result.churnSignal.risk === "high") {
      actions.push("リテンション担当に通知");
      actions.push("特別オファーの検討");
    } else if (result.churnSignal.risk === "medium") {
      actions.push("フォローアップスケジュール設定");
      actions.push("満足度アンケート送付");
    }
  }

  // 感情別対応
  if (result.sentiment === "negative") {
    actions.push("共感を示す返信を心がける");
    actions.push("具体的な解決策を提示");
  } else if (result.sentiment === "positive") {
    actions.push("レビュー依頼の検討");
    actions.push("アップセル/クロスセルの機会");
  }

  return actions.length > 0 ? actions : ["通常対応を継続"];
}

// ==================== バッチ分析 ====================

/**
 * 複数メッセージの感情トレンドを分析
 */
export function analyzeSentimentTrend(
  messages: Array<{ content: string; timestamp: Date }>
): {
  overallSentiment: SentimentType;
  averageScore: number;
  trend: "improving" | "stable" | "declining";
  volatility: number;
  alerts: string[];
} {
  if (messages.length === 0) {
    return {
      overallSentiment: "neutral",
      averageScore: 50,
      trend: "stable",
      volatility: 0,
      alerts: [],
    };
  }

  // 各メッセージのスコアを計算
  const scores = messages.map((m) => analyzeWithKeywords(m.content).score);

  // 平均スコア
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  // トレンド計算（最近3件 vs 全体）
  const recentScores = scores.slice(-3);
  const recentAverage = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const trend: "improving" | "stable" | "declining" =
    recentAverage - averageScore > 10
      ? "improving"
      : recentAverage - averageScore < -10
        ? "declining"
        : "stable";

  // ボラティリティ（標準偏差）
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - averageScore, 2), 0) / scores.length;
  const volatility = Math.sqrt(variance);

  // アラート生成
  const alerts: string[] = [];
  if (trend === "declining") {
    alerts.push("感情トレンドが下降しています");
  }
  if (volatility > 20) {
    alerts.push("感情の変動が大きいです");
  }
  if (recentAverage < 30) {
    alerts.push("直近のメッセージがネガティブです");
  }

  return {
    overallSentiment: averageScore >= 60 ? "positive" : averageScore <= 40 ? "negative" : "neutral",
    averageScore,
    trend,
    volatility,
    alerts,
  };
}

// ==================== ユーティリティ ====================

/**
 * 感情タイプの日本語ラベルを取得
 */
export function getEmotionLabel(emotion: EmotionType): string {
  const labels: Record<EmotionType, string> = {
    joy: "喜び",
    trust: "信頼",
    anticipation: "期待",
    interest: "興味",
    satisfaction: "満足",
    gratitude: "感謝",
    frustration: "不満",
    anger: "怒り",
    disappointment: "失望",
    anxiety: "不安",
    confusion: "混乱",
    urgency: "緊急性",
    indifference: "無関心",
  };
  return labels[emotion] || emotion;
}

/**
 * 感情スコアから色を取得
 */
export function getSentimentColor(score: number): string {
  if (score >= 70) return "#22c55e"; // green
  if (score >= 60) return "#84cc16"; // lime
  if (score >= 40) return "#eab308"; // yellow
  if (score >= 30) return "#f97316"; // orange
  return "#ef4444"; // red
}
