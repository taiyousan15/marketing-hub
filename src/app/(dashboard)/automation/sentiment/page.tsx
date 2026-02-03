"use client";

import { useState } from "react";
import {
  Smile,
  Meh,
  Frown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Users,
  Bell,
  ArrowRight,
  Activity,
  BarChart3,
  Brain,
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
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

// サンプルデータ
type ChurnRisk = "low" | "medium" | "high";
type Sentiment = "positive" | "neutral" | "negative";

interface AnalysisItem {
  id: string;
  contactName: string;
  message: string;
  sentiment: Sentiment;
  score: number;
  emotions: { type: string; label: string; intensity: number }[];
  churnRisk: ChurnRisk;
  timestamp: string;
  escalation?: boolean;
}

const recentAnalyses: AnalysisItem[] = [
  {
    id: "1",
    contactName: "山田太郎",
    message: "この商品最高です！期待以上でした。",
    sentiment: "positive",
    score: 92,
    emotions: [
      { type: "satisfaction", label: "満足", intensity: 0.9 },
      { type: "joy", label: "喜び", intensity: 0.7 },
    ],
    churnRisk: "low",
    timestamp: "5分前",
  },
  {
    id: "2",
    contactName: "佐藤花子",
    message: "返品したいのですが、手続きがわかりません。",
    sentiment: "negative",
    score: 32,
    emotions: [
      { type: "frustration", label: "不満", intensity: 0.6 },
      { type: "confusion", label: "混乱", intensity: 0.5 },
    ],
    churnRisk: "high",
    timestamp: "12分前",
  },
  {
    id: "3",
    contactName: "鈴木一郎",
    message: "いつ届きますか？",
    sentiment: "neutral",
    score: 48,
    emotions: [{ type: "urgency", label: "緊急性", intensity: 0.4 }],
    churnRisk: "low",
    timestamp: "18分前",
  },
  {
    id: "4",
    contactName: "田中美咲",
    message: "もう解約したいです。対応が遅すぎます。",
    sentiment: "negative",
    score: 15,
    emotions: [
      { type: "anger", label: "怒り", intensity: 0.8 },
      { type: "frustration", label: "不満", intensity: 0.9 },
    ],
    churnRisk: "high",
    escalation: true,
    timestamp: "25分前",
  },
  {
    id: "5",
    contactName: "高橋健太",
    message: "ありがとうございます。とても助かりました！",
    sentiment: "positive",
    score: 88,
    emotions: [
      { type: "gratitude", label: "感謝", intensity: 0.9 },
      { type: "satisfaction", label: "満足", intensity: 0.6 },
    ],
    churnRisk: "low",
    timestamp: "32分前",
  },
];

const sentimentStats = {
  positive: 45,
  neutral: 32,
  negative: 23,
  averageScore: 62,
  trend: "improving" as const,
  alertCount: 5,
};

const emotionDistribution = [
  { emotion: "満足", count: 128, color: "bg-green-500" },
  { emotion: "感謝", count: 95, color: "bg-emerald-500" },
  { emotion: "興味", count: 72, color: "bg-blue-500" },
  { emotion: "不満", count: 45, color: "bg-orange-500" },
  { emotion: "混乱", count: 38, color: "bg-yellow-500" },
  { emotion: "怒り", count: 22, color: "bg-red-500" },
];

export default function SentimentAnalysisPage() {
  const [testMessage, setTestMessage] = useState("");
  const [analysisResult, setAnalysisResult] = useState<{
    sentiment: string;
    score: number;
    emotions: { type: string; label: string; intensity: number }[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTestAnalysis = async () => {
    if (!testMessage.trim()) {
      toast.error("メッセージを入力してください");
      return;
    }

    setIsAnalyzing(true);
    // シミュレーション（実際はAPIコール）
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 簡易分析（デモ用）
    const hasPositive = /ありがとう|嬉しい|最高|素晴らしい|良い/.test(testMessage);
    const hasNegative = /不満|怒|残念|解約|返金|問題/.test(testMessage);

    let sentiment = "neutral";
    let score = 50;

    if (hasPositive && !hasNegative) {
      sentiment = "positive";
      score = 75 + Math.random() * 20;
    } else if (hasNegative && !hasPositive) {
      sentiment = "negative";
      score = 15 + Math.random() * 20;
    }

    setAnalysisResult({
      sentiment,
      score: Math.round(score),
      emotions: hasPositive
        ? [
            { type: "satisfaction", label: "満足", intensity: 0.7 },
            { type: "gratitude", label: "感謝", intensity: 0.5 },
          ]
        : hasNegative
          ? [
              { type: "frustration", label: "不満", intensity: 0.8 },
              { type: "anxiety", label: "不安", intensity: 0.4 },
            ]
          : [{ type: "indifference", label: "無関心", intensity: 0.3 }],
    });

    setIsAnalyzing(false);
    toast.success("分析完了");
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <Smile className="h-5 w-5 text-green-500" />;
      case "negative":
        return <Frown className="h-5 w-5 text-red-500" />;
      default:
        return <Meh className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    if (score >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">感情分析</h1>
        <p className="text-muted-foreground">
          AIがメッセージから感情を分析し、チャーン予兆を検出します
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均スコア</p>
                <p className="text-2xl font-bold">{sentimentStats.averageScore}</p>
              </div>
              <div
                className={
                  "w-12 h-12 rounded-full flex items-center justify-center " +
                  getSentimentColor(sentimentStats.averageScore)
                }
              >
                <span className="text-white font-bold">
                  {sentimentStats.averageScore}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm">
              {getTrendIcon(sentimentStats.trend)}
              <span className="text-green-600">上昇傾向</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ポジティブ</p>
                <p className="text-2xl font-bold text-green-600">
                  {sentimentStats.positive}%
                </p>
              </div>
              <Smile className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={sentimentStats.positive} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ネガティブ</p>
                <p className="text-2xl font-bold text-red-600">
                  {sentimentStats.negative}%
                </p>
              </div>
              <Frown className="h-8 w-8 text-red-500" />
            </div>
            <Progress
              value={sentimentStats.negative}
              className="mt-2 h-2 bg-red-100"
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">要対応アラート</p>
                <p className="text-2xl font-bold text-orange-600">
                  {sentimentStats.alertCount}
                </p>
              </div>
              <div className="relative">
                <Bell className="h-8 w-8 text-orange-500" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                  {sentimentStats.alertCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">
            <Activity className="mr-2 h-4 w-4" />
            リアルタイム分析
          </TabsTrigger>
          <TabsTrigger value="test">
            <Brain className="mr-2 h-4 w-4" />
            テスト分析
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <BarChart3 className="mr-2 h-4 w-4" />
            感情分布
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-4">
          {recentAnalyses.map((analysis) => (
            <Card
              key={analysis.id}
              className={
                analysis.escalation ? "border-red-300 bg-red-50/50" : ""
              }
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* スコア */}
                    <div className="flex flex-col items-center">
                      <div
                        className={
                          "w-14 h-14 rounded-full flex items-center justify-center text-white font-bold " +
                          getSentimentColor(analysis.score)
                        }
                      >
                        {analysis.score}
                      </div>
                      <div className="mt-1">
                        {getSentimentIcon(analysis.sentiment)}
                      </div>
                    </div>

                    {/* 詳細 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{analysis.contactName}</p>
                        <Badge variant="outline" className="text-xs">
                          {analysis.timestamp}
                        </Badge>
                        {analysis.escalation && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            要エスカレーション
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        「{analysis.message}」
                      </p>

                      {/* 感情タグ */}
                      <div className="flex flex-wrap gap-1">
                        {analysis.emotions.map((emotion, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {emotion.label} ({Math.round(emotion.intensity * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* チャーンリスク */}
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">
                      チャーンリスク
                    </p>
                    <Badge
                      variant={
                        analysis.churnRisk === "high"
                          ? "destructive"
                          : analysis.churnRisk === "low"
                            ? "secondary"
                            : "default"
                      }
                    >
                      {analysis.churnRisk === "high"
                        ? "高"
                        : analysis.churnRisk === "low"
                          ? "低"
                          : "中"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>テスト分析</CardTitle>
              <CardDescription>
                任意のメッセージを入力して感情分析をテストできます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="分析したいメッセージを入力してください..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
              />
              <Button onClick={handleTestAnalysis} disabled={isAnalyzing}>
                <Brain className="mr-2 h-4 w-4" />
                {isAnalyzing ? "分析中..." : "分析する"}
              </Button>

              {analysisResult && (
                <div className="mt-4 p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={
                        "w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl " +
                        getSentimentColor(analysisResult.score)
                      }
                    >
                      {analysisResult.score}
                    </div>
                    <div>
                      <p className="font-medium text-lg">
                        {analysisResult.sentiment === "positive"
                          ? "ポジティブ"
                          : analysisResult.sentiment === "negative"
                            ? "ネガティブ"
                            : "ニュートラル"}
                      </p>
                      <div className="flex items-center gap-1">
                        {getSentimentIcon(analysisResult.sentiment)}
                        <span className="text-sm text-muted-foreground">
                          スコア: {analysisResult.score}/100
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">検出された感情:</p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.emotions.map((emotion, i) => (
                        <Badge key={i} variant="outline">
                          {emotion.label}: {Math.round(emotion.intensity * 100)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>感情分布（過去30日間）</CardTitle>
              <CardDescription>
                検出された感情の種類と頻度
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emotionDistribution.map((item) => (
                <div key={item.emotion} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.emotion}</span>
                    <span className="font-medium">{item.count}件</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={"h-full " + item.color}
                      style={{
                        width: `${(item.count / emotionDistribution[0].count) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">チャーン予兆検出</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>解約・退会の意向</span>
                    </div>
                    <Badge variant="destructive">12件</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>サポート不満</span>
                    </div>
                    <Badge className="bg-orange-500">8件</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>価格への懸念</span>
                    </div>
                    <Badge className="bg-yellow-500">15件</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">推奨アクション</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm">高リスク顧客への対応</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      12件の解約意向を検出。リテンションオファーを推奨。
                    </p>
                    <Button size="sm" className="mt-2">
                      オファー作成
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg border">
                    <p className="font-medium text-sm">サポート品質改善</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      対応遅延への不満が増加。プロセス見直しを推奨。
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      詳細を見る
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
