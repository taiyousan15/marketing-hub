"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { WebinarRoom, CountdownTimer } from "@/components/auto-webinar/viewer";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

type VideoType = "YOUTUBE" | "VIMEO" | "UPLOAD";
type MessageType = "COMMENT" | "QUESTION" | "REACTION" | "TESTIMONIAL";

interface SessionData {
  webinar: {
    id: string;
    title: string;
    description: string | null;
    videoUrl: string;
    videoType: VideoType;
    videoDuration: number;
    fakeAttendeesEnabled: boolean;
    fakeAttendeesMin: number;
    fakeAttendeesMax: number;
    simulatedChatEnabled: boolean;
    userChatEnabled: boolean;
  };
  registration: {
    id: string;
    scheduledStartAt: string;
  };
  session: {
    id: string;
    sessionToken: string;
    isReplay: boolean;
  };
  chatMessages: Array<{
    id: string;
    appearAtSeconds: number;
    senderName: string;
    senderAvatar: string | null;
    content: string;
    messageType: MessageType;
    order: number;
  }>;
  timedOffers: Array<{
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
  }>;
}

export default function WebinarWatchPage({ params }: PageProps) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const registrationId = searchParams.get("registrationId");

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!registrationId) {
      setError("noregistration");
      setLoading(false);
      return;
    }
    startSession();
  }, [id, registrationId]);

  const startSession = async () => {
    try {
      const res = await fetch(`/api/auto-webinars/${id}/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "Too early") {
          // まだ開始時刻になっていない
          const scheduledStart = new Date(data.scheduledStartAt);
          const now = new Date();
          const diffSeconds = Math.max(0, Math.floor((scheduledStart.getTime() - now.getTime()) / 1000));
          setCountdown(diffSeconds);
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to start session");
      }

      const data = await res.json();
      setSessionData(data);
    } catch (err) {
      console.error("Failed to start session:", err);
      setError("error");
    } finally {
      setLoading(false);
    }
  };

  // カウントダウン処理
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          // カウントダウン終了、セッション開始
          startSession();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // 進捗更新
  const updateProgress = async (watchedSeconds: number, completionPercent: number) => {
    if (!sessionData) return;

    try {
      await fetch(`/api/auto-webinars/${id}/session`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: sessionData.session.sessionToken,
          maxWatchedSeconds: watchedSeconds,
          completionPercent,
        }),
      });
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  // オファークリック追跡
  const trackOfferClick = async (offerId: string) => {
    if (!sessionData) return;

    try {
      await fetch(`/api/auto-webinars/${id}/session`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: sessionData.session.sessionToken,
          offerClicked: offerId,
        }),
      });
    } catch (err) {
      console.error("Failed to track offer click:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error === "noregistration") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">登録が必要です</h1>
          <p className="text-white/70 mb-6">
            このウェビナーを視聴するには、まず登録が必要です。
          </p>
          <a
            href={`/webinar/${id}`}
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
          >
            登録ページへ
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-2">エラーが発生しました</h1>
          <p className="text-white/70">ページを再読み込みしてください</p>
        </div>
      </div>
    );
  }

  // カウントダウン表示
  if (countdown !== null && countdown > 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <CountdownTimer
          targetTime={new Date(Date.now() + countdown * 1000)}
          onComplete={() => {
            setCountdown(null);
            startSession();
          }}
        />
      </div>
    );
  }

  if (!sessionData) {
    notFound();
  }

  // 現在位置を計算
  const scheduledStart = new Date(sessionData.registration.scheduledStartAt);
  const now = new Date();
  const elapsedSeconds = Math.floor((now.getTime() - scheduledStart.getTime()) / 1000);
  const currentPosition = Math.min(Math.max(0, elapsedSeconds), sessionData.webinar.videoDuration);
  const isEnded = currentPosition >= sessionData.webinar.videoDuration;
  const isLive = !sessionData.session.isReplay && !isEnded && currentPosition > 0;

  return (
    <WebinarRoom
      webinar={{
        id: sessionData.webinar.id,
        title: sessionData.webinar.title,
        videoUrl: sessionData.webinar.videoUrl,
        videoType: sessionData.webinar.videoType,
        videoDuration: sessionData.webinar.videoDuration,
      }}
      session={{
        id: sessionData.session.id,
        sessionToken: sessionData.session.sessionToken,
        isReplay: sessionData.session.isReplay,
      }}
      playback={{
        currentPosition,
        isLive,
        isEnded,
      }}
      chat={{
        enabled: sessionData.webinar.simulatedChatEnabled,
        messages: sessionData.chatMessages.map(m => ({
          ...m,
          messageType: m.messageType as "COMMENT" | "QUESTION" | "REACTION" | "TESTIMONIAL",
        })),
      }}
      offers={sessionData.timedOffers}
      attendees={{
        enabled: sessionData.webinar.fakeAttendeesEnabled,
        count: null,
        min: sessionData.webinar.fakeAttendeesMin,
        max: sessionData.webinar.fakeAttendeesMax,
      }}
    />
  );
}
