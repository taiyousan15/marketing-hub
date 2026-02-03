import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { TranscriptionStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ eventId: string; recordingId: string }>;
}

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
}

/**
 * トランスクリプションの取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId, recordingId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "full";

    // 録画の存在確認
    const recording = await prisma.liveRecording.findFirst({
      where: {
        id: recordingId,
        liveStream: {
          eventId,
        },
      },
      include: {
        transcription: true,
      },
    });

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    if (!recording.transcription) {
      return NextResponse.json({ error: "Transcription not found" }, { status: 404 });
    }

    const transcription = recording.transcription;

    // フォーマットに応じてレスポンスを変える
    switch (format) {
      case "text":
        return NextResponse.json({
          text: transcription.fullText,
          wordCount: transcription.wordCount,
        });

      case "segments":
        return NextResponse.json({
          segments: transcription.segments,
          speakers: transcription.speakers,
        });

      case "summary":
        return NextResponse.json({
          summary: transcription.summary,
          keyPoints: transcription.keyPoints,
          actionItems: transcription.actionItems,
        });

      case "srt":
        const srt = generateSRT((transcription.segments as unknown as TranscriptionSegment[]) || []);
        return new NextResponse(srt, {
          headers: {
            "Content-Type": "text/plain",
            "Content-Disposition": `attachment; filename="transcription-${recordingId}.srt"`,
          },
        });

      case "vtt":
        const vtt = generateVTT((transcription.segments as unknown as TranscriptionSegment[]) || []);
        return new NextResponse(vtt, {
          headers: {
            "Content-Type": "text/vtt",
            "Content-Disposition": `attachment; filename="transcription-${recordingId}.vtt"`,
          },
        });

      default:
        return NextResponse.json({
          status: transcription.status,
          language: transcription.language,
          fullText: transcription.fullText,
          segments: transcription.segments,
          speakers: transcription.speakers,
          wordCount: transcription.wordCount,
          summary: transcription.summary,
          keyPoints: transcription.keyPoints,
          actionItems: transcription.actionItems,
          processingStartedAt: transcription.processingStartedAt,
          processingEndedAt: transcription.processingEndedAt,
        });
    }
  } catch (error) {
    console.error("Failed to get transcription:", error);
    return NextResponse.json({ error: "Failed to get transcription" }, { status: 500 });
  }
}

/**
 * トランスクリプションの開始
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId, recordingId } = await params;
    const body = await request.json();
    const { language = "ja", generateSummary = true } = body;

    // 録画の存在確認
    const recording = await prisma.liveRecording.findFirst({
      where: {
        id: recordingId,
        liveStream: {
          eventId,
        },
      },
    });

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    if (!recording.fileUrl) {
      return NextResponse.json({ error: "Recording file not available" }, { status: 400 });
    }

    // 既存のトランスクリプションがあるかチェック
    const existingTranscription = await prisma.recordingTranscription.findUnique({
      where: { recordingId },
    });

    if (existingTranscription && existingTranscription.status === TranscriptionStatus.PROCESSING) {
      return NextResponse.json({ error: "Transcription already in progress" }, { status: 409 });
    }

    // トランスクリプションを作成または更新
    const transcription = await prisma.recordingTranscription.upsert({
      where: { recordingId },
      create: {
        recordingId,
        language,
        status: TranscriptionStatus.PENDING,
      },
      update: {
        language,
        status: TranscriptionStatus.PENDING,
        processingError: null,
      },
    });

    // バックグラウンドでトランスクリプション処理を開始
    startTranscriptionProcess(transcription.id, recording.fileUrl, language, generateSummary);

    return NextResponse.json({
      message: "Transcription started",
      transcriptionId: transcription.id,
      status: TranscriptionStatus.PENDING,
    });
  } catch (error) {
    console.error("Failed to start transcription:", error);
    return NextResponse.json({ error: "Failed to start transcription" }, { status: 500 });
  }
}

/**
 * トランスクリプションの更新（手動編集）
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { eventId, recordingId } = await params;
    const body = await request.json();
    const { fullText, segments, summary, keyPoints, actionItems } = body;

    // 録画の存在確認
    const recording = await prisma.liveRecording.findFirst({
      where: {
        id: recordingId,
        liveStream: {
          eventId,
        },
      },
    });

    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    // トランスクリプションを更新
    const transcription = await prisma.recordingTranscription.update({
      where: { recordingId },
      data: {
        fullText,
        segments,
        summary,
        keyPoints,
        actionItems,
        wordCount: fullText ? fullText.split(/\s+/).length : undefined,
      },
    });

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error("Failed to update transcription:", error);
    return NextResponse.json({ error: "Failed to update transcription" }, { status: 500 });
  }
}

/**
 * バックグラウンドでトランスクリプション処理
 */
async function startTranscriptionProcess(
  transcriptionId: string,
  fileUrl: string,
  language: string,
  generateSummary: boolean
) {
  try {
    // ステータスを処理中に更新
    await prisma.recordingTranscription.update({
      where: { id: transcriptionId },
      data: {
        status: TranscriptionStatus.PROCESSING,
        processingStartedAt: new Date(),
      },
    });

    // ここで実際の文字起こしAPIを呼び出す
    // 例: OpenAI Whisper, Google Speech-to-Text, AssemblyAI など
    // 実際の実装では環境変数から選択したサービスのAPIキーを使用

    // デモ用のモック処理（実際には外部APIを呼び出す）
    const transcriptionResult = await mockTranscriptionAPI(fileUrl, language);

    // サマリー生成
    let summary = null;
    let keyPoints = null;
    let actionItems = null;

    if (generateSummary && transcriptionResult.fullText) {
      const summaryResult = await generateTranscriptionSummary(transcriptionResult.fullText);
      summary = summaryResult.summary;
      keyPoints = summaryResult.keyPoints;
      actionItems = summaryResult.actionItems;
    }

    // 結果を保存
    await prisma.recordingTranscription.update({
      where: { id: transcriptionId },
      data: {
        status: TranscriptionStatus.COMPLETED,
        fullText: transcriptionResult.fullText,
        segments: transcriptionResult.segments,
        speakers: transcriptionResult.speakers,
        wordCount: transcriptionResult.fullText?.split(/\s+/).length || 0,
        summary,
        keyPoints: keyPoints || undefined,
        actionItems: actionItems || undefined,
        processingEndedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Transcription processing failed:", error);
    await prisma.recordingTranscription.update({
      where: { id: transcriptionId },
      data: {
        status: TranscriptionStatus.FAILED,
        processingError: error instanceof Error ? error.message : "Unknown error",
        processingEndedAt: new Date(),
      },
    });
  }
}

/**
 * モック文字起こしAPI（実際には外部サービスを使用）
 */
async function mockTranscriptionAPI(fileUrl: string, language: string) {
  // 実際の実装では:
  // - OpenAI Whisper API
  // - Google Cloud Speech-to-Text
  // - AssemblyAI
  // - AWS Transcribe
  // などを使用

  return {
    fullText: "（トランスクリプションの全文がここに入ります）",
    segments: [
      { start: 0, end: 5, text: "はい、みなさんこんにちは。", speaker: "Speaker 1" },
      { start: 5, end: 10, text: "今日のウェビナーへようこそ。", speaker: "Speaker 1" },
    ],
    speakers: [
      { id: "Speaker 1", name: "ホスト" },
    ],
  };
}

/**
 * トランスクリプションサマリー生成（AI）
 */
async function generateTranscriptionSummary(fullText: string) {
  // 実際の実装では:
  // - OpenAI GPT-4
  // - Claude API
  // - その他のLLM
  // を使用してサマリー生成

  return {
    summary: "（AIによるサマリーがここに入ります）",
    keyPoints: [
      "要点1",
      "要点2",
      "要点3",
    ],
    actionItems: [
      "アクションアイテム1",
      "アクションアイテム2",
    ],
  };
}

/**
 * SRTフォーマット生成
 */
function generateSRT(segments: TranscriptionSegment[]): string {
  return segments
    .map((segment, index) => {
      const startTime = formatSRTTime(segment.start);
      const endTime = formatSRTTime(segment.end);
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
    })
    .join("\n");
}

/**
 * VTTフォーマット生成
 */
function generateVTT(segments: TranscriptionSegment[]): string {
  const header = "WEBVTT\n\n";
  const cues = segments
    .map((segment) => {
      const startTime = formatVTTTime(segment.start);
      const endTime = formatVTTTime(segment.end);
      return `${startTime} --> ${endTime}\n${segment.text}\n`;
    })
    .join("\n");
  return header + cues;
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms
    .toString()
    .padStart(3, "0")}`;
}

function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms
    .toString()
    .padStart(3, "0")}`;
}
