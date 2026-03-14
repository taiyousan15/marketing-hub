"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Lock,
  Unlock,
  Play,
  Users,
  Mail,
  Phone,
  User,
  Copy,
  CheckCheck,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface GateEntry {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  watchedAt: string;
}

interface VideoDetail {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number | null;
  status: string;
  gateEnabled: boolean;
  gateType: string;
  gateTitle: string | null;
  gateButtonLabel: string | null;
  views: number;
  createdAt: string;
  _count: { gates: number };
  gates: GateEntry[];
}

const statusOptions = [
  { value: "DRAFT", label: "下書き" },
  { value: "PUBLISHED", label: "公開中" },
  { value: "ARCHIVED", label: "アーカイブ" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "下書き", variant: "secondary" },
  PUBLISHED: { label: "公開中", variant: "default" },
  ARCHIVED: { label: "アーカイブ", variant: "outline" },
};

export default function VideoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [gateEnabled, setGateEnabled] = useState(false);
  const [gateType, setGateType] = useState("EMAIL");
  const [gateTitle, setGateTitle] = useState("");
  const [gateButtonLabel, setGateButtonLabel] = useState("");

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`/api/videos/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error("動画が見つかりません");
            router.push("/videos");
            return;
          }
          throw new Error("Failed to fetch");
        }
        const data = await res.json();
        const v = data.video as VideoDetail;
        setVideo(v);
        setTitle(v.title);
        setDescription(v.description ?? "");
        setVideoUrl(v.videoUrl);
        setThumbnailUrl(v.thumbnailUrl ?? "");
        setStatus(v.status);
        setGateEnabled(v.gateEnabled);
        setGateType(v.gateType);
        setGateTitle(v.gateTitle ?? "");
        setGateButtonLabel(v.gateButtonLabel ?? "");
      } catch {
        toast.error("動画の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id, router]);

  const handleSave = async () => {
    if (!video) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/videos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          videoUrl,
          thumbnailUrl: thumbnailUrl || null,
          status,
          gateEnabled,
          gateType,
          gateTitle: gateTitle || null,
          gateButtonLabel: gateButtonLabel || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      setVideo(prev => prev ? { ...prev, ...data.video } : null);
      toast.success("保存しました");
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("この動画を削除しますか？")) return;
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("削除しました");
      router.push("/videos");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  const copyEmbedCode = () => {
    if (!video) return;
    const embedUrl = `${window.location.origin}/watch/${video.id}`;
    navigator.clipboard.writeText(embedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("視聴URLをコピーしました");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">動画が見つかりません</p>
        <Button asChild variant="outline">
          <Link href="/videos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            動画一覧に戻る
          </Link>
        </Button>
      </div>
    );
  }

  const statusConf = statusConfig[video.status] ?? { label: video.status, variant: "secondary" as const };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/videos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{video.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
              {video.gateEnabled && (
                <div className="flex items-center gap-1 text-xs text-amber-600">
                  <Lock className="h-3 w-3" />
                  ゲート設定済み
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={copyEmbedCode}>
            {copied ? <CheckCheck className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
            視聴URLコピー
          </Button>
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
          <TabsTrigger value="gate">
            ゲート設定
          </TabsTrigger>
          <TabsTrigger value="leads">
            リード ({video._count.gates})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle>動画情報</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">タイトル</Label>
                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videoUrl">動画URL</Label>
                    <Input
                      id="videoUrl"
                      placeholder="https://vimeo.com/... または YouTube URL"
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thumbnailUrl">サムネイルURL（任意）</Label>
                    <Input
                      id="thumbnailUrl"
                      placeholder="https://..."
                      value={thumbnailUrl}
                      onChange={e => setThumbnailUrl(e.target.value)}
                    />
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
                <CardHeader><CardTitle>統計</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Play className="h-4 w-4 text-muted-foreground" />
                    <span>再生数: {video.views.toLocaleString()}回</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>リード数: {video._count.gates}件</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gate" className="mt-4">
          <Card>
            <CardHeader><CardTitle>メールゲート設定</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>ゲートを有効にする</Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    視聴前にフォーム入力を求めます
                  </p>
                </div>
                <Switch
                  checked={gateEnabled}
                  onCheckedChange={setGateEnabled}
                />
              </div>

              {gateEnabled && (
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label>収集する情報</Label>
                    <Select value={gateType} onValueChange={setGateType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMAIL">メールアドレスのみ</SelectItem>
                        <SelectItem value="EMAIL_NAME">メール + 名前</SelectItem>
                        <SelectItem value="EMAIL_PHONE">メール + 電話番号</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gateTitle">ゲートタイトル</Label>
                    <Input
                      id="gateTitle"
                      placeholder="例: 無料で動画を視聴する"
                      value={gateTitle}
                      onChange={e => setGateTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gateButtonLabel">ボタンテキスト</Label>
                    <Input
                      id="gateButtonLabel"
                      placeholder="例: 今すぐ視聴する"
                      value={gateButtonLabel}
                      onChange={e => setGateButtonLabel(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {video.gates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  まだリードはいません
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>メール</TableHead>
                      <TableHead>名前</TableHead>
                      <TableHead>電話</TableHead>
                      <TableHead>視聴日時</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {video.gates.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {entry.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.name ? (
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {entry.name}
                            </div>
                          ) : "–"}
                        </TableCell>
                        <TableCell>
                          {entry.phone ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {entry.phone}
                            </div>
                          ) : "–"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(entry.watchedAt).toLocaleString("ja-JP")}
                        </TableCell>
                      </TableRow>
                    ))}
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
