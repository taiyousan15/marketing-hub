import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * 録画アクセストークンで録画情報を取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    // アクセスログを検索
    const accessLog = await prisma.recordingAccessLog.findUnique({
      where: { accessToken: token },
      include: {
        distribution: {
          include: {
            recording: {
              include: {
                liveStream: {
                  select: {
                    title: true,
                    description: true,
                    thumbnail: true,
                  },
                },
                transcription: {
                  select: {
                    status: true,
                    fullText: true,
                    segments: true,
                    summary: true,
                    keyPoints: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!accessLog) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 404 });
    }

    const { distribution } = accessLog;
    const { recording } = distribution;

    // 有効期限チェック
    if (distribution.expiresAt && new Date() > distribution.expiresAt) {
      return NextResponse.json({ error: "Recording access has expired" }, { status: 410 });
    }

    return NextResponse.json({
      recording: {
        id: recording.id,
        title: distribution.title || recording.liveStream.title,
        description: distribution.description || recording.liveStream.description,
        thumbnail: distribution.thumbnail || recording.liveStream.thumbnail,
        fileUrl: recording.fileUrl,
        duration: recording.duration,
        allowDownload: distribution.allowDownload,
      },
      transcription: recording.transcription
        ? {
            status: recording.transcription.status,
            fullText: recording.transcription.fullText,
            segments: recording.transcription.segments,
            summary: recording.transcription.summary,
            keyPoints: recording.transcription.keyPoints,
          }
        : null,
      watchProgress: accessLog.watchedUntil,
      expiresAt: distribution.expiresAt,
    });
  } catch (error) {
    console.error("Failed to get recording access:", error);
    return NextResponse.json({ error: "Failed to get recording" }, { status: 500 });
  }
}

/**
 * 視聴進捗を更新
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { watchedUntil } = body;

    // アクセスログを検索
    const accessLog = await prisma.recordingAccessLog.findUnique({
      where: { accessToken: token },
    });

    if (!accessLog) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 404 });
    }

    // 視聴進捗を更新（最大値を保持）
    await prisma.recordingAccessLog.update({
      where: { id: accessLog.id },
      data: {
        watchedUntil: Math.max(accessLog.watchedUntil, watchedUntil || 0),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update watch progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
