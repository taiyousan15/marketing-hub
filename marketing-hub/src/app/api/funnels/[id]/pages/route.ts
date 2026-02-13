import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Funnel Pages API (Stub)
 * NOTE: funnelStep model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Funnel pages feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Funnel pages feature not yet fully implemented" },
    { status: 501 }
  );
}
