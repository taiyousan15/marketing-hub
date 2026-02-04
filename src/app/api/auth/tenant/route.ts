import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/tenant";

// 開発モード: 認証なしでもダミーテナント情報を返す
const DEV_MODE_NO_AUTH = true;

// 開発用ダミーデータ
const devModeResponse = {
  tenantId: "dev-tenant-001",
  userId: "dev-user-001",
  user: {
    id: "dev-user-001",
    name: "開発者",
    email: "dev@example.com",
    role: "owner",
  },
  tenant: {
    id: "dev-tenant-001",
    name: "開発テナント",
    plan: "professional",
  },
};

/**
 * テナント情報取得API
 * クライアントサイドからClerk認証情報を取得
 */
export async function GET() {
  // 開発モードの場合は即座にダミーデータを返す
  if (DEV_MODE_NO_AUTH) {
    return NextResponse.json(devModeResponse);
  }

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
