/**
 * LINE公式アカウント管理API
 * 複数アカウントの振り分け機能
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Client } from "@line/bot-sdk";

// LINEアカウント一覧取得
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

    // LINEアカウント一覧を取得（プロジェクトでフィルタリング可能）
    const whereClause: { tenantId: string; projectId?: string | null } = { tenantId };
    if (projectId) {
      whereClause.projectId = projectId;
    }

    const accounts = await prisma.lineAccount.findMany({
      where: whereClause,
      orderBy: { order: "asc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: { contacts: true },
        },
      },
    });

    // 振り分け設定を取得（プロジェクト単位）
    let distributionSetting = null;
    if (projectId) {
      distributionSetting = await prisma.lineDistributionSetting.findUnique({
        where: { projectId },
      });
    }

    // アクセストークンをマスク
    const maskedAccounts = accounts.map((account) => ({
      ...account,
      channelSecret: "••••••••",
      accessToken: "••••••••",
      currentFriends: account._count.contacts,
    }));

    return NextResponse.json({
      accounts: maskedAccounts,
      distributionSetting: distributionSetting || {
        isEnabled: false,
        distributionType: "ROUND_ROBIN",
        maxListsPerRotation: 1,
        currentIndex: 0,
        onLimitReached: "NEXT_ACCOUNT",
      },
    });
  } catch (error) {
    console.error("Error fetching LINE accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch LINE accounts" },
      { status: 500 }
    );
  }
}

// LINEアカウント追加
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, projectId, name, channelId, channelSecret, accessToken } = body;

    if (!tenantId || !name || !channelId || !channelSecret || !accessToken) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    // 接続テスト
    let botInfo = null;
    try {
      const client = new Client({
        channelAccessToken: accessToken,
        channelSecret: channelSecret,
      });
      botInfo = await client.getBotInfo();
    } catch (lineError) {
      return NextResponse.json(
        { error: "LINE接続に失敗しました。認証情報を確認してください。" },
        { status: 400 }
      );
    }

    // 現在の最大orderを取得（プロジェクト単位）
    const maxOrder = await prisma.lineAccount.aggregate({
      where: projectId ? { projectId } : { tenantId },
      _max: { order: true },
    });

    // アカウントを作成
    const account = await prisma.lineAccount.create({
      data: {
        tenantId,
        projectId: projectId || null,
        name,
        channelId,
        channelSecret,
        accessToken,
        botUserId: botInfo.userId,
        botBasicId: botInfo.basicId,
        botDisplayName: botInfo.displayName,
        botPictureUrl: botInfo.pictureUrl,
        isConnected: true,
        lastTestedAt: new Date(),
        order: (maxOrder._max.order || 0) + 1,
      },
    });

    // プロジェクトの統計を更新
    if (projectId) {
      await prisma.lineProject.update({
        where: { id: projectId },
        data: { totalAccounts: { increment: 1 } },
      });
    }

    return NextResponse.json({
      account: {
        ...account,
        channelSecret: "••••••••",
        accessToken: "••••••••",
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating LINE account:", error);
    return NextResponse.json(
      { error: "Failed to create LINE account" },
      { status: 500 }
    );
  }
}

// LINEアカウント更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, projectId, name, isActive, order, weight, maxFriends } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // 元のアカウント情報を取得（プロジェクト変更時の統計更新用）
    const oldAccount = await prisma.lineAccount.findUnique({
      where: { id },
      select: { projectId: true },
    });

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (order !== undefined) updateData.order = order;
    if (weight !== undefined) updateData.weight = weight;
    if (maxFriends !== undefined) updateData.maxFriends = maxFriends;
    if (projectId !== undefined) updateData.projectId = projectId || null;

    const account = await prisma.lineAccount.update({
      where: { id },
      data: updateData,
    });

    // プロジェクトの統計を更新
    if (projectId !== undefined && oldAccount?.projectId !== projectId) {
      // 旧プロジェクトの統計を減らす
      if (oldAccount?.projectId) {
        await prisma.lineProject.update({
          where: { id: oldAccount.projectId },
          data: { totalAccounts: { decrement: 1 } },
        });
      }
      // 新プロジェクトの統計を増やす
      if (projectId) {
        await prisma.lineProject.update({
          where: { id: projectId },
          data: { totalAccounts: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({
      account: {
        ...account,
        channelSecret: "••••••••",
        accessToken: "••••••••",
      },
    });
  } catch (error) {
    console.error("Error updating LINE account:", error);
    return NextResponse.json(
      { error: "Failed to update LINE account" },
      { status: 500 }
    );
  }
}

// LINEアカウント削除
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

    // 紐付いているコンタクトのlineAccountIdをnullに
    await prisma.contact.updateMany({
      where: { lineAccountId: id },
      data: { lineAccountId: null },
    });

    await prisma.lineAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting LINE account:", error);
    return NextResponse.json(
      { error: "Failed to delete LINE account" },
      { status: 500 }
    );
  }
}
