"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Pause,
  Save,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { StepBuilder } from "@/components/campaigns/step-builder";
import { useTenant } from "@/hooks/use-tenant";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Campaign, CampaignFormData, StepFormData, CampaignStep } from "@/types/campaign";

interface CampaignExecution {
  id: string;
  stepId: string;
  contactId: string;
  channel: string;
  status: string;
  sentAt: string | null;
  error: string | null;
  createdAt: string;
  contact: { id: string; name: string | null; email: string };
}

const statusConfig = {
  DRAFT: { label: "下書き", variant: "outline" as const },
  ACTIVE: { label: "配信中", variant: "default" as const },
  PAUSED: { label: "一時停止", variant: "secondary" as const },
  COMPLETED: { label: "完了", variant: "secondary" as const },
  ARCHIVED: { label: "アーカイブ", variant: "secondary" as const },
};

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const { tenantId, loading: tenantLoading } = useTenant();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [executions, setExecutions] = useState<CampaignExecution[]>([]);
  const [executionsLoading, setExecutionsLoading] = useState(false);

  const fetchCampaign = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}?tenantId=${tenantId || ""}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
      }
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
    } finally {
      setLoading(false);
    }
  }, [campaignId, tenantId]);

  const fetchExecutions = useCallback(async () => {
    if (!campaignId) return;
    setExecutionsLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/executions`);
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.executions ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch executions:", error);
    } finally {
      setExecutionsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId, fetchCampaign]);

  const handleUpdateCampaign = async (data: CampaignFormData) => {
    if (!campaign) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const { campaign: updated } = await res.json();
        setCampaign(updated);
      } else {
        const error = await res.json();
        alert(error.error || "更新に失敗しました");
      }
    } catch (error) {
      console.error("Failed to update campaign:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: "ACTIVE" | "PAUSED") => {
    if (!campaign) return;

    // ステップがない場合は有効化不可
    if (newStatus === "ACTIVE" && (!campaign.steps || campaign.steps.length === 0)) {
      alert("ステップが1つ以上必要です");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const { campaign: updated } = await res.json();
        setCampaign(updated);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = async (data: StepFormData) => {
    if (!campaign) return;

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        fetchCampaign();
      } else {
        const error = await res.json();
        alert(error.error || "追加に失敗しました");
      }
    } catch (error) {
      console.error("Failed to add step:", error);
    }
  };

  const handleUpdateStep = async (stepId: string, data: StepFormData) => {
    if (!campaign) return;

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/steps`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, ...data }),
      });

      if (res.ok) {
        fetchCampaign();
      } else {
        const error = await res.json();
        alert(error.error || "更新に失敗しました");
      }
    } catch (error) {
      console.error("Failed to update step:", error);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!campaign) return;

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/steps?stepId=${stepId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchCampaign();
      } else {
        const error = await res.json();
        alert(error.error || "削除に失敗しました");
      }
    } catch (error) {
      console.error("Failed to delete step:", error);
    }
  };

  const handleReorderSteps = async (steps: { id: string; order: number }[]) => {
    if (!campaign) return;

    try {
      await fetch(`/api/campaigns/${campaign.id}/steps`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps }),
      });
      fetchCampaign();
    } catch (error) {
      console.error("Failed to reorder steps:", error);
    }
  };

  if (tenantLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">キャンペーンが見つかりません</p>
        <Button asChild className="mt-4">
          <Link href="/campaigns">一覧に戻る</Link>
        </Button>
      </div>
    );
  }

  const isLine = campaign.type.startsWith("LINE");
  const isStep = campaign.type.includes("STEP");
  const status = statusConfig[campaign.status as keyof typeof statusConfig];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {isLine ? "LINE" : "メール"}
              {isStep ? "ステップ配信" : "一斉配信"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {campaign.status === "DRAFT" || campaign.status === "PAUSED" ? (
            <Button onClick={() => handleStatusChange("ACTIVE")} disabled={saving}>
              <Play className="mr-2 h-4 w-4" />
              有効化
            </Button>
          ) : campaign.status === "ACTIVE" ? (
            <Button variant="secondary" onClick={() => handleStatusChange("PAUSED")} disabled={saving}>
              <Pause className="mr-2 h-4 w-4" />
              一時停止
            </Button>
          ) : null}
        </div>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="steps">
        <TabsList>
          {isStep && <TabsTrigger value="steps">ステップ</TabsTrigger>}
          <TabsTrigger value="executions" onClick={fetchExecutions}>
            <Activity className="mr-2 h-4 w-4" />
            配信ログ
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            設定
          </TabsTrigger>
        </TabsList>

        {isStep && (
          <TabsContent value="steps" className="mt-6">
            <StepBuilder
              campaignId={campaign.id}
              steps={(campaign.steps as CampaignStep[]) || []}
              isLine={isLine}
              onAddStep={handleAddStep}
              onUpdateStep={handleUpdateStep}
              onDeleteStep={handleDeleteStep}
              onReorderSteps={handleReorderSteps}
            />
          </TabsContent>
        )}

        <TabsContent value="executions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">配信ログ</CardTitle>
            </CardHeader>
            <CardContent>
              {executionsLoading ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : executions.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  配信ログはまだありません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>コンタクト</TableHead>
                      <TableHead>チャンネル</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>日時</TableHead>
                      <TableHead>エラー</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.map((exec) => (
                      <TableRow key={exec.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{exec.contact.name ?? "---"}</p>
                            <p className="text-xs text-muted-foreground">{exec.contact.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{exec.channel}</Badge>
                        </TableCell>
                        <TableCell>
                          {exec.status === "SENT" ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>送信済</span>
                            </div>
                          ) : exec.status === "FAILED" ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>失敗</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <Clock className="h-4 w-4" />
                              <span>{exec.status}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {exec.sentAt
                            ? new Date(exec.sentAt).toLocaleString("ja-JP")
                            : new Date(exec.createdAt).toLocaleString("ja-JP")}
                        </TableCell>
                        <TableCell className="text-sm text-red-500 max-w-[200px] truncate">
                          {exec.error ?? "---"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="max-w-2xl">
            <CampaignForm
              campaign={campaign}
              onSubmit={handleUpdateCampaign}
              onCancel={() => router.push("/campaigns")}
              isSubmitting={saving}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
