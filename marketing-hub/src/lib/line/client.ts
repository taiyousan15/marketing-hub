import { Client, TextMessage, FlexMessage, Message } from "@line/bot-sdk";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_CHANNEL_SECRET;

// ビルド時やLINEキーがない場合のダミークライアント
export const lineClient = channelAccessToken
  ? new Client({
      channelAccessToken,
      channelSecret: channelSecret || "",
    })
  : (null as unknown as Client);

/**
 * テキストメッセージを送信
 */
export async function pushTextMessage(userId: string, text: string) {
  const message: TextMessage = {
    type: "text",
    text,
  };
  return lineClient.pushMessage(userId, message);
}

/**
 * Flex Messageを送信
 */
export async function pushFlexMessage(
  userId: string,
  altText: string,
  contents: FlexMessage["contents"]
) {
  const message: FlexMessage = {
    type: "flex",
    altText,
    contents,
  };
  return lineClient.pushMessage(userId, message);
}

/**
 * 複数ユーザーに一括送信（Multicast）
 * 最大500人まで
 */
export async function multicastMessage(userIds: string[], messages: Message[]) {
  const CHUNK_SIZE = 500;
  const chunks: string[][] = [];

  for (let i = 0; i < userIds.length; i += CHUNK_SIZE) {
    chunks.push(userIds.slice(i, i + CHUNK_SIZE));
  }

  for (const chunk of chunks) {
    await lineClient.multicast(chunk, messages);
    // レート制限対策
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * 全フォロワーに一斉配信（Broadcast）
 */
export async function broadcastMessage(messages: Message[]) {
  return lineClient.broadcast(messages);
}

/**
 * ユーザープロフィールを取得
 */
export async function getUserProfile(userId: string) {
  return lineClient.getProfile(userId);
}

/**
 * Webhook署名を検証
 */
export function validateSignature(body: string, signature: string): boolean {
  const crypto = require("crypto");
  const channelSecret = process.env.LINE_CHANNEL_SECRET || "";
  const hash = crypto
    .createHmac("SHA256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}
