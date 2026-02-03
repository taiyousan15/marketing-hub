"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  AutoWebinarForm,
  SimulatedChatEditor,
  TimedOfferEditor,
  RewardEditor,
  NotificationSettingsEditor,
  VideoTimeline,
  ABTestEditor,
} from "@/components/auto-webinar/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Play,
  Pause,
  Archive,
  ExternalLink,
  Settings,
  MessageSquare,
  Gift,
  BarChart3,
  Copy,
  Trophy,
  Bell,
  Clock,
  FlaskConical,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface AutoWebinar {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  videoUrl: string;
  videoType: string;
  videoDuration: number;
  scheduleType: string;
  justInTimeDelayMinutes: number;
  recurringSchedule: unknown;
  specificDates: unknown;
  fakeAttendeesEnabled: boolean;
  fakeAttendeesMin: number;
  fakeAttendeesMax: number;
  simulatedChatEnabled: boolean;
  userChatEnabled: boolean;
  replayEnabled: boolean;
  replayExpiresAfterHours: number | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  _count: {
    registrations: number;
    sessions: number;
  };
}

const STATUS_CONFIG = {
  DRAFT: { label: "下書き", variant: "secondary" as const },
  ACTIVE: { label: "公開中", variant: "default" as const },
  PAUSED: { label: "一時停止", variant: "outline" as const },
  ARCHIVED: { label: "アーカイブ", variant: "destructive" as const },
};

export default function AutoWebinarDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [webinar, setWebinar] = useState<AutoWebinar | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    fetchWebinar();
  }, [id]);

  const fetchWebinar = async () => {
    try {
      const res = await fetch(`/api/auto-webinars/${id}`);
      if (!res.ok) throw new Error("Not found");
      const data = await res.json();
      setWebinar(data.webinar);
    } catch (error) {
      console.error("Failed to fetch webinar:", error);
      router.push("/auto-webinar");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      await fetch(`/api/auto-webinars/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchWebinar();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const copyRegistrationUrl = () => {
    const url = `${window.location.origin}/webinar/${id}`;
    navigator.clipboard.writeText(url);
    alert("URLをコピーしました");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!webinar) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/auto-webinar")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{webinar.title}</h1>
              <Badge variant={STATUS_CONFIG[webinar.status].variant}>
                {STATUS_CONFIG[webinar.status].label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              登録者 {webinar._count.registrations}人 | 視聴 {webinar._count.sessions}回
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {webinar.status === "ACTIVE" && (
            <Button variant="outline" onClick={copyRegistrationUrl}>
              <Copy className="w-4 h-4 mr-2" />
              URLをコピー
            </Button>
          )}

          {webinar.status === "DRAFT" && (
            <Button onClick={() => updateStatus("ACTIVE")}>
              <Play className="w-4 h-4 mr-2" />
              公開する
            </Button>
          )}
          {webinar.status === "ACTIVE" && (
            <Button variant="outline" onClick={() => updateStatus("PAUSED")}>
              <Pause className="w-4 h-4 mr-2" />
              一時停止
            </Button>
          )}
          {webinar.status === "PAUSED" && (
            <Button onClick={() => updateStatus("ACTIVE")}>
              <Play className="w-4 h-4 mr-2" />
              再開
            </Button>
          )}
          {webinar.status !== "ARCHIVED" && (
            <Button
              variant="outline"
              onClick={() => updateStatus("ARCHIVED")}
            >
              <Archive className="w-4 h-4 mr-2" />
              アーカイブ
            </Button>
          )}

          {webinar.status === "ACTIVE" && (
            <a
              href={`/webinar/${id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                登録ページを開く
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            基本設定
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            チャット
          </TabsTrigger>
          <TabsTrigger value="offers" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            オファー
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            特典
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            通知
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            タイムライン
          </TabsTrigger>
          <TabsTrigger value="ab-tests" className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4" />
            A/Bテスト
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            分析
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-6">
          <AutoWebinarForm
            mode="edit"
            initialData={{
              id: webinar.id,
              title: webinar.title,
              description: webinar.description || "",
              thumbnail: webinar.thumbnail || "",
              videoUrl: webinar.videoUrl,
              videoType: webinar.videoType as "YOUTUBE" | "VIMEO" | "UPLOAD",
              videoDuration: webinar.videoDuration,
              scheduleType: webinar.scheduleType as "JUST_IN_TIME" | "RECURRING" | "SPECIFIC_DATES" | "ON_DEMAND",
              justInTimeDelayMinutes: webinar.justInTimeDelayMinutes,
              fakeAttendeesEnabled: webinar.fakeAttendeesEnabled,
              fakeAttendeesMin: webinar.fakeAttendeesMin,
              fakeAttendeesMax: webinar.fakeAttendeesMax,
              simulatedChatEnabled: webinar.simulatedChatEnabled,
              userChatEnabled: webinar.userChatEnabled,
              replayEnabled: webinar.replayEnabled,
              replayExpiresAfterHours: webinar.replayExpiresAfterHours,
            }}
          />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <SimulatedChatEditor
            webinarId={webinar.id}
            videoDuration={webinar.videoDuration}
            webinarTitle={webinar.title}
            webinarDescription={webinar.description || ""}
          />
        </TabsContent>

        <TabsContent value="offers" className="mt-6">
          <TimedOfferEditor
            webinarId={webinar.id}
            videoDuration={webinar.videoDuration}
          />
        </TabsContent>

        <TabsContent value="rewards" className="mt-6">
          <RewardEditor
            webinarId={webinar.id}
            videoDuration={webinar.videoDuration}
          />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationSettingsEditor webinarId={webinar.id} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <VideoTimeline
            webinarId={webinar.id}
            videoDuration={webinar.videoDuration}
            onSelectItem={(type, id) => {
              // タブ切り替え
              if (type === "chat") setActiveTab("chat");
              else if (type === "offer") setActiveTab("offers");
              else if (type === "reward") setActiveTab("rewards");
            }}
          />
        </TabsContent>

        <TabsContent value="ab-tests" className="mt-6">
          <ABTestEditor webinarId={webinar.id} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard webinarId={webinar.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * 分析ダッシュボード
 */
function AnalyticsDashboard({ webinarId }: { webinarId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [webinarId]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/auto-webinars/${webinarId}/analytics?days=30`);
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          分析データを取得できませんでした
        </CardContent>
      </Card>
    );
  }

  const { summary, completionDistribution, offers } = data;

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>総登録者数</CardDescription>
            <CardTitle className="text-3xl">
              {summary.totalRegistrations.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>総視聴セッション</CardDescription>
            <CardTitle className="text-3xl">
              {summary.totalSessions.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>平均視聴完了率（ライブ）</CardDescription>
            <CardTitle className="text-3xl">
              {summary.avgCompletionLive}%
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>オファークリック数</CardDescription>
            <CardTitle className="text-3xl">
              {summary.totalOfferClicks.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 視聴完了率分布 */}
      <Card>
        <CardHeader>
          <CardTitle>視聴完了率の分布</CardTitle>
          <CardDescription>
            視聴者がどこまで動画を見たかの分布
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {completionDistribution.map((bucket: any, index: number) => {
              const maxCount = Math.max(...completionDistribution.map((b: any) => b.count));
              const height = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;
              return (
                <div
                  key={bucket.bucket}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-primary rounded-t transition-all"
                    style={{ height: `${height}%`, minHeight: bucket.count > 0 ? "4px" : "0" }}
                  />
                  <span className="text-xs text-muted-foreground mt-1">
                    {bucket.bucket}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* オファー別統計 */}
      {offers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>オファー別パフォーマンス</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {offers.map((offer: any) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{offer.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      表示タイミング: {Math.floor(offer.appearAtSeconds / 60)}分
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {offer.conversionRate}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {offer.clickCount}クリック / {offer.conversionCount}成約
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
