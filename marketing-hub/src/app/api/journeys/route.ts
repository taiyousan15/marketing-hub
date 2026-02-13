import { NextRequest, NextResponse } from "next/server";

/**
 * Journey List API (Stub)
 * NOTE: journey model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Journey feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Journey feature not yet fully implemented" },
    { status: 501 }
  );
}
