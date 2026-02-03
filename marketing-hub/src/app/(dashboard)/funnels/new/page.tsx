"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Mail,
  Video,
  Rocket,
  Users,
  Zap,
  FileText,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const funnelTypes = [
  {
    type: "OPTIN",
    label: "オプトインファネル",
    description: "メルマガやLINE登録を促すシンプルなファネル",
    icon: Mail,
    color: "border-blue-500 bg-blue-50",
    steps: ["オプトインページ", "サンキューページ"],
  },
  {
    type: "SALES",
    label: "セールスファネル",
    description: "商品・サービスを販売する王道のファネル",
    icon: ShoppingCart,
    color: "border-green-500 bg-green-50",
    steps: ["セールスページ", "注文フォーム", "アップセル", "サンキュー"],
  },
  {
    type: "WEBINAR",
    label: "ウェビナーファネル",
    description: "ウェビナー登録から販売までの自動化ファネル",
    icon: Video,
    color: "border-purple-500 bg-purple-50",
    steps: ["登録ページ", "確認ページ", "ウェビナー", "リプレイ", "オファー"],
  },
  {
    type: "PRODUCT_LAUNCH",
    label: "プロダクトローンチ",
    description: "4本の動画で期待を高めてから販売するファネル",
    icon: Rocket,
    color: "border-orange-500 bg-orange-50",
    steps: ["オプトイン", "PLC動画1-4", "セールス", "注文フォーム"],
  },
  {
    type: "TRIPWIRE",
    label: "トリップワイヤー",
    description: "低価格商品から始めてアップセルする戦略",
    icon: Zap,
    color: "border-yellow-500 bg-yellow-50",
    steps: ["オプトイン", "トリップワイヤー", "アップセル1-2", "サンキュー"],
  },
  {
    type: "MEMBERSHIP",
    label: "会員登録ファネル",
    description: "会員制サイトへの登録・課金フロー",
    icon: Users,
    color: "border-pink-500 bg-pink-50",
    steps: ["セールス", "注文フォーム", "会員登録", "サンキュー"],
  },
  {
    type: "APPLICATION",
    label: "申込み・相談予約",
    description: "無料相談や申込みを受け付けるファネル",
    icon: FileText,
    color: "border-gray-500 bg-gray-50",
    steps: ["ランディング", "申込みフォーム", "確認ページ"],
  },
];

export default function NewFunnelPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!selectedType || !name.trim()) {
      toast.error("ファネル名とタイプを選択してください");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/funnels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type: selectedType,
        }),
      });

      if (!res.ok) throw new Error("Failed to create");

      const data = await res.json();
      toast.success("ファネルを作成しました");
      router.push(`/funnels/${data.funnel.id}`);
    } catch (error) {
      toast.error("作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTypeInfo = funnelTypes.find((t) => t.type === selectedType);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/funnels">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            新規ファネル作成
          </h1>
          <p className="text-muted-foreground">
            目的に合ったファネルタイプを選択してください
          </p>
        </div>
      </div>

      {/* ファネル名入力 */}
      <Card>
        <CardHeader>
          <CardTitle>ファネル名</CardTitle>
          <CardDescription>
            管理用のファネル名を入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="name">ファネル名</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 無料オファーLP、商品Aセールスファネル"
            />
          </div>
        </CardContent>
      </Card>

      {/* ファネルタイプ選択 */}
      <Card>
        <CardHeader>
          <CardTitle>ファネルタイプを選択</CardTitle>
          <CardDescription>
            目的に合わせて最適なファネル構造を選びましょう
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {funnelTypes.map((funnelType) => {
              const Icon = funnelType.icon;
              const isSelected = selectedType === funnelType.type;

              return (
                <Card
                  key={funnelType.type}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? `ring-2 ring-primary ${funnelType.color}`
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedType(funnelType.type)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-base">
                          {funnelType.label}
                        </CardTitle>
                      </div>
                      {isSelected && (
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      {funnelType.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {funnelType.steps.map((step, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-muted px-2 py-0.5 rounded"
                        >
                          {step}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 選択されたタイプの詳細 */}
      {selectedTypeInfo && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <selectedTypeInfo.icon className="h-5 w-5" />
              {selectedTypeInfo.label}の構成
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {selectedTypeInfo.steps.map((step, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="bg-primary text-primary-foreground px-3 py-2 rounded text-sm whitespace-nowrap">
                    {idx + 1}. {step}
                  </div>
                  {idx < selectedTypeInfo.steps.length - 1 && (
                    <div className="w-8 h-px bg-border mx-1" />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              作成後、各ステップのページを編集できます。
            </p>
          </CardContent>
        </Card>
      )}

      {/* 作成ボタン */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/funnels">キャンセル</Link>
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!selectedType || !name.trim() || isLoading}
        >
          {isLoading ? "作成中..." : "ファネルを作成"}
        </Button>
      </div>
    </div>
  );
}
