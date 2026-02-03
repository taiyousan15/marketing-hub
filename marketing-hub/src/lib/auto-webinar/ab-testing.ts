/**
 * オファーA/Bテストシステム
 *
 * - 複数バリアントのランダム/最適割り当て
 * - 統計的有意性の検定
 * - 自動最適化（勝者決定）
 */

import { prisma } from "@/lib/db/prisma";
import { ABTestStatus, ABTestAlgorithm } from "@prisma/client";

// ==================== 型定義 ====================

interface VariantStats {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  conversions: number;
  clickRate: number;
  conversionRate: number;
  weight: number;
}

interface ABTestResult {
  testId: string;
  status: ABTestStatus;
  variants: VariantStats[];
  winner: VariantStats | null;
  isSignificant: boolean;
  confidenceLevel: number;
  pValue: number | null;
  improvement: number | null; // 勝者の改善率（%）
}

// ==================== バリアント選択 ====================

/**
 * セッションに対してバリアントを割り当て
 */
export async function assignVariant(
  testId: string,
  sessionId: string,
  contactId?: string
): Promise<string | null> {
  // 既存の割り当てを確認
  const existingAssignment = await prisma.offerABAssignment.findUnique({
    where: {
      testId_sessionId: {
        testId,
        sessionId,
      },
    },
  });

  if (existingAssignment) {
    return existingAssignment.variantId;
  }

  // テストとバリアントを取得
  const test = await prisma.offerABTest.findUnique({
    where: { id: testId },
    include: {
      variants: true,
    },
  });

  if (!test || test.status !== ABTestStatus.RUNNING) {
    return null;
  }

  // バリアント選択
  const selectedVariant = selectVariant(test.algorithm, test.variants);

  if (!selectedVariant) {
    return null;
  }

  // 割り当てを記録
  await prisma.offerABAssignment.create({
    data: {
      testId,
      variantId: selectedVariant.id,
      sessionId,
      contactId,
    },
  });

  return selectedVariant.id;
}

/**
 * アルゴリズムに基づいてバリアントを選択
 */
function selectVariant(
  algorithm: ABTestAlgorithm,
  variants: Array<{
    id: string;
    weight: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }>
): { id: string } | null {
  if (variants.length === 0) return null;

  switch (algorithm) {
    case ABTestAlgorithm.RANDOM:
      return selectRandom(variants);
    case ABTestAlgorithm.EPSILON_GREEDY:
      return selectEpsilonGreedy(variants, 0.1);
    case ABTestAlgorithm.THOMPSON_SAMPLING:
      return selectThompsonSampling(variants);
    case ABTestAlgorithm.UCB1:
      return selectUCB1(variants);
    default:
      return selectRandom(variants);
  }
}

/**
 * 均等ランダム選択（重みベース）
 */
function selectRandom(
  variants: Array<{ id: string; weight: number }>
): { id: string } {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) {
      return { id: variant.id };
    }
  }

  return { id: variants[0].id };
}

/**
 * ε-greedy選択（探索と活用のバランス）
 */
function selectEpsilonGreedy(
  variants: Array<{
    id: string;
    impressions: number;
    conversions: number;
  }>,
  epsilon: number = 0.1
): { id: string } {
  // ε確率で探索（ランダム）
  if (Math.random() < epsilon) {
    return { id: variants[Math.floor(Math.random() * variants.length)].id };
  }

  // 1-ε確率で活用（最良バリアント）
  const best = variants.reduce((best, v) => {
    const rate = v.impressions > 0 ? v.conversions / v.impressions : 0;
    const bestRate = best.impressions > 0 ? best.conversions / best.impressions : 0;
    return rate > bestRate ? v : best;
  });

  return { id: best.id };
}

/**
 * Thompson Sampling（ベイズ最適化）
 */
function selectThompsonSampling(
  variants: Array<{
    id: string;
    impressions: number;
    conversions: number;
  }>
): { id: string } {
  const samples = variants.map((v) => {
    // Beta分布からサンプリング
    const alpha = v.conversions + 1;
    const beta = v.impressions - v.conversions + 1;
    const sample = betaSample(alpha, beta);
    return { id: v.id, sample };
  });

  // 最大サンプル値のバリアントを選択
  const best = samples.reduce((best, s) => (s.sample > best.sample ? s : best));
  return { id: best.id };
}

/**
 * UCB1（Upper Confidence Bound）
 */
function selectUCB1(
  variants: Array<{
    id: string;
    impressions: number;
    conversions: number;
  }>
): { id: string } {
  const totalImpressions = variants.reduce((sum, v) => sum + v.impressions, 0);

  if (totalImpressions === 0) {
    return { id: variants[Math.floor(Math.random() * variants.length)].id };
  }

  const scores = variants.map((v) => {
    if (v.impressions === 0) {
      return { id: v.id, score: Infinity };
    }
    const exploitation = v.conversions / v.impressions;
    const exploration = Math.sqrt(
      (2 * Math.log(totalImpressions)) / v.impressions
    );
    return { id: v.id, score: exploitation + exploration };
  });

  const best = scores.reduce((best, s) => (s.score > best.score ? s : best));
  return { id: best.id };
}

/**
 * Beta分布からサンプリング（Box-Muller変換）
 */
function betaSample(alpha: number, beta: number): number {
  // ガンマ分布からサンプリングしてBeta分布を近似
  const gammaA = gammaSample(alpha);
  const gammaB = gammaSample(beta);
  return gammaA / (gammaA + gammaB);
}

function gammaSample(shape: number): number {
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

    if (u < 1 - 0.0331 * (x * x) * (x * x)) {
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

// ==================== 統計分析 ====================

/**
 * A/Bテストの結果を分析
 */
export async function analyzeABTest(testId: string): Promise<ABTestResult> {
  const test = await prisma.offerABTest.findUnique({
    where: { id: testId },
    include: {
      variants: true,
    },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  const variants: VariantStats[] = test.variants.map((v) => ({
    id: v.id,
    name: v.name,
    impressions: v.impressions,
    clicks: v.clicks,
    conversions: v.conversions,
    clickRate: v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0,
    conversionRate: v.impressions > 0 ? (v.conversions / v.impressions) * 100 : 0,
    weight: v.weight,
  }));

  // コントロールを特定
  const control = test.variants.find((v) => v.isControl);
  const treatments = test.variants.filter((v) => !v.isControl);

  // 統計的有意性を検定
  let isSignificant = false;
  let pValue: number | null = null;
  let winner: VariantStats | null = null;
  let improvement: number | null = null;

  if (control && treatments.length > 0) {
    // 最もパフォーマンスの良いトリートメントを見つける
    const bestTreatment = treatments.reduce((best, t) => {
      const tRate = t.impressions > 0 ? t.conversions / t.impressions : 0;
      const bestRate = best.impressions > 0 ? best.conversions / best.impressions : 0;
      return tRate > bestRate ? t : best;
    });

    // Z検定
    const result = proportionZTest(
      control.conversions,
      control.impressions,
      bestTreatment.conversions,
      bestTreatment.impressions
    );

    pValue = result.pValue;
    isSignificant = pValue < 1 - test.confidenceLevel;

    // 勝者を決定
    const controlRate = control.impressions > 0 ? control.conversions / control.impressions : 0;
    const treatmentRate =
      bestTreatment.impressions > 0 ? bestTreatment.conversions / bestTreatment.impressions : 0;

    if (isSignificant) {
      if (treatmentRate > controlRate) {
        winner = variants.find((v) => v.id === bestTreatment.id) || null;
        improvement = controlRate > 0 ? ((treatmentRate - controlRate) / controlRate) * 100 : 0;
      } else {
        winner = variants.find((v) => v.id === control.id) || null;
        improvement = 0;
      }
    }
  }

  return {
    testId,
    status: test.status,
    variants,
    winner,
    isSignificant,
    confidenceLevel: test.confidenceLevel,
    pValue,
    improvement,
  };
}

/**
 * 二項比率のZ検定
 */
function proportionZTest(
  successes1: number,
  trials1: number,
  successes2: number,
  trials2: number
): { zScore: number; pValue: number } {
  if (trials1 === 0 || trials2 === 0) {
    return { zScore: 0, pValue: 1 };
  }

  const p1 = successes1 / trials1;
  const p2 = successes2 / trials2;
  const pooledP = (successes1 + successes2) / (trials1 + trials2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / trials1 + 1 / trials2));

  if (se === 0) {
    return { zScore: 0, pValue: 1 };
  }

  const zScore = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  return { zScore, pValue };
}

/**
 * 標準正規分布のCDF
 */
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

// ==================== テスト操作 ====================

/**
 * A/Bテストを開始
 */
export async function startABTest(testId: string) {
  return prisma.offerABTest.update({
    where: { id: testId },
    data: {
      status: ABTestStatus.RUNNING,
      startedAt: new Date(),
    },
  });
}

/**
 * A/Bテストを一時停止
 */
export async function pauseABTest(testId: string) {
  return prisma.offerABTest.update({
    where: { id: testId },
    data: {
      status: ABTestStatus.PAUSED,
    },
  });
}

/**
 * A/Bテストを完了（勝者を決定）
 */
export async function completeABTest(testId: string, winnerId: string) {
  return prisma.offerABTest.update({
    where: { id: testId },
    data: {
      status: ABTestStatus.COMPLETED,
      winnerId,
      winnerDeclaredAt: new Date(),
      completedAt: new Date(),
    },
  });
}

/**
 * 表示イベントを記録
 */
export async function recordImpression(testId: string, sessionId: string) {
  const assignment = await prisma.offerABAssignment.findUnique({
    where: {
      testId_sessionId: {
        testId,
        sessionId,
      },
    },
  });

  if (!assignment || assignment.impressed) {
    return;
  }

  await prisma.$transaction([
    prisma.offerABAssignment.update({
      where: { id: assignment.id },
      data: {
        impressed: true,
        impressedAt: new Date(),
      },
    }),
    prisma.offerABVariant.update({
      where: { id: assignment.variantId },
      data: {
        impressions: { increment: 1 },
      },
    }),
  ]);
}

/**
 * クリックイベントを記録
 */
export async function recordClick(testId: string, sessionId: string) {
  const assignment = await prisma.offerABAssignment.findUnique({
    where: {
      testId_sessionId: {
        testId,
        sessionId,
      },
    },
  });

  if (!assignment || assignment.clicked) {
    return;
  }

  await prisma.$transaction([
    prisma.offerABAssignment.update({
      where: { id: assignment.id },
      data: {
        clicked: true,
        clickedAt: new Date(),
      },
    }),
    prisma.offerABVariant.update({
      where: { id: assignment.variantId },
      data: {
        clicks: { increment: 1 },
      },
    }),
  ]);

  // メトリクスを更新
  await updateVariantMetrics(assignment.variantId);
}

/**
 * コンバージョンイベントを記録
 */
export async function recordConversion(testId: string, sessionId: string) {
  const assignment = await prisma.offerABAssignment.findUnique({
    where: {
      testId_sessionId: {
        testId,
        sessionId,
      },
    },
  });

  if (!assignment || assignment.converted) {
    return;
  }

  await prisma.$transaction([
    prisma.offerABAssignment.update({
      where: { id: assignment.id },
      data: {
        converted: true,
        convertedAt: new Date(),
      },
    }),
    prisma.offerABVariant.update({
      where: { id: assignment.variantId },
      data: {
        conversions: { increment: 1 },
      },
    }),
  ]);

  // メトリクスを更新
  await updateVariantMetrics(assignment.variantId);

  // 自動最適化をチェック
  const test = await prisma.offerABTest.findUnique({
    where: { id: testId },
  });

  if (test?.autoOptimize) {
    await checkAutoOptimize(testId);
  }
}

/**
 * バリアントのメトリクスを更新
 */
async function updateVariantMetrics(variantId: string) {
  const variant = await prisma.offerABVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) return;

  const clickRate = variant.impressions > 0 ? variant.clicks / variant.impressions : null;
  const conversionRate = variant.impressions > 0 ? variant.conversions / variant.impressions : null;

  await prisma.offerABVariant.update({
    where: { id: variantId },
    data: {
      clickRate,
      conversionRate,
    },
  });
}

/**
 * 自動最適化をチェック
 */
async function checkAutoOptimize(testId: string) {
  const test = await prisma.offerABTest.findUnique({
    where: { id: testId },
    include: { variants: true },
  });

  if (!test || test.status !== ABTestStatus.RUNNING) return;

  // 最小サンプル数をチェック
  const totalImpressions = test.variants.reduce((sum, v) => sum + v.impressions, 0);
  const totalConversions = test.variants.reduce((sum, v) => sum + v.conversions, 0);

  if (totalImpressions < test.minSampleSize) return;
  if (totalConversions < test.minConversions) return;

  // 統計的有意性をチェック
  const result = await analyzeABTest(testId);

  if (result.isSignificant && result.winner) {
    await completeABTest(testId, result.winner.id);
  }
}

/**
 * オファーにA/Bテストが適用されているか確認し、バリアントを取得
 */
export async function getOfferVariant(
  offerId: string,
  sessionId: string,
  contactId?: string
): Promise<{
  hasTest: boolean;
  variant?: {
    title?: string;
    description?: string;
    buttonText?: string;
    buttonUrl?: string;
    countdownEnabled?: boolean;
    countdownSeconds?: number;
    limitedSeats?: number;
    popupPosition?: string;
  };
}> {
  // 実行中のA/Bテストを検索
  const test = await prisma.offerABTest.findFirst({
    where: {
      offerId,
      status: ABTestStatus.RUNNING,
    },
    include: {
      variants: true,
    },
  });

  if (!test) {
    return { hasTest: false };
  }

  // バリアントを割り当て
  const variantId = await assignVariant(test.id, sessionId, contactId);

  if (!variantId) {
    return { hasTest: false };
  }

  const variant = test.variants.find((v) => v.id === variantId);

  if (!variant) {
    return { hasTest: false };
  }

  // 表示を記録
  await recordImpression(test.id, sessionId);

  return {
    hasTest: true,
    variant: {
      title: variant.title || undefined,
      description: variant.offerDescription || undefined,
      buttonText: variant.buttonText || undefined,
      buttonUrl: variant.buttonUrl || undefined,
      countdownEnabled: variant.countdownEnabled ?? undefined,
      countdownSeconds: variant.countdownSeconds || undefined,
      limitedSeats: variant.limitedSeats || undefined,
      popupPosition: variant.popupPosition || undefined,
    },
  };
}
