import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { MemberRank } from "@prisma/client";
import { getBulkCourseProgress } from "@/lib/courses/progress";

type Params = { id: string };

/**
 * 受講者一覧取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId } = await params;
    const userInfo = await getCurrentUser();
    const tenantId =
      userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(request.nextUrl.searchParams.get("offset") || "0");
    const rank = request.nextUrl.searchParams.get("rank") as MemberRank | null;

    // コース存在確認
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (tenantId && course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const where = {
      courseId,
      ...(rank && { memberRank: rank }),
    };

    const [enrollments, total] = await Promise.all([
      prisma.courseEnrollment.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              lineUserId: true,
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.courseEnrollment.count({ where }),
    ]);

    // 進捗情報を一括取得
    const contactIds = enrollments.map((e) => e.contactId);
    const progressMap = await getBulkCourseProgress(courseId, contactIds);

    // 進捗情報を付与
    const enrollmentsWithProgress = enrollments.map((enrollment) => ({
      ...enrollment,
      progress: progressMap.get(enrollment.contactId) || {
        completedLessons: 0,
        totalLessons: 0,
        progress: 0,
      },
    }));

    return NextResponse.json({
      enrollments: enrollmentsWithProgress,
      total,
    });
  } catch (error) {
    console.error("Failed to fetch enrollments:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrollments" },
      { status: 500 }
    );
  }
}

/**
 * 受講者追加
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    // コース存在確認
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (tenantId && course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { contactId, memberRank, expiresAt } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 }
      );
    }

    // コンタクト存在確認
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { tenantId: true },
    });

    if (!contact || contact.tenantId !== course.tenantId) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // 既存の受講確認
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_contactId: {
          courseId,
          contactId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Already enrolled" },
        { status: 409 }
      );
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        courseId,
        contactId,
        memberRank: (memberRank as MemberRank) || "BRONZE",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create enrollment:", error);
    return NextResponse.json(
      { error: "Failed to create enrollment" },
      { status: 500 }
    );
  }
}

/**
 * 受講者ランク更新
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    // コース存在確認
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (tenantId && course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { contactId, memberRank, expiresAt } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 }
      );
    }

    const enrollment = await prisma.courseEnrollment.update({
      where: {
        courseId_contactId: {
          courseId,
          contactId,
        },
      },
      data: {
        ...(memberRank !== undefined && {
          memberRank: memberRank as MemberRank,
        }),
        ...(expiresAt !== undefined && {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        }),
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error("Failed to update enrollment:", error);
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    );
  }
}

/**
 * 受講者削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { id: courseId } = await params;
    const userInfo = await getCurrentUser();
    const contactId = request.nextUrl.searchParams.get("contactId");
    const tenantId =
      userInfo?.tenantId || request.nextUrl.searchParams.get("tenantId");

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 }
      );
    }

    // コース存在確認
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tenantId: true },
    });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (tenantId && course.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.courseEnrollment.delete({
      where: {
        courseId_contactId: {
          courseId,
          contactId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete enrollment:", error);
    return NextResponse.json(
      { error: "Failed to delete enrollment" },
      { status: 500 }
    );
  }
}
