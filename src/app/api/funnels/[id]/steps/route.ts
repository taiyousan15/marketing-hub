import { NextRequest, NextResponse } from "next/server";

type Params = { id: string };

/**
 * Funnel steps endpoint - Not implemented
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return NextResponse.json(
    { success: false, error: "Funnel steps endpoint is not implemented" },
    { status: 501 }
  );
}

/**
 * Funnel steps creation - Not implemented
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return NextResponse.json(
    { success: false, error: "Funnel steps endpoint is not implemented" },
    { status: 501 }
  );
}

/**
 * Funnel steps reordering - Not implemented
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return NextResponse.json(
    { success: false, error: "Funnel steps endpoint is not implemented" },
    { status: 501 }
  );
}
