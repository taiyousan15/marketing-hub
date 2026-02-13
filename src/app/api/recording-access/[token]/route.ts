import { NextRequest, NextResponse } from "next/server";

type Params = { token: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return NextResponse.json(
    { success: false, error: "Recording access is not implemented" },
    { status: 501 }
  );
}
