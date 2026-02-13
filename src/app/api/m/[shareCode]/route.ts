import { NextRequest, NextResponse } from "next/server";

type Params = { shareCode: string };

/**
 * 公開コース取得（認証不要）- Not implemented
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return NextResponse.json(
    { success: false, error: "Public course access is not implemented" },
    { status: 501 }
  );
}
