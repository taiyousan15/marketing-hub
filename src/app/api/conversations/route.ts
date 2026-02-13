import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/conversations
 * 会話一覧を取得（最新メッセージ付き）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const channel = searchParams.get("channel");
  const status = searchParams.get("status") || "ACTIVE";

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenantId is required" },
      { status: 400 }
    );
  }

  const where: Record<string, unknown> = { tenantId, status };
  if (channel) {
    where.channel = channel;
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      contact: {
        select: {
          id: true,
          name: true,
          lineUserId: true,
          email: true,
          score: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          content: true,
          direction: true,
          senderType: true,
          createdAt: true,
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  const result = conversations.map((conv) => ({
    id: conv.id,
    contactId: conv.contactId,
    contactName: conv.contact.name || "名前なし",
    channel: conv.channel,
    status: conv.status,
    isAIHandling: conv.isAIHandling,
    lastMessage: conv.messages[0] || null,
    lastMessageAt: conv.lastMessageAt,
  }));

  return NextResponse.json({ conversations: result });
}
