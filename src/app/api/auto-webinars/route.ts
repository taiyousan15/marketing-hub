import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { detectVideoType } from "@/lib/auto-webinar/playback";
import { CreateWebinarSchemaWithRefinement, formatValidationErrors } from "@/lib/auto-webinar/validations";
import { Prisma } from "@prisma/client";
import type { AutoWebinarScheduleType, AutoWebinarStatus, VideoType } from "@prisma/client";

/**
 * オートウェビナー一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const status = request.nextUrl.searchParams.get("status") as AutoWebinarStatus | null;
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");

    const where = {
      tenantId,
      ...(status && { status }),
    };

    const [webinars, total] = await Promise.all([
      prisma.automatedWebinar.findMany({
        where,
        include: {
          _count: {
            select: {
              chatMessages: true,
              timedOffers: true,
              registrations: true,
              sessions: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.automatedWebinar.count({ where }),
    ]);

    return NextResponse.json({ webinars, total });
  } catch (error) {
    console.error("Failed to fetch auto-webinars:", error);
    return NextResponse.json({ error: "Failed to fetch auto-webinars" }, { status: 500 });
  }
}

/**
 * オートウェビナー作成
 */
export async function POST(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // バリデーション
    const validationResult = CreateWebinarSchemaWithRefinement.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        formatValidationErrors(validationResult.error),
        { status: 400 }
      );
    }

    const {
      title,
      description,
      thumbnail,
      videoUrl,
      videoType,
      videoDuration,
      scheduleType = "JUST_IN_TIME",
      justInTimeDelayMinutes = 15,
      recurringSchedule,
      specificDates,
      fakeAttendeesEnabled = true,
      fakeAttendeesMin = 50,
      fakeAttendeesMax = 200,
      simulatedChatEnabled = true,
      userChatEnabled = false,
      replayEnabled = true,
      replayExpiresAfterHours,
      funnelId,
    } = validationResult.data;

    // 動画タイプを自動検出（指定されていない場合）
    const detectedVideoType: VideoType = videoType || detectVideoType(videoUrl);

    const webinar = await prisma.automatedWebinar.create({
      data: {
        tenantId,
        title,
        description,
        thumbnail,
        videoUrl,
        videoType: detectedVideoType,
        videoDuration,
        scheduleType: scheduleType as AutoWebinarScheduleType,
        justInTimeDelayMinutes,
        recurringSchedule: recurringSchedule ?? Prisma.JsonNull,
        specificDates: specificDates ?? Prisma.JsonNull,
        fakeAttendeesEnabled,
        fakeAttendeesMin,
        fakeAttendeesMax,
        simulatedChatEnabled,
        userChatEnabled,
        replayEnabled,
        replayExpiresAfterHours,
        funnelId: funnelId || null,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ webinar }, { status: 201 });
  } catch (error) {
    console.error("Failed to create auto-webinar:", error);
    return NextResponse.json({ error: "Failed to create auto-webinar" }, { status: 500 });
  }
}
