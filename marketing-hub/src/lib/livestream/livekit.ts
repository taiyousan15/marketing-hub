/**
 * LiveKit統合ユーティリティ
 * WebRTCベースのリアルタイムライブ配信基盤
 */

import { AccessToken } from "livekit-server-sdk";

// 環境変数から設定を取得
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://localhost:7880";

export interface TokenOptions {
  roomName: string;
  participantName: string;
  participantIdentity: string;
  isHost?: boolean;
  metadata?: string;
}

/**
 * LiveKitアクセストークンを生成
 */
export async function createToken(options: TokenOptions): Promise<string> {
  const { roomName, participantName, participantIdentity, isHost = false, metadata } = options;

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantIdentity,
    name: participantName,
    metadata,
  });

  // ホスト権限
  if (isHost) {
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: true,
      roomCreate: true,
      roomRecord: true,
    });
  } else {
    // 視聴者権限
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: false,
      canSubscribe: true,
      canPublishData: true, // チャット用
    });
  }

  return await token.toJwt();
}

/**
 * ルーム名を生成（イベントIDベース）
 */
export function generateRoomName(eventId: string): string {
  return `event-${eventId}`;
}

/**
 * LiveKit WebSocket URLを取得
 */
export function getLiveKitUrl(): string {
  return LIVEKIT_URL;
}

/**
 * LiveKit設定が有効かチェック
 */
export function isLiveKitConfigured(): boolean {
  return !!(LIVEKIT_API_KEY && LIVEKIT_API_SECRET);
}

/**
 * 配信ステータス
 */
export type StreamStatus = "idle" | "connecting" | "live" | "ended" | "error";

/**
 * 録画設定
 */
export interface RecordingConfig {
  enabled: boolean;
  outputPath?: string;
  format?: "mp4" | "webm";
}

/**
 * チャット設定
 */
export interface ChatConfig {
  enabled: boolean;
  moderationEnabled?: boolean;
  slowModeSeconds?: number;
}
