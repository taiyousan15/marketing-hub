import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

/**
 * GET /api/livestream/[eventId]/public
 * 認証不要。視聴者向けの公開配信情報を返す。
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    const livestream = await prisma.liveStream.findFirst({
      where: { eventId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        startAt: true,
        chatEnabled: true,
        timedOffers: true,
      },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ livestream });
  } catch (error) {
    console.error("GET /api/livestream/[eventId]/public error:", error);
    return NextResponse.json(
      { error: "配信情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}
