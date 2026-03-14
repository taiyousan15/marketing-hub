"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Users,
  Video,
  MapPin,
  Radio,
  Save,
  Trash2,
  Loader2,
  Mail,
  Phone,
  Play,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Registration {
  id: string;
  status: string;
  registeredAt: string;
  contact: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface EventDetail {
  id: string;
  name: string;
  description: string | null;
  type: string;
  startAt: string;
  endAt: string;
  isOnline: boolean;
  location: string | null;
  meetingUrl: string | null;
  capacity: number | null;
  status: string;
  _count: { registrations: number };
  registrations: Registration[];
}

const typeConfig: Record<string, { label: string; color: string }> = {
  SEMINAR: { label: "セミナー", color: "bg-blue-100 text-blue-800" },
  CONSULTATION: { label: "個別相談", color: "bg-green-100 text-green-800" },
  WEBINAR: { label: "ウェビナー", color: "bg-purple-100 text-purple-800" },
  LIVESTREAM: { label: "ライブ配信", color: "bg-red-100 text-red-800" },
};

const statusOptions = [
  { value: "DRAFT", label: "下書き" },
  { value: "SCHEDULED", label: "予定" },
  { value: "IN_PROGRESS", label: "開催中" },
  { value: "COMPLETED", label: "完了" },
  { value: "CANCELED", label: "キャンセル" },
];

const registrationStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  REGISTERED: { label: "登録済", variant: "default" },
  CONFIRMED: { label: "確認済", variant: "default" },
  ATTENDED: { label: "出席", variant: "outline" },
  NO_SHOW: { label: "欠席", variant: "secondary" },
  CANCELED: { label: "キャンセル", variant: "destructive" },
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState("SCHEDULED");
  const [meetingUrl, setMeetingUrl] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`)
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("イベントが見つかりません")
            router.push("/events")
            return
          }
          throw new Error("Failed to fetch")
        }
        const data = await res.json()
        const e = data.event as EventDetail
        setEvent(e)
        setName(e.name)
        setDescription(e.description ?? "")
        setMeetingUrl(e.meetingUrl ?? "")
        setStatus(e.status)

        const start = new Date(e.startAt)
        const end = new Date(e.endAt)
        setStartDate(start.toISOString().split("T")[0])
        setStartTime(start.toTimeString().slice(0, 5))
        setEndTime(end.toTimeString().slice(0, 5))
      } catch {
        toast.error("イベントの取得に失敗しました")
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [id, router])

  const handleSave = async () => {
    if (!event) return
    setSaving(true)
    try {
      const startAt = new Date(`${startDate}T${startTime}:00`).toISOString()
      const endAt = new Date(`${startDate}T${endTime}:00`).toISOString()

      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null, startAt, endAt, meetingUrl: meetingUrl || null, status }),
      })

      if (!res.ok) throw new Error("Failed to save")
      const data = await res.json()
      setEvent(prev => prev ? { ...prev, ...data.event } : null)
      toast.success("イベントを保存しました")
    } catch {
      toast.error("保存に失敗しました")
    } finally {
      setSaving(false)
    }
  };

  const handleDelete = async () => {
    if (!confirm("このイベントを削除しますか？")) return;
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("イベントを削除しました")
      router.push("/events")
    } catch {
      toast.error("削除に失敗しました")
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">イベントが見つかりません</p>
        <Button asChild variant="outline">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            イベント一覧に戻る
          </Link>
        </Button>
      </div>
    );
  }

  const type = typeConfig[event.type] ?? { label: event.type, color: "bg-gray-100 text-gray-800" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-1 rounded-full text-xs ${type.color}`}>
                {type.label}
              </span>
              <Badge variant="outline">
                {statusOptions.find(s => s.value === event.status)?.label ?? event.status}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.type === "LIVESTREAM" && event.status === "SCHEDULED" && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/livestream/${event.id}/studio`}>
                <Play className="mr-2 h-4 w-4 text-red-500" />
                配信開始
              </Link>
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            保存
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基本情報</TabsTrigger>
          <TabsTrigger value="registrations">
            申込者 ({event._count.registrations})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle>基本情報</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">イベント名</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">開催日</Label>
                      <Input id="date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startTime">開始時間</Label>
                      <Input id="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endTime">終了時間</Label>
                      <Input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">説明</Label>
                    <Textarea
                      id="description"
                      rows={4}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                  {event.isOnline && event.type !== "LIVESTREAM" && (
                    <div className="space-y-2">
                      <Label htmlFor="meetingUrl">ミーティングURL</Label>
                      <Input
                        id="meetingUrl"
                        type="url"
                        placeholder="https://zoom.us/j/..."
                        value={meetingUrl}
                        onChange={e => setMeetingUrl(e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle>ステータス</CardTitle></CardHeader>
                <CardContent>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>参加状況</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>申込数: {event._count.registrations}名</span>
                  </div>
                  {event.capacity && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>定員: {event.capacity}名</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    {event.type === "LIVESTREAM" ? (
                      <><Radio className="h-4 w-4 text-red-500" /><span>ライブ配信</span></>
                    ) : event.isOnline ? (
                      <><Video className="h-4 w-4 text-blue-500" /><span>オンライン</span></>
                    ) : (
                      <><MapPin className="h-4 w-4 text-muted-foreground" /><span>会場: {event.location}</span></>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="registrations" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {event.registrations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">申込者はまだいません</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>名前</TableHead>
                      <TableHead>メール</TableHead>
                      <TableHead>電話</TableHead>
                      <TableHead>申込日</TableHead>
                      <TableHead>ステータス</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.registrations.map(reg => {
                      const regStatus = registrationStatusConfig[reg.status] ?? { label: reg.status, variant: "secondary" as const };
                      return (
                        <TableRow key={reg.id}>
                          <TableCell>
                            <Link href={`/contacts/${reg.contact.id}`} className="font-medium hover:underline">
                              {reg.contact.name ?? "（未設定）"}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {reg.contact.email ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {reg.contact.email}
                              </div>
                            ) : "–"}
                          </TableCell>
                          <TableCell>
                            {reg.contact.phone ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {reg.contact.phone}
                              </div>
                            ) : "–"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(reg.registeredAt).toLocaleDateString("ja-JP")}
                          </TableCell>
                          <TableCell>
                            <Badge variant={regStatus.variant}>{regStatus.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
