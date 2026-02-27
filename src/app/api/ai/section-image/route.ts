import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDesignStyle, autoSelectStyle, buildStylePrompt } from '@/lib/lp-design-styles';
import { buildSectionImageConcept } from '@/components/lp-builder/modes/section-builder/section-templates';

/**
 * セクション画像生成 API
 * Section Builder モードから1枚ずつ画像を生成するエンドポイント
 *
 * 優先順: GemsAPI（NanaBanana2）→ Imagen 4 Fast → Gemini Flash Image
 * 参照画像（referenceImageBase64）がある場合はGemsAPIに渡す
 */

const GEMS_API_URL = process.env.GEMS_API_URL || '';
const GEMS_API_TOKEN = process.env.GEMS_API_TOKEN || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const IMAGE_TIMEOUT_MS = 30_000;

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
  /** アスペクト比 */
  aspectRatio: z.enum(['16:9', '1:1']).default('16:9'),
  /** 参照画像 (base64 data URL) — スタイルの参考として使用 */
  referenceImageBase64: z.string().optional().nullable(),
  /** カスタム画像プロンプト（ユーザーが指定する場合） */
  customPrompt: z.string().max(1000).optional(),
});

type RequestBody = z.infer<typeof requestSchema>;

// ------------------------------------------------
// Prompt Building
// ------------------------------------------------

function buildImagePrompt(body: RequestBody): string {
  if (body.customPrompt) return body.customPrompt;

  const styleId =
    body.designStyleId || (body.industry ? autoSelectStyle(body.industry) : '1');
  const designStyle = getDesignStyle(styleId);
  const stylePrompt = buildStylePrompt(designStyle);

  const sectionConcept = buildSectionImageConcept(body.sectionType, body.industry);

  return `${sectionConcept}, ${stylePrompt}`;
}

// ------------------------------------------------
// Image generation providers
// ------------------------------------------------

/**
 * GemsAPI /api/gems/generate-image（NanaBanana2 = Gemini + Imagen）
 * 参照画像がある場合はmultipart形式で送信
 */
async function generateViaGemsAPI(
  prompt: string,
  aspectRatio: '16:9' | '1:1',
  referenceImageBase64?: string | null,
): Promise<string | null> {
  if (!GEMS_API_URL) return null;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (GEMS_API_TOKEN) headers['Authorization'] = `Bearer ${GEMS_API_TOKEN}`;

  const body: Record<string, unknown> = { prompt, aspect_ratio: aspectRatio };
  if (referenceImageBase64) {
    // base64 data URL から data 部分だけ取り出す
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
  aspectRatio: '16:9' | '1:1',
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

    const prompt = buildImagePrompt(body);

    // 1. GemsAPI (NanaBanana2)
    const gemsUrl = await generateViaGemsAPI(
      prompt,
      body.aspectRatio,
      body.referenceImageBase64,
    );
    if (gemsUrl) {
      return NextResponse.json({ imageUrl: gemsUrl, provider: 'gems' });
    }

    // 2. Imagen 4 Fast (direct)
    const imagen4Url = await generateViaImagen4Fast(prompt, body.aspectRatio);
    if (imagen4Url) {
      return NextResponse.json({ imageUrl: imagen4Url, provider: 'imagen4' });
    }

    // 3. Gemini Flash Image (direct)
    const flashUrl = await generateViaGeminiFlash(prompt);
    if (flashUrl) {
      return NextResponse.json({ imageUrl: flashUrl, provider: 'gemini-flash' });
    }

    return NextResponse.json(
      { error: '画像生成に失敗しました。GEMINI_API_KEY または GEMS_API_URL を設定してください。' },
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
