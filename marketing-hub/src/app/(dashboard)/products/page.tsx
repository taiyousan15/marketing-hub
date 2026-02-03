"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Package,
  RefreshCw,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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

const sampleProducts = [
  {
    id: "1",
    name: "オンラインコース基礎編",
    type: "one_time",
    price: 29800,
    currency: "jpy",
    status: "active",
    salesCount: 45,
    revenue: 1341000,
    createdAt: "2025-01-10",
  },
  {
    id: "2",
    name: "月額メンバーシップ",
    type: "subscription",
    price: 9800,
    currency: "jpy",
    status: "active",
    salesCount: 123,
    revenue: 1205400,
    interval: "month",
    createdAt: "2025-01-05",
  },
  {
    id: "3",
    name: "個別コンサルティング",
    type: "one_time",
    price: 50000,
    currency: "jpy",
    status: "active",
    salesCount: 12,
    revenue: 600000,
    createdAt: "2025-01-15",
  },
  {
    id: "4",
    name: "年間プラン",
    type: "subscription",
    price: 98000,
    currency: "jpy",
    status: "draft",
    salesCount: 0,
    revenue: 0,
    interval: "year",
    createdAt: "2025-01-28",
  },
];

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(price);
};

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = sampleProducts.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = sampleProducts.reduce((sum, p) => sum + p.revenue, 0);
  const totalSales = sampleProducts.reduce((sum, p) => sum + p.salesCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">商品管理</h1>
          <p className="text-muted-foreground">
            販売する商品・サービスを管理します
          </p>
        </div>
        <Button asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" />
            新規商品登録
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総売上</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue, "jpy")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総販売数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブ商品</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleProducts.filter((p) => p.status === "active").length}
            </div>
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
                placeholder="商品名で検索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品名</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>価格</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">販売数</TableHead>
                <TableHead className="text-right">売上</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    商品が見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link
                        href={"/products/" + product.id}
                        className="font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {product.type === "subscription" ? (
                        <div className="flex items-center gap-1">
                          <RefreshCw className="h-4 w-4 text-blue-500" />
                          <span>サブスク</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          <span>単発</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatPrice(product.price, product.currency)}
                      {product.type === "subscription" && (
                        <span className="text-xs text-muted-foreground">
                          /{product.interval === "month" ? "月" : "年"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === "active" ? "default" : "secondary"}
                      >
                        {product.status === "active" ? "販売中" : "下書き"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{product.salesCount}</TableCell>
                    <TableCell className="text-right">
                      {formatPrice(product.revenue, product.currency)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={"/products/" + product.id}>
                              <Edit className="mr-2 h-4 w-4" />
                              編集
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            複製
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
