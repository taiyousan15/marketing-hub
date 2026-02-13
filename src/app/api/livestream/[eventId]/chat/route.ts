import { NextRequest, NextResponse } from "next/server";

type Params = { eventId?: string; recordingId?: string };

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> } = { params: Promise.resolve({}) }
) {
  return NextResponse.json(
    { success: false, error: "Livestream endpoint is not implemented" },
    { status: 501 }
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> } = { params: Promise.resolve({}) }
) {
  return NextResponse.json(
    { success: false, error: "Livestream endpoint is not implemented" },
    { status: 501 }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> } = { params: Promise.resolve({}) }
) {
  return NextResponse.json(
    { success: false, error: "Livestream endpoint is not implemented" },
    { status: 501 }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> } = { params: Promise.resolve({}) }
) {
  return NextResponse.json(
    { success: false, error: "Livestream endpoint is not implemented" },
    { status: 501 }
  );
}
