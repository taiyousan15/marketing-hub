"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Calendar,
  Users,
  Video,
  MapPin,
  Radio,
  Play,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface EventItem {
  id: string;
  name: string;
  type: string;
  startAt: string;
  endAt: string;
  isOnline: boolean;
  capacity: number | null;
  status: string;
  _count: { registrations: number };
}

const typeConfig: Record<string, { label: string; color: string }> = {
  SEMINAR: { label: "セミナー", color: "bg-blue-100 text-blue-800" },
  CONSULTATION: { label: "個別相談", color: "bg-green-100 text-green-800" },
  WEBINAR: { label: "ウェビナー", color: "bg-purple-100 text-purple-800" },
  LIVESTREAM: { label: "ライブ配信", color: "bg-red-100 text-red-800" },
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "下書き", variant: "secondary" },
  SCHEDULED: { label: "予定", variant: "default" },
  IN_PROGRESS: { label: "開催中", variant: "default" },
  COMPLETED: { label: "完了", variant: "secondary" },
  CANCELED: { label: "キャンセル", variant: "destructive" },
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      toast.error("イベントの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const deleteEvent = async (id: string) => {
    if (!confirm("このイベントを削除しますか？")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("イベントを削除しました");
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  const filteredEvents = events.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingCount = events.filter(e => e.status === "SCHEDULED").length;
  const totalRegistrations = events.reduce((sum, e) => sum + e._count.registrations, 0);
  const thisMonthCount = events.filter(e => {
    const d = new Date(e.startAt);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">イベント・予約</h1>
          <p className="text-muted-foreground">
            セミナー、個別相談、ウェビナーを管理します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            更新
          </Button>
          <Button asChild>
            <Link href="/events/new">
              <Plus className="mr-2 h-4 w-4" />
              新規イベント作成
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">予定イベント</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">総申込数</span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">今月のイベント</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="イベント名で検索..."
                className="pl-8"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>イベント名</TableHead>
                  <TableHead>タイプ</TableHead>
                  <TableHead>日時</TableHead>
                  <TableHead>形式</TableHead>
                  <TableHead>申込</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {searchQuery ? "イベントが見つかりません" : (
                        <div className="space-y-2">
                          <p>イベントがありません</p>
                          <Button asChild size="sm" variant="outline">
                            <Link href="/events/new">
                              <Plus className="mr-2 h-4 w-4" />
                              最初のイベントを作成
                            </Link>
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map(event => {
                    const type = typeConfig[event.type] ?? { label: event.type, color: "bg-gray-100 text-gray-800" };
                    const status = statusConfig[event.status] ?? { label: event.status, variant: "secondary" as const };
                    const startDate = new Date(event.startAt);

                    return (
                      <TableRow key={event.id}>
                        <TableCell>
                          <Link href={`/events/${event.id}`} className="font-medium hover:underline">
                            {event.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${type.color}`}>
                            {type.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{startDate.toLocaleDateString("ja-JP")}</p>
                            <p className="text-xs text-muted-foreground">
                              {startDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {event.type === "LIVESTREAM" ? (
                            <div className="flex items-center gap-1 text-red-600">
                              <Radio className="h-4 w-4" />
                              <span>ライブ</span>
                            </div>
                          ) : event.isOnline ? (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Video className="h-4 w-4" />
                              <span>オンライン</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>会場</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {event._count.registrations}
                          {event.capacity ? ` / ${event.capacity}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/events/${event.id}`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  編集
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/events/${event.id}?tab=registrations`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  申込者一覧
                                </Link>
                              </DropdownMenuItem>
                              {event.type === "LIVESTREAM" && event.status === "SCHEDULED" && (
                                <DropdownMenuItem asChild>
                                  <Link href={`/livestream/${event.id}/studio`}>
                                    <Play className="mr-2 h-4 w-4" />
                                    配信を開始
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteEvent(event.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                削除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
