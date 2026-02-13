import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "Webhook endpoint is not implemented" },
    { status: 501 }
  );
}
