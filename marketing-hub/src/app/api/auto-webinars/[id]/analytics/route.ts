import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * オートウェビナー分析データ取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // ウェビナーの存在確認
    const webinar = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!webinar) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // 期間パラメータ
    const days = parseInt(request.nextUrl.searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 集計クエリを並列実行
    const [
      registrations,
      sessions,
      offers,
      registrationStats,
      sessionStats,
    ] = await Promise.all([
      // 登録統計
      prisma.autoWebinarRegistration.groupBy({
        by: ["status"],
        where: {
          webinarId: id,
          registeredAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // セッション統計
      prisma.autoWebinarSession.findMany({
        where: {
          webinarId: id,
          startedAt: { gte: startDate },
        },
        select: {
          id: true,
          isReplay: true,
          maxWatchedSeconds: true,
          completionPercent: true,
          startedAt: true,
        },
      }),

      // オファー統計
      prisma.autoWebinarTimedOffer.findMany({
        where: { webinarId: id },
        select: {
          id: true,
          title: true,
          appearAtSeconds: true,
          clickCount: true,
          conversionCount: true,
        },
      }),

      // 日別登録数
      prisma.autoWebinarRegistration.groupBy({
        by: ["registeredAt"],
        where: {
          webinarId: id,
          registeredAt: { gte: startDate },
        },
        _count: { id: true },
      }),

      // 日別セッション数
      prisma.autoWebinarSession.groupBy({
        by: ["startedAt"],
        where: {
          webinarId: id,
          startedAt: { gte: startDate },
        },
        _count: { id: true },
      }),
    ]);

    // 登録ステータス集計
    const registrationByStatus = registrations.reduce((acc, r) => {
      acc[r.status] = r._count.id;
      return acc;
    }, {} as Record<string, number>);

    // セッション集計
    const liveSessions = sessions.filter((s) => !s.isReplay);
    const replaySessions = sessions.filter((s) => s.isReplay);

    const avgCompletionLive = liveSessions.length > 0
      ? liveSessions.reduce((sum, s) => sum + s.completionPercent, 0) / liveSessions.length
      : 0;

    const avgCompletionReplay = replaySessions.length > 0
      ? replaySessions.reduce((sum, s) => sum + s.completionPercent, 0) / replaySessions.length
      : 0;

    // 視聴率の分布（完了率を10%刻みで集計）
    const completionDistribution = Array.from({ length: 11 }, (_, i) => ({
      bucket: `${i * 10}%`,
      count: sessions.filter(
        (s) => s.completionPercent >= i * 10 && s.completionPercent < (i + 1) * 10
      ).length,
    }));

    // オファー集計
    const totalOfferClicks = offers.reduce((sum, o) => sum + o.clickCount, 0);
    const totalOfferConversions = offers.reduce((sum, o) => sum + o.conversionCount, 0);

    // 日別データを整形
    const dailyRegistrations = formatDailyData(registrationStats, days);
    const dailySessions = formatDailyData(sessionStats, days);

    return NextResponse.json({
      summary: {
        totalRegistrations: Object.values(registrationByStatus).reduce((a, b) => a + b, 0),
        registrationByStatus,
        totalSessions: sessions.length,
        liveSessions: liveSessions.length,
        replaySessions: replaySessions.length,
        avgCompletionLive: Math.round(avgCompletionLive * 10) / 10,
        avgCompletionReplay: Math.round(avgCompletionReplay * 10) / 10,
        totalOfferClicks,
        totalOfferConversions,
        offerConversionRate: totalOfferClicks > 0
          ? Math.round((totalOfferConversions / totalOfferClicks) * 1000) / 10
          : 0,
      },
      completionDistribution,
      offers: offers.map((o) => ({
        ...o,
        conversionRate: o.clickCount > 0
          ? Math.round((o.conversionCount / o.clickCount) * 1000) / 10
          : 0,
      })),
      daily: {
        registrations: dailyRegistrations,
        sessions: dailySessions,
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

/**
 * 日別データを整形
 */
function formatDailyData(
  data: { _count: { id: number }; registeredAt?: Date; startedAt?: Date }[],
  days: number
): { date: string; count: number }[] {
  const result: Record<string, number> = {};

  // 過去N日分の日付を初期化
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split("T")[0];
    result[key] = 0;
  }

  // データを集計
  for (const item of data) {
    const dateField = item.registeredAt || item.startedAt;
    if (dateField) {
      const key = dateField.toISOString().split("T")[0];
      if (result[key] !== undefined) {
        result[key] += item._count.id;
      }
    }
  }

  // 配列に変換して日付順にソート
  return Object.entries(result)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
