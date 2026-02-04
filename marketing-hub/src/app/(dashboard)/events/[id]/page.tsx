"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  Globe,
  Radio,
  Edit,
  Trash2,
  Play,
  Copy,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  _count: {
    registrations: number;
  };
}

const typeConfig: Record<string, { label: string; color: string }> = {
  SEMINAR: { label: "セミナー", color: "bg-blue-100 text-blue-800" },
  CONSULTATION: { label: "個別相談", color: "bg-green-100 text-green-800" },
  WEBINAR: { label: "ウェビナー", color: "bg-purple-100 text-purple-800" },
  LIVESTREAM: { label: "ライブ配信", color: "bg-red-100 text-red-800" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  DRAFT: { label: "下書き", variant: "secondary" },
  SCHEDULED: { label: "予定", variant: "default" },
  IN_PROGRESS: { label: "開催中", variant: "default" },
  COMPLETED: { label: "完了", variant: "secondary" },
  CANCELED: { label: "キャンセル", variant: "destructive" },
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${params.id}`);
        if (!response.ok) {
          throw new Error("Event not found");
        }
        const data = await response.json();
        setEvent(data.event);
      } catch {
        toast.error("イベントが見つかりません");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("このイベントを削除しますか？")) return;

    try {
      const response = await fetch(`/api/events/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("イベントを削除しました");
      router.push("/events");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">イベントが見つかりません</p>
        <Button asChild className="mt-4">
          <Link href="/events">イベント一覧に戻る</Link>
        </Button>
      </div>
    );
  }

  const type = typeConfig[event.type] || { label: event.type, color: "bg-gray-100 text-gray-800" };
  const status = statusConfig[event.status] || { label: event.status, variant: "secondary" as const };
  const startDate = new Date(event.startAt);
  const endDate = new Date(event.endAt);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className={`px-2 py-1 rounded-full text-xs ${type.color}`}>
                {type.label}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {startDate.toLocaleDateString("ja-JP")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {startDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} -
                {endDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.type === "LIVESTREAM" && event.status === "SCHEDULED" && (
            <Button asChild>
              <Link href={`/livestream/${event.id}/studio`}>
                <Play className="mr-2 h-4 w-4" />
                配信を開始
              </Link>
            </Button>
          )}
          <Button variant="outline" size="icon" asChild>
            <Link href={`/events/${event.id}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">申込者数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event._count.registrations}
              {event.capacity && (
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}/ {event.capacity}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">開催形式</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {event.type === "LIVESTREAM" ? (
                <>
                  <Radio className="h-5 w-5 text-red-500" />
                  <span>ライブ配信</span>
                </>
              ) : event.isOnline ? (
                <>
                  <Globe className="h-5 w-5 text-blue-500" />
                  <span>オンライン</span>
                </>
              ) : (
                <>
                  <MapPin className="h-5 w-5" />
                  <span>会場開催</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">定員</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.capacity ? `${event.capacity}名` : "制限なし"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">残り枠</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {event.capacity
                ? Math.max(0, event.capacity - event._count.registrations)
                : "∞"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* タブコンテンツ */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">詳細</TabsTrigger>
          <TabsTrigger value="registrations">申込者一覧</TabsTrigger>
          <TabsTrigger value="settings">設定</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>イベント情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">説明</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium mb-1">開催日時</h4>
                  <p className="text-sm">
                    {startDate.toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {startDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} -
                    {endDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>開催場所</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.isOnline ? (
                  <>
                    <div className="flex items-center gap-2 text-blue-600">
                      <Globe className="h-5 w-5" />
                      <span>オンライン開催</span>
                    </div>
                    {event.meetingUrl && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">会議URL</h4>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                            {event.meetingUrl}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              navigator.clipboard.writeText(event.meetingUrl!);
                              toast.success("URLをコピーしました");
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      <span>会場開催</span>
                    </div>
                    {event.location && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">会場</h4>
                        <p className="text-sm">{event.location}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle>申込者一覧</CardTitle>
              <CardDescription>
                {event._count.registrations}名が申込済み
              </CardDescription>
            </CardHeader>
            <CardContent>
              {event._count.registrations === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>まだ申込者がいません</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名前</TableHead>
                      <TableHead>メール</TableHead>
                      <TableHead>申込日時</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        申込者データを読み込み中...
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>イベント設定</CardTitle>
              <CardDescription>
                イベントの詳細設定を変更できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                設定機能は開発中です
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
