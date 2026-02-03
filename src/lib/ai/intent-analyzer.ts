/**
 * 購買意欲・心理分析エンジン
 * ユーザーの行動とメッセージから購買意欲と心理状態を分析
 */

import { claude, isAIConfigured } from "./claude";

// ==================== 購買意欲レベル ====================

export type PurchaseIntentLevel =
  | "very_high"   // 今すぐ購入したい
  | "high"        // 購入意欲が高い
  | "medium"      // 検討中
  | "low"         // 興味はあるが購入予定なし
  | "very_low"    // 興味なし
  | "unknown";    // 判断不能

// ==================== 心理的障壁 ====================

export type PurchaseBarrier =
  | "price"           // 価格が高い
  | "timing"          // タイミングが悪い
  | "trust"           // 信頼できない
  | "need"            // 必要性を感じない
  | "comparison"      // 他と比較中
  | "authority"       // 決定権がない
  | "information"     // 情報不足
  | "urgency"         // 急いでいない
  | "past_experience" // 過去の悪い経験
  | "none";           // 障壁なし

// ==================== 顧客の心理フェーズ ====================

export type CustomerPsychologyPhase =
  | "unaware"         // 問題に気づいていない
  | "problem_aware"   // 問題に気づいている
  | "solution_aware"  // 解決策があることを知っている
  | "product_aware"   // この商品を知っている
  | "most_aware"      // 商品をよく知っていて購入検討中

// ==================== インテント分析結果 ====================

export interface IntentAnalysisResult {
  // 購買意欲
  purchaseIntent: {
    level: PurchaseIntentLevel;
    score: number; // 0-100
    confidence: number; // 0-1
    signals: string[]; // 判断根拠
  };

  // 心理的障壁
  barriers: {
    primary: PurchaseBarrier | null;
    secondary: PurchaseBarrier[];
    details: string;
  };

  // 心理フェーズ
  psychologyPhase: CustomerPsychologyPhase;

  // 感情状態
  emotionalState: {
    sentiment: "positive" | "neutral" | "negative";
    emotions: string[]; // 興味、不安、期待、懐疑 など
    urgency: "high" | "medium" | "low";
  };

  // 推奨アプローチ
  recommendedApproach: {
    strategy: string;
    messageType: string;
    keyPoints: string[];
    avoidPoints: string[];
  };

  // 分岐推奨
  suggestedBranch: string;
}

// ==================== 購買意欲シグナル ====================

// 高い購買意欲を示すシグナル
const HIGH_INTENT_SIGNALS = [
  { pattern: /価格|料金|費用|いくら|値段/i, weight: 3, signal: "価格への関心" },
  { pattern: /申し込み|購入|注文|買いたい|欲しい/i, weight: 5, signal: "購入意思表示" },
  { pattern: /支払い|クレジット|分割|決済/i, weight: 4, signal: "支払い方法への関心" },
  { pattern: /いつから|開始|スタート|始め/i, weight: 3, signal: "開始時期への関心" },
  { pattern: /特典|割引|キャンペーン|クーポン/i, weight: 3, signal: "特典への関心" },
  { pattern: /在庫|残り|限定|締め切り/i, weight: 4, signal: "緊急性の確認" },
  { pattern: /詳細|もっと|具体的/i, weight: 2, signal: "詳細情報要求" },
];

// 低い購買意欲を示すシグナル
const LOW_INTENT_SIGNALS = [
  { pattern: /今は|後で|また|いつか/i, weight: -2, signal: "先延ばし" },
  { pattern: /高い|高額|予算|お金がない/i, weight: -3, signal: "価格障壁" },
  { pattern: /必要ない|いらない|不要/i, weight: -4, signal: "必要性否定" },
  { pattern: /検討|考え|比較|他の/i, weight: -1, signal: "比較検討中" },
  { pattern: /解除|やめ|キャンセル|退会/i, weight: -5, signal: "離脱意向" },
  { pattern: /わからない|難しい|複雑/i, weight: -2, signal: "理解不足" },
];

// ==================== 行動ベースのシグナル ====================

export interface BehaviorSignal {
  type: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// 高意欲を示す行動パターン
const HIGH_INTENT_BEHAVIORS: Record<string, number> = {
  "PRICING_PAGE_VIEW": 15,
  "CHECKOUT_START": 25,
  "CART_ADD": 20,
  "FAQ_VIEW": 10,
  "TESTIMONIAL_VIEW": 10,
  "COMPARISON_VIEW": 8,
  "MULTIPLE_PRODUCT_VIEW": 12,
  "RETURN_VISIT": 15,
  "LONG_SESSION": 10,
  "VIDEO_COMPLETE": 15,
  "FORM_START": 18,
};

// 低意欲を示す行動パターン
const LOW_INTENT_BEHAVIORS: Record<string, number> = {
  "QUICK_EXIT": -10,
  "CART_ABANDON": -15,
  "UNSUBSCRIBE_PAGE": -20,
  "NO_ENGAGEMENT": -5,
  "BOUNCE": -8,
};

// ==================== 購買意欲スコア計算 ====================

/**
 * メッセージから購買意欲スコアを計算
 */
export function calculateIntentScoreFromMessage(message: string): {
  score: number;
  signals: string[];
} {
  let score = 50; // 基準値
  const signals: string[] = [];

  // 高意欲シグナルをチェック
  for (const signal of HIGH_INTENT_SIGNALS) {
    if (signal.pattern.test(message)) {
      score += signal.weight * 5;
      signals.push(`✓ ${signal.signal}`);
    }
  }

  // 低意欲シグナルをチェック
  for (const signal of LOW_INTENT_SIGNALS) {
    if (signal.pattern.test(message)) {
      score += signal.weight * 5;
      signals.push(`✗ ${signal.signal}`);
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    signals,
  };
}

/**
 * 行動履歴から購買意欲スコアを計算
 */
export function calculateIntentScoreFromBehaviors(
  behaviors: BehaviorSignal[],
  lookbackDays: number = 7
): {
  score: number;
  signals: string[];
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

  let score = 50;
  const signals: string[] = [];
  const recentBehaviors = behaviors.filter((b) => b.timestamp >= cutoffDate);

  // 行動パターンを分析
  const behaviorCounts: Record<string, number> = {};
  for (const behavior of recentBehaviors) {
    behaviorCounts[behavior.type] = (behaviorCounts[behavior.type] || 0) + 1;
  }

  // 高意欲行動
  for (const [behaviorType, weight] of Object.entries(HIGH_INTENT_BEHAVIORS)) {
    if (behaviorCounts[behaviorType]) {
      const count = behaviorCounts[behaviorType];
      score += weight * Math.min(count, 3); // 最大3回までカウント
      signals.push(`✓ ${behaviorType} (${count}回)`);
    }
  }

  // 低意欲行動
  for (const [behaviorType, weight] of Object.entries(LOW_INTENT_BEHAVIORS)) {
    if (behaviorCounts[behaviorType]) {
      const count = behaviorCounts[behaviorType];
      score += weight * Math.min(count, 3);
      signals.push(`✗ ${behaviorType} (${count}回)`);
    }
  }

  // エンゲージメント頻度ボーナス
  const engagementRate = recentBehaviors.length / lookbackDays;
  if (engagementRate > 2) {
    score += 15;
    signals.push("✓ 高エンゲージメント");
  } else if (engagementRate < 0.5) {
    score -= 10;
    signals.push("✗ 低エンゲージメント");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    signals,
  };
}

/**
 * 購買意欲レベルを決定
 */
export function determineIntentLevel(score: number): PurchaseIntentLevel {
  if (score >= 85) return "very_high";
  if (score >= 70) return "high";
  if (score >= 50) return "medium";
  if (score >= 30) return "low";
  if (score >= 0) return "very_low";
  return "unknown";
}

// ==================== AI分析 ====================

/**
 * AIを使用して詳細な購買意欲・心理分析を実行
 */
export async function analyzeIntentWithAI(
  messages: Array<{ content: string; sender: "user" | "operator"; timestamp: Date }>,
  behaviors: BehaviorSignal[],
  contactProfile?: {
    tags?: string[];
    purchaseHistory?: Array<{ productName: string; date: Date; amount: number }>;
    score?: number;
  }
): Promise<IntentAnalysisResult> {
  // まずルールベースでスコアを計算
  const recentMessages = messages.slice(-10);
  const userMessages = recentMessages
    .filter((m) => m.sender === "user")
    .map((m) => m.content)
    .join("\n");

  const messageIntent = calculateIntentScoreFromMessage(userMessages);
  const behaviorIntent = calculateIntentScoreFromBehaviors(behaviors);

  // 総合スコア（メッセージ60%、行動40%）
  const combinedScore = Math.round(
    messageIntent.score * 0.6 + behaviorIntent.score * 0.4
  );
  const intentLevel = determineIntentLevel(combinedScore);

  // AIが設定されていない場合はルールベースの結果を返す
  if (!isAIConfigured) {
    return createRuleBasedResult(
      combinedScore,
      intentLevel,
      [...messageIntent.signals, ...behaviorIntent.signals]
    );
  }

  // AI分析を実行
  const prompt = `
あなたはマーケティング心理分析の専門家です。以下の顧客データを分析し、購買意欲と心理状態を判定してください。

【顧客のメッセージ履歴（最新10件）】
${recentMessages.map((m) => `[${m.sender === "user" ? "顧客" : "担当者"}] ${m.content}`).join("\n")}

【行動履歴（直近7日間）】
${behaviors.slice(-20).map((b) => `- ${b.type} (${b.timestamp.toLocaleDateString("ja-JP")})`).join("\n")}

【プロファイル情報】
- タグ: ${contactProfile?.tags?.join(", ") || "なし"}
- 過去の購入: ${contactProfile?.purchaseHistory?.length || 0}回
- 現在のスコア: ${contactProfile?.score || "未設定"}

【ルールベース分析結果】
- 購買意欲スコア: ${combinedScore}/100
- 検出シグナル: ${[...messageIntent.signals, ...behaviorIntent.signals].join(", ")}

以下のJSON形式で詳細な分析結果を返してください：

{
  "purchaseIntent": {
    "level": "very_high|high|medium|low|very_low",
    "score": 0-100の数値,
    "confidence": 0-1の信頼度,
    "signals": ["判断根拠1", "判断根拠2", ...]
  },
  "barriers": {
    "primary": "price|timing|trust|need|comparison|authority|information|urgency|past_experience|none",
    "secondary": ["障壁2", "障壁3"],
    "details": "障壁の詳細説明（日本語）"
  },
  "psychologyPhase": "unaware|problem_aware|solution_aware|product_aware|most_aware",
  "emotionalState": {
    "sentiment": "positive|neutral|negative",
    "emotions": ["興味", "不安", "期待" など],
    "urgency": "high|medium|low"
  },
  "recommendedApproach": {
    "strategy": "推奨戦略（日本語で簡潔に）",
    "messageType": "education|nurturing|social_proof|urgency|objection_handling|direct_offer",
    "keyPoints": ["伝えるべきポイント1", "ポイント2"],
    "avoidPoints": ["避けるべきこと1", "避けること2"]
  },
  "suggestedBranch": "分岐先のID（purchase_ready|nurturing|education|objection_price|objection_trust|reengagement）"
}
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]) as IntentAnalysisResult;
        return result;
      }
    }
  } catch (error) {
    console.error("AI intent analysis error:", error);
  }

  // フォールバック
  return createRuleBasedResult(
    combinedScore,
    intentLevel,
    [...messageIntent.signals, ...behaviorIntent.signals]
  );
}

/**
 * ルールベースの結果を作成
 */
function createRuleBasedResult(
  score: number,
  level: PurchaseIntentLevel,
  signals: string[]
): IntentAnalysisResult {
  // 購買意欲レベルに基づいて推奨アプローチを決定
  const approaches: Record<PurchaseIntentLevel, IntentAnalysisResult["recommendedApproach"]> = {
    very_high: {
      strategy: "即座に購入を促す直接的なアプローチ",
      messageType: "direct_offer",
      keyPoints: ["限定特典の提示", "簡単な購入手順の案内", "サポート体制の説明"],
      avoidPoints: ["過度な説明", "不要な情報提供"],
    },
    high: {
      strategy: "社会的証明と緊急性を組み合わせたアプローチ",
      messageType: "urgency",
      keyPoints: ["お客様の声・実績", "期間限定オファー", "具体的なメリット"],
      avoidPoints: ["押し売り感", "曖昧な表現"],
    },
    medium: {
      strategy: "価値を伝えながら信頼を構築するナーチャリング",
      messageType: "nurturing",
      keyPoints: ["具体的な成功事例", "ステップバイステップの説明", "Q&A対応"],
      avoidPoints: ["急かす表現", "一方的な情報提供"],
    },
    low: {
      strategy: "問題意識を高める教育的アプローチ",
      messageType: "education",
      keyPoints: ["問題提起", "解決策の提示", "小さなコミットメント要求"],
      avoidPoints: ["商品の直接的な宣伝", "購入プレッシャー"],
    },
    very_low: {
      strategy: "関係性の再構築とリエンゲージメント",
      messageType: "education",
      keyPoints: ["無料コンテンツの提供", "問題の再認識", "新しい情報の提供"],
      avoidPoints: ["セールストーク", "頻繁な連絡"],
    },
    unknown: {
      strategy: "情報収集のためのエンゲージメント",
      messageType: "nurturing",
      keyPoints: ["質問による対話", "興味の把握", "価値提供"],
      avoidPoints: ["決めつけ", "一方的なメッセージ"],
    },
  };

  const branchMapping: Record<PurchaseIntentLevel, string> = {
    very_high: "purchase_ready",
    high: "purchase_ready",
    medium: "nurturing",
    low: "education",
    very_low: "reengagement",
    unknown: "nurturing",
  };

  return {
    purchaseIntent: {
      level,
      score,
      confidence: 0.7,
      signals,
    },
    barriers: {
      primary: score < 50 ? "need" : null,
      secondary: [],
      details: score < 50 ? "必要性をまだ感じていない可能性があります" : "",
    },
    psychologyPhase: score >= 70 ? "most_aware" : score >= 50 ? "product_aware" : "solution_aware",
    emotionalState: {
      sentiment: score >= 60 ? "positive" : score >= 40 ? "neutral" : "negative",
      emotions: score >= 60 ? ["興味", "期待"] : ["検討中", "慎重"],
      urgency: score >= 70 ? "high" : score >= 50 ? "medium" : "low",
    },
    recommendedApproach: approaches[level],
    suggestedBranch: branchMapping[level],
  };
}

// ==================== 分岐決定 ====================

export interface BranchDecision {
  branchId: string;
  branchName: string;
  confidence: number;
  reasoning: string;
  nextActions: string[];
}

/**
 * 購買意欲分析に基づいて最適な分岐を決定
 */
export function decideBranch(analysis: IntentAnalysisResult): BranchDecision {
  const branches: Record<string, { name: string; description: string; actions: string[] }> = {
    purchase_ready: {
      name: "購入準備完了",
      description: "高い購買意欲。直接オファーを提示",
      actions: [
        "限定オファーの送信",
        "購入リンクの提示",
        "サポート担当の通知",
      ],
    },
    nurturing: {
      name: "ナーチャリング",
      description: "中程度の意欲。信頼構築を継続",
      actions: [
        "成功事例の共有",
        "無料コンテンツの提供",
        "Q&A対応",
      ],
    },
    education: {
      name: "教育フェーズ",
      description: "低い意欲。問題意識を高める",
      actions: [
        "教育コンテンツの配信",
        "問題提起メッセージ",
        "無料診断の案内",
      ],
    },
    objection_price: {
      name: "価格障壁対応",
      description: "価格に懸念。価値訴求と分割案内",
      actions: [
        "ROI・費用対効果の説明",
        "分割払いの案内",
        "限定割引の提示",
      ],
    },
    objection_trust: {
      name: "信頼構築",
      description: "信頼に課題。実績と保証を強調",
      actions: [
        "お客様の声の共有",
        "実績データの提示",
        "保証制度の説明",
      ],
    },
    reengagement: {
      name: "リエンゲージメント",
      description: "興味が低い。関係性の再構築",
      actions: [
        "新情報・アップデートの共有",
        "無料プレゼントの提供",
        "アンケート送付",
      ],
    },
  };

  // 障壁がある場合は障壁対応分岐を優先
  let branchId = analysis.suggestedBranch;

  if (analysis.barriers.primary === "price") {
    branchId = "objection_price";
  } else if (analysis.barriers.primary === "trust") {
    branchId = "objection_trust";
  }

  const branch = branches[branchId] || branches.nurturing;

  return {
    branchId,
    branchName: branch.name,
    confidence: analysis.purchaseIntent.confidence,
    reasoning: `購買意欲: ${analysis.purchaseIntent.level} (${analysis.purchaseIntent.score}点), ` +
      `心理フェーズ: ${analysis.psychologyPhase}, ` +
      `主な障壁: ${analysis.barriers.primary || "なし"}`,
    nextActions: branch.actions,
  };
}

// ==================== メッセージ生成 ====================

/**
 * 購買意欲レベルに合わせたメッセージを生成
 */
export async function generateIntentBasedMessage(
  analysis: IntentAnalysisResult,
  templateContent: string,
  contactName?: string
): Promise<string> {
  if (!isAIConfigured) {
    return templateContent.replace(/\{\{name\}\}/g, contactName || "お客様");
  }

  const prompt = `
以下の顧客心理分析に基づいて、テンプレートメッセージをパーソナライズしてください。

【顧客分析】
- 購買意欲: ${analysis.purchaseIntent.level} (${analysis.purchaseIntent.score}/100)
- 心理フェーズ: ${analysis.psychologyPhase}
- 感情: ${analysis.emotionalState.emotions.join(", ")}
- 主な障壁: ${analysis.barriers.primary || "なし"}
- 障壁詳細: ${analysis.barriers.details}

【推奨アプローチ】
- 戦略: ${analysis.recommendedApproach.strategy}
- メッセージタイプ: ${analysis.recommendedApproach.messageType}
- 伝えるべき点: ${analysis.recommendedApproach.keyPoints.join(", ")}
- 避けるべき点: ${analysis.recommendedApproach.avoidPoints.join(", ")}

【テンプレート】
${templateContent}

【顧客名】
${contactName || "お客様"}

上記の分析に基づいてパーソナライズされたメッセージを生成してください。
- LINEメッセージとして適切な長さ（150-250文字）
- 顧客の心理状態に寄り添った表現
- 推奨アプローチに沿った内容
- 自然な日本語で

メッセージ本文のみを返してください。
`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      return content.text.trim();
    }
  } catch (error) {
    console.error("Message generation error:", error);
  }

  return templateContent.replace(/\{\{name\}\}/g, contactName || "お客様");
}
