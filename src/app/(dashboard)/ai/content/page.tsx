"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  Sparkles,
  Mail,
  MessageSquare,
  Copy,
  RefreshCw,
  Wand2,
  FileText,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Save,
  History
} from "lucide-react";

type ContentType = "email_subject" | "email_body" | "line_message";
type ToneType = "formal" | "friendly" | "casual" | "urgent" | "empathetic" | "persuasive";
type PurposeType = "welcome" | "nurturing" | "promotion" | "reengagement" | "announcement" | "educational" | "survey";

interface GeneratedContent {
  id: string;
  type: ContentType;
  content: string;
  variations?: string[];
  score: number;
  timestamp: Date;
}

// 一貫した時刻フォーマット
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function ContentGenerationPage() {
  const [contentType, setContentType] = useState<ContentType>("email_subject");
  const [tone, setTone] = useState<ToneType>("friendly");
  const [purpose, setPurpose] = useState<PurposeType>("nurturing");
  const [context, setContext] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(Date.now());
  }, []);

  const baseTime = isClient ? currentTime : 0;

  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([
    {
      id: "1",
      type: "email_subject",
      content: "【限定公開】あなただけの特別オファーをご用意しました",
      variations: [
        "今だけ！会員様限定の特別プランのご案内",
        "お待たせしました！ご要望の新サービスがスタート",
        "【重要】あなたの成功をサポートする新機能リリース"
      ],
      score: 0.92,
      timestamp: new Date()
    },
    {
      id: "2",
      type: "email_body",
      content: `いつもご利用いただきありがとうございます。

この度、会員様限定の特別プログラムをご用意いたしました。
これまでのご愛顧に感謝を込めて、特別価格でご提供させていただきます。

【特別オファーの内容】
✓ 通常価格の30%OFF
✓ 専任サポート付き
✓ 30日間の返金保証

この機会をぜひご活用ください。`,
      score: 0.88,
      timestamp: new Date()
    },
    {
      id: "3",
      type: "line_message",
      content: "🎉 お知らせ\n\n本日限定のキャンペーン実施中！\n詳細はこちら👇\n\n【特典】初回限定50%OFF\n\nお見逃しなく✨",
      score: 0.85,
      timestamp: new Date()
    }
  ]);

  const handleGenerate = async () => {
    setIsGenerating(true);

    // シミュレーション
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newContent: GeneratedContent = {
      id: Date.now().toString(),
      type: contentType,
      content: contentType === "email_subject"
        ? "【新着】あなたの課題を解決する方法をお伝えします"
        : contentType === "email_body"
        ? `${targetAudience || "お客様"}へ\n\nいつもありがとうございます。\n${context || "本日は特別なご案内がございます。"}\n\nぜひご検討ください。`
        : `✨ ${context || "新着情報"}\n\n詳細はプロフィールリンクから！`,
      variations: contentType === "email_subject" ? [
        "必見！成果を上げるための秘訣",
        "【限定】今だけの特別なご案内",
        "お待たせしました！新サービス開始のお知らせ"
      ] : undefined,
      score: Math.random() * 0.2 + 0.8,
      timestamp: new Date()
    };

    setGeneratedContents(prev => [newContent, ...prev]);
    setIsGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case "email_subject":
      case "email_body":
        return <Mail className="h-4 w-4" />;
      case "line_message":
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getContentTypeLabel = (type: ContentType) => {
    switch (type) {
      case "email_subject":
        return "メール件名";
      case "email_body":
        return "メール本文";
      case "line_message":
        return "LINEメッセージ";
    }
  };

  const getToneLabel = (t: ToneType) => {
    const labels: Record<ToneType, string> = {
      formal: "フォーマル",
      friendly: "フレンドリー",
      casual: "カジュアル",
      urgent: "緊急",
      empathetic: "共感的",
      persuasive: "説得力"
    };
    return labels[t];
  };

  const getPurposeLabel = (p: PurposeType) => {
    const labels: Record<PurposeType, string> = {
      welcome: "ウェルカム",
      nurturing: "ナーチャリング",
      promotion: "プロモーション",
      reengagement: "再エンゲージメント",
      announcement: "お知らせ",
      educational: "教育コンテンツ",
      survey: "アンケート"
    };
    return labels[p];
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-500" />
            AIコンテンツ生成
          </h1>
          <p className="text-muted-foreground mt-1">
            AIがパーソナライズされたコンテンツを自動生成します
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            履歴
          </Button>
          <Button variant="outline">
            <Save className="h-4 w-4 mr-2" />
            テンプレート保存
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の生成数</CardTitle>
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground">+12% 先月比</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均品質スコア</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.87</div>
            <p className="text-xs text-muted-foreground">高品質を維持</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">採用率</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">生成コンテンツの使用率</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">時間節約</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42h</div>
            <p className="text-xs text-muted-foreground">今月の推定節約時間</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 生成パネル */}
        <Card>
          <CardHeader>
            <CardTitle>コンテンツ生成</CardTitle>
            <CardDescription>
              パラメータを設定してAIにコンテンツを生成させます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>コンテンツタイプ</Label>
              <Tabs value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="email_subject">
                    <Mail className="h-4 w-4 mr-2" />
                    件名
                  </TabsTrigger>
                  <TabsTrigger value="email_body">
                    <FileText className="h-4 w-4 mr-2" />
                    本文
                  </TabsTrigger>
                  <TabsTrigger value="line_message">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    LINE
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>トーン</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as ToneType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">フォーマル</SelectItem>
                    <SelectItem value="friendly">フレンドリー</SelectItem>
                    <SelectItem value="casual">カジュアル</SelectItem>
                    <SelectItem value="urgent">緊急</SelectItem>
                    <SelectItem value="empathetic">共感的</SelectItem>
                    <SelectItem value="persuasive">説得力</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>目的</Label>
                <Select value={purpose} onValueChange={(v) => setPurpose(v as PurposeType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="welcome">ウェルカム</SelectItem>
                    <SelectItem value="nurturing">ナーチャリング</SelectItem>
                    <SelectItem value="promotion">プロモーション</SelectItem>
                    <SelectItem value="reengagement">再エンゲージメント</SelectItem>
                    <SelectItem value="announcement">お知らせ</SelectItem>
                    <SelectItem value="educational">教育コンテンツ</SelectItem>
                    <SelectItem value="survey">アンケート</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>ターゲット層</Label>
              <Input
                placeholder="例: 30代女性、初回購入者、VIP会員"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>コンテキスト・キーワード</Label>
              <Textarea
                placeholder="含めたい情報やキーワードを入力してください"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  コンテンツを生成
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 生成結果 */}
        <Card>
          <CardHeader>
            <CardTitle>生成結果</CardTitle>
            <CardDescription>
              AIが生成したコンテンツ一覧
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {generatedContents.map((content) => (
              <Card key={content.id} className="border-l-4 border-l-purple-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getContentTypeIcon(content.type)}
                      <Badge variant="outline">
                        {getContentTypeLabel(content.type)}
                      </Badge>
                      <Badge
                        variant={content.score >= 0.9 ? "default" : "secondary"}
                        className={content.score >= 0.9 ? "bg-green-500" : ""}
                      >
                        スコア: {(content.score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {isClient ? formatTime(content.timestamp) : "--:--:--"}
                    </span>
                  </div>

                  <div className="bg-muted p-3 rounded-md mb-3">
                    <p className="whitespace-pre-wrap text-sm">{content.content}</p>
                  </div>

                  {content.variations && content.variations.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <p className="text-xs font-medium text-muted-foreground">バリエーション:</p>
                      {content.variations.map((variation, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted/50 p-2 rounded text-sm">
                          <span>{variation}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(variation)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(content.content)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        コピー
                      </Button>
                      <Button variant="default" size="sm">
                        使用する
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* クイックテンプレート */}
      <Card>
        <CardHeader>
          <CardTitle>クイックテンプレート</CardTitle>
          <CardDescription>
            よく使うテンプレートからすばやく生成
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { name: "ウェルカムメール", icon: "👋", type: "welcome" },
              { name: "セール告知", icon: "🎉", type: "promotion" },
              { name: "フォローアップ", icon: "📧", type: "nurturing" },
              { name: "再購入促進", icon: "🔄", type: "reengagement" },
              { name: "お誕生日メール", icon: "🎂", type: "special" },
              { name: "カート放棄リマインド", icon: "🛒", type: "reminder" },
              { name: "新商品案内", icon: "✨", type: "announcement" },
              { name: "アンケート依頼", icon: "📝", type: "survey" }
            ].map((template) => (
              <Button
                key={template.name}
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
              >
                <span className="text-2xl">{template.icon}</span>
                <span className="text-sm">{template.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
