"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Workflow,
  Zap,
  Brain,
  Users,
  ShoppingCart,
  MessageSquare,
  Mail,
  Tag,
  Clock,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const triggerTypes = [
  {
    value: "LINE_FRIEND_ADDED",
    label: "LINE友達追加",
    icon: MessageSquare,
    description: "新しいLINE友達が追加された時",
  },
  {
    value: "EMAIL_SUBSCRIBED",
    label: "メール登録",
    icon: Mail,
    description: "メールアドレスが登録された時",
  },
  {
    value: "CART_ABANDONED",
    label: "カート放棄",
    icon: ShoppingCart,
    description: "カートに商品を入れて離脱した時",
  },
  {
    value: "PURCHASE_COMPLETED",
    label: "購入完了",
    icon: Target,
    description: "商品の購入が完了した時",
  },
  {
    value: "TAG_ADDED",
    label: "タグ追加",
    icon: Tag,
    description: "特定のタグが追加された時",
  },
  {
    value: "INACTIVE_DAYS",
    label: "非アクティブ",
    icon: Clock,
    description: "一定期間アクションがない時",
  },
  {
    value: "SCORE_CHANGED",
    label: "スコア変更",
    icon: Zap,
    description: "コンタクトスコアが変更された時",
  },
];

export default function NewWorkflowPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "",
    aiEnabled: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.trigger) {
      toast.error("名前とトリガーは必須です");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement workflow creation API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("ワークフローを作成しました");
      router.push("/automation");
    } catch {
      toast.error("ワークフローの作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTrigger = triggerTypes.find((t) => t.value === formData.trigger);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/automation">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新規ワークフロー</h1>
          <p className="text-muted-foreground">
            自動化ワークフローを作成します
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>
                ワークフローの名前と説明を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">ワークフロー名 *</Label>
                <Input
                  id="name"
                  placeholder="例: 新規登録ウェルカムシーケンス"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明</Label>
                <Textarea
                  id="description"
                  placeholder="ワークフローの説明を入力..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    <Label>AI自動分岐</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AIがコンタクトに最適なアクションを判断
                  </p>
                </div>
                <Switch
                  checked={formData.aiEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, aiEnabled: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>トリガー設定</CardTitle>
              <CardDescription>
                ワークフローを開始するトリガーを選択してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trigger">トリガータイプ *</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(value) =>
                    setFormData({ ...formData, trigger: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="トリガーを選択..." />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerTypes.map((trigger) => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        <div className="flex items-center gap-2">
                          <trigger.icon className="h-4 w-4" />
                          <span>{trigger.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTrigger && (
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-background">
                      <selectedTrigger.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedTrigger.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedTrigger.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  トリガー条件の詳細設定は、作成後にワークフローエディターで行えます。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>次のステップ</CardTitle>
            <CardDescription>
              ワークフロー作成後の流れ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  1
                </div>
                <span>基本設定</span>
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  2
                </div>
                <span>アクション追加</span>
              </div>
              <div className="flex-1 h-px bg-border" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  3
                </div>
                <span>テスト & 有効化</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/automation">キャンセル</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Workflow className="mr-2 h-4 w-4" />
            {isSubmitting ? "作成中..." : "ワークフローを作成"}
          </Button>
        </div>
      </form>
    </div>
  );
}
