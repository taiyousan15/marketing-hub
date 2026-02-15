/**
 * LINE振り分け設定API（プロジェクト単位）
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// 振り分け設定取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const projectId = searchParams.get("projectId");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    let setting = await prisma.lineDistributionSetting.findUnique({
      where: { projectId },
    });

    if (!setting) {
      // デフォルト設定を返す
      setting = {
        id: "",
        tenantId,
        projectId,
        isEnabled: false,
        distributionType: "ROUND_ROBIN",
        maxListsPerRotation: 1,
        currentIndex: 0,
        onLimitReached: "NEXT_ACCOUNT",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("Error fetching distribution setting:", error);
    return NextResponse.json(
      { error: "Failed to fetch distribution setting" },
      { status: 500 }
    );
  }
}

// 振り分け設定保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tenantId,
      projectId,
      isEnabled,
      distributionType,
      maxListsPerRotation,
      onLimitReached,
    } = body;

    if (!tenantId || !projectId) {
      return NextResponse.json(
        { error: "tenantId and projectId are required" },
        { status: 400 }
      );
    }

    const setting = await prisma.lineDistributionSetting.upsert({
      where: { projectId },
      create: {
        tenantId,
        projectId,
        isEnabled: isEnabled ?? false,
        distributionType: distributionType ?? "ROUND_ROBIN",
        maxListsPerRotation: maxListsPerRotation ?? 1,
        onLimitReached: onLimitReached ?? "NEXT_ACCOUNT",
      },
      update: {
        isEnabled: isEnabled ?? undefined,
        distributionType: distributionType ?? undefined,
        maxListsPerRotation: maxListsPerRotation ?? undefined,
        onLimitReached: onLimitReached ?? undefined,
      },
    });

    return NextResponse.json({ setting });
  } catch (error) {
    console.error("Error saving distribution setting:", error);
    return NextResponse.json(
      { error: "Failed to save distribution setting" },
      { status: 500 }
    );
  }
}
