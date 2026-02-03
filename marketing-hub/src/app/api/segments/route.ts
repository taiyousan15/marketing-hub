/**
 * Segments API
 *
 * セグメントのCRUD操作
 * 根拠: research/runs/20260201-082657__step-email-trends/implementation_plan.md
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  createSegment,
  updateSegmentMembers,
  initializePresetSegments,
  type SegmentConfig,
} from "@/lib/marketing/segmentation";

// GET: セグメント一覧取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const segments = await prisma.segment.findMany({
      where: { tenantId },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ segments });
  } catch (error) {
    console.error("Segments GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments" },
      { status: 500 }
    );
  }
}

// POST: セグメント作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, ...config } = body as { tenantId: string } & SegmentConfig;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!config.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // プリセット初期化の場合
    if (config.name === "__initialize_presets__") {
      const results = await initializePresetSegments(tenantId);
      return NextResponse.json({ success: true, results });
    }

    const segment = await createSegment(tenantId, config);

    return NextResponse.json({ segment }, { status: 201 });
  } catch (error) {
    console.error("Segments POST error:", error);
    return NextResponse.json(
      { error: "Failed to create segment" },
      { status: 500 }
    );
  }
}

// PATCH: セグメント更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const segment = await prisma.segment.update({
      where: { id },
      data: {
        ...(updates.name && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.color && { color: updates.color }),
        ...(updates.rules && { rules: updates.rules }),
        ...(updates.rulesLogic && { rulesLogic: updates.rulesLogic }),
        ...(updates.autoUpdate !== undefined && { autoUpdate: updates.autoUpdate }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
      },
    });

    // ルールが更新された場合はメンバーを再評価
    if (updates.rules && segment.autoUpdate) {
      await updateSegmentMembers(segment.id);
    }

    return NextResponse.json({ segment });
  } catch (error) {
    console.error("Segments PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update segment" },
      { status: 500 }
    );
  }
}

// DELETE: セグメント削除
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // メンバーシップを先に削除
    await prisma.contactSegment.deleteMany({
      where: { segmentId: id },
    });

    // セグメントを削除
    await prisma.segment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Segments DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 }
    );
  }
}
