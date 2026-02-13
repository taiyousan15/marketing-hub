import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Chat Messages API
 * NOTE: autoWebinarChatMessage model not in Prisma schema
 * Chat messages stored as JSON in AutomatedWebinar.chatMessages
 * These endpoints return stub responses for now
 */

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Chat messages feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Chat messages feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Chat messages feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "Chat messages feature not yet fully implemented" },
    { status: 501 }
  );
}
