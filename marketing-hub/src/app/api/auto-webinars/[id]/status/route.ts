import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/tenant";
import type { AutoWebinarStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * オートウェビナーステータス変更
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const userInfo = await getCurrentUser();
    const body = await request.json();
    const tenantId = userInfo?.tenantId || body.tenantId;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // ステータスのバリデーション
    const validStatuses: AutoWebinarStatus[] = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // 存在確認
    const existing = await prisma.automatedWebinar.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
    }

    // ACTIVEにする場合は必須項目をチェック
    if (status === "ACTIVE") {
      if (!existing.videoUrl || !existing.videoDuration) {
        return NextResponse.json(
          { error: "Video URL and duration are required to activate" },
          { status: 400 }
        );
      }
    }

    const webinar = await prisma.automatedWebinar.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ webinar });
  } catch (error) {
    console.error("Failed to update webinar status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
