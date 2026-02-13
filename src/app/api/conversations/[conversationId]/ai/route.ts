import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { triggerConversationUpdate } from "@/lib/pusher/server";

/**
 * POST /api/conversations/[conversationId]/ai
 * AI応答モードの切り替え（AIに任せる / オペレーター対応に戻す）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  let body: { enabled: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "enabled (boolean) is required" },
      { status: 400 }
    );
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, tenantId: true, isAIHandling: true },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  // AI応答モードを更新
  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { isAIHandling: body.enabled },
    select: { id: true, isAIHandling: true },
  });

  // ダッシュボードにリアルタイム通知
  await triggerConversationUpdate(conversation.tenantId, {
    conversationId,
    isAIHandling: updated.isAIHandling,
  });

  return NextResponse.json({ isAIHandling: updated.isAIHandling });
}
