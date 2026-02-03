"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LessonEditor } from "@/components/courses/lesson-editor";
import { MemberRank, VideoType } from "@prisma/client";

export default function NewLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const defaultLesson = {
    id: "",
    name: "",
    description: null as string | null,
    videoUrl: null as string | null,
    videoType: "YOUTUBE" as VideoType | null,
    duration: null as number | null,
    isPublished: false,
    releaseDelay: 0,
    requiredRank: "BRONZE" as MemberRank,
    isSequentialStart: false,
    requireCompletion: false,
    completionThreshold: 80,
  };

  const handleSave = async (data: Partial<typeof defaultLesson>) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create");

      toast.success("レッスンを作成しました");
      router.push(`/courses/${courseId}`);
    } catch (error) {
      toast.error("作成に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            新規レッスン作成
          </h1>
          <p className="text-muted-foreground">
            新しいレッスンを追加します
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <LessonEditor
          lesson={defaultLesson}
          onSave={handleSave}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
