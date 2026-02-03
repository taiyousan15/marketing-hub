import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { createToken, getLiveKitUrl, isLiveKitConfigured } from "@/lib/livestream";

type Params = { eventId: string };

/**
 * LiveKitトークン発行API
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    // LiveKit設定確認
    if (!isLiveKitConfigured()) {
      return NextResponse.json(
        { error: "LiveKit is not configured" },
        { status: 503 }
      );
    }

    const { eventId } = await params;
    const body = await request.json();

    // ライブ配信の存在確認
    const livestream = await prisma.liveStream.findFirst({
      where: { eventId },
      include: { event: true },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "Livestream not found" },
        { status: 404 }
      );
    }

    // セッション確認（管理者かどうか）
    const currentUser = await getCurrentUser();
    const isHost = !!currentUser;

    // 視聴者情報
    const participantName = body.name || (isHost ? "Host" : "Viewer");
    const participantIdentity = body.identity ||
      (isHost ? `host-${currentUser?.userId}` : `viewer-${Date.now()}`);

    // トークン生成
    const token = await createToken({
      roomName: livestream.roomName,
      participantName,
      participantIdentity,
      isHost,
      metadata: JSON.stringify({
        eventId,
        isHost,
        userId: currentUser?.userId,
      }),
    });

    // セッション記録（視聴者の場合）
    if (!isHost && body.contactId) {
      await prisma.liveSession.create({
        data: {
          liveStreamId: livestream.id,
          contactId: body.contactId,
          participantId: participantIdentity,
        },
      });
    }

    return NextResponse.json({
      token,
      url: getLiveKitUrl(),
      roomName: livestream.roomName,
      isHost,
    });
  } catch (error) {
    console.error("Failed to generate token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
