/**
 * A/Bテスト最適化エンジン
 * Multi-Armed Banditアルゴリズムによる動的トラフィック配分と自動勝者決定
 *
 * 根拠:
 * - ev-011: AIパーソナライゼーションで23%コンバージョン増（SuperAGI）
 * - 2026年にマーケティング自動化の80%がAI化（Gartner）
 */

// ==================== A/Bテスト設定 ====================

export type ABTestAlgorithm =
  | "epsilon_greedy"    // イプシロン貪欲法
  | "ucb1"              // Upper Confidence Bound
  | "thompson_sampling" // トンプソンサンプリング
  | "fixed_split";      // 固定分割（従来型）

export type ABTestStatus =
  | "draft"
  | "running"
  | "paused"
  | "completed"
  | "auto_completed";

export type ABTestMetric =
  | "open_rate"
  | "click_rate"
  | "conversion_rate"
  | "revenue";

// ==================== バリアント ====================

export interface ABVariant {
  id: string;
  name: string;
  content: string;

  // 配分
  weight: number; // 0-100（fixed_splitの場合のみ使用）

  // 統計
  stats: {
    impressions: number;
    conversions: number;
    revenue?: number;
    opens?: number;
    clicks?: number;
  };
}

// ==================== A/Bテスト ====================

export interface ABTest {
  id: string;
  name: string;
  description?: string;

  status: ABTestStatus;
  algorithm: ABTestAlgorithm;
  metric: ABTestMetric;

  variants: ABVariant[];

  // アルゴリズムパラメータ
  params: {
    epsilon?: number; // epsilon_greedy用（0-1）
    minSampleSize?: number; // 最小サンプルサイズ
    confidenceLevel?: number; // 信頼水準（0.9, 0.95, 0.99）
    maxDuration?: number; // 最大期間（日）
  };

  // タイミング
  startedAt?: Date;
  endedAt?: Date;
  createdAt: Date;

  // 結果
  winnerId?: string;
  winnerConfidence?: number;
}

// ==================== Multi-Armed Bandit ====================

/**
 * イプシロン貪欲法によるバリアント選択
 */
export function selectVariantEpsilonGreedy(
  variants: ABVariant[],
  epsilon: number = 0.1
): string {
  // 探索（epsilon確率でランダム選択）
  if (Math.random() < epsilon) {
    const randomIndex = Math.floor(Math.random() * variants.length);
    return variants[randomIndex].id;
  }

  // 活用（最高のコンバージョン率を持つバリアントを選択）
  let bestVariant = variants[0];
  let bestRate = 0;

  for (const variant of variants) {
    const rate = variant.stats.impressions > 0
      ? variant.stats.conversions / variant.stats.impressions
      : 0;
    if (rate > bestRate) {
      bestRate = rate;
      bestVariant = variant;
    }
  }

  return bestVariant.id;
}

/**
 * UCB1アルゴリズムによるバリアント選択
 */
export function selectVariantUCB1(
  variants: ABVariant[],
  totalImpressions: number
): string {
  let bestVariant = variants[0];
  let bestScore = -Infinity;

  for (const variant of variants) {
    if (variant.stats.impressions === 0) {
      // 未探索のバリアントを優先
      return variant.id;
    }

    const avgReward = variant.stats.conversions / variant.stats.impressions;
    const exploration = Math.sqrt(
      (2 * Math.log(totalImpressions)) / variant.stats.impressions
    );
    const ucbScore = avgReward + exploration;

    if (ucbScore > bestScore) {
      bestScore = ucbScore;
      bestVariant = variant;
    }
  }

  return bestVariant.id;
}

/**
 * トンプソンサンプリングによるバリアント選択
 */
export function selectVariantThompsonSampling(variants: ABVariant[]): string {
  let bestVariant = variants[0];
  let bestSample = -Infinity;

  for (const variant of variants) {
    // Beta分布からサンプリング（簡易実装）
    const alpha = variant.stats.conversions + 1;
    const beta = variant.stats.impressions - variant.stats.conversions + 1;
    const sample = betaSample(alpha, beta);

    if (sample > bestSample) {
      bestSample = sample;
      bestVariant = variant;
    }
  }

  return bestVariant.id;
}

/**
 * Beta分布からのサンプリング（簡易実装）
 */
function betaSample(alpha: number, beta: number): number {
  // Box-Muller変換を使用した近似
  const x = gammaSample(alpha);
  const y = gammaSample(beta);
  return x / (x + y);
}

function gammaSample(shape: number): number {
  // 簡易的なガンマサンプリング
  if (shape < 1) {
    return gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    let x: number;
    let v: number;

    do {
      x = normalSample();
      v = 1 + c * x;
    } while (v <= 0);

    v = v * v * v;
    const u = Math.random();

    if (u < 1 - 0.0331 * x * x * x * x) {
      return d * v;
    }

    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

function normalSample(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * 固定分割によるバリアント選択
 */
export function selectVariantFixedSplit(variants: ABVariant[]): string {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return variant.id;
    }
  }

  return variants[0].id;
}

// ==================== バリアント選択（統合） ====================

/**
 * アルゴリズムに基づいてバリアントを選択
 */
export function selectVariant(test: ABTest): string {
  const totalImpressions = test.variants.reduce(
    (sum, v) => sum + v.stats.impressions,
    0
  );

  switch (test.algorithm) {
    case "epsilon_greedy":
      return selectVariantEpsilonGreedy(
        test.variants,
        test.params.epsilon || 0.1
      );

    case "ucb1":
      return selectVariantUCB1(test.variants, totalImpressions);

    case "thompson_sampling":
      return selectVariantThompsonSampling(test.variants);

    case "fixed_split":
    default:
      return selectVariantFixedSplit(test.variants);
  }
}

// ==================== 統計的検定 ====================

/**
 * 二項比率の信頼区間を計算（Wilson Score Interval）
 */
export function calculateConfidenceInterval(
  successes: number,
  trials: number,
  confidenceLevel: number = 0.95
): { lower: number; upper: number } {
  if (trials === 0) {
    return { lower: 0, upper: 1 };
  }

  const z = getZScore(confidenceLevel);
  const p = successes / trials;
  const n = trials;

  const denominator = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);

  return {
    lower: Math.max(0, (center - margin) / denominator),
    upper: Math.min(1, (center + margin) / denominator),
  };
}

function getZScore(confidenceLevel: number): number {
  const zScores: Record<number, number> = {
    0.9: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  return zScores[confidenceLevel] || 1.96;
}

/**
 * 2つのバリアント間の統計的有意差を検定
 */
export function testSignificance(
  variantA: ABVariant,
  variantB: ABVariant,
  confidenceLevel: number = 0.95
): {
  significant: boolean;
  winner: string | null;
  confidence: number;
  pValue: number;
  lift: number;
} {
  const pA = variantA.stats.impressions > 0
    ? variantA.stats.conversions / variantA.stats.impressions
    : 0;
  const pB = variantB.stats.impressions > 0
    ? variantB.stats.conversions / variantB.stats.impressions
    : 0;

  const nA = variantA.stats.impressions;
  const nB = variantB.stats.impressions;

  // サンプルサイズが不十分な場合
  if (nA < 30 || nB < 30) {
    return {
      significant: false,
      winner: null,
      confidence: 0,
      pValue: 1,
      lift: 0,
    };
  }

  // プールされた比率
  const pooledP = (variantA.stats.conversions + variantB.stats.conversions) / (nA + nB);
  const pooledSE = Math.sqrt(pooledP * (1 - pooledP) * (1 / nA + 1 / nB));

  // Z統計量
  const z = pooledSE > 0 ? (pA - pB) / pooledSE : 0;

  // p値（両側検定）
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  // 有意性判定
  const significant = pValue < (1 - confidenceLevel);

  // 勝者判定
  let winner: string | null = null;
  if (significant) {
    winner = pA > pB ? variantA.id : variantB.id;
  }

  // リフト計算
  const lift = pB > 0 ? ((pA - pB) / pB) * 100 : 0;

  return {
    significant,
    winner,
    confidence: 1 - pValue,
    pValue,
    lift,
  };
}

function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

// ==================== 勝者判定 ====================

/**
 * テストの勝者を自動判定
 */
export function determineWinner(
  test: ABTest
): {
  winnerId: string | null;
  confidence: number;
  canDeclare: boolean;
  reason: string;
  stats: Record<string, { rate: number; ci: { lower: number; upper: number } }>;
} {
  const confidenceLevel = test.params.confidenceLevel || 0.95;
  const minSampleSize = test.params.minSampleSize || 100;

  // 各バリアントの統計
  const stats: Record<string, { rate: number; ci: { lower: number; upper: number } }> = {};

  for (const variant of test.variants) {
    const rate = variant.stats.impressions > 0
      ? variant.stats.conversions / variant.stats.impressions
      : 0;
    const ci = calculateConfidenceInterval(
      variant.stats.conversions,
      variant.stats.impressions,
      confidenceLevel
    );
    stats[variant.id] = { rate, ci };
  }

  // サンプルサイズチェック
  const totalSamples = test.variants.reduce((sum, v) => sum + v.stats.impressions, 0);
  if (totalSamples < minSampleSize * test.variants.length) {
    return {
      winnerId: null,
      confidence: 0,
      canDeclare: false,
      reason: `最小サンプルサイズ（${minSampleSize * test.variants.length}）に未達`,
      stats,
    };
  }

  // 2バリアントの場合の比較
  if (test.variants.length === 2) {
    const result = testSignificance(
      test.variants[0],
      test.variants[1],
      confidenceLevel
    );

    if (result.significant) {
      return {
        winnerId: result.winner,
        confidence: result.confidence,
        canDeclare: true,
        reason: `統計的有意差あり（p=${result.pValue.toFixed(4)}、リフト=${result.lift.toFixed(1)}%）`,
        stats,
      };
    }

    return {
      winnerId: null,
      confidence: result.confidence,
      canDeclare: false,
      reason: `統計的有意差なし（p=${result.pValue.toFixed(4)}）`,
      stats,
    };
  }

  // 3バリアント以上の場合は最高レートを暫定勝者とする
  let bestVariant = test.variants[0];
  let bestRate = 0;

  for (const variant of test.variants) {
    const rate = stats[variant.id].rate;
    if (rate > bestRate) {
      bestRate = rate;
      bestVariant = variant;
    }
  }

  return {
    winnerId: bestVariant.id,
    confidence: 0.5,
    canDeclare: false,
    reason: "複数バリアントの比較中。暫定リーダーを表示。",
    stats,
  };
}

// ==================== テスト管理 ====================

/**
 * A/Bテストを作成
 */
export function createABTest(
  name: string,
  variants: Array<{ name: string; content: string; weight?: number }>,
  options?: {
    algorithm?: ABTestAlgorithm;
    metric?: ABTestMetric;
    epsilon?: number;
    minSampleSize?: number;
    confidenceLevel?: number;
    maxDuration?: number;
  }
): ABTest {
  const algorithm = options?.algorithm || "epsilon_greedy";

  return {
    id: generateId(),
    name,
    status: "draft",
    algorithm,
    metric: options?.metric || "conversion_rate",
    variants: variants.map((v, i) => ({
      id: generateId(),
      name: v.name,
      content: v.content,
      weight: v.weight || 100 / variants.length,
      stats: {
        impressions: 0,
        conversions: 0,
        revenue: 0,
        opens: 0,
        clicks: 0,
      },
    })),
    params: {
      epsilon: options?.epsilon || 0.1,
      minSampleSize: options?.minSampleSize || 100,
      confidenceLevel: options?.confidenceLevel || 0.95,
      maxDuration: options?.maxDuration || 30,
    },
    createdAt: new Date(),
  };
}

/**
 * 結果を記録
 */
export function recordResult(
  test: ABTest,
  variantId: string,
  result: {
    converted: boolean;
    revenue?: number;
    opened?: boolean;
    clicked?: boolean;
  }
): ABTest {
  const variant = test.variants.find((v) => v.id === variantId);
  if (!variant) return test;

  variant.stats.impressions++;
  if (result.converted) variant.stats.conversions++;
  if (result.revenue) variant.stats.revenue = (variant.stats.revenue || 0) + result.revenue;
  if (result.opened) variant.stats.opens = (variant.stats.opens || 0) + 1;
  if (result.clicked) variant.stats.clicks = (variant.stats.clicks || 0) + 1;

  return test;
}

/**
 * テストを開始
 */
export function startTest(test: ABTest): ABTest {
  return {
    ...test,
    status: "running",
    startedAt: new Date(),
  };
}

/**
 * テストを終了（勝者を確定）
 */
export function completeTest(
  test: ABTest,
  winnerId: string,
  auto: boolean = false
): ABTest {
  const result = determineWinner(test);

  return {
    ...test,
    status: auto ? "auto_completed" : "completed",
    endedAt: new Date(),
    winnerId,
    winnerConfidence: result.confidence,
  };
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// ==================== レポート生成 ====================

export interface ABTestReport {
  test: ABTest;
  winner: {
    id: string | null;
    name: string | null;
    confidence: number;
  };
  variants: Array<{
    id: string;
    name: string;
    impressions: number;
    conversions: number;
    rate: number;
    ci: { lower: number; upper: number };
    isWinner: boolean;
  }>;
  recommendation: string;
  canDeclareWinner: boolean;
}

/**
 * A/Bテストレポートを生成
 */
export function generateReport(test: ABTest): ABTestReport {
  const result = determineWinner(test);

  const winnerVariant = test.variants.find((v) => v.id === result.winnerId);

  return {
    test,
    winner: {
      id: result.winnerId,
      name: winnerVariant?.name || null,
      confidence: result.confidence,
    },
    variants: test.variants.map((v) => {
      const stat = result.stats[v.id];
      return {
        id: v.id,
        name: v.name,
        impressions: v.stats.impressions,
        conversions: v.stats.conversions,
        rate: stat.rate,
        ci: stat.ci,
        isWinner: v.id === result.winnerId,
      };
    }),
    recommendation: result.canDeclare
      ? `${winnerVariant?.name}を採用することを推奨します（信頼度${(result.confidence * 100).toFixed(1)}%）`
      : result.reason,
    canDeclareWinner: result.canDeclare,
  };
}
