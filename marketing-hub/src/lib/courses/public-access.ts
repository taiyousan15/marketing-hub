// src/lib/courses/public-access.ts
// Stub implementation - public course access not fully implemented

import { nanoid } from "nanoid";

// shareCodeを生成
export function generateShareCode(): string {
  return nanoid(10); // 10文字のランダム文字列
}

// コースを公開設定にする
export async function makeCoursePubic(
  courseId: string
): Promise<{ shareCode: string }> {
  // Stub implementation
  const shareCode = generateShareCode();
  return { shareCode };
}

// コースの公開を終了する
export async function unpublishCourse(courseId: string): Promise<void> {
  // Stub implementation
}
