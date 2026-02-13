import { NextRequest, NextResponse } from "next/server";

/**
 * SMS Send API (Stub)
 * NOTE: sMSSettings model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "SMS send feature not yet fully implemented" },
    { status: 501 }
  );
}
