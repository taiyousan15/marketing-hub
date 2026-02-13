import { NextRequest, NextResponse } from "next/server";

/**
 * SMS Settings API (Stub)
 * NOTE: sMSSettings model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "SMS settings feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "SMS settings feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: "SMS settings feature not yet fully implemented" },
    { status: 501 }
  );
}
