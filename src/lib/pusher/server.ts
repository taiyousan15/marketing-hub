import Pusher from "pusher";

const pusherServer =
  process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER || "ap3",
        useTLS: true,
      })
    : null;

/**
 * チャンネル名を生成
 */
export function getConversationChannel(conversationId: string): string {
  return `conversation-${conversationId}`;
}

export function getTenantChannel(tenantId: string): string {
  return `tenant-${tenantId}`;
}

/**
 * 新着メッセージをリアルタイム通知
 */
export async function triggerNewMessage(
  conversationId: string,
  message: {
    id: string;
    content: unknown;
    direction: string;
    senderType: string;
    createdAt: Date;
  }
): Promise<void> {
  if (!pusherServer) return;

  await pusherServer.trigger(
    getConversationChannel(conversationId),
    "new-message",
    message
  );
}

/**
 * 会話一覧の更新を通知（新着メッセージ・ステータス変更）
 */
export async function triggerConversationUpdate(
  tenantId: string,
  update: {
    conversationId: string;
    lastMessage?: unknown;
    status?: string;
    isAIHandling?: boolean;
  }
): Promise<void> {
  if (!pusherServer) return;

  await pusherServer.trigger(
    getTenantChannel(tenantId),
    "conversation-update",
    update
  );
}

export { pusherServer };
