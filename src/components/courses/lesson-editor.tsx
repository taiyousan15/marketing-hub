"use client";

import { useState } from "react";
import { MemberRank, VideoType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRankOptions, RankBadge } from "./rank-badge";
import { Save, ArrowRight } from "lucide-react";

interface LessonEditorProps {
  lesson: {
    id: string;
    name: string;
    description: string | null;
    videoUrl: string | null;
    videoType: VideoType | null;
    duration: number | null;
    isPublished: boolean;
    releaseDelay: number;
    requiredRank: MemberRank;
    isSequentialStart: boolean;
    requireCompletion: boolean;
    completionThreshold: number;
  };
  onSave: (data: Partial<LessonEditorProps["lesson"]>) => Promise<void>;
  isLoading?: boolean;
}

export function LessonEditor({ lesson, onSave, isLoading }: LessonEditorProps) {
  const [formData, setFormData] = useState({
    name: lesson.name,
    description: lesson.description || "",
    videoUrl: lesson.videoUrl || "",
    videoType: lesson.videoType || "YOUTUBE",
    duration: lesson.duration || 0,
    isPublished: lesson.isPublished,
    releaseDelay: lesson.releaseDelay,
    requiredRank: lesson.requiredRank,
    isSequentialStart: lesson.isSequentialStart,
    requireCompletion: lesson.requireCompletion,
    completionThreshold: lesson.completionThreshold,
  });

  const rankOptions = getRankOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      ...formData,
      description: formData.description || null,
      videoUrl: formData.videoUrl || null,
      videoType: formData.videoUrl ? (formData.videoType as VideoType) : null,
      duration: formData.duration || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">レッスン名</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="レッスン名を入力"
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
              placeholder="レッスンの説明（任意）"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>公開</Label>
              <p className="text-sm text-muted-foreground">
                このレッスンを受講者に表示する
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

      {/* 動画設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">動画設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="videoType">動画タイプ</Label>
              <Select
                value={formData.videoType}
                onValueChange={(value) =>
                  setFormData({ ...formData, videoType: value as VideoType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YOUTUBE">YouTube</SelectItem>
                  <SelectItem value="VIMEO">Vimeo</SelectItem>
                  <SelectItem value="UPLOAD">アップロード</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">動画の長さ（秒）</Label>
              <Input
                id="duration"
                type="number"
                min={0}
                value={formData.duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">動画URL</Label>
            <Input
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) =>
                setFormData({ ...formData, videoUrl: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      {/* ランク設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">必要ランク</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>このレッスンを視聴するために必要なランク</Label>
            <Select
              value={formData.requiredRank}
              onValueChange={(value) =>
                setFormData({ ...formData, requiredRank: value as MemberRank })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rankOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <RankBadge rank={formData.requiredRank} />
            <span className="text-sm text-muted-foreground">
              以上の受講者が視聴可能
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 順次視聴設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            順次視聴設定
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>ここから順番に視聴が必要</Label>
              <p className="text-sm text-muted-foreground">
                このレッスン以降は順番に視聴する必要があります
              </p>
            </div>
            <Switch
              checked={formData.isSequentialStart}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isSequentialStart: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>この動画の完了が次へ進む条件</Label>
              <p className="text-sm text-muted-foreground">
                このレッスンを完了しないと次のレッスンに進めません
              </p>
            </div>
            <Switch
              checked={formData.requireCompletion}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, requireCompletion: checked })
              }
            />
          </div>

          {formData.requireCompletion && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label>完了判定</Label>
                <span className="text-sm font-medium">
                  {formData.completionThreshold}% 以上視聴で完了
                </span>
              </div>
              <Slider
                value={[formData.completionThreshold]}
                onValueChange={([value]) =>
                  setFormData({ ...formData, completionThreshold: value })
                }
                min={10}
                max={100}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                動画の何%を視聴したら完了とみなすかを設定します
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
