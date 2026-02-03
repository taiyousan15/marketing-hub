// src/lib/auto-webinar/chat.ts
// シミュレートチャットロジック

import type { SimChatMessageType } from '@prisma/client'

/**
 * チャットメッセージ型
 */
export interface ChatMessage {
  id: string
  appearAtSeconds: number
  senderName: string
  senderAvatar: string | null
  content: string
  messageType: SimChatMessageType
  order: number
}

/**
 * 現在の動画位置までのメッセージを取得
 */
export function getChatMessagesForTime(
  messages: ChatMessage[],
  currentSeconds: number
): ChatMessage[] {
  return messages
    .filter(m => m.appearAtSeconds <= currentSeconds)
    .sort((a, b) => {
      // まず表示タイミングでソート
      if (a.appearAtSeconds !== b.appearAtSeconds) {
        return a.appearAtSeconds - b.appearAtSeconds
      }
      // 同じタイミングならorderでソート
      return a.order - b.order
    })
}

/**
 * 新しく表示すべきメッセージを取得（差分）
 */
export function getNewMessagesForTime(
  messages: ChatMessage[],
  currentSeconds: number,
  lastShownSeconds: number
): ChatMessage[] {
  return messages
    .filter(m => m.appearAtSeconds > lastShownSeconds && m.appearAtSeconds <= currentSeconds)
    .sort((a, b) => {
      if (a.appearAtSeconds !== b.appearAtSeconds) {
        return a.appearAtSeconds - b.appearAtSeconds
      }
      return a.order - b.order
    })
}

/**
 * メッセージのタイムライン分布を取得（グラフ用）
 */
export function getMessageDistribution(
  messages: ChatMessage[],
  videoDuration: number,
  bucketCount: number = 20
): { start: number; end: number; count: number }[] {
  const bucketSize = Math.ceil(videoDuration / bucketCount)
  const buckets: { start: number; end: number; count: number }[] = []

  for (let i = 0; i < bucketCount; i++) {
    const start = i * bucketSize
    const end = Math.min((i + 1) * bucketSize, videoDuration)
    const count = messages.filter(
      m => m.appearAtSeconds >= start && m.appearAtSeconds < end
    ).length
    buckets.push({ start, end, count })
  }

  return buckets
}

/**
 * CSVからチャットメッセージをインポート
 * フォーマット: 秒数,名前,メッセージ,タイプ(オプション)
 */
export function parseCSVMessages(
  csvContent: string
): Omit<ChatMessage, 'id'>[] {
  const lines = csvContent.trim().split('\n')
  const messages: Omit<ChatMessage, 'id'>[] = []

  // ヘッダーがある場合はスキップ
  const startIndex = lines[0].toLowerCase().includes('秒') ||
                     lines[0].toLowerCase().includes('time') ||
                     lines[0].toLowerCase().includes('second') ? 1 : 0

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // カンマで分割（引用符内のカンマは考慮）
    const parts = parseCSVLine(line)
    if (parts.length < 3) continue

    const [timeStr, senderName, content, typeStr] = parts
    const seconds = parseTimeString(timeStr)

    if (isNaN(seconds)) continue

    messages.push({
      appearAtSeconds: seconds,
      senderName: senderName.trim(),
      senderAvatar: null,
      content: content.trim(),
      messageType: parseMessageType(typeStr?.trim()),
      order: i - startIndex
    })
  }

  return messages
}

/**
 * JSON形式からチャットメッセージをインポート
 */
export function parseJSONMessages(
  jsonContent: string
): Omit<ChatMessage, 'id'>[] {
  try {
    const data = JSON.parse(jsonContent)
    const array = Array.isArray(data) ? data : data.messages || []

    return array.map((item: Record<string, unknown>, index: number) => ({
      appearAtSeconds: typeof item.time === 'string'
        ? parseTimeString(item.time as string)
        : (item.seconds as number || item.appearAtSeconds as number || 0),
      senderName: (item.name as string || item.senderName as string || 'ゲスト'),
      senderAvatar: item.avatar as string | null || item.senderAvatar as string | null || null,
      content: (item.message as string || item.content as string || ''),
      messageType: parseMessageType(item.type as string || item.messageType as string),
      order: item.order as number || index
    }))
  } catch {
    return []
  }
}

/**
 * 時間文字列をパース（"1:30" -> 90, "90" -> 90）
 */
function parseTimeString(timeStr: string): number {
  const trimmed = timeStr.trim()

  // MM:SS または HH:MM:SS 形式
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map(Number)
    if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
  }

  // 秒数のみ
  return parseInt(trimmed, 10)
}

/**
 * メッセージタイプをパース
 */
function parseMessageType(typeStr: string | undefined): SimChatMessageType {
  if (!typeStr) return 'COMMENT'

  const normalized = typeStr.toUpperCase()
  switch (normalized) {
    case 'QUESTION':
    case '質問':
      return 'QUESTION'
    case 'REACTION':
    case 'リアクション':
      return 'REACTION'
    case 'TESTIMONIAL':
    case '感想':
    case '証言':
      return 'TESTIMONIAL'
    default:
      return 'COMMENT'
  }
}

/**
 * CSVの1行をパース（引用符対応）
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされた引用符
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

/**
 * チャットメッセージのテンプレート生成
 */
export function generateChatTemplates(
  videoDuration: number,
  density: 'low' | 'medium' | 'high' = 'medium'
): Omit<ChatMessage, 'id'>[] {
  const templates: Omit<ChatMessage, 'id'>[] = []

  // 密度に応じたメッセージ数
  const messageCount = {
    low: Math.floor(videoDuration / 180),    // 3分に1メッセージ
    medium: Math.floor(videoDuration / 90),  // 1.5分に1メッセージ
    high: Math.floor(videoDuration / 45)     // 45秒に1メッセージ
  }[density]

  // 開始時のテンプレート
  const openingMessages = [
    { delay: 10, name: '参加者A', content: 'よろしくお願いします！', type: 'COMMENT' as SimChatMessageType },
    { delay: 25, name: '参加者B', content: '楽しみです', type: 'COMMENT' as SimChatMessageType },
    { delay: 45, name: '参加者C', content: '初めて参加します', type: 'COMMENT' as SimChatMessageType },
  ]

  openingMessages.forEach((msg, index) => {
    templates.push({
      appearAtSeconds: msg.delay,
      senderName: msg.name,
      senderAvatar: null,
      content: msg.content,
      messageType: msg.type,
      order: index
    })
  })

  // 中盤のリアクション
  const reactionMessages = [
    'なるほど！',
    '勉強になります',
    'すごい',
    'そうなんですね',
    '参考になります',
    'わかりやすい！',
    'メモしました',
  ]

  const questionMessages = [
    '質問です。〇〇について詳しく教えてください',
    'これは〇〇にも応用できますか？',
    '初心者でも大丈夫でしょうか？',
  ]

  // 均等に配置
  const interval = Math.floor(videoDuration / messageCount)

  for (let i = 0; i < messageCount; i++) {
    const baseTime = openingMessages.length > 0 ? 60 : 0  // 開始メッセージ後
    const time = baseTime + i * interval + Math.floor(Math.random() * 30)

    if (time >= videoDuration) break

    // 20%は質問、80%はリアクション
    const isQuestion = Math.random() < 0.2
    const messages = isQuestion ? questionMessages : reactionMessages

    templates.push({
      appearAtSeconds: Math.min(time, videoDuration - 60),
      senderName: `参加者${String.fromCharCode(68 + i)}`,  // D, E, F...
      senderAvatar: null,
      content: messages[Math.floor(Math.random() * messages.length)],
      messageType: isQuestion ? 'QUESTION' : 'REACTION',
      order: templates.length
    })
  }

  // 終盤の感想
  if (videoDuration > 300) {  // 5分以上の動画
    const closingStart = videoDuration - 120  // 最後2分

    templates.push({
      appearAtSeconds: closingStart,
      senderName: '参加者X',
      senderAvatar: null,
      content: 'とても参考になりました！',
      messageType: 'TESTIMONIAL',
      order: templates.length
    })

    templates.push({
      appearAtSeconds: closingStart + 30,
      senderName: '参加者Y',
      senderAvatar: null,
      content: 'ありがとうございました',
      messageType: 'COMMENT',
      order: templates.length
    })
  }

  return templates.sort((a, b) => a.appearAtSeconds - b.appearAtSeconds)
}
