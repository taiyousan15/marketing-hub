"use client";

import { useState, useEffect, useCallback } from "react";
import { SimulatedLivePlayer } from "./simulated-live-player";
import { LiveChat } from "./live-chat";
import { AttendeeCounter } from "./attendee-counter";
import { CountdownTimer } from "./countdown-timer";
import { TimedOffersContainer } from "./timed-offer-popup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import type { ChatMessage } from "@/lib/auto-webinar/chat";

interface TimedOffer {
  id: string;
  appearAtSeconds: number;
  hideAtSeconds: number | null;
  title: string;
  description: string | null;
  buttonText: string;
  buttonUrl: string;
  countdownEnabled: boolean;
  countdownSeconds: number | null;
  limitedSeats: number | null;
}

interface WebinarRoomProps {
  webinar: {
    id: string;
    title: string;
    videoUrl: string;
    videoType: "YOUTUBE" | "VIMEO" | "UPLOAD";
    videoDuration: number;
  };
  session: {
    id: string;
    sessionToken: string;
    isReplay: boolean;
  };
  playback: {
    currentPosition: number;
    isLive: boolean;
    isEnded: boolean;
    timeUntilStart?: number;
  };
  chat: {
    enabled: boolean;
    messages: ChatMessage[];
  };
  offers: TimedOffer[];
  attendees: {
    enabled: boolean;
    count: number | null;
    min?: number;
    max?: number;
  };
}

export function WebinarRoom({
  webinar,
  session,
  playback: initialPlayback,
  chat,
  offers,
  attendees,
}: WebinarRoomProps) {
  const [currentPosition, setCurrentPosition] = useState(initialPlayback.currentPosition);
  const [isLive, setIsLive] = useState(initialPlayback.isLive);
  const [isEnded, setIsEnded] = useState(initialPlayback.isEnded);
  const [timeUntilStart, setTimeUntilStart] = useState(initialPlayback.timeUntilStart);
  const [showChat, setShowChat] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(chat.messages);
  const [visibleOffers, setVisibleOffers] = useState<TimedOffer[]>([]);

  // サーバーと同期（5秒ごと）
  useEffect(() => {
    const syncWithServer = async () => {
      try {
        const res = await fetch(`/api/auto-webinars/${webinar.id}/session`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionToken: session.sessionToken,
            currentPosition,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setChatMessages(data.chat.messages);
          setVisibleOffers(data.offers);

          // サーバーの状態と同期
          if (data.playback.isEnded) {
            setIsEnded(true);
            setIsLive(false);
          }
        }
      } catch (error) {
        console.error("Failed to sync with server:", error);
      }
    };

    const interval = setInterval(syncWithServer, 5000);
    return () => clearInterval(interval);
  }, [webinar.id, session.sessionToken, currentPosition]);

  // 開始待ちのカウントダウン
  useEffect(() => {
    if (!timeUntilStart || timeUntilStart <= 0) return;

    const timer = setInterval(() => {
      setTimeUntilStart((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer);
          setIsLive(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePositionUpdate = useCallback((position: number) => {
    setCurrentPosition(position);
    if (position >= webinar.videoDuration) {
      setIsEnded(true);
      setIsLive(false);
    }
  }, [webinar.videoDuration]);

  const handleOfferClick = async (offerId: string) => {
    try {
      await fetch(`/api/auto-webinars/${webinar.id}/session`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: session.sessionToken,
          offerClicked: offerId,
        }),
      });
    } catch (error) {
      console.error("Failed to track offer click:", error);
    }
  };

  // 開始前の待機画面
  if (timeUntilStart && timeUntilStart > 0 && !session.isReplay) {
    const startTime = new Date(Date.now() + timeUntilStart * 1000);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-white/10 backdrop-blur border-white/20">
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              {webinar.title}
            </h1>
            <CountdownTimer targetTime={startTime} />
            <p className="text-white/60 mt-6">
              開始時刻になると自動的にウェビナーが始まります。
              このページを開いたままお待ちください。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 終了後の画面
  if (isEnded && !session.isReplay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <PlayCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">ウェビナーは終了しました</h1>
            <p className="text-muted-foreground mb-6">
              ご視聴いただきありがとうございました。
            </p>
            {/* リプレイリンクがある場合は表示 */}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto py-4 px-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white truncate">
            {webinar.title}
          </h1>
          {attendees.enabled && attendees.min && attendees.max && (
            <AttendeeCounter
              min={attendees.min}
              max={attendees.max}
              progress={currentPosition / webinar.videoDuration}
            />
          )}
        </div>

        {/* メインコンテンツ */}
        <div className="flex gap-4">
          {/* 動画プレイヤー */}
          <div className={`flex-1 ${showChat ? "" : "max-w-5xl mx-auto"}`}>
            <SimulatedLivePlayer
              videoUrl={webinar.videoUrl}
              videoType={webinar.videoType}
              videoDuration={webinar.videoDuration}
              currentPosition={currentPosition}
              isLive={isLive}
              isReplay={session.isReplay}
              onPositionUpdate={handlePositionUpdate}
              className="w-full"
            />
          </div>

          {/* チャットサイドバー */}
          {chat.enabled && showChat && (
            <div className="w-80 shrink-0 hidden lg:block">
              <LiveChat
                messages={chatMessages}
                currentPosition={currentPosition}
                className="h-[calc(100vh-200px)]"
              />
            </div>
          )}
        </div>

        {/* モバイル用チャットトグル */}
        {chat.enabled && (
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 lg:hidden"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            チャット
          </Button>
        )}

        {/* デスクトップ用チャットトグル */}
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-1/2 right-0 transform -translate-y-1/2 hidden lg:flex"
          onClick={() => setShowChat(!showChat)}
        >
          {showChat ? (
            <ChevronRight className="w-6 h-6" />
          ) : (
            <ChevronLeft className="w-6 h-6" />
          )}
        </Button>
      </div>

      {/* タイムドオファー */}
      <TimedOffersContainer
        offers={visibleOffers}
        currentPosition={currentPosition}
        videoDuration={webinar.videoDuration}
        onOfferClick={handleOfferClick}
      />
    </div>
  );
}
