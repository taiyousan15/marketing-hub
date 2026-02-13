import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * オートウェビナー分析データ取得 - Stub Implementation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    return NextResponse.json({
      registrations: { byStatus: [], total: 0 },
      sessions: { byDay: [], total: 0 },
      engagement: { avgWatchTime: 0, avgCompletionRate: 0 },
      offers: { topOffers: [], totalClicks: 0 },
      message: "Auto-webinar analytics not implemented",
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
