"use client";

import { useState, useEffect, use } from "react";
import { WebinarRoom } from "@/components/auto-webinar/viewer";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ token: string }>;
}

type VideoType = "YOUTUBE" | "VIMEO" | "UPLOAD";
type MessageType = "COMMENT" | "QUESTION" | "REACTION" | "TESTIMONIAL";

interface ReplayData {
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
    replayExpiresAt: string | null;
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

export default function WebinarReplayPage({ params }: PageProps) {
  const { token } = use(params);
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    fetchReplayData();
  }, [token]);

  const fetchReplayData = async () => {
    try {
      const res = await fetch(`/api/auto-webinars/replay/${token}`);

      if (!res.ok) {
        const data = await res.json();
        if (data.error === "Replay expired") {
          setExpired(true);
          setLoading(false);
          return;
        }
        if (res.status === 404) {
          setError("notfound");
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to load replay");
      }

      const data = await res.json();
      setReplayData(data);
    } catch (err) {
      console.error("Failed to load replay:", err);
      setError("error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">リプレイの有効期限が切れました</h1>
          <p className="text-white/70">
            このウェビナーのリプレイは既に有効期限が過ぎています。
            再度視聴をご希望の場合は、お問い合わせください。
          </p>
        </div>
      </div>
    );
  }

  if (error === "notfound" || !replayData) {
    notFound();
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

  return (
    <>
      {/* リプレイバナー */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black py-2 px-4 text-center text-sm font-medium">
        🎬 リプレイ視聴中
        {replayData.registration.replayExpiresAt && (
          <span className="ml-2 opacity-75">
            （有効期限: {new Date(replayData.registration.replayExpiresAt).toLocaleDateString("ja-JP")}まで）
          </span>
        )}
      </div>

      <div className="pt-10">
        <WebinarRoom
          webinar={{
            id: replayData.webinar.id,
            title: replayData.webinar.title,
            videoUrl: replayData.webinar.videoUrl,
            videoType: replayData.webinar.videoType,
            videoDuration: replayData.webinar.videoDuration,
          }}
          session={{
            id: replayData.session.id,
            sessionToken: replayData.session.sessionToken,
            isReplay: true,
          }}
          playback={{
            currentPosition: 0,  // リプレイは最初から
            isLive: false,
            isEnded: false,
          }}
          chat={{
            enabled: replayData.webinar.simulatedChatEnabled,
            messages: replayData.chatMessages,
          }}
          offers={replayData.timedOffers}
          attendees={{
            enabled: replayData.webinar.fakeAttendeesEnabled,
            count: null,
            min: replayData.webinar.fakeAttendeesMin,
            max: replayData.webinar.fakeAttendeesMax,
          }}
        />
      </div>
    </>
  );
}
