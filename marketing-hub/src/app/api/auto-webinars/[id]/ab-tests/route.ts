import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * A/B Test API routes
 * NOTE: OfferABTest model not yet implemented in Prisma schema
 * These endpoints return stub responses for now
 */

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "A/B testing feature not yet implemented" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "A/B testing feature not yet implemented" },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "A/B testing feature not yet implemented" },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "A/B testing feature not yet implemented" },
    { status: 501 }
  );
}
