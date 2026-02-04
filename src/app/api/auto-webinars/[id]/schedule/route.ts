import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  getNextAvailableTimes,
  getNextAvailableFromSpecificDates,
  type RecurringSchedule,
} from "@/lib/auto-webinar/scheduling";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 利用可能なスケジュール時間を取得（公開API）
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const count = parseInt(request.nextUrl.searchParams.get("count") || "5");

    const webinar = await prisma.automatedWebinar.findFirst({
      where: {
        id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        scheduleType: true,
        justInTimeDelayMinutes: true,
        recurringSchedule: true,
        specificDates: true,
        videoDuration: true,
      },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    let availableTimes: Date[] = [];
    const now = new Date();

    switch (webinar.scheduleType) {
      case "JUST_IN_TIME":
        // Just-In-Timeは「今から15分後」のみ
        availableTimes = [
          new Date(now.getTime() + webinar.justInTimeDelayMinutes * 60 * 1000),
        ];
        break;

      case "RECURRING":
        if (webinar.recurringSchedule) {
          availableTimes = getNextAvailableTimes(
            webinar.recurringSchedule as unknown as RecurringSchedule,
            count,
            now
          );
        }
        break;

      case "SPECIFIC_DATES":
        if (webinar.specificDates) {
          availableTimes = getNextAvailableFromSpecificDates(
            webinar.specificDates as unknown as string[],
            count,
            now
          );
        }
        break;

      case "ON_DEMAND":
        // オンデマンドは「今すぐ」
        availableTimes = [now];
        break;
    }

    return NextResponse.json({
      webinar: {
        id: webinar.id,
        title: webinar.title,
        description: webinar.description,
        thumbnail: webinar.thumbnail,
        scheduleType: webinar.scheduleType,
        videoDuration: webinar.videoDuration,
      },
      availableTimes: availableTimes.map((t) => t.toISOString()),
      isJustInTime: webinar.scheduleType === "JUST_IN_TIME",
      isOnDemand: webinar.scheduleType === "ON_DEMAND",
    });
  } catch (error) {
    console.error("Failed to fetch schedule:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}
