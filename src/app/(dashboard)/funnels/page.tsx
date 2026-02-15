"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Globe,
  GlobeLock,
  BarChart3,
  Loader2,
  Filter,
  ShoppingCart,
  Mail,
  Video,
  Rocket,
  Users,
  Zap,
  FileText,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Funnel {
  id: string;
  name: string;
  type: string;
  status: string;
  domain: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    pages: number;
    steps: number;
  };
}

const funnelTypeConfig: Record<string, { label: string; icon: typeof ShoppingCart; color: string }> = {
  OPTIN: { label: "オプトイン", icon: Mail, color: "bg-blue-100 text-blue-800" },
  SALES: { label: "セールス", icon: ShoppingCart, color: "bg-green-100 text-green-800" },
  WEBINAR: { label: "ウェビナー", icon: Video, color: "bg-purple-100 text-purple-800" },
  PRODUCT_LAUNCH: { label: "プロダクトローンチ", icon: Rocket, color: "bg-orange-100 text-orange-800" },
  MEMBERSHIP: { label: "会員登録", icon: Users, color: "bg-pink-100 text-pink-800" },
  TRIPWIRE: { label: "トリップワイヤー", icon: Zap, color: "bg-yellow-100 text-yellow-800" },
  APPLICATION: { label: "申込み", icon: FileText, color: "bg-gray-100 text-gray-800" },
};

export default function FunnelsPage() {
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchFunnels();
  }, [typeFilter]);

  const fetchFunnels = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter && typeFilter !== "all") {
        params.set("type", typeFilter);
      }
      const res = await fetch(`/api/funnels?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFunnels(data.funnels);
    } catch (error) {
      toast.error("ファネルの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFunnel = async (id: string) => {
    if (!confirm("このファネルを削除しますか？")) return;

    try {
      const res = await fetch(`/api/funnels/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("ファネルを削除しました");
      fetchFunnels();
    } catch (error) {
      toast.error("削除に失敗しました");
    }
  };

  const filteredFunnels = funnels.filter((funnel) =>
    funnel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publishedCount = funnels.filter((f) => f.status === "PUBLISHED").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ファネル・LP</h1>
          <p className="text-muted-foreground">
            ランディングページとセールスファネルを管理します
          </p>
        </div>
        <Button asChild>
          <Link href="/funnels/new">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ファネル数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">公開中</CardTitle>
            <Globe className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">下書き</CardTitle>
            <GlobeLock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnels.length - publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ファネルタイプ</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(funnelTypeConfig).length}種類
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
                placeholder="ファネル名で検索..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="タイプで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {Object.entries(funnelTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFunnels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                ファネルがありません
              </p>
              <Button asChild>
                <Link href="/funnels/new">
                  <Plus className="mr-2 h-4 w-4" />
                  最初のファネルを作成
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredFunnels.map((funnel) => {
                const typeInfo = funnelTypeConfig[funnel.type] || funnelTypeConfig.SALES;
                const TypeIcon = typeInfo.icon;

                return (
                  <Card key={funnel.id} className="overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <TypeIcon className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base truncate">
                          {funnel.name}
                        </CardTitle>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/funnels/${funnel.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                編集
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/funnels/${funnel.id}/builder`}>
                                <Edit className="mr-2 h-4 w-4" />
                                ビルダー
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              プレビュー
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              複製
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => deleteFunnel(funnel.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <CardDescription className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${typeInfo.color}`}>
                          <TypeIcon className="mr-1 h-3 w-3" />
                          {typeInfo.label}
                        </Badge>
                        {funnel.status === "PUBLISHED" ? (
                          <Badge variant="default" className="text-xs">
                            <Globe className="mr-1 h-3 w-3" />
                            公開中
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <GlobeLock className="mr-1 h-3 w-3" />
                            下書き
                          </Badge>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{funnel._count.steps}ステップ</span>
                        <span>{funnel._count.pages}ページ</span>
                        <span>
                          {new Date(funnel.updatedAt).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
