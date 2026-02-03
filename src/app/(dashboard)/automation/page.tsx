"use client";

import { useState } from "react";
import {
  Workflow,
  Play,
  Pause,
  Plus,
  Settings,
  BarChart3,
  Users,
  Zap,
  Brain,
  GitBranch,
  Mail,
  MessageSquare,
  ArrowRight,
  Clock,
  Target,
  TrendingUp,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";

// サンプルデータ
const automationRules = [
  {
    id: "1",
    name: "新規登録ウェルカムシーケンス",
    description: "LINE友達追加後の自動ウェルカムメッセージ",
    trigger: "LINE_FRIEND_ADDED",
    isActive: true,
    aiEnabled: true,
    stats: {
      triggered: 1250,
      completed: 1180,
      converted: 245,
    },
  },
  {
    id: "2",
    name: "カート放棄リマインダー",
    description: "カート放棄から1時間後に自動リマインド",
    trigger: "CART_ABANDONED",
    isActive: true,
    aiEnabled: true,
    stats: {
      triggered: 450,
      completed: 380,
      converted: 95,
    },
  },
  {
    id: "3",
    name: "購入後フォローアップ",
    description: "購入完了後のサンクスメッセージとクロスセル",
    trigger: "PURCHASE_COMPLETED",
    isActive: false,
    aiEnabled: false,
    stats: {
      triggered: 890,
      completed: 850,
      converted: 120,
    },
  },
  {
    id: "4",
    name: "休眠顧客リエンゲージメント",
    description: "30日間非アクティブな顧客への復帰施策",
    trigger: "INACTIVE_DAYS",
    isActive: true,
    aiEnabled: true,
    stats: {
      triggered: 320,
      completed: 280,
      converted: 45,
    },
  },
];

const segmentData = [
  { name: "チャンピオン", count: 125, color: "bg-green-500", percentage: 8 },
  { name: "ロイヤル顧客", count: 340, color: "bg-emerald-500", percentage: 22 },
  { name: "新規顧客", count: 280, color: "bg-blue-500", percentage: 18 },
  { name: "有望顧客", count: 210, color: "bg-cyan-500", percentage: 14 },
  { name: "要注意", count: 180, color: "bg-yellow-500", percentage: 12 },
  { name: "リスク顧客", count: 150, color: "bg-orange-500", percentage: 10 },
  { name: "休眠顧客", count: 250, color: "bg-gray-500", percentage: 16 },
];

const recentTriggers = [
  {
    id: "1",
    contact: "山田太郎",
    trigger: "商品ページ閲覧",
    action: "ナーチャリングシーケンス開始",
    time: "2分前",
    aiDecision: true,
  },
  {
    id: "2",
    contact: "佐藤花子",
    trigger: "カート放棄",
    action: "リマインドメッセージ送信",
    time: "5分前",
    aiDecision: true,
  },
  {
    id: "3",
    contact: "鈴木一郎",
    trigger: "購入完了",
    action: "サンクスメール送信",
    time: "12分前",
    aiDecision: false,
  },
  {
    id: "4",
    contact: "田中美咲",
    trigger: "スコア変更",
    action: "VIPシーケンスに分岐",
    time: "18分前",
    aiDecision: true,
  },
];

export default function AutomationPage() {
  const [rules, setRules] = useState(automationRules);

  const toggleRule = (id: string) => {
    setRules(
      rules.map((rule) =>
        rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
    toast.success("自動化ルールを更新しました");
  };

  const totalTriggered = rules.reduce((sum, r) => sum + r.stats.triggered, 0);
  const totalConverted = rules.reduce((sum, r) => sum + r.stats.converted, 0);
  const conversionRate = totalTriggered > 0 ? ((totalConverted / totalTriggered) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI自動化</h1>
          <p className="text-muted-foreground">
            トリガーベースの自動メッセージ配信とAI分岐
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          新規ワークフロー
        </Button>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              アクティブルール
            </CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules.filter((r) => r.isActive).length}
              <span className="text-base font-normal text-muted-foreground">
                /{rules.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {rules.filter((r) => r.aiEnabled).length}件がAI有効
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              トリガー実行数
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTriggered.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">過去30日間</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              コンバージョン率
            </CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalConverted.toLocaleString()}件のコンバージョン
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              AI判断精度
            </CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">過去7日間の平均</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows">
            <Workflow className="mr-2 h-4 w-4" />
            ワークフロー
          </TabsTrigger>
          <TabsTrigger value="segments">
            <Users className="mr-2 h-4 w-4" />
            セグメント
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            アクティビティ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={
                        "p-2 rounded-lg " +
                        (rule.isActive ? "bg-green-100" : "bg-gray-100")
                      }
                    >
                      <Workflow
                        className={
                          "h-5 w-5 " +
                          (rule.isActive ? "text-green-600" : "text-gray-400")
                        }
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {rule.name}
                        </CardTitle>
                        {rule.aiEnabled && (
                          <Badge
                            variant="secondary"
                            className="bg-purple-100 text-purple-700"
                          >
                            <Brain className="mr-1 h-3 w-3" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {rule.isActive ? (
                        <Play className="h-4 w-4 text-green-500" />
                      ) : (
                        <Pause className="h-4 w-4 text-gray-400" />
                      )}
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{rule.trigger}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <GitBranch className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">分岐処理</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    <Mail className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="ml-auto flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">実行: </span>
                      <span className="font-medium">
                        {rule.stats.triggered.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">完了: </span>
                      <span className="font-medium">
                        {rule.stats.completed.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">CV: </span>
                      <span className="font-medium text-green-600">
                        {rule.stats.converted.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RFMセグメント分布</CardTitle>
              <CardDescription>
                顧客をRecency（最終購入日）、Frequency（頻度）、Monetary（金額）で分類
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {segmentData.map((segment) => (
                <div key={segment.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={"w-3 h-3 rounded-full " + segment.color}
                      />
                      <span>{segment.name}</span>
                    </div>
                    <span className="font-medium">
                      {segment.count.toLocaleString()}人 ({segment.percentage}%)
                    </span>
                  </div>
                  <Progress value={segment.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  セグメント別推奨アクション
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-green-800">チャンピオン</p>
                    <p className="text-sm text-green-600">
                      VIP特典提供、アンバサダープログラム案内
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50">
                  <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500" />
                  <div>
                    <p className="font-medium text-yellow-800">要注意顧客</p>
                    <p className="text-sm text-yellow-600">
                      パーソナライズドオファー、アンケート送付
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
                  <div className="w-2 h-2 mt-2 rounded-full bg-red-500" />
                  <div>
                    <p className="font-medium text-red-800">リスク顧客</p>
                    <p className="text-sm text-red-600">
                      緊急リテンションオファー、個別フォローアップ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">AI分岐の効果</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    AI分岐 vs 固定分岐
                  </span>
                  <Badge className="bg-green-100 text-green-700">
                    +23% CV率
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>AI分岐</span>
                    <span className="font-medium">18.5%</span>
                  </div>
                  <Progress value={18.5} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>固定分岐</span>
                    <span className="font-medium">15.0%</span>
                  </div>
                  <Progress value={15} className="h-2 bg-gray-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>リアルタイムトリガー</CardTitle>
              <CardDescription>
                直近のトリガー発火とAI判断のログ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTriggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium">{trigger.contact}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {trigger.trigger}
                          </Badge>
                          <ArrowRight className="h-3 w-3" />
                          <span>{trigger.action}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {trigger.aiDecision && (
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-700"
                        >
                          <Brain className="mr-1 h-3 w-3" />
                          AI判断
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {trigger.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>今日のサマリー</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <p className="text-3xl font-bold text-blue-600">847</p>
                  <p className="text-sm text-blue-800">トリガー発火</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <p className="text-3xl font-bold text-green-600">156</p>
                  <p className="text-sm text-green-800">コンバージョン</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50">
                  <p className="text-3xl font-bold text-purple-600">623</p>
                  <p className="text-sm text-purple-800">AI判断</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
