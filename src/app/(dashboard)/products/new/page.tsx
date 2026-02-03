"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, RefreshCw } from "lucide-react";

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

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "one_time",
    price: "",
    recurringInterval: "month",
    isActive: true,
    affiliateEnabled: true,
    affiliateCommissionRate: "20",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement product creation API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("商品を登録しました");
      router.push("/products");
    } catch {
      toast.error("商品の登録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新規商品登録</h1>
          <p className="text-muted-foreground">
            販売する商品・サービスを登録します
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>商品の基本情報を入力してください</CardDescription>
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
                  placeholder="商品の説明を入力..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">商品タイプ *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span>単発購入</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="subscription">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        <span>サブスクリプション</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>価格設定</CardTitle>
              <CardDescription>商品の価格を設定してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">価格 (税込) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ¥
                  </span>
                  <Input
                    id="price"
                    type="number"
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
                  <Label htmlFor="interval">請求サイクル</Label>
                  <Select
                    value={formData.recurringInterval}
                    onValueChange={(value) =>
                      setFormData({ ...formData, recurringInterval: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">毎月</SelectItem>
                      <SelectItem value="year">毎年</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>販売ステータス</Label>
                  <p className="text-sm text-muted-foreground">
                    オンにすると即時販売開始
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

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>アフィリエイト設定</CardTitle>
              <CardDescription>アフィリエイト報酬の設定</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>アフィリエイトを有効化</Label>
                  <p className="text-sm text-muted-foreground">
                    パートナーがこの商品を紹介できるようにします
                  </p>
                </div>
                <Switch
                  checked={formData.affiliateEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, affiliateEnabled: checked })
                  }
                />
              </div>

              {formData.affiliateEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="commissionRate">報酬率 (%)</Label>
                  <Input
                    id="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.affiliateCommissionRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        affiliateCommissionRate: e.target.value,
                      })
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    販売価格の{formData.affiliateCommissionRate}%がパートナーに支払われます
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/products">キャンセル</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "登録中..." : "商品を登録"}
          </Button>
        </div>
      </form>
    </div>
  );
}
