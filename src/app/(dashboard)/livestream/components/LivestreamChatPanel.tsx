"use client";

import { useState, useEffect, useCallback } from "react";
import { Pin, Star, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  senderName: string;
  content: string;
  messageType: string;
  isHighlighted: boolean;
  isPinned: boolean;
  createdAt: string;
}

interface LivestreamChatPanelProps {
  eventId: string;
  livestreamId: string;
}

export function LivestreamChatPanel({
  eventId,
}: LivestreamChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/livestream/${eventId}/chat`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      toast.error("チャットメッセージの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleModerate = async (
    messageId: string,
    action: "pin" | "unpin" | "highlight" | "unhighlight"
  ) => {
    try {
      const res = await fetch(
        `/api/livestream/${eventId}/chat/moderate`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, action }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "モデレーション失敗");
      }
      const { message: updated } = await res.json();
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, ...updated } : m))
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "モデレーションに失敗しました"
      );
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("このメッセージを削除しますか？")) return;
    try {
      const res = await fetch(
        `/api/livestream/${eventId}/chat?messageId=${messageId}`,
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) throw new Error("削除失敗");
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("メッセージを削除しました");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        チャットメッセージがありません
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          チャットメッセージ ({messages.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchMessages}
          className="h-6 px-2 text-xs"
        >
          更新
        </Button>
      </div>
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex items-start gap-2 p-2 rounded text-sm ${
            msg.isPinned
              ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
              : msg.isHighlighted
              ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
              : "bg-white dark:bg-background border border-border"
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-medium text-xs">{msg.senderName}</span>
              {msg.isPinned && (
                <Pin className="h-3 w-3 text-yellow-600" />
              )}
              {msg.isHighlighted && (
                <Star className="h-3 w-3 text-blue-600" />
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(msg.createdAt).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="mt-0.5 break-words">{msg.content}</p>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title={msg.isPinned ? "ピン解除" : "ピン留め"}
              onClick={() =>
                handleModerate(msg.id, msg.isPinned ? "unpin" : "pin")
              }
            >
              <Pin
                className={`h-3 w-3 ${
                  msg.isPinned ? "text-yellow-600" : "text-muted-foreground"
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title={msg.isHighlighted ? "ハイライト解除" : "ハイライト"}
              onClick={() =>
                handleModerate(
                  msg.id,
                  msg.isHighlighted ? "unhighlight" : "highlight"
                )
              }
            >
              <Star
                className={`h-3 w-3 ${
                  msg.isHighlighted
                    ? "text-blue-600"
                    : "text-muted-foreground"
                }`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-600 hover:text-red-700"
              title="削除"
              onClick={() => handleDelete(msg.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
