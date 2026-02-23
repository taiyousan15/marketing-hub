"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Download,
  MoreHorizontal,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface Order {
  id: string;
  contactId: string;
  productId: string;
  amount: number;
  currency: string;
  status: string;
  stripePaymentIntentId: string | null;
  createdAt: string;
  product: { id: string; name: string; type: string };
  contact: { id: string; name: string | null; email: string };
}

interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
}

const statusConfig: Record<
  string,
  { label: string; icon: typeof CheckCircle; color: string }
> = {
  COMPLETED: { label: "完了", icon: CheckCircle, color: "text-green-600" },
  PENDING: { label: "処理中", icon: Clock, color: "text-yellow-600" },
  PROCESSING: { label: "決済中", icon: Clock, color: "text-blue-600" },
  FAILED: { label: "失敗", icon: XCircle, color: "text-red-600" },
  REFUNDED: { label: "返金済", icon: RefreshCw, color: "text-gray-600" },
  PARTIALLY_REFUNDED: {
    label: "一部返金",
    icon: AlertTriangle,
    color: "text-orange-600",
  },
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(price);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);
  const [refunding, setRefunding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/orders?stats=true"),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.orders ?? []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("注文の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/orders/${refundTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refund",
          reason: "requested_by_customer",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "返金に失敗しました");
      }

      toast.success("返金処理を開始しました", {
        description: "返金完了まで3-5営業日かかる場合があります",
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === refundTarget.id ? { ...o, status: "REFUNDED" } : o
        )
      );
      setStats((prev) => ({
        ...prev,
        completedOrders: prev.completedOrders - 1,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "返金に失敗しました";
      toast.error(message);
    } finally {
      setRefunding(false);
      setRefundTarget(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    return (
      (order.contact.name ?? "").toLowerCase().includes(q) ||
      order.contact.email.toLowerCase().includes(q) ||
      order.id.toLowerCase().includes(q)
    );
  });

  const pendingOrders = orders.filter(
    (o) => o.status === "PENDING" || o.status === "PROCESSING"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">注文管理</h1>
          <p className="text-muted-foreground">
            すべての注文と売上を管理します
          </p>
        </div>
        <Button variant="outline" disabled>
          <Download className="mr-2 h-4 w-4" />
          エクスポート
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総売上</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了注文</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">処理中</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="注文ID、顧客名、メールで検索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" disabled>
              <Filter className="mr-2 h-4 w-4" />
              フィルター
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>注文ID</TableHead>
                  <TableHead>顧客</TableHead>
                  <TableHead>商品</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>日時</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      注文が見つかりません
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const status = statusConfig[order.status] ?? {
                      label: order.status,
                      icon: Clock,
                      color: "text-muted-foreground",
                    };
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          {order.id.slice(0, 12)}...
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.contact.name ?? "---"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.contact.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{order.product.name}</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(order.amount)}
                        </TableCell>
                        <TableCell>
                          <div
                            className={"flex items-center gap-1 " + status.color}
                          >
                            <StatusIcon className="h-4 w-4" />
                            <span>{status.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedOrder(order)}
                              >
                                詳細を表示
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {order.status === "COMPLETED" && (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => setRefundTarget(order)}
                                >
                                  返金処理
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 注文詳細パネル */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
          <div className="w-full max-w-md bg-background shadow-lg overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">注文詳細</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedOrder(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">注文ID</p>
                  <p className="font-mono text-sm">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">顧客名</p>
                  <p className="font-medium">
                    {selectedOrder.contact.name ?? "---"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">メール</p>
                  <p>{selectedOrder.contact.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">商品</p>
                  <p>{selectedOrder.product.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">金額</p>
                  <p className="text-xl font-bold">
                    {formatPrice(selectedOrder.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ステータス</p>
                  {(() => {
                    const status = statusConfig[selectedOrder.status] ?? {
                      label: selectedOrder.status,
                      icon: Clock,
                      color: "text-muted-foreground",
                    };
                    const StatusIcon = status.icon;
                    return (
                      <div
                        className={
                          "flex items-center gap-1 mt-1 " + status.color
                        }
                      >
                        <StatusIcon className="h-4 w-4" />
                        <span>{status.label}</span>
                      </div>
                    );
                  })()}
                </div>
                {selectedOrder.stripePaymentIntentId && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Stripe Payment Intent
                    </p>
                    <p className="font-mono text-xs">
                      {selectedOrder.stripePaymentIntentId}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">注文日時</p>
                  <p>{formatDate(selectedOrder.createdAt)}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                {selectedOrder.status === "COMPLETED" && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setRefundTarget(selectedOrder);
                      setSelectedOrder(null);
                    }}
                  >
                    返金処理
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 返金確認ダイアログ */}
      <AlertDialog
        open={!!refundTarget}
        onOpenChange={() => setRefundTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>返金処理を実行しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {refundTarget?.contact.name ?? "顧客"} 様の注文 (
              {refundTarget ? formatPrice(refundTarget.amount) : ""})
              を全額返金します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={refunding}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRefund}
              disabled={refunding}
              className="bg-red-600 hover:bg-red-700"
            >
              {refunding ? "処理中..." : "返金する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
