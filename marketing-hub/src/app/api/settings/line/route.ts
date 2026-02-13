import { NextRequest, NextResponse } from "next/server";

/**
 * LINE Settings API (Stub)
 * NOTE: LINE channel fields not in Tenant schema
 * This endpoint returns a stub response
 */

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "LINE settings feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "LINE settings feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: "LINE settings feature not yet fully implemented" },
    { status: 501 }
  );
}
