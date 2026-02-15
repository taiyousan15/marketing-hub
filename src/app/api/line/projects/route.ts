/**
 * LINEプロジェクト管理API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// プロジェクト一覧取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const projects = await prisma.lineProject.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        accounts: {
          select: {
            id: true,
            name: true,
            isActive: true,
            currentFriends: true,
          },
        },
        distributionSetting: true,
      },
    });

    // 統計を計算
    const projectsWithStats = projects.map((project) => ({
      ...project,
      totalAccounts: project.accounts.length,
      activeAccounts: project.accounts.filter((a) => a.isActive).length,
      totalFriends: project.accounts.reduce((sum, a) => sum + a.currentFriends, 0),
    }));

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// プロジェクト作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, name, description, color } = body;

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: "tenantId and name are required" },
        { status: 400 }
      );
    }

    // 同名プロジェクトがないかチェック
    const existing = await prisma.lineProject.findUnique({
      where: {
        tenantId_name: { tenantId, name },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "同名のプロジェクトが既に存在します" },
        { status: 400 }
      );
    }

    const project = await prisma.lineProject.create({
      data: {
        tenantId,
        name,
        description: description || null,
        color: color || "#6366f1",
      },
    });

    // デフォルトの振り分け設定を作成
    await prisma.lineDistributionSetting.create({
      data: {
        tenantId,
        projectId: project.id,
        isEnabled: false,
        distributionType: "ROUND_ROBIN",
        maxListsPerRotation: 1,
        onLimitReached: "NEXT_ACCOUNT",
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// プロジェクト更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, color, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const project = await prisma.lineProject.update({
      where: { id },
      data: {
        name: name ?? undefined,
        description: description ?? undefined,
        color: color ?? undefined,
        isActive: isActive ?? undefined,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// プロジェクト削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // プロジェクトに紐付いているアカウントの紐付けを解除
    await prisma.lineAccount.updateMany({
      where: { projectId: id },
      data: { projectId: null },
    });

    // プロジェクト削除（振り分け設定もカスケード削除される）
    await prisma.lineProject.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
