import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

/**
 * LP生成API
 * GemsAPI + Gemini + 画像生成（Imagen 3 / Pexels）統合
 * 3並列実行: コピー生成 + ヒーロー画像 + ベネフィット画像
 */

// --- Config ---

const GEMS_API_URL = process.env.GEMS_API_URL || '';
const GEMS_GEM_NAME = process.env.GEMS_GEM_NAME || 'taiyo-lp-generator';
const GEMS_API_TOKEN = process.env.GEMS_API_TOKEN || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
const AI_TIMEOUT_MS = 60_000;
const IMAGE_TIMEOUT_MS = 15_000;

// --- Schemas ---

const WizardAnswersSchema = z.object({
  productName: z.string().min(1).max(200),
  productDescription: z.string().max(1000).optional(),
  targetAudience: z.string().min(1).max(500),
  problems: z.array(z.string().max(300)).min(1).max(10),
  benefits: z.array(z.string().max(300)).min(1).max(10),
  uniqueValue: z.string().max(500).optional(),
  industry: z.string().max(200).optional(),
  ctaType: z.enum(['optin', 'purchase', 'contact', 'webinar']),
  urgency: z.string().max(300).optional(),
  testimonials: z.string().max(1000).optional(),
  pricing: z.string().max(300).optional(),
  style: z.string().max(100).optional(),
});

type WizardAnswers = z.infer<typeof WizardAnswersSchema>;

const AIGeneratedCopySchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  problemHeading: z.string(),
  problems: z.array(z.string()).min(1),
  benefitHeading: z.string(),
  benefits: z.array(z.string()).min(1),
  targetMessage: z.string(),
  ctaHeading: z.string(),
  ctaDescription: z.string(),
  ctaButtonText: z.string().max(20),
  urgencyHeading: z.string(),
  urgencyText: z.string(),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
});

type AIGeneratedCopy = z.infer<typeof AIGeneratedCopySchema>;

interface ComponentInstance {
  id: string;
  componentType: string;
  category: string;
  order: number;
  props: Record<string, string | number | boolean>;
}

type ComponentDef = Omit<ComponentInstance, 'id' | 'order'>;

interface GeneratedImage {
  url: string;
  alt: string;
  credit?: string;
}

// --- Helpers ---

function sanitizeForPrompt(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```/g, '')
    .trim()
    .slice(0, 500);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

// ============================================
// Copy Generation (3-tier fallback)
// ============================================

/**
 * 1. GemsAPI経由でカスタムGemを実行してLPコピー生成
 */
async function generateCopyWithGemsAPI(answers: WizardAnswers): Promise<AIGeneratedCopy> {
  if (!GEMS_API_URL) throw new Error('GEMS_API_URL not configured');

  const prompt = buildGemsPrompt(answers);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (GEMS_API_TOKEN) {
    headers['Authorization'] = `Bearer ${GEMS_API_TOKEN}`;
  }

  const response = await fetch(`${GEMS_API_URL}/api/gems/execute`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ gem_name: GEMS_GEM_NAME, prompt }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`GemsAPI error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const responseText = String(
    data.response ?? data.content ?? data.text ?? data.result ?? '',
  );

  const jsonStr = extractJson(responseText);
  if (!jsonStr) throw new Error('GemsAPI response contained no JSON block');

  const raw = JSON.parse(jsonStr);
  return convertGemsResponseToStandardCopy(raw, answers);
}

/**
 * GemsAPIのレスポンスを標準コピー形式に変換
 * GemsAPIは太陽スタイル形式（headline.main/sub, empathy, problem, solution, benefits, proof, cta）
 * を返すので、AIGeneratedCopy形式に変換する
 */
function convertGemsResponseToStandardCopy(
  gemsData: Record<string, unknown>,
  answers: WizardAnswers,
): AIGeneratedCopy {
  const headline = gemsData.headline as Record<string, string> | string | undefined;
  const headlineMain =
    typeof headline === 'object' ? headline?.main : (headline as string | undefined);
  const headlineSub =
    typeof headline === 'object' ? headline?.sub : undefined;

  const cta = gemsData.cta as Record<string, string> | undefined;
  const gemsBenefits = gemsData.benefits as string[] | undefined;

  return AIGeneratedCopySchema.parse({
    headline: headlineMain || `${answers.productName}で理想の結果を手に入れる`,
    subheadline: headlineSub || `${answers.targetAudience}のあなたへ`,
    problemHeading: 'こんなお悩みありませんか？',
    problems:
      answers.problems.length > 0 ? answers.problems : ['成果が出ない'],
    benefitHeading: `${answers.productName}で得られること`,
    benefits: gemsBenefits || answers.benefits,
    targetMessage:
      (gemsData.empathy as string) ||
      `${answers.targetAudience}の方に最適なプログラムです。`,
    ctaHeading: '今すぐ始めよう',
    ctaDescription:
      (gemsData.solution as string) || cta?.subText || '今すぐ行動して理想の未来を手に入れましょう。',
    ctaButtonText: cta?.buttonText || '今すぐ始める',
    urgencyHeading: '今すぐ行動を！',
    urgencyText:
      cta?.urgencyText || '迷っている時間がもったいないです。今日が一番若い日です。',
    faq: [
      { question: '初心者でも大丈夫ですか？', answer: 'はい、基礎から丁寧に解説します。' },
      { question: 'サポートはありますか？', answer: 'はい、メールサポートをご利用いただけます。' },
      { question: '返金保証はありますか？', answer: (gemsData.proof as string) || '30日間の返金保証があります。' },
    ],
  });
}

function buildGemsPrompt(answers: WizardAnswers): string {
  const safeName = sanitizeForPrompt(answers.productName);
  const safeAudience = sanitizeForPrompt(answers.targetAudience);
  const safeProblems = answers.problems.map(sanitizeForPrompt);
  const safeBenefits = answers.benefits.map(sanitizeForPrompt);

  return `以下の商品情報をもとに、高成約率ランディングページのコンテンツをJSON形式で生成してください。

商品名: ${safeName}
ターゲット: ${safeAudience}
悩み:
${safeProblems.map((p) => `- ${p}`).join('\n')}
ベネフィット:
${safeBenefits.map((b) => `- ${b}`).join('\n')}
CTAタイプ: ${answers.ctaType}${answers.urgency ? `\n緊急性: ${sanitizeForPrompt(answers.urgency)}` : ''}${answers.pricing ? `\n価格: ${sanitizeForPrompt(answers.pricing)}` : ''}

以下のJSON形式のみで出力してください（余分な説明不要）:
{
  "headline": {
    "main": "メインヘッドライン（数字入り・30文字以内・断定形）",
    "sub": "サブヘッドライン（ターゲットへの共感・50文字以内）"
  },
  "empathy": "共感文（〜でお悩みではありませんか？の形式・2-3文）",
  "problem": "問題提起文（具体的な悩みの描写・2-3文）",
  "solution": "解決策文（商品が解決する方法・2-3文）",
  "benefits": ["箇条書き1（感情的アンカー+具体的結果）", "箇条書き2", "箇条書き3", "箇条書き4", "箇条書き5"],
  "proof": "信頼構築文（実績・根拠・保証・2-3文）",
  "cta": {
    "buttonText": "ボタンテキスト（動詞始まり・8-15文字）",
    "subText": "サポートテキスト（行動後の約束・30文字以内）",
    "urgencyText": "緊急性テキスト（今すぐ行動する理由・20文字以内）",
    "reassurance": "安心テキスト（リスク解消・20文字以内）"
  }
}`;
}

/**
 * 2. Gemini直接でLPコピー生成
 */
async function generateCopyWithAI(answers: WizardAnswers): Promise<AIGeneratedCopy> {
  const { getAIClient } = await import('@/lib/ai/provider');
  const client = await getAIClient();

  const ctaTypeLabels: Record<string, string> = {
    optin: '無料プレゼント（メールアドレス登録）',
    purchase: '商品購入',
    contact: 'お問い合わせ・無料相談',
    webinar: 'ウェビナー・セミナー登録',
  };

  const safeName = sanitizeForPrompt(answers.productName);
  const safeAudience = sanitizeForPrompt(answers.targetAudience);
  const safeProblems = answers.problems.map(sanitizeForPrompt);
  const safeBenefits = answers.benefits.map(sanitizeForPrompt);

  const prompt = `あなたはプロのダイレクトレスポンスマーケティングのコピーライターです。
以下の情報を元に、高コンバージョンのランディングページ用コピーを生成してください。

## 商品情報
- 商品名: ${safeName}
- ターゲット: ${safeAudience}
- お客様の悩み: ${safeProblems.join('、')}
- ベネフィット: ${safeBenefits.join('、')}
- CTAタイプ: ${ctaTypeLabels[answers.ctaType] || answers.ctaType}

## ルール
- PASBECONAフレームワークを意識する
- Cialdiniの影響力の武器を活用する
- 読み手の感情に訴えかける表現を使う
- 具体的な数字やデータを含める
- 日本語で書く

## 出力形式
以下のJSON形式のみ出力し、他のテキストは含めないでください。
{"headline":"メインの見出し","subheadline":"サブ見出し","problemHeading":"問題提起の見出し","problems":["悩み1","悩み2","悩み3"],"benefitHeading":"ベネフィットの見出し","benefits":["ベネフィット1","ベネフィット2","ベネフィット3"],"targetMessage":"ターゲットへのメッセージ","ctaHeading":"行動喚起の見出し","ctaDescription":"行動を促す説明文","ctaButtonText":"ボタンテキスト","urgencyHeading":"緊急性の見出し","urgencyText":"緊急性のメッセージ","faq":[{"question":"質問1","answer":"回答1"},{"question":"質問2","answer":"回答2"},{"question":"質問3","answer":"回答3"}]}`;

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(
      () => reject(new Error('AI生成タイムアウト（60秒）')),
      AI_TIMEOUT_MS,
    );
  });

  const result = await Promise.race([
    client.complete([{ role: 'user', content: prompt }], {
      temperature: 0.7,
      maxTokens: 4096,
    }),
    timeoutPromise,
  ]);

  const jsonStr = extractJson(result.content);
  if (!jsonStr) {
    throw new Error('AIからのレスポンスにJSONが見つかりませんでした');
  }

  const raw = JSON.parse(jsonStr);
  return AIGeneratedCopySchema.parse(raw);
}

/**
 * 3. テンプレートフォールバック
 */
function generateFallbackCopy(answers: WizardAnswers): AIGeneratedCopy {
  const mainBenefit = answers.benefits[0] || '理想の結果';

  const headlineMap: Record<string, string> = {
    optin: `【無料】${mainBenefit}を手に入れる方法`,
    webinar: `【無料ウェビナー】${answers.productName}の秘訣を公開`,
    contact: `${mainBenefit}を実現する無料相談`,
    purchase: `${answers.productName}で${mainBenefit}`,
  };

  const ctaDescMap: Record<string, string> = {
    optin: 'メールアドレスを入力するだけで、すぐに始められます。',
    webinar: '無料で参加できます。お気軽にお申し込みください。',
    contact: '無料でご相談いただけます。お気軽にお問い合わせください。',
    purchase: '30日間の返金保証付き。リスクなしで始められます。',
  };

  const ctaTextMap: Record<string, string> = {
    optin: '無料で受け取る',
    purchase: '今すぐ申し込む',
    contact: '無料相談を申し込む',
    webinar: '無料で参加登録',
  };

  const faqMap: Record<string, Array<{ question: string; answer: string }>> = {
    optin: [
      { question: '本当に無料ですか？', answer: 'はい、完全無料でご利用いただけます' },
      { question: 'メールアドレスは安全ですか？', answer: 'プライバシーポリシーに基づき厳重に管理しています' },
      { question: 'いつでも解除できますか？', answer: 'はい、メール内のリンクからいつでも解除できます' },
    ],
    webinar: [
      { question: '参加費はかかりますか？', answer: 'いいえ、完全無料でご参加いただけます' },
      { question: '当日参加できなくても大丈夫ですか？', answer: '録画をお送りしますのでご安心ください' },
      { question: 'どんな内容ですか？', answer: `${answers.productName}の核心をお伝えします` },
    ],
    contact: [
      { question: '相談は本当に無料ですか？', answer: 'はい、初回相談は完全無料です' },
      { question: '強引な勧誘はありますか？', answer: 'いいえ、一切ありません' },
      { question: '相談時間はどのくらいですか？', answer: '30分〜60分程度を予定しています' },
    ],
    purchase: [
      { question: '返金保証はありますか？', answer: 'はい、30日間の返金保証があります' },
      { question: '初心者でも大丈夫ですか？', answer: 'はい、基礎から丁寧に解説します' },
      { question: 'サポートはありますか？', answer: 'メールサポートをご利用いただけます' },
    ],
  };

  return {
    headline:
      headlineMap[answers.ctaType] || `${answers.productName}で${mainBenefit}`,
    subheadline: `${answers.targetAudience}のあなたへ。${mainBenefit}を手に入れる方法をお伝えします。`,
    problemHeading: 'こんなお悩みありませんか？',
    problems: answers.problems,
    benefitHeading: `${answers.productName}で得られること`,
    benefits: answers.benefits,
    targetMessage: `このプログラムは${answers.targetAudience}の方に最適です。今すぐ始めれば、理想の結果が手に入ります。`,
    ctaHeading: '今すぐ始めよう',
    ctaDescription: ctaDescMap[answers.ctaType] || ctaDescMap.purchase,
    ctaButtonText: ctaTextMap[answers.ctaType] || '今すぐ始める',
    urgencyHeading: '今すぐ行動を！',
    urgencyText: '迷っている時間がもったいないです。今日が一番若い日です。',
    faq: faqMap[answers.ctaType] || faqMap.purchase,
  };
}

// ============================================
// Image Generation
// ============================================

/** GemsAPIが持つ画像プロンプト生成Gem名 */
const GEMS_IMAGE_PROMPTER = 'taiyo-lp-image-prompter';

interface GemsImagePrompts {
  hero: string;
  benefit1?: string;
  benefit2?: string;
  benefit3?: string;
}

/**
 * GemsAPIの taiyo-lp-image-prompter Gem で画像プロンプトを生成
 */
async function buildImagePromptsViaGems(answers: WizardAnswers): Promise<GemsImagePrompts | null> {
  if (!GEMS_API_URL) return null;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (GEMS_API_TOKEN) headers['Authorization'] = `Bearer ${GEMS_API_TOKEN}`;

  const userPrompt = `
商品名: ${sanitizeForPrompt(answers.productName)}
ターゲット: ${sanitizeForPrompt(answers.targetAudience)}
業界: ${answers.industry ? sanitizeForPrompt(answers.industry) : '未指定'}
ベネフィット:
${answers.benefits.slice(0, 3).map((b) => `- ${sanitizeForPrompt(b)}`).join('\n')}
`.trim();

  try {
    const response = await fetch(`${GEMS_API_URL}/api/gems/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ gem_name: GEMS_IMAGE_PROMPTER, prompt: userPrompt }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as Record<string, unknown>;
    const text = String(data.response ?? '');
    const jsonStr = extractJson(text);
    if (!jsonStr) return null;

    return JSON.parse(jsonStr) as GemsImagePrompts;
  } catch {
    return null;
  }
}

/**
 * GemsAPIの /api/gems/generate-image エンドポイントで画像生成
 * GemsAPI内部で Gemini Flash Image → Imagen 4 の順に試行する
 */
async function generateImageViaGemsAPI(
  prompt: string,
  aspectRatio: '16:9' | '1:1' = '16:9',
): Promise<string | null> {
  if (!GEMS_API_URL) return null;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (GEMS_API_TOKEN) headers['Authorization'] = `Bearer ${GEMS_API_TOKEN}`;

  const response = await fetch(`${GEMS_API_URL}/api/gems/generate-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, aspect_ratio: aspectRatio }),
    signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`GemsAPI generate-image error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  return typeof data.image === 'string' ? data.image : null;
}

/**
 * 直接API呼び出しでの画像生成フォールバック
 * (GemsAPI未起動時に使用)
 */
async function generateImageDirectly(prompt: string): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  // 1st: Imagen 4 Fast
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: '16:9' },
      }),
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    if (res.ok) {
      const data = await res.json();
      const pred = (data.predictions ?? [])[0];
      const base64 = pred?.bytesBase64Encoded;
      const mimeType = pred?.mimeType ?? 'image/png';
      if (base64) return `data:${mimeType};base64,${base64}`;
    }
  } catch (err) {
    console.debug('[LP Generate] Direct Imagen 4 failed:', err instanceof Error ? err.message : err);
  }

  // 2nd: Gemini Flash Image
  try {
    const url2 = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`;
    const res2 = await fetch(url2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
      }),
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    if (res2.ok) {
      const data2 = await res2.json();
      const parts = data2.candidates?.[0]?.content?.parts ?? [];
      const imagePart = parts.find((p: Record<string, unknown>) => 'inlineData' in p) as
        | Record<string, { mimeType: string; data: string }>
        | undefined;
      if (imagePart) {
        const { mimeType, data: base64 } = imagePart.inlineData;
        return `data:${mimeType};base64,${base64}`;
      }
    }
  } catch (err) {
    console.debug('[LP Generate] Direct Gemini Flash image failed:', err instanceof Error ? err.message : err);
  }

  return null;
}

/**
 * Pexelsでストック画像を取得（APIキーがある場合のみ）
 */
async function fetchPexelsPhoto(
  query: string,
  orientation: 'landscape' | 'portrait' | 'square' = 'landscape',
): Promise<GeneratedImage | null> {
  if (!PEXELS_API_KEY) return null;

  const params = new URLSearchParams({ query, orientation, per_page: '1', size: 'medium' });
  const response = await fetch(`https://api.pexels.com/v1/search?${params.toString()}`, {
    headers: { Authorization: PEXELS_API_KEY },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const photos = data.photos;
  if (!photos || photos.length === 0) return null;

  return {
    url: photos[0].src.large,
    alt: photos[0].alt || query,
    credit: `Photo by ${photos[0].photographer} on Pexels`,
  };
}

/**
 * ヒーロー画像の解決
 * 優先順: GemsAPI画像生成 → 直接API呼び出し → Pexels → null
 */
async function resolveHeroImage(
  productName: string,
  targetAudience: string,
  industry?: string,
  prebuiltPrompt?: string,
): Promise<GeneratedImage | null> {
  const imagePrompt = prebuiltPrompt
    ?? `Professional, modern hero image for a landing page about "${productName}". Target audience: ${targetAudience}. ${industry ? `Industry: ${industry}.` : ''} Clean, high-quality, aspirational photography style. No text overlay.`;

  // 1. GemsAPI経由（カスタムGemのモデル選定に委ねる）
  try {
    const base64Url = await generateImageViaGemsAPI(imagePrompt, '16:9');
    if (base64Url) {
      console.debug('[LP Generate] Hero image generated via GemsAPI');
      return { url: base64Url, alt: productName };
    }
  } catch (error) {
    console.debug('[LP Generate] GemsAPI image failed, trying direct API:', error instanceof Error ? error.message : error);
  }

  // 2. 直接API呼び出し（GemsAPIが使えない場合のフォールバック）
  try {
    const base64Url = await generateImageDirectly(imagePrompt);
    if (base64Url) {
      console.debug('[LP Generate] Hero image generated via direct API');
      return { url: base64Url, alt: productName };
    }
  } catch (error) {
    console.debug('[LP Generate] Direct API image failed, trying Pexels:', error instanceof Error ? error.message : error);
  }

  // 3. Pexels（ストック写真）
  const pexelsQuery = industry ? `${industry} ${productName}` : `${productName} professional`;
  try {
    return await fetchPexelsPhoto(pexelsQuery, 'landscape');
  } catch (error) {
    console.debug('[LP Generate] Pexels hero failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * ベネフィット画像の解決 (最大3枚)
 * 優先順: GemsAPI画像生成 → Pexels → []
 */
async function resolveBenefitImages(
  benefits: string[],
  industry?: string,
  prebuiltPrompts?: Array<string | undefined>,
): Promise<GeneratedImage[]> {
  const targetBenefits = benefits.slice(0, 3);

  const results = await Promise.allSettled(
    targetBenefits.map(async (benefit, index) => {
      const prompt = prebuiltPrompts?.[index]
        ?? (industry ? `${industry} ${benefit}, professional square photo` : `${benefit}, professional photography`);

      // 1. GemsAPI経由
      try {
        const base64Url = await generateImageViaGemsAPI(prompt, '1:1');
        if (base64Url) return { url: base64Url, alt: benefit };
      } catch {
        // fall through
      }

      // 2. Pexels
      const pexelsQuery = industry ? `${industry} ${benefit}` : benefit;
      try {
        return await fetchPexelsPhoto(pexelsQuery, 'square');
      } catch {
        return null;
      }
    }),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<GeneratedImage | null> =>
        r.status === 'fulfilled' && r.value !== null,
    )
    .map((r) => r.value!);
}

// ============================================
// Component Builders
// ============================================

function buildHeaderSection(answers: WizardAnswers): ComponentDef[] {
  return [
    {
      componentType: 'header',
      category: 'other',
      props: {
        logoText: escapeHtml(answers.productName),
        backgroundColor: '#ffffff',
        sticky: false,
      },
    },
  ];
}

function buildHeroImageSection(heroImage: GeneratedImage | null): ComponentDef[] {
  if (!heroImage) return [];

  const defs: ComponentDef[] = [
    {
      componentType: 'image',
      category: 'basic',
      props: {
        src: heroImage.url,
        alt: escapeHtml(heroImage.alt),
        width: 100,
      },
    },
  ];

  if (heroImage.credit) {
    defs[0].props.credit = heroImage.credit;
  }

  return defs;
}

function buildHeroSection(copy: AIGeneratedCopy): ComponentDef[] {
  return [
    {
      componentType: 'headline',
      category: 'headline',
      props: {
        text: escapeHtml(copy.headline),
        fontSize: 36,
        fontSizeSp: 24,
        textColor: '#1f2937',
        textAlign: 'center',
        shadowStyle: 'none',
      },
    },
    {
      componentType: 'subhead',
      category: 'headline',
      props: {
        text: escapeHtml(copy.subheadline),
        fontSize: 20,
        fontSizeSp: 16,
        textColor: '#6b7280',
        textAlign: 'center',
      },
    },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  ];
}

function buildProblemSection(copy: AIGeneratedCopy): ComponentDef[] {
  return [
    {
      componentType: 'subhead',
      category: 'headline',
      props: {
        text: escapeHtml(copy.problemHeading),
        fontSize: 28,
        fontSizeSp: 20,
        textColor: '#dc2626',
        textAlign: 'center',
      },
    },
    {
      componentType: 'bullet',
      category: 'content',
      props: {
        items: copy.problems.map(escapeHtml).join('\n'),
        icon: 'arrow',
        iconColor: '#dc2626',
        fontSize: 16,
      },
    },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  ];
}

function buildBenefitSection(
  copy: AIGeneratedCopy,
  benefitImages: GeneratedImage[],
): ComponentDef[] {
  const defs: ComponentDef[] = [
    {
      componentType: 'subhead',
      category: 'headline',
      props: {
        text: escapeHtml(copy.benefitHeading),
        fontSize: 28,
        fontSizeSp: 20,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
  ];

  if (benefitImages.length > 0) {
    copy.benefits.slice(0, 3).forEach((benefit, index) => {
      const image = benefitImages[index];
      if (image) {
        defs.push({
          componentType: 'imageText',
          category: 'content',
          props: {
            image: image.url,
            title: escapeHtml(benefit),
            text: '',
            imagePosition: index % 2 === 0 ? 'left' : 'right',
            ...(image.credit ? { credit: image.credit } : {}),
          },
        });
      } else {
        defs.push({
          componentType: 'bullet',
          category: 'content',
          props: {
            items: escapeHtml(benefit),
            icon: 'check',
            iconColor: '#22c55e',
            fontSize: 16,
          },
        });
      }
    });

    const remainingBenefits = copy.benefits.slice(3);
    if (remainingBenefits.length > 0) {
      defs.push({
        componentType: 'bullet',
        category: 'content',
        props: {
          items: remainingBenefits.map(escapeHtml).join('\n'),
          icon: 'check',
          iconColor: '#22c55e',
          fontSize: 16,
        },
      });
    }
  } else {
    defs.push({
      componentType: 'bullet',
      category: 'content',
      props: {
        items: copy.benefits.map(escapeHtml).join('\n'),
        icon: 'check',
        iconColor: '#22c55e',
        fontSize: 16,
      },
    });
  }

  defs.push({
    componentType: 'spacer',
    category: 'basic',
    props: { height: 40, heightSp: 20 },
  });
  return defs;
}

function buildTargetSection(copy: AIGeneratedCopy): ComponentDef[] {
  return [
    {
      componentType: 'text',
      category: 'basic',
      props: {
        content: escapeHtml(copy.targetMessage),
        fontSize: 18,
        fontSizeSp: 16,
        lineHeight: 1.8,
        textColor: '#374151',
        backgroundColor: '#f9fafb',
        textAlign: 'center',
      },
    },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  ];
}

function buildCtaSection(copy: AIGeneratedCopy, ctaType: string): ComponentDef[] {
  const defs: ComponentDef[] = [
    {
      componentType: 'subhead',
      category: 'headline',
      props: {
        text: escapeHtml(copy.ctaHeading),
        fontSize: 28,
        fontSizeSp: 20,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      componentType: 'text',
      category: 'basic',
      props: {
        content: escapeHtml(copy.ctaDescription),
        fontSize: 16,
        fontSizeSp: 14,
        lineHeight: 1.6,
        textColor: '#6b7280',
        backgroundColor: 'transparent',
        textAlign: 'center',
      },
    },
  ];

  if (ctaType === 'optin' || ctaType === 'webinar') {
    defs.push({
      componentType: 'registration-form',
      category: 'form',
      props: {
        title: escapeHtml(copy.ctaHeading),
        fields: ctaType === 'webinar' ? 'name_email' : 'email',
        buttonText: escapeHtml(copy.ctaButtonText),
        buttonColor: '#22c55e',
        subText: ctaType === 'webinar' ? '参加は完全無料です' : '登録は無料です',
        redirectUrl: '',
      },
    });
  } else if (ctaType === 'contact') {
    defs.push({
      componentType: 'custom-form',
      category: 'form',
      props: {
        title: escapeHtml(copy.ctaHeading),
        fields:
          'お名前|text\nメールアドレス|email\n電話番号|text\nご相談内容|textarea',
        buttonText: escapeHtml(copy.ctaButtonText),
        buttonColor: '#3b82f6',
      },
    });
  } else {
    defs.push({
      componentType: 'button',
      category: 'button',
      props: {
        text: escapeHtml(copy.ctaButtonText),
        subText: escapeHtml(copy.ctaDescription),
        action: 'link',
        url: '',
        backgroundColor: '#dc2626',
        textColor: '#ffffff',
        fontSize: 20,
        width: 80,
        borderRadius: 8,
        animation: 'shine',
      },
    });
  }

  defs.push({
    componentType: 'spacer',
    category: 'basic',
    props: { height: 60, heightSp: 30 },
  });
  return defs;
}

function buildFaqSection(copy: AIGeneratedCopy): ComponentDef[] {
  const faqItems = copy.faq
    .map(
      (f) =>
        `${escapeHtml(f.question).replace(/\|/g, '｜')}|${escapeHtml(f.answer).replace(/\|/g, '｜')}`,
    )
    .join('\n');

  return [
    {
      componentType: 'subhead',
      category: 'headline',
      props: {
        text: 'よくある質問',
        fontSize: 28,
        fontSizeSp: 20,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      componentType: 'accordion',
      category: 'content',
      props: { items: faqItems, defaultOpen: true, iconColor: '#6b7280' },
    },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  ];
}

function buildUrgencySection(copy: AIGeneratedCopy): ComponentDef[] {
  return [
    {
      componentType: 'headline',
      category: 'headline',
      props: {
        text: escapeHtml(copy.urgencyHeading),
        fontSize: 28,
        fontSizeSp: 20,
        textColor: '#ffffff',
        textAlign: 'center',
        shadowStyle: 'none',
      },
    },
    {
      componentType: 'text',
      category: 'basic',
      props: {
        content: escapeHtml(copy.urgencyText),
        fontSize: 16,
        fontSizeSp: 14,
        lineHeight: 1.6,
        textColor: '#fecaca',
        backgroundColor: '#dc2626',
        textAlign: 'center',
      },
    },
    {
      componentType: 'button',
      category: 'button',
      props: {
        text: escapeHtml(copy.ctaButtonText),
        subText: '',
        action: 'scroll',
        url: '',
        backgroundColor: '#ffffff',
        textColor: '#dc2626',
        fontSize: 20,
        width: 60,
        borderRadius: 8,
        animation: 'shake',
      },
    },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  ];
}

function buildFooterSection(productName: string): ComponentDef[] {
  return [
    {
      componentType: 'footer',
      category: 'other',
      props: {
        copyright: `\u00a9 ${new Date().getFullYear()} ${escapeHtml(productName)}. All rights reserved.`,
        links: 'プライバシーポリシー\n特定商取引法に基づく表記',
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
      },
    },
  ];
}

function buildComponents(
  copy: AIGeneratedCopy,
  answers: WizardAnswers,
  heroImage: GeneratedImage | null,
  benefitImages: GeneratedImage[],
): ComponentInstance[] {
  const defs: ComponentDef[] = [
    ...buildHeaderSection(answers),
    ...buildHeroImageSection(heroImage),
    ...buildHeroSection(copy),
    ...buildProblemSection(copy),
    ...buildBenefitSection(copy, benefitImages),
    ...buildTargetSection(copy),
    ...buildCtaSection(copy, answers.ctaType),
    ...buildFaqSection(copy),
    ...buildUrgencySection(copy),
    ...buildFooterSection(answers.productName),
  ];

  return defs.map((def, index) => ({
    ...def,
    id: nanoid(),
    order: index,
  }));
}

// ============================================
// Route Handler
// ============================================

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bodyResult = z
    .object({ answers: WizardAnswersSchema })
    .safeParse(await request.json());
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: '入力が不正です', details: bodyResult.error.flatten() },
      { status: 400 },
    );
  }

  const { answers } = bodyResult.data;

  try {
    // Step 1: GemsAPI画像プロンプト生成 (並列実行の前に取得 — 画像品質向上のため)
    // taiyo-lp-image-prompter Gemが商品情報から最適な英語プロンプトを生成する
    const imagePromptsResult = await buildImagePromptsViaGems(answers).catch(() => null);

    // Step 2: 4並列実行: コピー + ヒーロー画像 + ベネフィット画像x3
    const [copyResult, heroResult, benefitResult] = await Promise.allSettled([
      // 1. LP Copy: GemsAPI (taiyo-lp-generator) → Gemini直接 → テンプレート
      generateCopyWithGemsAPI(answers)
        .catch((gemsErr) => {
          console.debug('[LP Generate] GemsAPI copy failed, trying AI direct:', gemsErr instanceof Error ? gemsErr.message : String(gemsErr));
          return generateCopyWithAI(answers);
        }),
      // 2. Hero image: GemsAPI generate-image → 直接API → Pexels
      resolveHeroImage(
        answers.productName,
        answers.targetAudience,
        answers.industry,
        imagePromptsResult?.hero,   // Gemが生成した最適化プロンプトを使用
      ),
      // 3. Benefit images: GemsAPI generate-image → Pexels (各ベネフィット)
      resolveBenefitImages(
        answers.benefits,
        answers.industry,
        imagePromptsResult          // Gemが生成したベネフィット別プロンプト
          ? [imagePromptsResult.benefit1, imagePromptsResult.benefit2, imagePromptsResult.benefit3]
          : undefined,
      ),
    ]);

    // Copy: 成功/フォールバック判定
    let copy: AIGeneratedCopy;
    let usedAI = false;
    let copySource: string = 'template';

    if (copyResult.status === 'fulfilled') {
      copy = copyResult.value;
      usedAI = true;
      copySource = GEMS_API_URL ? 'gems-api' : 'gemini';
    } else {
      console.debug('[LP Generate] All AI copy generation failed, using template:', copyResult.reason);
      copy = generateFallbackCopy(answers);
    }

    // Images
    const heroImage = heroResult.status === 'fulfilled' ? heroResult.value : null;
    const benefitImages = benefitResult.status === 'fulfilled' ? benefitResult.value : [];

    const components = buildComponents(copy, answers, heroImage, benefitImages);

    return NextResponse.json({
      success: true,
      components,
      usedAI,
      copySource,
      hasHeroImage: heroImage !== null,
      benefitImageCount: benefitImages.length,
      imageSource: heroImage
        ? (GEMS_API_URL ? 'gems-api' : 'direct-api')
        : 'none',
      message: usedAI
        ? `AIでLPを生成しました（${copySource}）`
        : 'テンプレートベースでLPを生成しました（AIサービスが利用できないため）',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `LP生成に失敗しました: ${message}` },
      { status: 500 },
    );
  }
}
