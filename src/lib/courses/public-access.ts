// src/lib/courses/public-access.ts
// Public course access - Simplified stub

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
  // 公開設定は簡略化
  return { shareCode: generateShareCode() };
}

// 公開設定を解除（shareCodeは保持）
export async function makeCoursePivate(courseId: string): Promise<void> {
  // 非公開設定は簡略化
  return;
}

// shareCodeを再生成
export async function regenerateShareCode(
  courseId: string
): Promise<{ shareCode: string }> {
  return { shareCode: generateShareCode() };
}

// shareCodeからコースを取得（公開コース用）
export async function getCourseByShareCode(shareCode: string) {
  return null;
}

// 公開コースのレッスンを取得
export async function getPublicLesson(shareCode: string, lessonId: string) {
  return null;
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
