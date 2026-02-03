import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * リプレイアクセス
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    // 登録を取得
    const registration = await prisma.autoWebinarRegistration.findUnique({
      where: { replayAccessToken: token },
      include: {
        webinar: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            videoUrl: true,
            videoType: true,
            videoDuration: true,
            status: true,
            replayEnabled: true,
            simulatedChatEnabled: true,
            timedOffers: {
              orderBy: { appearAtSeconds: "asc" },
            },
            chatMessages: {
              orderBy: [{ appearAtSeconds: "asc" }, { order: "asc" }],
              take: 100, // リプレイでは最初の100件のみ取得
            },
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: "Invalid replay token" }, { status: 404 });
    }

    // ウェビナーが有効かチェック
    if (registration.webinar.status !== "ACTIVE") {
      return NextResponse.json({ error: "Webinar is not active" }, { status: 403 });
    }

    // リプレイが有効かチェック
    if (!registration.webinar.replayEnabled) {
      return NextResponse.json({ error: "Replay is not enabled" }, { status: 403 });
    }

    // 有効期限チェック
    if (registration.replayExpiresAt && new Date() > registration.replayExpiresAt) {
      return NextResponse.json({ error: "Replay access has expired" }, { status: 403 });
    }

    // 登録ステータスを更新
    await prisma.autoWebinarRegistration.update({
      where: { id: registration.id },
      data: { status: "WATCHED_REPLAY" },
    });

    return NextResponse.json({
      registration: {
        id: registration.id,
        contactId: registration.contactId,
        status: registration.status,
        replayExpiresAt: registration.replayExpiresAt,
      },
      webinar: {
        id: registration.webinar.id,
        title: registration.webinar.title,
        description: registration.webinar.description,
        thumbnail: registration.webinar.thumbnail,
        videoUrl: registration.webinar.videoUrl,
        videoType: registration.webinar.videoType,
        videoDuration: registration.webinar.videoDuration,
      },
      chat: {
        enabled: registration.webinar.simulatedChatEnabled,
        messages: registration.webinar.chatMessages,
      },
      offers: registration.webinar.timedOffers,
      isReplay: true,
    });
  } catch (error) {
    console.error("Failed to access replay:", error);
    return NextResponse.json({ error: "Failed to access replay" }, { status: 500 });
  }
}
