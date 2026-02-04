import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";

/**
 * LP Builder 画像アップロードAPI
 * ローカルストレージにファイルを保存（本番環境ではS3/Cloudflare R2等を使用）
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが選択されていません" },
        { status: 400 }
      );
    }

    // ファイルタイプの検証
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "対応していないファイル形式です（JPEG, PNG, GIF, WebP のみ）" },
        { status: 400 }
      );
    }

    // ファイルサイズの検証（5MB制限）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "ファイルサイズは5MB以下にしてください" },
        { status: 400 }
      );
    }

    // ファイル名の生成
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${nanoid()}.${extension}`;

    // アップロードディレクトリの作成
    const uploadDir = join(process.cwd(), "public", "uploads", "lp-builder");
    await mkdir(uploadDir, { recursive: true });

    // ファイルの保存
    const filepath = join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // 公開URLを返す
    const url = `/uploads/lp-builder/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "アップロードに失敗しました" },
      { status: 500 }
    );
  }
}
