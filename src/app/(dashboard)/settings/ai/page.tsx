"use client";

import { useState } from "react";
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  Brain,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

const sampleFAQs: FAQ[] = [
  {
    id: "1",
    question: "商品の配送にはどのくらいかかりますか？",
    answer: "通常、ご注文から3営業日以内に発送いたします。お届けまでは発送後1〜3日程度です。",
  },
  {
    id: "2",
    question: "返品・交換はできますか？",
    answer: "商品到着後7日以内であれば、未開封・未使用の場合に限り返品・交換を承ります。",
  },
  {
    id: "3",
    question: "支払い方法は何がありますか？",
    answer: "クレジットカード（VISA、MasterCard、JCB、AMEX）、銀行振込、コンビニ決済がご利用いただけます。",
  },
];

export default function AISettingsPage() {
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [mode, setMode] = useState<"support" | "sales" | "faq">("support");
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState(500);
  const [customPrompt, setCustomPrompt] = useState("");
  const [faqs, setFaqs] = useState<FAQ[]>(sampleFAQs);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [apiKey, setApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [handoffKeywords, setHandoffKeywords] = useState(
    "クレーム,返金,キャンセル,解約,担当者"
  );

  const handleAddFaq = () => {
    if (!newFaq.question || !newFaq.answer) {
      toast.error("質問と回答を入力してください");
      return;
    }

    setFaqs([...faqs, { id: Date.now().toString(), ...newFaq }]);
    setNewFaq({ question: "", answer: "" });
    toast.success("FAQを追加しました");
  };

  const handleDeleteFaq = (id: string) => {
    setFaqs(faqs.filter((f) => f.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("設定を保存しました");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AIアシスタント設定</h1>
        <p className="text-muted-foreground">
          Claude AIによる自動応答を設定します
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>AI自動応答</CardTitle>
                <CardDescription>
                  Claude AIがお客様の質問に自動で回答します
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="ai-toggle">AI有効</Label>
              <Switch
                id="ai-toggle"
                checked={isAIEnabled}
                onCheckedChange={setIsAIEnabled}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API設定</CardTitle>
          <CardDescription>
            Anthropic APIキーを設定してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Anthropic API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              APIキーは console.anthropic.com から取得できます
            </p>
          </div>
          {apiKey && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">APIキーが設定されています</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>応答モード</CardTitle>
          <CardDescription>
            AIの振る舞いを選択します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              className={"p-4 rounded-lg border-2 text-left transition-colors " +
                (mode === "support" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50")}
              onClick={() => setMode("support")}
            >
              <MessageSquare className="h-6 w-6 mb-2 text-blue-500" />
              <h3 className="font-medium">カスタマーサポート</h3>
              <p className="text-sm text-muted-foreground">
                丁寧な対応で質問に回答
              </p>
            </button>
            <button
              type="button"
              className={"p-4 rounded-lg border-2 text-left transition-colors " +
                (mode === "sales" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50")}
              onClick={() => setMode("sales")}
            >
              <Brain className="h-6 w-6 mb-2 text-green-500" />
              <h3 className="font-medium">セールス</h3>
              <p className="text-sm text-muted-foreground">
                商品の魅力を伝え提案
              </p>
            </button>
            <button
              type="button"
              className={"p-4 rounded-lg border-2 text-left transition-colors " +
                (mode === "faq" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50")}
              onClick={() => setMode("faq")}
            >
              <AlertCircle className="h-6 w-6 mb-2 text-orange-500" />
              <h3 className="font-medium">FAQ対応</h3>
              <p className="text-sm text-muted-foreground">
                登録FAQに基づき回答
              </p>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>詳細設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>回答の創造性 (Temperature): {temperature[0]}</Label>
            <Slider
              value={temperature}
              onValueChange={setTemperature}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              低い値: 正確で一貫した回答 / 高い値: 創造的で多様な回答
            </p>
          </div>

          <div className="space-y-2">
            <Label>人間に引き継ぐキーワード</Label>
            <Input
              value={handoffKeywords}
              onChange={(e) => setHandoffKeywords(e.target.value)}
              placeholder="キーワードをカンマ区切りで入力"
            />
            <p className="text-xs text-muted-foreground">
              これらのキーワードが含まれる場合、AIは回答せず人間に引き継ぎます
            </p>
          </div>

          <div className="space-y-2">
            <Label>カスタムプロンプト（追加指示）</Label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="AIへの追加指示を入力（例: 商品名は「〇〇」と呼んでください）"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {mode === "faq" && (
        <Card>
          <CardHeader>
            <CardTitle>FAQ登録</CardTitle>
            <CardDescription>
              よくある質問と回答を登録すると、AIがこれを参考に回答します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Q: {faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      A: {faq.answer}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteFaq(faq.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <Label>質問</Label>
                <Input
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                  placeholder="よくある質問を入力"
                />
              </div>
              <div className="space-y-2">
                <Label>回答</Label>
                <Textarea
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                  placeholder="回答を入力"
                  rows={2}
                />
              </div>
              <Button onClick={handleAddFaq}>
                <Plus className="mr-2 h-4 w-4" />
                FAQを追加
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "保存中..." : "すべて保存"}
        </Button>
      </div>
    </div>
  );
}
