import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const POLL_INTERVAL_MS = 2000;
const HEARTBEAT_INTERVAL_MS = 15000;

/**
 * GET: SSE ストリーム — 新しい視聴者コメントをリアルタイムでプッシュ
 * EventSource で購読する
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const encoder = new TextEncoder();
  let closed = false;
  let lastFetchedAt = new Date();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // 初回接続時: 過去60秒分のメッセージを送信
      const sendInitial = async () => {
        try {
          const since = new Date(Date.now() - 60 * 1000);
          const messages = await prisma.viewerChatMessage.findMany({
            where: { autoWebinarId: id, createdAt: { gt: since } },
            orderBy: { createdAt: "asc" },
            take: 100,
          });
          send("init", { messages });
          lastFetchedAt = new Date();
        } catch (err) {
          console.error("[SSE init] error:", err);
        }
      };

      // ポーリング: 新しいコメントを差分取得
      const poll = async () => {
        if (closed) return;
        try {
          const since = lastFetchedAt;
          const now = new Date();
          const messages = await prisma.viewerChatMessage.findMany({
            where: { autoWebinarId: id, createdAt: { gt: since } },
            orderBy: { createdAt: "asc" },
          });
          lastFetchedAt = now;

          if (messages.length > 0) {
            send("messages", { messages });
          }
        } catch (err) {
          console.error("[SSE poll] error:", err);
        }
      };

      // ハートビート
      const heartbeat = () => {
        if (closed) return;
        const payload = `: heartbeat\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // 接続確立を通知
      send("connected", { timestamp: new Date().toISOString() });

      sendInitial();

      const pollTimer = setInterval(poll, POLL_INTERVAL_MS);
      const heartbeatTimer = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);

      // クライアント切断時のクリーンアップ
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
