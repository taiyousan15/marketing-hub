"use client";

import { useState, useEffect, useCallback } from "react";

interface TenantInfo {
  tenantId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  tenant: {
    id: string;
    name: string;
    plan: string;
  } | null;
}

interface UseTenantResult {
  tenantId: string | null;
  userId: string | null;
  user: TenantInfo["user"];
  tenant: TenantInfo["tenant"];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * テナント情報を取得するカスタムフック
 * Clerk認証に基づいてサーバーからテナント情報を取得
 */
export function useTenant(): UseTenantResult {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<TenantInfo["user"]>(null);
  const [tenant, setTenant] = useState<TenantInfo["tenant"]>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/auth/tenant");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch tenant");
      }

      setTenantId(data.tenantId);
      setUserId(data.userId);
      setUser(data.user);
      setTenant(data.tenant);
    } catch (err) {
      console.error("Failed to fetch tenant:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      // 開発モードではデモテナントにフォールバック
      if (process.env.NODE_ENV === "development") {
        setTenantId("dev-tenant-id");
        setUserId("dev-user-id");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  return {
    tenantId,
    userId,
    user,
    tenant,
    loading,
    error,
    refetch: fetchTenant,
  };
}
