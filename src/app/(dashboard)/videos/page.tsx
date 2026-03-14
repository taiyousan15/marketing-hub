"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Video,
  Lock,
  Unlock,
  Play,
  Loader2,
  RefreshCw,
  Users,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface VideoItem {
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
  views: number;
  createdAt: string;
  _count: { gates: number };
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "下書き", variant: "secondary" },
  PUBLISHED: { label: "公開中", variant: "default" },
  ARCHIVED: { label: "アーカイブ", variant: "outline" },
};

const gateTypeLabels: Record<string, string> = {
  EMAIL: "メールのみ",
  EMAIL_NAME: "メール+名前",
  EMAIL_PHONE: "メール+電話",
};

function formatDuration(seconds: number | null): string {
  if (!seconds) return "–";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newGateEnabled, setNewGateEnabled] = useState(false);
  const [newGateType, setNewGateType] = useState("EMAIL");
  const [newGateTitle, setNewGateTitle] = useState("");

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/videos");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setVideos(data.videos ?? []);
    } catch {
      toast.error("動画の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleCreate = async () => {
    if (!newTitle || !newVideoUrl) {
      toast.error("タイトルとURL（または埋め込みコード）は必須です");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || null,
          videoUrl: newVideoUrl,
          gateEnabled: newGateEnabled,
          gateType: newGateType,
          gateTitle: newGateTitle || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      const data = await res.json();
      setVideos(prev => [data.video, ...prev]);
      toast.success("動画を作成しました");
      setCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewVideoUrl("");
      setNewGateEnabled(false);
      setNewGateType("EMAIL");
      setNewGateTitle("");
    } catch {
      toast.error("作成に失敗しました");
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (video: VideoItem) => {
    const newStatus = video.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setVideos(prev => prev.map(v => v.id === video.id ? { ...v, ...data.video } : v));
      toast.success(newStatus === "PUBLISHED" ? "公開しました" : "非公開にしました");
    } catch {
      toast.error("更新に失敗しました");
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("この動画を削除しますか？")) return;
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("動画を削除しました");
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  const filteredVideos = videos.filter(v =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
  const publishedCount = videos.filter(v => v.status === "PUBLISHED").length;
  const gatedCount = videos.filter(v => v.gateEnabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">動画管理</h1>
          <p className="text-muted-foreground">
            動画コンテンツとメールゲートを管理します
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchVideos} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            更新
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            動画を追加
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">総再生回数</span>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">公開中</span>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-sm font-medium">ゲート設定済み</span>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gatedCount}</div>
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
                placeholder="動画名で検索..."
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
                  <TableHead>タイトル</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>ゲート</TableHead>
                  <TableHead>再生数</TableHead>
                  <TableHead>リード数</TableHead>
                  <TableHead>尺</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {searchQuery ? "動画が見つかりません" : (
                        <div className="space-y-2">
                          <p>動画がありません</p>
                          <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            最初の動画を追加
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVideos.map(video => {
                    const status = statusConfig[video.status] ?? { label: video.status, variant: "secondary" as const };
                    return (
                      <TableRow key={video.id}>
                        <TableCell>
                          <Link href={`/videos/${video.id}`} className="font-medium hover:underline">
                            {video.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {video.gateEnabled ? (
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Lock className="h-3 w-3" />
                              <span>{gateTypeLabels[video.gateType] ?? video.gateType}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Unlock className="h-3 w-3" />
                              <span>なし</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Play className="h-3 w-3 text-muted-foreground" />
                            {video.views.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {video._count.gates}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDuration(video.duration)}
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
                                <Link href={`/videos/${video.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  詳細・編集
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => togglePublish(video)}>
                                {video.status === "PUBLISHED" ? (
                                  <><Unlock className="mr-2 h-4 w-4" />非公開にする</>
                                ) : (
                                  <><Play className="mr-2 h-4 w-4" />公開する</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => deleteVideo(video.id)}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>動画を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="newTitle">タイトル *</Label>
              <Input
                id="newTitle"
                placeholder="動画タイトル"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newVideoUrl">動画URL / 埋め込みURL *</Label>
              <Input
                id="newVideoUrl"
                placeholder="https://vimeo.com/... または YouTube URL"
                value={newVideoUrl}
                onChange={e => setNewVideoUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newDescription">説明</Label>
              <Textarea
                id="newDescription"
                rows={3}
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>メールゲート</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  視聴前に情報入力を求める
                </p>
              </div>
              <Switch
                checked={newGateEnabled}
                onCheckedChange={setNewGateEnabled}
              />
            </div>
            {newGateEnabled && (
              <>
                <div className="space-y-2">
                  <Label>収集する情報</Label>
                  <Select value={newGateType} onValueChange={setNewGateType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">メールのみ</SelectItem>
                      <SelectItem value="EMAIL_NAME">メール + 名前</SelectItem>
                      <SelectItem value="EMAIL_PHONE">メール + 電話番号</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newGateTitle">ゲートタイトル（任意）</Label>
                  <Input
                    id="newGateTitle"
                    placeholder="例: 無料で視聴する"
                    value={newGateTitle}
                    onChange={e => setNewGateTitle(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              作成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
