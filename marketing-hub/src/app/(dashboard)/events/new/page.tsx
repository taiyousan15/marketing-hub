"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Users,
  Video,
  Radio,
  MessageSquare,
  MapPin,
  Globe,
  Clock,
  Check,
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
import { toast } from "sonner";

const eventTypes = [
  {
    id: "SEMINAR",
    name: "セミナー",
    description: "複数参加者向けの講座・勉強会",
    icon: Users,
    color: "bg-blue-100 text-blue-600 border-blue-200",
    features: ["定員設定可能", "申込管理", "出席確認"],
  },
  {
    id: "CONSULTATION",
    name: "個別相談会",
    description: "1対1の相談・コンサルティング",
    icon: MessageSquare,
    color: "bg-green-100 text-green-600 border-green-200",
    features: ["1対1形式", "予約枠管理", "カレンダー連携"],
  },
  {
    id: "LIVESTREAM",
    name: "ライブ配信",
    description: "リアルタイム動画配信",
    icon: Radio,
    color: "bg-red-100 text-red-600 border-red-200",
    features: ["リアルタイム配信", "チャット機能", "アーカイブ保存"],
  },
  {
    id: "WEBINAR",
    name: "ウェビナー",
    description: "オンラインセミナー・ウェブ会議",
    icon: Video,
    color: "bg-purple-100 text-purple-600 border-purple-200",
    features: ["画面共有", "Q&A機能", "参加者管理"],
  },
];

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    isOnline: true,
    location: "",
    meetingUrl: "",
    capacity: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      toast.error("イベントタイプを選択してください");
      return;
    }

    if (!formData.name || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error("必須項目を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const startAt = new Date(`${formData.date}T${formData.startTime}:00`);
      const endAt = new Date(`${formData.date}T${formData.endTime}:00`);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          type: selectedType,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          isOnline: formData.isOnline,
          location: formData.isOnline ? null : formData.location,
          meetingUrl: formData.isOnline ? formData.meetingUrl : null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const data = await response.json();

      toast.success("イベントを作成しました");

      router.push(`/events/${data.event.id}`);
    } catch {
      toast.error("作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeInfo = eventTypes.find((t) => t.id === selectedType);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新規イベント作成</h1>
          <p className="text-muted-foreground">
            イベントタイプを選択して詳細を設定してください
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* イベントタイプ選択 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">イベントタイプを選択</CardTitle>
            <CardDescription>
              開催するイベントの種類を選んでください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {eventTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className={`inline-flex p-2 rounded-lg ${type.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-3 font-semibold">{type.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {type.description}
                    </p>
                    <div className="mt-3 space-y-1">
                      {type.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-1 text-xs text-muted-foreground"
                        >
                          <Check className="h-3 w-3" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">基本情報</CardTitle>
            <CardDescription>イベントの名前と説明を入力してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">イベント名 *</Label>
              <Input
                id="name"
                placeholder="例: 無料マーケティングセミナー"
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
                placeholder="イベントの詳細な説明..."
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* 日時設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              日時設定
            </CardTitle>
            <CardDescription>開催日時を設定してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="date">開催日 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">開始時間 *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">終了時間 *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 開催形式 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {formData.isOnline ? (
                <Globe className="h-5 w-5" />
              ) : (
                <MapPin className="h-5 w-5" />
              )}
              開催形式
            </CardTitle>
            <CardDescription>オンラインまたは会場での開催を選択</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>オンライン開催</Label>
                <p className="text-sm text-muted-foreground">
                  Zoom、Google Meet等でのオンライン開催
                </p>
              </div>
              <Switch
                checked={formData.isOnline}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isOnline: checked })
                }
              />
            </div>

            {formData.isOnline ? (
              <div className="space-y-2">
                <Label htmlFor="meetingUrl">会議URL</Label>
                <Input
                  id="meetingUrl"
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={formData.meetingUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, meetingUrl: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  参加者に送信される会議URLを入力してください
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="location">会場</Label>
                <Input
                  id="location"
                  placeholder="例: 東京都渋谷区..."
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 定員設定（セミナー・ウェビナーの場合） */}
        {(selectedType === "SEMINAR" || selectedType === "WEBINAR" || selectedType === "CONSULTATION") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                定員設定
              </CardTitle>
              <CardDescription>
                {selectedType === "CONSULTATION"
                  ? "個別相談は通常1名です"
                  : "参加人数の上限を設定できます"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="capacity">定員</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder={selectedType === "CONSULTATION" ? "1" : "例: 100"}
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  空欄の場合は定員なし（ライブ配信向け）
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 選択したタイプのプレビュー */}
        {selectedTypeInfo && (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">作成するイベント</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${selectedTypeInfo.color}`}>
                  <selectedTypeInfo.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold">
                    {formData.name || "イベント名未設定"}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formData.date || "日付未設定"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formData.startTime || "--:--"} - {formData.endTime || "--:--"}
                    </span>
                    {formData.capacity && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        定員 {formData.capacity}名
                      </span>
                    )}
                  </div>
                  <div className="pt-2">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs ${selectedTypeInfo.color}`}
                    >
                      {selectedTypeInfo.name}
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
            <Link href="/events">キャンセル</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting || !selectedType}>
            {isSubmitting ? "作成中..." : "イベントを作成"}
          </Button>
        </div>
      </form>
    </div>
  );
}
