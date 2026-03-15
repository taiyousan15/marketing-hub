import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

const moderateSchema = z.object({
  messageId: z.string().min(1),
  action: z.enum(["pin", "unpin", "highlight", "unhighlight"]),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;
    const { eventId } = await params;

    const body = await request.json();
    const parsed = moderateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力内容が正しくありません", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { messageId, action } = parsed.data;

    const livestream = await prisma.liveStream.findFirst({
      where: { eventId, tenantId },
    });
    if (!livestream) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
      );
    }

    const existingMessage = await prisma.liveChatMessage.findFirst({
      where: { id: messageId, tenantId, livestreamId: livestream.id },
    });
    if (!existingMessage) {
      return NextResponse.json(
        { error: "メッセージが見つかりません" },
        { status: 404 }
      );
    }

    const updateData: { isPinned?: boolean; isHighlighted?: boolean } = {};
    if (action === "pin") updateData.isPinned = true;
    else if (action === "unpin") updateData.isPinned = false;
    else if (action === "highlight") updateData.isHighlighted = true;
    else if (action === "unhighlight") updateData.isHighlighted = false;

    const message = await prisma.liveChatMessage.update({
      where: { id: messageId },
      data: updateData,
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("PATCH /api/livestream/[eventId]/chat/moderate error:", error);
    return NextResponse.json(
      { error: "チャットモデレーションに失敗しました" },
      { status: 500 }
    );
  }
}
