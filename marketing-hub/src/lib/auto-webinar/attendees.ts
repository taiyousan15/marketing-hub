// src/lib/auto-webinar/attendees.ts
// フェイク参加者数シミュレーションロジック

/**
 * 参加者数の変動パラメータ
 */
export interface AttendeeSimulationConfig {
  minAttendees: number      // 最小参加者数
  maxAttendees: number      // 最大参加者数
  peakProgress: number      // ピーク時の動画進捗（0-1）デフォルト: 0.3
  variancePercent: number   // 変動幅（%）デフォルト: 10
  seed?: number             // ランダムシード（一貫性のため）
}

const DEFAULT_CONFIG: Omit<AttendeeSimulationConfig, 'minAttendees' | 'maxAttendees'> = {
  peakProgress: 0.3,
  variancePercent: 10
}

/**
 * 擬似ランダム生成器（シード対応）
 */
function seededRandom(seed: number): () => number {
  let value = seed
  return () => {
    value = (value * 1103515245 + 12345) & 0x7fffffff
    return value / 0x7fffffff
  }
}

/**
 * 現在の参加者数を計算
 *
 * パターン:
 * - 開始時: 徐々に増加（参加者が入ってくる）
 * - 1/3経過: ピーク
 * - それ以降: 緩やかに減少（離脱者が出る）
 * - 最後: 最小値近くまで減少
 *
 * ±variancePercent のランダム変動を加える
 */
export function calculateFakeAttendees(
  min: number,
  max: number,
  progress: number,  // 0-1（動画の進捗）
  config?: Partial<AttendeeSimulationConfig>
): number {
  const {
    peakProgress = DEFAULT_CONFIG.peakProgress,
    variancePercent = DEFAULT_CONFIG.variancePercent,
    seed
  } = config || {}

  // 入力値の正規化
  const normalizedProgress = Math.max(0, Math.min(1, progress))
  const baseRange = max - min

  let baseCount: number

  if (normalizedProgress < peakProgress) {
    // 開始〜ピーク: 急上昇
    // S字曲線で自然な増加を表現
    const t = normalizedProgress / peakProgress
    const easeInOut = t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2

    baseCount = min + baseRange * easeInOut
  } else {
    // ピーク〜終了: 緩やかに減少
    const t = (normalizedProgress - peakProgress) / (1 - peakProgress)
    // 指数関数的減衰
    const decay = Math.exp(-1.5 * t)

    // ピーク時のmaxから、最終的にmin + 0.2*baseRangeまで減少
    const finalFloor = min + baseRange * 0.2
    baseCount = finalFloor + (max - finalFloor) * decay
  }

  // ランダム変動を追加
  const random = seed !== undefined
    ? seededRandom(seed + Math.floor(normalizedProgress * 100))
    : Math.random

  const variance = (random() - 0.5) * 2 * (variancePercent / 100)
  const variedCount = baseCount * (1 + variance)

  // 範囲内に収めて整数化
  return Math.round(Math.max(min, Math.min(max, variedCount)))
}

/**
 * 参加者数の時系列データを生成（グラフ用）
 */
export function generateAttendeeTimeline(
  min: number,
  max: number,
  videoDuration: number,
  intervalSeconds: number = 30,
  config?: Partial<AttendeeSimulationConfig>
): { time: number; count: number }[] {
  const timeline: { time: number; count: number }[] = []

  for (let t = 0; t <= videoDuration; t += intervalSeconds) {
    const progress = t / videoDuration
    timeline.push({
      time: t,
      count: calculateFakeAttendees(min, max, progress, {
        ...config,
        seed: config?.seed ? config.seed + t : undefined
      })
    })
  }

  return timeline
}

/**
 * リアルタイム更新用の次の参加者数を取得
 * 前回の値から大きく変動しないよう調整
 */
export function getNextAttendeeCount(
  previousCount: number,
  min: number,
  max: number,
  progress: number,
  config?: Partial<AttendeeSimulationConfig>
): number {
  const targetCount = calculateFakeAttendees(min, max, progress, config)

  // 前回値との差が大きすぎる場合は緩やかに変化
  const maxDelta = Math.ceil((max - min) * 0.05)  // 最大5%の変化
  const delta = targetCount - previousCount

  if (Math.abs(delta) > maxDelta) {
    return previousCount + Math.sign(delta) * maxDelta
  }

  return targetCount
}

/**
 * 参加者数をフォーマット（表示用）
 */
export function formatAttendeeCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

/**
 * 参加者アクティビティの説明文を生成
 */
export function getAttendeeActivityDescription(
  currentCount: number,
  previousCount: number,
  progress: number
): string {
  const delta = currentCount - previousCount

  if (progress < 0.1) {
    return '参加者が続々と入室中...'
  }

  if (delta > 5) {
    return '新しい参加者が入室しました'
  }

  if (delta < -5 && progress > 0.8) {
    return '視聴を完了した方が退出しています'
  }

  if (progress > 0.9) {
    return '最後まで視聴いただきありがとうございます'
  }

  return `${currentCount}人が視聴中`
}

/**
 * ピーク時の参加者数を予測
 */
export function predictPeakAttendees(
  min: number,
  max: number,
  config?: Partial<AttendeeSimulationConfig>
): number {
  const { peakProgress = DEFAULT_CONFIG.peakProgress } = config || {}
  return calculateFakeAttendees(min, max, peakProgress, { ...config, variancePercent: 0 })
}
