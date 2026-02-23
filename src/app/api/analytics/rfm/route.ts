import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";

const SEGMENT_CONFIG: Record<
  string,
  { label: string; color: string; order: number }
> = {
  champion: { label: "チャンピオン", color: "bg-green-500", order: 1 },
  loyal: { label: "ロイヤル顧客", color: "bg-emerald-500", order: 2 },
  new_customer: { label: "新規顧客", color: "bg-blue-500", order: 3 },
  promising: { label: "有望顧客", color: "bg-cyan-500", order: 4 },
  needs_attention: { label: "要注意", color: "bg-yellow-500", order: 5 },
  at_risk: { label: "リスク顧客", color: "bg-orange-500", order: 6 },
  dormant: { label: "休眠顧客", color: "bg-gray-500", order: 7 },
};

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = user.tenantId;

    const [segmentCounts, tierCounts, totalScores] = await Promise.all([
      prisma.contactScore.groupBy({
        by: ["rfmSegment"],
        where: { tenantId, rfmSegment: { not: null } },
        _count: true,
      }),
      prisma.contactScore.groupBy({
        by: ["tier"],
        where: { tenantId },
        _count: true,
      }),
      prisma.contactScore.count({ where: { tenantId } }),
    ]);

    const segments = segmentCounts
      .map((s) => {
        const key = s.rfmSegment ?? "unknown";
        const config = SEGMENT_CONFIG[key] ?? {
          label: key,
          color: "bg-gray-400",
          order: 99,
        };
        return {
          name: config.label,
          key,
          count: s._count,
          color: config.color,
          percentage:
            totalScores > 0
              ? Math.round((s._count / totalScores) * 100 * 10) / 10
              : 0,
          order: config.order,
        };
      })
      .sort((a, b) => a.order - b.order);

    const tiers = tierCounts.map((t) => ({
      tier: t.tier,
      count: t._count,
      percentage:
        totalScores > 0
          ? Math.round((t._count / totalScores) * 100 * 10) / 10
          : 0,
    }));

    return NextResponse.json({
      segments,
      tiers,
      totalContacts: totalScores,
    });
  } catch (error) {
    console.error("GET /api/analytics/rfm error:", error);
    return NextResponse.json(
      { error: "Failed to fetch RFM analytics" },
      { status: 500 }
    );
  }
}
