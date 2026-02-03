import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

/**
 * ダッシュボード統計API
 * コンタクト数、アクティブキャンペーン数、月間売上、開封率などを取得
 */
export async function GET(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // 今月の開始日
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // 並行でデータを取得
    const [
      totalContacts,
      lastMonthContacts,
      activeCampaigns,
      thisMonthOrders,
      lastMonthOrders,
      messageStats,
      lastMonthMessageStats,
      recentActivity,
      dailyStats,
    ] = await Promise.all([
      // 総コンタクト数
      prisma.contact.count({
        where: { tenantId },
      }),
      // 先月のコンタクト数
      prisma.contact.count({
        where: {
          tenantId,
          createdAt: { lt: monthStart },
        },
      }),
      // アクティブキャンペーン数
      prisma.campaign.count({
        where: {
          tenantId,
          status: "ACTIVE",
        },
      }),
      // 今月の売上
      prisma.order.aggregate({
        where: {
          tenantId,
          status: "COMPLETED",
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // 先月の売上
      prisma.order.aggregate({
        where: {
          tenantId,
          status: "COMPLETED",
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        _sum: { amount: true },
      }),
      // 今月のメッセージ統計
      prisma.messageHistory.groupBy({
        by: ["status"],
        where: {
          tenantId,
          direction: "OUTBOUND",
          createdAt: { gte: monthStart },
        },
        _count: true,
      }),
      // 先月のメッセージ統計
      prisma.messageHistory.groupBy({
        by: ["status"],
        where: {
          tenantId,
          direction: "OUTBOUND",
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd,
          },
        },
        _count: true,
      }),
      // 最近のアクティビティ（最新10件）
      prisma.messageHistory.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          contact: {
            select: { name: true, email: true },
          },
        },
      }),
      // 過去30日間の日別統計
      getDailyStats(tenantId, 30),
    ]);

    // 開封率計算
    const sentCount = messageStats.find((s) => s.status === "SENT")?._count || 0;
    const openedCount = messageStats.find((s) => s.status === "OPENED")?._count || 0;
    const deliveredCount = messageStats.find((s) => s.status === "DELIVERED")?._count || 0;
    const totalSent = sentCount + openedCount + deliveredCount;
    const openRate = totalSent > 0 ? Math.round((openedCount / totalSent) * 100) : 0;

    // 先月の開封率
    const lastSentCount = lastMonthMessageStats.find((s) => s.status === "SENT")?._count || 0;
    const lastOpenedCount = lastMonthMessageStats.find((s) => s.status === "OPENED")?._count || 0;
    const lastDeliveredCount = lastMonthMessageStats.find((s) => s.status === "DELIVERED")?._count || 0;
    const lastTotalSent = lastSentCount + lastOpenedCount + lastDeliveredCount;
    const lastOpenRate = lastTotalSent > 0 ? Math.round((lastOpenedCount / lastTotalSent) * 100) : 0;

    // 変化率計算
    const contactChange = lastMonthContacts > 0
      ? Math.round(((totalContacts - lastMonthContacts) / lastMonthContacts) * 100)
      : 0;

    const thisMonthRevenue = thisMonthOrders._sum.amount || 0;
    const lastMonthRevenue = lastMonthOrders._sum.amount || 0;
    const revenueChange = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    const openRateChange = lastOpenRate > 0
      ? openRate - lastOpenRate
      : 0;

    return NextResponse.json({
      stats: {
        totalContacts,
        contactChange,
        activeCampaigns,
        thisMonthRevenue,
        revenueChange,
        openRate,
        openRateChange,
        thisMonthOrders: thisMonthOrders._count,
      },
      recentActivity: recentActivity.map((msg) => ({
        id: msg.id,
        type: msg.channel.toLowerCase(),
        direction: msg.direction.toLowerCase(),
        status: msg.status.toLowerCase(),
        contactName: msg.contact?.name || msg.contact?.email || "Unknown",
        createdAt: msg.createdAt.toISOString(),
      })),
      dailyStats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

/**
 * 過去N日間の日別統計を取得
 */
async function getDailyStats(tenantId: string, days: number) {
  const results: Array<{
    date: string;
    contacts: number;
    messages: number;
    revenue: number;
  }> = [];

  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [contacts, messages, orders] = await Promise.all([
      prisma.contact.count({
        where: {
          tenantId,
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
      prisma.messageHistory.count({
        where: {
          tenantId,
          direction: "OUTBOUND",
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          tenantId,
          status: "COMPLETED",
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: { amount: true },
      }),
    ]);

    results.push({
      date: date.toISOString().split("T")[0],
      contacts,
      messages,
      revenue: orders._sum.amount || 0,
    });
  }

  return results;
}
