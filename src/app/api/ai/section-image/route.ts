import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDesignStyle, autoSelectStyle, buildStylePrompt } from '@/lib/lp-design-styles';
import { buildSectionImageConcept } from '@/components/lp-builder/modes/section-builder/section-templates';

/**
 * セクション画像生成 API
 * Section Builder モードから1枚ずつ画像を生成するエンドポイント
 *
 * プロンプト生成フロー（3段階）:
 * 1. taiyo-lp-image-prompter Gem: 日本語コンテンツ → 英語画像プロンプトへ変換・強化
 * 2. Gemini Flash: Gemが使えない場合のフォールバック（同様の変換を直接実行）
 * 3. buildSectionImageConcept + buildStylePrompt: どちらも失敗した場合の基本プロンプト
 *
 * 画像生成フロー（4段階フォールバック）:
 * 1. Nano Banana 2 (gemini-3.1-flash-image-preview) — 最高品質、直接 Gemini API
 * 2. Imagen 4 Fast (imagen-4.0-fast-generate-001) — 高速・高品質
 * 3. GemsAPI（ローカル Gem サーバー稼働時のみ）
 * 4. Gemini Flash Image (gemini-2.0-flash-exp-image-generation)
 *
 * NOTE: customPrompt は追加キーワードとして扱い、生の画像プロンプトとして使用しない。
 * Gem または Gemini が入力コンテンツを英語の画像概念に変換するので、
 * customPrompt はそのヒントとして渡す。
 */

const GEMS_API_URL = process.env.GEMS_API_URL || '';
const GEMS_API_TOKEN = process.env.GEMS_API_TOKEN || '';
const GEMS_IMAGE_PROMPTER = 'taiyo-lp-image-prompter';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const IMAGE_TIMEOUT_MS = 60_000; // 60秒（Nano Banana 2 / Imagen 4 は高解像度で時間がかかる）

const requestSchema = z.object({
  /** セクション種別 */
  sectionType: z.enum(['header', 'hero', 'problem', 'benefit', 'testimonial', 'cta', 'faq', 'footer']),
  /** セクションのコンテンツ（ユーザーが入力したテキスト） */
  content: z.string().max(2000).optional().default(''),
  /** LP の種類 */
  lpType: z.enum(['optin', 'sales', 'webinar']).optional(),
  /** デザインスタイルID (1-12) */
  designStyleId: z.string().max(5).optional(),
  /** 業界キーワード */
  industry: z.string().max(200).optional(),
  /**
   * アスペクト比
   * UTAGE LP Builder 推奨: 横幅 1000〜1200px → 16:9 横型がデフォルト
   * 選択肢: 16:9（約1200×675px）/ 4:3（約1200×900px）/ 1:1（約1024×1024px）/ 9:16（約675×1200px）
   */
  aspectRatio: z.enum(['16:9', '4:3', '1:1', '9:16']).default('16:9'),
  /** 参照画像 (base64 data URL) — スタイルの参考として使用 */
  referenceImageBase64: z.string().optional().nullable(),
  /**
   * 追加の視覚キーワード（英語推奨）
   * 生成指示ではなく、画像に含めたい視覚的要素（色・雰囲気・モチーフなど）を入力。
   * プロンプト強化のヒントとして使用し、そのまま画像生成APIには渡さない。
   */
  customPrompt: z.string().max(1000).optional(),
  /**
   * ダイレクトプロンプト（最大10,000文字）
   * 設定されている場合、Gem/Gemini によるプロンプト強化をスキップして
   * このプロンプトをそのまま画像生成に使用する。
   */
  directPrompt: z.string().max(10000).optional(),
});

type RequestBody = z.infer<typeof requestSchema>;

// セクション種別の英語ラベル（Gem / Gemini へのコンテキスト提供用）
const SECTION_TYPE_LABELS: Record<string, string> = {
  header:      'Header / Navigation Bar',
  hero:        'Hero Section (Main Visual)',
  problem:     'Problem Section (Pain Points)',
  benefit:     'Benefit Section (Value / Features)',
  testimonial: 'Testimonial Section (Customer Reviews)',
  cta:         'CTA Section (Call to Action)',
  faq:         'FAQ Section',
  footer:      'Footer',
};

// ------------------------------------------------
// JSON extraction helper
// ------------------------------------------------

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
      // try shorter candidate
    }
  }
  return null;
}

// ------------------------------------------------
// Step 1: Prompt Enrichment via taiyo-lp-image-prompter Gem
// ------------------------------------------------

/**
 * GemsAPI の taiyo-lp-image-prompter Gem を使用して
 * セクション情報 → 英語の高品質画像プロンプトへ変換・強化
 */
async function enrichPromptViaGems(
  sectionType: string,
  content: string,
  stylePrompt: string,
  industry?: string,
  customHint?: string,
): Promise<string | null> {
  if (!GEMS_API_URL) return null;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (GEMS_API_TOKEN) headers['Authorization'] = `Bearer ${GEMS_API_TOKEN}`;

  const sectionLabel = SECTION_TYPE_LABELS[sectionType] ?? sectionType;

  const userPrompt = [
    `セクション種別: ${sectionLabel}`,
    `セクション内容:\n${content || '（未入力）'}`,
    industry ? `業界: ${industry}` : null,
    customHint ? `追加キーワード(英語): ${customHint}` : null,
    `デザインスタイル: ${stylePrompt}`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const response = await fetch(`${GEMS_API_URL}/api/gems/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ gem_name: GEMS_IMAGE_PROMPTER, prompt: userPrompt }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as Record<string, unknown>;
    const responseText = String(data.response ?? data.content ?? data.text ?? data.result ?? '');
    if (!responseText) return null;

    // JSON形式で返ってきた場合: sectionType → 'hero' → 他のキー の優先順で取得
    const jsonStr = extractJson(responseText);
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
        const preferredKeys = [sectionType, 'hero', 'image', 'prompt', 'result'];
        for (const key of preferredKeys) {
          const val = parsed[key];
          if (typeof val === 'string' && val.length > 15) return val;
        }
        const firstStr = Object.values(parsed).find(
          (v): v is string => typeof v === 'string' && v.length > 15,
        );
        if (firstStr) return firstStr;
      } catch {
        // fall through to raw text
      }
    }

    // プレーンテキストの場合はそのまま使用
    const trimmed = responseText.trim();
    return trimmed.length > 20 ? trimmed : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------
// Step 2: Prompt Enrichment via Gemini Flash (fallback)
// ------------------------------------------------

/**
 * Gemini Flash で日本語コンテンツ → 英語画像プロンプトへ変換
 * GemsAPI が使えない場合のフォールバック
 */
async function enrichPromptViaGemini(
  sectionType: string,
  content: string,
  stylePrompt: string,
  industry?: string,
  customHint?: string,
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const sectionLabel = SECTION_TYPE_LABELS[sectionType] ?? sectionType;

  const instruction = `You are an expert LP Designer Pro image prompt engineer specializing in high-converting Japanese marketing landing pages (UTAGE LP Builder compatible).
Transform the following LP section information into a detailed English image generation prompt that RENDERS Japanese text accurately inside the image.

LP DESIGNER PRO REQUIREMENTS:
- Image format: 9:16 vertical portrait (1400×2506px), smartphone-optimized
- Center safe zone: 750-900px wide in the center of the image
- RENDER JAPANESE TEXT ACCURATELY IN THE IMAGE — text must be legible and correctly written
- Follow Type A-H template structure for this section type
- Professional marketing quality: premium design, high-converting layout
- Text hierarchy: large bold headline → medium sub-headline → body text
- Mobile-readable font sizes: headline at least 60px equivalent

TEXT RENDERING RULES:
- Extract the key Japanese text from the content and render it accurately in the image
- Headline text: bold, large, high contrast (white on dark or dark on light)
- Sub-text: medium weight, properly sized
- DO NOT omit or alter the Japanese text — render it exactly as provided
- If content has lists, render them as styled bullet points or cards in the image

SECTION TYPE: ${sectionLabel}
JAPANESE CONTENT TO RENDER IN IMAGE: ${content || '(auto-generate appropriate placeholder Japanese text for this section type)'}
${industry ? `INDUSTRY CONTEXT: ${industry}` : ''}
${customHint ? `ADDITIONAL VISUAL KEYWORDS: ${customHint}` : ''}
DESIGN STYLE: ${stylePrompt}

OUTPUT FORMAT: Return ONLY the final image prompt (3-5 sentences in English). Describe composition, text placement, visual elements, colors, and typography. No explanations, no labels, just the prompt.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: instruction }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const trimmed = text.trim();
    return trimmed.length > 20 ? trimmed : null;
  } catch (err) {
    console.debug('[SectionImage] Gemini prompt enrichment failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ------------------------------------------------
// Step 3: Base prompt (final fallback)
// ------------------------------------------------

/**
 * Gem/Gemini が両方使えない場合の基本プロンプト
 * section-templates の概念定義 + デザインスタイルを組み合わせる
 */
function buildBasePrompt(body: RequestBody): string {
  const styleId = body.designStyleId || (body.industry ? autoSelectStyle(body.industry) : '1');
  const designStyle = getDesignStyle(styleId);
  const stylePrompt = buildStylePrompt(designStyle);
  const sectionConcept = buildSectionImageConcept(body.sectionType, body.industry);
  return `${sectionConcept}, ${stylePrompt}`;
}

// ------------------------------------------------
// Image generation providers
// ------------------------------------------------

/**
 * Nano Banana 2 / Gemini Flash Image Preview（最高品質・直接 Gemini API）
 * Google Flow の内部モデルと同等: gemini-3.1-flash-image-preview
 */
async function generateViaNanaBanana2(
  prompt: string,
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.debug('[SectionImage] Nano Banana 2 HTTP error:', res.status);
      return null;
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (p: Record<string, unknown>) => 'inlineData' in p,
    ) as Record<string, { mimeType: string; data: string }> | undefined;

    if (!imagePart) return null;
    const { mimeType, data: base64 } = imagePart.inlineData;
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.debug('[SectionImage] Nano Banana 2 failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * GemsAPI /api/gems/generate-image（NanaBanana2 = Gemini + Imagen）
 * 参照画像がある場合はリクエストボディに含める
 */
async function generateViaGemsAPI(
  prompt: string,
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16',
  referenceImageBase64?: string | null,
): Promise<string | null> {
  if (!GEMS_API_URL) return null;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (GEMS_API_TOKEN) headers['Authorization'] = `Bearer ${GEMS_API_TOKEN}`;

  const body: Record<string, unknown> = { prompt, aspect_ratio: aspectRatio };
  if (referenceImageBase64) {
    const match = referenceImageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      body.reference_image = match[2];
      body.reference_image_mime = match[1];
    }
  }

  try {
    const response = await fetch(`${GEMS_API_URL}/api/gems/generate-image`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as Record<string, unknown>;
    return typeof data.image === 'string' ? data.image : null;
  } catch {
    return null;
  }
}

/**
 * Imagen 4 Fast（直接Gemini API）
 */
async function generateViaImagen4Fast(
  prompt: string,
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16',
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio },
      }),
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const pred = (data.predictions ?? [])[0];
    const base64 = pred?.bytesBase64Encoded;
    const mimeType = pred?.mimeType ?? 'image/png';
    return base64 ? `data:${mimeType};base64,${base64}` : null;
  } catch (err) {
    console.debug('[SectionImage] Imagen 4 Fast failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Gemini Flash Image（直接API、フォールバック）
 */
async function generateViaGeminiFlash(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    if (!res.ok) return null;

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find(
      (p: Record<string, unknown>) => 'inlineData' in p,
    ) as Record<string, { mimeType: string; data: string }> | undefined;

    if (!imagePart) return null;
    const { mimeType, data: base64 } = imagePart.inlineData;
    return `data:${mimeType};base64,${base64}`;
  } catch (err) {
    console.debug('[SectionImage] Gemini Flash image failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

// ------------------------------------------------
// Route handler
// ------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const body = requestSchema.parse(raw);

    const styleId = body.designStyleId || (body.industry ? autoSelectStyle(body.industry) : '1');
    const designStyle = getDesignStyle(styleId);
    const stylePrompt = buildStylePrompt(designStyle);

    // ---- プロンプト強化（3段階 or ダイレクト） ----

    let imagePrompt: string;

    if (body.directPrompt && body.directPrompt.trim().length > 0) {
      // ダイレクトプロンプトが指定されている場合はそのまま使用（強化スキップ）
      imagePrompt = body.directPrompt.trim();
    } else {
      // customPrompt は「追加キーワード」として各ステップのヒントに渡す。
      // 日本語指示文が来ても Gem/Gemini が適切に英語画像プロンプトへ変換する。

      // Step 1: taiyo-lp-image-prompter Gem
      imagePrompt =
        await enrichPromptViaGems(
          body.sectionType,
          body.content,
          stylePrompt,
          body.industry,
          body.customPrompt,
        ) ?? '';

      // Step 2: Gemini Flash でのプロンプト生成
      if (!imagePrompt) {
        imagePrompt = await enrichPromptViaGemini(
          body.sectionType,
          body.content,
          stylePrompt,
          body.industry,
          body.customPrompt,
        ) ?? '';
      }

      // Step 3: 基本プロンプト（静的構成）
      if (!imagePrompt) {
        imagePrompt = buildBasePrompt(body);
      }
    }

    // ---- 画像生成（4段階フォールバック） ----

    // 1. Nano Banana 2 (gemini-3.1-flash-image-preview) — 最高品質
    const nanaBananaUrl = await generateViaNanaBanana2(imagePrompt);
    if (nanaBananaUrl) {
      return NextResponse.json({ imageUrl: nanaBananaUrl, provider: 'nano-banana-2', usedPrompt: imagePrompt });
    }

    // 2. Imagen 4 Fast (direct) — 高速・高品質
    const imagen4Url = await generateViaImagen4Fast(imagePrompt, body.aspectRatio);
    if (imagen4Url) {
      return NextResponse.json({ imageUrl: imagen4Url, provider: 'imagen4', usedPrompt: imagePrompt });
    }

    // 3. GemsAPI（ローカル Gem サーバー稼働時のみ）
    const gemsUrl = await generateViaGemsAPI(imagePrompt, body.aspectRatio, body.referenceImageBase64);
    if (gemsUrl) {
      return NextResponse.json({ imageUrl: gemsUrl, provider: 'gems', usedPrompt: imagePrompt });
    }

    // 4. Gemini Flash Image (direct) — 最終フォールバック
    const flashUrl = await generateViaGeminiFlash(imagePrompt);
    if (flashUrl) {
      return NextResponse.json({ imageUrl: flashUrl, provider: 'gemini-flash', usedPrompt: imagePrompt });
    }

    return NextResponse.json(
      { error: '画像生成に失敗しました。GEMINI_API_KEY を確認してください。' },
      { status: 503 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? '入力値が不正です' }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SectionImage] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
