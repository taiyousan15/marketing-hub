// src/lib/courses/public-access.ts

import { prisma } from "@/lib/db/prisma";
import { nanoid } from "nanoid";

// shareCodeを生成
export function generateShareCode(): string {
  return nanoid(10); // 10文字のランダム文字列
}

// コースを公開設定にする
export async function makeCoursePubic(
  courseId: string
): Promise<{ shareCode: string }> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { shareCode: true },
  });

  if (course?.shareCode) {
    // 既にshareCodeがある場合はそのまま返す
    return { shareCode: course.shareCode };
  }

  // 新しいshareCodeを生成
  let shareCode = generateShareCode();

  // 重複チェック（念のため）
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.course.findUnique({
      where: { shareCode },
    });
    if (!existing) break;
    shareCode = generateShareCode();
    attempts++;
  }

  // コースを更新
  await prisma.course.update({
    where: { id: courseId },
    data: {
      isPublicCourse: true,
      shareCode,
    },
  });

  return { shareCode };
}

// 公開設定を解除（shareCodeは保持）
export async function makeCoursePivate(courseId: string): Promise<void> {
  await prisma.course.update({
    where: { id: courseId },
    data: {
      isPublicCourse: false,
    },
  });
}

// shareCodeを再生成
export async function regenerateShareCode(
  courseId: string
): Promise<{ shareCode: string }> {
  let shareCode = generateShareCode();

  // 重複チェック
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.course.findUnique({
      where: { shareCode },
    });
    if (!existing) break;
    shareCode = generateShareCode();
    attempts++;
  }

  await prisma.course.update({
    where: { id: courseId },
    data: { shareCode },
  });

  return { shareCode };
}

// shareCodeからコースを取得（公開コース用）
export async function getCourseByShareCode(shareCode: string) {
  const course = await prisma.course.findUnique({
    where: { shareCode },
    include: {
      lessons: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          order: true,
          duration: true,
          videoUrl: true,
          videoType: true,
          requiredRank: true,
          isSequentialStart: true,
          requireCompletion: true,
          completionThreshold: true,
          isPublished: true,
        },
      },
    },
  });

  if (!course || !course.isPublicCourse) {
    return null;
  }

  return course;
}

// 公開コースのレッスンを取得
export async function getPublicLesson(shareCode: string, lessonId: string) {
  const course = await prisma.course.findUnique({
    where: { shareCode },
    select: {
      id: true,
      isPublicCourse: true,
      accessMode: true,
      isPublished: true,
    },
  });

  if (!course || !course.isPublicCourse) {
    return null;
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: lessonId,
      courseId: course.id,
      isPublished: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      content: true,
      videoUrl: true,
      videoType: true,
      duration: true,
      order: true,
      requiredRank: true,
      isSequentialStart: true,
      requireCompletion: true,
      completionThreshold: true,
    },
  });

  return lesson;
}

// 公開URLを構築
export function buildPublicUrl(
  baseUrl: string,
  shareCode: string,
  lessonId?: string
): string {
  if (lessonId) {
    return `${baseUrl}/m/${shareCode}/${lessonId}`;
  }
  return `${baseUrl}/m/${shareCode}`;
}
