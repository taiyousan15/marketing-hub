/**
 * セクションビルダー — LP種類別セクション定義
 */

import { nanoid } from 'nanoid';
import { LPSectionType, SectionBuilderLPType, SectionBuilderSection } from '../../types';

interface SectionDef {
  type: LPSectionType;
  name: string;
  description: string;
  contentPlaceholder: string;
}

const OPTIN_SECTIONS: SectionDef[] = [
  {
    type: 'header',
    name: 'ヘッダー',
    description: 'ロゴや信頼性を示す一言',
    contentPlaceholder: '例: ○○コーチングスクール公式サイト',
  },
  {
    type: 'hero',
    name: 'ヒーロー（メインビジュアル）',
    description: 'メインキャッチコピーと無料プレゼントの内容',
    contentPlaceholder: '例: 「3ヶ月で英語が話せるようになった秘密」を無料公開\n英語コーチングの現役プロが教える、独学で挫折した人のための学習法',
  },
  {
    type: 'problem',
    name: '悩み・問題提起',
    description: 'ターゲットの悩みを3〜5つ列挙',
    contentPlaceholder: '例:\n・独学では続かない\n・忙しくて学習時間が取れない\n・英会話スクールに通っても話せない\n・正しい学習法がわからない',
  },
  {
    type: 'benefit',
    name: 'ベネフィット（無料特典内容）',
    description: '無料プレゼントで得られる価値',
    contentPlaceholder: '例: この無料PDFを受け取ると...\n・1日15分で英語力が上がる学習ルーティンがわかる\n・ネイティブが実際に使う表現集（厳選50フレーズ）\n・3ヶ月で成果を出した受講生の体験談',
  },
  {
    type: 'cta',
    name: '登録フォーム',
    description: 'ボタンテキストと登録後の案内',
    contentPlaceholder: '例: 今すぐ無料で受け取る\n※登録は30秒で完了。いつでも解除できます。',
  },
  {
    type: 'footer',
    name: 'フッター',
    description: '会社名・プライバシーポリシー等',
    contentPlaceholder: '例: © 2025 英語コーチングスクール. All rights reserved.',
  },
];

const SALES_SECTIONS: SectionDef[] = [
  {
    type: 'header',
    name: 'ヘッダー',
    description: 'ロゴや信頼性を示す一言',
    contentPlaceholder: '例: ○○プログラム公式サイト',
  },
  {
    type: 'hero',
    name: 'ヒーロー（メインビジュアル）',
    description: 'メインキャッチコピーと商品の核心価値',
    contentPlaceholder: '例: 「たった90日で月収100万円を達成した」\n副業未経験者が使う再現性の高いビジネス構築メソッド',
  },
  {
    type: 'problem',
    name: '悩み・問題提起',
    description: 'ターゲットが抱える問題を具体的に',
    contentPlaceholder: '例:\n・副業を始めたいが何から手をつけていいかわからない\n・時間を売るだけのバイトは嫌\n・継続的な収入が欲しい',
  },
  {
    type: 'benefit',
    name: 'ベネフィット（商品価値）',
    description: '購入で得られる変化・成果',
    contentPlaceholder: '例:\n・自分の好きな時間に働ける仕組みが作れる\n・月30万円の安定収入を実現\n・完全サポート付きで安心',
  },
  {
    type: 'testimonial',
    name: 'お客様の声・実績',
    description: '購入者の成功事例・ビフォーアフター',
    contentPlaceholder: '例: 田中様（30代・会社員）\n「半信半疑でしたが3ヶ月で月20万を達成。今では本業を辞める目処が立ちました」',
  },
  {
    type: 'cta',
    name: '購入・申込',
    description: '価格・ボタン・保証情報',
    contentPlaceholder: '例: 特別価格 ¥98,000（通常¥198,000）\n今すぐ申し込む\n30日間全額返金保証付き',
  },
  {
    type: 'faq',
    name: 'よくある質問',
    description: '購入前の不安・疑問を解消',
    contentPlaceholder: '例:\nQ: 初心者でも大丈夫ですか？\nA: はい、0から始められます\nQ: いつから学習できますか？\nA: 購入直後からアクセス可能です',
  },
  {
    type: 'footer',
    name: 'フッター',
    description: '会社名・特商法表記等',
    contentPlaceholder: '例: © 2025 株式会社○○. All rights reserved.',
  },
];

const WEBINAR_SECTIONS: SectionDef[] = [
  {
    type: 'header',
    name: 'ヘッダー',
    description: 'ウェビナータイトルと開催日時',
    contentPlaceholder: '例: 無料オンラインセミナー 2025年3月15日(土) 20:00〜',
  },
  {
    type: 'hero',
    name: 'ウェビナー概要',
    description: 'テーマ・キャッチコピー・対象者',
    contentPlaceholder: '例: 【無料】英語力を最短3ヶ月で伸ばす方法\n仕事で使える英語が話せるようになりたい方のための無料セミナー',
  },
  {
    type: 'problem',
    name: '対象者・悩み',
    description: 'こんな方におすすめ（悩みの共感）',
    contentPlaceholder: '例: こんな悩みを持つ方に特におすすめ:\n・英語を勉強したのに全然話せない\n・海外のビジネスパートナーと会話できない',
  },
  {
    type: 'benefit',
    name: '参加メリット・学べる内容',
    description: '参加することで得られる3つの学び',
    contentPlaceholder: '例: このセミナーで学べること:\n① なぜ従来の英語学習は失敗するのか（本質的な理由）\n② 実際に成果を出した受講生が実践した学習ルーティン\n③ 今日から実践できる英語脳の作り方',
  },
  {
    type: 'testimonial',
    name: '講師プロフィール',
    description: '登壇者の経歴・実績・信頼性',
    contentPlaceholder: '例: 講師: 山田太郎\n元TOEIC985点講師。15年以上の指導実績。受講生5000名以上。著書「英語が話せる脳の作り方」。',
  },
  {
    type: 'cta',
    name: '参加申込フォーム',
    description: 'ボタンテキストと参加者特典',
    contentPlaceholder: '例: 今すぐ無料で参加登録する\n参加者特典: 「英語フレーズ集100選」PDF プレゼント',
  },
  {
    type: 'footer',
    name: 'フッター',
    description: '会社情報・免責事項',
    contentPlaceholder: '例: © 2025 英語コーチングスクール. All rights reserved.',
  },
];

const SECTION_MAP: Record<SectionBuilderLPType, SectionDef[]> = {
  optin: OPTIN_SECTIONS,
  sales: SALES_SECTIONS,
  webinar: WEBINAR_SECTIONS,
};

export const LP_TYPE_LABELS: Record<SectionBuilderLPType, string> = {
  optin: 'オプトイン（無料プレゼント登録）',
  sales: 'セールス（商品購入）',
  webinar: 'ウェビナー（無料セミナー登録）',
};

export const LP_TYPE_DESCRIPTIONS: Record<SectionBuilderLPType, string> = {
  optin: 'メールアドレスを集める無料プレゼントLP',
  sales: '商品・サービスを販売するセールスLP',
  webinar: 'オンラインセミナーへの集客LP',
};

/** LP種類からセクション定義を生成する */
export function createSectionsFromTemplate(lpType: SectionBuilderLPType): SectionBuilderSection[] {
  const defs = SECTION_MAP[lpType];
  return defs.map((def) => ({
    id: nanoid(),
    type: def.type,
    name: def.name,
    description: def.description,
    content: '',
    imageUrl: null,
    imagePrompt: '',
    referenceImageBase64: null,
    referenceImageName: null,
    status: 'pending' as const,
  }));
}

/**
 * セクション種別ごとのデフォルトアスペクト比
 * UTAGE LP Builder 推奨: 横幅 1000〜1200px → 16:9 横型がデフォルト
 * ユーザーはセクションエディターで変更可能
 */
export function getSectionAspectRatio(type: LPSectionType): '16:9' | '4:3' | '1:1' | '9:16' {
  switch (type) {
    case 'header':
    case 'hero':
    case 'cta':
    case 'footer':
      return '16:9';
    default:
      return '16:9';
  }
}

/**
 * LP Designer Pro Type A-H テンプレートに準拠したセクション画像コンセプト
 *
 * UTAGE LP Builder 仕様:
 * - サイズ: 1400×2506px (9:16縦型)
 * - 中央セーフゾーン: 幅750〜900px 中央配置
 * - テキストは画像内に正確に描画する（NO TEXT 禁止）
 * - 日本語テキストは読みやすいフォントで画像内に配置
 * - モバイル可読サイズ: ヘッドライン 60-80px 相当
 */
export function buildSectionImageConcept(type: LPSectionType, industry?: string): string {
  const industryHint = industry ? `${industry} industry, ` : '';
  const utageSpec = [
    'vertical 9:16 portrait format optimized for smartphone',
    'center safe zone 750-900px wide',
    'UTAGE LP Builder compatible layout',
    'Japanese text rendered accurately and legibly in image',
    'professional marketing landing page design',
  ].join(', ');
  const quality = 'ultra-detailed, premium digital illustration or professional design, high-converting landing page quality';

  const concepts: Record<LPSectionType, string> = {
    /**
     * Type G: ヘッダー
     * ロゴ・ブランド名・信頼性キャッチフレーズを上部に配置
     */
    header: [
      `${industryHint}LP Designer Pro Type G header section,`,
      `clean minimal header design with brand logo area at top,`,
      `brand name in bold Japanese typography prominently displayed,`,
      `one-line trust statement or tagline rendered in clean font,`,
      `horizontal divider line, subtle gradient background,`,
      `text clearly readable: brand name large, subtitle small,`,
      quality, utageSpec,
    ].join(' '),

    /**
     * Type A: ヒーロー（メインビジュアル）
     * 大見出し＋サブ見出し＋視覚的インパクト画像
     */
    hero: [
      `${industryHint}LP Designer Pro Type A hero section,`,
      `dramatic full-bleed hero image with aspirational lifestyle photography,`,
      `large bold Japanese headline text overlaid at center — main catch copy in white or contrasting color,`,
      `sub-headline text below in smaller Japanese font,`,
      `strong visual: confident person achieving success or transformation,`,
      `warm golden-hour or studio dramatic lighting, cinematic composition,`,
      `text hierarchy: BIG headline → medium sub-headline, both clearly legible,`,
      quality, utageSpec,
    ].join(' '),

    /**
     * Type B: 問題提起
     * ターゲットの悩みを共感しながら列挙するセクション
     */
    problem: [
      `${industryHint}LP Designer Pro Type B problem section,`,
      `empathy-driven design with muted desaturated color palette,`,
      `section title in Japanese "こんなお悩みはありませんか？" at top in bold,`,
      `list of 3-5 pain points displayed as Japanese text bullet items with check or X icons,`,
      `subtle stressed or overwhelmed person illustration in background,`,
      `each pain point text clearly readable in clean Japanese font,`,
      `emotional resonance through typography and soft moody lighting,`,
      quality, utageSpec,
    ].join(' '),

    /**
     * Type C: ベネフィット
     * 解決後の明るい未来像と得られる価値の列挙
     */
    benefit: [
      `${industryHint}LP Designer Pro Type C benefit section,`,
      `bright vibrant transformation design with uplifting colors,`,
      `section title in Japanese "こんな未来が手に入ります" at top in bold,`,
      `3-4 benefit items displayed as cards or list with Japanese text + icon pairs,`,
      `each benefit card shows: icon → short Japanese benefit headline → brief description,`,
      `aspirational imagery: person celebrating, sunlight, success symbols,`,
      `text clearly readable with high contrast on light/gradient background,`,
      quality, utageSpec,
    ].join(' '),

    /**
     * Type D: お客様の声・実績
     * 信頼性・社会的証明を示すセクション
     */
    testimonial: [
      `${industryHint}LP Designer Pro Type D testimonial section,`,
      `trust-building layout with warm approachable design,`,
      `section title in Japanese "受講生の声" or "実績・証拠" at top in bold,`,
      `testimonial card with: circular avatar photo, Japanese name and title, star rating,`,
      `quoted testimonial text in Japanese displayed in speech bubble or quote block,`,
      `achievement numbers rendered prominently: 数字 + 単位 in large bold type,`,
      `authentic candid portrait photography for avatar, soft natural lighting,`,
      quality, utageSpec,
    ].join(' '),

    /**
     * Type E: CTA（行動喚起）
     * 申込・登録ボタンと緊急性・特典を示すセクション
     */
    cta: [
      `${industryHint}LP Designer Pro Type E CTA section,`,
      `high-energy call-to-action design with bold accent colors,`,
      `section title or price displayed prominently in Japanese,`,
      `large prominent CTA button with Japanese action text (例: 今すぐ登録する, 無料で受け取る),`,
      `urgency element: 期間限定 or 残り○名 text clearly visible,`,
      `guarantee badge or security seal with Japanese trust text,`,
      `strong directional composition pointing toward the button,`,
      `vibrant green or orange accent for button, high contrast for maximum conversion,`,
      quality, utageSpec,
    ].join(' '),

    /**
     * Type F: FAQ
     * よくある質問と安心感を提供するセクション
     */
    faq: [
      `${industryHint}LP Designer Pro Type F FAQ section,`,
      `clean friendly layout with light approachable color scheme,`,
      `section title "よくある質問" in Japanese at top in bold,`,
      `2-3 FAQ items displayed as accordion-style cards with:`,
      `"Q." prefix in accent color + Japanese question text in bold,`,
      `"A." prefix + Japanese answer text in regular weight below,`,
      `subtle question-mark icon or bubble motif in background,`,
      `high legibility: clear Japanese typography on white or light gray background,`,
      quality, utageSpec,
    ].join(' '),

    /**
     * Type H: フッター
     * 著作権・会社情報・リンクを含むクロージングセクション
     */
    footer: [
      `${industryHint}LP Designer Pro Type H footer section,`,
      `elegant minimal footer with subtle dark gradient or deep color,`,
      `company name or brand in Japanese displayed prominently,`,
      `small Japanese text links: プライバシーポリシー, 特定商取引法, お問い合わせ,`,
      `copyright notice "© 2025 ○○" in small Japanese text at bottom,`,
      `clean horizontal layout with proper text hierarchy,`,
      `understated sophisticated aesthetic with text clearly readable,`,
      quality, utageSpec,
    ].join(' '),
  };

  return concepts[type];
}
