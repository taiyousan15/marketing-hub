"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Radio,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Play,
  Square,
  Trash2,
  MessageSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LivestreamChatPanel } from "./components/LivestreamChatPanel";

interface LivestreamItem {
  id: string;
  name: string;
  description: string | null;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELED";
  startAt: string;
  endAt: string | null;
  platform: string;
  chatEnabled: boolean;
  recordingEnabled: boolean;
  eventId: string | null;
  event: { id: string; name: string } | null;
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  SCHEDULED: {
    label: "予定",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  LIVE: {
    label: "配信中",
    className:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse",
  },
  COMPLETED: {
    label: "完了",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  CANCELED: {
    label: "キャンセル",
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
};

const nextStatus: Record<
  "SCHEDULED" | "LIVE",
  "LIVE" | "COMPLETED"
> = {
  SCHEDULED: "LIVE",
  LIVE: "COMPLETED",
};

const nextStatusLabel: Record<"SCHEDULED" | "LIVE", string> = {
  SCHEDULED: "配信を開始",
  LIVE: "配信を停止",
};

interface CreateFormState {
  name: string;
  description: string;
  startAt: string;
  chatEnabled: boolean;
  recordingEnabled: boolean;
}


const defaultForm: CreateFormState = {
  name: "",
  description: "",
  startAt: "",
  chatEnabled: true,
  recordingEnabled: false,
};

export default function LivestreamPage() {
  const [livestreams, setLivestreams] = useState<LivestreamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateFormState>(defaultForm);
  const [creating, setCreating] = useState(false);
  const [expandedChat, setExpandedChat] = useState<string | null>(null);

  const fetchLivestreams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/livestream");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setLivestreams(data.livestreams ?? []);
    } catch {
      toast.error("ライブ配信一覧の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLivestreams();
  }, [fetchLivestreams]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast.error("配信名を入力してください");
      return;
    }
    if (!form.startAt) {
      toast.error("開始日時を入力してください");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/livestream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          startAt: new Date(form.startAt).toISOString(),
          chatEnabled: form.chatEnabled,
          recordingEnabled: form.recordingEnabled,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "作成失敗");
      }
      toast.success("ライブ配信を作成しました");
      setForm(defaultForm);
      setShowCreateForm(false);
      await fetchLivestreams();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "作成に失敗しました"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (
    livestream: LivestreamItem,
    newStatus: "LIVE" | "COMPLETED"
  ) => {
    const routeId = livestream.eventId ?? livestream.id;
    const endpoint = livestream.eventId
      ? `/api/livestream/${routeId}`
      : `/api/livestream/${routeId}`;

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "更新失敗");
      }
      toast.success(
        newStatus === "LIVE" ? "配信を開始しました" : "配信を停止しました"
      );
      await fetchLivestreams();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ステータス更新に失敗しました"
      );
    }
  };

  const handleDelete = async (livestream: LivestreamItem) => {
    if (!confirm(`「${livestream.name}」を削除しますか？`)) return;
    try {
      const routeId = livestream.eventId ?? livestream.id;
      const res = await fetch(`/api/livestream/${routeId}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        throw new Error("削除失敗");
      }
      toast.success("ライブ配信を削除しました");
      setLivestreams((prev) => prev.filter((ls) => ls.id !== livestream.id));
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  const liveCount = livestreams.filter((ls) => ls.status === "LIVE").length;
  const scheduledCount = livestreams.filter(
    (ls) => ls.status === "SCHEDULED"
  ).length;
  const completedCount = livestreams.filter(
    (ls) => ls.status === "COMPLETED"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ライブ配信管理</h1>
          <p className="text-muted-foreground">
            ライブ配信の作成・管理・チャットモデレーション
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLivestreams}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            更新
          </Button>
          <Button onClick={() => setShowCreateForm((prev) => !prev)}>
            <Plus className="mr-2 h-4 w-4" />
            新規配信作成
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">配信中</CardTitle>
            <Radio className="h-4 w-4 text-red-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予定</CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完了</CardTitle>
            <Square className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">新規ライブ配信を作成</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ls-name">配信名 *</Label>
                <Input
                  id="ls-name"
                  placeholder="例: 商品紹介ライブ"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ls-startAt">開始日時 *</Label>
                <Input
                  id="ls-startAt"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, startAt: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ls-description">説明</Label>
              <Textarea
                id="ls-description"
                placeholder="配信の説明（任意）"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.chatEnabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      chatEnabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">チャット有効</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.recordingEnabled}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      recordingEnabled: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">録画有効</span>
              </label>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button onClick={handleCreate} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                作成する
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setForm(defaultForm);
                }}
                disabled={creating}
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>配信名</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>開始日時</TableHead>
                  <TableHead>チャット</TableHead>
                  <TableHead>録画</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {livestreams.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      ライブ配信がありません
                    </TableCell>
                  </TableRow>
                ) : (
                  livestreams.map((ls) => {
                    const sc = statusConfig[ls.status] ?? {
                      label: ls.status,
                      className: "",
                    };
                    const startDate = new Date(ls.startAt);
                    const canChangeStatus =
                      ls.status === "SCHEDULED" || ls.status === "LIVE";

                    return (
                      <>
                        <TableRow key={ls.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{ls.name}</p>
                              {ls.event && (
                                <p className="text-xs text-muted-foreground">
                                  イベント: {ls.event.name}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={sc.className}>{sc.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p>
                                {startDate.toLocaleDateString("ja-JP")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {startDate.toLocaleTimeString("ja-JP", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                ls.chatEnabled
                                  ? "text-green-600 text-sm"
                                  : "text-muted-foreground text-sm"
                              }
                            >
                              {ls.chatEnabled ? "有効" : "無効"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                ls.recordingEnabled
                                  ? "text-green-600 text-sm"
                                  : "text-muted-foreground text-sm"
                              }
                            >
                              {ls.recordingEnabled ? "有効" : "無効"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {canChangeStatus && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleStatusChange(
                                      ls,
                                      nextStatus[ls.status as "SCHEDULED" | "LIVE"]
                                    )
                                  }
                                >
                                  {ls.status === "LIVE" ? (
                                    <Square className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Play className="h-3 w-3 mr-1" />
                                  )}
                                  {nextStatusLabel[ls.status as "SCHEDULED" | "LIVE"]}
                                </Button>
                              )}
                              {ls.chatEnabled && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedChat(
                                      expandedChat === ls.id ? null : ls.id
                                    )
                                  }
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  チャット
                                  {expandedChat === ls.id ? (
                                    <ChevronUp className="h-3 w-3 ml-1" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDelete(ls)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedChat === ls.id && ls.eventId && (
                          <TableRow key={`${ls.id}-chat`}>
                            <TableCell colSpan={6} className="p-0">
                              <div className="border-t bg-muted/30 p-4">
                                <LivestreamChatPanel
                                  eventId={ls.eventId}
                                  livestreamId={ls.id}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
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
