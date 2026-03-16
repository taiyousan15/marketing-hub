"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
} from "react";
import { Radio, MessageSquare, Send, User, Pin } from "lucide-react";
import { TimedOffersContainer } from "@/components/auto-webinar/viewer/timed-offer-popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TimedOfferData {
  id: string;
  title: string;
  description: string | null;
  buttonText: string;
  buttonUrl: string | null;
  actionType?: string;
  appearAtSeconds: number;
  hideAtSeconds: number | null;
  popupPosition?: string;
  countdownEnabled: boolean;
  countdownSeconds: number | null;
  limitedSeats: number | null;
  liffId?: string | null;
  surveyUrl?: string | null;
}

export interface PublicLiveStream {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startAt: string;
  chatEnabled: boolean;
  timedOffers?: TimedOfferData[];
}

interface ChatMessage {
  id: string;
  senderName: string;
  content: string;
  messageType: string;
  isHighlighted: boolean;
  isPinned: boolean;
  createdAt: string;
}

interface ViewerRoomProps {
  eventId: string;
  livestream: PublicLiveStream;
  contactId?: string | null;
}

const SENDER_NAME_KEY = "livestream_viewer_name";
const POLL_INTERVAL_MS = 3000;

function getInitials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ViewerRoom({ eventId, livestream, contactId }: ViewerRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [senderName, setSenderName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // localStorage から送信者名を復元
  useEffect(() => {
    const saved = localStorage.getItem(SENDER_NAME_KEY);
    if (saved) setSenderName(saved);
  }, []);

  // 配信開始からの経過秒数を追跡（ポップアップ表示タイミング用）
  useEffect(() => {
    if (livestream.status !== "LIVE") return;

    const streamStart = new Date(livestream.startAt).getTime();
    const calcElapsed = () =>
      Math.max(0, Math.floor((Date.now() - streamStart) / 1000));

    setElapsedSeconds(calcElapsed());
    elapsedRef.current = setInterval(() => {
      setElapsedSeconds(calcElapsed());
    }, 1000);

    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [livestream.status, livestream.startAt]);

  const timedOffers = Array.isArray(livestream.timedOffers)
    ? livestream.timedOffers
    : [];

  const handleOfferClick = useCallback((offerId: string) => {
    console.debug("Offer clicked:", offerId);
  }, []);

  // チャットメッセージ取得
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/livestream/${eventId}/public-chat`);
      if (!res.ok) return;
      const data = await res.json() as { messages: ChatMessage[] };
      setMessages(data.messages);
    } catch (error) {
      console.error("チャットメッセージ取得エラー:", error);
    }
  }, [eventId]);

  // ポーリング開始
  useEffect(() => {
    if (!livestream.chatEnabled) return;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages, livestream.chatEnabled]);

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
  }, [messages]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const name = senderName.trim();
      const content = messageText.trim();
      if (!name || !content || isSending) return;

      setSendError(null);
      setIsSending(true);

      // 楽観的 UI 更新
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        senderName: name,
        content,
        messageType: "CHAT",
        isHighlighted: false,
        isPinned: false,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setMessageText("");
      localStorage.setItem(SENDER_NAME_KEY, name);

      try {
        const res = await fetch(`/api/livestream/${eventId}/public-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, senderName: name, contactId }),
        });

        if (!res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
          setSendError("送信に失敗しました。もう一度お試しください。");
          setMessageText(content);
        } else {
          // 即時更新
          await fetchMessages();
        }
      } catch (error) {
        console.error("メッセージ送信エラー:", error);
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setSendError("ネットワークエラーが発生しました。");
        setMessageText(content);
      } finally {
        setIsSending(false);
      }
    },
    [senderName, messageText, isSending, eventId, contactId, fetchMessages]
  );

  const pinnedMessages = messages.filter((m) => m.isPinned);
  const regularMessages = messages.filter((m) => !m.isPinned);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* ビデオエリア (70%) */}
      <div className="w-full lg:w-[70%] flex flex-col bg-black">
        <div className="relative w-full aspect-video lg:aspect-auto lg:flex-1 flex items-center justify-center">
          <VideoPlaceholder />
          {timedOffers.length > 0 && livestream.status === "LIVE" && (
            <TimedOffersContainer
              offers={timedOffers as Parameters<typeof TimedOffersContainer>[0]["offers"]}
              currentPosition={elapsedSeconds}
              videoDuration={0}
              onOfferClick={handleOfferClick}
            />
          )}
        </div>

        {/* 配信説明 */}
        {livestream.description && (
          <div className="px-4 py-3 bg-gray-900 border-t border-gray-800 shrink-0">
            <p className="text-sm text-gray-400 leading-relaxed">
              {livestream.description}
            </p>
          </div>
        )}
      </div>

      {/* チャットエリア (30%) */}
      <div className="w-full lg:w-[30%] flex flex-col bg-gray-900 border-l border-gray-800 min-h-[360px] lg:min-h-0">
        {/* ヘッダー */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 shrink-0">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-white text-sm">ライブチャット</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {messages.length}
          </Badge>
        </div>

        {/* ピン留めメッセージ */}
        {pinnedMessages.length > 0 && (
          <div className="px-3 py-2 bg-yellow-900/20 border-b border-yellow-800/40 shrink-0">
            {pinnedMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2 text-xs">
                <Pin className="w-3 h-3 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-yellow-300">
                    {msg.senderName}
                  </span>
                  <p className="text-yellow-100/80">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* メッセージ一覧 */}
        <ScrollArea className="flex-1 p-3" ref={scrollRef}>
          <div className="space-y-3">
            {regularMessages.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-500">
                  最初のメッセージを送ってみましょう！
                </p>
              </div>
            ) : (
              regularMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${
                    msg.isHighlighted
                      ? "bg-yellow-900/20 border-l-2 border-yellow-500 pl-2 rounded-r"
                      : ""
                  }`}
                >
                  <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px] bg-gray-700 text-gray-300">
                      {getInitials(msg.senderName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-medium text-blue-400 truncate">
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] text-gray-600 shrink-0">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 break-words leading-snug">
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* チャット入力フォーム */}
        {livestream.chatEnabled ? (
          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-800 p-3 space-y-2 shrink-0"
          >
            {/* 名前入力 */}
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <Input
                placeholder="お名前"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                maxLength={50}
                className="h-7 text-sm bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            {/* メッセージ入力 */}
            <div className="flex gap-2">
              <Textarea
                placeholder="メッセージを入力..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                maxLength={500}
                rows={2}
                className="text-sm resize-none bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSending && senderName.trim() && messageText.trim()) {
                      e.currentTarget.form?.requestSubmit();
                    }
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSending || !senderName.trim() || !messageText.trim()}
                className="shrink-0 h-auto"
                aria-label="送信"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {sendError && (
              <p className="text-xs text-red-400">{sendError}</p>
            )}
            <p className="text-[10px] text-gray-600">
              Enter で送信 / Shift+Enter で改行
            </p>
          </form>
        ) : (
          <div className="border-t border-gray-800 p-4 shrink-0">
            <p className="text-sm text-gray-500 text-center">
              チャットは無効です
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function VideoPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6">
      <Radio className="w-16 h-16 text-red-500 animate-pulse mb-4" />
      <p className="text-gray-400 text-sm">LiveKitに接続中...</p>
      <p className="text-xs text-gray-600 mt-2">
        @livekit/components-react をインストールすると映像が表示されます
      </p>
    </div>
  );
}
