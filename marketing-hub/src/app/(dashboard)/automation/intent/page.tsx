"use client";

import { useState } from "react";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Target,
  ShoppingCart,
  Clock,
  Shield,
  HelpCircle,
  Sparkles,
  MessageSquare,
  Users,
  Activity,
  GitBranch,
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

// 購買意欲レベルの定義
const intentLevels = {
  very_high: { label: "非常に高い", color: "bg-green-500", icon: TrendingUp },
  high: { label: "高い", color: "bg-emerald-500", icon: TrendingUp },
  medium: { label: "中程度", color: "bg-yellow-500", icon: Activity },
  low: { label: "低い", color: "bg-orange-500", icon: TrendingDown },
  very_low: { label: "非常に低い", color: "bg-red-500", icon: TrendingDown },
};

// 心理的障壁の定義
const barriers = {
  price: { label: "価格", icon: ShoppingCart, color: "text-red-500" },
  timing: { label: "タイミング", icon: Clock, color: "text-orange-500" },
  trust: { label: "信頼", icon: Shield, color: "text-yellow-500" },
  need: { label: "必要性", icon: HelpCircle, color: "text-blue-500" },
  comparison: { label: "比較検討", icon: GitBranch, color: "text-purple-500" },
};

// サンプルデータ：購買意欲分析結果
const sampleAnalysisResults = [
  {
    id: "1",
    contactName: "山田太郎",
    intentLevel: "very_high" as const,
    intentScore: 92,
    barrier: null,
    psychologyPhase: "most_aware",
    lastMessage: "この商品の申し込み方法を教えてください",
    suggestedBranch: "purchase_ready",
    suggestedAction: "購入リンク送信",
    signals: ["価格への関心", "購入意思表示", "具体的な質問"],
    timestamp: "3分前",
  },
  {
    id: "2",
    contactName: "佐藤花子",
    intentLevel: "high" as const,
    intentScore: 78,
    barrier: "price",
    psychologyPhase: "product_aware",
    lastMessage: "分割払いはできますか？",
    suggestedBranch: "objection_price",
    suggestedAction: "分割払い案内 + 限定割引",
    signals: ["支払い方法への関心", "価格障壁あり"],
    timestamp: "8分前",
  },
  {
    id: "3",
    contactName: "鈴木一郎",
    intentLevel: "medium" as const,
    intentScore: 55,
    barrier: "trust",
    psychologyPhase: "solution_aware",
    lastMessage: "本当に効果があるんですか？",
    suggestedBranch: "objection_trust",
    suggestedAction: "お客様の声 + 実績データ",
    signals: ["懐疑的", "証拠を求めている"],
    timestamp: "15分前",
  },
  {
    id: "4",
    contactName: "田中美咲",
    intentLevel: "low" as const,
    intentScore: 32,
    barrier: "need",
    psychologyPhase: "problem_aware",
    lastMessage: "今は特に困ってないんですけど...",
    suggestedBranch: "education",
    suggestedAction: "問題提起コンテンツ配信",
    signals: ["必要性を感じていない", "先延ばし傾向"],
    timestamp: "22分前",
  },
  {
    id: "5",
    contactName: "高橋健太",
    intentLevel: "very_low" as const,
    intentScore: 15,
    barrier: "timing",
    psychologyPhase: "unaware",
    lastMessage: "また今度連絡します",
    suggestedBranch: "reengagement",
    suggestedAction: "教育コンテンツ + フォローアップ待機",
    signals: ["先延ばし", "低エンゲージメント"],
    timestamp: "1時間前",
  },
];

// 分岐フロー図のデータ
const branchFlowData = {
  purchase_ready: {
    name: "購入準備完了",
    color: "bg-green-100 border-green-500",
    textColor: "text-green-700",
    actions: ["限定オファー送信", "購入リンク提示", "担当者通知"],
  },
  nurturing: {
    name: "ナーチャリング",
    color: "bg-blue-100 border-blue-500",
    textColor: "text-blue-700",
    actions: ["成功事例共有", "無料コンテンツ", "Q&A対応"],
  },
  education: {
    name: "教育フェーズ",
    color: "bg-purple-100 border-purple-500",
    textColor: "text-purple-700",
    actions: ["教育コンテンツ", "問題提起", "無料診断案内"],
  },
  objection_price: {
    name: "価格障壁対応",
    color: "bg-orange-100 border-orange-500",
    textColor: "text-orange-700",
    actions: ["ROI説明", "分割払い案内", "限定割引"],
  },
  objection_trust: {
    name: "信頼構築",
    color: "bg-yellow-100 border-yellow-500",
    textColor: "text-yellow-700",
    actions: ["お客様の声", "実績データ", "保証制度説明"],
  },
  reengagement: {
    name: "リエンゲージメント",
    color: "bg-gray-100 border-gray-500",
    textColor: "text-gray-700",
    actions: ["新情報共有", "無料プレゼント", "アンケート"],
  },
};

export default function IntentAnalysisPage() {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // 統計計算
  const intentDistribution = {
    very_high: sampleAnalysisResults.filter((r) => r.intentLevel === "very_high").length,
    high: sampleAnalysisResults.filter((r) => r.intentLevel === "high").length,
    medium: sampleAnalysisResults.filter((r) => r.intentLevel === "medium").length,
    low: sampleAnalysisResults.filter((r) => r.intentLevel === "low").length,
    very_low: sampleAnalysisResults.filter((r) => r.intentLevel === "very_low").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">購買意欲分析</h1>
        <p className="text-muted-foreground">
          AIが顧客の心理状態と購買意欲を分析し、最適な分岐を自動決定
        </p>
      </div>

      {/* 分岐フロー図 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            購買意欲ベースの自動分岐フロー
          </CardTitle>
          <CardDescription>
            顧客の購買意欲と心理的障壁に基づいて、最適なメッセージシーケンスに自動分岐
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {/* トリガー */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">顧客からのメッセージ / 行動</span>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />

            {/* AI分析 */}
            <div className="flex items-center gap-2 px-6 py-3 rounded-lg bg-purple-100 border-2 border-purple-500">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-700">AI購買意欲分析</span>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90" />

            {/* 分岐先 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl">
              {Object.entries(branchFlowData).map(([key, branch]) => (
                <div
                  key={key}
                  className={"p-4 rounded-lg border-2 " + branch.color}
                >
                  <p className={"font-medium mb-2 " + branch.textColor}>
                    {branch.name}
                  </p>
                  <ul className="text-xs space-y-1">
                    {branch.actions.map((action, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-5">
        {Object.entries(intentLevels).map(([key, level]) => {
          const Icon = level.icon;
          const count = intentDistribution[key as keyof typeof intentDistribution];
          return (
            <Card key={key}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{level.label}</p>
                    <p className="text-2xl font-bold">{count}人</p>
                  </div>
                  <div className={"p-2 rounded-full " + level.color + " text-white"}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">リアルタイム分析</TabsTrigger>
          <TabsTrigger value="signals">購買シグナル</TabsTrigger>
          <TabsTrigger value="barriers">心理的障壁</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-4">
          {sampleAnalysisResults.map((result) => {
            const intentConfig = intentLevels[result.intentLevel];
            const IntentIcon = intentConfig.icon;
            const barrierConfig = result.barrier
              ? barriers[result.barrier as keyof typeof barriers]
              : null;
            const branchConfig = branchFlowData[result.suggestedBranch as keyof typeof branchFlowData];

            return (
              <Card
                key={result.id}
                className={
                  "cursor-pointer transition-all " +
                  (selectedContact === result.id ? "ring-2 ring-primary" : "")
                }
                onClick={() => setSelectedContact(result.id)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* 購買意欲スコア */}
                      <div className="flex flex-col items-center">
                        <div
                          className={
                            "w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl " +
                            intentConfig.color
                          }
                        >
                          {result.intentScore}
                        </div>
                        <p className="text-xs mt-1 text-muted-foreground">
                          {intentConfig.label}
                        </p>
                      </div>

                      {/* 詳細情報 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{result.contactName}</p>
                          <Badge variant="outline" className="text-xs">
                            {result.timestamp}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          「{result.lastMessage}」
                        </p>

                        {/* シグナル */}
                        <div className="flex flex-wrap gap-1">
                          {result.signals.map((signal, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs"
                            >
                              {signal}
                            </Badge>
                          ))}
                        </div>

                        {/* 障壁 */}
                        {barrierConfig && (
                          <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle className={"h-4 w-4 " + barrierConfig.color} />
                            <span>障壁: {barrierConfig.label}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 推奨分岐 */}
                    <div className="text-right space-y-2">
                      <div
                        className={
                          "inline-block px-3 py-1 rounded-lg text-sm font-medium " +
                          branchConfig.color + " " + branchConfig.textColor
                        }
                      >
                        → {branchConfig.name}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.suggestedAction}
                      </p>
                      <Button size="sm">
                        <Sparkles className="mr-1 h-3 w-3" />
                        実行
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>高購買意欲シグナル</CardTitle>
              <CardDescription>
                これらのキーワードや行動が検出されると、購買意欲スコアが上昇します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    メッセージキーワード
                  </h4>
                  <div className="space-y-2">
                    {[
                      { keyword: "価格・料金・いくら", weight: "+15", desc: "価格への関心" },
                      { keyword: "申し込み・購入・買いたい", weight: "+25", desc: "購入意思" },
                      { keyword: "支払い・クレジット・分割", weight: "+20", desc: "支払い方法確認" },
                      { keyword: "いつから・開始・スタート", weight: "+15", desc: "開始時期確認" },
                      { keyword: "特典・割引・キャンペーン", weight: "+15", desc: "特典への関心" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-green-50"
                      >
                        <div>
                          <p className="font-medium text-sm">{item.keyword}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Badge className="bg-green-500">{item.weight}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    行動パターン
                  </h4>
                  <div className="space-y-2">
                    {[
                      { action: "料金ページ閲覧", weight: "+15" },
                      { action: "カート追加", weight: "+20" },
                      { action: "チェックアウト開始", weight: "+25" },
                      { action: "FAQ閲覧", weight: "+10" },
                      { action: "お客様の声閲覧", weight: "+10" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-green-50"
                      >
                        <p className="font-medium text-sm">{item.action}</p>
                        <Badge className="bg-green-500">{item.weight}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>低購買意欲シグナル</CardTitle>
              <CardDescription>
                これらが検出されると、購買意欲スコアが低下し、適切な対応分岐へ誘導
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  {[
                    { keyword: "今は・後で・また今度", weight: "-10", desc: "先延ばし" },
                    { keyword: "高い・高額・予算が...", weight: "-15", desc: "価格障壁" },
                    { keyword: "必要ない・いらない", weight: "-20", desc: "必要性否定" },
                    { keyword: "検討・比較・他の", weight: "-5", desc: "比較検討中" },
                    { keyword: "解除・やめ・キャンセル", weight: "-25", desc: "離脱意向" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-red-50"
                    >
                      <div>
                        <p className="font-medium text-sm">{item.keyword}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Badge variant="destructive">{item.weight}</Badge>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { action: "カート放棄", weight: "-15" },
                    { action: "すぐに離脱", weight: "-10" },
                    { action: "配信停止ページ閲覧", weight: "-20" },
                    { action: "7日間エンゲージメントなし", weight: "-5/日" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded bg-red-50"
                    >
                      <p className="font-medium text-sm">{item.action}</p>
                      <Badge variant="destructive">{item.weight}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barriers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                barrier: "price",
                name: "価格障壁",
                icon: ShoppingCart,
                color: "bg-red-100 text-red-700",
                signals: ["高い", "予算が", "分割できる？"],
                approach: "ROI訴求、分割払い案内、限定割引",
                count: 45,
              },
              {
                barrier: "trust",
                name: "信頼障壁",
                icon: Shield,
                color: "bg-yellow-100 text-yellow-700",
                signals: ["本当に？", "実績は？", "怪しい"],
                approach: "お客様の声、実績データ、保証制度",
                count: 32,
              },
              {
                barrier: "timing",
                name: "タイミング障壁",
                icon: Clock,
                color: "bg-orange-100 text-orange-700",
                signals: ["今は忙しい", "後で", "来月"],
                approach: "緊急性訴求、限定感の演出",
                count: 28,
              },
              {
                barrier: "need",
                name: "必要性障壁",
                icon: HelpCircle,
                color: "bg-blue-100 text-blue-700",
                signals: ["必要ない", "困ってない", "今のままで"],
                approach: "問題提起、将来リスクの提示",
                count: 55,
              },
              {
                barrier: "comparison",
                name: "比較検討",
                icon: GitBranch,
                color: "bg-purple-100 text-purple-700",
                signals: ["他と比べて", "競合は", "違いは"],
                approach: "差別化ポイント、比較表の提示",
                count: 22,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.barrier}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className={"p-2 rounded-lg " + item.color}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {item.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        検出キーワード
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.signals.map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        推奨アプローチ
                      </p>
                      <p className="text-sm">{item.approach}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        該当顧客数
                      </span>
                      <Badge>{item.count}人</Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
