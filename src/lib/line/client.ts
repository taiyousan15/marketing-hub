import {
  Client,
  TextMessage,
  FlexMessage,
  TemplateMessage,
  Message,
  QuickReply,
  QuickReplyItem,
  Action,
} from "@line/bot-sdk";
import crypto from "crypto";

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.LINE_CHANNEL_SECRET;

// ビルド時やLINEキーがない場合のダミークライアント
export const lineClient = channelAccessToken
  ? new Client({
      channelAccessToken,
      channelSecret: channelSecret || "",
    })
  : (null as unknown as Client);

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * リトライ付きAPI呼び出し
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error &&
        "statusCode" in error &&
        (error as { statusCode: number }).statusCode === 429;
      const isServerError =
        error instanceof Error &&
        "statusCode" in error &&
        (error as { statusCode: number }).statusCode >= 500;

      if (attempt === retries || (!isRateLimit && !isServerError)) {
        throw error;
      }

      const delay = isRateLimit
        ? RETRY_DELAY_MS * attempt * 2
        : RETRY_DELAY_MS * attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}

/**
 * テキストメッセージを送信
 */
export async function pushTextMessage(userId: string, text: string) {
  const message: TextMessage = { type: "text", text };
  return withRetry(() => lineClient.pushMessage(userId, message));
}

/**
 * Flex Messageを送信
 */
export async function pushFlexMessage(
  userId: string,
  altText: string,
  contents: FlexMessage["contents"]
) {
  const message: FlexMessage = { type: "flex", altText, contents };
  return withRetry(() => lineClient.pushMessage(userId, message));
}

/**
 * テンプレートメッセージを送信
 */
export async function pushTemplateMessage(
  userId: string,
  altText: string,
  template: TemplateMessage["template"]
) {
  const message: TemplateMessage = { type: "template", altText, template };
  return withRetry(() => lineClient.pushMessage(userId, message));
}

/**
 * ボタンテンプレートを送信
 */
export async function pushButtonTemplate(
  userId: string,
  options: {
    altText: string;
    title?: string;
    text: string;
    thumbnailImageUrl?: string;
    actions: Action[];
  }
) {
  return pushTemplateMessage(userId, options.altText, {
    type: "buttons",
    title: options.title,
    text: options.text,
    thumbnailImageUrl: options.thumbnailImageUrl,
    actions: options.actions,
  });
}

/**
 * 確認テンプレートを送信
 */
export async function pushConfirmTemplate(
  userId: string,
  options: {
    altText: string;
    text: string;
    actions: [Action, Action];
  }
) {
  return pushTemplateMessage(userId, options.altText, {
    type: "confirm",
    text: options.text,
    actions: options.actions,
  });
}

/**
 * カルーセルテンプレートを送信
 */
export async function pushCarouselTemplate(
  userId: string,
  options: {
    altText: string;
    columns: Array<{
      thumbnailImageUrl?: string;
      title?: string;
      text: string;
      actions: Action[];
    }>;
  }
) {
  return pushTemplateMessage(userId, options.altText, {
    type: "carousel",
    columns: options.columns,
  });
}

/**
 * クイックリプライ付きメッセージを送信
 */
export async function pushMessageWithQuickReply(
  userId: string,
  text: string,
  items: QuickReplyItem[]
) {
  const quickReply: QuickReply = { items };
  const message: TextMessage = { type: "text", text, quickReply };
  return withRetry(() => lineClient.pushMessage(userId, message));
}

/**
 * リプライメッセージ（Webhook応答用）
 */
export async function replyMessage(replyToken: string, messages: Message[]) {
  return withRetry(() => lineClient.replyMessage(replyToken, messages));
}

/**
 * リプライテキストメッセージ
 */
export async function replyTextMessage(replyToken: string, text: string) {
  const message: TextMessage = { type: "text", text };
  return withRetry(() => lineClient.replyMessage(replyToken, message));
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
    await withRetry(() => lineClient.multicast(chunk, messages));
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * 全フォロワーに一斉配信（Broadcast）
 */
export async function broadcastMessage(messages: Message[]) {
  return withRetry(() => lineClient.broadcast(messages));
}

/**
 * ユーザープロフィールを取得
 */
export async function getUserProfile(userId: string) {
  return withRetry(() => lineClient.getProfile(userId));
}

/**
 * Webhook署名を検証
 */
export function validateSignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET || "";
  const hash = crypto
    .createHmac("SHA256", secret)
    .update(body)
    .digest("base64");
  return hash === signature;
}
