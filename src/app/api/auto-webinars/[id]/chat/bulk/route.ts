import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * チャットメッセージ一括インポート - Stub Implementation
 */
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
    const { format, data, clearExisting } = body;

    if (!format || !data) {
      return NextResponse.json(
        { error: "format and data are required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      error: "Chat message bulk import not implemented",
      messagesProcessed: 0,
    });
  } catch (error) {
    console.error("Error importing messages:", error);
    return NextResponse.json(
      { error: "Failed to import messages" },
      { status: 500 }
    );
  }
}

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
