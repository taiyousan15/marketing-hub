"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { detectVideoType } from "@/lib/auto-webinar/playback";
import { Save, ArrowLeft, Video, Settings, Users, Gift } from "lucide-react";

interface AutoWebinarFormData {
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  videoType: "YOUTUBE" | "VIMEO" | "UPLOAD";
  videoDuration: number;
  scheduleType: "JUST_IN_TIME" | "RECURRING" | "SPECIFIC_DATES" | "ON_DEMAND";
  justInTimeDelayMinutes: number;
  fakeAttendeesEnabled: boolean;
  fakeAttendeesMin: number;
  fakeAttendeesMax: number;
  simulatedChatEnabled: boolean;
  userChatEnabled: boolean;
  replayEnabled: boolean;
  replayExpiresAfterHours: number | null;
}

interface AutoWebinarFormProps {
  initialData?: Partial<AutoWebinarFormData> & { id?: string };
  mode: "create" | "edit";
}

export function AutoWebinarForm({ initialData, mode }: AutoWebinarFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [formData, setFormData] = useState<AutoWebinarFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    thumbnail: initialData?.thumbnail || "",
    videoUrl: initialData?.videoUrl || "",
    videoType: initialData?.videoType || "YOUTUBE",
    videoDuration: initialData?.videoDuration || 0,
    scheduleType: initialData?.scheduleType || "JUST_IN_TIME",
    justInTimeDelayMinutes: initialData?.justInTimeDelayMinutes || 15,
    fakeAttendeesEnabled: initialData?.fakeAttendeesEnabled ?? true,
    fakeAttendeesMin: initialData?.fakeAttendeesMin || 50,
    fakeAttendeesMax: initialData?.fakeAttendeesMax || 200,
    simulatedChatEnabled: initialData?.simulatedChatEnabled ?? true,
    userChatEnabled: initialData?.userChatEnabled ?? false,
    replayEnabled: initialData?.replayEnabled ?? true,
    replayExpiresAfterHours: initialData?.replayExpiresAfterHours || 48,
  });

  const handleVideoUrlChange = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      videoUrl: url,
      videoType: detectVideoType(url),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === "create"
        ? "/api/auto-webinars"
        : `/api/auto-webinars/${initialData?.id}`;

      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to save webinar");
      }

      const data = await res.json();
      router.push(`/auto-webinar/${data.webinar.id}`);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const parseDuration = (str: string): number => {
    const parts = str.split(":").map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return parseInt(str) || 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {mode === "create" ? "新規ウェビナー作成" : "ウェビナー編集"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? "オートウェビナーの基本設定を入力してください"
                : formData.title}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? "保存中..." : "保存"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Video className="w-4 h-4" />
            基本設定
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            スケジュール
          </TabsTrigger>
          <TabsTrigger value="simulation" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            シミュレーション
          </TabsTrigger>
          <TabsTrigger value="replay" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            リプレイ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>
                ウェビナーのタイトルと動画を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">タイトル *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="ウェビナーのタイトルを入力"
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
                  placeholder="ウェビナーの説明を入力"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">動画URL *</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="YouTubeまたはVimeoのURL"
                  required
                />
                {formData.videoUrl && (
                  <p className="text-sm text-muted-foreground">
                    検出されたタイプ: {formData.videoType}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="videoDuration">動画の長さ *</Label>
                  <Input
                    id="videoDuration"
                    value={formatDuration(formData.videoDuration)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        videoDuration: parseDuration(e.target.value),
                      })
                    }
                    placeholder="1:30:00 または 90:00"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    形式: HH:MM:SS または MM:SS
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">サムネイルURL</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) =>
                      setFormData({ ...formData, thumbnail: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>スケジュール設定</CardTitle>
              <CardDescription>
                視聴者がウェビナーに参加できるタイミングを設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scheduleType">スケジュールタイプ</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      scheduleType: value as typeof formData.scheduleType,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JUST_IN_TIME">
                      Just-In-Time（登録後すぐ開始）
                    </SelectItem>
                    <SelectItem value="RECURRING">
                      定期開催（毎週特定の曜日・時間）
                    </SelectItem>
                    <SelectItem value="SPECIFIC_DATES">
                      特定日時
                    </SelectItem>
                    <SelectItem value="ON_DEMAND">
                      オンデマンド（いつでも視聴可能）
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.scheduleType === "JUST_IN_TIME" && (
                <div className="space-y-2">
                  <Label htmlFor="justInTimeDelay">
                    登録から開始までの時間（分）
                  </Label>
                  <Input
                    id="justInTimeDelay"
                    type="number"
                    value={formData.justInTimeDelayMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        justInTimeDelayMinutes: parseInt(e.target.value) || 15,
                      })
                    }
                    min={1}
                    max={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    推奨: 10〜15分（視聴者が準備する時間）
                  </p>
                </div>
              )}

              {formData.scheduleType === "RECURRING" && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    定期開催の詳細設定は保存後に設定できます
                  </p>
                </div>
              )}

              {formData.scheduleType === "SPECIFIC_DATES" && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    特定日時の設定は保存後に設定できます
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>参加者シミュレーション</CardTitle>
              <CardDescription>
                擬似ライブ感を演出するための設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>参加者数表示</Label>
                  <p className="text-sm text-muted-foreground">
                    視聴中の参加者数を表示します
                  </p>
                </div>
                <Switch
                  checked={formData.fakeAttendeesEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, fakeAttendeesEnabled: checked })
                  }
                />
              </div>

              {formData.fakeAttendeesEnabled && (
                <div className="grid grid-cols-2 gap-4 pl-4 border-l-2">
                  <div className="space-y-2">
                    <Label>最小参加者数</Label>
                    <Input
                      type="number"
                      value={formData.fakeAttendeesMin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fakeAttendeesMin: parseInt(e.target.value) || 50,
                        })
                      }
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>最大参加者数</Label>
                    <Input
                      type="number"
                      value={formData.fakeAttendeesMax}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fakeAttendeesMax: parseInt(e.target.value) || 200,
                        })
                      }
                      min={1}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label>シミュレートチャット</Label>
                  <p className="text-sm text-muted-foreground">
                    事前設定したチャットメッセージを表示します
                  </p>
                </div>
                <Switch
                  checked={formData.simulatedChatEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, simulatedChatEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>ユーザーチャット</Label>
                  <p className="text-sm text-muted-foreground">
                    視聴者がチャットを送信できます（準備中）
                  </p>
                </div>
                <Switch
                  checked={formData.userChatEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, userChatEnabled: checked })
                  }
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="replay" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>リプレイ設定</CardTitle>
              <CardDescription>
                ライブ終了後のリプレイ視聴を設定します
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>リプレイを有効にする</Label>
                  <p className="text-sm text-muted-foreground">
                    ライブ終了後も視聴可能にします
                  </p>
                </div>
                <Switch
                  checked={formData.replayEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, replayEnabled: checked })
                  }
                />
              </div>

              {formData.replayEnabled && (
                <div className="space-y-2 pl-4 border-l-2">
                  <Label>リプレイ有効期限（時間）</Label>
                  <Input
                    type="number"
                    value={formData.replayExpiresAfterHours || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        replayExpiresAfterHours: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="無期限の場合は空欄"
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    空欄の場合は無期限でリプレイ可能
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
