import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; offerId: string }>;
}

/**
 * Webinar Offer Checkout API (Stub)
 * NOTE: autoWebinarTimedOffer model not implemented in Prisma schema
 * This endpoint returns a stub response
 */

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Webinar checkout feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Webinar checkout feature not yet fully implemented" },
    { status: 501 }
  );
}
