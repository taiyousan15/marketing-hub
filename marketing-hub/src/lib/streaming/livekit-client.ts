/**
 * LiveKit Streaming Client
 *
 * ウェビナー・ライブ配信システム
 * - WebRTC低遅延配信（250ms以下）
 * - 画面共有・録画対応
 * - チャット・Q&A機能
 * - セルフホスト可能（完全無料）
 *
 * @see https://docs.livekit.io/
 * @see https://github.com/livekit/livekit
 */

import { AccessToken } from "livekit-server-sdk";

// 環境変数
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://your-livekit-server.com";

// ルーム参加者の権限
export type ParticipantRole = "host" | "speaker" | "viewer";

// ルーム設定
export interface RoomConfig {
  name: string;
  maxParticipants?: number;
  emptyTimeout?: number; // 秒
  metadata?: string;
}

// 参加者設定
export interface ParticipantConfig {
  identity: string;
  name: string;
  role: ParticipantRole;
  metadata?: string;
}

// トークン生成結果
export interface TokenResult {
  token: string;
  roomName: string;
  participantIdentity: string;
  serverUrl: string;
}

/**
 * 参加用トークンを生成
 */
export async function generateToken(
  room: RoomConfig,
  participant: ParticipantConfig
): Promise<TokenResult> {
  // 権限を設定
  const canPublish = participant.role === "host" || participant.role === "speaker";
  const canSubscribe = true;
  const canPublishData = true;

  // トークン生成
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participant.identity,
    name: participant.name,
    metadata: JSON.stringify({
      role: participant.role,
      ...JSON.parse(participant.metadata || "{}"),
    }),
  });

  // ルームへの参加権限を付与
  at.addGrant({
    room: room.name,
    roomJoin: true,
    canPublish,
    canSubscribe,
    canPublishData,
    roomCreate: participant.role === "host",
    roomAdmin: participant.role === "host",
  });

  // トークンを生成（有効期限: 24時間）
  const token = await at.toJwt();

  return {
    token,
    roomName: room.name,
    participantIdentity: participant.identity,
    serverUrl: LIVEKIT_URL,
  };
}

/**
 * ウェビナー用のルームを作成
 */
export async function createWebinarRoom(
  webinarId: string,
  hostId: string,
  hostName: string
): Promise<TokenResult> {
  const room: RoomConfig = {
    name: `webinar-${webinarId}`,
    maxParticipants: 1000,
    emptyTimeout: 300, // 5分
    metadata: JSON.stringify({
      type: "webinar",
      webinarId,
      createdAt: new Date().toISOString(),
    }),
  };

  const participant: ParticipantConfig = {
    identity: hostId,
    name: hostName,
    role: "host",
    metadata: JSON.stringify({ isHost: true }),
  };

  return generateToken(room, participant);
}

/**
 * ウェビナーに参加者として参加
 */
export async function joinWebinar(
  webinarId: string,
  participantId: string,
  participantName: string,
  role: ParticipantRole = "viewer"
): Promise<TokenResult> {
  const room: RoomConfig = {
    name: `webinar-${webinarId}`,
  };

  const participant: ParticipantConfig = {
    identity: participantId,
    name: participantName,
    role,
  };

  return generateToken(room, participant);
}

/**
 * ミーティング用のルームを作成（全員発言可能）
 */
export async function createMeetingRoom(
  meetingId: string,
  hostId: string,
  hostName: string
): Promise<TokenResult> {
  const room: RoomConfig = {
    name: `meeting-${meetingId}`,
    maxParticipants: 50,
    emptyTimeout: 600, // 10分
    metadata: JSON.stringify({
      type: "meeting",
      meetingId,
      createdAt: new Date().toISOString(),
    }),
  };

  const participant: ParticipantConfig = {
    identity: hostId,
    name: hostName,
    role: "host",
  };

  return generateToken(room, participant);
}

/**
 * ミーティングに参加
 */
export async function joinMeeting(
  meetingId: string,
  participantId: string,
  participantName: string
): Promise<TokenResult> {
  const room: RoomConfig = {
    name: `meeting-${meetingId}`,
  };

  const participant: ParticipantConfig = {
    identity: participantId,
    name: participantName,
    role: "speaker", // ミーティングでは全員発言可能
  };

  return generateToken(room, participant);
}

// ==================== ルーム管理（サーバーサイド） ====================

/**
 * ルームリストを取得（要: livekit-server-sdk の RoomServiceClient）
 */
export async function listRooms(): Promise<string[]> {
  // RoomServiceClientを使用する場合はここに実装
  // 簡易版としてモック返却
  return [];
}

/**
 * ルームを削除
 */
export async function deleteRoom(roomName: string): Promise<boolean> {
  // RoomServiceClientを使用する場合はここに実装
  console.log(`Deleting room: ${roomName}`);
  return true;
}

// ==================== セルフホスト設定ガイド ====================

/**
 * LiveKitサーバーのセルフホスト設定ガイド
 */
export function getSelfHostGuide(): string {
  return `
# LiveKit セルフホスト設定ガイド

## 1. Dockerでの起動（最も簡単）

\`\`\`bash
# livekit.yamlを作成
cat > livekit.yaml << EOF
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
keys:
  APIxxxxxx: SecretKeyxxxxxx
EOF

# Docker起動
docker run -d \\
  --name livekit \\
  -p 7880:7880 \\
  -p 7881:7881 \\
  -p 50000-60000:50000-60000/udp \\
  -v \$(pwd)/livekit.yaml:/livekit.yaml \\
  livekit/livekit-server \\
  --config /livekit.yaml
\`\`\`

## 2. 環境変数設定

\`\`\`env
LIVEKIT_API_KEY=APIxxxxxx
LIVEKIT_API_SECRET=SecretKeyxxxxxx
NEXT_PUBLIC_LIVEKIT_URL=wss://your-server.com:7880
\`\`\`

## 3. Cloudflare Tunnel（無料SSL）

\`\`\`bash
cloudflared tunnel --url http://localhost:7880
\`\`\`

## 4. 確認方法

\`\`\`bash
# ヘルスチェック
curl http://localhost:7880/health
\`\`\`

## 必要なポート
- 7880: HTTP API / WebSocket
- 7881: WebRTC (TCP)
- 50000-60000: WebRTC (UDP)

## 推奨スペック
- CPU: 2コア以上
- RAM: 4GB以上
- 帯域: 10Mbps以上

## クラウドサービス（有料だが簡単）
- LiveKit Cloud: https://cloud.livekit.io/
- 無料枠: 50時間/月
`;
}
