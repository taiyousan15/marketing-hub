import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    const [executions, total] = await Promise.all([
      prisma.automationExecution.findMany({
        where: {
          rule: { tenantId: user.tenantId },
        },
        include: {
          rule: { select: { name: true } },
        },
        orderBy: { triggeredAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.automationExecution.count({
        where: {
          rule: { tenantId: user.tenantId },
        },
      }),
    ]);

    // Get today's summary
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayCounts = await prisma.automationExecution.groupBy({
      by: ["status"],
      where: {
        rule: { tenantId: user.tenantId },
        triggeredAt: { gte: todayStart },
      },
      _count: true,
    });

    const todaySummary = {
      total: todayCounts.reduce((sum, c) => sum + c._count, 0),
      completed: todayCounts.find((c) => c.status === "COMPLETED")?._count ?? 0,
      failed: todayCounts.find((c) => c.status === "FAILED")?._count ?? 0,
      pending: todayCounts.find((c) => c.status === "PENDING")?._count ?? 0,
    };

    return NextResponse.json({
      executions,
      todaySummary,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/automation/executions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch executions" },
      { status: 500 }
    );
  }
}
