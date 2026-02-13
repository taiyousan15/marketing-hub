import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; pageId: string }>;
}

/**
 * Funnel Page API (Stub)
 * NOTE: funnelStep model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Funnel pages feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Funnel pages feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Funnel pages feature not yet fully implemented" },
    { status: 501 }
  );
}
