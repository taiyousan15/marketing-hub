import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

/**
 * LP台本から一括自動生成API
 * 台本テキスト → Geminiで構造化 → /api/ai/lp-generate に委譲
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const RequestSchema = z.object({
  script: z.string().min(10).max(10000),
});

function extractJson(content: string): string | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = content.indexOf('{');
  if (start === -1) return null;
  for (let end = content.lastIndexOf('}'); end > start; end--) {
    const candidate = content.slice(start, end + 1);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // try shorter
    }
  }
  return null;
}

async function parseScriptToAnswers(script: string): Promise<Record<string, unknown>> {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY が設定されていません');

  const prompt = `以下のLP台本テキストを分析して、JSON形式でLP構造を抽出してください。

【LP台本】
${script}

【出力形式】以下のJSONのみを返してください（余分な説明不要）:
{
  "productName": "商品/サービス名（台本から推定・20文字以内）",
  "productDescription": "商品概要（1-2文・100文字以内）",
  "targetAudience": "ターゲット顧客層（台本から推定・100文字以内）",
  "problems": ["悩み1", "悩み2", "悩み3"],
  "benefits": ["ベネフィット1", "ベネフィット2", "ベネフィット3", "ベネフィット4"],
  "uniqueValue": "独自価値・差別化ポイント（100文字以内）",
  "industry": "業界キーワード（英語: business, education, fitness等）",
  "ctaType": "optin または purchase または contact または webinar のいずれか",
  "urgency": "緊急性・限定性（台本から抽出）",
  "style": "コピーのスタイル（energetic / professional / warm のいずれか）"
}

台本から読み取れない項目は合理的に推定してください。`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini解析エラー: ${res.status} - ${err}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const jsonStr = extractJson(text);
  if (!jsonStr) throw new Error('Geminiからの応答にJSONが含まれていません');

  return JSON.parse(jsonStr) as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { script } = RequestSchema.parse(body);

    // Step 1: Geminiで台本を解析してWizardAnswers形式に変換
    const answers = await parseScriptToAnswers(script);

    // Step 2: /api/ai/lp-generate に委譲（同じサーバー内で直接呼び出し）
    const baseUrl = request.nextUrl.origin;
    const lpResponse = await fetch(`${baseUrl}/api/ai/lp-generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Clerk認証をバイパスするためにcookieを転送
        cookie: request.headers.get('cookie') ?? '',
      },
      body: JSON.stringify({ answers }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!lpResponse.ok) {
      const err = await lpResponse.json().catch(() => ({ error: 'LP生成失敗' }));
      throw new Error(err.error || 'LP生成に失敗しました');
    }

    const lpData = await lpResponse.json();
    return NextResponse.json({
      ...lpData,
      parsedAnswers: answers,
    });
  } catch (error) {
    console.error('[lp-generate-from-script] error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
