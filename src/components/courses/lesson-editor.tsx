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
import { VideoUploader } from "./video-uploader";
import { ThumbnailUploader } from "./thumbnail-uploader";
import { Save, ArrowRight, Play } from "lucide-react";

interface LessonEditorProps {
  lesson: {
    id: string;
    name: string;
    description: string | null;
    videoUrl: string | null;
    videoFileUrl?: string | null;
    thumbnailUrl?: string | null;
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
    videoFileUrl: lesson.videoFileUrl || "",
    thumbnailUrl: lesson.thumbnailUrl || "",
    videoType: lesson.videoType || "YOUTUBE",
    duration: lesson.duration || 0,
    isPublished: lesson.isPublished,
    releaseDelay: lesson.releaseDelay,
    requiredRank: lesson.requiredRank,
    isSequentialStart: lesson.isSequentialStart,
    requireCompletion: lesson.requireCompletion,
    completionThreshold: lesson.completionThreshold,
  });

  const [uploading, setUploading] = useState(false);
  const rankOptions = getRankOptions();

  // 実際に使用される動画URLを取得
  const getVideoUrl = () => {
    return formData.videoFileUrl || formData.videoUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoUrl = getVideoUrl();

    await onSave({
      ...formData,
      description: formData.description || null,
      videoUrl: formData.videoFileUrl ? formData.videoFileUrl : formData.videoUrl || null,
      videoFileUrl: formData.videoFileUrl || null,
      thumbnailUrl: formData.thumbnailUrl || null,
      videoType: formData.videoType as VideoType,
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

      {/* サムネイル設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">サムネイル</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ThumbnailUploader
            value={formData.thumbnailUrl}
            onChange={(url) =>
              setFormData({ ...formData, thumbnailUrl: url })
            }
          />
        </CardContent>
      </Card>

      {/* 動画設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">動画設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 動画タイプ選択 */}
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

          {/* 動画入力 */}
          <div className="space-y-4">
            <VideoUploader
              value={getVideoUrl()}
              onChange={(url) => {
                if (formData.videoType === "UPLOAD") {
                  setFormData({ ...formData, videoFileUrl: url });
                } else {
                  setFormData({ ...formData, videoUrl: url });
                }
              }}
              onUploadStart={() => setUploading(true)}
              onUploadEnd={() => setUploading(false)}
            />
          </div>

          {/* プレビュー */}
          {getVideoUrl() && (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Play className="h-4 w-4" />
                <Label className="text-sm font-medium">プレビュー</Label>
              </div>

              {formData.videoType === "YOUTUBE" && getVideoUrl() && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${extractYouTubeId(getVideoUrl())}`}
                    title="YouTube video preview"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {formData.videoType === "VIMEO" && getVideoUrl() && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={`https://player.vimeo.com/video/${extractVimeoId(getVideoUrl())}`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {formData.videoType === "UPLOAD" && getVideoUrl() && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    width="100%"
                    height="100%"
                    controls
                    className="w-full h-full"
                  >
                    <source src={getVideoUrl()} type="video/mp4" />
                    ブラウザが動画の再生に対応していません
                  </video>
                </div>
              )}
            </div>
          )}
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
        <Button type="submit" disabled={isLoading || uploading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading || uploading ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}

// ヘルパー関数
function extractYouTubeId(url: string): string {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
  );
  return match ? match[1] : "";
}

function extractVimeoId(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : "";
}
