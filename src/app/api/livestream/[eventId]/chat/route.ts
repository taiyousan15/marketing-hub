import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

type Params = { eventId: string };

/**
 * チャットメッセージ取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");

    const livestream = await prisma.liveStream.findFirst({
      where: { eventId },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "Livestream not found" },
        { status: 404 }
      );
    }

    const messages = await prisma.liveChatMessage.findMany({
      where: {
        liveStreamId: livestream.id,
        isHidden: false,
        ...(cursor ? { createdAt: { gt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    return NextResponse.json({
      messages,
      nextCursor:
        messages.length > 0
          ? messages[messages.length - 1].createdAt.toISOString()
          : null,
    });
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * チャットメッセージ送信
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { eventId } = await params;
    const body = await request.json();

    const livestream = await prisma.liveStream.findFirst({
      where: { eventId },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "Livestream not found" },
        { status: 404 }
      );
    }

    if (!livestream.chatEnabled) {
      return NextResponse.json(
        { error: "Chat is disabled" },
        { status: 403 }
      );
    }

    // 管理者チェック
    const currentUser = await getCurrentUser();
    const isAdmin = !!currentUser;

    // メッセージ作成
    const message = await prisma.liveChatMessage.create({
      data: {
        liveStreamId: livestream.id,
        contactId: body.contactId || null,
        senderName: body.senderName || (isAdmin ? "Admin" : "Anonymous"),
        content: body.content,
        type: body.type || "NORMAL",
        isPinned: body.isPinned || false,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Failed to send chat message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

/**
 * チャットメッセージ削除/モデレーション
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID required" },
        { status: 400 }
      );
    }

    const livestream = await prisma.liveStream.findFirst({
      where: { eventId },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "Livestream not found" },
        { status: 404 }
      );
    }

    // 論理削除（非表示）
    await prisma.liveChatMessage.update({
      where: { id: messageId },
      data: { isHidden: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
