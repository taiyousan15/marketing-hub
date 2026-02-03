/**
 * Send Time Optimizer
 *
 * 個人別の最適送信時間を予測
 * 根拠: research/runs/20260201-082657__step-email-trends/evidence.jsonl (ev-002)
 *
 * - ev-002: AIが購読者行動から学習し最適送信時間を予測
 */

import { prisma } from "@/lib/db/prisma";

// ==================== 型定義 ====================

export interface HourlyPattern {
  [hour: number]: number; // 0-23時 → 開封率
}

export interface SendTimeAnalysis {
  contactId: string;
  optimalHour: number;
  optimalDay: number | null;
  confidence: number;
  dataPoints: number;
  hourlyPattern: HourlyPattern;
  recommendation: string;
}

export interface BulkSendTimeResult {
  contactId: string;
  scheduledTime: Date;
  reason: string;
}

// ==================== デフォルト設定 ====================

// 一般的な最適送信時間（データ不足時のフォールバック）
const DEFAULT_OPTIMAL_HOURS = {
  business: [9, 10, 14, 15], // ビジネス向け
  consumer: [8, 12, 20, 21], // コンシューマー向け
};

// 曜日別の重み（0=日曜）
const DAY_WEIGHTS = {
  0: 0.7,  // 日曜
  1: 1.0,  // 月曜
  2: 1.1,  // 火曜（最も高い）
  3: 1.0,  // 水曜
  4: 1.0,  // 木曜
  5: 0.9,  // 金曜
  6: 0.6,  // 土曜
};

// ==================== 分析関数 ====================

/**
 * コンタクトの開封パターンを分析
 */
export async function analyzeOpenPattern(
  contactId: string
): Promise<SendTimeAnalysis | null> {
  // メッセージ履歴を取得
  const messages = await prisma.messageHistory.findMany({
    where: {
      contactId,
      channel: "EMAIL",
      direction: "OUTBOUND",
      openedAt: { not: null },
    },
    select: {
      sentAt: true,
      openedAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100, // 直近100件
  });

  if (messages.length < 3) {
    // データ不足
    return null;
  }

  // 時間帯別の開封数をカウント
  const hourlyOpens: number[] = new Array(24).fill(0);
  const dayOpens: number[] = new Array(7).fill(0);

  for (const msg of messages) {
    if (msg.openedAt) {
      const openHour = msg.openedAt.getHours();
      const openDay = msg.openedAt.getDay();
      hourlyOpens[openHour]++;
      dayOpens[openDay]++;
    }
  }

  // 最適時間を計算
  const totalOpens = messages.length;
  const hourlyPattern: HourlyPattern = {};

  for (let h = 0; h < 24; h++) {
    hourlyPattern[h] = totalOpens > 0 ? hourlyOpens[h] / totalOpens : 0;
  }

  // 最も開封率の高い時間を特定
  let optimalHour = 9; // デフォルト
  let maxRate = 0;

  for (let h = 0; h < 24; h++) {
    if (hourlyPattern[h] > maxRate) {
      maxRate = hourlyPattern[h];
      optimalHour = h;
    }
  }

  // 最適な曜日を特定
  let optimalDay: number | null = null;
  let maxDayOpens = 0;

  for (let d = 0; d < 7; d++) {
    if (dayOpens[d] > maxDayOpens) {
      maxDayOpens = dayOpens[d];
      optimalDay = d;
    }
  }

  // 信頼度を計算（データ量に基づく）
  const confidence = Math.min(1, messages.length / 30); // 30件で100%

  // 推奨文を生成
  const recommendation = generateRecommendation(optimalHour, optimalDay, confidence);

  return {
    contactId,
    optimalHour,
    optimalDay,
    confidence,
    dataPoints: messages.length,
    hourlyPattern,
    recommendation,
  };
}

/**
 * 推奨文を生成
 */
function generateRecommendation(
  hour: number,
  day: number | null,
  confidence: number
): string {
  const hourStr = `${hour}:00`;
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const dayStr = day !== null ? `${dayNames[day]}曜日` : "";

  if (confidence >= 0.8) {
    return `${dayStr}の${hourStr}頃に送信すると開封率が最も高くなります（信頼度: 高）`;
  } else if (confidence >= 0.5) {
    return `${hourStr}頃の送信を推奨します（信頼度: 中）`;
  } else {
    return `データ収集中です。現時点では${hourStr}頃を推奨します（信頼度: 低）`;
  }
}

/**
 * 送信時間設定を保存/更新
 */
export async function saveSendTimePreference(
  contactId: string,
  tenantId: string,
  analysis: SendTimeAnalysis
) {
  return prisma.sendTimePreference.upsert({
    where: { contactId },
    create: {
      contactId,
      tenantId,
      optimalHour: analysis.optimalHour,
      optimalDay: analysis.optimalDay,
      timezone: "Asia/Tokyo",
      confidence: analysis.confidence,
      dataPoints: analysis.dataPoints,
      hourlyPattern: JSON.parse(JSON.stringify(analysis.hourlyPattern)),
    },
    update: {
      optimalHour: analysis.optimalHour,
      optimalDay: analysis.optimalDay,
      confidence: analysis.confidence,
      dataPoints: analysis.dataPoints,
      hourlyPattern: JSON.parse(JSON.stringify(analysis.hourlyPattern)),
    },
  });
}

/**
 * コンタクトの最適送信時間を取得
 */
export async function getOptimalSendTime(
  contactId: string,
  baseTime: Date = new Date(),
  type: "business" | "consumer" = "business"
): Promise<Date> {
  // 保存済みの設定を取得
  const preference = await prisma.sendTimePreference.findUnique({
    where: { contactId },
  });

  let targetHour: number;
  let targetDay: number | null = null;

  if (preference && preference.confidence >= 0.3) {
    // 十分なデータがある場合は個人設定を使用
    targetHour = preference.optimalHour;
    targetDay = preference.optimalDay;
  } else {
    // データ不足の場合はデフォルトを使用
    const defaultHours = DEFAULT_OPTIMAL_HOURS[type];
    targetHour = defaultHours[Math.floor(Math.random() * defaultHours.length)];
  }

  // 次の最適時間を計算
  const result = new Date(baseTime);

  // 時間を設定
  result.setHours(targetHour, 0, 0, 0);

  // 既に過ぎている場合は翌日
  if (result <= baseTime) {
    result.setDate(result.getDate() + 1);
  }

  // 最適な曜日がある場合は調整
  if (targetDay !== null) {
    const currentDay = result.getDay();
    const daysToAdd = (targetDay - currentDay + 7) % 7;
    if (daysToAdd > 0) {
      result.setDate(result.getDate() + daysToAdd);
    }
  }

  return result;
}

/**
 * 複数コンタクトの送信時間を一括計算
 */
export async function calculateBulkSendTimes(
  contactIds: string[],
  baseTime: Date = new Date(),
  type: "business" | "consumer" = "business"
): Promise<BulkSendTimeResult[]> {
  const results: BulkSendTimeResult[] = [];

  for (const contactId of contactIds) {
    const scheduledTime = await getOptimalSendTime(contactId, baseTime, type);

    const preference = await prisma.sendTimePreference.findUnique({
      where: { contactId },
    });

    const reason = preference && preference.confidence >= 0.3
      ? `個人設定（信頼度: ${Math.round(preference.confidence * 100)}%）`
      : "デフォルト設定";

    results.push({
      contactId,
      scheduledTime,
      reason,
    });
  }

  return results;
}

/**
 * テナントの全コンタクトの送信時間を分析・更新（バッチ処理）
 */
export async function analyzeAndUpdateAllSendTimes(
  tenantId: string
): Promise<{ total: number; analyzed: number; updated: number }> {
  const contacts = await prisma.contact.findMany({
    where: { tenantId, emailOptIn: true },
    select: { id: true },
  });

  let analyzed = 0;
  let updated = 0;

  for (const contact of contacts) {
    try {
      const analysis = await analyzeOpenPattern(contact.id);

      if (analysis) {
        await saveSendTimePreference(contact.id, tenantId, analysis);
        analyzed++;
        updated++;
      }
    } catch (error) {
      console.error(`Send time analysis error for ${contact.id}:`, error);
    }
  }

  return { total: contacts.length, analyzed, updated };
}

/**
 * 送信時間の統計サマリーを取得
 */
export async function getSendTimeSummary(tenantId: string) {
  const preferences = await prisma.sendTimePreference.findMany({
    where: { tenantId },
  });

  // 時間帯別の分布
  const hourDistribution: number[] = new Array(24).fill(0);
  for (const pref of preferences) {
    hourDistribution[pref.optimalHour]++;
  }

  // 信頼度別の分布
  const confidenceDistribution = {
    high: preferences.filter((p) => p.confidence >= 0.8).length,
    medium: preferences.filter((p) => p.confidence >= 0.5 && p.confidence < 0.8).length,
    low: preferences.filter((p) => p.confidence < 0.5).length,
  };

  // 最も人気の時間帯
  let peakHour = 9;
  let maxCount = 0;
  for (let h = 0; h < 24; h++) {
    if (hourDistribution[h] > maxCount) {
      maxCount = hourDistribution[h];
      peakHour = h;
    }
  }

  // 平均データポイント
  const avgDataPoints = preferences.length > 0
    ? Math.round(preferences.reduce((sum, p) => sum + p.dataPoints, 0) / preferences.length)
    : 0;

  return {
    totalAnalyzed: preferences.length,
    hourDistribution,
    confidenceDistribution,
    peakHour,
    avgDataPoints,
    avgConfidence: preferences.length > 0
      ? Math.round(preferences.reduce((sum, p) => sum + p.confidence, 0) / preferences.length * 100)
      : 0,
  };
}

/**
 * 推奨送信時間帯を取得（テナント全体）
 */
export function getRecommendedSendWindows(
  type: "business" | "consumer" = "business"
): { label: string; hours: number[]; description: string }[] {
  if (type === "business") {
    return [
      {
        label: "朝の通勤時間",
        hours: [8, 9],
        description: "出勤前や通勤中にメールをチェックする人が多い",
      },
      {
        label: "午前中",
        hours: [10, 11],
        description: "業務開始後、最初のメールチェックのタイミング",
      },
      {
        label: "昼休み",
        hours: [12, 13],
        description: "昼食時にスマホでメールをチェック",
      },
      {
        label: "午後",
        hours: [14, 15],
        description: "午後の業務再開時のメールチェック",
      },
    ];
  } else {
    return [
      {
        label: "朝",
        hours: [7, 8],
        description: "起床後のスマホチェック",
      },
      {
        label: "昼",
        hours: [12, 13],
        description: "昼食時間帯",
      },
      {
        label: "夕方",
        hours: [18, 19],
        description: "帰宅途中や帰宅直後",
      },
      {
        label: "夜",
        hours: [20, 21],
        description: "リラックスタイムのスマホ利用",
      },
    ];
  }
}
