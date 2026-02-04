"use client";

import { useState, useEffect, use } from "react";
import { RegistrationForm } from "@/components/auto-webinar/viewer";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface WebinarData {
  id: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  videoDuration: number;
  scheduleType: string;
  status: string;
}

export default function WebinarRegistrationPage({ params }: PageProps) {
  const { id } = use(params);
  const [webinar, setWebinar] = useState<WebinarData | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWebinarData();
  }, [id]);

  const fetchWebinarData = async () => {
    try {
      // ウェビナー情報と利用可能時間を並列取得
      const [webinarRes, scheduleRes] = await Promise.all([
        fetch(`/api/auto-webinars/${id}/register`),
        fetch(`/api/auto-webinars/${id}/schedule`),
      ]);

      if (!webinarRes.ok) {
        if (webinarRes.status === 404) {
          setError("notfound");
          return;
        }
        throw new Error("Failed to fetch webinar");
      }

      const webinarData = await webinarRes.json();
      setWebinar(webinarData.webinar);

      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        setAvailableTimes(scheduleData.availableTimes || []);
      }
    } catch (err) {
      console.error("Failed to load webinar:", err);
      setError("error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error === "notfound" || !webinar) {
    notFound();
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-2">エラーが発生しました</h1>
          <p className="text-white/70">ページを再読み込みしてください</p>
        </div>
      </div>
    );
  }

  const isJustInTime = webinar.scheduleType === "JUST_IN_TIME";
  const isOnDemand = webinar.scheduleType === "ON_DEMAND";

  return (
    <RegistrationForm
      webinar={{
        id: webinar.id,
        title: webinar.title,
        description: webinar.description || undefined,
        thumbnail: webinar.thumbnail || undefined,
        videoDuration: webinar.videoDuration,
        scheduleType: webinar.scheduleType,
      }}
      availableTimes={availableTimes}
      isJustInTime={isJustInTime}
      isOnDemand={isOnDemand}
    />
  );
}
