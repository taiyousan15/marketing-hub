import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id?: string; offerId?: string; token?: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Webinar feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Webinar feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Webinar feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Webinar feature not yet fully implemented" },
    { status: 501 }
  );
}
