"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Clock,
  Mail,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CartSummary {
  totalCarts: number;
  recoveredCarts: number;
  pendingCarts: number;
  recoveryRate: number;
  lostRevenue: number;
  recoveredRevenue: number;
}

interface RecentCart {
  id: string;
  contactName: string;
  contactEmail: string | null;
  cartTotal: number;
  currency: string;
  status: string;
  isRecovered: boolean;
  remindersSent: number;
  abandonedAt: string;
  recoveredAt: string | null;
}

export default function CartRecoveryPage() {
  const [summary, setSummary] = useState<CartSummary>({
    totalCarts: 0,
    recoveredCarts: 0,
    pendingCarts: 0,
    recoveryRate: 0,
    lostRevenue: 0,
    recoveredRevenue: 0,
  });
  const [recentCarts, setRecentCarts] = useState<RecentCart[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/cart-recovery");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSummary(data.summary);
      setRecentCarts(data.recentCarts || []);
    } catch (error) {
      console.error("Failed to load cart recovery data:", error);
      toast.error("カート放棄データの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) =>
    `¥${amount.toLocaleString()}`;

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}分前`;
    if (hours < 24) return `${hours}時間前`;
    return `${Math.floor(hours / 24)}日前`;
  };

  const statusBadge = (status: string, isRecovered: boolean) => {
    if (isRecovered)
      return <Badge className="bg-green-100 text-green-700">回収済み</Badge>;
    if (status === "PENDING")
      return <Badge variant="secondary">未対応</Badge>;
    if (status === "CONTACTED")
      return <Badge className="bg-blue-100 text-blue-700">連絡済み</Badge>;
    if (status === "EXPIRED")
      return <Badge variant="outline">期限切れ</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">カート放棄リカバリー</h1>
        <p className="text-muted-foreground">
          放棄カートの追跡と回収状況
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">放棄カート数</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCarts}</div>
            <p className="text-xs text-muted-foreground">
              未対応: {summary.pendingCarts}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">回収率</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.recoveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.recoveredCarts}件回収
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">損失額</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.lostRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">放棄カート合計</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">回収額</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.recoveredRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">回収済み合計</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近の放棄カート</CardTitle>
          <CardDescription>
            直近の放棄カートと回収状況
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentCarts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>放棄カートデータがありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCarts.map((cart) => (
                <div
                  key={cart.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{cart.contactName}</p>
                      <p className="text-sm text-muted-foreground">
                        {cart.contactEmail ?? "メール未登録"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(cart.cartTotal)}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        リマインダー: {cart.remindersSent}回
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(cart.status, cart.isRecovered)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-[80px]">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(cart.abandonedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
