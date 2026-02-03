"use client";

import { useState } from "react";
import { CourseAccessMode } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, RefreshCw, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

interface CourseSettingsProps {
  course: {
    id: string;
    accessMode: CourseAccessMode;
    isPublicCourse: boolean;
    shareCode: string | null;
  };
  baseUrl: string;
  onUpdate: (data: {
    accessMode?: CourseAccessMode;
    isPublicCourse?: boolean;
    regenerateCode?: boolean;
  }) => Promise<void>;
}

export function CourseSettings({
  course,
  baseUrl,
  onUpdate,
}: CourseSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const publicUrl = course.shareCode
    ? `${baseUrl}/m/${course.shareCode}`
    : null;

  const handleAccessModeChange = async (mode: CourseAccessMode) => {
    setIsLoading(true);
    try {
      await onUpdate({ accessMode: mode });
      toast.success("アクセスモードを更新しました");
    } catch (error) {
      toast.error("更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublicToggle = async (checked: boolean) => {
    setIsLoading(true);
    try {
      await onUpdate({ isPublicCourse: checked });
      toast.success(
        checked
          ? "公開設定を有効にしました"
          : "公開設定を無効にしました"
      );
    } catch (error) {
      toast.error("更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (
      !confirm(
        "公開URLを再生成すると、以前のURLは使用できなくなります。よろしいですか？"
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate({ regenerateCode: true });
      toast.success("公開URLを再生成しました");
    } catch (error) {
      toast.error("再生成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("URLをコピーしました");
    } catch (error) {
      toast.error("コピーに失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      {/* アクセスモード設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">アクセスモード</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={course.accessMode}
            onValueChange={(value) =>
              handleAccessModeChange(value as CourseAccessMode)
            }
            disabled={isLoading}
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
            {course.accessMode === "PUBLIC"
              ? "すべてのレッスンが、受講者のランクに関係なく視聴できます。"
              : "各レッスンに設定されたランク以上の受講者のみ視聴できます。"}
          </p>
        </CardContent>
      </Card>

      {/* 公開設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">公開設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>リンクを知っている人は誰でもアクセス可</Label>
              <p className="text-sm text-muted-foreground">
                有効にすると、URLを知っている人なら誰でもコースにアクセスできます
              </p>
            </div>
            <Switch
              checked={course.isPublicCourse}
              onCheckedChange={handlePublicToggle}
              disabled={isLoading}
            />
          </div>

          {course.isPublicCourse && publicUrl && (
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium">公開URL</Label>
              <div className="flex gap-2 mt-2">
                <Input value={publicUrl} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  title="コピー"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRegenerateCode}
                  disabled={isLoading}
                  title="再生成"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
