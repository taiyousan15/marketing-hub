import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Journey CRUD API (Stub)
 * NOTE: journey model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Journey feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Journey feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Journey feature not yet fully implemented" },
    { status: 501 }
  );
}
