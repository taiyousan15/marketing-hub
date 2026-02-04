"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Edit,
  Trash2,
  Eye,
  Settings,
  BarChart3,
  Globe,
  GlobeLock,
  Loader2,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface FunnelStep {
  id: string;
  name: string;
  type: string;
  order: number;
  page: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface Funnel {
  id: string;
  name: string;
  type: string;
  status: string;
  domain: string | null;
  settings: Record<string, unknown>;
  pages: Array<{
    id: string;
    name: string;
    slug: string;
    order: number;
  }>;
  steps: FunnelStep[];
}

const stepTypeLabels: Record<string, string> = {
  OPTIN: "オプトイン",
  SALES: "セールス",
  ORDER_FORM: "注文フォーム",
  UPSELL: "アップセル",
  DOWNSELL: "ダウンセル",
  THANK_YOU: "サンキュー",
  WEBINAR: "ウェビナー",
  REPLAY: "リプレイ",
  CONFIRMATION: "確認",
  CONTENT: "コンテンツ",
  LANDING: "ランディング",
  APPLICATION_FORM: "申込みフォーム",
  MEMBERSHIP_ACCESS: "会員アクセス",
};

export default function FunnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDomain, setEditedDomain] = useState("");

  useEffect(() => {
    fetchFunnel();
  }, [id]);

  const fetchFunnel = async () => {
    try {
      const res = await fetch(`/api/funnels/${id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setFunnel(data.funnel);
      setEditedName(data.funnel.name);
      setEditedDomain(data.funnel.domain || "");
    } catch (error) {
      toast.error("ファネルの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!funnel) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/funnels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedName,
          domain: editedDomain || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("保存しました");
      fetchFunnel();
    } catch (error) {
      toast.error("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!funnel) return;

    const newStatus = funnel.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/funnels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success(newStatus === "PUBLISHED" ? "公開しました" : "非公開にしました");
      fetchFunnel();
    } catch (error) {
      toast.error("ステータス変更に失敗しました");
    }
  };

  const addStep = async () => {
    try {
      const res = await fetch(`/api/funnels/${id}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "新規ステップ",
          type: "LANDING",
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("ステップを追加しました");
      fetchFunnel();
    } catch (error) {
      toast.error("追加に失敗しました");
    }
  };

  const createPageForStep = async (step: FunnelStep) => {
    try {
      const res = await fetch(`/api/funnels/${id}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: step.name,
          stepId: step.id,
          stepType: step.type,
        }),
      });

      if (!res.ok) throw new Error("Failed to create page");

      const data = await res.json();
      toast.success("ページを作成しました");

      // 作成したページの編集画面に遷移
      router.push(`/funnels/${id}/pages/${data.page.id}`);
    } catch (error) {
      toast.error("ページ作成に失敗しました");
    }
  };

  const deleteStep = async (stepId: string) => {
    if (!confirm("このステップを削除しますか？")) return;

    try {
      const res = await fetch(`/api/funnels/${id}/steps/${stepId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("ステップを削除しました");
      fetchFunnel();
    } catch (error) {
      toast.error("削除に失敗しました");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!funnel) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">ファネルが見つかりません</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/funnels">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{funnel.name}</h1>
              {funnel.status === "PUBLISHED" ? (
                <Badge variant="default">
                  <Globe className="mr-1 h-3 w-3" />
                  公開中
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <GlobeLock className="mr-1 h-3 w-3" />
                  下書き
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {funnel.steps.length}ステップ・{funnel.pages.length}ページ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/funnels/${id}/builder`}>
              <Edit className="mr-2 h-4 w-4" />
              ビルダー
            </Link>
          </Button>
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            プレビュー
          </Button>
          <Button onClick={handlePublish}>
            {funnel.status === "PUBLISHED" ? "非公開にする" : "公開する"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="steps">
        <TabsList>
          <TabsTrigger value="steps">ステップ</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
        </TabsList>

        {/* ステップタブ */}
        <TabsContent value="steps" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ファネルステップ</CardTitle>
                  <CardDescription>
                    ユーザーが通過するステップを設定します
                  </CardDescription>
                </div>
                <Button onClick={addStep}>
                  <Plus className="mr-2 h-4 w-4" />
                  ステップ追加
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {funnel.steps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>ステップがありません</p>
                  <Button className="mt-4" onClick={addStep}>
                    <Plus className="mr-2 h-4 w-4" />
                    最初のステップを追加
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {funnel.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {stepTypeLabels[step.type] || step.type}
                          {step.page && ` • ${step.page.name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {step.page ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/funnels/${id}/pages/${step.page.id}`}>
                              <Edit className="mr-2 h-3 w-3" />
                              編集
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => createPageForStep(step)}
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            ページ作成
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteStep(step.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ファネルフロー可視化 */}
          <Card>
            <CardHeader>
              <CardTitle>ファネルフロー</CardTitle>
              <CardDescription>
                ユーザーの流れを視覚的に確認できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 overflow-x-auto py-4">
                {funnel.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className="w-32 p-3 border rounded-lg text-center bg-background">
                        <p className="text-xs text-muted-foreground">
                          Step {index + 1}
                        </p>
                        <p className="font-medium text-sm truncate">{step.name}</p>
                      </div>
                    </div>
                    {index < funnel.steps.length - 1 && (
                      <div className="w-8 h-px bg-border mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 設定タブ */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>基本設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ファネル名</Label>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>カスタムドメイン</Label>
                <Input
                  value={editedDomain}
                  onChange={(e) => setEditedDomain(e.target.value)}
                  placeholder="例: lp.example.com"
                />
                <p className="text-xs text-muted-foreground">
                  カスタムドメインを設定するにはDNS設定が必要です
                </p>
              </div>

              <div className="space-y-2">
                <Label>ファネルタイプ</Label>
                <Select value={funnel.type} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPTIN">オプトイン</SelectItem>
                    <SelectItem value="SALES">セールス</SelectItem>
                    <SelectItem value="WEBINAR">ウェビナー</SelectItem>
                    <SelectItem value="PRODUCT_LAUNCH">プロダクトローンチ</SelectItem>
                    <SelectItem value="TRIPWIRE">トリップワイヤー</SelectItem>
                    <SelectItem value="MEMBERSHIP">会員登録</SelectItem>
                    <SelectItem value="APPLICATION">申込み</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "保存中..." : "保存"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 分析タブ */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">総訪問者</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">コンバージョン</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">CVR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">0%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">売上</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">¥0</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ステップ別分析</CardTitle>
              <CardDescription>
                各ステップの離脱率とコンバージョンを確認
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>まだデータがありません</p>
                <p className="text-sm">ファネルを公開するとデータが表示されます</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
