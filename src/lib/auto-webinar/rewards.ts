// src/lib/auto-webinar/rewards.ts
// ウェビナー特典システムのコアロジック（クライアント/サーバー共通）

import type { WebinarRewardType, WebinarRewardDeliveryType } from '@prisma/client'

/**
 * 特典の定義
 */
export interface RewardDefinition {
  id: string
  name: string
  description: string | null
  rewardType: WebinarRewardType
  watchTimeSeconds: number | null
  triggerKeywords: string[] | null
  appearAtSeconds: number | null
  inputDeadlineSeconds: number | null
  inputFields: InputField[] | null
  deliveryType: WebinarRewardDeliveryType
  popupTitle: string | null
  popupDescription: string | null
  popupButtonText: string
  popupPosition: string
  maxClaims: number | null
  currentClaims: number
  isActive: boolean
  order?: number
}

export interface InputField {
  name: string
  type: 'text' | 'email' | 'tel' | 'select'
  label: string
  required: boolean
  placeholder?: string
  options?: string[] // selectの場合
}

/**
 * 視聴時間ベースの特典チェック
 */
export function checkWatchTimeRewards(
  rewards: RewardDefinition[],
  watchedSeconds: number,
  alreadyClaimedIds: Set<string>
): RewardDefinition[] {
  return rewards.filter(reward => {
    if (reward.rewardType !== 'WATCH_TIME') return false
    if (!reward.isActive) return false
    if (alreadyClaimedIds.has(reward.id)) return false
    if (reward.maxClaims && reward.currentClaims >= reward.maxClaims) return false
    if (!reward.watchTimeSeconds) return false

    return watchedSeconds >= reward.watchTimeSeconds
  })
}

/**
 * キーワードベースの特典チェック
 */
export function checkKeywordReward(
  rewards: RewardDefinition[],
  inputKeyword: string,
  alreadyClaimedIds: Set<string>
): RewardDefinition | null {
  const normalizedInput = inputKeyword.toLowerCase().trim()

  for (const reward of rewards) {
    if (reward.rewardType !== 'KEYWORD') continue
    if (!reward.isActive) continue
    if (alreadyClaimedIds.has(reward.id)) continue
    if (reward.maxClaims && reward.currentClaims >= reward.maxClaims) continue
    if (!reward.triggerKeywords || reward.triggerKeywords.length === 0) continue

    const keywords = reward.triggerKeywords.map(k => k.toLowerCase().trim())
    if (keywords.includes(normalizedInput)) {
      return reward
    }
  }

  return null
}

/**
 * 期間限定入力の特典チェック
 */
export function checkTimedInputReward(
  rewards: RewardDefinition[],
  currentSeconds: number,
  alreadyClaimedIds: Set<string>
): RewardDefinition | null {
  for (const reward of rewards) {
    if (reward.rewardType !== 'TIMED_INPUT') continue
    if (!reward.isActive) continue
    if (alreadyClaimedIds.has(reward.id)) continue
    if (reward.maxClaims && reward.currentClaims >= reward.maxClaims) continue
    if (!reward.appearAtSeconds) continue

    const startTime = reward.appearAtSeconds
    const endTime = startTime + (reward.inputDeadlineSeconds || 60)

    if (currentSeconds >= startTime && currentSeconds <= endTime) {
      return reward
    }
  }

  return null
}

/**
 * 表示すべき特典ポップアップを取得
 */
export function getActiveRewardPopups(
  rewards: RewardDefinition[],
  currentSeconds: number,
  watchedSeconds: number,
  alreadyClaimedIds: Set<string>,
  dismissedIds: Set<string>
): RewardDefinition[] {
  const activePopups: RewardDefinition[] = []

  for (const reward of rewards) {
    if (!reward.isActive) continue
    if (alreadyClaimedIds.has(reward.id)) continue
    if (dismissedIds.has(reward.id)) continue
    if (reward.maxClaims && reward.currentClaims >= reward.maxClaims) continue

    switch (reward.rewardType) {
      case 'WATCH_TIME':
        // 視聴時間達成時にポップアップ
        if (reward.watchTimeSeconds && watchedSeconds >= reward.watchTimeSeconds) {
          activePopups.push(reward)
        }
        break

      case 'TIMED_INPUT':
        // 指定時間帯にポップアップ
        if (reward.appearAtSeconds) {
          const startTime = reward.appearAtSeconds
          const endTime = startTime + (reward.inputDeadlineSeconds || 60)
          if (currentSeconds >= startTime && currentSeconds <= endTime) {
            activePopups.push(reward)
          }
        }
        break

      // KEYWORDは別途チャット入力で処理
    }
  }

  return activePopups
}

/**
 * 入力フィールドのバリデーション
 */
export function validateRewardInput(
  fields: InputField[],
  inputData: Record<string, string>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  for (const field of fields) {
    const value = inputData[field.name]?.trim() || ''

    if (field.required && !value) {
      errors[field.name] = `${field.label}は必須です`
      continue
    }

    if (value) {
      switch (field.type) {
        case 'email':
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            errors[field.name] = '有効なメールアドレスを入力してください'
          }
          break
        case 'tel':
          if (!/^[\d\-+() ]+$/.test(value)) {
            errors[field.name] = '有効な電話番号を入力してください'
          }
          break
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * 特典配布処理
 */
export interface DeliveryResult {
  success: boolean
  message?: string
  data?: {
    downloadUrl?: string
    couponCode?: string
  }
}

export async function deliverReward(
  reward: RewardDefinition,
  contactId: string | null,
  inputData?: Record<string, string>
): Promise<DeliveryResult> {
  // この関数はクライアントサイドでも使用されるため、
  // 実際の配信処理はサーバーサイドのreward-delivery.tsで行う
  // ここではクライアント用のシンプルな結果のみ返す
  switch (reward.deliveryType) {
    case 'DOWNLOAD':
      return {
        success: true,
        data: { downloadUrl: reward.popupDescription || '' }
      }

    case 'COUPON':
      return {
        success: true,
        message: 'クーポンコードを取得しました',
        data: { couponCode: 'PROCESSING' }
      }

    case 'EMAIL':
    case 'LINE':
    case 'TAG_ADD':
    case 'UNLOCK_CONTENT':
      return {
        success: true,
        message: '処理中です'
      }

    default:
      return {
        success: false,
        message: '配布方法が不明です'
      }
  }
}

/**
 * 秒数をフォーマット
 */
export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * 特典テンプレート生成
 */
export function generateRewardTemplates(videoDuration: number): Partial<RewardDefinition>[] {
  const templates: Partial<RewardDefinition>[] = []

  // 視聴時間報酬（25%, 50%, 75%, 100%）
  const milestones = [0.25, 0.5, 0.75, 1.0]
  milestones.forEach((percent, index) => {
    templates.push({
      name: `視聴${Math.round(percent * 100)}%達成特典`,
      rewardType: 'WATCH_TIME',
      watchTimeSeconds: Math.floor(videoDuration * percent),
      deliveryType: 'DOWNLOAD',
      popupTitle: `おめでとうございます！`,
      popupDescription: `${Math.round(percent * 100)}%視聴達成の特典をプレゼント`,
      popupButtonText: '特典を受け取る',
      order: index
    })
  })

  // キーワード特典
  templates.push({
    name: 'キーワード特典',
    rewardType: 'KEYWORD',
    triggerKeywords: ['特典', 'プレゼント'],
    deliveryType: 'DOWNLOAD',
    popupTitle: 'キーワード入力ありがとうございます！',
    popupDescription: '特別な資料をプレゼント',
    popupButtonText: 'ダウンロード',
    order: 10
  })

  // 期間限定入力
  templates.push({
    name: '限定フォーム入力特典',
    rewardType: 'TIMED_INPUT',
    appearAtSeconds: Math.floor(videoDuration * 0.6),
    inputDeadlineSeconds: 180, // 3分間
    inputFields: [
      { name: 'email', type: 'email', label: 'メールアドレス', required: true, placeholder: 'example@email.com' }
    ],
    deliveryType: 'EMAIL',
    popupTitle: '今だけ！3分以内に登録で特典',
    popupDescription: '限定PDFをメールでお届けします',
    popupButtonText: '特典を受け取る',
    order: 11
  })

  return templates
}
