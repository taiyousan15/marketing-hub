import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { generateRoomName } from "@/lib/livestream";

type Params = { eventId: string };

/**
 * ライブ配信情報取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    // イベントに紐づくライブ配信を取得
    const livestream = await prisma.liveStream.findFirst({
      where: { eventId },
      include: {
        event: true,
        sessions: {
          orderBy: { joinedAt: "desc" },
          take: 1,
        },
        recordings: {
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!livestream) {
      return NextResponse.json(
        { error: "Livestream not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ livestream });
  } catch (error) {
    console.error("Failed to fetch livestream:", error);
    return NextResponse.json(
      { error: "Failed to fetch livestream" },
      { status: 500 }
    );
  }
}

/**
 * ライブ配信作成/更新
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const body = await request.json();

    // イベントの存在確認
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // 既存のライブ配信を確認
    const existing = await prisma.liveStream.findFirst({
      where: { eventId },
    });

    const roomName = generateRoomName(eventId);

    if (existing) {
      // 更新
      const updated = await prisma.liveStream.update({
        where: { id: existing.id },
        data: {
          title: body.title || existing.title,
          description: body.description,
          scheduledStartAt: body.scheduledStartAt
            ? new Date(body.scheduledStartAt)
            : existing.scheduledStartAt,
          scheduledEndAt: body.scheduledEndAt
            ? new Date(body.scheduledEndAt)
            : existing.scheduledEndAt,
          recordingEnabled: body.recordingEnabled ?? existing.recordingEnabled,
          chatEnabled: body.chatEnabled ?? existing.chatEnabled,
          maxViewers: body.maxViewers ?? existing.maxViewers,
        },
      });
      return NextResponse.json({ livestream: updated });
    }

    // tenantIdを取得
    const tenantId = currentUser.tenantId;

    // 新規作成
    const livestream = await prisma.liveStream.create({
      data: {
        tenantId,
        eventId,
        roomName,
        title: body.title || event.name,
        description: body.description,
        scheduledStartAt: body.scheduledStartAt
          ? new Date(body.scheduledStartAt)
          : event.startAt,
        scheduledEndAt: body.scheduledEndAt
          ? new Date(body.scheduledEndAt)
          : event.endAt,
        recordingEnabled: body.recordingEnabled ?? true,
        chatEnabled: body.chatEnabled ?? true,
        maxViewers: body.maxViewers,
      },
    });

    return NextResponse.json({ livestream }, { status: 201 });
  } catch (error) {
    console.error("Failed to create/update livestream:", error);
    return NextResponse.json(
      { error: "Failed to create/update livestream" },
      { status: 500 }
    );
  }
}

/**
 * ライブ配信ステータス更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const updateData: Record<string, unknown> = {};

    // ステータス変更
    if (body.status) {
      updateData.status = body.status;

      if (body.status === "LIVE" && !livestream.actualStartAt) {
        updateData.actualStartAt = new Date();
      } else if (body.status === "ENDED" && !livestream.actualEndAt) {
        updateData.actualEndAt = new Date();
      }
    }

    // 視聴者数更新
    if (body.peakViewers !== undefined) {
      updateData.peakViewers = Math.max(
        livestream.peakViewers,
        body.peakViewers
      );
    }

    const updated = await prisma.liveStream.update({
      where: { id: livestream.id },
      data: updateData,
    });

    return NextResponse.json({ livestream: updated });
  } catch (error) {
    console.error("Failed to update livestream:", error);
    return NextResponse.json(
      { error: "Failed to update livestream" },
      { status: 500 }
    );
  }
}
