import { NextRequest, NextResponse } from "next/server";

type Params = { shareCode: string; lessonId: string };

/**
 * 公開レッスン取得（認証不要）- Not implemented
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return NextResponse.json(
    { success: false, error: "Public lesson sharing is not implemented" },
    { status: 501 }
  );
}
