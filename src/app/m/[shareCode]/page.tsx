"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, GraduationCap, PlayCircle, Lock, CheckCircle2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LessonCard } from "@/components/courses/lesson-card";
import { MemberRank } from "@prisma/client";

interface Lesson {
  id: string;
  name: string;
  description: string | null;
  order: number;
  duration: number | null;
  requiredRank: MemberRank;
  isSequentialStart: boolean;
  requireCompletion: boolean;
  canAccess?: boolean;
  isCompleted?: boolean;
  accessDeniedMessage?: string;
  progress?: {
    watchedSeconds: number;
  } | null;
  rankInfo: {
    label: string;
    color: string;
    icon: string;
  };
}

interface Course {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  accessMode: "PUBLIC" | "RANK_BASED";
}

export default function PublicCoursePage({
  params,
}: {
  params: Promise<{ shareCode: string }>;
}) {
  const { shareCode } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contactId");

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourse();
  }, [shareCode, contactId]);

  const fetchCourse = async () => {
    try {
      const url = contactId
        ? `/api/m/${shareCode}?contactId=${contactId}`
        : `/api/m/${shareCode}`;
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404) {
          setError("コースが見つかりません");
        } else {
          setError("コースの取得に失敗しました");
        }
        return;
      }

      const data = await res.json();
      setCourse(data.course);
      setLessons(data.lessons);
    } catch (err) {
      setError("コースの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonClick = (lessonId: string) => {
    const url = contactId
      ? `/m/${shareCode}/${lessonId}?contactId=${contactId}`
      : `/m/${shareCode}/${lessonId}`;
    router.push(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">
          {error || "コースが見つかりません"}
        </h1>
        <p className="text-muted-foreground">
          URLが正しいか確認してください
        </p>
      </div>
    );
  }

  // 進捗計算
  const completedLessons = lessons.filter((l) => l.isCompleted).length;
  const totalLessons = lessons.length;
  const progressPercent =
    totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* コースヘッダー */}
      <div className="text-center">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.name}
            className="w-full max-w-2xl mx-auto rounded-lg mb-6 aspect-video object-cover"
          />
        ) : (
          <div className="w-full max-w-2xl mx-auto rounded-lg mb-6 aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <GraduationCap className="h-24 w-24 text-primary/30" />
          </div>
        )}

        <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
        {course.description && (
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {course.description}
          </p>
        )}
      </div>

      {/* 進捗表示（contactIdがある場合） */}
      {contactId && totalLessons > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">コース進捗</span>
              <span className="text-sm text-muted-foreground">
                {completedLessons} / {totalLessons} レッスン完了
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* レッスン一覧 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          レッスン一覧
        </h2>

        {lessons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              レッスンがまだありません
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                canAccess={lesson.canAccess ?? true}
                isCompleted={lesson.isCompleted ?? false}
                progress={lesson.progress}
                accessDeniedMessage={lesson.accessDeniedMessage}
                onClick={() => handleLessonClick(lesson.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="text-center pt-8 border-t text-sm text-muted-foreground">
        <p>Powered by Marketing Hub</p>
      </div>
    </div>
  );
}
