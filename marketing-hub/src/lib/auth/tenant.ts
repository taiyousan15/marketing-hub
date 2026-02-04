import { prisma } from "@/lib/db/prisma";
import type { Tenant, User } from "@prisma/client";

// Clerkが設定されているかチェック
const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_");

// 開発用テナントのID
const DEV_TENANT_ID = "dev-tenant-id";
const DEV_USER_ID = "dev-user-id";

/**
 * 開発用のダミーテナントとユーザーを取得または作成
 */
async function getOrCreateDevTenant(): Promise<{
  userId: string;
  tenantId: string;
  user: User | null;
  tenant: Tenant | null;
}> {
  try {
    // upsertでテナントを取得または作成（ユニーク制約に対応）
    const tenant = await prisma.tenant.upsert({
      where: { id: DEV_TENANT_ID },
      update: {}, // 既存の場合は何もしない
      create: {
        id: DEV_TENANT_ID,
        name: "開発用ワークスペース",
        subdomain: `dev-workspace-${Date.now()}`, // ユニーク性を保証
        plan: "STARTER",
      },
    });

    // upsertでユーザーを取得または作成
    const user = await prisma.user.upsert({
      where: { id: DEV_USER_ID },
      update: {}, // 既存の場合は何もしない
      create: {
        id: DEV_USER_ID,
        email: "dev@example.com",
        name: "開発ユーザー",
        tenantId: tenant.id,
        role: "OWNER",
        clerkUserId: `dev-clerk-${Date.now()}`, // ユニーク性を保証
      },
      include: { tenant: true },
    });

    return {
      userId: DEV_USER_ID,
      tenantId: tenant.id,
      user,
      tenant,
    };
  } catch (error) {
    console.error("Failed to get/create dev tenant:", error);
    // エラー時はnullを返さず、既存データを再取得
    const existingTenant = await prisma.tenant.findFirst({
      where: { name: "開発用ワークスペース" },
    });
    const existingUser = await prisma.user.findFirst({
      where: { email: "dev@example.com" },
      include: { tenant: true },
    });

    if (existingTenant && existingUser) {
      return {
        userId: existingUser.id,
        tenantId: existingTenant.id,
        user: existingUser,
        tenant: existingTenant,
      };
    }

    throw error;
  }
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
  if (!isClerkConfigured) {
    // 開発用のダミーユーザーとテナントを取得または作成
    return getOrCreateDevTenant();
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
