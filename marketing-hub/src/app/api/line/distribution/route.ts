import { NextRequest, NextResponse } from "next/server";

/**
 * LINE Distribution API (Stub)
 * NOTE: lineAccount model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "LINE distribution feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "LINE distribution feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: "LINE distribution feature not yet fully implemented" },
    { status: 501 }
  );
}
