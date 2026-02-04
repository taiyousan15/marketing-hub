import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ExternalMeetingPlatform } from "@prisma/client";

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

/**
 * 外部ミーティング連携設定の取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    // ライブストリームを検索
    const liveStream = await prisma.liveStream.findFirst({
      where: { eventId },
      include: {
        externalIntegration: true,
      },
    });

    if (!liveStream) {
      return NextResponse.json({ error: "LiveStream not found" }, { status: 404 });
    }

    return NextResponse.json({
      integration: liveStream.externalIntegration,
      liveStreamId: liveStream.id,
    });
  } catch (error) {
    console.error("Failed to get external meeting integration:", error);
    return NextResponse.json({ error: "Failed to get integration" }, { status: 500 });
  }
}

/**
 * 外部ミーティング連携設定の作成・更新
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const body = await request.json();

    const {
      platform,
      meetingId,
      meetingUrl,
      password,
      hostEmail,
      autoRecordEnabled,
      autoTranscribe,
      importRecordingOnEnd,
    } = body;

    // ライブストリームを検索
    const liveStream = await prisma.liveStream.findFirst({
      where: { eventId },
    });

    if (!liveStream) {
      return NextResponse.json({ error: "LiveStream not found" }, { status: 404 });
    }

    // 外部ミーティング連携をupsert
    const integration = await prisma.externalMeetingIntegration.upsert({
      where: { liveStreamId: liveStream.id },
      create: {
        liveStreamId: liveStream.id,
        platform: platform || ExternalMeetingPlatform.ZOOM,
        meetingId,
        meetingUrl,
        password,
        hostEmail,
        autoRecordEnabled: autoRecordEnabled ?? true,
        autoTranscribe: autoTranscribe ?? true,
        importRecordingOnEnd: importRecordingOnEnd ?? true,
      },
      update: {
        platform: platform || undefined,
        meetingId,
        meetingUrl,
        password,
        hostEmail,
        autoRecordEnabled,
        autoTranscribe,
        importRecordingOnEnd,
      },
    });

    return NextResponse.json({ integration });
  } catch (error) {
    console.error("Failed to update external meeting integration:", error);
    return NextResponse.json({ error: "Failed to update integration" }, { status: 500 });
  }
}

/**
 * Zoom OAuthトークンの設定
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;
    const body = await request.json();
    const { code, redirectUri } = body;

    // ライブストリームを検索
    const liveStream = await prisma.liveStream.findFirst({
      where: { eventId },
      include: {
        externalIntegration: true,
      },
    });

    if (!liveStream) {
      return NextResponse.json({ error: "LiveStream not found" }, { status: 404 });
    }

    if (!liveStream.externalIntegration) {
      return NextResponse.json({ error: "Integration not configured" }, { status: 400 });
    }

    // Zoom OAuth認証（実際の実装）
    if (liveStream.externalIntegration.platform === ExternalMeetingPlatform.ZOOM) {
      const tokens = await exchangeZoomCode(code, redirectUri);

      await prisma.externalMeetingIntegration.update({
        where: { id: liveStream.externalIntegration.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        },
      });

      return NextResponse.json({ success: true });
    }

    // Google Meet OAuth認証
    if (liveStream.externalIntegration.platform === ExternalMeetingPlatform.GOOGLE_MEET) {
      const tokens = await exchangeGoogleCode(code, redirectUri);

      await prisma.externalMeetingIntegration.update({
        where: { id: liveStream.externalIntegration.id },
        data: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported platform" }, { status: 400 });
  } catch (error) {
    console.error("Failed to authenticate external platform:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

/**
 * 外部ミーティングから録画をインポート
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId } = await params;

    // ライブストリームを検索
    const liveStream = await prisma.liveStream.findFirst({
      where: { eventId },
      include: {
        externalIntegration: true,
      },
    });

    if (!liveStream) {
      return NextResponse.json({ error: "LiveStream not found" }, { status: 404 });
    }

    if (!liveStream.externalIntegration) {
      return NextResponse.json({ error: "Integration not configured" }, { status: 400 });
    }

    const integration = liveStream.externalIntegration;

    // プラットフォーム別に録画を取得
    let recordingUrl: string | null = null;
    let recordingDuration: number | null = null;

    if (integration.platform === ExternalMeetingPlatform.ZOOM) {
      const recordings = await getZoomRecordings(integration);
      if (recordings && recordings.length > 0) {
        recordingUrl = recordings[0].download_url;
        recordingDuration = recordings[0].duration;
      }
    } else if (integration.platform === ExternalMeetingPlatform.GOOGLE_MEET) {
      const recording = await getGoogleMeetRecording(integration);
      if (recording) {
        recordingUrl = recording.downloadUrl;
        recordingDuration = recording.duration;
      }
    }

    if (!recordingUrl) {
      return NextResponse.json({ error: "No recording found" }, { status: 404 });
    }

    // 録画をインポート
    const liveRecording = await prisma.liveRecording.create({
      data: {
        liveStreamId: liveStream.id,
        egressId: `external-${integration.platform}-${Date.now()}`,
        fileUrl: recordingUrl,
        duration: recordingDuration,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // 自動トランスクリプションが有効な場合
    if (integration.autoTranscribe) {
      await prisma.recordingTranscription.create({
        data: {
          recordingId: liveRecording.id,
          status: "PENDING",
        },
      });
      // トランスクリプション処理をキューに追加（実際の実装では非同期処理）
    }

    return NextResponse.json({
      success: true,
      recording: liveRecording,
    });
  } catch (error) {
    console.error("Failed to import recording:", error);
    return NextResponse.json({ error: "Failed to import recording" }, { status: 500 });
  }
}

/**
 * Zoom認証コードをトークンに交換
 */
async function exchangeZoomCode(code: string, redirectUri: string) {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Zoom credentials not configured");
  }

  const response = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Zoom code");
  }

  return response.json();
}

/**
 * Google認証コードをトークンに交換
 */
async function exchangeGoogleCode(code: string, redirectUri: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange Google code");
  }

  return response.json();
}

/**
 * Zoom録画を取得
 */
async function getZoomRecordings(integration: any) {
  if (!integration.accessToken || !integration.meetingId) {
    return null;
  }

  const response = await fetch(
    `https://api.zoom.us/v2/meetings/${integration.meetingId}/recordings`,
    {
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    console.error("Failed to fetch Zoom recordings");
    return null;
  }

  const data = await response.json();
  return data.recording_files;
}

interface GoogleMeetRecording {
  downloadUrl: string;
  duration: number;
}

/**
 * Google Meet録画を取得
 */
async function getGoogleMeetRecording(integration: any): Promise<GoogleMeetRecording | null> {
  // Google Meet録画はGoogle Drive経由でアクセス
  // 実際の実装ではGoogle Drive APIを使用

  // TODO: Google Drive API実装
  // 1. accessTokenを使ってGoogle Drive APIにアクセス
  // 2. meetingIdに関連する録画ファイルを検索
  // 3. ダウンロードURLと長さを取得

  return null;
}
