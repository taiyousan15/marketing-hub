import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

/**
 * LiveStream CRUD API (Stub)
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Livestream feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Livestream feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Livestream feature not yet fully implemented" },
    { status: 501 }
  );
}
