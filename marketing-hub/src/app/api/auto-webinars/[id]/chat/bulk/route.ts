import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { parseCSVMessages, parseJSONMessages, generateChatTemplates, type ChatMessage } from "@/lib/auto-webinar/chat";
import type { SimChatMessageType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type ChatMessageInput = Omit<ChatMessage, "id">;

/**
 * チャットメッセージ一括インポート
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const { format, content, generateTemplate, density, clearExisting = false } = body;

    // 既存メッセージを削除
    if (clearExisting) {
      await prisma.autoWebinarChatMessage.deleteMany({
        where: { webinarId: id },
      });
    }

    let messages: ChatMessageInput[] = [];

    // テンプレート生成
    if (generateTemplate) {
      messages = generateChatTemplates(
        webinar.videoDuration,
        density || "medium"
      );
    }
    // CSVインポート
    else if (format === "csv" && content) {
      messages = parseCSVMessages(content);
    }
    // JSONインポート
    else if (format === "json" && content) {
      messages = parseJSONMessages(content);
    }
    // 配列で直接渡された場合
    else if (Array.isArray(body.messages)) {
      messages = body.messages.map((m: Record<string, unknown>, index: number) => ({
        appearAtSeconds: m.appearAtSeconds as number || m.seconds as number || 0,
        senderName: m.senderName as string || m.name as string || "ゲスト",
        senderAvatar: m.senderAvatar as string | null || null,
        content: m.content as string || m.message as string || "",
        messageType: (m.messageType || "COMMENT") as SimChatMessageType,
        order: m.order as number || index,
      }));
    } else {
      return NextResponse.json(
        { error: "Either format+content, generateTemplate, or messages array is required" },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json({ error: "No valid messages found" }, { status: 400 });
    }

    // 一括作成
    const created = await prisma.autoWebinarChatMessage.createMany({
      data: messages.map((m) => ({
        webinarId: id,
        appearAtSeconds: m.appearAtSeconds,
        senderName: m.senderName,
        senderAvatar: m.senderAvatar || null,
        content: m.content,
        messageType: m.messageType,
        order: m.order,
      })),
    });

    // 作成後のメッセージを取得
    const allMessages = await prisma.autoWebinarChatMessage.findMany({
      where: { webinarId: id },
      orderBy: [{ appearAtSeconds: "asc" }, { order: "asc" }],
    });

    return NextResponse.json({
      imported: created.count,
      total: allMessages.length,
      messages: allMessages,
    });
  } catch (error) {
    console.error("Failed to bulk import chat messages:", error);
    return NextResponse.json({ error: "Failed to import messages" }, { status: 500 });
  }
}
