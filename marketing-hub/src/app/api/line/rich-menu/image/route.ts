/**
 * リッチメニュー画像アップロードAPI
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { lineClient } from "@/lib/line/client";

// 有効な画像サイズ（ピクセル）
const VALID_SIZES = [
  { width: 2500, height: 1686 }, // Full
  { width: 2500, height: 843 },  // Half
  { width: 1200, height: 810 },  // Compact Full
  { width: 1200, height: 405 },  // Compact Half
];

// 最大ファイルサイズ（1MB）
const MAX_FILE_SIZE = 1024 * 1024;

/**
 * リッチメニュー画像アップロード
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const richMenuId = formData.get("richMenuId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!richMenuId) {
      return NextResponse.json(
        { error: "Rich menu ID is required" },
        { status: 400 }
      );
    }

    // ファイルタイプチェック
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      return NextResponse.json(
        { error: "Only JPEG and PNG images are supported" },
        { status: 400 }
      );
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 1MB" },
        { status: 400 }
      );
    }

    // DBからリッチメニュー取得
    const richMenu = await prisma.lineRichMenu.findUnique({
      where: { id: richMenuId },
    });

    if (!richMenu) {
      return NextResponse.json(
        { error: "Rich menu not found" },
        { status: 404 }
      );
    }

    if (!richMenu.lineRichMenuId) {
      return NextResponse.json(
        { error: "Rich menu is not synced with LINE. Please create it first." },
        { status: 400 }
      );
    }

    // 画像をBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // LINE APIで画像をアップロード
    if (!lineClient) {
      return NextResponse.json(
        { error: "LINE client is not configured" },
        { status: 500 }
      );
    }

    try {
      await lineClient.setRichMenuImage(
        richMenu.lineRichMenuId,
        buffer,
        file.type === "image/png" ? "image/png" : "image/jpeg"
      );
    } catch (lineError) {
      console.error("LINE API error uploading image:", lineError);
      return NextResponse.json(
        { error: "Failed to upload image to LINE. Please check the image dimensions." },
        { status: 400 }
      );
    }

    // DBのimageUrlを更新（LINE側で画像を保持するため、参照URLは不要だがフラグとして保存）
    await prisma.lineRichMenu.update({
      where: { id: richMenuId },
      data: {
        imageUrl: `line://${richMenu.lineRichMenuId}/image`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading rich menu image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

/**
 * 画像サイズ検証ヘルパー
 */
export function validateImageSize(width: number, height: number): boolean {
  return VALID_SIZES.some(
    (size) => size.width === width && size.height === height
  );
}
