/**
 * LINEリッチメニュー管理API
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { lineClient } from "@/lib/line/client";
import { RichMenu } from "@line/bot-sdk";

// リッチメニュー一覧取得
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

    const richMenus = await prisma.lineRichMenu.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ richMenus });
  } catch (error) {
    console.error("Error fetching rich menus:", error);
    return NextResponse.json(
      { error: "Failed to fetch rich menus" },
      { status: 500 }
    );
  }
}

// リッチメニュー作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, name, size, areas, chatBarText, isDefault } = body;

    if (!tenantId || !name || !size || !areas) {
      return NextResponse.json(
        { error: "Required fields missing" },
        { status: 400 }
      );
    }

    // LINE APIでリッチメニューを作成
    const richMenuData: RichMenu = {
      size: size as RichMenu["size"],
      selected: isDefault || false,
      name: name,
      chatBarText: chatBarText || "メニュー",
      areas: areas as RichMenu["areas"],
    };

    let lineRichMenuId: string | null = null;

    if (lineClient) {
      try {
        lineRichMenuId = await lineClient.createRichMenu(richMenuData);
      } catch (lineError) {
        console.error("LINE API error creating rich menu:", lineError);
        // LINE APIエラーでもDBには保存を続行
      }
    }

    // DBに保存
    const richMenu = await prisma.lineRichMenu.create({
      data: {
        tenantId,
        name,
        lineRichMenuId,
        size: size as object,
        areas: areas as object,
        chatBarText: chatBarText || "メニュー",
        isDefault: isDefault || false,
      },
    });

    // デフォルトに設定する場合
    if (isDefault && lineRichMenuId && lineClient) {
      try {
        await lineClient.setDefaultRichMenu(lineRichMenuId);
        // 他のデフォルトを解除
        await prisma.lineRichMenu.updateMany({
          where: {
            tenantId,
            id: { not: richMenu.id },
          },
          data: { isDefault: false },
        });
      } catch (error) {
        console.error("Error setting default rich menu:", error);
      }
    }

    return NextResponse.json({ richMenu }, { status: 201 });
  } catch (error) {
    console.error("Error creating rich menu:", error);
    return NextResponse.json(
      { error: "Failed to create rich menu" },
      { status: 500 }
    );
  }
}

// リッチメニュー更新
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, chatBarText, isDefault, conditions } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existingMenu = await prisma.lineRichMenu.findUnique({
      where: { id },
    });

    if (!existingMenu) {
      return NextResponse.json(
        { error: "Rich menu not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name) updateData.name = name;
    if (chatBarText) updateData.chatBarText = chatBarText;
    if (conditions !== undefined) updateData.conditions = conditions;

    // デフォルト設定の更新
    if (isDefault !== undefined) {
      updateData.isDefault = isDefault;

      if (isDefault && existingMenu.lineRichMenuId && lineClient) {
        try {
          await lineClient.setDefaultRichMenu(existingMenu.lineRichMenuId);
          // 他のデフォルトを解除
          await prisma.lineRichMenu.updateMany({
            where: {
              tenantId: existingMenu.tenantId,
              id: { not: id },
            },
            data: { isDefault: false },
          });
        } catch (error) {
          console.error("Error setting default rich menu:", error);
        }
      }
    }

    const richMenu = await prisma.lineRichMenu.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ richMenu });
  } catch (error) {
    console.error("Error updating rich menu:", error);
    return NextResponse.json(
      { error: "Failed to update rich menu" },
      { status: 500 }
    );
  }
}

// リッチメニュー削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const richMenu = await prisma.lineRichMenu.findUnique({
      where: { id },
    });

    if (!richMenu) {
      return NextResponse.json(
        { error: "Rich menu not found" },
        { status: 404 }
      );
    }

    // LINE APIから削除
    if (richMenu.lineRichMenuId && lineClient) {
      try {
        await lineClient.deleteRichMenu(richMenu.lineRichMenuId);
      } catch (error) {
        console.error("Error deleting rich menu from LINE:", error);
      }
    }

    // DBから削除
    await prisma.lineRichMenu.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rich menu:", error);
    return NextResponse.json(
      { error: "Failed to delete rich menu" },
      { status: 500 }
    );
  }
}
