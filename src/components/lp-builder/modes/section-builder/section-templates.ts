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

/** セクション種別ごとの画像アスペクト比 */
export function getSectionAspectRatio(type: LPSectionType): '16:9' | '1:1' {
  switch (type) {
    case 'hero':
    case 'header':
    case 'cta':
    case 'footer':
      return '16:9';
    default:
      return '1:1';
  }
}

/** セクション種別ごとの画像コンセプト（英語・NO TEXT強制） */
export function buildSectionImageConcept(type: LPSectionType, industry?: string): string {
  const industryHint = industry ? `${industry} industry, ` : '';
  const noText = 'NO text overlay, NO words, NO letters, NO Japanese characters, NO typography, pure illustration only';

  const concepts: Record<LPSectionType, string> = {
    header: `${industryHint}minimal brand header illustration, clean professional logo area, ${noText}`,
    hero: `${industryHint}inspiring hero section illustration, powerful aspirational visual, main product concept, ${noText}`,
    problem: `${industryHint}person facing a challenge or problem, empathy illustration, relatable struggle concept, ${noText}`,
    benefit: `${industryHint}success achievement transformation illustration, positive outcome, aspirational lifestyle, ${noText}`,
    testimonial: `${industryHint}happy satisfied person, trust and credibility illustration, social proof concept, ${noText}`,
    cta: `${industryHint}action energy call-to-action illustration, motivational moment, decision point concept, ${noText}`,
    faq: `${industryHint}question answer concept illustration, helpful guidance, FAQ section visual, ${noText}`,
    footer: `${industryHint}minimal footer background illustration, subtle brand visual, ${noText}`,
  };

  return concepts[type];
}
