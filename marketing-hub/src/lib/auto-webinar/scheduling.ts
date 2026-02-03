// src/lib/auto-webinar/scheduling.ts
// オートウェビナーのスケジュール計算ロジック

import { addMinutes, addDays, setHours, setMinutes, startOfDay, isBefore, isAfter, parseISO } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

/**
 * 定期開催スケジュール設定
 */
export interface RecurringSchedule {
  days: number[]       // 0=日, 1=月, 2=火, ... 6=土
  times: string[]      // ["10:00", "15:00", "19:00"]
  timezone: string     // "Asia/Tokyo"
}

/**
 * Just-In-Time: 登録時刻 + X分
 */
export function calculateJustInTimeStart(
  registeredAt: Date,
  delayMinutes: number
): Date {
  return addMinutes(registeredAt, delayMinutes)
}

/**
 * Recurring: 次の利用可能時間を取得（複数）
 */
export function getNextAvailableTimes(
  schedule: RecurringSchedule,
  count: number = 5,
  fromDate: Date = new Date()
): Date[] {
  const results: Date[] = []
  const { days, times, timezone } = schedule

  if (days.length === 0 || times.length === 0) {
    return results
  }

  // タイムゾーンを考慮した現在時刻
  const zonedNow = toZonedTime(fromDate, timezone)
  let checkDate = startOfDay(zonedNow)

  // 最大60日先まで探索
  const maxDays = 60
  let daysChecked = 0

  while (results.length < count && daysChecked < maxDays) {
    const dayOfWeek = checkDate.getDay()

    if (days.includes(dayOfWeek)) {
      for (const timeStr of times) {
        const [hours, minutes] = timeStr.split(':').map(Number)
        const candidate = setMinutes(setHours(checkDate, hours), minutes)

        // 現在時刻より後のみ追加
        if (isAfter(candidate, zonedNow)) {
          // UTCに変換して追加
          const utcDate = fromZonedTime(candidate, timezone)
          results.push(utcDate)

          if (results.length >= count) break
        }
      }
    }

    checkDate = addDays(checkDate, 1)
    daysChecked++
  }

  // 時系列でソート
  return results.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * 特定日時から次の利用可能時間を取得
 */
export function getNextAvailableFromSpecificDates(
  specificDates: string[],
  count: number = 5,
  fromDate: Date = new Date()
): Date[] {
  const results: Date[] = []

  for (const dateStr of specificDates) {
    const date = parseISO(dateStr)
    if (isAfter(date, fromDate)) {
      results.push(date)
      if (results.length >= count) break
    }
  }

  return results.sort((a, b) => a.getTime() - b.getTime())
}

/**
 * スケジュールタイプに基づいて次の視聴開始時刻を計算
 */
export function calculateScheduledStartAt(
  scheduleType: 'JUST_IN_TIME' | 'RECURRING' | 'SPECIFIC_DATES' | 'ON_DEMAND',
  registeredAt: Date,
  options: {
    justInTimeDelayMinutes?: number
    recurringSchedule?: RecurringSchedule | null
    specificDates?: string[] | null
    selectedTime?: Date  // ユーザーが選択した時間（RECURRING/SPECIFIC_DATES用）
  }
): Date {
  switch (scheduleType) {
    case 'JUST_IN_TIME':
      return calculateJustInTimeStart(
        registeredAt,
        options.justInTimeDelayMinutes ?? 15
      )

    case 'RECURRING':
      if (options.selectedTime) {
        return options.selectedTime
      }
      if (options.recurringSchedule) {
        const nextTimes = getNextAvailableTimes(options.recurringSchedule, 1, registeredAt)
        if (nextTimes.length > 0) {
          return nextTimes[0]
        }
      }
      // フォールバック: 登録時刻 + 15分
      return addMinutes(registeredAt, 15)

    case 'SPECIFIC_DATES':
      if (options.selectedTime) {
        return options.selectedTime
      }
      if (options.specificDates) {
        const nextDates = getNextAvailableFromSpecificDates(options.specificDates, 1, registeredAt)
        if (nextDates.length > 0) {
          return nextDates[0]
        }
      }
      // フォールバック
      return addMinutes(registeredAt, 15)

    case 'ON_DEMAND':
      // オンデマンドは即時視聴可能
      return registeredAt

    default:
      return addMinutes(registeredAt, 15)
  }
}

/**
 * 視聴可能かどうかをチェック
 */
export function canWatchNow(
  scheduledStartAt: Date,
  videoDuration: number,
  now: Date = new Date()
): {
  canWatch: boolean
  status: 'not_started' | 'live' | 'ended'
  secondsUntilStart?: number
  secondsSinceStart?: number
} {
  const endTime = addMinutes(scheduledStartAt, Math.ceil(videoDuration / 60))

  if (isBefore(now, scheduledStartAt)) {
    return {
      canWatch: false,
      status: 'not_started',
      secondsUntilStart: Math.floor((scheduledStartAt.getTime() - now.getTime()) / 1000)
    }
  }

  if (isAfter(now, endTime)) {
    return {
      canWatch: false,
      status: 'ended',
      secondsSinceStart: Math.floor((now.getTime() - scheduledStartAt.getTime()) / 1000)
    }
  }

  return {
    canWatch: true,
    status: 'live',
    secondsSinceStart: Math.floor((now.getTime() - scheduledStartAt.getTime()) / 1000)
  }
}

/**
 * リプレイ有効期限を計算
 */
export function calculateReplayExpiresAt(
  watchEndTime: Date,
  expiresAfterHours: number | null | undefined
): Date | null {
  if (!expiresAfterHours) {
    return null
  }
  return addMinutes(watchEndTime, expiresAfterHours * 60)
}
