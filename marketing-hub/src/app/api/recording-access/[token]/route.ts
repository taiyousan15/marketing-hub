import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * Recording Access API (Stub)
 * NOTE: recordingAccessLog model not in Prisma schema
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Recording access feature not yet fully implemented" },
    { status: 501 }
  );
}
