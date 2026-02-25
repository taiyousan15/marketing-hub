import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { generateRoomName } from "@/lib/livestream/livekit";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

const patchSchema = z.object({
  status: z.enum(["SCHEDULED", "LIVE", "COMPLETED", "CANCELED"]),
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
      include: { event: true },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ livestream });
  } catch (error) {
    console.error("GET /api/livestream/[eventId] error:", error);
    return NextResponse.json(
      { error: "ライブ配信情報の取得に失敗しました" },
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

    // 既存のライブ配信があれば返す（upsert的な動作）
    const existing = await prisma.liveStream.findFirst({
      where: { eventId, tenantId },
      include: { event: true },
    });
    if (existing) {
      return NextResponse.json({ livestream: existing }, { status: 200 });
    }

    // イベント情報を取得して名前を設定
    const event = await prisma.event.findFirst({
      where: { id: eventId, tenantId },
    });

    const roomName = generateRoomName(eventId);
    const livestream = await prisma.liveStream.create({
      data: {
        tenantId,
        eventId,
        name: event?.name ?? "ライブ配信",
        roomName,
        platform: "livekit",
        chatEnabled: true,
        recordingEnabled: false,
      },
      include: { event: true },
    });

    return NextResponse.json({ livestream }, { status: 201 });
  } catch (error) {
    console.error("POST /api/livestream/[eventId] error:", error);
    return NextResponse.json(
      { error: "ライブ配信の作成に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;
    const { eventId } = await params;

    const existing = await prisma.liveStream.findFirst({
      where: { eventId, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "ライブ配信が見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力内容が正しくありません", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: { status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELED"; endAt?: Date } = {
      status: parsed.data.status,
    };
    if (parsed.data.status === "COMPLETED" || parsed.data.status === "CANCELED") {
      updateData.endAt = new Date();
    }

    const livestream = await prisma.liveStream.update({
      where: { id: existing.id },
      data: updateData,
    });

    return NextResponse.json({ livestream });
  } catch (error) {
    console.error("PATCH /api/livestream/[eventId] error:", error);
    return NextResponse.json(
      { error: "ライブ配信ステータスの更新に失敗しました" },
      { status: 500 }
    );
  }
}
