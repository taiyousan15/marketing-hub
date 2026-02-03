import { prisma } from "@/lib/db/prisma";
import type { Tenant, User } from "@prisma/client";

// 開発モード: 認証をバイパスしてダミーユーザーを返す
const DEV_MODE_NO_AUTH = true;

// 開発用テナントID
const DEV_TENANT_ID = "dev-tenant-001";
const DEV_USER_ID = "dev-user-001";

// Clerkが設定されているかチェック
const isClerkConfigured =
  !DEV_MODE_NO_AUTH &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

/**
 * 開発用テナントを取得または作成
 */
async function getOrCreateDevTenant(): Promise<Tenant> {
  let tenant = await prisma.tenant.findUnique({
    where: { id: DEV_TENANT_ID },
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: DEV_TENANT_ID,
        name: "開発用ワークスペース",
        subdomain: "dev-workspace",
        plan: "STARTER",
      },
    });
  }

  return tenant;
}

/**
 * 現在のユーザーとテナント情報を取得
 */
export async function getCurrentUser(): Promise<{
  userId: string;
  tenantId: string;
  user: User | null;
  tenant: Tenant | null;
} | null> {
  if (!isClerkConfigured || DEV_MODE_NO_AUTH) {
    // 開発用のダミーユーザー - テナントが存在することを保証
    const tenant = await getOrCreateDevTenant();
    return {
      userId: DEV_USER_ID,
      tenantId: tenant.id,
      user: null,
      tenant,
    };
  }

  try {
    const { auth, currentUser } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return null;
    }

    // DBからユーザーを取得（または作成）
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { tenant: true },
    });

    if (!user) {
      return {
        userId,
        tenantId: "",
        user: null,
        tenant: null,
      };
    }

    return {
      userId: user.id,
      tenantId: user.tenantId,
      user,
      tenant: user.tenant,
    };
  } catch {
    return null;
  }
}

/**
 * テナント作成（サインアップ時）
 */
export async function createTenantForUser(
  clerkUserId: string,
  email: string,
  name: string
): Promise<{ user: User; tenant: Tenant }> {
  // トランザクションでテナントとユーザーを作成
  const result = await prisma.$transaction(async (tx) => {
    // 既存ユーザーチェック
    const existingUser = await tx.user.findUnique({
      where: { clerkUserId },
      include: { tenant: true },
    });

    if (existingUser) {
      return {
        user: existingUser,
        tenant: existingUser.tenant,
      };
    }

    // 新規テナント作成（ユニークなサブドメインを生成）
    const subdomain = `tenant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tenant = await tx.tenant.create({
      data: {
        name: `${name}のワークスペース`,
        subdomain,
        plan: "STARTER",
      },
    });

    // ユーザー作成（オーナー権限）
    const user = await tx.user.create({
      data: {
        clerkUserId,
        email,
        name,
        tenantId: tenant.id,
        role: "OWNER",
      },
    });

    return { user, tenant };
  });

  return result;
}

/**
 * テナントIDを強制的にフィルターに追加するヘルパー
 */
export function withTenantFilter<T extends { tenantId?: string }>(
  tenantId: string,
  where: T
): T & { tenantId: string } {
  return {
    ...where,
    tenantId,
  };
}
