"use client";

import { useState, useEffect } from "react";
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
  RefreshCw,
  Edit,
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
import { useTenant } from "@/hooks/use-tenant";
import type { Campaign, CampaignStatus, CampaignType } from "@/types/campaign";

const statusConfig: Record<CampaignStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  ACTIVE: { label: "配信中", variant: "default" },
  PAUSED: { label: "一時停止", variant: "secondary" },
  DRAFT: { label: "下書き", variant: "outline" },
  COMPLETED: { label: "完了", variant: "secondary" },
  ARCHIVED: { label: "アーカイブ", variant: "secondary" },
};

const typeConfig: Record<CampaignType, string> = {
  EMAIL_STEP: "メールステップ",
  EMAIL_BROADCAST: "メール一斉配信",
  LINE_STEP: "LINEステップ",
  LINE_BROADCAST: "LINE一斉配信",
  LINE_SEGMENT: "LINEセグメント",
  SMS: "SMS",
};

export default function CampaignsPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (tenantId) {
      fetchCampaigns();
    }
  }, [tenantId]);

  const fetchCampaigns = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns?tenantId=${tenantId}`);
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: CampaignStatus) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("このキャンペーンを削除しますか？")) return;

    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchCampaigns();
      } else {
        const error = await res.json();
        alert(error.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const totalContacts = campaigns.reduce((sum, c) => sum + (c._count?.contacts || 0), 0);

  if (tenantLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
            <CardTitle className="text-sm font-medium">総キャンペーン</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">配信中</CardTitle>
            <Play className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCampaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総配信対象</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">下書き</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter((c) => c.status === "DRAFT").length}
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
            <Button variant="outline" size="sm" onClick={fetchCampaigns}>
              <RefreshCw className="mr-2 h-4 w-4" />
              更新
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
                <TableHead className="text-right">配信対象</TableHead>
                <TableHead className="text-right">ステップ数</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {campaigns.length === 0
                      ? "キャンペーンがありません。「新規作成」から作成してください。"
                      : "検索条件に一致するキャンペーンがありません"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const isLine = campaign.type.startsWith("LINE");
                  const status = statusConfig[campaign.status as CampaignStatus];

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <Link
                          href={`/campaigns/${campaign.id}/edit`}
                          className="font-medium hover:underline"
                        >
                          {campaign.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {typeConfig[campaign.type as CampaignType] || campaign.type}
                      </TableCell>
                      <TableCell>
                        {isLine ? (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-green-500" />
                            <span>LINE</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>メール</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign._count?.contacts?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.steps?.length || 0}
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
                              <Link href={`/campaigns/${campaign.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                編集
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {campaign.status === "ACTIVE" ? (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(campaign.id, "PAUSED")}
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                一時停止
                              </DropdownMenuItem>
                            ) : campaign.status === "PAUSED" || campaign.status === "DRAFT" ? (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(campaign.id, "ACTIVE")}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                有効化
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(campaign.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              削除
                            </DropdownMenuItem>
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
    </div>
  );
}
