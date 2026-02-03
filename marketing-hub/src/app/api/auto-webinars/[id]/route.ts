import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import type { AutoWebinarScheduleType, AutoWebinarStatus, VideoType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * オートウェビナー詳細取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const webinar = await prisma.automatedWebinar.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        chatMessages: {
          orderBy: [{ appearAtSeconds: "asc" }, { order: "asc" }],
        },
        timedOffers: {
          orderBy: { appearAtSeconds: "asc" },
        },
        registrations: {
          orderBy: { registeredAt: "desc" },
          take: 100,
        },
        _count: {
          select: {
            registrations: true,
            sessions: true,
          },
        },
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    return NextResponse.json({ webinar });
  } catch (error) {
    console.error("Failed to fetch auto-webinar:", error);
    return NextResponse.json({ error: "Failed to fetch auto-webinar" }, { status: 500 });
  }
}

/**
 * オートウェビナー更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // 存在確認
    const existing = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    const {
      title,
      description,
      thumbnail,
      videoUrl,
      videoType,
      videoDuration,
      scheduleType,
      justInTimeDelayMinutes,
      recurringSchedule,
      specificDates,
      fakeAttendeesEnabled,
      fakeAttendeesMin,
      fakeAttendeesMax,
      simulatedChatEnabled,
      userChatEnabled,
      replayEnabled,
      replayExpiresAfterHours,
      funnelId,
    } = body;

    const webinar = await prisma.automatedWebinar.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(videoType !== undefined && { videoType: videoType as VideoType }),
        ...(videoDuration !== undefined && { videoDuration }),
        ...(scheduleType !== undefined && { scheduleType: scheduleType as AutoWebinarScheduleType }),
        ...(justInTimeDelayMinutes !== undefined && { justInTimeDelayMinutes }),
        ...(recurringSchedule !== undefined && { recurringSchedule }),
        ...(specificDates !== undefined && { specificDates }),
        ...(fakeAttendeesEnabled !== undefined && { fakeAttendeesEnabled }),
        ...(fakeAttendeesMin !== undefined && { fakeAttendeesMin }),
        ...(fakeAttendeesMax !== undefined && { fakeAttendeesMax }),
        ...(simulatedChatEnabled !== undefined && { simulatedChatEnabled }),
        ...(userChatEnabled !== undefined && { userChatEnabled }),
        ...(replayEnabled !== undefined && { replayEnabled }),
        ...(replayExpiresAfterHours !== undefined && { replayExpiresAfterHours }),
        ...(funnelId !== undefined && { funnelId }),
      },
    });

    return NextResponse.json({ webinar });
  } catch (error) {
    console.error("Failed to update auto-webinar:", error);
    return NextResponse.json({ error: "Failed to update auto-webinar" }, { status: 500 });
  }
}

/**
 * オートウェビナー削除
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // 存在確認
    const existing = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    await prisma.automatedWebinar.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete auto-webinar:", error);
    return NextResponse.json({ error: "Failed to delete auto-webinar" }, { status: 500 });
  }
}
