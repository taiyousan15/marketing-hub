"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageSquare,
  Gift,
  Trophy,
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
} from "lucide-react";

interface ChatMessage {
  id: string;
  appearAtSeconds: number;
  senderName: string;
  content: string;
  messageType: string;
}

interface TimedOffer {
  id: string;
  appearAtSeconds: number;
  hideAtSeconds: number | null;
  title: string;
  buttonText: string;
}

interface Reward {
  id: string;
  name: string;
  rewardType: string;
  watchTimeSeconds: number | null;
  appearAtSeconds: number | null;
  isActive: boolean;
}

interface VideoTimelineProps {
  webinarId: string;
  videoDuration: number;
  onSelectItem?: (type: "chat" | "offer" | "reward", id: string) => void;
}

type TimelineItemType = "chat" | "offer" | "reward";

interface TimelineItem {
  id: string;
  type: TimelineItemType;
  startSeconds: number;
  endSeconds?: number;
  label: string;
  subLabel?: string;
}

const TYPE_CONFIG = {
  chat: {
    label: "チャット",
    icon: MessageSquare,
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
    lightColor: "bg-blue-100 text-blue-700",
  },
  offer: {
    label: "オファー",
    icon: Gift,
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
    lightColor: "bg-green-100 text-green-700",
  },
  reward: {
    label: "特典",
    icon: Trophy,
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600",
    lightColor: "bg-purple-100 text-purple-700",
  },
};

export function VideoTimeline({
  webinarId,
  videoDuration,
  onSelectItem,
}: VideoTimelineProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [offers, setOffers] = useState<TimedOffer[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  // 表示設定
  const [showChat, setShowChat] = useState(true);
  const [showOffers, setShowOffers] = useState(true);
  const [showRewards, setShowRewards] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // データ取得
  useEffect(() => {
    Promise.all([
      fetch(`/api/auto-webinars/${webinarId}/chat`).then((r) => r.json()),
      fetch(`/api/auto-webinars/${webinarId}/offers`).then((r) => r.json()),
      fetch(`/api/auto-webinars/${webinarId}/rewards`).then((r) => r.json()),
    ])
      .then(([chatData, offersData, rewardsData]) => {
        setChatMessages(chatData.messages || []);
        setOffers(offersData.offers || []);
        setRewards(rewardsData.rewards || []);
      })
      .catch((error) => {
        console.error("Failed to fetch timeline data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [webinarId]);

  // 再生シミュレーション
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        if (prev >= videoDuration) {
          setIsPlaying(false);
          return videoDuration;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, videoDuration]);

  // タイムラインアイテムの統合
  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    if (showChat) {
      chatMessages.forEach((msg) => {
        items.push({
          id: msg.id,
          type: "chat",
          startSeconds: msg.appearAtSeconds,
          label: msg.senderName,
          subLabel: msg.content.slice(0, 30) + (msg.content.length > 30 ? "..." : ""),
        });
      });
    }

    if (showOffers) {
      offers.forEach((offer) => {
        items.push({
          id: offer.id,
          type: "offer",
          startSeconds: offer.appearAtSeconds,
          endSeconds: offer.hideAtSeconds || undefined,
          label: offer.title,
          subLabel: offer.buttonText,
        });
      });
    }

    if (showRewards) {
      rewards
        .filter((r) => r.isActive)
        .forEach((reward) => {
          const seconds =
            reward.rewardType === "WATCH_TIME"
              ? reward.watchTimeSeconds
              : reward.appearAtSeconds;
          if (seconds !== null) {
            items.push({
              id: reward.id,
              type: "reward",
              startSeconds: seconds,
              label: reward.name,
              subLabel: reward.rewardType,
            });
          }
        });
    }

    return items.sort((a, b) => a.startSeconds - b.startSeconds);
  }, [chatMessages, offers, rewards, showChat, showOffers, showRewards]);

  // 時間フォーマット
  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  // タイムライン上の位置計算
  const getPosition = useCallback(
    (seconds: number) => {
      return (seconds / videoDuration) * 100;
    },
    [videoDuration]
  );

  // タイムライン幅計算
  const getWidth = useCallback(
    (start: number, end?: number) => {
      if (!end) return 0.5; // デフォルト幅
      return ((end - start) / videoDuration) * 100;
    },
    [videoDuration]
  );

  // タイムラインクリック
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setCurrentTime(Math.floor(percentage * videoDuration));
  };

  // スキップ
  const skip = (seconds: number) => {
    setCurrentTime((prev) => Math.max(0, Math.min(videoDuration, prev + seconds)));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const timeMarkers = [];
  const interval = videoDuration > 3600 ? 600 : videoDuration > 600 ? 60 : 30;
  for (let i = 0; i <= videoDuration; i += interval) {
    timeMarkers.push(i);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              ビデオタイムライン
            </CardTitle>
            <CardDescription>
              動画上のすべてのイベントを視覚的に確認できます
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* フィルターコントロール */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-6">
            {(["chat", "offer", "reward"] as TimelineItemType[]).map((type) => {
              const config = TYPE_CONFIG[type];
              const count =
                type === "chat"
                  ? chatMessages.length
                  : type === "offer"
                    ? offers.length
                    : rewards.filter((r) => r.isActive).length;
              const isVisible =
                type === "chat" ? showChat : type === "offer" ? showOffers : showRewards;
              const setVisible =
                type === "chat" ? setShowChat : type === "offer" ? setShowOffers : setShowRewards;

              return (
                <button
                  key={type}
                  onClick={() => setVisible(!isVisible)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                    isVisible ? config.lightColor : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isVisible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                  <config.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {config.label} ({count})
                  </span>
                </button>
              );
            })}
          </div>
          <div className="text-sm text-muted-foreground">
            合計 {timelineItems.length} イベント
          </div>
        </div>

        {/* 再生コントロール */}
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Button variant="outline" size="icon" onClick={() => skip(-10)}>
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => skip(10)}>
            <SkipForward className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <span className="font-mono text-lg">
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentTime(0);
              setIsPlaying(false);
            }}
          >
            リセット
          </Button>
        </div>

        {/* メインタイムライン */}
        <div
          className="relative overflow-x-auto"
          style={{ paddingBottom: "20px" }}
        >
          <div
            style={{
              width: `${100 * zoomLevel}%`,
              minWidth: "100%",
            }}
          >
            {/* 時間マーカー */}
            <div className="relative h-6 border-b">
              {timeMarkers.map((time) => (
                <div
                  key={time}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${getPosition(time)}%`, transform: "translateX(-50%)" }}
                >
                  <div className="h-2 w-px bg-border" />
                  <span className="text-xs text-muted-foreground">{formatTime(time)}</span>
                </div>
              ))}
            </div>

            {/* タイムラインバー */}
            <div
              className="relative h-24 bg-muted/30 rounded-lg mt-2 cursor-pointer"
              onClick={handleTimelineClick}
            >
              {/* 進行バー */}
              <div
                className="absolute top-0 left-0 h-full bg-primary/10 rounded-l-lg transition-all"
                style={{ width: `${getPosition(currentTime)}%` }}
              />

              {/* 現在位置インジケーター */}
              <div
                className="absolute top-0 h-full w-0.5 bg-primary z-20 transition-all"
                style={{ left: `${getPosition(currentTime)}%` }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full" />
              </div>

              {/* アイテムトラック - チャット */}
              {showChat && (
                <div className="absolute top-2 left-0 right-0 h-6">
                  <TooltipProvider>
                    {chatMessages.map((msg) => (
                      <Tooltip key={msg.id}>
                        <TooltipTrigger asChild>
                          <button
                            className={`absolute h-full w-1.5 rounded-sm ${TYPE_CONFIG.chat.color} ${TYPE_CONFIG.chat.hoverColor} transition-all opacity-70 hover:opacity-100 hover:scale-x-150`}
                            style={{
                              left: `${getPosition(msg.appearAtSeconds)}%`,
                              transform: "translateX(-50%)",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentTime(msg.appearAtSeconds);
                              onSelectItem?.("chat", msg.id);
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div className="font-medium">{msg.senderName}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(msg.appearAtSeconds)}
                            </div>
                            <div className="text-xs max-w-48 truncate">{msg.content}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              )}

              {/* アイテムトラック - オファー */}
              {showOffers && (
                <div className="absolute top-10 left-0 right-0 h-6">
                  <TooltipProvider>
                    {offers.map((offer) => (
                      <Tooltip key={offer.id}>
                        <TooltipTrigger asChild>
                          <button
                            className={`absolute h-full rounded-sm ${TYPE_CONFIG.offer.color} ${TYPE_CONFIG.offer.hoverColor} transition-all opacity-70 hover:opacity-100`}
                            style={{
                              left: `${getPosition(offer.appearAtSeconds)}%`,
                              width: offer.hideAtSeconds
                                ? `${getWidth(offer.appearAtSeconds, offer.hideAtSeconds)}%`
                                : "8px",
                              minWidth: "8px",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentTime(offer.appearAtSeconds);
                              onSelectItem?.("offer", offer.id);
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div className="font-medium">{offer.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(offer.appearAtSeconds)}
                              {offer.hideAtSeconds && ` - ${formatTime(offer.hideAtSeconds)}`}
                            </div>
                            <div className="text-xs">{offer.buttonText}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              )}

              {/* アイテムトラック - 特典 */}
              {showRewards && (
                <div className="absolute top-[72px] left-0 right-0 h-6">
                  <TooltipProvider>
                    {rewards
                      .filter((r) => r.isActive)
                      .map((reward) => {
                        const seconds =
                          reward.rewardType === "WATCH_TIME"
                            ? reward.watchTimeSeconds
                            : reward.appearAtSeconds;
                        if (seconds === null) return null;

                        return (
                          <Tooltip key={reward.id}>
                            <TooltipTrigger asChild>
                              <button
                                className={`absolute h-full w-3 rounded-sm ${TYPE_CONFIG.reward.color} ${TYPE_CONFIG.reward.hoverColor} transition-all opacity-70 hover:opacity-100 hover:scale-110`}
                                style={{
                                  left: `${getPosition(seconds)}%`,
                                  transform: "translateX(-50%)",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentTime(seconds);
                                  onSelectItem?.("reward", reward.id);
                                }}
                              >
                                <Trophy className="w-2 h-2 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <div className="font-medium">{reward.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTime(seconds)}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {reward.rewardType}
                                </Badge>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                  </TooltipProvider>
                </div>
              )}

              {/* トラックラベル */}
              <div className="absolute right-2 top-2 text-xs text-muted-foreground">
                チャット
              </div>
              <div className="absolute right-2 top-10 text-xs text-muted-foreground">
                オファー
              </div>
              <div className="absolute right-2 top-[72px] text-xs text-muted-foreground">
                特典
              </div>
            </div>
          </div>
        </div>

        {/* 現在時刻付近のイベント */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">現在時刻付近のイベント</h4>
          <div className="flex flex-wrap gap-2">
            {timelineItems
              .filter(
                (item) =>
                  Math.abs(item.startSeconds - currentTime) <= 30 ||
                  (item.endSeconds && currentTime >= item.startSeconds && currentTime <= item.endSeconds)
              )
              .slice(0, 5)
              .map((item) => {
                const config = TYPE_CONFIG[item.type];
                const isActive =
                  currentTime >= item.startSeconds &&
                  (!item.endSeconds || currentTime <= item.endSeconds);

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      setCurrentTime(item.startSeconds);
                      onSelectItem?.(item.type, item.id);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <config.icon className="w-4 h-4" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{item.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(item.startSeconds)}
                      </div>
                    </div>
                  </button>
                );
              })}
            {timelineItems.filter(
              (item) =>
                Math.abs(item.startSeconds - currentTime) <= 30 ||
                (item.endSeconds && currentTime >= item.startSeconds && currentTime <= item.endSeconds)
            ).length === 0 && (
              <div className="text-sm text-muted-foreground py-2">
                この時刻付近にイベントはありません
              </div>
            )}
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold">{chatMessages.length}</div>
            <div className="text-xs text-muted-foreground">チャットメッセージ</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{offers.length}</div>
            <div className="text-xs text-muted-foreground">オファー</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{rewards.filter((r) => r.isActive).length}</div>
            <div className="text-xs text-muted-foreground">特典</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatTime(videoDuration)}</div>
            <div className="text-xs text-muted-foreground">動画長</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
