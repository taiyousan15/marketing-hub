import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import {
  generateShareCode,
  regenerateShareCode,
} from "@/lib/courses/public-access";

type Params = { id: string };

/**
 * コース詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId =
      userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            order: true,
            duration: true,
            videoUrl: true,
            videoType: true,
            isPublished: true,
            requiredRank: true,
            isSequentialStart: true,
            requireCompletion: true,
            completionThreshold: true,
            releaseDelay: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // テナントチェック（管理者の場合）
    if (tenantId && course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Failed to fetch course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

/**
 * コース更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    // コース存在確認
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: { tenantId: true, shareCode: true, isPublicCourse: true },
    });

    if (!existingCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (tenantId && existingCourse.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      name,
      description,
      thumbnail,
      isPublished,
      accessMode,
      isPublicCourse,
      regenerateCode,
    } = body;

    // shareCode処理
    let shareCode = existingCourse.shareCode;

    // 公開コースに変更で、まだshareCodeがない場合
    if (isPublicCourse && !shareCode) {
      shareCode = generateShareCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await prisma.course.findUnique({
          where: { shareCode },
        });
        if (!existing) break;
        shareCode = generateShareCode();
        attempts++;
      }
    }

    // shareCodeの再生成要求
    if (regenerateCode && existingCourse.shareCode) {
      const result = await regenerateShareCode(id);
      shareCode = result.shareCode;
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(isPublished !== undefined && { isPublished }),
        ...(accessMode !== undefined && { accessMode }),
        ...(isPublicCourse !== undefined && { isPublicCourse }),
        ...(shareCode !== existingCourse.shareCode && { shareCode }),
      },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Failed to update course:", error);
    return NextResponse.json(
      { error: "Failed to update course" },
      { status: 500 }
    );
  }
}

/**
 * コース削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const tenantId =
      userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    const course = await prisma.course.findUnique({
      where: { id },
      select: { tenantId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (tenantId && course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete course:", error);
    return NextResponse.json(
      { error: "Failed to delete course" },
      { status: 500 }
    );
  }
}
