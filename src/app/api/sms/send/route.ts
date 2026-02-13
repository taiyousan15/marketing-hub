import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "SMS endpoint is not implemented" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "SMS endpoint is not implemented" },
    { status: 501 }
  );
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "SMS endpoint is not implemented" },
    { status: 501 }
  );
}
