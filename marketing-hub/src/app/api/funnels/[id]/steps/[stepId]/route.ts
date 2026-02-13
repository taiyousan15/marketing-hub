import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; stepId: string }>;
}

/**
 * Funnel Steps API (Stub)
 * NOTE: funnelStep model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Funnel steps feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Funnel steps feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Funnel steps feature not yet fully implemented" },
    { status: 501 }
  );
}
