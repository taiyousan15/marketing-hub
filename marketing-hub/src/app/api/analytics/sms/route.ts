// src/app/api/analytics/sms/route.ts
// SMS分析APIエンドポイント

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");
    const period = searchParams.get("period") || "7d";

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // 期間の計算
    const days = period === "30d" ? 30 : period === "90d" ? 90 : 7;
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    // SMS統計を取得
    const smsLogs = await prisma.sMSLog.findMany({
      where: {
        tenantId,
        queuedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        status: true,
        segments: true,
        queuedAt: true,
      },
    });

    // 基本統計
    const totalSent = smsLogs.length;
    const delivered = smsLogs.filter(
      (log) => log.status === "DELIVERED" || log.status === "SENT"
    ).length;
    const failed = smsLogs.filter(
      (log) => log.status === "FAILED" || log.status === "UNDELIVERED"
    ).length;
    const pending = smsLogs.filter(
      (log) => log.status === "QUEUED" || log.status === "SENDING"
    ).length;

    // コスト計算（1セグメント約10円として概算）
    const totalSegments = smsLogs.reduce(
      (sum, log) => sum + (log.segments || 1),
      0
    );
    const estimatedCost = totalSegments * 10;

    // 配信率
    const deliveryRate =
      totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0;

    // 日別統計
    const dailyStats: Record<
      string,
      { sent: number; delivered: number; failed: number; cost: number }
    > = {};

    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
      dailyStats[date] = { sent: 0, delivered: 0, failed: 0, cost: 0 };
    }

    for (const log of smsLogs) {
      const date = format(log.queuedAt, "yyyy-MM-dd");
      if (dailyStats[date]) {
        dailyStats[date].sent++;
        if (log.status === "DELIVERED" || log.status === "SENT") {
          dailyStats[date].delivered++;
        }
        if (log.status === "FAILED" || log.status === "UNDELIVERED") {
          dailyStats[date].failed++;
        }
        dailyStats[date].cost += (log.segments || 1) * 10;
      }
    }

    const dailyStatsArray = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats,
    }));

    // チャンネル比較（MessageHistory から取得）
    const messageHistories = await prisma.messageHistory.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        channel: true,
        status: true,
        openedAt: true,
        clickedAt: true,
      },
    });

    const channelStats = {
      EMAIL: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
      SMS: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
      LINE: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
    };

    for (const msg of messageHistories) {
      const channel = msg.channel || "EMAIL";
      if (channelStats[channel as keyof typeof channelStats]) {
        channelStats[channel as keyof typeof channelStats].sent++;
        if (msg.status === "DELIVERED" || msg.status === "SENT") {
          channelStats[channel as keyof typeof channelStats].delivered++;
        }
        if (msg.openedAt) {
          channelStats[channel as keyof typeof channelStats].opened++;
        }
        if (msg.clickedAt) {
          channelStats[channel as keyof typeof channelStats].clicked++;
        }
      }
    }

    // SMS用に統計を上書き（SMSLogから）
    channelStats.SMS.sent = totalSent;
    channelStats.SMS.delivered = delivered;

    // 時間帯別統計
    const hourlyStats: Record<number, number> = {};
    for (let h = 0; h < 24; h++) {
      hourlyStats[h] = 0;
    }
    for (const log of smsLogs) {
      const hour = log.queuedAt.getHours();
      hourlyStats[hour]++;
    }

    const hourlyStatsArray = Object.entries(hourlyStats).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
    }));

    // ステータス別内訳
    const statusBreakdown = {
      QUEUED: smsLogs.filter((l) => l.status === "QUEUED").length,
      SENDING: smsLogs.filter((l) => l.status === "SENDING").length,
      SENT: smsLogs.filter((l) => l.status === "SENT").length,
      DELIVERED: smsLogs.filter((l) => l.status === "DELIVERED").length,
      FAILED: smsLogs.filter((l) => l.status === "FAILED").length,
      UNDELIVERED: smsLogs.filter((l) => l.status === "UNDELIVERED").length,
    };

    return NextResponse.json({
      summary: {
        totalSent,
        delivered,
        failed,
        pending,
        deliveryRate,
        totalSegments,
        estimatedCost,
      },
      dailyStats: dailyStatsArray,
      channelStats,
      hourlyStats: hourlyStatsArray,
      statusBreakdown,
      period,
    });
  } catch (error) {
    console.error("SMS analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch SMS analytics" },
      { status: 500 }
    );
  }
}
