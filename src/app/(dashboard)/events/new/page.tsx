"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Users, Video, MapPin, Radio } from "lucide-react";

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

export default function NewEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "seminar",
    date: "",
    time: "",
    isOnline: true,
    location: "",
    meetingUrl: "",
    capacity: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement event creation API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("イベントを作成しました");
      router.push("/events");
    } catch {
      toast.error("イベントの作成に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">新規イベント作成</h1>
          <p className="text-muted-foreground">
            セミナー、個別相談、ウェビナーを作成します
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
              <CardDescription>イベントの基本情報を入力してください</CardDescription>
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
                  placeholder="イベントの説明を入力..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">イベントタイプ *</Label>
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
                    <SelectItem value="seminar">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>セミナー</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="consultation">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>個別相談</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="webinar">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span>ウェビナー</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="livestream">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4" />
                        <span>ライブ配信</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>日時・場所</CardTitle>
              <CardDescription>開催日時と場所を設定してください</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="time">開始時刻 *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>オンライン開催</Label>
                  <p className="text-sm text-muted-foreground">
                    Zoom/Google Meetなどで開催
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
                  <Label htmlFor="meetingUrl">ミーティングURL</Label>
                  <Input
                    id="meetingUrl"
                    placeholder="https://zoom.us/j/..."
                    value={formData.meetingUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingUrl: e.target.value })
                    }
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="location">開催場所</Label>
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

              <div className="space-y-2">
                <Label htmlFor="capacity">定員</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="無制限の場合は空欄"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/events">キャンセル</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "作成中..." : "イベントを作成"}
          </Button>
        </div>
      </form>
    </div>
  );
}
