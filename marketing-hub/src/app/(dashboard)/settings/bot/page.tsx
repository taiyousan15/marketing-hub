"use client";

import { useState } from "react";
import {
  Bot,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  Zap,
  Clock,
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
import { toast } from "sonner";

interface AutoReplyRule {
  id: string;
  trigger: string;
  triggerType: "keyword" | "contains" | "regex";
  response: string;
  isActive: boolean;
}

const sampleRules: AutoReplyRule[] = [
  {
    id: "1",
    trigger: "営業時間",
    triggerType: "contains",
    response: "営業時間は平日9:00〜18:00です。土日祝日はお休みをいただいております。",
    isActive: true,
  },
  {
    id: "2",
    trigger: "料金",
    triggerType: "contains",
    response: "料金プランについては以下のページをご覧ください。\nhttps://example.com/pricing",
    isActive: true,
  },
  {
    id: "3",
    trigger: "こんにちは|こんばんは|おはよう",
    triggerType: "regex",
    response: "こんにちは！お問い合わせありがとうございます。何かお手伝いできることはありますか？",
    isActive: true,
  },
];

export default function BotSettingsPage() {
  const [isBotEnabled, setIsBotEnabled] = useState(true);
  const [rules, setRules] = useState<AutoReplyRule[]>(sampleRules);
  const [newRule, setNewRule] = useState<Partial<AutoReplyRule>>({
    trigger: "",
    triggerType: "contains",
    response: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleAddRule = () => {
    if (!newRule.trigger || !newRule.response) {
      toast.error("トリガーと応答を入力してください");
      return;
    }

    const rule: AutoReplyRule = {
      id: Date.now().toString(),
      trigger: newRule.trigger,
      triggerType: newRule.triggerType || "contains",
      response: newRule.response,
      isActive: true,
    };

    setRules([...rules, rule]);
    setNewRule({ trigger: "", triggerType: "contains", response: "" });
    toast.success("ルールを追加しました");
  };

  const handleDeleteRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
    toast.success("ルールを削除しました");
  };

  const handleToggleRule = (id: string) => {
    setRules(
      rules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
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
        <h1 className="text-2xl font-bold tracking-tight">Bot設定</h1>
        <p className="text-muted-foreground">
          LINE自動応答ルールを設定します
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>自動応答Bot</CardTitle>
              <CardDescription>
                キーワードに基づいて自動的にメッセージを返信します
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="bot-toggle">Bot有効</Label>
              <Switch
                id="bot-toggle"
                checked={isBotEnabled}
                onCheckedChange={setIsBotEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>ルール数: {rules.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span>有効: {rules.filter((r) => r.isActive).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>応答ルール一覧</CardTitle>
          <CardDescription>
            メッセージに含まれるキーワードに基づいて自動返信します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={"rounded-lg border p-4 " + (rule.isActive ? "" : "opacity-50")}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={rule.isActive ? "default" : "secondary"}>
                      {rule.triggerType === "keyword"
                        ? "完全一致"
                        : rule.triggerType === "contains"
                        ? "部分一致"
                        : "正規表現"}
                    </Badge>
                    <code className="text-sm bg-muted px-2 py-0.5 rounded">
                      {rule.trigger}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {rule.response}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggleRule(rule.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {rules.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              ルールがありません。下のフォームから追加してください。
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>新規ルール追加</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>トリガータイプ</Label>
              <Select
                value={newRule.triggerType}
                onValueChange={(v) =>
                  setNewRule({ ...newRule, triggerType: v as AutoReplyRule["triggerType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">部分一致</SelectItem>
                  <SelectItem value="keyword">完全一致</SelectItem>
                  <SelectItem value="regex">正規表現</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>トリガー（キーワード）</Label>
              <Input
                placeholder="例: 営業時間"
                value={newRule.trigger || ""}
                onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>応答メッセージ</Label>
            <Textarea
              placeholder="自動返信するメッセージを入力..."
              rows={3}
              value={newRule.response || ""}
              onChange={(e) => setNewRule({ ...newRule, response: e.target.value })}
            />
          </div>
          <Button onClick={handleAddRule}>
            <Plus className="mr-2 h-4 w-4" />
            ルールを追加
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "保存中..." : "すべて保存"}
        </Button>
      </div>
    </div>
  );
}
