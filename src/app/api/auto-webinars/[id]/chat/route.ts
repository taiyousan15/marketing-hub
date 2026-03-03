import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const postSchema = z.object({
  senderName: z.string().min(1).max(50),
  content: z.string().min(1).max(500),
  appearAtSeconds: z.number().int().min(0),
  messageType: z.enum(["COMMENT", "QUESTION", "REACTION", "TESTIMONIAL"]).default("COMMENT"),
});

/**
 * GET: 視聴者コメントを取得
 * ?since=<ISO datetime> で差分取得
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const sinceParam = request.nextUrl.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : undefined;

  try {
    const messages = await prisma.viewerChatMessage.findMany({
      where: {
        autoWebinarId: id,
        ...(since ? { createdAt: { gt: since } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    return NextResponse.json({
      messages,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[chat GET] error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

/**
 * POST: 視聴者コメントを投稿（AI botが有効なら自動返信）
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const webinar = await prisma.automatedWebinar.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      simulatedChatEnabled: true,
      aiBotEnabled: true,
      aiBotName: true,
      aiBotContext: true,
    },
  });

  if (!webinar) {
    return NextResponse.json({ error: "Webinar not found" }, { status: 404 });
  }

  try {
    const message = await prisma.viewerChatMessage.create({
      data: {
        autoWebinarId: id,
        senderName: parsed.data.senderName,
        content: parsed.data.content,
        appearAtSeconds: parsed.data.appearAtSeconds,
        messageType: parsed.data.messageType,
      },
    });

    // AI bot: 非同期で返信生成（レスポンスをブロックしない）
    if (webinar.aiBotEnabled) {
      generateBotReply(webinar, parsed.data.content, parsed.data.appearAtSeconds).catch(
        (err) => console.error("[AI bot] reply error:", err)
      );
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("[chat POST] error:", error);
    return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
  }
}

async function generateBotReply(
  webinar: {
    id: string;
    title: string | null;
    aiBotName: string;
    aiBotContext: string | null;
  },
  viewerComment: string,
  appearAtSeconds: number
): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    systemInstruction: buildBotSystemPrompt(webinar),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 150,
    },
  });

  const result = await model.generateContent(viewerComment);
  const replyText = result.response.text().trim();

  if (!replyText) return;

  // 2秒後に表示（自然な返信タイミング）
  const replyAt = appearAtSeconds + 3;

  await prisma.viewerChatMessage.create({
    data: {
      autoWebinarId: webinar.id,
      senderName: webinar.aiBotName,
      content: replyText.slice(0, 500),
      appearAtSeconds: replyAt,
      messageType: "COMMENT",
    },
  });
}

function buildBotSystemPrompt(webinar: {
  title: string | null;
  aiBotName: string;
  aiBotContext: string | null;
}): string {
  const lines = [
    `あなたは「${webinar.aiBotName}」というセミナー講師のAIアシスタントです。`,
    `現在、「${webinar.title ?? "ウェビナー"}」というオートウェビナーのライブチャットで視聴者からのコメントに返答しています。`,
    "",
    "返答のルール:",
    "- セミナー講師として親しみやすく、専門的に返答してください",
    "- 返答は80文字以内の簡潔な日本語で答えてください",
    "- 視聴者を励まし、参加意欲を高める言葉をかけてください",
    "- 質問には具体的に答え、「ぜひ後ほど詳しく解説します」などのフォローも加えてください",
    "- 返答のみを出力してください（前置き・説明不要）",
  ];

  if (webinar.aiBotContext) {
    lines.push("", "セミナー・講師の追加情報:", webinar.aiBotContext);
  }

  return lines.join("\n");
}
