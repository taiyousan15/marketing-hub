import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * AI Chat API routes
 * NOTE: autoWebinarChatMessage model not in Prisma schema
 * Chat messages are stored as JSON in AutomatedWebinar.chatMessages
 * These endpoints return stub responses for now
 */

export async function GET(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "AI chat feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "AI chat feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "AI chat feature not yet fully implemented" },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return NextResponse.json(
    { error: "AI chat feature not yet fully implemented" },
    { status: 501 }
  );
}
