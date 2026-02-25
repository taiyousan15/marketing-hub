import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import {
  createToken,
  generateRoomName,
  getLiveKitUrl,
  isLiveKitConfigured,
} from "@/lib/livestream/livekit";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

const tokenSchema = z.object({
  name: z.string().min(1),
  isHost: z.boolean().default(true),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId, userId } = userInfo;
    const { eventId } = await params;

    if (!isLiveKitConfigured()) {
      return NextResponse.json(
        { error: "LiveKit が設定されていません。LIVEKIT_API_KEY と LIVEKIT_API_SECRET を設定してください。" },
        { status: 503 }
      );
    }

    // テナント所有のライブ配信かチェック
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
    const parsed = tokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力内容が正しくありません", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, isHost } = parsed.data;
    const roomName = livestream.roomName ?? generateRoomName(eventId);
    const participantIdentity = `${userId}-${Date.now()}`;

    const token = await createToken({
      roomName,
      participantName: name,
      participantIdentity,
      isHost,
    });

    return NextResponse.json({ token, url: getLiveKitUrl() });
  } catch (error) {
    console.error("POST /api/livestream/[eventId]/token error:", error);
    return NextResponse.json(
      { error: "トークンの生成に失敗しました" },
      { status: 500 }
    );
  }
}
