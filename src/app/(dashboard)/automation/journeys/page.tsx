"use client";

import { useState, useCallback } from "react";
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
  MessageSquare,
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
  Webhook
} from "lucide-react";

type JourneyStatus = "draft" | "active" | "paused" | "completed" | "archived";
type NodeType = "trigger" | "action" | "condition" | "delay" | "ai_decision";

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
  description: string;
  status: JourneyStatus;
  triggerType: string;
  nodes: JourneyNode[];
  stats: {
    enrolled: number;
    completed: number;
    active: number;
    conversionRate: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([
    {
      id: "1",
      name: "ウェルカムジャーニー",
      description: "新規登録者向けのオンボーディングシーケンス",
      status: "active",
      triggerType: "signup",
      nodes: [
        { id: "1", type: "trigger", title: "新規登録", position: { x: 0, y: 0 }, connections: ["2"] },
        { id: "2", type: "action", title: "ウェルカムメール送信", position: { x: 200, y: 0 }, connections: ["3"] },
        { id: "3", type: "delay", title: "3日待機", position: { x: 400, y: 0 }, connections: ["4"] },
        { id: "4", type: "condition", title: "メール開封？", position: { x: 600, y: 0 }, connections: ["5", "6"] },
        { id: "5", type: "action", title: "フォローアップ送信", position: { x: 800, y: -50 }, connections: [] },
        { id: "6", type: "action", title: "リマインダー送信", position: { x: 800, y: 50 }, connections: [] }
      ],
      stats: {
        enrolled: 1250,
        completed: 890,
        active: 360,
        conversionRate: 24.5
      },
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: "2",
      name: "購入後フォローアップ",
      description: "購入完了後のレビュー依頼とクロスセル",
      status: "active",
      triggerType: "purchase",
      nodes: [
        { id: "1", type: "trigger", title: "購入完了", position: { x: 0, y: 0 }, connections: ["2"] },
        { id: "2", type: "delay", title: "7日待機", position: { x: 200, y: 0 }, connections: ["3"] },
        { id: "3", type: "action", title: "レビュー依頼", position: { x: 400, y: 0 }, connections: ["4"] },
        { id: "4", type: "ai_decision", title: "AI: 追加購入可能性判定", position: { x: 600, y: 0 }, connections: ["5", "6"] },
        { id: "5", type: "action", title: "クロスセル提案", position: { x: 800, y: -50 }, connections: [] },
        { id: "6", type: "action", title: "サポート案内", position: { x: 800, y: 50 }, connections: [] }
      ],
      stats: {
        enrolled: 580,
        completed: 420,
        active: 160,
        conversionRate: 18.2
      },
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: "3",
      name: "カート放棄リカバリー",
      description: "カート放棄者への再エンゲージメント",
      status: "active",
      triggerType: "cart_abandon",
      nodes: [
        { id: "1", type: "trigger", title: "カート放棄", position: { x: 0, y: 0 }, connections: ["2"] },
        { id: "2", type: "delay", title: "1時間待機", position: { x: 200, y: 0 }, connections: ["3"] },
        { id: "3", type: "action", title: "リマインドメール", position: { x: 400, y: 0 }, connections: ["4"] },
        { id: "4", type: "condition", title: "購入完了？", position: { x: 600, y: 0 }, connections: ["5", "6"] },
        { id: "5", type: "action", title: "完了（終了）", position: { x: 800, y: -50 }, connections: [] },
        { id: "6", type: "delay", title: "24時間待機", position: { x: 800, y: 50 }, connections: ["7"] },
        { id: "7", type: "action", title: "割引オファー", position: { x: 1000, y: 50 }, connections: [] }
      ],
      stats: {
        enrolled: 320,
        completed: 180,
        active: 140,
        conversionRate: 32.8
      },
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      updatedAt: new Date()
    },
    {
      id: "4",
      name: "休眠顧客リアクティベーション",
      description: "60日以上アクティビティのない顧客への再活性化",
      status: "paused",
      triggerType: "inactivity",
      nodes: [],
      stats: {
        enrolled: 450,
        completed: 280,
        active: 0,
        conversionRate: 12.5
      },
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);

  const getStatusBadge = (status: JourneyStatus) => {
    const config: Record<JourneyStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
      draft: { label: "下書き", variant: "outline", color: "text-gray-500" },
      active: { label: "稼働中", variant: "default", color: "text-green-500" },
      paused: { label: "一時停止", variant: "secondary", color: "text-yellow-500" },
      completed: { label: "完了", variant: "secondary", color: "text-blue-500" },
      archived: { label: "アーカイブ", variant: "outline", color: "text-gray-400" }
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
      trigger: <Zap className="h-4 w-4" />,
      action: <Mail className="h-4 w-4" />,
      condition: <GitBranch className="h-4 w-4" />,
      delay: <Timer className="h-4 w-4" />,
      ai_decision: <Brain className="h-4 w-4" />
    };
    return icons[type];
  };

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
                <Input placeholder="例: ウェルカムシーケンス" />
              </div>
              <div className="space-y-2">
                <Label>説明</Label>
                <Input placeholder="このジャーニーの目的を簡潔に" />
              </div>
              <div className="space-y-2">
                <Label>トリガータイプ</Label>
                <Select defaultValue="signup">
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
              <div className="space-y-2">
                <Label>テンプレートから開始</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="テンプレートを選択（任意）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">ウェルカムシリーズ</SelectItem>
                    <SelectItem value="nurture">リードナーチャリング</SelectItem>
                    <SelectItem value="recovery">カート放棄リカバリー</SelectItem>
                    <SelectItem value="reactivation">休眠顧客復活</SelectItem>
                    <SelectItem value="upsell">アップセル/クロスセル</SelectItem>
                    <SelectItem value="blank">空のキャンバス</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                作成してエディタを開く
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計サマリー */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">アクティブジャーニー</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {journeys.filter(j => j.status === "active").length}
            </div>
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
              {journeys.reduce((sum, j) => sum + j.stats.enrolled, 0).toLocaleString()}
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
              {(journeys.reduce((sum, j) => sum + (j.stats.completed / j.stats.enrolled * 100), 0) / journeys.length).toFixed(1)}%
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
              {(journeys.reduce((sum, j) => sum + j.stats.conversionRate, 0) / journeys.length).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">目標達成率</p>
          </CardContent>
        </Card>
      </div>

      {/* ジャーニー一覧 */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">すべて ({journeys.length})</TabsTrigger>
          <TabsTrigger value="active">
            稼働中 ({journeys.filter(j => j.status === "active").length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            下書き ({journeys.filter(j => j.status === "draft").length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            一時停止 ({journeys.filter(j => j.status === "paused").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
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
                      <CardDescription>{journey.description}</CardDescription>
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

                  {/* フロー可視化（簡易版） */}
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
                      <p className="font-bold">{journey.stats.enrolled}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">進行中</p>
                      <p className="font-bold">{journey.stats.active}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">完了</p>
                      <p className="font-bold">{journey.stats.completed}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">CVR</p>
                      <p className="font-bold text-green-500">{journey.stats.conversionRate}%</p>
                    </div>
                  </div>

                  {/* アクション */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        プレビュー
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4 mr-1" />
                        複製
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {journey.status === "active" ? (
                        <Button variant="outline" size="sm">
                          <Pause className="h-4 w-4 mr-1" />
                          停止
                        </Button>
                      ) : journey.status === "paused" ? (
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          再開
                        </Button>
                      ) : null}
                      <Button size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        編集
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {journeys
              .filter(j => j.status === "active")
              .map((journey) => (
                <Card key={journey.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {journey.name}
                      <Badge className="bg-green-500">稼働中</Badge>
                    </CardTitle>
                    <CardDescription>{journey.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2 text-center text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">登録</p>
                        <p className="font-bold">{journey.stats.enrolled}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">進行中</p>
                        <p className="font-bold">{journey.stats.active}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">完了</p>
                        <p className="font-bold">{journey.stats.completed}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">CVR</p>
                        <p className="font-bold text-green-500">{journey.stats.conversionRate}%</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm">
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
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {journeys
              .filter(j => j.status === "paused")
              .map((journey) => (
                <Card key={journey.id} className="border-l-4 border-l-yellow-500 opacity-75">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {journey.name}
                      <Badge variant="secondary">一時停止</Badge>
                    </CardTitle>
                    <CardDescription>{journey.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        再開
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        <Trash2 className="h-4 w-4 mr-1" />
                        削除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
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
              { name: "ウェルカム", icon: "👋", description: "新規登録者向け" },
              { name: "ナーチャリング", icon: "🌱", description: "リード育成" },
              { name: "カート放棄", icon: "🛒", description: "離脱防止" },
              { name: "休眠復活", icon: "⏰", description: "再活性化" },
              { name: "アップセル", icon: "📈", description: "顧客単価向上" },
              { name: "誕生日", icon: "🎂", description: "特別オファー" }
            ].map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
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
