"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LessonEditor } from "@/components/courses/lesson-editor";
import { MemberRank, VideoType } from "@prisma/client";

interface Lesson {
  id: string;
  name: string;
  description: string | null;
  videoUrl: string | null;
  videoType: VideoType | null;
  duration: number | null;
  isPublished: boolean;
  releaseDelay: number;
  requiredRank: MemberRank;
  isSequentialStart: boolean;
  requireCompletion: boolean;
  completionThreshold: number;
}

export default function LessonEditPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: courseId, lessonId } = use(params);
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLesson();
  }, [courseId, lessonId]);

  const fetchLesson = async () => {
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLesson(data.lesson);
    } catch (error) {
      toast.error("レッスンの取得に失敗しました");
      router.push(`/courses/${courseId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: Partial<Lesson>) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update");

      const result = await res.json();
      setLesson(result.lesson);
      toast.success("保存しました");
    } catch (error) {
      toast.error("保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{lesson.name}</h1>
          <p className="text-muted-foreground">レッスンを編集</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <LessonEditor
          lesson={lesson}
          onSave={handleSave}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
