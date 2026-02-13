import { NextRequest, NextResponse } from "next/server";

/**
 * Cron Job: Cleanup Sessions
 * NOTE: autoWebinarSession model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest) {
  // Verify cron secret
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    message: "Cleanup skipped - feature not yet implemented",
  });
}
