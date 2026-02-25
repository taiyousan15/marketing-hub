import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import { UpdateStatusSchema, formatValidationErrors } from "@/lib/auto-webinar/validations";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userInfo = await getCurrentUser();
    if (!userInfo) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { tenantId } = userInfo;
    const { id } = await params;

    const existing = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "自動ウェビナーが見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = UpdateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        formatValidationErrors(parsed.error),
        { status: 400 }
      );
    }

    const webinar = await prisma.automatedWebinar.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ webinar });
  } catch (error) {
    console.error("PATCH /api/auto-webinars/[id]/status error:", error);
    return NextResponse.json(
      { error: "ステータスの更新に失敗しました" },
      { status: 500 }
    );
  }
}
