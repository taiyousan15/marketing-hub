import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * チャットメッセージ一覧取得 - Stub Implementation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId || !id) {
      return NextResponse.json(
        { error: "Tenant ID and Webinar ID required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      messages: [],
      total: 0,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId || !id) {
      return NextResponse.json(
        { error: "Tenant ID and Webinar ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { appearAtSeconds, content, messageType } = body;

    if (!appearAtSeconds || !content || !messageType) {
      return NextResponse.json(
        { error: "appearAtSeconds, content, and messageType are required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      error: "Chat message creation not implemented",
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId || !id) {
      return NextResponse.json(
        { error: "Tenant ID and Webinar ID required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      error: "Chat message deletion not implemented",
    });
  } catch (error) {
    console.error("Error deleting messages:", error);
    return NextResponse.json(
      { error: "Failed to delete messages" },
      { status: 500 }
    );
  }
}
