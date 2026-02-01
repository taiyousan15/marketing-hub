/**
 * RFM分析エンジン
 * 顧客をRecency（最終接触日）、Frequency（頻度）、Monetary（金額）で分析・セグメント化
 */

// RFMスコアの定義
export interface RFMScore {
  recency: number; // 1-5
  frequency: number; // 1-5
  monetary: number; // 1-5
  totalScore: number; // 3-15
  segment: RFMSegment;
}

// RFMセグメントの定義
export type RFMSegment =
  | "champions" // 優良顧客
  | "loyal_customers" // ロイヤル顧客
  | "potential_loyalists" // 潜在ロイヤル顧客
  | "new_customers" // 新規顧客
  | "promising" // 有望顧客
  | "need_attention" // 要注意顧客
  | "about_to_sleep" // 休眠予備軍
  | "at_risk" // リスク顧客
  | "cant_lose_them" // 失ってはいけない顧客
  | "hibernating" // 休眠顧客
  | "lost" // 離脱顧客

// セグメント定義
const SEGMENT_DEFINITIONS: Record<
  RFMSegment,
  {
    name: string;
    description: string;
    color: string;
    recommendedActions: string[];
    rfmRange: { r: number[]; f: number[]; m: number[] };
  }
> = {
  champions: {
    name: "チャンピオン",
    description: "最近購入、頻繁に購入、高額購入の最優良顧客",
    color: "#22c55e",
    recommendedActions: [
      "VIP特典の提供",
      "新商品の先行案内",
      "レビュー・紹介依頼",
      "アンバサダープログラム案内",
    ],
    rfmRange: { r: [4, 5], f: [4, 5], m: [4, 5] },
  },
  loyal_customers: {
    name: "ロイヤル顧客",
    description: "定期的に購入し、高いエンゲージメントを示す顧客",
    color: "#16a34a",
    recommendedActions: [
      "ロイヤルティプログラム案内",
      "限定オファー",
      "クロスセル提案",
    ],
    rfmRange: { r: [2, 5], f: [3, 5], m: [3, 5] },
  },
  potential_loyalists: {
    name: "潜在ロイヤル顧客",
    description: "最近購入した顧客で、リピート化の可能性が高い",
    color: "#84cc16",
    recommendedActions: [
      "リピート購入促進",
      "メンバーシップ案内",
      "レビュー依頼",
    ],
    rfmRange: { r: [3, 5], f: [1, 3], m: [1, 3] },
  },
  new_customers: {
    name: "新規顧客",
    description: "最近初めて購入した顧客",
    color: "#06b6d4",
    recommendedActions: [
      "ウェルカムシリーズ配信",
      "使い方ガイド送付",
      "2回目購入特典",
    ],
    rfmRange: { r: [4, 5], f: [1, 1], m: [1, 5] },
  },
  promising: {
    name: "有望顧客",
    description: "最近のリピーターだが、まだ購入額は低い",
    color: "#0ea5e9",
    recommendedActions: [
      "アップセル提案",
      "バンドル商品案内",
      "ポイント還元キャンペーン",
    ],
    rfmRange: { r: [3, 4], f: [1, 1], m: [1, 1] },
  },
  need_attention: {
    name: "要注意顧客",
    description: "以前は活発だったが、最近の活動が減少",
    color: "#eab308",
    recommendedActions: [
      "パーソナライズドオファー",
      "アンケート送付",
      "限定クーポン配布",
    ],
    rfmRange: { r: [2, 3], f: [2, 3], m: [2, 3] },
  },
  about_to_sleep: {
    name: "休眠予備軍",
    description: "しばらく購入がなく、離脱のリスクがある",
    color: "#f97316",
    recommendedActions: [
      "再エンゲージメントキャンペーン",
      "特別割引オファー",
      "新商品案内",
    ],
    rfmRange: { r: [2, 3], f: [1, 2], m: [1, 2] },
  },
  at_risk: {
    name: "リスク顧客",
    description: "購入頻度・金額は高かったが、最近活動がない",
    color: "#ef4444",
    recommendedActions: [
      "緊急リテンションオファー",
      "個別フォローアップ",
      "フィードバック依頼",
    ],
    rfmRange: { r: [1, 2], f: [2, 5], m: [2, 5] },
  },
  cant_lose_them: {
    name: "失ってはいけない顧客",
    description: "過去の優良顧客だが、最近購入がない",
    color: "#dc2626",
    recommendedActions: [
      "最優先でのパーソナル対応",
      "特別復帰オファー",
      "VIP担当者からの連絡",
    ],
    rfmRange: { r: [1, 1], f: [4, 5], m: [4, 5] },
  },
  hibernating: {
    name: "休眠顧客",
    description: "長期間購入がない顧客",
    color: "#6b7280",
    recommendedActions: [
      "復帰キャンペーン",
      "ブランドリマインダー",
      "大幅割引オファー",
    ],
    rfmRange: { r: [1, 2], f: [1, 2], m: [1, 2] },
  },
  lost: {
    name: "離脱顧客",
    description: "非常に長期間活動がなく、離脱した可能性が高い",
    color: "#374151",
    recommendedActions: [
      "最終アプローチ",
      "退会理由アンケート",
      "リスト整理検討",
    ],
    rfmRange: { r: [1, 1], f: [1, 1], m: [1, 1] },
  },
};

// 顧客データの型定義
export interface CustomerData {
  id: string;
  lastPurchaseDate: Date | null;
  purchaseCount: number;
  totalSpent: number;
}

// RFM分析設定
export interface RFMConfig {
  recencyDays: number[]; // 例: [30, 60, 90, 180] → 30日以内=5, 31-60日=4...
  frequencyThresholds: number[]; // 例: [1, 2, 5, 10] → 10回以上=5, 5-9回=4...
  monetaryThresholds: number[]; // 例: [1000, 5000, 20000, 50000] → 50000以上=5...
}

// デフォルト設定
const DEFAULT_CONFIG: RFMConfig = {
  recencyDays: [30, 60, 90, 180],
  frequencyThresholds: [1, 3, 5, 10],
  monetaryThresholds: [5000, 10000, 30000, 100000],
};

/**
 * Recencyスコアを計算（最終購入日からの日数）
 */
export function calculateRecencyScore(
  lastPurchaseDate: Date | null,
  config: RFMConfig = DEFAULT_CONFIG
): number {
  if (!lastPurchaseDate) return 1;

  const daysSinceLastPurchase = Math.floor(
    (Date.now() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  for (let i = 0; i < config.recencyDays.length; i++) {
    if (daysSinceLastPurchase <= config.recencyDays[i]) {
      return 5 - i;
    }
  }
  return 1;
}

/**
 * Frequencyスコアを計算（購入回数）
 */
export function calculateFrequencyScore(
  purchaseCount: number,
  config: RFMConfig = DEFAULT_CONFIG
): number {
  for (let i = config.frequencyThresholds.length - 1; i >= 0; i--) {
    if (purchaseCount >= config.frequencyThresholds[i]) {
      return i + 2;
    }
  }
  return 1;
}

/**
 * Monetaryスコアを計算（累計購入金額）
 */
export function calculateMonetaryScore(
  totalSpent: number,
  config: RFMConfig = DEFAULT_CONFIG
): number {
  for (let i = config.monetaryThresholds.length - 1; i >= 0; i--) {
    if (totalSpent >= config.monetaryThresholds[i]) {
      return i + 2;
    }
  }
  return 1;
}

/**
 * RFMスコアからセグメントを決定
 */
export function determineSegment(
  r: number,
  f: number,
  m: number
): RFMSegment {
  // スコアの組み合わせでセグメントを決定
  for (const [segment, def] of Object.entries(SEGMENT_DEFINITIONS)) {
    const { rfmRange } = def;
    if (
      r >= rfmRange.r[0] &&
      r <= rfmRange.r[1] &&
      f >= rfmRange.f[0] &&
      f <= rfmRange.f[1] &&
      m >= rfmRange.m[0] &&
      m <= rfmRange.m[1]
    ) {
      return segment as RFMSegment;
    }
  }

  // デフォルト
  if (r >= 4) return "potential_loyalists";
  if (r >= 2 && f >= 2) return "need_attention";
  return "hibernating";
}

/**
 * 顧客のRFMスコアを計算
 */
export function calculateRFMScore(
  customer: CustomerData,
  config: RFMConfig = DEFAULT_CONFIG
): RFMScore {
  const recency = calculateRecencyScore(customer.lastPurchaseDate, config);
  const frequency = calculateFrequencyScore(customer.purchaseCount, config);
  const monetary = calculateMonetaryScore(customer.totalSpent, config);

  const segment = determineSegment(recency, frequency, monetary);

  return {
    recency,
    frequency,
    monetary,
    totalScore: recency + frequency + monetary,
    segment,
  };
}

/**
 * セグメントの詳細情報を取得
 */
export function getSegmentDetails(segment: RFMSegment) {
  return SEGMENT_DEFINITIONS[segment];
}

/**
 * 複数顧客のRFM分析を実行
 */
export function analyzeCustomers(
  customers: CustomerData[],
  config: RFMConfig = DEFAULT_CONFIG
): Array<CustomerData & { rfm: RFMScore }> {
  return customers.map((customer) => ({
    ...customer,
    rfm: calculateRFMScore(customer, config),
  }));
}

/**
 * セグメント別の顧客数を集計
 */
export function getSegmentDistribution(
  customers: Array<{ rfm: RFMScore }>
): Record<RFMSegment, number> {
  const distribution: Record<RFMSegment, number> = {
    champions: 0,
    loyal_customers: 0,
    potential_loyalists: 0,
    new_customers: 0,
    promising: 0,
    need_attention: 0,
    about_to_sleep: 0,
    at_risk: 0,
    cant_lose_them: 0,
    hibernating: 0,
    lost: 0,
  };

  for (const customer of customers) {
    distribution[customer.rfm.segment]++;
  }

  return distribution;
}

/**
 * セグメントに基づいて推奨アクションを取得
 */
export function getRecommendedActions(segment: RFMSegment): string[] {
  return SEGMENT_DEFINITIONS[segment].recommendedActions;
}

/**
 * RFMスコアを基にしたリードスコアを計算（0-100）
 */
export function calculateLeadScore(rfm: RFMScore): number {
  // 重み付け: Recency 40%, Frequency 35%, Monetary 25%
  const weightedScore =
    rfm.recency * 0.4 + rfm.frequency * 0.35 + rfm.monetary * 0.25;

  // 1-5スケールを0-100スケールに変換
  return Math.round((weightedScore - 1) * 25);
}

/**
 * セグメント別の推奨ステップシーケンスを取得
 */
export function getRecommendedSequence(
  segment: RFMSegment
): {
  sequenceType: string;
  messages: Array<{
    day: number;
    channel: "LINE" | "EMAIL";
    template: string;
  }>;
} {
  const sequences: Record<
    RFMSegment,
    ReturnType<typeof getRecommendedSequence>
  > = {
    champions: {
      sequenceType: "VIP_NURTURING",
      messages: [
        { day: 0, channel: "LINE", template: "vip_welcome" },
        { day: 3, channel: "EMAIL", template: "exclusive_preview" },
        { day: 7, channel: "LINE", template: "ambassador_invite" },
      ],
    },
    loyal_customers: {
      sequenceType: "LOYALTY_PROGRAM",
      messages: [
        { day: 0, channel: "LINE", template: "loyalty_reward" },
        { day: 5, channel: "EMAIL", template: "points_reminder" },
        { day: 10, channel: "LINE", template: "exclusive_offer" },
      ],
    },
    potential_loyalists: {
      sequenceType: "CONVERSION_NURTURING",
      messages: [
        { day: 0, channel: "LINE", template: "thank_you_first_purchase" },
        { day: 3, channel: "EMAIL", template: "product_tips" },
        { day: 7, channel: "LINE", template: "second_purchase_incentive" },
      ],
    },
    new_customers: {
      sequenceType: "ONBOARDING",
      messages: [
        { day: 0, channel: "LINE", template: "welcome" },
        { day: 1, channel: "EMAIL", template: "getting_started" },
        { day: 3, channel: "LINE", template: "tips_and_support" },
        { day: 7, channel: "EMAIL", template: "feedback_request" },
      ],
    },
    promising: {
      sequenceType: "ENGAGEMENT",
      messages: [
        { day: 0, channel: "LINE", template: "engagement_boost" },
        { day: 4, channel: "EMAIL", template: "product_recommendations" },
        { day: 8, channel: "LINE", template: "special_offer" },
      ],
    },
    need_attention: {
      sequenceType: "RE_ENGAGEMENT",
      messages: [
        { day: 0, channel: "LINE", template: "we_miss_you" },
        { day: 3, channel: "EMAIL", template: "whats_new" },
        { day: 7, channel: "LINE", template: "comeback_offer" },
      ],
    },
    about_to_sleep: {
      sequenceType: "WAKE_UP",
      messages: [
        { day: 0, channel: "LINE", template: "reactivation_offer" },
        { day: 5, channel: "EMAIL", template: "last_chance" },
      ],
    },
    at_risk: {
      sequenceType: "RETENTION",
      messages: [
        { day: 0, channel: "LINE", template: "urgent_comeback" },
        { day: 2, channel: "EMAIL", template: "feedback_request" },
        { day: 5, channel: "LINE", template: "exclusive_retention_offer" },
      ],
    },
    cant_lose_them: {
      sequenceType: "VIP_RETENTION",
      messages: [
        { day: 0, channel: "LINE", template: "vip_personal_message" },
        { day: 1, channel: "EMAIL", template: "vip_exclusive_offer" },
        { day: 3, channel: "LINE", template: "personal_follow_up" },
      ],
    },
    hibernating: {
      sequenceType: "REACTIVATION",
      messages: [
        { day: 0, channel: "EMAIL", template: "reactivation_campaign" },
        { day: 7, channel: "LINE", template: "final_offer" },
      ],
    },
    lost: {
      sequenceType: "FINAL_ATTEMPT",
      messages: [
        { day: 0, channel: "EMAIL", template: "final_goodbye" },
      ],
    },
  };

  return sequences[segment];
}
