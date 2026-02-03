import { NextRequest, NextResponse } from "next/server";
import { WebhookEvent } from "@line/bot-sdk";
import { validateSignature } from "@/lib/line/client";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  // 署名検証
  if (!signature || !validateSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { events } = JSON.parse(body) as { events: WebhookEvent[] };

  // 各イベントを処理
  for (const event of events) {
    await handleLineEvent(event);
  }

  return NextResponse.json({ success: true });
}

async function handleLineEvent(event: WebhookEvent) {
  switch (event.type) {
    case "follow":
      await handleFollow(event);
      break;
    case "unfollow":
      await handleUnfollow(event);
      break;
    case "message":
      await handleMessage(event);
      break;
    case "postback":
      await handlePostback(event);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleFollow(event: WebhookEvent & { type: "follow" }) {
  const userId = event.source.userId;
  if (!userId) return;

  // TODO: テナントIDを特定する方法を実装
  // 現状はWebhook URLにテナント識別子を含める等で対応

  console.log(`New follower: ${userId}`);

  // コンタクトを作成または更新
  // await prisma.contact.upsert({...})
}

async function handleUnfollow(event: WebhookEvent & { type: "unfollow" }) {
  const userId = event.source.userId;
  if (!userId) return;

  console.log(`Unfollowed: ${userId}`);

  // コンタクトのLINEオプトイン状態を更新
  // await prisma.contact.updateMany({
  //   where: { lineUserId: userId },
  //   data: { lineOptIn: false },
  // });
}

async function handleMessage(event: WebhookEvent & { type: "message" }) {
  const userId = event.source.userId;
  if (!userId) return;

  if (event.message.type === "text") {
    const text = event.message.text;
    console.log(`Message from ${userId}: ${text}`);

    // 自動応答のチェック
    // await checkAutoResponse(userId, text);
  }
}

async function handlePostback(event: WebhookEvent & { type: "postback" }) {
  const userId = event.source.userId;
  if (!userId) return;

  const data = event.postback.data;
  console.log(`Postback from ${userId}: ${data}`);

  // ポストバックデータを解析してアクションを実行
  // const params = new URLSearchParams(data);
  // await handlePostbackAction(userId, params);
}
