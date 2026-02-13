import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  generateAIResponse,
  shouldAIRespond,
  isAIConfigured,
  systemPrompts,
  ChatMessage,
} from "@/lib/ai/claude";
import { pushTextMessage } from "@/lib/line/client";
import { triggerNewMessage, triggerConversationUpdate } from "@/lib/pusher/server";

/**
 * POST /api/conversations/[conversationId]/ai/respond
 * 最新メッセージに対するAI自動応答を生成・送信
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;

  // AI機能の設定チェック
  if (!isAIConfigured) {
    return NextResponse.json(
      { error: "AI機能が設定されていません。ANTHROPIC_API_KEYを確認してください。" },
      { status: 503 }
    );
  }

  // 会話を取得（コンタクト情報含む）
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      contact: {
        select: { id: true, lineUserId: true, name: true },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  if (!conversation.isAIHandling) {
    return NextResponse.json(
      { error: "AI応答モードが無効です。先にAIモードを有効化してください。" },
      { status: 400 }
    );
  }

  const lineUserId = conversation.contact.lineUserId;
  if (!lineUserId) {
    return NextResponse.json(
      { error: "Contact has no LINE user ID" },
      { status: 400 }
    );
  }

  // 直近10件のメッセージを取得してコンテキストを構築
  const recentMessages = await prisma.messageHistory.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      content: true,
      direction: true,
      senderType: true,
      createdAt: true,
    },
  });

  // 時系列順に並び替え
  const orderedMessages = [...recentMessages].reverse();

  if (orderedMessages.length === 0) {
    return NextResponse.json(
      { error: "会話にメッセージがありません" },
      { status: 400 }
    );
  }

  // 最新のINBOUNDメッセージからテキストを取得
  const latestInbound = orderedMessages
    .filter((m) => m.direction === "INBOUND")
    .pop();

  if (!latestInbound) {
    return NextResponse.json(
      { error: "応答対象の受信メッセージがありません" },
      { status: 400 }
    );
  }

  const latestText = extractTextFromContent(latestInbound.content);

  // 人間への引き継ぎが必要か判定
  const aiDecision = shouldAIRespond(latestText);

  if (!aiDecision.shouldRespond) {
    // 人間への引き継ぎが必要 → システムメッセージを保存
    const systemMessage = await prisma.messageHistory.create({
      data: {
        tenantId: conversation.tenantId,
        contactId: conversation.contact.id,
        conversationId,
        channel: "LINE",
        direction: "OUTBOUND",
        senderType: "SYSTEM",
        content: {
          type: "system",
          text: `[AI判定] ${aiDecision.reason || "人間のオペレーターへの引き継ぎが必要です"}`,
        },
        status: "SENT",
        sentAt: new Date(),
        metadata: {
          aiHandoff: true,
          reason: aiDecision.reason,
        },
      },
    });

    // AI応答モードを自動OFF
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { isAIHandling: false },
    });

    // リアルタイム通知
    await triggerNewMessage(conversationId, {
      id: systemMessage.id,
      content: systemMessage.content,
      direction: systemMessage.direction,
      senderType: systemMessage.senderType,
      createdAt: systemMessage.createdAt,
    });

    await triggerConversationUpdate(conversation.tenantId, {
      conversationId,
      isAIHandling: false,
    });

    return NextResponse.json({
      responded: false,
      handoff: true,
      reason: aiDecision.reason,
    });
  }

  // ChatMessage形式に変換
  const chatMessages: ChatMessage[] = orderedMessages
    .filter((m) => {
      const text = extractTextFromContent(m.content);
      return text.length > 0;
    })
    .map((m) => ({
      role: m.direction === "INBOUND" ? "user" as const : "assistant" as const,
      content: extractTextFromContent(m.content),
    }));

  // AI応答を生成
  let aiResponseText: string;
  try {
    aiResponseText = await generateAIResponse(
      chatMessages,
      systemPrompts.customerSupport
    );
  } catch (error) {
    console.error("[AI Respond] Failed to generate AI response:", error);
    return NextResponse.json(
      { error: "AI応答の生成に失敗しました" },
      { status: 502 }
    );
  }

  if (!aiResponseText) {
    return NextResponse.json(
      { error: "AI応答が空でした" },
      { status: 502 }
    );
  }

  // LINEにメッセージ送信
  try {
    await pushTextMessage(lineUserId, aiResponseText);
  } catch (error) {
    console.error("[AI Respond] Failed to send LINE message:", error);
    return NextResponse.json(
      { error: "LINEメッセージの送信に失敗しました" },
      { status: 502 }
    );
  }

  // AI応答をDBに保存
  const aiMessage = await prisma.messageHistory.create({
    data: {
      tenantId: conversation.tenantId,
      contactId: conversation.contact.id,
      conversationId,
      channel: "LINE",
      direction: "OUTBOUND",
      senderType: "AI",
      content: { type: "text", text: aiResponseText },
      status: "SENT",
      sentAt: new Date(),
      metadata: {
        aiGenerated: true,
        model: "claude-sonnet-4-20250514",
      },
    },
  });

  // 会話の最終メッセージ時間を更新
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date() },
  });

  // リアルタイム通知
  await triggerNewMessage(conversationId, {
    id: aiMessage.id,
    content: aiMessage.content,
    direction: aiMessage.direction,
    senderType: aiMessage.senderType,
    createdAt: aiMessage.createdAt,
  });

  await triggerConversationUpdate(conversation.tenantId, {
    conversationId,
    lastMessage: {
      content: aiMessage.content,
      direction: aiMessage.direction,
      senderType: aiMessage.senderType,
      createdAt: aiMessage.createdAt,
    },
  });

  return NextResponse.json({
    responded: true,
    message: {
      id: aiMessage.id,
      content: aiMessage.content,
      senderType: aiMessage.senderType,
      createdAt: aiMessage.createdAt,
    },
  });
}

/**
 * メッセージcontentフィールド（Json型）からテキストを抽出
 */
function extractTextFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (content && typeof content === "object" && "text" in content) {
    return String((content as { text: unknown }).text);
  }
  return "";
}
