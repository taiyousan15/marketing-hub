import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ eventId: string; recordingId: string }>;
}

/**
 * LiveStream Recording Distribution API (Stub)
 * This endpoint returns a stub response
 */

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Livestream recording distribution feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Livestream recording distribution feature not yet fully implemented" },
    { status: 501 }
  );
}
