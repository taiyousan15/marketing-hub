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

// 本番環境かどうか
const isProduction = process.env.NODE_ENV === "production";

/**
 * 現在のユーザーとテナント情報を取得
 *
 * - 本番環境（isProduction）: Clerk認証必須。失敗時はnullを返す
 * - 開発環境（!isProduction）: Clerk未設定またはauth失敗時は開発用テナントにフォールバック
 */
export async function getCurrentUser(): Promise<{
  userId: string;
  tenantId: string;
  user: User | null;
  tenant: Tenant | null;
} | null> {
  // Clerkが未設定の場合は開発用テナントを使用
  if (!isClerkConfigured) {
    return getOrCreateDevTenant();
  }

  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId) {
      // 本番: 未認証 → null（401を返す）
      // 開発: 未認証 → 開発用テナントにフォールバック
      return isProduction ? null : getOrCreateDevTenant();
    }

    // DBからユーザーを取得
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { tenant: true },
    });

    if (!user) {
      // 本番: DBに未登録 → null
      // 開発: DBに未登録 → 開発用テナントにフォールバック
      return isProduction ? null : getOrCreateDevTenant();
    }

    return {
      userId: user.id,
      tenantId: user.tenantId,
      user,
      tenant: user.tenant,
    };
  } catch (error) {
    console.error("getCurrentUser failed:", error instanceof Error ? error.message : error);
    // 本番: エラー → null
    // 開発: エラー → 開発用テナントにフォールバック
    return isProduction ? null : getOrCreateDevTenant();
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
