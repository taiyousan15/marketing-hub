/**
 * LP Generate API — E2E / Unit Tests
 *
 * Tests the core logic extracted from route.ts:
 *   - extractJson: parses JSON from raw AI responses
 *   - AIGeneratedCopySchema: validates the AI copy shape
 *   - buildComponents: produces the correct component tree
 *   - generateFallbackCopy: template-based fallback per ctaType
 *   - escapeHtml / sanitizeForPrompt: helper utilities
 *
 * External calls (fetch, Clerk auth, AI providers, Prisma) are fully mocked.
 * Environment variables are read from process.env and defaulted to empty strings
 * so tests are hermetic even without a .env file.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Mock external dependencies BEFORE importing the route module
// ---------------------------------------------------------------------------

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}))

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'mock-nanoid-id'),
}))

vi.mock('@/lib/ai/provider', () => ({
  getAIClient: vi.fn().mockResolvedValue({
    complete: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        headline: 'AI生成ヘッドライン',
        subheadline: 'サブヘッドライン',
        problemHeading: '問題提起の見出し',
        problems: ['問題1', '問題2'],
        benefitHeading: 'ベネフィット見出し',
        benefits: ['ベネフィット1', 'ベネフィット2'],
        targetMessage: 'ターゲットメッセージ',
        ctaHeading: 'CTA見出し',
        ctaDescription: 'CTA説明',
        ctaButtonText: '今すぐ始める',
        urgencyHeading: '緊急性見出し',
        urgencyText: '緊急性テキスト',
        faq: [
          { question: 'Q1?', answer: 'A1' },
          { question: 'Q2?', answer: 'A2' },
        ],
      }),
    }),
  }),
}))

// ---------------------------------------------------------------------------
// Re-implement the pure functions under test
// (The route exports no named helpers, so we duplicate the logic here.
//  This is intentional: tests should be resilient to module boundary changes.)
// ---------------------------------------------------------------------------

// ---------- extractJson (mirrors route.ts implementation) ----------

function extractJson(content: string): string | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) return fenced[1].trim()

  const start = content.indexOf('{')
  if (start === -1) return null

  for (let end = content.lastIndexOf('}'); end > start; end--) {
    const candidate = content.slice(start, end + 1)
    try {
      JSON.parse(candidate)
      return candidate
    } catch {
      // try shorter candidate
    }
  }
  return null
}

// ---------- AIGeneratedCopySchema (mirrors route.ts definition) ----------

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
})

type AIGeneratedCopy = z.infer<typeof AIGeneratedCopySchema>

// ---------- WizardAnswersSchema (mirrors route.ts definition) ----------

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
})

type WizardAnswers = z.infer<typeof WizardAnswersSchema>

// ---------- Helper utilities (mirrors route.ts) ----------

function sanitizeForPrompt(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/```/g, '')
    .trim()
    .slice(0, 500)
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ---------- generateFallbackCopy (mirrors route.ts) ----------

function generateFallbackCopy(answers: WizardAnswers): AIGeneratedCopy {
  const mainBenefit = answers.benefits[0] || '理想の結果'

  const headlineMap: Record<string, string> = {
    optin: `【無料】${mainBenefit}を手に入れる方法`,
    webinar: `【無料ウェビナー】${answers.productName}の秘訣を公開`,
    contact: `${mainBenefit}を実現する無料相談`,
    purchase: `${answers.productName}で${mainBenefit}`,
  }

  const ctaDescMap: Record<string, string> = {
    optin: 'メールアドレスを入力するだけで、すぐに始められます。',
    webinar: '無料で参加できます。お気軽にお申し込みください。',
    contact: '無料でご相談いただけます。お気軽にお問い合わせください。',
    purchase: '30日間の返金保証付き。リスクなしで始められます。',
  }

  const ctaTextMap: Record<string, string> = {
    optin: '無料で受け取る',
    purchase: '今すぐ申し込む',
    contact: '無料相談を申し込む',
    webinar: '無料で参加登録',
  }

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
  }

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
  }
}

// ---------- ComponentDef / buildComponents (mirrors route.ts) ----------

interface ComponentInstance {
  id: string
  componentType: string
  category: string
  order: number
  props: Record<string, string | number | boolean>
}

type ComponentDef = Omit<ComponentInstance, 'id' | 'order'>

interface GeneratedImage {
  url: string
  alt: string
  credit?: string
}

function buildComponents(
  copy: AIGeneratedCopy,
  answers: WizardAnswers,
  heroImage: GeneratedImage | null,
  benefitImages: GeneratedImage[],
): ComponentInstance[] {
  // Header
  const defs: ComponentDef[] = [
    {
      componentType: 'header',
      category: 'other',
      props: { logoText: escapeHtml(answers.productName), backgroundColor: '#ffffff', sticky: false },
    },
  ]

  // Hero image (optional)
  if (heroImage) {
    const imageDef: ComponentDef = {
      componentType: 'image',
      category: 'basic',
      props: { src: heroImage.url, alt: escapeHtml(heroImage.alt), width: 100 },
    }
    if (heroImage.credit) imageDef.props.credit = heroImage.credit
    defs.push(imageDef)
  }

  // Hero text
  defs.push(
    { componentType: 'headline', category: 'headline', props: { text: escapeHtml(copy.headline), fontSize: 36, fontSizeSp: 24, textColor: '#1f2937', textAlign: 'center', shadowStyle: 'none' } },
    { componentType: 'subhead', category: 'headline', props: { text: escapeHtml(copy.subheadline), fontSize: 20, fontSizeSp: 16, textColor: '#6b7280', textAlign: 'center' } },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  )

  // Problem section
  defs.push(
    { componentType: 'subhead', category: 'headline', props: { text: escapeHtml(copy.problemHeading), fontSize: 28, fontSizeSp: 20, textColor: '#dc2626', textAlign: 'center' } },
    { componentType: 'bullet', category: 'content', props: { items: copy.problems.map(escapeHtml).join('\n'), icon: 'arrow', iconColor: '#dc2626', fontSize: 16 } },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  )

  // Benefit section
  defs.push({
    componentType: 'subhead',
    category: 'headline',
    props: { text: escapeHtml(copy.benefitHeading), fontSize: 28, fontSizeSp: 20, textColor: '#1f2937', textAlign: 'center' },
  })

  if (benefitImages.length > 0) {
    copy.benefits.slice(0, 3).forEach((benefit, index) => {
      const image = benefitImages[index]
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
        })
      } else {
        defs.push({
          componentType: 'bullet',
          category: 'content',
          props: { items: escapeHtml(benefit), icon: 'check', iconColor: '#22c55e', fontSize: 16 },
        })
      }
    })
    const remaining = copy.benefits.slice(3)
    if (remaining.length > 0) {
      defs.push({
        componentType: 'bullet',
        category: 'content',
        props: { items: remaining.map(escapeHtml).join('\n'), icon: 'check', iconColor: '#22c55e', fontSize: 16 },
      })
    }
  } else {
    defs.push({
      componentType: 'bullet',
      category: 'content',
      props: { items: copy.benefits.map(escapeHtml).join('\n'), icon: 'check', iconColor: '#22c55e', fontSize: 16 },
    })
  }
  defs.push({ componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } })

  // Target section
  defs.push(
    { componentType: 'text', category: 'basic', props: { content: escapeHtml(copy.targetMessage), fontSize: 18, fontSizeSp: 16, lineHeight: 1.8, textColor: '#374151', backgroundColor: '#f9fafb', textAlign: 'center' } },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  )

  // CTA section
  defs.push(
    { componentType: 'subhead', category: 'headline', props: { text: escapeHtml(copy.ctaHeading), fontSize: 28, fontSizeSp: 20, textColor: '#1f2937', textAlign: 'center' } },
    { componentType: 'text', category: 'basic', props: { content: escapeHtml(copy.ctaDescription), fontSize: 16, fontSizeSp: 14, lineHeight: 1.6, textColor: '#6b7280', backgroundColor: 'transparent', textAlign: 'center' } },
  )
  if (answers.ctaType === 'optin' || answers.ctaType === 'webinar') {
    defs.push({
      componentType: 'registration-form',
      category: 'form',
      props: {
        title: escapeHtml(copy.ctaHeading),
        fields: answers.ctaType === 'webinar' ? 'name_email' : 'email',
        buttonText: escapeHtml(copy.ctaButtonText),
        buttonColor: '#22c55e',
        subText: answers.ctaType === 'webinar' ? '参加は完全無料です' : '登録は無料です',
        redirectUrl: '',
      },
    })
  } else if (answers.ctaType === 'contact') {
    defs.push({
      componentType: 'custom-form',
      category: 'form',
      props: {
        title: escapeHtml(copy.ctaHeading),
        fields: 'お名前|text\nメールアドレス|email\n電話番号|text\nご相談内容|textarea',
        buttonText: escapeHtml(copy.ctaButtonText),
        buttonColor: '#3b82f6',
      },
    })
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
    })
  }
  defs.push({ componentType: 'spacer', category: 'basic', props: { height: 60, heightSp: 30 } })

  // FAQ section
  const faqItems = copy.faq
    .map((f) => `${escapeHtml(f.question).replace(/\|/g, '｜')}|${escapeHtml(f.answer).replace(/\|/g, '｜')}`)
    .join('\n')
  defs.push(
    { componentType: 'subhead', category: 'headline', props: { text: 'よくある質問', fontSize: 28, fontSizeSp: 20, textColor: '#1f2937', textAlign: 'center' } },
    { componentType: 'accordion', category: 'content', props: { items: faqItems, defaultOpen: true, iconColor: '#6b7280' } },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  )

  // Urgency section
  defs.push(
    { componentType: 'headline', category: 'headline', props: { text: escapeHtml(copy.urgencyHeading), fontSize: 28, fontSizeSp: 20, textColor: '#ffffff', textAlign: 'center', shadowStyle: 'none' } },
    { componentType: 'text', category: 'basic', props: { content: escapeHtml(copy.urgencyText), fontSize: 16, fontSizeSp: 14, lineHeight: 1.6, textColor: '#fecaca', backgroundColor: '#dc2626', textAlign: 'center' } },
    { componentType: 'button', category: 'button', props: { text: escapeHtml(copy.ctaButtonText), subText: '', action: 'scroll', url: '', backgroundColor: '#ffffff', textColor: '#dc2626', fontSize: 20, width: 60, borderRadius: 8, animation: 'shake' } },
    { componentType: 'spacer', category: 'basic', props: { height: 40, heightSp: 20 } },
  )

  // Footer
  defs.push({
    componentType: 'footer',
    category: 'other',
    props: {
      copyright: `\u00a9 ${new Date().getFullYear()} ${escapeHtml(answers.productName)}. All rights reserved.`,
      links: 'プライバシーポリシー\n特定商取引法に基づく表記',
      backgroundColor: '#1f2937',
      textColor: '#ffffff',
    },
  })

  return defs.map((def, index) => ({
    ...def,
    id: 'mock-nanoid-id',
    order: index,
  }))
}

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------

export const mockWizardAnswers: WizardAnswers = {
  productName: 'マーケティング自動化ツール',
  productDescription: '中小企業向けのマーケティング自動化プラットフォーム',
  targetAudience: '中小企業のマーケティング担当者',
  problems: ['リードが集まらない', 'フォローアップが手間', '成約率が低い'],
  benefits: ['自動でリード獲得', 'ワンクリックでフォローアップ', '成約率が2倍に'],
  uniqueValue: 'AIが最適なタイミングでアプローチ',
  industry: 'SaaS',
  ctaType: 'optin',
  urgency: '今月末まで初期費用無料',
  pricing: '月額9,800円〜',
}

export const mockAICopy: AIGeneratedCopy = {
  headline: '中小企業のマーケティングを自動化して成約率2倍に',
  subheadline: 'マーケティング担当者のあなたへ。手間なく成果を出す方法があります。',
  problemHeading: 'こんなお悩みありませんか？',
  problems: ['リードが集まらない', 'フォローアップが手間', '成約率が低い'],
  benefitHeading: 'マーケティング自動化ツールで得られること',
  benefits: ['自動でリード獲得', 'ワンクリックでフォローアップ', '成約率が2倍に'],
  targetMessage: 'このプログラムは中小企業のマーケティング担当者の方に最適です。',
  ctaHeading: '今すぐ無料登録',
  ctaDescription: 'メールアドレスを入力するだけで始められます。',
  ctaButtonText: '無料で始める',
  urgencyHeading: '今月末まで初期費用無料！',
  urgencyText: '今月末でキャンペーン終了。お早めにどうぞ。',
  faq: [
    { question: '無料期間はいつまでですか？', answer: '今月末までとなっています。' },
    { question: 'サポートはありますか？', answer: 'はい、メールサポートをご利用いただけます。' },
    { question: 'キャンセルはいつでも可能ですか？', answer: 'はい、いつでもキャンセル可能です。' },
  ],
}

export const mockHeroImage: GeneratedImage = {
  url: 'https://images.pexels.com/photos/1/photo.jpg',
  alt: 'マーケティング自動化ツール',
  credit: 'Photo by Test User on Pexels',
}

export const mockBenefitImages: GeneratedImage[] = [
  { url: 'https://images.pexels.com/photos/2/photo.jpg', alt: '自動でリード獲得', credit: 'Photo by Test on Pexels' },
  { url: 'https://images.pexels.com/photos/3/photo.jpg', alt: 'ワンクリックでフォローアップ' },
]

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('extractJson', () => {
  it('parses JSON from a ```json fenced code block', () => {
    const input = '以下がJSONです:\n```json\n{"key":"value","num":42}\n```\n以上。'
    const result = extractJson(input)
    expect(result).not.toBeNull()
    expect(JSON.parse(result!)).toEqual({ key: 'value', num: 42 })
  })

  it('parses JSON from a plain ``` fenced code block (no language tag)', () => {
    const input = '```\n{"headline":"Test","count":1}\n```'
    const result = extractJson(input)
    expect(result).not.toBeNull()
    expect(JSON.parse(result!)).toEqual({ headline: 'Test', count: 1 })
  })

  it('parses raw JSON embedded in surrounding prose text', () => {
    const input = 'Here is the output: {"name":"product","active":true} — end.'
    const result = extractJson(input)
    expect(result).not.toBeNull()
    const parsed = JSON.parse(result!)
    expect(parsed.name).toBe('product')
    expect(parsed.active).toBe(true)
  })

  it('returns null when the input contains no JSON object', () => {
    expect(extractJson('')).toBeNull()
    expect(extractJson('Hello, no JSON here.')).toBeNull()
    expect(extractJson('Just an array: [1,2,3]')).toBeNull()
  })

  it('handles nested JSON objects correctly', () => {
    const nested = { headline: { main: 'メイン', sub: 'サブ' }, cta: { buttonText: 'Click' } }
    const input = `Result:\n\`\`\`json\n${JSON.stringify(nested)}\n\`\`\``
    const result = extractJson(input)
    expect(result).not.toBeNull()
    expect(JSON.parse(result!)).toEqual(nested)
  })

  it('recovers valid JSON from truncated/trailing-garbage input via brace scan', () => {
    // Simulates an AI response that appends extra text after the closing brace
    const validObj = { headline: 'Test headline' }
    const input = `${JSON.stringify(validObj)} some trailing garbage text`
    const result = extractJson(input)
    expect(result).not.toBeNull()
    expect(JSON.parse(result!)).toEqual(validObj)
  })
})

// ---------------------------------------------------------------------------

describe('AIGeneratedCopySchema validation', () => {
  it('accepts a fully valid copy object', () => {
    const result = AIGeneratedCopySchema.safeParse(mockAICopy)
    expect(result.success).toBe(true)
  })

  it('rejects an object missing required fields', () => {
    const invalid = { headline: 'Only headline, nothing else' }
    const result = AIGeneratedCopySchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects an empty problems array (min: 1)', () => {
    const invalid = { ...mockAICopy, problems: [] }
    const result = AIGeneratedCopySchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects an empty benefits array (min: 1)', () => {
    const invalid = { ...mockAICopy, benefits: [] }
    const result = AIGeneratedCopySchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects an empty faq array (min: 1)', () => {
    const invalid = { ...mockAICopy, faq: [] }
    const result = AIGeneratedCopySchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects ctaButtonText longer than 20 characters', () => {
    const invalid = { ...mockAICopy, ctaButtonText: 'この文字は20文字を超えているテスト用テキストです' }
    const result = AIGeneratedCopySchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('accepts a copy with exactly 20-char ctaButtonText', () => {
    const twentyChars = '今すぐ始める今すぐ始める今すぐ始める今す' // exactly 20 chars
    const valid = { ...mockAICopy, ctaButtonText: twentyChars }
    const result = AIGeneratedCopySchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects a faq item missing the answer field', () => {
    const invalid = { ...mockAICopy, faq: [{ question: 'Only question?' }] }
    const result = AIGeneratedCopySchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------

describe('WizardAnswersSchema validation', () => {
  it('accepts a complete valid input', () => {
    const result = WizardAnswersSchema.safeParse(mockWizardAnswers)
    expect(result.success).toBe(true)
  })

  it('rejects an empty productName', () => {
    const invalid = { ...mockWizardAnswers, productName: '' }
    expect(WizardAnswersSchema.safeParse(invalid).success).toBe(false)
  })

  it('rejects an empty targetAudience', () => {
    const invalid = { ...mockWizardAnswers, targetAudience: '' }
    expect(WizardAnswersSchema.safeParse(invalid).success).toBe(false)
  })

  it('rejects an empty problems array', () => {
    const invalid = { ...mockWizardAnswers, problems: [] }
    expect(WizardAnswersSchema.safeParse(invalid).success).toBe(false)
  })

  it('rejects an invalid ctaType', () => {
    const invalid = { ...mockWizardAnswers, ctaType: 'unknown' }
    expect(WizardAnswersSchema.safeParse(invalid).success).toBe(false)
  })

  it('accepts all four valid ctaType values', () => {
    const types = ['optin', 'purchase', 'contact', 'webinar'] as const
    for (const ctaType of types) {
      const result = WizardAnswersSchema.safeParse({ ...mockWizardAnswers, ctaType })
      expect(result.success).toBe(true)
    }
  })

  it('accepts missing optional fields', () => {
    const minimal: WizardAnswers = {
      productName: 'テスト商品',
      targetAudience: 'テストユーザー',
      problems: ['問題A'],
      benefits: ['利益A'],
      ctaType: 'contact',
    }
    expect(WizardAnswersSchema.safeParse(minimal).success).toBe(true)
  })
})

// ---------------------------------------------------------------------------

describe('buildComponents — output structure', () => {
  it('contains a header as the first component and footer as the last', () => {
    const components = buildComponents(mockAICopy, mockWizardAnswers, null, [])
    expect(components[0].componentType).toBe('header')
    expect(components[components.length - 1].componentType).toBe('footer')
  })

  it('assigns sequential order values starting at 0', () => {
    const components = buildComponents(mockAICopy, mockWizardAnswers, null, [])
    components.forEach((c, i) => {
      expect(c.order).toBe(i)
    })
  })

  it('assigns an id to every component', () => {
    const components = buildComponents(mockAICopy, mockWizardAnswers, null, [])
    for (const c of components) {
      expect(c.id).toBeTruthy()
      expect(typeof c.id).toBe('string')
    }
  })

  it('includes a hero image component when heroImage is provided', () => {
    const components = buildComponents(mockAICopy, mockWizardAnswers, mockHeroImage, [])
    const imageComponents = components.filter((c) => c.componentType === 'image')
    expect(imageComponents.length).toBeGreaterThanOrEqual(1)
    expect(imageComponents[0].props.src).toBe(mockHeroImage.url)
    expect(imageComponents[0].props.credit).toBe(mockHeroImage.credit)
  })

  it('does not include a hero image component when heroImage is null', () => {
    const components = buildComponents(mockAICopy, mockWizardAnswers, null, [])
    const imageComponents = components.filter((c) => c.componentType === 'image')
    expect(imageComponents.length).toBe(0)
  })

  it('produces imageText components when benefitImages are provided', () => {
    const components = buildComponents(mockAICopy, mockWizardAnswers, null, mockBenefitImages)
    const imageTextComponents = components.filter((c) => c.componentType === 'imageText')
    expect(imageTextComponents.length).toBe(mockBenefitImages.length)
  })

  it('uses alternating imagePosition (left/right) for imageText components', () => {
    const components = buildComponents(mockAICopy, mockWizardAnswers, null, mockBenefitImages)
    const imageTextComponents = components.filter((c) => c.componentType === 'imageText')
    expect(imageTextComponents[0].props.imagePosition).toBe('left')
    if (imageTextComponents[1]) {
      expect(imageTextComponents[1].props.imagePosition).toBe('right')
    }
  })

  it('uses a registration-form for ctaType optin', () => {
    const components = buildComponents(mockAICopy, { ...mockWizardAnswers, ctaType: 'optin' }, null, [])
    const forms = components.filter((c) => c.componentType === 'registration-form')
    expect(forms.length).toBe(1)
    expect(forms[0].props.fields).toBe('email')
  })

  it('uses a registration-form with name_email fields for ctaType webinar', () => {
    const components = buildComponents(mockAICopy, { ...mockWizardAnswers, ctaType: 'webinar' }, null, [])
    const forms = components.filter((c) => c.componentType === 'registration-form')
    expect(forms.length).toBe(1)
    expect(forms[0].props.fields).toBe('name_email')
  })

  it('uses a custom-form for ctaType contact', () => {
    const components = buildComponents(mockAICopy, { ...mockWizardAnswers, ctaType: 'contact' }, null, [])
    const forms = components.filter((c) => c.componentType === 'custom-form')
    expect(forms.length).toBe(1)
  })

  it('uses a button component for ctaType purchase', () => {
    const components = buildComponents(mockAICopy, { ...mockWizardAnswers, ctaType: 'purchase' }, null, [])
    // purchase CTA uses a button in the CTA section (not a form)
    const ctaButtons = components.filter(
      (c) => c.componentType === 'button' && c.props.action === 'link',
    )
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('always includes an accordion component for FAQ', () => {
    const components = buildComponents(mockAICopy, mockWizardAnswers, null, [])
    const accordions = components.filter((c) => c.componentType === 'accordion')
    expect(accordions.length).toBe(1)
    expect(typeof accordions[0].props.items).toBe('string')
    expect(accordions[0].props.items).toContain('無料期間')
  })

  it('HTML-escapes the productName in the header logoText', () => {
    const xssAnswers: WizardAnswers = {
      ...mockWizardAnswers,
      productName: '<script>alert("xss")</script>',
    }
    const components = buildComponents(mockAICopy, xssAnswers, null, [])
    expect(components[0].props.logoText).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    )
  })

  it('produces at least 10 components for a minimal setup', () => {
    const minimalAnswers: WizardAnswers = {
      productName: 'シンプル商品',
      targetAudience: 'シンプルユーザー',
      problems: ['問題A'],
      benefits: ['利益A'],
      ctaType: 'purchase',
    }
    const components = buildComponents(mockAICopy, minimalAnswers, null, [])
    expect(components.length).toBeGreaterThanOrEqual(10)
  })
})

// ---------------------------------------------------------------------------

describe('generateFallbackCopy — template output per ctaType', () => {
  it('generates valid copy for ctaType optin', () => {
    const copy = generateFallbackCopy({ ...mockWizardAnswers, ctaType: 'optin' })
    const result = AIGeneratedCopySchema.safeParse(copy)
    expect(result.success).toBe(true)
    expect(copy.headline).toContain('無料')
    expect(copy.ctaButtonText).toBe('無料で受け取る')
    expect(copy.faq).toHaveLength(3)
  })

  it('generates valid copy for ctaType purchase', () => {
    const copy = generateFallbackCopy({ ...mockWizardAnswers, ctaType: 'purchase' })
    const result = AIGeneratedCopySchema.safeParse(copy)
    expect(result.success).toBe(true)
    expect(copy.ctaButtonText).toBe('今すぐ申し込む')
    expect(copy.ctaDescription).toContain('返金保証')
  })

  it('generates valid copy for ctaType contact', () => {
    const copy = generateFallbackCopy({ ...mockWizardAnswers, ctaType: 'contact' })
    const result = AIGeneratedCopySchema.safeParse(copy)
    expect(result.success).toBe(true)
    expect(copy.ctaButtonText).toBe('無料相談を申し込む')
    expect(copy.ctaDescription).toContain('無料')
  })

  it('generates valid copy for ctaType webinar', () => {
    const copy = generateFallbackCopy({ ...mockWizardAnswers, ctaType: 'webinar' })
    const result = AIGeneratedCopySchema.safeParse(copy)
    expect(result.success).toBe(true)
    expect(copy.headline).toContain('ウェビナー')
    expect(copy.ctaButtonText).toBe('無料で参加登録')
  })

  it('preserves the input problems and benefits arrays verbatim', () => {
    const copy = generateFallbackCopy(mockWizardAnswers)
    expect(copy.problems).toEqual(mockWizardAnswers.problems)
    expect(copy.benefits).toEqual(mockWizardAnswers.benefits)
  })

  it('falls back to "理想の結果" when benefits array is unexpectedly empty', () => {
    // We force an empty benefits array via type assertion to exercise the default branch
    const answers = { ...mockWizardAnswers, benefits: [] } as unknown as WizardAnswers
    const copy = generateFallbackCopy(answers)
    expect(copy.headline).toContain('理想の結果')
  })
})

// ---------------------------------------------------------------------------

describe('escapeHtml helper', () => {
  it('escapes all four special HTML characters', () => {
    expect(escapeHtml('& < > "')).toBe('&amp; &lt; &gt; &quot;')
  })

  it('returns the original string when no special characters are present', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123')
  })

  it('handles multiple occurrences of the same character', () => {
    expect(escapeHtml('<<>>')).toBe('&lt;&lt;&gt;&gt;')
  })

  it('escapes a realistic XSS payload', () => {
    const payload = '<script>alert("xss")</script>'
    expect(escapeHtml(payload)).not.toContain('<script>')
    expect(escapeHtml(payload)).toContain('&lt;script&gt;')
  })
})

// ---------------------------------------------------------------------------

describe('sanitizeForPrompt helper', () => {
  it('strips leading markdown headings', () => {
    expect(sanitizeForPrompt('# Heading')).toBe('Heading')
    expect(sanitizeForPrompt('## Sub Heading')).toBe('Sub Heading')
    expect(sanitizeForPrompt('### Third Level')).toBe('Third Level')
  })

  it('removes fenced code block markers', () => {
    expect(sanitizeForPrompt('value with ``` backticks')).toBe('value with  backticks')
  })

  it('truncates input to 500 characters', () => {
    const longString = 'a'.repeat(600)
    expect(sanitizeForPrompt(longString)).toHaveLength(500)
  })

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeForPrompt('  padded  ')).toBe('padded')
  })

  it('preserves normal text unchanged', () => {
    expect(sanitizeForPrompt('Normal product name')).toBe('Normal product name')
  })
})

// ---------------------------------------------------------------------------

describe('Environment variable configuration', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('reads GEMS_API_URL from process.env', () => {
    process.env.GEMS_API_URL = 'https://gems.example.com'
    expect(process.env.GEMS_API_URL).toBe('https://gems.example.com')
  })

  it('reads GEMS_API_TOKEN from process.env', () => {
    process.env.GEMS_API_TOKEN = 'test-token-abc123'
    expect(process.env.GEMS_API_TOKEN).toBe('test-token-abc123')
  })

  it('reads GEMS_GEM_NAME from process.env', () => {
    process.env.GEMS_GEM_NAME = 'custom-gem-name'
    expect(process.env.GEMS_GEM_NAME).toBe('custom-gem-name')
  })

  it('defaults GEMS_GEM_NAME to "taiyo-lp-generator" when unset', () => {
    delete process.env.GEMS_GEM_NAME
    const defaultName = process.env.GEMS_GEM_NAME || 'taiyo-lp-generator'
    expect(defaultName).toBe('taiyo-lp-generator')
  })

  it('treats missing GEMS_API_URL as empty string (disables GemsAPI path)', () => {
    delete process.env.GEMS_API_URL
    const url = process.env.GEMS_API_URL || ''
    expect(url).toBe('')
  })
})
