"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Users,
  MessageSquare,
  Settings,
  Radio,
  Square,
  Send,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LiveStream {
  id: string;
  eventId: string;
  roomName: string;
  title: string;
  description: string | null;
  status: string;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  peakViewers: number;
  event: {
    id: string;
    name: string;
  };
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

export default function LiveStreamStudioPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const router = useRouter();

  const [livestream, setLivestream] = useState<LiveStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // メディア状態
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // 配信者設定
  const [adminName, setAdminName] = useState("Admin");
  const [tempAdminName, setTempAdminName] = useState("Admin");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    fetchLivestream();
    // チャットポーリング
    const chatInterval = setInterval(fetchChat, 3000);
    return () => clearInterval(chatInterval);
  }, [eventId]);

  const fetchLivestream = async () => {
    try {
      const res = await fetch(`/api/livestream/${eventId}`);
      if (!res.ok) {
        // ライブ配信が未作成の場合は作成
        if (res.status === 404) {
          await createLivestream();
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setLivestream(data.livestream);
      setIsLive(data.livestream.status === "LIVE");
    } catch (error) {
      toast.error("ライブ配信情報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const createLivestream = async () => {
    try {
      const res = await fetch(`/api/livestream/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to create");
      const data = await res.json();
      setLivestream(data.livestream);
    } catch (error) {
      toast.error("ライブ配信の作成に失敗しました");
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

  const startLive = async () => {
    try {
      const res = await fetch(`/api/livestream/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "LIVE" }),
      });
      if (!res.ok) throw new Error("Failed to start");
      setIsLive(true);
      toast.success("ライブ配信を開始しました");
    } catch (error) {
      toast.error("配信開始に失敗しました");
    }
  };

  const endLive = async () => {
    try {
      const res = await fetch(`/api/livestream/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ENDED" }),
      });
      if (!res.ok) throw new Error("Failed to end");
      setIsLive(false);
      toast.success("ライブ配信を終了しました");
    } catch (error) {
      toast.error("配信終了に失敗しました");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`/api/livestream/${eventId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newMessage,
          senderName: adminName,
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

  const deleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(
        `/api/livestream/${eventId}/chat?messageId=${messageId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      fetchChat();
    } catch (error) {
      toast.error("メッセージ削除に失敗しました");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/events">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">ライブ配信スタジオ</h1>
              {isLive && (
                <Badge variant="destructive" className="animate-pulse">
                  <Radio className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {livestream?.title || "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{viewerCount}</span>
          </div>

          {isLive ? (
            <Button variant="destructive" onClick={endLive}>
              <Square className="h-4 w-4 mr-2" />
              配信終了
            </Button>
          ) : (
            <Button onClick={startLive}>
              <Radio className="h-4 w-4 mr-2" />
              配信開始
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* メインビデオエリア */}
        <div className="lg:col-span-3 space-y-4">
          {/* プレビュー */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black flex items-center justify-center">
              {isCameraOn ? (
                <div className="text-white text-center">
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm opacity-75">
                    カメラプレビュー
                  </p>
                  <p className="text-xs opacity-50 mt-1">
                    LiveKit接続後に表示されます
                  </p>
                </div>
              ) : (
                <div className="text-white text-center">
                  <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm opacity-75">カメラOFF</p>
                </div>
              )}
            </div>
          </Card>

          {/* コントロール */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isCameraOn ? "default" : "secondary"}
                  size="lg"
                  onClick={() => setIsCameraOn(!isCameraOn)}
                >
                  {isCameraOn ? (
                    <Video className="h-5 w-5" />
                  ) : (
                    <VideoOff className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant={isMicOn ? "default" : "secondary"}
                  size="lg"
                  onClick={() => setIsMicOn(!isMicOn)}
                >
                  {isMicOn ? (
                    <Mic className="h-5 w-5" />
                  ) : (
                    <MicOff className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  variant={isScreenSharing ? "default" : "outline"}
                  size="lg"
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                >
                  <Monitor className="h-5 w-5" />
                </Button>

                <Separator orientation="vertical" className="h-8" />

                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setTempAdminName(adminName)}
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>配信設定</DialogTitle>
                      <DialogDescription>
                        ライブ配信の設定を変更できます
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminName" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          チャット表示名
                        </Label>
                        <Input
                          id="adminName"
                          value={tempAdminName}
                          onChange={(e) => setTempAdminName(e.target.value)}
                          placeholder="配信者の表示名"
                        />
                        <p className="text-xs text-muted-foreground">
                          チャットでメッセージを送信する際に表示される名前です
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsSettingsOpen(false)}
                      >
                        キャンセル
                      </Button>
                      <Button
                        onClick={() => {
                          setAdminName(tempAdminName);
                          setIsSettingsOpen(false);
                          toast.success("設定を保存しました");
                        }}
                      >
                        保存
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* 配信情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">配信情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ルーム名</p>
                  <p className="font-mono">{livestream?.roomName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ステータス</p>
                  <p>{livestream?.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">録画</p>
                  <p>{livestream?.recordingEnabled ? "有効" : "無効"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">最大視聴者数</p>
                  <p>{livestream?.peakViewers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* チャットサイドバー */}
        <div className="lg:col-span-1">
          <Card className="h-[calc(100vh-220px)] flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  チャット
                </CardTitle>
                <Badge variant="outline">{chatMessages.length}</Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* メッセージ一覧 */}
              <ScrollArea className="flex-1 px-4">
                <div className="space-y-3 py-2">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      チャットメッセージがありません
                    </p>
                  ) : (
                    chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`text-sm group ${
                          msg.isHighlighted ? "bg-yellow-50 p-2 rounded" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-primary">
                            {msg.senderName}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => deleteMessage(msg.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-muted-foreground">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* 入力エリア */}
              <div className="p-4 border-t">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
