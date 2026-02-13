import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { pushTextMessage } from "@/lib/line/client";
import { triggerNewMessage, triggerConversationUpdate } from "@/lib/pusher/server";

/**
 * GET /api/conversations/[conversationId]/messages
 * 会話内のメッセージ一覧を取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const cursor = searchParams.get("cursor");

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, tenantId: true, contactId: true, channel: true },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const where: Record<string, unknown> = {
    conversationId,
  };
  if (cursor) {
    where.createdAt = { lt: new Date(cursor) };
  }

  const messages = await prisma.messageHistory.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      content: true,
      direction: true,
      senderType: true,
      status: true,
      createdAt: true,
      metadata: true,
    },
  });

  return NextResponse.json({
    messages: messages.reverse(),
    hasMore: messages.length === limit,
  });
}

/**
 * POST /api/conversations/[conversationId]/messages
 * オペレーターからメッセージを送信
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const body = await request.json();
  const { text } = body;

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { error: "text is required" },
      { status: 400 }
    );
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      contact: { select: { id: true, lineUserId: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  // LINEに送信
  const lineUserId = conversation.contact.lineUserId;
  if (!lineUserId) {
    return NextResponse.json(
      { error: "Contact has no LINE user ID" },
      { status: 400 }
    );
  }

  try {
    await pushTextMessage(lineUserId, text);
  } catch (error) {
    console.error("[Chat] Failed to send LINE message:", error);
    return NextResponse.json(
      { error: "Failed to send LINE message" },
      { status: 502 }
    );
  }

  // DB保存
  const message = await prisma.messageHistory.create({
    data: {
      tenantId: conversation.tenantId,
      contactId: conversation.contact.id,
      conversationId,
      channel: "LINE",
      direction: "OUTBOUND",
      senderType: "OPERATOR",
      content: { type: "text", text },
      status: "SENT",
      sentAt: new Date(),
    },
  });

  // 会話の最終メッセージ時間を更新
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  // リアルタイム通知（Pusher）
  await triggerNewMessage(conversationId, {
    id: message.id,
    content: message.content,
    direction: message.direction,
    senderType: message.senderType,
    createdAt: message.createdAt,
  });

  await triggerConversationUpdate(conversation.tenantId, {
    conversationId,
    lastMessage: {
      content: message.content,
      direction: message.direction,
      senderType: message.senderType,
      createdAt: message.createdAt,
    },
  });

  return NextResponse.json({ message });
}
