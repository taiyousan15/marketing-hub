import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

const createMessageSchema = z.object({
  content: z.string().min(1).max(500),
  senderName: z.string().min(1).max(50),
  contactId: z.string().optional(),
});

/**
 * GET /api/livestream/[eventId]/public-chat
 * 認証不要。視聴者向けのチャットメッセージ一覧を返す。
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    const livestream = await prisma.liveStream.findFirst({
      where: { eventId },
      select: { id: true, chatEnabled: true },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
      );
    }

    if (!livestream.chatEnabled) {
      return NextResponse.json({ messages: [] });
    }

    const messages = await prisma.liveChatMessage.findMany({
      where: { livestreamId: livestream.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        senderName: true,
        content: true,
        messageType: true,
        isHighlighted: true,
        isPinned: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/livestream/[eventId]/public-chat error:", error);
    return NextResponse.json(
      { error: "チャットメッセージの取得に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/livestream/[eventId]/public-chat
 * 認証不要。視聴者がチャットメッセージを投稿する。
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    const livestream = await prisma.liveStream.findFirst({
      where: { eventId },
      select: { id: true, tenantId: true, chatEnabled: true, status: true },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
      );
    }

    if (!livestream.chatEnabled) {
      return NextResponse.json(
        { error: "チャットは無効です" },
        { status: 403 }
      );
    }

    if (livestream.status !== "LIVE") {
      return NextResponse.json(
        { error: "配信中のみチャットできます" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力内容が正しくありません", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, senderName, contactId } = parsed.data;

    const message = await prisma.liveChatMessage.create({
      data: {
        tenantId: livestream.tenantId,
        livestreamId: livestream.id,
        content,
        senderName,
        contactId: contactId ?? null,
        messageType: "CHAT",
      },
      select: {
        id: true,
        senderName: true,
        content: true,
        messageType: true,
        isHighlighted: true,
        isPinned: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/livestream/[eventId]/public-chat error:", error);
    return NextResponse.json(
      { error: "チャットメッセージの送信に失敗しました" },
      { status: 500 }
    );
  }
}
