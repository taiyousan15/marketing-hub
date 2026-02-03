"use client";

import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  BarChart3,
  LineChart,
  PieChart,
  RefreshCw
} from "lucide-react";

interface CustomerPrediction {
  id: string;
  name: string;
  email: string;
  conversionProbability: number;
  churnRisk: number;
  predictedLTV: number;
  bestSendTime: string;
  bestChannel: "email" | "line" | "sms";
  nextBestAction: string;
  segment: string;
}

export default function PredictionsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const customers: CustomerPrediction[] = [
    {
      id: "1",
      name: "田中 太郎",
      email: "tanaka@example.com",
      conversionProbability: 0.89,
      churnRisk: 0.12,
      predictedLTV: 158000,
      bestSendTime: "10:00",
      bestChannel: "email",
      nextBestAction: "プレミアムプランのアップセル提案",
      segment: "VIP"
    },
    {
      id: "2",
      name: "山田 花子",
      email: "yamada@example.com",
      conversionProbability: 0.72,
      churnRisk: 0.35,
      predictedLTV: 89000,
      bestSendTime: "14:00",
      bestChannel: "line",
      nextBestAction: "利用状況確認のフォローアップ",
      segment: "成長中"
    },
    {
      id: "3",
      name: "佐藤 健一",
      email: "sato@example.com",
      conversionProbability: 0.45,
      churnRisk: 0.68,
      predictedLTV: 42000,
      bestSendTime: "18:00",
      bestChannel: "email",
      nextBestAction: "解約防止のための特別オファー",
      segment: "要注意"
    },
    {
      id: "4",
      name: "鈴木 美咲",
      email: "suzuki@example.com",
      conversionProbability: 0.93,
      churnRisk: 0.08,
      predictedLTV: 245000,
      bestSendTime: "09:00",
      bestChannel: "email",
      nextBestAction: "紹介プログラムの案内",
      segment: "VIP"
    },
    {
      id: "5",
      name: "高橋 誠",
      email: "takahashi@example.com",
      conversionProbability: 0.28,
      churnRisk: 0.82,
      predictedLTV: 18000,
      bestSendTime: "12:00",
      bestChannel: "sms",
      nextBestAction: "緊急：パーソナルサポート提供",
      segment: "危険"
    }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const getChannelBadge = (channel: string) => {
    const colors: Record<string, string> = {
      email: "bg-blue-500",
      line: "bg-green-500",
      sms: "bg-purple-500"
    };
    const labels: Record<string, string> = {
      email: "メール",
      line: "LINE",
      sms: "SMS"
    };
    return (
      <Badge className={colors[channel]}>
        {labels[channel]}
      </Badge>
    );
  };

  const getSegmentBadge = (segment: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "VIP": "default",
      "成長中": "secondary",
      "要注意": "outline",
      "危険": "destructive"
    };
    return <Badge variant={variants[segment] || "secondary"}>{segment}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-indigo-500" />
            予測分析ダッシュボード
          </h1>
          <p className="text-muted-foreground mt-1">
            AIが顧客行動を予測し、最適なアクションを提案します
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">過去7日間</SelectItem>
              <SelectItem value="30d">過去30日間</SelectItem>
              <SelectItem value="90d">過去90日間</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            更新
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予測コンバージョン率</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              24.8%
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">+3.2% 前期比</p>
            <Progress value={24.8} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">チャーンリスク顧客</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              127名
              <ArrowDownRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">-15名 前期比</p>
            <Progress value={12.7} className="mt-2 bg-red-100" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予測平均LTV</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              ¥89,500
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">+8.5% 前期比</p>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予測精度</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">過去30日の的中率</p>
            <Progress value={94.2} className="mt-2 bg-green-100" />
          </CardContent>
        </Card>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            顧客予測
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            コンバージョン
          </TabsTrigger>
          <TabsTrigger value="churn" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            チャーン
          </TabsTrigger>
          <TabsTrigger value="ltv" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            LTV予測
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>顧客別予測分析</CardTitle>
              <CardDescription>
                各顧客の行動予測と推奨アクション
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => (
                  <Card key={customer.id} className="border-l-4" style={{
                    borderLeftColor: customer.churnRisk > 0.6 ? '#ef4444' :
                                    customer.churnRisk > 0.3 ? '#f59e0b' : '#22c55e'
                  }}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{customer.name}</h3>
                            {getSegmentBadge(customer.segment)}
                          </div>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getChannelBadge(customer.bestChannel)}
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            {customer.bestSendTime}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">コンバージョン確率</p>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={customer.conversionProbability * 100}
                              className="flex-1"
                            />
                            <span className="text-sm font-medium">
                              {(customer.conversionProbability * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">チャーンリスク</p>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={customer.churnRisk * 100}
                              className={`flex-1 ${customer.churnRisk > 0.5 ? 'bg-red-100' : ''}`}
                            />
                            <span className={`text-sm font-medium ${customer.churnRisk > 0.5 ? 'text-red-500' : ''}`}>
                              {(customer.churnRisk * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">予測LTV</p>
                          <p className="text-lg font-semibold">
                            ¥{customer.predictedLTV.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Zap className="h-4 w-4 text-amber-500" />
                          <span className="text-muted-foreground">推奨アクション:</span>
                          <span className="font-medium">{customer.nextBestAction}</span>
                        </div>
                        <Button size="sm">
                          アクション実行
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  コンバージョン予測トレンド
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground">グラフエリア（Chart.js等で実装）</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  コンバージョン要因分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { factor: "メール開封率", impact: 35, positive: true },
                    { factor: "サイト訪問頻度", impact: 28, positive: true },
                    { factor: "価格感度", impact: 18, positive: false },
                    { factor: "過去購入履歴", impact: 15, positive: true },
                    { factor: "セグメント", impact: 4, positive: true }
                  ].map((item) => (
                    <div key={item.factor} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{item.factor}</span>
                        <span className={`text-sm font-medium ${item.positive ? 'text-green-500' : 'text-red-500'}`}>
                          {item.positive ? '+' : '-'}{item.impact}%
                        </span>
                      </div>
                      <Progress value={item.impact} className={item.positive ? '' : 'bg-red-100'} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="churn" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  高リスク顧客リスト
                </CardTitle>
                <CardDescription>
                  30日以内にチャーンが予測される顧客
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customers
                    .filter(c => c.churnRisk > 0.5)
                    .sort((a, b) => b.churnRisk - a.churnRisk)
                    .map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-500">
                            {(customer.churnRisk * 100).toFixed(0)}%
                          </p>
                          <p className="text-xs text-muted-foreground">リスク</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  チャーン要因分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { factor: "利用頻度の低下", percentage: 42 },
                    { factor: "サポートチケット未解決", percentage: 28 },
                    { factor: "競合サービスへの関心", percentage: 15 },
                    { factor: "支払い遅延", percentage: 10 },
                    { factor: "機能未使用", percentage: 5 }
                  ].map((item) => (
                    <div key={item.factor} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{item.factor}</span>
                        <span className="text-sm font-medium text-red-500">
                          {item.percentage}%
                        </span>
                      </div>
                      <Progress value={item.percentage} className="bg-red-100" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ltv" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>LTVセグメント分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { segment: "プラチナ (¥200k+)", count: 45, color: "bg-purple-500" },
                    { segment: "ゴールド (¥100k-200k)", count: 128, color: "bg-yellow-500" },
                    { segment: "シルバー (¥50k-100k)", count: 342, color: "bg-gray-400" },
                    { segment: "ブロンズ (¥0-50k)", count: 485, color: "bg-orange-500" }
                  ].map((item) => (
                    <div key={item.segment} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm flex-1">{item.segment}</span>
                      <span className="text-sm font-medium">{item.count}名</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>LTV最大化の推奨アクション</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      action: "ゴールド→プラチナ昇格キャンペーン",
                      impact: "+¥8.2M",
                      target: "対象: 32名",
                      priority: "高"
                    },
                    {
                      action: "シルバー向けアップセル提案",
                      impact: "+¥5.1M",
                      target: "対象: 89名",
                      priority: "中"
                    },
                    {
                      action: "ブロンズ層の利用促進",
                      impact: "+¥2.8M",
                      target: "対象: 156名",
                      priority: "中"
                    }
                  ].map((item) => (
                    <div key={item.action} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{item.action}</p>
                        <p className="text-sm text-muted-foreground">{item.target}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-500">{item.impact}</p>
                        <Badge variant={item.priority === "高" ? "default" : "secondary"}>
                          優先度: {item.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
