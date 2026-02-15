"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Copy,
  Trash2,
  Calendar,
  Users,
  Video,
  MapPin,
  Radio,
  Play,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

const sampleEvents = [
  {
    id: "1",
    name: "無料マーケティングセミナー",
    type: "seminar",
    date: "2025-02-15",
    time: "14:00",
    isOnline: true,
    capacity: 100,
    registrations: 45,
    status: "scheduled",
  },
  {
    id: "2",
    name: "個別相談会",
    type: "consultation",
    date: "2025-02-10",
    time: "10:00",
    isOnline: true,
    capacity: 1,
    registrations: 1,
    status: "scheduled",
  },
  {
    id: "3",
    name: "マーケティング実践ライブ配信",
    type: "livestream",
    date: "2025-02-05",
    time: "19:00",
    isOnline: true,
    capacity: null,
    registrations: 156,
    status: "scheduled",
  },
  {
    id: "4",
    name: "オンラインウェビナー",
    type: "webinar",
    date: "2025-02-20",
    time: "20:00",
    isOnline: true,
    capacity: null,
    registrations: 234,
    status: "scheduled",
  },
  {
    id: "5",
    name: "Q&Aライブセッション",
    type: "livestream",
    date: "2025-02-12",
    time: "21:00",
    isOnline: true,
    capacity: null,
    registrations: 89,
    status: "scheduled",
  },
];

const typeConfig = {
  seminar: { label: "セミナー", color: "bg-blue-100 text-blue-800" },
  consultation: { label: "個別相談", color: "bg-green-100 text-green-800" },
  webinar: { label: "ウェビナー", color: "bg-purple-100 text-purple-800" },
  livestream: { label: "ライブ配信", color: "bg-red-100 text-red-800" },
};

const statusConfig = {
  draft: { label: "下書き", variant: "secondary" as const },
  scheduled: { label: "予定", variant: "default" as const },
  in_progress: { label: "開催中", variant: "default" as const },
  completed: { label: "完了", variant: "secondary" as const },
  canceled: { label: "キャンセル", variant: "destructive" as const },
};

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = sampleEvents.filter((event) =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingEvents = sampleEvents.filter((e) => e.status === "scheduled").length;
  const totalRegistrations = sampleEvents.reduce((sum, e) => sum + e.registrations, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">イベント・予約</h1>
          <p className="text-muted-foreground">
            セミナー、個別相談、ウェビナーを管理します
          </p>
        </div>
        <Button asChild>
          <Link href="/events/new">
            <Plus className="mr-2 h-4 w-4" />
            新規イベント作成
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予定イベント</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総申込数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月のイベント</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sampleEvents.filter((e) => e.date.startsWith("2025-02")).length}
            </div>
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                    イベントが見つかりません
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => {
                  const type = typeConfig[event.type as keyof typeof typeConfig];
                  const status = statusConfig[event.status as keyof typeof statusConfig];
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Link
                          href={"/events/" + event.id}
                          className="font-medium hover:underline"
                        >
                          {event.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className={"px-2 py-1 rounded-full text-xs " + type.color}>
                          {type.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{event.date}</p>
                          <p className="text-xs text-muted-foreground">{event.time}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.type === "livestream" ? (
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
                        {event.registrations}
                        {event.capacity && " / " + event.capacity}
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
                              <Link href={"/events/" + event.id}>
                                <Edit className="mr-2 h-4 w-4" />
                                編集
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              申込者一覧
                            </DropdownMenuItem>
                            {event.type === "livestream" && event.status === "scheduled" && (
                              <DropdownMenuItem asChild>
                                <Link href={"/livestream/" + event.id + "/studio"}>
                                  <Play className="mr-2 h-4 w-4" />
                                  配信を開始
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              複製
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
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
        </CardContent>
      </Card>
    </div>
  );
}
