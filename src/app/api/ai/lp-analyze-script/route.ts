import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';

/**
 * LP台本 → セクション構成解析 API
 * Gemini でスクリプトを解析し、SectionBuilderSection 互換の配列を返す
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const requestSchema = z.object({
  script: z.string().min(10).max(20000),
  stylePrompt: z.string().max(1000).optional(),
});

type LPSectionType = 'header' | 'hero' | 'problem' | 'benefit' | 'testimonial' | 'cta' | 'faq' | 'footer';

const SECTION_NAMES: Record<LPSectionType, string> = {
  header:      'ヘッダー',
  hero:        'ヒーローセクション',
  problem:     '悩み・課題',
  benefit:     'ベネフィット・解決策',
  testimonial: 'お客様の声・実績',
  cta:         '申し込み・CTA',
  faq:         'よくある質問',
  footer:      'フッター・プロフィール',
};

function extractJsonArray(content: string): string | null {
  // Fenced code block — validate before returning
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try { JSON.parse(fenced[1].trim()); return fenced[1].trim(); } catch { /* fall through */ }
  }

  // Raw array — try progressively shorter substrings
  const start = content.indexOf('[');
  if (start !== -1) {
    for (let end = content.lastIndexOf(']'); end > start; end--) {
      const candidate = content.slice(start, end + 1);
      try { JSON.parse(candidate); return candidate; } catch { /* try shorter */ }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY が設定されていません' }, { status: 503 });
    }

    const raw = await request.json();
    const { script, stylePrompt } = requestSchema.parse(raw);

    const prompt = `あなたはLPデザインの専門家です。以下のLP台本を分析して、LP（ランディングページ）のセクション構成をJSON配列で出力してください。

【LP台本】
${script}
${stylePrompt ? `\n【画像スタイル指示】\n${stylePrompt}\n` : ''}

【出力形式】以下のJSON配列のみを返してください（説明文・コメント不要）:
[
  {
    "type": "hero",
    "title": "このセクションのメインキャッチコピー（台本から一字一句そのまま抜き出す・要約・改変・省略は絶対禁止）",
    "content": "このセクションの詳細コンテンツ（台本から一字一句そのまま抜き出す・要約・改変・省略は絶対禁止。複数行ある場合は改行\\nで区切って全文そのまま記載）",
    "imagePrompt": "Detailed English visual prompt for Nano Banana 2 image generation (3-4 sentences). Describe ONLY visual elements: atmosphere, color palette, composition, background, objects, lighting, photographic style. NO text rendering — purely visual imagery without any written words.",
    "industry": "業界キーワード英語（business / health / education / fitness / beauty / finance / tech のいずれか）"
  }
]

【セクション種別（typeに使用）】
- "header": ロゴ・ナビゲーション
- "hero": ファーストビュー・メインキャッチコピー
- "problem": 悩み・課題・ペイン
- "benefit": ベネフィット・解決策・特徴
- "testimonial": お客様の声・実績・事例
- "cta": 申し込みフォーム・ボタン・クロージング
- "faq": よくある質問
- "footer": プロフィール・会社情報・免責事項

【絶対ルール — 必ず守ること】
- title・content は台本の文章を一字一句そのまま使う（要約・言い換え・省略は厳禁）
- 文字数制限なし。台本に書いてある通りの文章を全てそのまま入れること
- セクション数は台本に応じて5〜10個程度
- imagePromptは必ず英語で記述（テキスト・文字の描画指示は含めない。純粋なビジュアル要素のみ）
- type は必ず上記8種類から選ぶ
- JSON配列のみ出力（マークダウンや説明文は不要）`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(45_000),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini解析エラー: ${res.status} - ${err}`);
    }

    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonStr = extractJsonArray(text);
    if (!jsonStr) throw new Error('Geminiの応答にJSONが含まれていません');

    const raw_sections = JSON.parse(jsonStr) as Array<{
      type?: string;
      title?: string;
      content?: string;
      imagePrompt?: string;
      industry?: string;
    }>;

    const sections = raw_sections.map((s, i) => {
      const sectionType = (s.type as LPSectionType) || 'benefit';
      const name = SECTION_NAMES[sectionType] || sectionType;
      return {
        id: nanoid(),
        type: sectionType,
        name,
        description: name,
        content: s.content || s.title || '',
        imageUrl: null,
        imagePrompt: s.imagePrompt || '',
        referenceImageBase64: null,
        referenceImageName: null,
        status: 'pending' as const,
        industry: s.industry || 'business',
        title: s.title || '',
        order: i,
      };
    });

    return NextResponse.json({ sections });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? '入力値が不正です' }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[lp-analyze-script] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
