// src/lib/courses/progress.ts

import { prisma } from "@/lib/db/prisma";

// 視聴進捗を更新
export async function updateLessonProgress(
  lessonId: string,
  contactId: string,
  watchedSeconds: number
): Promise<{ isCompleted: boolean; progress: number }> {
  // レッスン情報を取得
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      duration: true,
      completionThreshold: true,
    },
  });

  if (!lesson) {
    throw new Error("Lesson not found");
  }

  // 進捗率を計算
  const duration = lesson.duration || 0;
  const progress = duration > 0 ? (watchedSeconds / duration) * 100 : 0;
  const isCompleted = progress >= lesson.completionThreshold;

  // upsertで進捗を更新
  await prisma.lessonProgress.upsert({
    where: {
      lessonId_contactId: {
        lessonId,
        contactId,
      },
    },
    update: {
      watchedSeconds,
      isCompleted: isCompleted || undefined, // 一度完了したら戻さない
      completedAt: isCompleted ? new Date() : undefined,
    },
    create: {
      lessonId,
      contactId,
      watchedSeconds,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  return { isCompleted, progress };
}

// レッスンを完了済みにマーク
export async function markLessonAsCompleted(
  lessonId: string,
  contactId: string
): Promise<void> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { duration: true },
  });

  await prisma.lessonProgress.upsert({
    where: {
      lessonId_contactId: {
        lessonId,
        contactId,
      },
    },
    update: {
      isCompleted: true,
      completedAt: new Date(),
      watchedSeconds: lesson?.duration || 0,
    },
    create: {
      lessonId,
      contactId,
      isCompleted: true,
      completedAt: new Date(),
      watchedSeconds: lesson?.duration || 0,
    },
  });
}

// コースの進捗を取得
export async function getCourseProgress(
  courseId: string,
  contactId: string
): Promise<{
  totalLessons: number;
  completedLessons: number;
  progress: number;
  lessonProgress: {
    lessonId: string;
    isCompleted: boolean;
    watchedSeconds: number;
    completedAt: Date | null;
  }[];
}> {
  // コースのレッスン一覧を取得
  const lessons = await prisma.lesson.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    select: {
      id: true,
      duration: true,
      completionThreshold: true,
    },
  });

  // 進捗を取得
  const progress = await prisma.lessonProgress.findMany({
    where: {
      lessonId: { in: lessons.map((l) => l.id) },
      contactId,
    },
    select: {
      lessonId: true,
      isCompleted: true,
      watchedSeconds: true,
      completedAt: true,
    },
  });

  const progressMap = new Map(progress.map((p) => [p.lessonId, p]));

  // 完了レッスン数を計算
  let completedCount = 0;
  for (const lesson of lessons) {
    const lessonProgress = progressMap.get(lesson.id);
    if (lessonProgress?.isCompleted) {
      completedCount++;
    } else if (lessonProgress && lesson.duration) {
      const percent = (lessonProgress.watchedSeconds / lesson.duration) * 100;
      if (percent >= lesson.completionThreshold) {
        completedCount++;
      }
    }
  }

  const totalLessons = lessons.length;
  const progressPercent =
    totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return {
    totalLessons,
    completedLessons: completedCount,
    progress: Math.round(progressPercent),
    lessonProgress: lessons.map((lesson) => {
      const p = progressMap.get(lesson.id);
      return {
        lessonId: lesson.id,
        isCompleted: p?.isCompleted || false,
        watchedSeconds: p?.watchedSeconds || 0,
        completedAt: p?.completedAt || null,
      };
    }),
  };
}

// コースの進捗マップを取得（アクセス制御用）
export async function getLessonProgressMap(
  courseId: string,
  contactId: string
): Promise<
  Map<
    string,
    { lessonId: string; isCompleted: boolean; watchedSeconds: number }
  >
> {
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    select: { id: true },
  });

  const progress = await prisma.lessonProgress.findMany({
    where: {
      lessonId: { in: lessons.map((l) => l.id) },
      contactId,
    },
    select: {
      lessonId: true,
      isCompleted: true,
      watchedSeconds: true,
    },
  });

  return new Map(progress.map((p) => [p.lessonId, p]));
}

// 複数コンタクトの進捗を一括取得
export async function getBulkCourseProgress(
  courseId: string,
  contactIds: string[]
): Promise<
  Map<
    string,
    {
      completedLessons: number;
      totalLessons: number;
      progress: number;
    }
  >
> {
  const lessons = await prisma.lesson.findMany({
    where: {
      courseId,
      isPublished: true,
    },
    select: {
      id: true,
      duration: true,
      completionThreshold: true,
    },
  });

  const totalLessons = lessons.length;
  const lessonIds = lessons.map((l) => l.id);

  const progress = await prisma.lessonProgress.findMany({
    where: {
      lessonId: { in: lessonIds },
      contactId: { in: contactIds },
    },
    select: {
      lessonId: true,
      contactId: true,
      isCompleted: true,
      watchedSeconds: true,
    },
  });

  // コンタクトごとに集計
  const result = new Map<
    string,
    { completedLessons: number; totalLessons: number; progress: number }
  >();

  for (const contactId of contactIds) {
    const contactProgress = progress.filter((p) => p.contactId === contactId);
    let completedCount = 0;

    for (const lesson of lessons) {
      const p = contactProgress.find((cp) => cp.lessonId === lesson.id);
      if (p?.isCompleted) {
        completedCount++;
      } else if (p && lesson.duration) {
        const percent = (p.watchedSeconds / lesson.duration) * 100;
        if (percent >= lesson.completionThreshold) {
          completedCount++;
        }
      }
    }

    result.set(contactId, {
      completedLessons: completedCount,
      totalLessons,
      progress:
        totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
    });
  }

  return result;
}
