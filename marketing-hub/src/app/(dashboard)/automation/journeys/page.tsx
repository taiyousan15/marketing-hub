"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Route,
  Plus,
  Play,
  Pause,
  Settings,
  Users,
  Mail,
  Clock,
  GitBranch,
  Zap,
  Target,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MoreVertical,
  Copy,
  Trash2,
  Eye,
  Timer,
  Brain,
  Filter,
  Webhook,
  RefreshCw,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

type JourneyStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
type NodeType = "TRIGGER" | "ACTION" | "CONDITION" | "DELAY" | "AI_DECISION";

interface JourneyNode {
  id: string;
  type: NodeType;
  title: string;
  description?: string;
  config?: Record<string, unknown>;
  position: { x: number; y: number };
  connections: string[];
}

interface Journey {
  id: string;
  name: string;
  description: string | null;
  status: JourneyStatus;
  triggerType: string;
  nodes: JourneyNode[];
  stats: {
    enrolled: number;
    completed: number;
    active: number;
    conversionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newJourneyName, setNewJourneyName] = useState("");
  const [newJourneyDescription, setNewJourneyDescription] = useState("");
  const [newJourneyTrigger, setNewJourneyTrigger] = useState("signup");

  const fetchJourneys = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/journeys");
      if (!response.ok) throw new Error("Failed to fetch journeys");
      const data = await response.json();
      setJourneys(data.journeys);
    } catch (error) {
      console.error("Failed to fetch journeys:", error);
      toast.error("ジャーニーの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJourneys();
  }, [fetchJourneys]);

  const handleCreateJourney = async () => {
    if (!newJourneyName.trim()) {
      toast.error("ジャーニー名を入力してください");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newJourneyName,
          description: newJourneyDescription || null,
          triggerType: newJourneyTrigger,
          nodes: [
            {
              type: "TRIGGER",
              title: getTriggerLabel(newJourneyTrigger),
              position: { x: 0, y: 0 },
              connections: [],
              order: 0,
            },
          ],
        }),
      });

      if (!response.ok) throw new Error("Failed to create journey");

      toast.success("ジャーニーを作成しました");
      setIsCreateDialogOpen(false);
      setNewJourneyName("");
      setNewJourneyDescription("");
      setNewJourneyTrigger("signup");
      fetchJourneys();
    } catch (error) {
      console.error("Failed to create journey:", error);
      toast.error("ジャーニーの作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (journeyId: string) => {
    try {
      const response = await fetch(`/api/journeys/${journeyId}/activate`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to activate");
      }

      toast.success("ジャーニーを有効化しました");
      fetchJourneys();
    } catch (error) {
      console.error("Failed to activate journey:", error);
      toast.error(error instanceof Error ? error.message : "有効化に失敗しました");
    }
  };

  const handlePause = async (journeyId: string) => {
    try {
      const response = await fetch(`/api/journeys/${journeyId}/pause`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to pause");
      }

      toast.success("ジャーニーを一時停止しました");
      fetchJourneys();
    } catch (error) {
      console.error("Failed to pause journey:", error);
      toast.error(error instanceof Error ? error.message : "一時停止に失敗しました");
    }
  };

  const handleDelete = async (journeyId: string) => {
    if (!confirm("本当にこのジャーニーを削除しますか？")) return;

    try {
      const response = await fetch(`/api/journeys/${journeyId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("ジャーニーを削除しました");
      fetchJourneys();
    } catch (error) {
      console.error("Failed to delete journey:", error);
      toast.error(error instanceof Error ? error.message : "削除に失敗しました");
    }
  };

  const handleDuplicate = async (journey: Journey) => {
    try {
      const response = await fetch("/api/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${journey.name} (コピー)`,
          description: journey.description,
          triggerType: journey.triggerType,
          nodes: journey.nodes.map((node) => ({
            type: node.type,
            title: node.title,
            description: node.description,
            config: node.config,
            position: node.position,
            connections: node.connections,
          })),
        }),
      });

      if (!response.ok) throw new Error("Failed to duplicate journey");

      toast.success("ジャーニーを複製しました");
      fetchJourneys();
    } catch (error) {
      console.error("Failed to duplicate journey:", error);
      toast.error("複製に失敗しました");
    }
  };

  const getStatusBadge = (status: JourneyStatus) => {
    const config: Record<JourneyStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      DRAFT: { label: "下書き", variant: "outline" },
      ACTIVE: { label: "稼働中", variant: "default" },
      PAUSED: { label: "一時停止", variant: "secondary" },
      ARCHIVED: { label: "アーカイブ", variant: "outline" }
    };
    const { label, variant } = config[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTriggerIcon = (triggerType: string) => {
    const icons: Record<string, React.ReactNode> = {
      signup: <Users className="h-4 w-4" />,
      purchase: <Target className="h-4 w-4" />,
      cart_abandon: <XCircle className="h-4 w-4" />,
      inactivity: <Clock className="h-4 w-4" />,
      tag_added: <Filter className="h-4 w-4" />,
      webhook: <Webhook className="h-4 w-4" />
    };
    return icons[triggerType] || <Zap className="h-4 w-4" />;
  };

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      signup: "新規登録",
      purchase: "購入完了",
      cart_abandon: "カート放棄",
      inactivity: "非アクティブ",
      tag_added: "タグ追加",
      webhook: "Webhook"
    };
    return labels[triggerType] || triggerType;
  };

  const getNodeIcon = (type: NodeType) => {
    const icons: Record<NodeType, React.ReactNode> = {
      TRIGGER: <Zap className="h-4 w-4" />,
      ACTION: <Mail className="h-4 w-4" />,
      CONDITION: <GitBranch className="h-4 w-4" />,
      DELAY: <Timer className="h-4 w-4" />,
      AI_DECISION: <Brain className="h-4 w-4" />
    };
    return icons[type];
  };

  const activeJourneys = journeys.filter(j => j.status === "ACTIVE");
  const draftJourneys = journeys.filter(j => j.status === "DRAFT");
  const pausedJourneys = journeys.filter(j => j.status === "PAUSED");

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Route className="h-8 w-8 text-blue-500" />
            ジャーニービルダー
          </h1>
          <p className="text-muted-foreground mt-1">
            カスタマージャーニーを視覚的に設計・管理
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchJourneys}>
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新規ジャーニー作成
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>新規ジャーニー作成</DialogTitle>
                <DialogDescription>
                  ジャーニーの基本情報を入力してください
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>ジャーニー名</Label>
                  <Input
                    placeholder="例: ウェルカムシーケンス"
                    value={newJourneyName}
                    onChange={(e) => setNewJourneyName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>説明</Label>
                  <Input
                    placeholder="このジャーニーの目的を簡潔に"
                    value={newJourneyDescription}
                    onChange={(e) => setNewJourneyDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>トリガータイプ</Label>
                  <Select value={newJourneyTrigger} onValueChange={setNewJourneyTrigger}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signup">新規登録</SelectItem>
                      <SelectItem value="purchase">購入完了</SelectItem>
                      <SelectItem value="cart_abandon">カート放棄</SelectItem>
                      <SelectItem value="inactivity">非アクティブ</SelectItem>
                      <SelectItem value="tag_added">タグ追加</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleCreateJourney} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  作成
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 統計サマリー */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブジャーニー</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJourneys.length}</div>
            <p className="text-xs text-muted-foreground">稼働中のジャーニー数</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総エンロール数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {journeys.reduce((sum, j) => sum + (j.stats?.enrolled || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">全ジャーニーの参加者</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均完了率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {journeys.length > 0
                ? (journeys.reduce((sum, j) => {
                    const enrolled = j.stats?.enrolled || 0;
                    const completed = j.stats?.completed || 0;
                    return sum + (enrolled > 0 ? (completed / enrolled) * 100 : 0);
                  }, 0) / journeys.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">ジャーニー完走率</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均コンバージョン</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {journeys.length > 0
                ? (journeys.reduce((sum, j) => sum + (j.stats?.conversionRate || 0), 0) / journeys.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">目標達成率</p>
          </CardContent>
        </Card>
      </div>

      {/* ジャーニー一覧 */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">すべて ({journeys.length})</TabsTrigger>
          <TabsTrigger value="active">稼働中 ({activeJourneys.length})</TabsTrigger>
          <TabsTrigger value="draft">下書き ({draftJourneys.length})</TabsTrigger>
          <TabsTrigger value="paused">一時停止 ({pausedJourneys.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : journeys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Route className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">ジャーニーがありません</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  新規ジャーニー作成
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {journeys.map((journey) => (
                <Card key={journey.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {journey.name}
                          {getStatusBadge(journey.status)}
                        </CardTitle>
                        <CardDescription>{journey.description || "説明なし"}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* トリガー情報 */}
                    <div className="flex items-center gap-2 mb-4 p-2 bg-muted rounded-lg">
                      {getTriggerIcon(journey.triggerType)}
                      <span className="text-sm font-medium">
                        トリガー: {getTriggerLabel(journey.triggerType)}
                      </span>
                    </div>

                    {/* フロー可視化 */}
                    <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
                      {journey.nodes.slice(0, 5).map((node, index) => (
                        <div key={node.id} className="flex items-center">
                          <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs whitespace-nowrap">
                            {getNodeIcon(node.type)}
                            <span>{node.title}</span>
                          </div>
                          {index < Math.min(journey.nodes.length - 1, 4) && (
                            <ArrowRight className="h-3 w-3 text-muted-foreground mx-1 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                      {journey.nodes.length > 5 && (
                        <span className="text-xs text-muted-foreground">+{journey.nodes.length - 5}...</span>
                      )}
                    </div>

                    {/* 統計 */}
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">登録</p>
                        <p className="font-bold">{journey.stats?.enrolled || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">進行中</p>
                        <p className="font-bold">{journey.stats?.active || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">完了</p>
                        <p className="font-bold">{journey.stats?.completed || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">CVR</p>
                        <p className="font-bold text-green-500">{journey.stats?.conversionRate || 0}%</p>
                      </div>
                    </div>

                    {/* アクション */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          プレビュー
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicate(journey)}>
                          <Copy className="h-4 w-4 mr-1" />
                          複製
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        {journey.status === "ACTIVE" ? (
                          <Button variant="outline" size="sm" onClick={() => handlePause(journey.id)}>
                            <Pause className="h-4 w-4 mr-1" />
                            停止
                          </Button>
                        ) : journey.status === "PAUSED" || journey.status === "DRAFT" ? (
                          <Button variant="outline" size="sm" onClick={() => handleActivate(journey.id)}>
                            <Play className="h-4 w-4 mr-1" />
                            {journey.status === "PAUSED" ? "再開" : "有効化"}
                          </Button>
                        ) : null}
                        <Button size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          編集
                        </Button>
                        {journey.status !== "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => handleDelete(journey.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {activeJourneys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Play className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">稼働中のジャーニーはありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeJourneys.map((journey) => (
                <Card key={journey.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {journey.name}
                      <Badge className="bg-green-500">稼働中</Badge>
                    </CardTitle>
                    <CardDescription>{journey.description || "説明なし"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">登録</p>
                        <p className="font-bold">{journey.stats?.enrolled || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">進行中</p>
                        <p className="font-bold">{journey.stats?.active || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">完了</p>
                        <p className="font-bold">{journey.stats?.completed || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">CVR</p>
                        <p className="font-bold text-green-500">{journey.stats?.conversionRate || 0}%</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handlePause(journey.id)}>
                        <Pause className="h-4 w-4 mr-1" />
                        停止
                      </Button>
                      <Button size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        編集
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          {draftJourneys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Route className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">下書きのジャーニーはありません</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  新規ジャーニー作成
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {draftJourneys.map((journey) => (
                <Card key={journey.id} className="border-l-4 border-l-gray-400">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {journey.name}
                      <Badge variant="outline">下書き</Badge>
                    </CardTitle>
                    <CardDescription>{journey.description || "説明なし"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleActivate(journey.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        有効化
                      </Button>
                      <Button size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        編集
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => handleDelete(journey.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          {pausedJourneys.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pause className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">一時停止中のジャーニーはありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pausedJourneys.map((journey) => (
                <Card key={journey.id} className="border-l-4 border-l-yellow-500 opacity-75">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {journey.name}
                      <Badge variant="secondary">一時停止</Badge>
                    </CardTitle>
                    <CardDescription>{journey.description || "説明なし"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleActivate(journey.id)}>
                        <Play className="h-4 w-4 mr-1" />
                        再開
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(journey.id)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        削除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* クイックテンプレート */}
      <Card>
        <CardHeader>
          <CardTitle>クイックスタートテンプレート</CardTitle>
          <CardDescription>
            よく使われるジャーニーテンプレートから始める
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[
              { name: "ウェルカム", icon: "👋", description: "新規登録者向け", trigger: "signup" },
              { name: "ナーチャリング", icon: "🌱", description: "リード育成", trigger: "tag_added" },
              { name: "カート放棄", icon: "🛒", description: "離脱防止", trigger: "cart_abandon" },
              { name: "休眠復活", icon: "⏰", description: "再活性化", trigger: "inactivity" },
              { name: "アップセル", icon: "📈", description: "顧客単価向上", trigger: "purchase" },
              { name: "誕生日", icon: "🎂", description: "特別オファー", trigger: "tag_added" }
            ].map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => {
                  setNewJourneyName(template.name + "ジャーニー");
                  setNewJourneyTrigger(template.trigger);
                  setIsCreateDialogOpen(true);
                }}
              >
                <span className="text-2xl">{template.icon}</span>
                <span className="text-sm font-medium">{template.name}</span>
                <span className="text-xs text-muted-foreground">{template.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
