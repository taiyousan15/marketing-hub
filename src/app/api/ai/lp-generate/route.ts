import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';

/**
 * LP生成API
 * AIウィザードの回答を元にAI（プロバイダー層経由）でLPコンポーネントを生成
 */

// --- Schemas ---

const WizardAnswersSchema = z.object({
  productName: z.string().min(1).max(200),
  productDescription: z.string().max(1000).optional(),
  targetAudience: z.string().min(1).max(500),
  problems: z.array(z.string().max(300)).min(1).max(10),
  benefits: z.array(z.string().max(300)).min(1).max(10),
  uniqueValue: z.string().max(500).optional(),
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

// --- Helpers ---

const AI_TIMEOUT_MS = 60_000;

/** プロンプトインジェクション対策: ユーザー入力をサニタイズ */
function sanitizeForPrompt(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```/g, '')
    .trim()
    .slice(0, 500);
}

/** HTMLエスケープ: AI出力をコンポーネントpropsに入れる前にサニタイズ */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** JSON抽出: LLMレスポンスからJSONブロックを安全に取り出す */
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
      // shorter candidate
    }
  }
  return null;
}

// --- AI Generation ---

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
    setTimeout(() => reject(new Error('AI生成タイムアウト（60秒）')), AI_TIMEOUT_MS);
  });

  const result = await Promise.race([
    client.complete(
      [{ role: 'user', content: prompt }],
      { temperature: 0.7, maxTokens: 4096 },
    ),
    timeoutPromise,
  ]);

  const jsonStr = extractJson(result.content);
  if (!jsonStr) {
    throw new Error('AIからのレスポンスにJSONが見つかりませんでした');
  }

  const raw = JSON.parse(jsonStr);
  return AIGeneratedCopySchema.parse(raw);
}

// --- Fallback Template Generation ---

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
    headline: headlineMap[answers.ctaType] || `${answers.productName}で${mainBenefit}`,
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

// --- Component Builders ---

function buildHeaderSection(answers: WizardAnswers): ComponentDef[] {
  return [
    {
      componentType: 'header',
      category: 'other',
      props: { logoText: escapeHtml(answers.productName), backgroundColor: '#ffffff', sticky: false },
    },
  ];
}

function buildHeroSection(copy: AIGeneratedCopy): ComponentDef[] {
  return [
    {
      componentType: 'headline',
      category: 'headline',
      props: { text: escapeHtml(copy.headline), fontSize: 36, fontSizeSp: 24, textColor: '#1f2937', textAlign: 'center', shadowStyle: 'none' },
    },
    {
      componentType: 'subhead',
      category: 'headline',
      props: { text: escapeHtml(copy.subheadline), fontSize: 20, fontSizeSp: 16, textColor: '#6b7280', textAlign: 'center' },
    },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  ];
}

function buildProblemSection(copy: AIGeneratedCopy): ComponentDef[] {
  return [
    {
      componentType: 'subhead',
      category: 'headline',
      props: { text: escapeHtml(copy.problemHeading), fontSize: 28, fontSizeSp: 20, textColor: '#dc2626', textAlign: 'center' },
    },
    {
      componentType: 'bullet',
      category: 'content',
      props: { items: copy.problems.map(escapeHtml).join('\n'), icon: 'arrow', iconColor: '#dc2626', fontSize: 16 },
    },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  ];
}

function buildBenefitSection(copy: AIGeneratedCopy): ComponentDef[] {
  return [
    {
      componentType: 'subhead',
      category: 'headline',
      props: { text: escapeHtml(copy.benefitHeading), fontSize: 28, fontSizeSp: 20, textColor: '#1f2937', textAlign: 'center' },
    },
    {
      componentType: 'bullet',
      category: 'content',
      props: { items: copy.benefits.map(escapeHtml).join('\n'), icon: 'check', iconColor: '#22c55e', fontSize: 16 },
    },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  ];
}

function buildTargetSection(copy: AIGeneratedCopy): ComponentDef[] {
  return [
    {
      componentType: 'text',
      category: 'basic',
      props: {
        content: escapeHtml(copy.targetMessage),
        fontSize: 18, fontSizeSp: 16, lineHeight: 1.8,
        textColor: '#374151', backgroundColor: '#f9fafb', textAlign: 'center',
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
      props: { text: escapeHtml(copy.ctaHeading), fontSize: 28, fontSizeSp: 20, textColor: '#1f2937', textAlign: 'center' },
    },
    {
      componentType: 'text',
      category: 'basic',
      props: { content: escapeHtml(copy.ctaDescription), fontSize: 16, fontSizeSp: 14, lineHeight: 1.6, textColor: '#6b7280', backgroundColor: 'transparent', textAlign: 'center' },
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
        fields: 'お名前|text\nメールアドレス|email\n電話番号|text\nご相談内容|textarea',
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
        action: 'link', url: '',
        backgroundColor: '#dc2626', textColor: '#ffffff',
        fontSize: 20, width: 80, borderRadius: 8, animation: 'shine',
      },
    });
  }

  defs.push({ componentType: 'spacer', category: 'basic', props: { height: 60, heightSp: 30 } });
  return defs;
}

function buildFaqSection(copy: AIGeneratedCopy): ComponentDef[] {
  const faqItems = copy.faq
    .map((f) => `${escapeHtml(f.question).replace(/\|/g, '｜')}|${escapeHtml(f.answer).replace(/\|/g, '｜')}`)
    .join('\n');

  return [
    {
      componentType: 'subhead',
      category: 'headline',
      props: { text: 'よくある質問', fontSize: 28, fontSizeSp: 20, textColor: '#1f2937', textAlign: 'center' },
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
      props: { text: escapeHtml(copy.urgencyHeading), fontSize: 28, fontSizeSp: 20, textColor: '#ffffff', textAlign: 'center', shadowStyle: 'none' },
    },
    {
      componentType: 'text',
      category: 'basic',
      props: { content: escapeHtml(copy.urgencyText), fontSize: 16, fontSizeSp: 14, lineHeight: 1.6, textColor: '#fecaca', backgroundColor: '#dc2626', textAlign: 'center' },
    },
    {
      componentType: 'button',
      category: 'button',
      props: { text: escapeHtml(copy.ctaButtonText), subText: '', action: 'scroll', url: '', backgroundColor: '#ffffff', textColor: '#dc2626', fontSize: 20, width: 60, borderRadius: 8, animation: 'shake' },
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
        backgroundColor: '#1f2937', textColor: '#ffffff',
      },
    },
  ];
}

/** すべてのセクションを結合し、id と order を付与 */
function buildComponents(copy: AIGeneratedCopy, answers: WizardAnswers): ComponentInstance[] {
  const defs: ComponentDef[] = [
    ...buildHeaderSection(answers),
    ...buildHeroSection(copy),
    ...buildProblemSection(copy),
    ...buildBenefitSection(copy),
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

// --- Route Handler ---

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bodyResult = z.object({ answers: WizardAnswersSchema }).safeParse(await request.json());
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: '入力が不正です', details: bodyResult.error.flatten() },
      { status: 400 },
    );
  }

  const { answers } = bodyResult.data;

  try {
    let copy: AIGeneratedCopy;
    let usedAI = false;

    try {
      copy = await generateCopyWithAI(answers);
      usedAI = true;
    } catch (aiError) {
      const reason = aiError instanceof Error ? aiError.message : String(aiError);
      copy = generateFallbackCopy(answers);
      return NextResponse.json({
        success: true,
        components: buildComponents(copy, answers),
        usedAI: false,
        fallbackReason: reason,
        message: 'テンプレートベースでLPを生成しました（AIサービスが利用できないため）',
      });
    }

    return NextResponse.json({
      success: true,
      components: buildComponents(copy, answers),
      usedAI,
      message: 'AIモデルでLPを生成しました',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '不明なエラー';
    return NextResponse.json(
      { error: `LP生成に失敗しました: ${message}` },
      { status: 500 },
    );
  }
}
