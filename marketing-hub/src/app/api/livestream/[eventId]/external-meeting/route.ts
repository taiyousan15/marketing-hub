import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

/**
 * LiveStream External Meeting API (Stub)
 * This endpoint returns a stub response
 */

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Livestream external meeting feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Livestream external meeting feature not yet fully implemented" },
    { status: 501 }
  );
}
