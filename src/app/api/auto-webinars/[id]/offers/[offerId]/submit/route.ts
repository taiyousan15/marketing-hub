import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; offerId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Not implemented", message: "Auto-webinar offer submission feature is under development" },
    { status: 501 }
  );
}
