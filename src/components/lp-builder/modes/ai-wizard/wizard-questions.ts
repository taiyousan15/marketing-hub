/**
 * AIウィザード 質問定義
 * 5ステップでLP生成に必要な情報を収集
 */

import { WizardAnswers } from '../../types';

export interface WizardQuestionConfig {
  key: keyof WizardAnswers;
  question: string;
  helpText?: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'multiline' | 'select';
  required: boolean;
  examples?: string[];
  options?: Array<{ label: string; value: string }>;
}

export const WIZARD_QUESTIONS: WizardQuestionConfig[] = [
  {
    key: 'productName',
    question: 'あなたの商品・サービスの名前を教えてください',
    helpText: '商品名やサービス名、講座名などを入力してください',
    placeholder: '例: 英語コーチングプログラム',
    type: 'text',
    required: true,
    examples: [
      'オンライン英会話講座',
      'ダイエットプログラム',
      'ビジネススキル講座',
      '投資入門コース',
    ],
  },
  {
    key: 'targetAudience',
    question: 'ターゲットとなるお客様はどんな人ですか？',
    helpText: '年齢、職業、悩み、状況など、具体的に教えてください',
    placeholder: '例: 30〜40代のビジネスパーソンで、英語力を上げたいが時間がない人',
    type: 'textarea',
    required: true,
    examples: [
      '20代の新社会人',
      '子育て中の主婦',
      '副業を始めたい会社員',
      '経営者・起業家',
    ],
  },
  {
    key: 'problems',
    question: 'お客様が抱えている悩み・問題を3つ教えてください',
    helpText: '1行に1つずつ入力してください。お客様の視点で書くと効果的です。',
    placeholder:
      '独学では続かない\n忙しくて学習時間が取れない\n実践的なスキルが身につかない',
    type: 'multiline',
    required: true,
    examples: [
      '成果が出ない',
      '時間がない',
      '何から始めればいいかわからない',
    ],
  },
  {
    key: 'benefits',
    question: 'あなたの商品で得られるベネフィットを3つ教えてください',
    helpText: '機能ではなく、お客様が得られる「結果」や「変化」を書いてください',
    placeholder:
      '3ヶ月で英会話ができるようになる\n1日15分の学習で効果が出る\nネイティブのような発音が身につく',
    type: 'multiline',
    required: true,
    examples: [
      '収入がアップする',
      '時間が自由になる',
      '自信がつく',
    ],
  },
  {
    key: 'ctaType',
    question: 'LPのゴール（行動喚起）は何ですか？',
    helpText: 'お客様にどんな行動を取ってほしいですか？',
    placeholder: '',
    type: 'select',
    required: true,
    options: [
      { label: '無料プレゼント（メールアドレス登録）', value: 'optin' },
      { label: '商品購入', value: 'purchase' },
      { label: 'お問い合わせ・無料相談', value: 'contact' },
      { label: 'ウェビナー・セミナー登録', value: 'webinar' },
    ],
  },
];

export default WIZARD_QUESTIONS;
