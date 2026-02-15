"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  RefreshCw,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "one_time" as "one_time" | "subscription",
    price: "",
    currency: "jpy",
    interval: "month" as "month" | "year",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast.error("商品名と価格は必須です");
      return;
    }

    const price = parseInt(formData.price);
    if (isNaN(price) || price <= 0) {
      toast.error("有効な価格を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      // デモモード: サーバーAPIが未実装のためクライアントで完結
      await new Promise((resolve) => setTimeout(resolve, 800));

      toast.success("商品を作成しました");
      router.push("/products");
    } catch {
      toast.error("作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPreviewPrice = () => {
    const price = parseInt(formData.price);
    if (isNaN(price)) return "---";
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新規商品登録</h1>
          <p className="text-muted-foreground">
            販売する商品・サービスを登録してください
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">基本情報</CardTitle>
            <CardDescription>商品の名前と説明を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">商品名 *</Label>
              <Input
                id="name"
                placeholder="例: オンラインコース基礎編"
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
                placeholder="商品の詳細な説明..."
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 販売タイプ */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              販売タイプ
            </CardTitle>
            <CardDescription>販売方式を選択してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "one_time" })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formData.type === "one_time"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">単発販売</p>
                    <p className="text-sm text-muted-foreground">
                      一度の購入で完結する商品
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, type: "subscription" })
                }
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formData.type === "subscription"
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">サブスクリプション</p>
                    <p className="text-sm text-muted-foreground">
                      定期的に課金される商品
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 価格設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">価格設定</CardTitle>
            <CardDescription>販売価格を設定してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">価格（税込） *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">
                    ¥
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    placeholder="29800"
                    className="pl-8"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              {formData.type === "subscription" && (
                <div className="space-y-2">
                  <Label>課金間隔</Label>
                  <Select
                    value={formData.interval}
                    onValueChange={(value: "month" | "year") =>
                      setFormData({ ...formData, interval: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">月額</SelectItem>
                      <SelectItem value="year">年額</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ステータス */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">公開設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>すぐに販売開始</Label>
                <p className="text-sm text-muted-foreground">
                  OFFの場合は下書きとして保存されます
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* プレビュー */}
        {formData.name && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">作成する商品</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  {formData.type === "subscription" ? (
                    <RefreshCw className="h-6 w-6" />
                  ) : (
                    <Package className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">{formData.name}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      {formatPreviewPrice()}
                      {formData.type === "subscription" && (
                        <span>/{formData.interval === "month" ? "月" : "年"}</span>
                      )}
                    </span>
                    <span>
                      {formData.type === "subscription" ? "サブスクリプション" : "単発販売"}
                    </span>
                    <span>
                      {formData.isActive ? "販売中" : "下書き"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 送信ボタン */}
        <div className="flex items-center justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/products">キャンセル</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : "商品を登録"}
          </Button>
        </div>
      </form>
    </div>
  );
}
