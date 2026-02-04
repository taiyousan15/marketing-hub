/**
 * コミッション（報酬）管理API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// コミッション一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const partnerId = searchParams.get("partnerId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { tenantId };
    if (partnerId) where.partnerId = partnerId;
    if (status) where.status = status;
    if (type) where.type = type;

    const [commissions, total, summary] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        include: {
          partner: {
            select: { id: true, name: true, code: true, email: true },
          },
          conversion: {
            select: {
              id: true,
              type: true,
              amount: true,
              status: true,
              contact: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.affiliateCommission.count({ where }),
      // 集計
      prisma.affiliateCommission.groupBy({
        by: ["status"],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // サマリーを整形
    const summaryByStatus = summary.reduce(
      (acc, item) => {
        acc[item.status] = {
          count: item._count,
          amount: item._sum.amount || 0,
        };
        return acc;
      },
      {} as Record<string, { count: number; amount: number }>
    );

    return NextResponse.json({
      commissions,
      summary: summaryByStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch commissions" },
      { status: 500 }
    );
  }
}

// パートナーの報酬サマリー取得
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, partnerId, startDate, endDate } = body;

    if (!tenantId || !partnerId) {
      return NextResponse.json(
        { error: "tenantId and partnerId are required" },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { tenantId, partnerId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // 報酬タイプ別集計
    const byType = await prisma.affiliateCommission.groupBy({
      by: ["type"],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // ステータス別集計
    const byStatus = await prisma.affiliateCommission.groupBy({
      by: ["status"],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // ティア別集計
    const byTier = await prisma.affiliateCommission.groupBy({
      by: ["tier"],
      where,
      _sum: { amount: true },
      _count: true,
    });

    // 日別集計（直近30日）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCommissions = await prisma.affiliateCommission.findMany({
      where: {
        ...where,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        amount: true,
        createdAt: true,
        type: true,
      },
    });

    // 日別に集計
    const dailyMap = new Map<string, number>();
    recentCommissions.forEach((c) => {
      const date = c.createdAt.toISOString().split("T")[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + c.amount);
    });

    const daily = Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // パートナー情報
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        code: true,
        totalEarnings: true,
        unpaidEarnings: true,
        totalClicks: true,
        totalConversions: true,
      },
    });

    return NextResponse.json({
      partner,
      summary: {
        byType: byType.map((item) => ({
          type: item.type,
          count: item._count,
          amount: item._sum.amount || 0,
        })),
        byStatus: byStatus.map((item) => ({
          status: item.status,
          count: item._count,
          amount: item._sum.amount || 0,
        })),
        byTier: byTier.map((item) => ({
          tier: item.tier,
          count: item._count,
          amount: item._sum.amount || 0,
        })),
        daily,
      },
    });
  } catch (error) {
    console.error("Error fetching commission summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch commission summary" },
      { status: 500 }
    );
  }
}
