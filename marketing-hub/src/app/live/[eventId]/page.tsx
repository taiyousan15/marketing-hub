"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Radio,
  Users,
  MessageSquare,
  Send,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface LiveStream {
  id: string;
  eventId: string;
  roomName: string;
  title: string;
  description: string | null;
  status: string;
  chatEnabled: boolean;
  scheduledStartAt: string | null;
}

interface ChatMessage {
  id: string;
  senderName: string;
  content: string;
  messageType: string;
  isHighlighted: boolean;
  createdAt: string;
}

export default function PublicLiveViewPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contactId");

  const [livestream, setLivestream] = useState<LiveStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [viewerName, setViewerName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    fetchLivestream();
    const interval = setInterval(() => {
      fetchLivestream();
      fetchChat();
    }, 5000);
    return () => clearInterval(interval);
  }, [eventId]);

  const fetchLivestream = async () => {
    try {
      const res = await fetch(`/api/livestream/${eventId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setLivestream(null);
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setLivestream(data.livestream);
    } catch (error) {
      console.error("Failed to fetch livestream:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChat = async () => {
    try {
      const res = await fetch(`/api/livestream/${eventId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages);
      }
    } catch (error) {
      console.error("Failed to fetch chat:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !viewerName.trim()) return;

    try {
      const res = await fetch(`/api/livestream/${eventId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          senderName: viewerName,
          contactId,
          messageType: "CHAT",
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setNewMessage("");
      fetchChat();
    } catch (error) {
      toast.error("メッセージ送信に失敗しました");
    }
  };

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (viewerName.trim()) {
      setIsNameSet(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // 配信が見つからない場合
  if (!livestream) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <Radio className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h1 className="text-xl font-bold mb-2">配信が見つかりません</h1>
          <p className="text-gray-400">
            このライブ配信は存在しないか、まだ開始されていません
          </p>
        </div>
      </div>
    );
  }

  // 配信開始前
  if (livestream.status === "SCHEDULED") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center max-w-md">
          <Clock className="h-16 w-16 mx-auto mb-4 text-blue-400" />
          <h1 className="text-2xl font-bold mb-2">{livestream.title}</h1>
          <p className="text-gray-400 mb-4">
            配信開始をお待ちください
          </p>
          {livestream.scheduledStartAt && (
            <p className="text-lg">
              開始予定:{" "}
              {new Date(livestream.scheduledStartAt).toLocaleString("ja-JP")}
            </p>
          )}
          {livestream.description && (
            <p className="text-gray-500 mt-4">{livestream.description}</p>
          )}
        </div>
      </div>
    );
  }

  // 配信終了
  if (livestream.status === "ENDED") {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <Radio className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h1 className="text-xl font-bold mb-2">配信終了</h1>
          <p className="text-gray-400">
            このライブ配信は終了しました
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ヘッダー */}
      <header className="border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="destructive" className="animate-pulse">
              <Radio className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
            <h1 className="font-bold">{livestream.title}</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{viewerCount} 視聴中</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* ビデオプレイヤー */}
          <div className="lg:col-span-3">
            <Card className="bg-black border-gray-800 overflow-hidden">
              <div className="aspect-video flex items-center justify-center">
                <div className="text-center">
                  <Radio className="h-16 w-16 mx-auto mb-4 text-red-500 animate-pulse" />
                  <p className="text-gray-400">
                    ライブ配信中
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    LiveKit接続後に映像が表示されます
                  </p>
                </div>
              </div>
            </Card>

            {/* 配信情報 */}
            {livestream.description && (
              <Card className="mt-4 bg-gray-800 border-gray-700">
                <CardContent className="py-4">
                  <p className="text-gray-300">{livestream.description}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* チャット */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-180px)] flex flex-col bg-gray-800 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-white">
                  <MessageSquare className="h-4 w-4" />
                  チャット
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* メッセージ一覧 */}
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-3 py-2">
                    {chatMessages.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-8">
                        最初のメッセージを送ってみましょう！
                      </p>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`text-sm ${
                            msg.isHighlighted
                              ? "bg-yellow-900/30 p-2 rounded"
                              : ""
                          }`}
                        >
                          <span className="font-medium text-blue-400">
                            {msg.senderName}
                          </span>
                          <p className="text-gray-300">{msg.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                {/* 入力エリア */}
                <div className="p-4 border-t border-gray-700">
                  {!isNameSet ? (
                    <form onSubmit={handleSetName} className="space-y-2">
                      <Input
                        value={viewerName}
                        onChange={(e) => setViewerName(e.target.value)}
                        placeholder="表示名を入力..."
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <Button type="submit" className="w-full">
                        チャットに参加
                      </Button>
                    </form>
                  ) : livestream.chatEnabled ? (
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="メッセージを入力..."
                        className="flex-1 bg-gray-700 border-gray-600 text-white"
                      />
                      <Button type="submit" size="icon">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  ) : (
                    <p className="text-sm text-gray-500 text-center">
                      チャットは無効です
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
