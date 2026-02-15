import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { generateShareCode } from "@/lib/courses/public-access";

/**
 * コース一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    const tenantId =
      userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const isPublished = request.nextUrl.searchParams.get("isPublished");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");

    const where = {
      tenantId,
      ...(isPublished !== null && { isPublished: isPublished === "true" }),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          _count: {
            select: {
              lessons: true,
              enrollments: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.course.count({ where }),
    ]);

    return NextResponse.json({ courses, total });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

/**
 * コース作成
 */
export async function POST(request: NextRequest) {
  try {
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const {
      name,
      description,
      thumbnail,
      isPublished,
      accessMode,
      isPublicCourse,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // 公開コースの場合はshareCodeを生成
    let shareCode: string | undefined;
    if (isPublicCourse) {
      shareCode = generateShareCode();
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
    }

    const course = await prisma.course.create({
      data: {
        tenantId,
        name,
        description: description || null,
        thumbnail: thumbnail || null,
        isPublished: isPublished || false,
        accessMode: accessMode || "PUBLIC",
        isPublicCourse: isPublicCourse || false,
        shareCode: shareCode || null,
      },
      include: {
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    console.error("Failed to create course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
