#!/usr/bin/env node
/**
 * LP ローカル生成スクリプト
 * AIゴールドラッシュ/第二次AIバブルセミナー LP × 4種類を生成
 * ~/Desktop/マーケティングハブLP保存/ に保存
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(process.env.HOME, 'Desktop', 'マーケティングハブLP保存');

// AIゴールドラッシュセミナー 共通コンテンツ
const BASE_CONTENT = {
  productName: 'AIゴールドラッシュ 第二次AIバブルセミナー',
  targetAudience: '副業・起業に興味があるが行動できていない30〜50代のビジネスパーソン・会社員',
  industry: 'business education AI',
  problems: [
    'AIを活用したいが何から始めればいいかわからない',
    '副業で稼げると聞くが具体的な方法が不明',
    '第一次AIブームに乗り遅れ、次のチャンスも逃しそう',
    '毎月の収入が増えず将来の不安が拭えない',
    '情報は多いが本当に使えるノウハウが見つからない',
  ],
  benefits: [
    '今すぐ使えるAIビジネス構築の具体的ステップを習得',
    '第二次AIバブルで先行者利益を獲得できる',
    '月収50万円以上を実現した実践者の成功事例を学べる',
    'ChatGPT・Claude等のAIツールを収益化する方法がわかる',
    '副業から始めて独立・起業へのロードマップが手に入る',
    'ゼロから6ヶ月で月20万円の副収入を作った方法を公開',
  ],
  uniqueValue: '現役AIビジネスコンサルタントが実際の収益実績を公開しながら解説。参加者の92%が受講後3ヶ月以内に副収入を開始。',
  urgency: '参加枠は残り37名。今月末で受付終了。定員に達し次第締め切り。',
};

// 4種類のLP設定
const LP_CONFIGS = [
  {
    id: 'lp1-webinar',
    label: 'LP1 - ウェビナー登録（セミナー参加申込）',
    ctaType: 'webinar',
    style: 'energetic',
  },
  {
    id: 'lp2-optin',
    label: 'LP2 - オプトイン（無料レポートDL）',
    ctaType: 'optin',
    style: 'professional',
  },
  {
    id: 'lp3-purchase',
    label: 'LP3 - 購入（AI講座販売）',
    ctaType: 'purchase',
    style: 'energetic',
  },
  {
    id: 'lp4-contact',
    label: 'LP4 - 問い合わせ（無料戦略相談）',
    ctaType: 'contact',
    style: 'warm',
  },
];

// CTA別コピーテンプレート
function generateCopy(config) {
  const ctaMap = {
    webinar: {
      headline: '【無料セミナー】第二次AIバブルで1000万円稼ぐ人・逃す人の決定的な差とは',
      subheadline: 'AIで月収50万円を達成した実践者が語る「今だけが使える戦略」を90分で公開',
      problemHeading: 'このままAIに乗り遅れていませんか？',
      benefitHeading: 'このセミナーで得られること',
      targetMessage: 'このセミナーはAIビジネスに興味はあるが「何をすれば良いかわからない」「本当に稼げるのか疑っている」というあなたのために設計されています。参加者の92%が受講後3ヶ月以内に行動を開始しています。',
      ctaHeading: '今すぐ無料で参加登録する',
      ctaDescription: 'メールアドレスを入力するだけで予約完了。当日は世界トップレベルのAIビジネス戦略を無料で学べます。',
      ctaButtonText: '無料でセミナーに参加する',
      urgencyHeading: '⚠️ 残席わずか37名！',
      urgencyText: '定員に達し次第、受付を終了します。今すぐ登録して席を確保してください。',
      faq: [
        { question: 'セミナーは本当に無料ですか？', answer: 'はい、参加費は完全無料です。後から費用が発生することもありません。' },
        { question: '録画で後から視聴できますか？', answer: '申し訳ありませんが、当日参加限定のセミナーです。リアルタイムの質疑応答も含まれます。' },
        { question: 'AIの知識がなくても参加できますか？', answer: 'はい、ゼロから始めた実践者が登壇しますので、初心者の方に最適な内容です。' },
        { question: '副業初心者でも稼げますか？', answer: '参加者の多くが副業未経験からスタートしています。具体的なステップを順序立てて解説します。' },
      ],
    },
    optin: {
      headline: '【無料PDF】AIで月収20万円を作った人だけが知っている「6つの秘密」を公開',
      subheadline: '第二次AIバブルの波に乗る人が今やっていること、全部まとめました',
      problemHeading: 'こんな悩みを抱えていませんか？',
      benefitHeading: 'この無料レポートでわかること',
      targetMessage: 'このレポートはAIビジネスに興味があるけれど一歩が踏み出せない方へ向けて、実際に成果を出した人だけが知っている実践的ノウハウを惜しみなく公開しています。',
      ctaHeading: '今すぐ無料でダウンロード',
      ctaDescription: 'メールアドレスを入力するだけで、全40ページのPDFレポートを今すぐ受け取れます。',
      ctaButtonText: '無料レポートを受け取る',
      urgencyHeading: '期間限定の無料公開中',
      urgencyText: '通常有料（4,980円）のレポートを期間限定で無料配布中。今月末で終了予定です。',
      faq: [
        { question: '本当に無料ですか？', answer: 'はい、完全無料です。クレジットカード情報の入力も不要です。' },
        { question: 'メールが届かない場合は？', answer: '迷惑メールフォルダをご確認ください。それでも届かない場合はお問い合わせください。' },
        { question: '配信停止はできますか？', answer: 'はい、メール内のリンクからいつでも解除できます。' },
        { question: 'AIの知識は必要ですか？', answer: 'ゼロから始められる内容です。専門用語も丁寧に解説しています。' },
      ],
    },
    purchase: {
      headline: '【AI副業マスタープログラム】受講者の92%が3ヶ月以内に月収20万円を突破',
      subheadline: '第二次AIバブルで先行者利益を掴む。今だけが使える戦略を体系的に学ぶ6ヶ月コース',
      problemHeading: 'これが今まで結果が出なかった理由です',
      benefitHeading: 'このプログラムで得られる成果',
      targetMessage: 'このプログラムは「情報だけで終わらない、実際に稼げる」ことにこだわって設計されています。担当コンサルタントが専属でサポートし、あなたの状況に合わせたアドバイスを提供します。',
      ctaHeading: '今すぐ申し込む',
      ctaDescription: '特別価格は今月末まで。30日間の返金保証付きで安心してスタートできます。',
      ctaButtonText: '今すぐ申し込む',
      urgencyHeading: '今月末で特別価格終了',
      urgencyText: '通常価格198,000円のところ、今月末まで限定で98,000円。30日間返金保証付き。',
      faq: [
        { question: '返金保証はありますか？', answer: 'はい、受講開始から30日以内であれば全額返金いたします。リスクなしでお試しください。' },
        { question: '完全初心者でも大丈夫ですか？', answer: 'はい、ゼロから始める方向けのカリキュラムです。PCの基本操作ができれば問題ありません。' },
        { question: 'どのくらいの時間が必要ですか？', answer: '週3〜5時間から始められます。隙間時間を活用した実践法も解説します。' },
        { question: 'サポートはどの程度受けられますか？', answer: '専属コンサルタントによる月2回のオンライン面談と、チャットサポート（平日10-18時）が含まれます。' },
      ],
    },
    contact: {
      headline: '【無料相談】あなたのAIビジネス参入戦略を専門家が60分で設計します',
      subheadline: '第二次AIバブルで確実に稼ぐための個別ロードマップを、今すぐ無料で手に入れてください',
      problemHeading: 'なぜ一人で考えても答えが出ないのか',
      benefitHeading: '無料相談でわかること',
      targetMessage: '無料相談では、あなたの現在のスキル・時間・目標に合わせた最適なAIビジネスの形を具体的に提案します。強引な勧誘は一切行いません。相談だけでも大歓迎です。',
      ctaHeading: '今すぐ無料相談を申し込む',
      ctaDescription: 'フォームに必要事項を入力するだけで、24時間以内に担当者からご連絡します。',
      ctaButtonText: '無料相談を申し込む',
      urgencyHeading: '今月の無料相談枠は残り8名',
      urgencyText: '毎月先着順で受付。定員に達し次第、翌月以降のご案内となります。今すぐお申し込みください。',
      faq: [
        { question: '相談は本当に無料ですか？', answer: 'はい、完全無料です。相談後の強引な勧誘も一切ありません。' },
        { question: '相談時間はどのくらいですか？', answer: 'オンライン（Zoom）で約60分です。事前にアンケートをお送りしますので当日は本題から入れます。' },
        { question: 'どんな内容を相談できますか？', answer: 'AIビジネスの始め方、副業から起業への流れ、具体的な収益化方法など、何でも相談できます。' },
        { question: '勧誘されませんか？', answer: 'ご安心ください。相談のみのご利用も歓迎しています。無理な提案は一切いたしません。' },
      ],
    },
  };

  const copy = ctaMap[config.ctaType];
  return {
    ...copy,
    problemHeading: copy.problemHeading,
    problems: BASE_CONTENT.problems,
    benefitHeading: copy.benefitHeading,
    benefits: BASE_CONTENT.benefits,
  };
}

// HTMLテンプレート生成
function generateHTML(config, copy) {
  const styleColors = {
    energetic: { primary: '#dc2626', secondary: '#f97316', bg: '#fff7ed', accent: '#b91c1c' },
    professional: { primary: '#1e40af', secondary: '#3b82f6', bg: '#eff6ff', accent: '#1d4ed8' },
    warm: { primary: '#7c3aed', secondary: '#a78bfa', bg: '#faf5ff', accent: '#6d28d9' },
  };

  const colors = styleColors[config.style] || styleColors.energetic;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BASE_CONTENT.productName} - ${config.label}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif; background: #f9fafb; color: #1f2937; line-height: 1.8; }
    .header { background: #1f2937; color: #fff; text-align: center; padding: 20px; font-size: 18px; font-weight: bold; }
    .hero { background: linear-gradient(135deg, ${colors.bg}, #fff); padding: 60px 20px; text-align: center; border-bottom: 4px solid ${colors.primary}; }
    .hero h1 { font-size: clamp(22px, 4vw, 38px); color: #1f2937; line-height: 1.4; margin-bottom: 20px; }
    .hero h1 span { color: ${colors.primary}; }
    .hero p { font-size: clamp(16px, 2vw, 20px); color: #6b7280; margin-bottom: 30px; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .section { background: #fff; border-radius: 12px; padding: 40px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .section-title { font-size: 26px; font-weight: bold; color: ${colors.primary}; margin-bottom: 24px; text-align: center; border-bottom: 3px solid ${colors.primary}; padding-bottom: 12px; }
    .problems-list { list-style: none; }
    .problems-list li { padding: 12px 16px; margin: 8px 0; background: #fef2f2; border-left: 4px solid ${colors.primary}; border-radius: 4px; font-size: 16px; }
    .problems-list li::before { content: "✕ "; color: ${colors.primary}; font-weight: bold; }
    .benefits-list { list-style: none; }
    .benefits-list li { padding: 12px 16px; margin: 8px 0; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px; font-size: 16px; }
    .benefits-list li::before { content: "✓ "; color: #22c55e; font-weight: bold; }
    .target-box { background: ${colors.bg}; border: 2px solid ${colors.secondary}; border-radius: 8px; padding: 24px; text-align: center; font-size: 17px; }
    .cta-section { background: linear-gradient(135deg, ${colors.primary}, ${colors.accent}); color: #fff; border-radius: 12px; padding: 40px; text-align: center; }
    .cta-section h2 { font-size: 28px; margin-bottom: 16px; }
    .cta-section p { font-size: 16px; margin-bottom: 24px; opacity: 0.9; }
    .form-group { margin: 12px 0; }
    .form-input { width: 100%; max-width: 500px; padding: 14px 20px; border: none; border-radius: 8px; font-size: 16px; }
    .cta-button { display: inline-block; background: #22c55e; color: #fff; font-size: 20px; font-weight: bold; padding: 18px 48px; border-radius: 12px; border: none; cursor: pointer; margin-top: 16px; text-decoration: none; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: transform 0.2s; }
    .cta-button:hover { transform: translateY(-2px); }
    .cta-button.red { background: #dc2626; }
    .urgency-bar { background: #dc2626; color: #fff; text-align: center; padding: 20px; font-size: 18px; font-weight: bold; margin-top: 30px; border-radius: 8px; }
    .faq-section { }
    .faq-item { border: 1px solid #e5e7eb; border-radius: 8px; margin: 12px 0; overflow: hidden; }
    .faq-q { background: #f9fafb; padding: 16px 20px; font-weight: bold; font-size: 16px; color: #1f2937; }
    .faq-q::before { content: "Q. "; color: ${colors.primary}; }
    .faq-a { padding: 16px 20px; font-size: 15px; color: #4b5563; border-top: 1px solid #e5e7eb; }
    .faq-a::before { content: "A. "; color: #22c55e; font-weight: bold; }
    .footer { background: #1f2937; color: #9ca3af; text-align: center; padding: 30px 20px; margin-top: 40px; }
    .footer a { color: #6b7280; text-decoration: none; margin: 0 10px; }
    .badge { display: inline-block; background: ${colors.primary}; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 16px; }
    .meta-info { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px; font-size: 13px; color: #6b7280; }
    .meta-info strong { color: #374151; }
  </style>
</head>
<body>

  <div class="header">
    ${BASE_CONTENT.productName}
  </div>

  <div class="hero">
    <div class="badge">⚡ ${config.label}</div>
    <h1>${copy.headline.replace(/【(.+?)】/g, '<span>【$1】</span>')}</h1>
    <p>${copy.subheadline}</p>
  </div>

  <div class="container">

    <!-- 生成情報 -->
    <div class="meta-info">
      <strong>LP情報：</strong> ${config.label} &nbsp;|&nbsp;
      <strong>CTAタイプ：</strong> ${config.ctaType} &nbsp;|&nbsp;
      <strong>スタイル：</strong> ${config.style} &nbsp;|&nbsp;
      <strong>生成日：</strong> ${new Date().toLocaleDateString('ja-JP')} &nbsp;|&nbsp;
      <strong>対象：</strong> ${BASE_CONTENT.targetAudience}
    </div>

    <!-- 問題提起 -->
    <div class="section">
      <h2 class="section-title">${copy.problemHeading}</h2>
      <ul class="problems-list">
        ${copy.problems.map(p => `<li>${p}</li>`).join('\n        ')}
      </ul>
    </div>

    <!-- ベネフィット -->
    <div class="section">
      <h2 class="section-title">${copy.benefitHeading}</h2>
      <ul class="benefits-list">
        ${copy.benefits.map(b => `<li>${b}</li>`).join('\n        ')}
      </ul>
    </div>

    <!-- ターゲットメッセージ -->
    <div class="section">
      <div class="target-box">
        ${copy.targetMessage}
      </div>
    </div>

    <!-- CTA -->
    <div class="cta-section">
      <h2>${copy.ctaHeading}</h2>
      <p>${copy.ctaDescription}</p>
      ${config.ctaType === 'optin' ? `
      <div class="form-group">
        <input class="form-input" type="email" placeholder="メールアドレスを入力してください">
      </div>
      <button class="cta-button">${copy.ctaButtonText}</button>
      <p style="font-size:13px;opacity:0.8;margin-top:12px;">登録無料・いつでも解除可能</p>
      ` : config.ctaType === 'webinar' ? `
      <div class="form-group">
        <input class="form-input" type="text" placeholder="お名前" style="margin-bottom:8px;">
      </div>
      <div class="form-group">
        <input class="form-input" type="email" placeholder="メールアドレス">
      </div>
      <button class="cta-button">${copy.ctaButtonText}</button>
      <p style="font-size:13px;opacity:0.8;margin-top:12px;">参加費無料・強引な勧誘なし</p>
      ` : config.ctaType === 'contact' ? `
      <div class="form-group">
        <input class="form-input" type="text" placeholder="お名前" style="margin-bottom:8px;">
      </div>
      <div class="form-group">
        <input class="form-input" type="email" placeholder="メールアドレス" style="margin-bottom:8px;">
      </div>
      <div class="form-group">
        <input class="form-input" type="tel" placeholder="電話番号（任意）">
      </div>
      <button class="cta-button">${copy.ctaButtonText}</button>
      <p style="font-size:13px;opacity:0.8;margin-top:12px;">無料相談・勧誘なし</p>
      ` : `
      <button class="cta-button red">${copy.ctaButtonText}</button>
      <p style="font-size:13px;opacity:0.8;margin-top:12px;">30日間返金保証・今月末で特別価格終了</p>
      `}
    </div>

    <!-- 緊急性 -->
    <div class="urgency-bar">
      ${copy.urgencyHeading} — ${copy.urgencyText}
    </div>

    <!-- FAQ -->
    <div class="section" style="margin-top:30px;">
      <h2 class="section-title">よくある質問</h2>
      <div class="faq-section">
        ${copy.faq.map(f => `
        <div class="faq-item">
          <div class="faq-q">${f.question}</div>
          <div class="faq-a">${f.answer}</div>
        </div>`).join('')}
      </div>
    </div>

  </div>

  <div class="footer">
    <p>© ${new Date().getFullYear()} ${BASE_CONTENT.productName}. All rights reserved.</p>
    <p style="margin-top:8px;">
      <a href="#">プライバシーポリシー</a>
      <a href="#">特定商取引法に基づく表記</a>
    </p>
    <p style="margin-top:12px;font-size:12px;">このLPはMarketing Hub LPジェネレーターにより生成されました</p>
  </div>

</body>
</html>`;
}

// JSON構造（コンポーネント形式）も保存
function generateComponentsJSON(config, copy) {
  const components = [];
  let order = 0;

  const addComp = (componentType, category, props) => {
    components.push({ id: `comp_${order}`, componentType, category, order: order++, props });
  };

  // Header
  addComp('header', 'other', { logoText: BASE_CONTENT.productName, backgroundColor: '#1f2937', sticky: false });

  // Hero
  addComp('headline', 'headline', { text: copy.headline, fontSize: 36, fontSizeSp: 24, textColor: '#1f2937', textAlign: 'center', shadowStyle: 'none' });
  addComp('subhead', 'headline', { text: copy.subheadline, fontSize: 20, fontSizeSp: 16, textColor: '#6b7280', textAlign: 'center' });
  addComp('spacer', 'basic', { height: 40, heightSp: 20 });

  // Problems
  addComp('subhead', 'headline', { text: copy.problemHeading, fontSize: 28, fontSizeSp: 20, textColor: '#dc2626', textAlign: 'center' });
  addComp('bullet', 'content', { items: copy.problems.join('\n'), icon: 'arrow', iconColor: '#dc2626', fontSize: 16 });
  addComp('spacer', 'basic', { height: 40, heightSp: 20 });

  // Benefits
  addComp('subhead', 'headline', { text: copy.benefitHeading, fontSize: 28, fontSizeSp: 20, textColor: '#1f2937', textAlign: 'center' });
  addComp('bullet', 'content', { items: copy.benefits.join('\n'), icon: 'check', iconColor: '#22c55e', fontSize: 16 });
  addComp('spacer', 'basic', { height: 40, heightSp: 20 });

  // Target
  addComp('text', 'basic', { content: copy.targetMessage, fontSize: 18, fontSizeSp: 16, lineHeight: 1.8, textColor: '#374151', backgroundColor: '#f9fafb', textAlign: 'center' });
  addComp('spacer', 'basic', { height: 40, heightSp: 20 });

  // CTA
  addComp('subhead', 'headline', { text: copy.ctaHeading, fontSize: 28, fontSizeSp: 20, textColor: '#1f2937', textAlign: 'center' });
  addComp('text', 'basic', { content: copy.ctaDescription, fontSize: 16, fontSizeSp: 14, lineHeight: 1.6, textColor: '#6b7280', backgroundColor: 'transparent', textAlign: 'center' });

  if (config.ctaType === 'optin') {
    addComp('registration-form', 'form', { title: copy.ctaHeading, fields: 'email', buttonText: copy.ctaButtonText, buttonColor: '#22c55e', subText: '登録は無料です', redirectUrl: '' });
  } else if (config.ctaType === 'webinar') {
    addComp('registration-form', 'form', { title: copy.ctaHeading, fields: 'name_email', buttonText: copy.ctaButtonText, buttonColor: '#22c55e', subText: '参加は完全無料です', redirectUrl: '' });
  } else if (config.ctaType === 'contact') {
    addComp('custom-form', 'form', { title: copy.ctaHeading, fields: 'お名前|text\nメールアドレス|email\n電話番号|text\nご相談内容|textarea', buttonText: copy.ctaButtonText, buttonColor: '#7c3aed' });
  } else {
    addComp('button', 'button', { text: copy.ctaButtonText, subText: copy.ctaDescription, action: 'link', url: '', backgroundColor: '#dc2626', textColor: '#ffffff', fontSize: 20, width: 80, borderRadius: 8, animation: 'shine' });
  }
  addComp('spacer', 'basic', { height: 60, heightSp: 30 });

  // FAQ
  addComp('subhead', 'headline', { text: 'よくある質問', fontSize: 28, fontSizeSp: 20, textColor: '#1f2937', textAlign: 'center' });
  addComp('accordion', 'content', { items: copy.faq.map(f => `${f.question}|${f.answer}`).join('\n'), defaultOpen: true, iconColor: '#6b7280' });
  addComp('spacer', 'basic', { height: 40, heightSp: 20 });

  // Urgency
  addComp('headline', 'headline', { text: copy.urgencyHeading, fontSize: 28, fontSizeSp: 20, textColor: '#ffffff', textAlign: 'center', shadowStyle: 'none' });
  addComp('text', 'basic', { content: copy.urgencyText, fontSize: 16, fontSizeSp: 14, lineHeight: 1.6, textColor: '#fecaca', backgroundColor: '#dc2626', textAlign: 'center' });
  addComp('button', 'button', { text: copy.ctaButtonText, subText: '', action: 'scroll', url: '', backgroundColor: '#ffffff', textColor: '#dc2626', fontSize: 20, width: 60, borderRadius: 8, animation: 'shake' });
  addComp('spacer', 'basic', { height: 40, heightSp: 20 });

  // Footer
  addComp('footer', 'other', { copyright: `© ${new Date().getFullYear()} ${BASE_CONTENT.productName}. All rights reserved.`, links: 'プライバシーポリシー\n特定商取引法に基づく表記', backgroundColor: '#1f2937', textColor: '#ffffff' });

  return {
    success: true,
    lpId: config.id,
    label: config.label,
    generatedAt: new Date().toISOString(),
    parsedAnswers: {
      ...BASE_CONTENT,
      ctaType: config.ctaType,
      style: config.style,
    },
    components,
    usedAI: false,
    copySource: 'template',
    message: 'テンプレートベースでLPを生成しました（ローカル生成）',
  };
}

// メイン実行
function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`\n📁 保存先: ${OUTPUT_DIR}\n`);

  const summary = [];

  for (const config of LP_CONFIGS) {
    console.log(`⚙️  生成中: ${config.label}`);
    const copy = generateCopy(config);

    // HTML保存
    const htmlContent = generateHTML(config, copy);
    const htmlPath = path.join(OUTPUT_DIR, `${config.id}.html`);
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');

    // JSON保存
    const jsonData = generateComponentsJSON(config, copy);
    const jsonPath = path.join(OUTPUT_DIR, `${config.id}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8');

    console.log(`   ✅ HTML: ${config.id}.html`);
    console.log(`   ✅ JSON: ${config.id}.json`);

    summary.push({
      id: config.id,
      label: config.label,
      ctaType: config.ctaType,
      style: config.style,
      headline: copy.headline.slice(0, 60) + '...',
      htmlFile: `${config.id}.html`,
      jsonFile: `${config.id}.json`,
    });
  }

  // サマリーファイル保存
  const summaryPath = path.join(OUTPUT_DIR, 'README.md');
  const summaryContent = `# マーケティングハブ LP保存

**商品名:** ${BASE_CONTENT.productName}
**生成日:** ${new Date().toLocaleString('ja-JP')}
**ターゲット:** ${BASE_CONTENT.targetAudience}

## 生成されたLP一覧

| # | ID | LP種類 | CTAタイプ | スタイル |
|---|-----|--------|----------|---------|
${summary.map((s, i) => `| ${i+1} | ${s.id} | ${s.label} | ${s.ctaType} | ${s.style} |`).join('\n')}

## ファイル構成

\`\`\`
マーケティングハブLP保存/
├── README.md                 ← このファイル
├── lp1-webinar.html          ← ウェビナー登録LP（HTMLプレビュー）
├── lp1-webinar.json          ← ウェビナー登録LP（コンポーネントJSON）
├── lp2-optin.html            ← オプトインLP（HTMLプレビュー）
├── lp2-optin.json            ← オプトインLP（コンポーネントJSON）
├── lp3-purchase.html         ← 購入LP（HTMLプレビュー）
├── lp3-purchase.json         ← 購入LP（コンポーネントJSON）
├── lp4-contact.html          ← 問い合わせLP（HTMLプレビュー）
└── lp4-contact.json          ← 問い合わせLP（コンポーネントJSON）
\`\`\`

## 各LP概要

### LP1 - ウェビナー登録
- **CTA:** ウェビナー無料参加登録
- **対象:** AIビジネスに興味があり行動できていない人
- **訴求:** 無料セミナーで「第二次AIバブルで稼ぐ方法」を公開

### LP2 - オプトイン（無料レポート）
- **CTA:** 無料PDFレポートのダウンロード
- **対象:** AIで稼ぐ方法を知りたいが一歩踏み出せない人
- **訴求:** 「AIで月収20万円を作った6つの秘密」を無料公開

### LP3 - 購入（AI副業コース）
- **CTA:** AI副業マスタープログラム申し込み
- **対象:** 本気でAIビジネスを始めたい人
- **訴求:** 受講者92%が3ヶ月以内に月収20万円突破

### LP4 - 問い合わせ（無料相談）
- **CTA:** 60分無料個別相談の申し込み
- **対象:** 自分に合ったAIビジネス戦略を知りたい人
- **訴求:** 専門家があなただけのロードマップを作成

## JSONフォーマットについて

各JSONファイルはMarketing HubのLPビルダーが使用するコンポーネント形式です。
\`components\`配列をFunnelPageのデータとして直接インポートできます。
`;
  fs.writeFileSync(summaryPath, summaryContent, 'utf-8');
  console.log(`\n📋 README: README.md`);

  console.log('\n🎉 4つのLPが正常に生成されました！\n');
  console.log('📂 フォルダを開く:');
  console.log(`   open "${OUTPUT_DIR}"\n`);
}

main();
