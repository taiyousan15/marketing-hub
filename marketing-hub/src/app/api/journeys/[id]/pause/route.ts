import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Journey Pause API (Stub)
 * NOTE: journey model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Journey feature not yet fully implemented" },
    { status: 501 }
  );
}
