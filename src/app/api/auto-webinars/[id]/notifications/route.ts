import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/tenant";

interface RouteParams {
  params: Promise<{ id: string }>;
}

type NotificationChannel = "EMAIL" | "LINE" | "SMS" | "PUSH";

/**
 * 通知設定を取得 - Stub Implementation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: "notif_" + id,
      webinarId: id,
      isEnabled: true,
      defaultChannel: "EMAIL" as NotificationChannel,
      reminders: [],
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    );
  }
}

/**
 * 通知設定を更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId = userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    return NextResponse.json({
      success: false,
      error: "Notification settings update not implemented",
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
