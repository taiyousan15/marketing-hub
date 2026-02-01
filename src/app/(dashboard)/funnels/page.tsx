"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";

const sampleFunnels = [
  {
    id: "1",
    name: "無料オファーLP",
    slug: "free-offer",
    status: "published",
    pageCount: 3,
    views: 12450,
    conversions: 345,
    conversionRate: 2.77,
    updatedAt: "2025-01-28",
  },
  {
    id: "2",
    name: "セミナー申込ページ",
    slug: "seminar-registration",
    status: "published",
    pageCount: 2,
    views: 5670,
    conversions: 234,
    conversionRate: 4.13,
    updatedAt: "2025-01-25",
  },
  {
    id: "3",
    name: "商品販売ファネル",
    slug: "product-sales",
    status: "draft",
    pageCount: 5,
    views: 0,
    conversions: 0,
    conversionRate: 0,
    updatedAt: "2025-01-30",
  },
];

export default function FunnelsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFunnels = sampleFunnels.filter((funnel) =>
    funnel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">公開中のファネル</CardTitle>
            <Globe className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleFunnels.filter((f) => f.status === "published").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総PV数</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleFunnels.reduce((sum, f) => sum + f.views, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総CV数</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleFunnels.reduce((sum, f) => sum + f.conversions, 0).toLocaleString()}
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
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFunnels.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                ファネルが見つかりません
              </div>
            ) : (
              filteredFunnels.map((funnel) => (
                <Card key={funnel.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    <span className="text-4xl">📄</span>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{funnel.name}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={"/funnels/" + funnel.id + "/builder"}>
                              <Edit className="mr-2 h-4 w-4" />
                              編集
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
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      {funnel.status === "published" ? (
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
                      <span className="text-xs">{funnel.pageCount}ページ</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground">PV: </span>
                        <span className="font-medium">{funnel.views.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CV: </span>
                        <span className="font-medium">{funnel.conversions.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CVR: </span>
                        <span className="font-medium">{funnel.conversionRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
