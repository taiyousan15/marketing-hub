"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, User } from "lucide-react";
import {
  getNewMessagesForTime,
  viewerToUnified,
  simToUnified,
  type ChatMessage,
  type ViewerChatMessage,
  type UnifiedMessage,
} from "@/lib/auto-webinar/chat";

interface LiveChatProps {
  webinarId: string;
  messages: ChatMessage[];       // シミュレートチャット
  currentPosition: number;       // 秒
  chatEnabled?: boolean;
  className?: string;
}

const MESSAGE_TYPE_STYLES: Record<string, string> = {
  COMMENT: "",
  QUESTION: "bg-blue-500/10 border-l-2 border-blue-500",
  REACTION: "text-sm",
  TESTIMONIAL: "bg-green-500/10 border-l-2 border-green-500",
};

const SENDER_NAME_KEY = "viewer_chat_name";
const MAX_VISIBLE = 100;

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

export function LiveChat({
  webinarId,
  messages,
  currentPosition,
  chatEnabled = true,
  className = "",
}: LiveChatProps) {
  // シミュレートチャット表示
  const [simVisible, setSimVisible] = useState<ChatMessage[]>([]);
  const [lastSimPosition, setLastSimPosition] = useState(0);

  // 視聴者コメント（SSEで受信）
  const [viewerMessages, setViewerMessages] = useState<ViewerChatMessage[]>([]);

  // 統合メッセージリスト（表示用）
  const [displayMessages, setDisplayMessages] = useState<UnifiedMessage[]>([]);

  // 入力フォーム
  const [senderName, setSenderName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // localStorage から送信者名を復元
  useEffect(() => {
    const saved = localStorage.getItem(SENDER_NAME_KEY);
    if (saved) setSenderName(saved);
  }, []);

  // SSE 接続
  useEffect(() => {
    if (!chatEnabled) return;

    const es = new EventSource(`/api/auto-webinars/${webinarId}/chat/sse`);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      // 接続確立
    });

    es.addEventListener("init", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { messages: ViewerChatMessage[] };
        setViewerMessages(data.messages);
      } catch {
        // ignore parse error
      }
    });

    es.addEventListener("messages", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { messages: ViewerChatMessage[] };
        if (data.messages.length === 0) return;
        setViewerMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOnes = data.messages.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newOnes];
        });
      } catch {
        // ignore parse error
      }
    });

    es.onerror = () => {
      // SSE エラー時は自動再接続（ブラウザのデフォルト動作）
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [webinarId, chatEnabled]);

  // シミュレートチャット: 再生位置が進んだら新しいメッセージを表示
  useEffect(() => {
    const newMessages = getNewMessagesForTime(messages, currentPosition, lastSimPosition);
    if (newMessages.length === 0) return;

    setSimVisible((prev) => {
      const combined = [...prev, ...newMessages];
      return combined.slice(-MAX_VISIBLE);
    });
    setLastSimPosition(currentPosition);
  }, [currentPosition, messages, lastSimPosition]);

  // シーク（巻き戻し）時のリセット
  useEffect(() => {
    if (currentPosition < lastSimPosition) {
      const until = messages.filter((m) => m.appearAtSeconds <= currentPosition);
      setSimVisible(until.slice(-MAX_VISIBLE));
      setLastSimPosition(currentPosition);
    }
  }, [currentPosition, lastSimPosition, messages]);

  // 統合メッセージを再構築
  useEffect(() => {
    const unified: UnifiedMessage[] = [
      ...simVisible.map(simToUnified),
      ...viewerMessages.map((m, i) => viewerToUnified(m, 1000000 + i)),
    ];

    // appearAtSeconds でソート（同時刻はisViewer=trueを後に）
    unified.sort((a, b) => {
      if (a.appearAtSeconds !== b.appearAtSeconds) {
        return a.appearAtSeconds - b.appearAtSeconds;
      }
      if (a.isViewer !== b.isViewer) return a.isViewer ? 1 : -1;
      return a.order - b.order;
    });

    setDisplayMessages(unified.slice(-MAX_VISIBLE));
  }, [simVisible, viewerMessages]);

  // 自動スクロール
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      }, 80);
    }
  }, [displayMessages]);

  // コメント投稿
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const name = senderName.trim();
      const content = commentText.trim();
      if (!name || !content) return;

      setSendError(null);
      setIsSending(true);

      // 楽観的 UI 更新（即時表示）
      const optimistic: ViewerChatMessage = {
        id: `optimistic-${Date.now()}`,
        autoWebinarId: webinarId,
        senderName: name,
        content,
        appearAtSeconds: Math.floor(currentPosition),
        messageType: "COMMENT",
        createdAt: new Date().toISOString(),
      };
      setViewerMessages((prev) => [...prev, optimistic]);
      setCommentText("");

      // 名前を保存
      localStorage.setItem(SENDER_NAME_KEY, name);

      try {
        const res = await fetch(`/api/auto-webinars/${webinarId}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderName: name,
            content,
            appearAtSeconds: Math.floor(currentPosition),
            messageType: "COMMENT",
          }),
        });

        if (!res.ok) {
          // 楽観的更新をロールバック
          setViewerMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
          setSendError("送信に失敗しました。もう一度お試しください。");
          setCommentText(content); // 内容を復元
        }
      } catch {
        setViewerMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setSendError("ネットワークエラーが発生しました。");
        setCommentText(content);
      } finally {
        setIsSending(false);
      }
    },
    [senderName, commentText, currentPosition, webinarId]
  );

  return (
    <div className={`flex flex-col h-full bg-card rounded-lg border ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <MessageSquare className="w-4 h-4" />
        <span className="font-medium">ライブチャット</span>
        <Badge variant="secondary" className="ml-auto">
          {displayMessages.length}
        </Badge>
      </div>

      {/* メッセージリスト */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {displayMessages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">チャットメッセージがここに表示されます</p>
            </div>
          ) : (
            displayMessages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex gap-2 p-2 rounded-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
                  MESSAGE_TYPE_STYLES[message.messageType] ?? ""
                } ${message.isViewer ? "ring-1 ring-primary/20 bg-primary/5" : ""}`}
              >
                <Avatar className="w-7 h-7 shrink-0">
                  {message.senderAvatar ? (
                    <AvatarImage src={message.senderAvatar} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {getInitials(message.senderName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm truncate">
                      {message.senderName}
                    </span>
                    {message.isViewer && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-primary">
                        視聴者
                      </Badge>
                    )}
                    {message.messageType === "QUESTION" && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                        質問
                      </Badge>
                    )}
                    {message.messageType === "TESTIMONIAL" && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-green-600">
                        感想
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 break-words leading-snug">
                    {message.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* コメント入力フォーム */}
      {chatEnabled && (
        <form onSubmit={handleSubmit} className="border-t p-3 space-y-2 shrink-0">
          {/* 名前入力 */}
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <Input
              placeholder="お名前"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              maxLength={50}
              className="h-7 text-sm"
            />
          </div>

          {/* コメント入力 */}
          <div className="flex gap-2">
            <Textarea
              placeholder="コメントを入力..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              maxLength={500}
              rows={2}
              className="text-sm resize-none min-h-0"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isSending && senderName.trim() && commentText.trim()) {
                    e.currentTarget.form?.requestSubmit();
                  }
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isSending || !senderName.trim() || !commentText.trim()}
              className="shrink-0 h-auto"
              aria-label="送信"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {sendError && (
            <p className="text-xs text-destructive">{sendError}</p>
          )}

          <p className="text-[10px] text-muted-foreground">
            Enter で送信 / Shift+Enter で改行
          </p>
        </form>
      )}
    </div>
  );
}
