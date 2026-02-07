import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

/**
 * LP生成API
 * AIウィザードの回答を元にLPコンポーネントを生成
 */

interface WizardAnswers {
  productName: string;
  productDescription?: string;
  targetAudience: string;
  problems: string[];
  benefits: string[];
  uniqueValue?: string;
  ctaType: 'optin' | 'purchase' | 'contact' | 'webinar';
  urgency?: string;
  testimonials?: string;
  pricing?: string;
  style?: string;
}

interface ComponentInstance {
  id: string;
  componentType: string;
  category: string;
  order: number;
  props: Record<string, string | number | boolean>;
}

export async function POST(request: NextRequest) {
  try {
    const { answers } = await request.json() as { answers: WizardAnswers };

    if (!answers) {
      return NextResponse.json(
        { error: '回答が必要です' },
        { status: 400 }
      );
    }

    // 回答を元にLPコンポーネントを生成
    const components = generateLPComponents(answers);

    return NextResponse.json({
      success: true,
      components,
      message: 'LPを生成しました',
    });
  } catch (error) {
    console.error('LP generation error:', error);
    return NextResponse.json(
      { error: 'LP生成に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 回答を元にLPコンポーネントを生成
 */
function generateLPComponents(answers: WizardAnswers): ComponentInstance[] {
  const components: ComponentInstance[] = [];
  let order = 0;

  // 1. ヘッダー
  components.push({
    id: nanoid(),
    componentType: 'header-simple',
    category: 'header',
    order: order++,
    props: {
      logoText: answers.productName,
      ctaText: getCTAText(answers.ctaType),
      backgroundColor: '#ffffff',
    },
  });

  // 2. ヒーローセクション
  components.push({
    id: nanoid(),
    componentType: 'hero-classic',
    category: 'hero',
    order: order++,
    props: {
      headline: generateHeadline(answers),
      subheadline: generateSubheadline(answers),
      ctaPrimary: getCTAText(answers.ctaType),
      ctaSecondary: '詳しく見る',
      backgroundColor: '#f3f4f6',
    },
  });

  // 3. 問題提起
  components.push({
    id: nanoid(),
    componentType: 'problem-list',
    category: 'problem',
    order: order++,
    props: {
      headline: 'こんなお悩みありませんか？',
      problems: answers.problems?.join('\n') || '',
    },
  });

  // 4. 解決策（ベネフィット）
  components.push({
    id: nanoid(),
    componentType: 'solution-features',
    category: 'solution',
    order: order++,
    props: {
      headline: `${answers.productName}で得られること`,
      features: answers.benefits
        ?.map((benefit, i) => `ベネフィット${i + 1}|${benefit}`)
        .join('\n') || '',
      columns: 3,
    },
  });

  // 5. ターゲット向けメッセージ
  components.push({
    id: nanoid(),
    componentType: 'solution-benefits',
    category: 'solution',
    order: order++,
    props: {
      headline: `${answers.targetAudience}のあなたへ`,
      benefits: `このプログラムは${answers.targetAudience}の方に最適です\n今すぐ始めれば、理想の結果が手に入ります\n一人で悩む必要はありません`,
    },
  });

  // 6. CTA（行動喚起）タイプに応じたセクション
  if (answers.ctaType === 'optin') {
    components.push({
      id: nanoid(),
      componentType: 'form-newsletter',
      category: 'form',
      order: order++,
      props: {
        headline: '今すぐ無料で受け取る',
        description: 'メールアドレスを入力するだけで、すぐに始められます',
        submitText: '無料で受け取る',
      },
    });
  } else if (answers.ctaType === 'webinar') {
    components.push({
      id: nanoid(),
      componentType: 'form-registration',
      category: 'form',
      order: order++,
      props: {
        headline: 'ウェビナーに無料参加',
        fields: '名前\nメールアドレス',
        submitText: '無料で参加登録する',
      },
    });
  } else if (answers.ctaType === 'contact') {
    components.push({
      id: nanoid(),
      componentType: 'form-contact',
      category: 'form',
      order: order++,
      props: {
        headline: '無料相談を申し込む',
        fields: '名前\nメールアドレス\n電話番号\nご相談内容',
        submitText: '無料相談を申し込む',
      },
    });
  } else {
    // purchase
    components.push({
      id: nanoid(),
      componentType: 'cta-simple',
      category: 'cta',
      order: order++,
      props: {
        headline: '今すぐ始めよう',
        description: '30日間の返金保証付き。リスクなしで始められます。',
        buttonText: '今すぐ申し込む',
        buttonColor: '#3b82f6',
      },
    });
  }

  // 7. FAQ
  components.push({
    id: nanoid(),
    componentType: 'faq-accordion',
    category: 'faq',
    order: order++,
    props: {
      headline: 'よくある質問',
      items: generateFAQ(answers),
    },
  });

  // 8. 最終CTA
  components.push({
    id: nanoid(),
    componentType: 'cta-urgency',
    category: 'cta',
    order: order++,
    props: {
      headline: '今すぐ行動を！',
      urgencyText: '今日が一番若い日です',
      buttonText: getCTAText(answers.ctaType),
      backgroundColor: '#dc2626',
    },
  });

  // 9. フッター
  components.push({
    id: nanoid(),
    componentType: 'footer-simple',
    category: 'footer',
    order: order++,
    props: {
      copyright: `© ${new Date().getFullYear()} ${answers.productName}. All rights reserved.`,
      links: 'プライバシーポリシー\n特定商取引法に基づく表記',
    },
  });

  return components;
}

/**
 * CTAタイプに応じたボタンテキストを生成
 */
function getCTAText(ctaType: string): string {
  const ctaTexts: Record<string, string> = {
    optin: '無料で受け取る',
    purchase: '今すぐ申し込む',
    contact: '無料相談を申し込む',
    webinar: '無料で参加登録',
  };
  return ctaTexts[ctaType] || '今すぐ始める';
}

/**
 * ヘッドラインを生成
 */
function generateHeadline(answers: WizardAnswers): string {
  const { productName, ctaType, benefits } = answers;

  // ベネフィットから最もインパクトのあるものを選ぶ
  const mainBenefit = benefits?.[0] || '理想の結果';

  if (ctaType === 'optin') {
    return `【無料】${mainBenefit}を手に入れる方法`;
  } else if (ctaType === 'webinar') {
    return `【無料ウェビナー】${productName}の秘訣を公開`;
  } else if (ctaType === 'contact') {
    return `${mainBenefit}を実現する無料相談`;
  } else {
    return `${productName}で${mainBenefit}`;
  }
}

/**
 * サブヘッドラインを生成
 */
function generateSubheadline(answers: WizardAnswers): string {
  const { targetAudience, benefits } = answers;

  return `${targetAudience}のあなたへ。${benefits?.[0] || '理想の結果'}を手に入れる方法をお伝えします。`;
}

/**
 * FAQを生成
 */
function generateFAQ(answers: WizardAnswers): string {
  const { ctaType, productName } = answers;

  const faqs: string[] = [];

  if (ctaType === 'optin') {
    faqs.push(
      '本当に無料ですか？|はい、完全無料でご利用いただけます',
      'メールアドレスは安全ですか？|はい、プライバシーポリシーに基づき厳重に管理しています',
      'いつでも解除できますか？|はい、メール内のリンクからいつでも解除できます'
    );
  } else if (ctaType === 'webinar') {
    faqs.push(
      '参加費はかかりますか？|いいえ、完全無料でご参加いただけます',
      '当日参加できなくても大丈夫ですか？|はい、録画をお送りしますのでご安心ください',
      'どんな内容ですか？|' + productName + 'の核心をお伝えする内容です'
    );
  } else if (ctaType === 'contact') {
    faqs.push(
      '相談は本当に無料ですか？|はい、初回相談は完全無料です',
      '強引な勧誘はありますか？|いいえ、一切ありません。ご安心ください',
      '相談時間はどのくらいですか？|30分〜60分程度を予定しています'
    );
  } else {
    faqs.push(
      '返金保証はありますか？|はい、30日間の返金保証があります',
      '初心者でも大丈夫ですか？|はい、基礎から丁寧に解説します',
      'サポートはありますか？|はい、メールサポートをご利用いただけます'
    );
  }

  return faqs.join('\n');
}
