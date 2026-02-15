import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/tenant";

/**
 * テナント情報取得API
 * クライアントサイドからClerk認証情報を取得
 */
export async function GET() {
  try {
    const userInfo = await getCurrentUser();

    if (!userInfo) {
      return NextResponse.json(
        { error: "Unauthorized", tenantId: null },
        { status: 401 }
      );
    }

    return NextResponse.json({
      tenantId: userInfo.tenantId,
      userId: userInfo.userId,
      user: userInfo.user
        ? {
            id: userInfo.user.id,
            name: userInfo.user.name,
            email: userInfo.user.email,
            role: userInfo.user.role,
          }
        : null,
      tenant: userInfo.tenant
        ? {
            id: userInfo.tenant.id,
            name: userInfo.tenant.name,
            plan: userInfo.tenant.plan,
          }
        : null,
    });
  } catch (error) {
    console.error("Failed to get tenant info:", error);
    return NextResponse.json(
      { error: "Internal server error", tenantId: null },
      { status: 500 }
    );
  }
}
