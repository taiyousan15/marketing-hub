// src/lib/auto-webinar/playback.ts
// 擬似ライブ動画同期ロジック

/**
 * 再生状態
 */
export interface PlaybackState {
  videoStartTime: Date        // 動画が開始された時刻
  currentServerTime: Date     // 現在のサーバー時刻
  videoDuration: number       // 動画の長さ（秒）
  currentPosition: number     // 現在の再生位置（秒）
  isLive: boolean             // ライブ中かどうか
  isEnded: boolean            // 終了したかどうか
  timeUntilStart?: number     // 開始までの秒数（未開始の場合）
}

/**
 * サーバー時間ベースの再生位置を計算
 */
export function calculatePlaybackPosition(
  sessionStart: Date,
  videoDuration: number,
  currentTime: Date = new Date()
): number {
  const elapsedSeconds = Math.floor(
    (currentTime.getTime() - sessionStart.getTime()) / 1000
  )

  // 0以上、動画長さ以下に制限
  return Math.max(0, Math.min(elapsedSeconds, videoDuration))
}

/**
 * 再生状態を取得
 */
export function getPlaybackState(
  scheduledStartAt: Date,
  videoDuration: number,
  currentTime: Date = new Date()
): PlaybackState {
  const timeDiff = currentTime.getTime() - scheduledStartAt.getTime()
  const elapsedSeconds = Math.floor(timeDiff / 1000)

  // 未開始
  if (elapsedSeconds < 0) {
    return {
      videoStartTime: scheduledStartAt,
      currentServerTime: currentTime,
      videoDuration,
      currentPosition: 0,
      isLive: false,
      isEnded: false,
      timeUntilStart: Math.abs(elapsedSeconds)
    }
  }

  // 終了後
  if (elapsedSeconds >= videoDuration) {
    return {
      videoStartTime: scheduledStartAt,
      currentServerTime: currentTime,
      videoDuration,
      currentPosition: videoDuration,
      isLive: false,
      isEnded: true
    }
  }

  // ライブ中
  return {
    videoStartTime: scheduledStartAt,
    currentServerTime: currentTime,
    videoDuration,
    currentPosition: elapsedSeconds,
    isLive: true,
    isEnded: false
  }
}

/**
 * クライアント側の同期補正
 * 2秒以上のずれがある場合に補正が必要
 */
export interface SyncCorrection {
  needsCorrection: boolean
  targetPosition: number
  drift: number  // ずれ（秒）。正=遅れ、負=進み
}

export function calculateSyncCorrection(
  clientPosition: number,
  serverPosition: number,
  toleranceSeconds: number = 2
): SyncCorrection {
  const drift = serverPosition - clientPosition
  const needsCorrection = Math.abs(drift) > toleranceSeconds

  return {
    needsCorrection,
    targetPosition: serverPosition,
    drift
  }
}

/**
 * 完了率を計算
 */
export function calculateCompletionPercent(
  maxWatchedSeconds: number,
  videoDuration: number
): number {
  if (videoDuration <= 0) return 0
  return Math.min(100, (maxWatchedSeconds / videoDuration) * 100)
}

/**
 * シーク防止のための位置検証
 * ライブ視聴時は現在位置より先にシークできない
 */
export function validateSeekPosition(
  requestedPosition: number,
  maxAllowedPosition: number,
  isReplay: boolean
): {
  allowed: boolean
  correctedPosition: number
} {
  // リプレイ時は自由にシーク可能
  if (isReplay) {
    return {
      allowed: true,
      correctedPosition: requestedPosition
    }
  }

  // ライブ時は現在位置より先にはシークできない
  if (requestedPosition > maxAllowedPosition) {
    return {
      allowed: false,
      correctedPosition: maxAllowedPosition
    }
  }

  return {
    allowed: true,
    correctedPosition: requestedPosition
  }
}

/**
 * 動画タイプごとの埋め込みURL生成
 */
export function generateEmbedUrl(
  videoUrl: string,
  videoType: 'YOUTUBE' | 'VIMEO' | 'UPLOAD',
  options: {
    autoplay?: boolean
    controls?: boolean
    startTime?: number
  } = {}
): string {
  const { autoplay = true, controls = false, startTime = 0 } = options

  switch (videoType) {
    case 'YOUTUBE': {
      // YouTubeのURLからIDを抽出
      const videoId = extractYouTubeId(videoUrl)
      if (!videoId) return videoUrl

      const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        controls: controls ? '1' : '0',
        start: String(Math.floor(startTime)),
        rel: '0',
        modestbranding: '1',
        playsinline: '1',
        enablejsapi: '1'
      })

      return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
    }

    case 'VIMEO': {
      // VimeoのURLからIDを抽出
      const videoId = extractVimeoId(videoUrl)
      if (!videoId) return videoUrl

      const params = new URLSearchParams({
        autoplay: autoplay ? '1' : '0',
        controls: controls ? '1' : '0',
        playsinline: '1',
        quality: 'auto',
        transparent: '1'
      })

      // Vimeoは#t=秒数で開始位置を指定
      return `https://player.vimeo.com/video/${videoId}?${params.toString()}#t=${Math.floor(startTime)}s`
    }

    case 'UPLOAD':
      // 直接URLの場合はそのまま返す
      return videoUrl

    default:
      return videoUrl
  }
}

/**
 * YouTubeのURLからVideo IDを抽出
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/  // IDのみの場合
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * VimeoのURLからVideo IDを抽出
 */
function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /^(\d+)$/  // IDのみの場合
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * 動画URLからタイプを推定
 */
export function detectVideoType(url: string): 'YOUTUBE' | 'VIMEO' | 'UPLOAD' {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'YOUTUBE'
  }
  if (url.includes('vimeo.com')) {
    return 'VIMEO'
  }
  return 'UPLOAD'
}
