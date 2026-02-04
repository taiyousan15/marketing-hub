"use client";

import { useState, useEffect, use } from "react";
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
  Loader2,
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

interface Event {
  id: string;
  name: string;
  description: string | null;
  type: string;
  startAt: string;
  endAt: string;
  timezone: string;
  location: string | null;
  isOnline: boolean;
  meetingUrl: string | null;
  capacity: number | null;
  status: string;
}

const eventTypes = [
  { id: "SEMINAR", name: "セミナー", icon: Users },
  { id: "CONSULTATION", name: "個別相談会", icon: MessageSquare },
  { id: "LIVESTREAM", name: "ライブ配信", icon: Radio },
  { id: "WEBINAR", name: "ウェビナー", icon: Video },
];

const statusOptions = [
  { id: "DRAFT", name: "下書き" },
  { id: "SCHEDULED", name: "予定" },
  { id: "IN_PROGRESS", name: "開催中" },
  { id: "COMPLETED", name: "完了" },
  { id: "CANCELED", name: "キャンセル" },
];

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    date: "",
    startTime: "",
    endTime: "",
    isOnline: true,
    location: "",
    meetingUrl: "",
    capacity: "",
    status: "",
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) {
          throw new Error("Event not found");
        }
        const data = await response.json();
        const event: Event = data.event;

        const startDate = new Date(event.startAt);
        const endDate = new Date(event.endAt);

        setFormData({
          name: event.name,
          description: event.description || "",
          type: event.type,
          date: startDate.toISOString().split("T")[0],
          startTime: startDate.toTimeString().slice(0, 5),
          endTime: endDate.toTimeString().slice(0, 5),
          isOnline: event.isOnline,
          location: event.location || "",
          meetingUrl: event.meetingUrl || "",
          capacity: event.capacity?.toString() || "",
          status: event.status,
        });
      } catch {
        toast.error("イベントが見つかりません");
        router.push("/events");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error("必須項目を入力してください");
      return;
    }

    setIsSubmitting(true);

    try {
      const startAt = new Date(`${formData.date}T${formData.startTime}:00`);
      const endAt = new Date(`${formData.date}T${formData.endTime}:00`);

      const response = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          type: formData.type,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          isOnline: formData.isOnline,
          location: formData.isOnline ? null : formData.location,
          meetingUrl: formData.isOnline ? formData.meetingUrl : null,
          capacity: formData.capacity ? parseInt(formData.capacity) : null,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      toast.success("イベントを更新しました");
      router.push(`/events/${id}`);
    } catch {
      toast.error("更新に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href={`/events/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">イベント編集</h1>
          <p className="text-muted-foreground">
            イベントの詳細を編集します
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">イベントタイプ</Label>
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
                    {eventTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">ステータス</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

        {/* 定員設定 */}
        {(formData.type === "SEMINAR" || formData.type === "WEBINAR" || formData.type === "CONSULTATION") && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                定員設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="capacity">定員</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  空欄の場合は定員なし
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 送信ボタン */}
        <div className="flex items-center justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href={`/events/${id}`}>キャンセル</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "更新中..." : "イベントを更新"}
          </Button>
        </div>
      </form>
    </div>
  );
}
