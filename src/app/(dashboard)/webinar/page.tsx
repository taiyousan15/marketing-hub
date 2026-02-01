"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  Plus,
  Play,
  Users,
  Calendar,
  Clock,
  Settings,
  Copy,
  ExternalLink,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Hand,
  MoreVertical,
  Radio,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

interface Webinar {
  id: string;
  title: string;
  description: string;
  status: "scheduled" | "live" | "ended" | "draft";
  scheduledAt?: Date;
  duration: number; // 分
  hostName: string;
  registrations: number;
  attendees: number;
  recordingUrl?: string;
}

export default function WebinarPage() {
  const [webinars, setWebinars] = useState<Webinar[]>([
    {
      id: "web-001",
      title: "マーケティング自動化の始め方",
      description: "初心者向けにマーケティング自動化の基礎を解説します",
      status: "scheduled",
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      duration: 60,
      hostName: "田中 太郎",
      registrations: 156,
      attendees: 0,
    },
    {
      id: "web-002",
      title: "AIを活用したコンテンツ作成術",
      description: "Claude AIを使った効率的なコンテンツ作成方法",
      status: "live",
      duration: 45,
      hostName: "山田 花子",
      registrations: 89,
      attendees: 72,
    },
    {
      id: "web-003",
      title: "メールマーケティング成功事例",
      description: "開封率を3倍にした実践テクニック",
      status: "ended",
      scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      duration: 90,
      hostName: "佐藤 健一",
      registrations: 234,
      attendees: 187,
      recordingUrl: "/recordings/web-003.mp4",
    },
  ]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);

  // ライブ配信状態
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const getStatusBadge = (status: Webinar["status"]) => {
    const config = {
      scheduled: { label: "予定", variant: "outline" as const, color: "" },
      live: { label: "ライブ中", variant: "default" as const, color: "bg-red-500 animate-pulse" },
      ended: { label: "終了", variant: "secondary" as const, color: "" },
      draft: { label: "下書き", variant: "outline" as const, color: "" },
    };
    const { label, variant, color } = config[status];
    return (
      <Badge variant={variant} className={color}>
        {status === "live" && <Radio className="h-3 w-3 mr-1" />}
        {label}
      </Badge>
    );
  };

  const startLive = (webinar: Webinar) => {
    setSelectedWebinar(webinar);
    setIsLiveOpen(true);
  };

  const copyJoinLink = (webinarId: string) => {
    const link = `${window.location.origin}/webinar/join/${webinarId}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-8 w-8 text-red-500" />
            ウェビナー・ライブ配信
          </h1>
          <p className="text-muted-foreground mt-1">
            ウェビナーの作成・配信・録画管理
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新規ウェビナー
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>新規ウェビナー作成</DialogTitle>
              <DialogDescription>
                ウェビナーの基本情報を入力してください
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>タイトル</Label>
                <Input placeholder="ウェビナーのタイトル" />
              </div>
              <div className="space-y-2">
                <Label>説明</Label>
                <Textarea placeholder="ウェビナーの内容を説明..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>開催日時</Label>
                  <Input type="datetime-local" />
                </div>
                <div className="space-y-2">
                  <Label>予定時間（分）</Label>
                  <Select defaultValue="60">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30分</SelectItem>
                      <SelectItem value="45">45分</SelectItem>
                      <SelectItem value="60">60分</SelectItem>
                      <SelectItem value="90">90分</SelectItem>
                      <SelectItem value="120">120分</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>配信タイプ</Label>
                <Select defaultValue="webinar">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webinar">ウェビナー（視聴者は視聴のみ）</SelectItem>
                    <SelectItem value="meeting">ミーティング（全員参加可能）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                キャンセル
              </Button>
              <Button onClick={() => setIsCreateOpen(false)}>
                作成
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">予定中</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webinars.filter((w) => w.status === "scheduled").length}
            </div>
            <p className="text-xs text-muted-foreground">今後のウェビナー</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ライブ中</CardTitle>
            <Radio className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {webinars.filter((w) => w.status === "live").length}
            </div>
            <p className="text-xs text-muted-foreground">現在配信中</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総登録者</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webinars.reduce((sum, w) => sum + w.registrations, 0)}
            </div>
            <p className="text-xs text-muted-foreground">全ウェビナー合計</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均参加率</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">79.8%</div>
            <p className="text-xs text-muted-foreground">登録者対出席者</p>
          </CardContent>
        </Card>
      </div>

      {/* ウェビナー一覧 */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming">予定・ライブ</TabsTrigger>
          <TabsTrigger value="past">過去のウェビナー</TabsTrigger>
          <TabsTrigger value="draft">下書き</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {webinars
            .filter((w) => w.status === "scheduled" || w.status === "live")
            .map((webinar) => (
              <Card key={webinar.id} className={webinar.status === "live" ? "border-red-500 border-2" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {webinar.title}
                        {getStatusBadge(webinar.status)}
                      </CardTitle>
                      <CardDescription>{webinar.description}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {webinar.status === "live"
                        ? `${webinar.attendees}人視聴中`
                        : `${webinar.registrations}人登録`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {webinar.duration}分
                    </span>
                    {webinar.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {webinar.scheduledAt.toLocaleString("ja-JP")}
                      </span>
                    )}
                    <span>ホスト: {webinar.hostName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {webinar.status === "live" ? (
                      <>
                        <Button onClick={() => startLive(webinar)}>
                          <Video className="h-4 w-4 mr-2" />
                          配信に参加
                        </Button>
                        <Button variant="destructive">
                          配信を終了
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => startLive(webinar)}>
                          <Play className="h-4 w-4 mr-2" />
                          配信を開始
                        </Button>
                        <Button variant="outline" onClick={() => copyJoinLink(webinar.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          参加リンクをコピー
                        </Button>
                      </>
                    )}
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      設定
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {webinars
            .filter((w) => w.status === "ended")
            .map((webinar) => (
              <Card key={webinar.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {webinar.title}
                        {getStatusBadge(webinar.status)}
                      </CardTitle>
                      <CardDescription>{webinar.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {webinar.attendees}/{webinar.registrations}人参加
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {webinar.duration}分
                    </span>
                    {webinar.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {webinar.scheduledAt.toLocaleString("ja-JP")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {webinar.recordingUrl && (
                      <Button variant="outline">
                        <Video className="h-4 w-4 mr-2" />
                        録画を見る
                      </Button>
                    )}
                    <Button variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      分析レポート
                    </Button>
                    <Button variant="outline" onClick={() => copyJoinLink(webinar.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      再利用
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="draft" className="space-y-4">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">下書きはありません</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                新規ウェビナー作成
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ライブ配信ダイアログ */}
      <Dialog open={isLiveOpen} onOpenChange={setIsLiveOpen}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500 animate-pulse" />
              {selectedWebinar?.title}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-4 h-full">
            {/* メイン映像エリア */}
            <div className="col-span-3 bg-black rounded-lg flex items-center justify-center relative">
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge className="bg-red-500">
                  <Radio className="h-3 w-3 mr-1" />
                  LIVE
                </Badge>
                <Badge variant="outline" className="text-white border-white">
                  <Users className="h-3 w-3 mr-1" />
                  {selectedWebinar?.attendees || 0}人視聴中
                </Badge>
              </div>

              <div className="text-white text-center">
                <VideoIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="opacity-75">カメラプレビュー</p>
                <p className="text-sm opacity-50">LiveKit接続中...</p>
              </div>

              {/* コントロールバー */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/80 rounded-full px-4 py-2">
                <Button
                  variant={isMicOn ? "ghost" : "destructive"}
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsMicOn(!isMicOn)}
                >
                  {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant={isVideoOn ? "ghost" : "destructive"}
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsVideoOn(!isVideoOn)}
                >
                  {isVideoOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant={isScreenSharing ? "default" : "ghost"}
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsScreenSharing(!isScreenSharing)}
                >
                  <MonitorUp className="h-5 w-5" />
                </Button>
                <div className="w-px h-6 bg-gray-600" />
                <Button variant="destructive" size="sm" className="rounded-full">
                  配信終了
                </Button>
              </div>
            </div>

            {/* サイドパネル */}
            <div className="flex flex-col gap-4">
              {/* チャット */}
              <Card className="flex-1">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    チャット
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="h-40 overflow-y-auto space-y-2 text-sm">
                    <div className="bg-muted p-2 rounded">
                      <span className="font-medium">田中:</span> こんにちは！
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <span className="font-medium">山田:</span> 質問があります
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input placeholder="メッセージを入力..." className="text-sm" />
                    <Button size="sm">送信</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Q&A / 挙手 */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Hand className="h-4 w-4" />
                    Q&A (3)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                      <span>価格について質問</span>
                      <Button size="sm" variant="ghost">回答</Button>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>デモを見たい</span>
                      <Button size="sm" variant="ghost">回答</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 参加者 */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    参加者 ({selectedWebinar?.attendees || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-1 text-sm max-h-24 overflow-y-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                        田
                      </div>
                      <span>田中 太郎</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                        山
                      </div>
                      <span>山田 花子</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
