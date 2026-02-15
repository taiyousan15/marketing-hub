"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const sampleOrders = [
  {
    id: "ORD-001",
    contactName: "田中 太郎",
    contactEmail: "tanaka@example.com",
    productName: "オンラインコース基礎編",
    amount: 29800,
    status: "completed",
    paymentMethod: "card",
    createdAt: "2025-01-30 14:30",
  },
  {
    id: "ORD-002",
    contactName: "鈴木 花子",
    contactEmail: "suzuki@example.com",
    productName: "月額メンバーシップ",
    amount: 9800,
    status: "completed",
    paymentMethod: "card",
    createdAt: "2025-01-30 10:15",
  },
  {
    id: "ORD-003",
    contactName: "佐藤 一郎",
    contactEmail: "sato@example.com",
    productName: "個別コンサルティング",
    amount: 50000,
    status: "pending",
    paymentMethod: "bank",
    createdAt: "2025-01-29 16:45",
  },
  {
    id: "ORD-004",
    contactName: "山田 次郎",
    contactEmail: "yamada@example.com",
    productName: "オンラインコース基礎編",
    amount: 29800,
    status: "failed",
    paymentMethod: "card",
    createdAt: "2025-01-28 09:00",
  },
  {
    id: "ORD-005",
    contactName: "高橋 三郎",
    contactEmail: "takahashi@example.com",
    productName: "年間プラン",
    amount: 98000,
    status: "refunded",
    paymentMethod: "card",
    createdAt: "2025-01-25 11:30",
  },
];

const statusConfig = {
  completed: { label: "完了", icon: CheckCircle, color: "text-green-600" },
  pending: { label: "処理中", icon: Clock, color: "text-yellow-600" },
  failed: { label: "失敗", icon: XCircle, color: "text-red-600" },
  refunded: { label: "返金済", icon: RefreshCw, color: "text-gray-600" },
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(price);
};

type SampleOrder = typeof sampleOrders[number];

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<SampleOrder | null>(null);

  const handleViewDetail = (order: SampleOrder) => {
    setSelectedOrder(order);
  };

  const handleIssueReceipt = (order: SampleOrder) => {
    toast.success(`${order.id} の領収書を発行しました`, {
      description: `${order.contactName} 様宛・${formatPrice(order.amount)}`,
    });
  };

  const handleRefund = (order: SampleOrder) => {
    if (!confirm(`${order.contactName} 様の注文 (${formatPrice(order.amount)}) を返金しますか？`)) return;
    toast.success(`${order.id} の返金処理を開始しました`, {
      description: "返金完了まで3-5営業日かかる場合があります",
    });
  };

  const filteredOrders = sampleOrders.filter(
    (order) =>
      order.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = sampleOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.amount, 0);

  const completedOrders = sampleOrders.filter((o) => o.status === "completed").length;
  const pendingOrders = sampleOrders.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">注文管理</h1>
          <p className="text-muted-foreground">
            すべての注文と売上を管理します
          </p>
        </div>
        <Button variant="outline">
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
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了注文</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
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
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              フィルター
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    注文が見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const status = statusConfig[order.status as keyof typeof statusConfig];
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.contactName}</p>
                          <p className="text-xs text-muted-foreground">{order.contactEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell className="font-medium">{formatPrice(order.amount)}</TableCell>
                      <TableCell>
                        <div className={"flex items-center gap-1 " + status.color}>
                          <StatusIcon className="h-4 w-4" />
                          <span>{status.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{order.createdAt}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(order)}>
                              詳細を表示
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleIssueReceipt(order)}>
                              領収書を発行
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {order.status === "completed" && (
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleRefund(order)}
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
                  <p className="font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">顧客名</p>
                  <p className="font-medium">{selectedOrder.contactName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">メール</p>
                  <p>{selectedOrder.contactEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">商品</p>
                  <p>{selectedOrder.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">金額</p>
                  <p className="text-xl font-bold">{formatPrice(selectedOrder.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ステータス</p>
                  <div className={"flex items-center gap-1 mt-1 " + statusConfig[selectedOrder.status as keyof typeof statusConfig].color}>
                    {(() => {
                      const StatusIcon = statusConfig[selectedOrder.status as keyof typeof statusConfig].icon;
                      return <StatusIcon className="h-4 w-4" />;
                    })()}
                    <span>{statusConfig[selectedOrder.status as keyof typeof statusConfig].label}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">決済方法</p>
                  <p>{selectedOrder.paymentMethod === "card" ? "クレジットカード" : "銀行振込"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">注文日時</p>
                  <p>{selectedOrder.createdAt}</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    handleIssueReceipt(selectedOrder);
                    setSelectedOrder(null);
                  }}
                >
                  領収書を発行
                </Button>
                {selectedOrder.status === "completed" && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleRefund(selectedOrder);
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
    </div>
  );
}
