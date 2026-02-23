import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { getCurrentUser } from "@/lib/auth/tenant";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

/**
 * 画像アップロードAPI
 * POST /api/upload
 * multipart/form-data: file
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ファイルが選択されていません" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "JPG, PNG, WebP, GIF, SVG のみアップロード可能です" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "ファイルサイズは10MB以下にしてください" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // テナント別ディレクトリに保存
    const uploadDir = join(process.cwd(), "public", "uploads", user.tenantId);
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const url = `/uploads/${user.tenantId}/${filename}`;

    return NextResponse.json({ url, filename, size: file.size }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "アップロードに失敗しました" }, { status: 500 });
  }
}
