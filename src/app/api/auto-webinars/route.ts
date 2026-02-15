import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Not implemented", message: "Auto-webinar list feature is under development" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Not implemented", message: "Auto-webinar creation feature is under development" },
    { status: 501 }
  );
}
