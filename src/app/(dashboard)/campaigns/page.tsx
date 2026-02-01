"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Copy,
  Trash2,
  Mail,
  MessageSquare,
  Users,
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

const sampleCampaigns = [
  {
    id: "1",
    name: "新規登録者向けステップメール",
    type: "step",
    channel: "email",
    status: "active",
    recipients: 1234,
    openRate: 45.2,
    clickRate: 12.8,
    createdAt: "2025-01-10",
  },
  {
    id: "2",
    name: "セミナー告知LINE配信",
    type: "broadcast",
    channel: "line",
    status: "active",
    recipients: 567,
    openRate: 78.5,
    clickRate: 23.1,
    createdAt: "2025-01-20",
  },
  {
    id: "3",
    name: "購入者フォローアップ",
    type: "step",
    channel: "email",
    status: "draft",
    recipients: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: "2025-01-25",
  },
  {
    id: "4",
    name: "休眠顧客掘り起こし",
    type: "step",
    channel: "line",
    status: "paused",
    recipients: 89,
    openRate: 32.4,
    clickRate: 8.7,
    createdAt: "2025-01-15",
  },
];

const statusConfig = {
  active: { label: "配信中", variant: "default" as const },
  paused: { label: "一時停止", variant: "secondary" as const },
  draft: { label: "下書き", variant: "outline" as const },
  completed: { label: "完了", variant: "secondary" as const },
};

const typeConfig = {
  step: "ステップ配信",
  broadcast: "一斉配信",
  trigger: "トリガー配信",
};

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCampaigns = sampleCampaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">キャンペーン</h1>
          <p className="text-muted-foreground">
            メール・LINE配信を管理します
          </p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">配信中</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleCampaigns.filter((c) => c.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総配信数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleCampaigns.reduce((sum, c) => sum + c.recipients, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均開封率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                sampleCampaigns.filter((c) => c.openRate > 0).reduce((sum, c) => sum + c.openRate, 0) /
                sampleCampaigns.filter((c) => c.openRate > 0).length
              ).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均クリック率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                sampleCampaigns.filter((c) => c.clickRate > 0).reduce((sum, c) => sum + c.clickRate, 0) /
                sampleCampaigns.filter((c) => c.clickRate > 0).length
              ).toFixed(1)}%
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
                placeholder="キャンペーン名で検索..."
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
                <TableHead>キャンペーン名</TableHead>
                <TableHead>タイプ</TableHead>
                <TableHead>チャネル</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">配信数</TableHead>
                <TableHead className="text-right">開封率</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    キャンペーンが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Link
                        href={"/campaigns/" + campaign.id}
                        className="font-medium hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>{typeConfig[campaign.type as keyof typeof typeConfig]}</TableCell>
                    <TableCell>
                      {campaign.channel === "email" ? (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>メール</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4 text-green-500" />
                          <span>LINE</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[campaign.status as keyof typeof statusConfig].variant}>
                        {statusConfig[campaign.status as keyof typeof statusConfig].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.recipients.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.openRate > 0 ? campaign.openRate + "%" : "-"}
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
                            <Link href={"/campaigns/" + campaign.id}>詳細を表示</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={"/campaigns/" + campaign.id + "/stats"}>統計を見る</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {campaign.status === "active" ? (
                            <DropdownMenuItem>
                              <Pause className="mr-2 h-4 w-4" />
                              一時停止
                            </DropdownMenuItem>
                          ) : campaign.status === "paused" ? (
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              再開
                            </DropdownMenuItem>
                          ) : null}
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
