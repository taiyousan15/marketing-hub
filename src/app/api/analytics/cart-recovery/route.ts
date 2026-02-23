import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = user.tenantId;

    const [
      totalCarts,
      recoveredCarts,
      pendingCarts,
      totalRevenueLost,
      totalRevenueRecovered,
      recentCarts,
      dailyStats,
    ] = await Promise.all([
      prisma.abandonedCart.count({ where: { tenantId } }),
      prisma.abandonedCart.count({ where: { tenantId, isRecovered: true } }),
      prisma.abandonedCart.count({
        where: { tenantId, status: "PENDING" },
      }),
      prisma.abandonedCart.aggregate({
        where: { tenantId },
        _sum: { cartTotal: true },
      }),
      prisma.abandonedCart.aggregate({
        where: { tenantId, isRecovered: true },
        _sum: { cartTotal: true },
      }),
      prisma.abandonedCart.findMany({
        where: { tenantId },
        include: {
          contact: { select: { name: true, email: true } },
        },
        orderBy: { abandonedAt: "desc" },
        take: 20,
      }),
      // Last 30 days daily stats
      prisma.$queryRaw<
        Array<{
          date: string;
          abandoned: bigint;
          recovered: bigint;
        }>
      >`
        SELECT
          DATE("abandonedAt") as date,
          COUNT(*) as abandoned,
          COUNT(CASE WHEN "isRecovered" = true THEN 1 END) as recovered
        FROM "AbandonedCart"
        WHERE "tenantId" = ${tenantId}
          AND "abandonedAt" >= NOW() - INTERVAL '30 days'
        GROUP BY DATE("abandonedAt")
        ORDER BY date DESC
      `,
    ]);

    const lostTotal = totalRevenueLost._sum.cartTotal ?? 0;
    const recoveredTotal = totalRevenueRecovered._sum.cartTotal ?? 0;
    const recoveryRate = totalCarts > 0
      ? Math.round((recoveredCarts / totalCarts) * 100 * 10) / 10
      : 0;

    return NextResponse.json({
      summary: {
        totalCarts,
        recoveredCarts,
        pendingCarts,
        recoveryRate,
        lostRevenue: lostTotal,
        recoveredRevenue: recoveredTotal,
      },
      recentCarts: recentCarts.map((cart) => ({
        id: cart.id,
        contactName: cart.contact.name ?? "不明",
        contactEmail: cart.contact.email,
        cartTotal: cart.cartTotal,
        currency: cart.currency,
        status: cart.status,
        isRecovered: cart.isRecovered,
        remindersSent: cart.remindersSent,
        abandonedAt: cart.abandonedAt.toISOString(),
        recoveredAt: cart.recoveredAt?.toISOString() ?? null,
      })),
      dailyStats: dailyStats.map((d) => ({
        date: String(d.date),
        abandoned: Number(d.abandoned),
        recovered: Number(d.recovered),
      })),
    });
  } catch (error) {
    console.error("GET /api/analytics/cart-recovery error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart recovery analytics" },
      { status: 500 }
    );
  }
}
