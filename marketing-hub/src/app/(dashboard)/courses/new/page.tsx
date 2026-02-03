"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

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
import { Globe, Lock } from "lucide-react";

export default function NewCoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    thumbnail: "",
    isPublished: false,
    accessMode: "PUBLIC" as "PUBLIC" | "RANK_BASED",
    isPublicCourse: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("コース名を入力してください");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create");

      const data = await res.json();
      toast.success("コースを作成しました");
      router.push(`/courses/${data.course.id}`);
    } catch (error) {
      toast.error("コースの作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新規コース作成</h1>
          <p className="text-muted-foreground">
            新しいオンラインコースを作成します
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
            <CardDescription>コースの基本的な情報を入力します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">コース名 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例: マーケティング入門コース"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="コースの説明を入力..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail">サムネイル URL</Label>
              <Input
                id="thumbnail"
                value={formData.thumbnail}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnail: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* アクセス設定 */}
        <Card>
          <CardHeader>
            <CardTitle>アクセス設定</CardTitle>
            <CardDescription>コースへのアクセス方法を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>アクセスモード</Label>
              <Select
                value={formData.accessMode}
                onValueChange={(value: "PUBLIC" | "RANK_BASED") =>
                  setFormData({ ...formData, accessMode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>全員に公開（ランク制限なし）</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="RANK_BASED">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>ランクに応じて制限</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {formData.accessMode === "PUBLIC"
                  ? "すべてのレッスンが受講者のランクに関係なく視聴できます"
                  : "各レッスンに設定されたランク以上の受講者のみ視聴できます"}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label>リンクを知っている人は誰でもアクセス可</Label>
                <p className="text-sm text-muted-foreground">
                  有効にすると公開URLが発行されます
                </p>
              </div>
              <Switch
                checked={formData.isPublicCourse}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublicCourse: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 公開設定 */}
        <Card>
          <CardHeader>
            <CardTitle>公開設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>コースを公開</Label>
                <p className="text-sm text-muted-foreground">
                  公開すると受講者がコースを閲覧できるようになります
                </p>
              </div>
              <Switch
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublished: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 保存ボタン */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/courses">キャンセル</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "作成中..." : "作成"}
          </Button>
        </div>
      </form>
    </div>
  );
}
