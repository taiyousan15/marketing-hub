import { NextRequest, NextResponse } from "next/server";

type Params = { shareCode: string; lessonId: string };

/**
 * Public Lesson API (Stub)
 * NOTE: shareCode, isPublicCourse, accessMode fields not in Prisma schema
 * This endpoint returns a stub response
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  return NextResponse.json(
    { error: "Public course access feature not yet fully implemented" },
    { status: 501 }
  );
}
