import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { RecordingAccessLevel } from "@prisma/client";
import crypto from "crypto";

interface RouteParams {
  params: Promise<{ eventId: string; recordingId: string }>;
}

/**
 * 録画配布設定の取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId, recordingId } = await params;

    // 録画の存在確認
    const recording = await prisma.liveRecording.findFirst({
      where: {
        id: recordingId,
        liveStream: {
          eventId,
        },
      },
      include: {
        distribution: {
          include: {
            accesses: {
              take: 100,
              orderBy: { accessedAt: "desc" },
            },
          },
        },
        transcription: true,
      },
    });

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    return NextResponse.json({
      recording: {
        id: recording.id,
        fileUrl: recording.fileUrl,
        duration: recording.duration,
        status: recording.status,
      },
      distribution: recording.distribution,
      transcription: recording.transcription,
    });
  } catch (error) {
    console.error("Failed to get distribution:", error);
    return NextResponse.json({ error: "Failed to get distribution" }, { status: 500 });
  }
}

/**
 * 録画配布設定の作成・更新
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId, recordingId } = await params;
    const body = await request.json();

    const {
      accessLevel,
      title,
      description,
      thumbnail,
      expiresAt,
      specifiedContactIds,
      requiredProductId,
      requiredTagId,
      notifyOnAvailable,
      notifyViaEmail,
      notifyViaLine,
      allowDownload,
    } = body;

    // 録画の存在確認
    const recording = await prisma.liveRecording.findFirst({
      where: {
        id: recordingId,
        liveStream: {
          eventId,
        },
      },
      include: {
        liveStream: true,
      },
    });

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    // 配布設定をupsert
    const distribution = await prisma.recordingDistribution.upsert({
      where: { recordingId },
      create: {
        recordingId,
        accessLevel: accessLevel || RecordingAccessLevel.ALL,
        title,
        description,
        thumbnail,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        specifiedContactIds,
        requiredProductId,
        requiredTagId,
        notifyOnAvailable: notifyOnAvailable ?? true,
        notifyViaEmail: notifyViaEmail ?? true,
        notifyViaLine: notifyViaLine ?? true,
        allowDownload: allowDownload ?? false,
      },
      update: {
        accessLevel: accessLevel || undefined,
        title,
        description,
        thumbnail,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        specifiedContactIds,
        requiredProductId,
        requiredTagId,
        notifyOnAvailable,
        notifyViaEmail,
        notifyViaLine,
        allowDownload,
      },
    });

    // 通知送信（必要に応じて）
    if (notifyOnAvailable && body.sendNotification) {
      await sendDistributionNotification(distribution, recording);
    }

    return NextResponse.json({ distribution });
  } catch (error) {
    console.error("Failed to update distribution:", error);
    return NextResponse.json({ error: "Failed to update distribution" }, { status: 500 });
  }
}

/**
 * 配布通知を送信
 */
async function sendDistributionNotification(
  distribution: any,
  recording: any
) {
  try {
    const liveStream = recording.liveStream;

    // アクセスレベルに応じてコンタクトを取得
    let contacts: any[] = [];

    switch (distribution.accessLevel) {
      case RecordingAccessLevel.ALL:
        // ライブ配信に参加した全員
        const sessions = await prisma.liveSession.findMany({
          where: { liveStreamId: liveStream.id },
          select: { contactId: true },
        });
        const contactIds = sessions
          .map((s) => s.contactId)
          .filter((id): id is string => id !== null);
        if (contactIds.length > 0) {
          contacts = await prisma.contact.findMany({
            where: { id: { in: contactIds } },
          });
        }
        break;

      case RecordingAccessLevel.SPECIFIED:
        // 指定されたコンタクト
        if (distribution.specifiedContactIds) {
          contacts = await prisma.contact.findMany({
            where: {
              id: { in: distribution.specifiedContactIds as string[] },
            },
          });
        }
        break;

      case RecordingAccessLevel.PURCHASERS:
        // 購入者（タグベース）
        if (distribution.requiredTagId) {
          const taggedContacts = await prisma.contactTag.findMany({
            where: { tagId: distribution.requiredTagId },
            include: { contact: true },
          });
          contacts = taggedContacts.map((tc) => tc.contact);
        }
        break;
    }

    // 通知送信処理（省略 - 実際のLINE/メール送信はここで実装）
    console.log(`Sending notification to ${contacts.length} contacts`);

  } catch (error) {
    console.error("Failed to send distribution notification:", error);
  }
}

/**
 * アクセストークン生成
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId, recordingId } = await params;
    const body = await request.json();
    const { contactId } = body;

    // 配布設定を確認
    const distribution = await prisma.recordingDistribution.findFirst({
      where: {
        recording: {
          id: recordingId,
          liveStream: {
            eventId,
          },
        },
      },
      include: {
        recording: {
          include: {
            liveStream: true,
          },
        },
      },
    });

    if (!distribution) {
      return NextResponse.json({ error: "Distribution not found" }, { status: 404 });
    }

    // 有効期限チェック
    if (distribution.expiresAt && new Date() > distribution.expiresAt) {
      return NextResponse.json({ error: "Recording has expired" }, { status: 410 });
    }

    // アクセス権限チェック
    const hasAccess = await checkRecordingAccess(distribution, contactId);
    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // アクセストークンを生成
    const accessToken = crypto.randomBytes(32).toString("hex");

    // アクセスログを作成
    const accessLog = await prisma.recordingAccessLog.create({
      data: {
        distributionId: distribution.id,
        contactId,
        accessToken,
      },
    });

    // 視聴カウント更新
    await prisma.recordingDistribution.update({
      where: { id: distribution.id },
      data: {
        totalViews: { increment: 1 },
        uniqueViews: contactId ? { increment: 1 } : undefined,
      },
    });

    return NextResponse.json({
      accessToken,
      recording: {
        id: distribution.recording.id,
        title: distribution.title || distribution.recording.liveStream.title,
        duration: distribution.recording.duration,
        allowDownload: distribution.allowDownload,
      },
    });
  } catch (error) {
    console.error("Failed to generate access token:", error);
    return NextResponse.json({ error: "Failed to generate access token" }, { status: 500 });
  }
}

/**
 * アクセス権限チェック
 */
async function checkRecordingAccess(
  distribution: any,
  contactId?: string
): Promise<boolean> {
  switch (distribution.accessLevel) {
    case RecordingAccessLevel.ALL:
      return true;

    case RecordingAccessLevel.SPECIFIED:
      if (!contactId) return false;
      const specifiedIds = (distribution.specifiedContactIds as string[]) || [];
      return specifiedIds.includes(contactId);

    case RecordingAccessLevel.PURCHASERS:
      if (!contactId) return false;
      if (distribution.requiredTagId) {
        const hasTag = await prisma.contactTag.findFirst({
          where: {
            contactId,
            tagId: distribution.requiredTagId,
          },
        });
        return !!hasTag;
      }
      return true;

    case RecordingAccessLevel.NONE:
      return false;

    default:
      return false;
  }
}
