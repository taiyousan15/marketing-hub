import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

const createMessageSchema = z.object({
  content: z.string().min(1).max(500),
  senderName: z.string().min(1),
  contactId: z.string().optional(),
  messageType: z.string().default("CHAT"),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;
    const { eventId } = await params;

    const livestream = await prisma.liveStream.findFirst({
      where: { eventId, tenantId },
    });
    if (!livestream) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
      );
    }

    const messages = await prisma.liveChatMessage.findMany({
      where: { livestreamId: livestream.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/livestream/[eventId]/chat error:", error);
    return NextResponse.json(
      { error: "チャットメッセージの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;
    const { eventId } = await params;

    const livestream = await prisma.liveStream.findFirst({
      where: { eventId, tenantId },
    });
    if (!livestream) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
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

    const { content, senderName, contactId, messageType } = parsed.data;

    const message = await prisma.liveChatMessage.create({
      data: {
        tenantId,
        livestreamId: livestream.id,
        content,
        senderName,
        contactId: contactId ?? null,
        messageType,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("POST /api/livestream/[eventId]/chat error:", error);
    return NextResponse.json(
      { error: "チャットメッセージの送信に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;
    const { eventId } = await params;

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");
    if (!messageId) {
      return NextResponse.json(
        { error: "messageId クエリパラメータが必要です" },
        { status: 400 }
      );
    }

    const livestream = await prisma.liveStream.findFirst({
      where: { eventId, tenantId },
    });
    if (!livestream) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.liveChatMessage.deleteMany({
      where: { id: messageId, tenantId, livestreamId: livestream.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/livestream/[eventId]/chat error:", error);
    return NextResponse.json(
      { error: "チャットメッセージの削除に失敗しました" },
      { status: 500 }
    );
  }
}
