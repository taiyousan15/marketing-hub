/**
 * LP テンプレート定義
 * UTAGE互換 - 新カテゴリ対応
 */

import { LPTemplate, ComponentInstance } from '../../../types';

/**
 * オプトインテンプレート - シンプル
 */
const optinSimple: LPTemplate = {
  id: 'optin-simple',
  name: 'シンプルオプトイン',
  description: 'メールアドレス収集に最適なシンプルなオプトインLP',
  category: 'optin',
  thumbnail: '/templates/optin-simple.png',
  tags: ['シンプル', 'メルマガ', 'リード獲得'],
  popularity: 95,
  components: [
    {
      id: 'header-1',
      componentType: 'header',
      category: 'other',
      order: 0,
      props: {
        logoText: 'ブランド名',
        backgroundColor: '#ffffff',
      },
    },
    {
      id: 'headline-1',
      componentType: 'headline',
      category: 'headline',
      order: 1,
      props: {
        text: '無料プレゼント！7日間で学ぶ成功の秘訣',
        fontSize: 36,
        fontSizeSp: 24,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      id: 'subhead-1',
      componentType: 'subhead',
      category: 'headline',
      order: 2,
      props: {
        text: '今すぐ登録して、プロが実践する7つのノウハウを手に入れよう',
        fontSize: 20,
        fontSizeSp: 16,
        textColor: '#4b5563',
        textAlign: 'center',
      },
    },
    {
      id: 'spacer-1',
      componentType: 'spacer',
      category: 'basic',
      order: 3,
      props: {
        height: 40,
        heightSp: 20,
      },
    },
    {
      id: 'bullet-1',
      componentType: 'bullet',
      category: 'content',
      order: 4,
      props: {
        items: '何から始めていいかわからない\n時間がなくて学習が進まない\n独学では成果が出ない',
        icon: 'check',
        iconColor: '#22c55e',
      },
    },
    {
      id: 'form-1',
      componentType: 'registration-form',
      category: 'form',
      order: 5,
      props: {
        title: '今すぐ無料で登録',
        fields: 'email',
        buttonText: '無料で受け取る',
        buttonColor: '#22c55e',
        subText: '登録は無料です',
      },
    },
    {
      id: 'footer-1',
      componentType: 'footer',
      category: 'other',
      order: 6,
      props: {
        copyright: '© 2026 Your Company. All rights reserved.',
        links: 'プライバシーポリシー\n特定商取引法に基づく表記',
      },
    },
  ],
};

/**
 * オプトインテンプレート - LINE友だち追加
 */
const optinLine: LPTemplate = {
  id: 'optin-line',
  name: 'LINE友だち追加',
  description: 'LINE公式アカウントへの友だち追加を促すLP',
  category: 'optin',
  thumbnail: '/templates/optin-line.png',
  tags: ['LINE', '友だち追加', '無料'],
  popularity: 92,
  components: [
    {
      id: 'headline-1',
      componentType: 'headline',
      category: 'headline',
      order: 0,
      props: {
        text: 'LINE登録で豪華特典プレゼント！',
        fontSize: 32,
        fontSizeSp: 22,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      id: 'image-1',
      componentType: 'image',
      category: 'basic',
      order: 1,
      props: {
        src: '',
        alt: '特典イメージ',
        width: 80,
      },
    },
    {
      id: 'bullet-1',
      componentType: 'bullet',
      category: 'content',
      order: 2,
      props: {
        items: '限定PDF（100ページ）\n動画講座（3時間分）\n無料相談チケット',
        icon: 'star',
        iconColor: '#f59e0b',
      },
    },
    {
      id: 'line-button-1',
      componentType: 'line-add-button',
      category: 'line',
      order: 3,
      props: {
        lineId: '@xxxxx',
        buttonText: 'LINEで友だち追加',
        subText: '無料特典をプレゼント！',
        size: 'large',
      },
    },
    {
      id: 'line-qr-1',
      componentType: 'line-qr',
      category: 'line',
      order: 4,
      props: {
        lineId: '@xxxxx',
        size: 200,
        caption: 'スマホでスキャンして友だち追加',
      },
    },
    {
      id: 'footer-1',
      componentType: 'footer',
      category: 'other',
      order: 5,
      props: {
        copyright: '© 2026 Your Company. All rights reserved.',
        links: 'プライバシーポリシー',
      },
    },
  ],
};

/**
 * オプトインテンプレート - 動画付き
 */
const optinVideo: LPTemplate = {
  id: 'optin-video',
  name: '動画オプトイン',
  description: '動画で訴求力を高めるオプトインLP',
  category: 'optin',
  thumbnail: '/templates/optin-video.png',
  tags: ['動画', 'ウェビナー', '無料講座'],
  popularity: 85,
  components: [
    {
      id: 'header-1',
      componentType: 'header',
      category: 'other',
      order: 0,
      props: {
        logoText: 'Video Academy',
        backgroundColor: '#ffffff',
      },
    },
    {
      id: 'headline-1',
      componentType: 'headline',
      category: 'headline',
      order: 1,
      props: {
        text: '90分で学ぶ完全攻略セミナー',
        fontSize: 32,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      id: 'video-1',
      componentType: 'video',
      category: 'basic',
      order: 2,
      props: {
        videoUrl: '',
        autoplay: false,
        controls: true,
        aspectRatio: '16:9',
      },
    },
    {
      id: 'form-1',
      componentType: 'registration-form',
      category: 'form',
      order: 3,
      props: {
        title: '無料登録して今すぐ視聴',
        fields: 'name_email',
        buttonText: '今すぐ視聴する',
        buttonColor: '#3b82f6',
      },
    },
    {
      id: 'footer-1',
      componentType: 'footer',
      category: 'other',
      order: 4,
      props: {
        copyright: '© 2026 Video Academy. All rights reserved.',
        links: 'プライバシーポリシー',
      },
    },
  ],
};

/**
 * セールステンプレート - スタンダード
 */
const salesStandard: LPTemplate = {
  id: 'sales-standard',
  name: 'スタンダードセールス',
  description: '商品販売に最適なスタンダードなセールスLP',
  category: 'sales',
  thumbnail: '/templates/sales-standard.png',
  tags: ['商品販売', 'デジタル商品', 'オンライン講座'],
  popularity: 92,
  components: [
    {
      id: 'header-1',
      componentType: 'header',
      category: 'other',
      order: 0,
      props: {
        logoText: 'Product Brand',
        backgroundColor: '#ffffff',
      },
    },
    {
      id: 'headline-1',
      componentType: 'headline',
      category: 'headline',
      order: 1,
      props: {
        text: '30日で結果を出す完全マスターコース',
        fontSize: 36,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      id: 'subhead-1',
      componentType: 'subhead',
      category: 'headline',
      order: 2,
      props: {
        text: '初心者でも安心。ステップバイステップで学べます。',
        fontSize: 20,
        textColor: '#4b5563',
        textAlign: 'center',
      },
    },
    {
      id: 'image-text-1',
      componentType: 'image-text',
      category: 'content',
      order: 3,
      props: {
        title: 'こんな悩みを解決',
        text: '独学では限界を感じる\n情報が多すぎて何を学べばいいかわからない\n実践的なスキルが身につかない',
        imagePosition: 'left',
        imageWidth: 40,
      },
    },
    {
      id: 'bullet-1',
      componentType: 'bullet',
      category: 'content',
      order: 4,
      props: {
        items: '動画で体系的に学習\n課題で手を動かす\n専門家がアドバイス',
        icon: 'check',
        iconColor: '#22c55e',
      },
    },
    {
      id: 'speech-bubble-1',
      componentType: 'speech-bubble',
      category: 'content',
      order: 5,
      props: {
        text: '1ヶ月で収益化できました！本当に感謝しています。',
        name: '山田太郎',
        position: 'left',
        backgroundColor: '#f3f4f6',
      },
    },
    {
      id: 'table-1',
      componentType: 'table',
      category: 'content',
      order: 6,
      props: {
        data: 'プラン|価格|内容\nベーシック|¥29,800|動画講座\nスタンダード|¥49,800|動画講座+個別相談\nプレミアム|¥99,800|全サポート付き',
        headerBg: '#f3f4f6',
      },
    },
    {
      id: 'accordion-1',
      componentType: 'accordion',
      category: 'content',
      order: 7,
      props: {
        items: '返金保証はありますか？|はい、30日間の返金保証があります\n初心者でも大丈夫ですか？|はい、基礎から丁寧に解説します',
        defaultOpen: true,
      },
    },
    {
      id: 'button-1',
      componentType: 'button',
      category: 'button',
      order: 8,
      props: {
        text: '今すぐ申し込む',
        subText: '30日間返金保証付き',
        action: 'link',
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        animation: 'shine',
      },
    },
    {
      id: 'footer-1',
      componentType: 'footer',
      category: 'other',
      order: 9,
      props: {
        copyright: '© 2026 Product Brand. All rights reserved.',
        links: 'プライバシーポリシー\n特定商取引法に基づく表記',
      },
    },
  ],
};

/**
 * セールステンプレート - 限定オファー
 */
const salesLimitedOffer: LPTemplate = {
  id: 'sales-limited-offer',
  name: '限定オファー',
  description: '期間限定・数量限定の販売に最適なLP',
  category: 'sales',
  thumbnail: '/templates/sales-limited.png',
  tags: ['期間限定', '特別価格', '緊急性'],
  popularity: 82,
  components: [
    {
      id: 'countdown-1',
      componentType: 'countdown',
      category: 'other',
      order: 0,
      props: {
        title: '特別価格は残りわずか！',
        endDate: '2026-12-31 23:59:59',
        style: 'urgent',
        backgroundColor: '#dc2626',
      },
    },
    {
      id: 'headline-1',
      componentType: 'headline',
      category: 'headline',
      order: 1,
      props: {
        text: '今だけ特別価格！通常価格の50%OFF',
        fontSize: 36,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      id: 'subhead-1',
      componentType: 'subhead',
      category: 'headline',
      order: 2,
      props: {
        text: '年に一度の大セール。このチャンスを逃すと次は1年後です。',
        fontSize: 18,
        textColor: '#4b5563',
        textAlign: 'center',
      },
    },
    {
      id: 'progress-1',
      componentType: 'progress-bar',
      category: 'other',
      order: 3,
      props: {
        label: '残り枠',
        value: 27,
        max: 100,
        showPercentage: true,
        barColor: '#dc2626',
      },
    },
    {
      id: 'purchase-button-1',
      componentType: 'purchase-button',
      category: 'payment',
      order: 4,
      props: {
        text: '特別価格で購入する',
        price: '¥9,800 → ¥4,900',
        backgroundColor: '#dc2626',
        animation: 'shake',
      },
    },
    {
      id: 'footer-1',
      componentType: 'footer',
      category: 'other',
      order: 5,
      props: {
        copyright: '© 2026 Your Company. All rights reserved.',
        links: 'プライバシーポリシー',
      },
    },
  ],
};

/**
 * ウェビナーテンプレート - スタンダード
 */
const webinarStandard: LPTemplate = {
  id: 'webinar-standard',
  name: 'スタンダードウェビナー',
  description: 'オンラインセミナーの登録に最適なLP',
  category: 'webinar',
  thumbnail: '/templates/webinar-standard.png',
  tags: ['オンラインセミナー', '無料', '登録'],
  popularity: 90,
  components: [
    {
      id: 'header-1',
      componentType: 'header',
      category: 'other',
      order: 0,
      props: {
        logoText: 'Webinar',
        backgroundColor: '#ffffff',
      },
    },
    {
      id: 'headline-1',
      componentType: 'headline',
      category: 'headline',
      order: 1,
      props: {
        text: '【無料ウェビナー】成功者が語る3つの秘訣',
        fontSize: 32,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      id: 'subhead-1',
      componentType: 'subhead',
      category: 'headline',
      order: 2,
      props: {
        text: '○月○日（○）20:00〜21:30 オンライン開催',
        fontSize: 20,
        textColor: '#3b82f6',
        textAlign: 'center',
      },
    },
    {
      id: 'bullet-1',
      componentType: 'bullet',
      category: 'content',
      order: 3,
      props: {
        items: '成功への第一歩|何から始めるべきかがわかる\n時間管理術|忙しい人でも実践できる方法\n実践ワーク|その場で体験できる',
        icon: 'check',
        iconColor: '#22c55e',
      },
    },
    {
      id: 'event-form-1',
      componentType: 'event-form',
      category: 'other',
      order: 4,
      props: {
        title: '無料ウェビナー',
        date: '○月○日（○）20:00〜21:30',
        location: 'オンライン（Zoom）',
        buttonText: '無料で参加登録する',
        buttonColor: '#3b82f6',
      },
    },
    {
      id: 'footer-1',
      componentType: 'footer',
      category: 'other',
      order: 5,
      props: {
        copyright: '© 2026 Webinar. All rights reserved.',
        links: 'プライバシーポリシー',
      },
    },
  ],
};

/**
 * ウェビナーテンプレート - 自動ウェビナー
 */
const webinarAuto: LPTemplate = {
  id: 'webinar-auto',
  name: '自動ウェビナー',
  description: '24時間いつでも視聴可能な自動ウェビナーLP',
  category: 'webinar',
  thumbnail: '/templates/webinar-auto.png',
  tags: ['自動', 'オンデマンド', '24時間'],
  popularity: 88,
  components: [
    {
      id: 'headline-1',
      componentType: 'headline',
      category: 'headline',
      order: 0,
      props: {
        text: '今すぐ視聴できる無料ウェビナー',
        fontSize: 32,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      id: 'auto-webinar-1',
      componentType: 'auto-webinar',
      category: 'video',
      order: 1,
      props: {
        videoUrl: '',
        title: '成功の秘訣を大公開',
        scheduleType: 'ondemand',
        ctaText: '今すぐ視聴する',
      },
    },
    {
      id: 'form-1',
      componentType: 'registration-form',
      category: 'form',
      order: 2,
      props: {
        title: '視聴登録',
        fields: 'name_email',
        buttonText: '無料で視聴する',
        buttonColor: '#22c55e',
      },
    },
    {
      id: 'footer-1',
      componentType: 'footer',
      category: 'other',
      order: 3,
      props: {
        copyright: '© 2026 Your Company. All rights reserved.',
        links: 'プライバシーポリシー',
      },
    },
  ],
};

/**
 * プロダクトローンチテンプレート - ティーザー
 */
const launchTeaser: LPTemplate = {
  id: 'launch-teaser',
  name: 'ティーザーローンチ',
  description: '新商品発売前の期待を高めるティーザーLP',
  category: 'launch',
  thumbnail: '/templates/launch-teaser.png',
  tags: ['ローンチ', '事前登録', 'ティーザー'],
  popularity: 80,
  components: [
    {
      id: 'headline-1',
      componentType: 'headline',
      category: 'headline',
      order: 0,
      props: {
        text: 'Coming Soon...',
        fontSize: 48,
        textColor: '#1f2937',
        shadowStyle: 'gray',
        textAlign: 'center',
      },
    },
    {
      id: 'subhead-1',
      componentType: 'subhead',
      category: 'headline',
      order: 1,
      props: {
        text: '革新的な新サービスが間もなく登場',
        fontSize: 20,
        textColor: '#6b7280',
        textAlign: 'center',
      },
    },
    {
      id: 'countdown-1',
      componentType: 'countdown',
      category: 'other',
      order: 2,
      props: {
        title: '公開まであと',
        endDate: '2026-03-01 00:00:00',
        style: 'box',
        showDays: true,
      },
    },
    {
      id: 'form-1',
      componentType: 'registration-form',
      category: 'form',
      order: 3,
      props: {
        title: '事前登録で特典をゲット',
        fields: 'email',
        buttonText: '事前登録する',
        buttonColor: '#8b5cf6',
      },
    },
    {
      id: 'footer-1',
      componentType: 'footer',
      category: 'other',
      order: 4,
      props: {
        copyright: '© 2026 Your Company. All rights reserved.',
        links: 'プライバシーポリシー',
      },
    },
  ],
};

/**
 * プロダクトローンチテンプレート - 本格ローンチ
 */
const launchFull: LPTemplate = {
  id: 'launch-full',
  name: 'フルローンチ',
  description: 'プロダクトローンチの全要素を含むLP',
  category: 'launch',
  thumbnail: '/templates/launch-full.png',
  tags: ['ローンチ', '新商品', '販売'],
  popularity: 85,
  components: [
    {
      id: 'countdown-1',
      componentType: 'countdown',
      category: 'other',
      order: 0,
      props: {
        title: 'ローンチ特別価格は残りわずか！',
        endDate: '2026-03-01 23:59:59',
        style: 'urgent',
        backgroundColor: '#dc2626',
      },
    },
    {
      id: 'headline-1',
      componentType: 'headline',
      category: 'headline',
      order: 1,
      props: {
        text: 'ついに解禁！待望の新サービス',
        fontSize: 36,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      id: 'video-1',
      componentType: 'video',
      category: 'basic',
      order: 2,
      props: {
        videoUrl: '',
        autoplay: false,
        controls: true,
        aspectRatio: '16:9',
      },
    },
    {
      id: 'bullet-1',
      componentType: 'bullet',
      category: 'content',
      order: 3,
      props: {
        items: '時短90%を実現\n成果3倍アップ\nコスト1/10に削減',
        icon: 'check',
        iconColor: '#22c55e',
      },
    },
    {
      id: 'speech-bubble-1',
      componentType: 'speech-bubble',
      category: 'content',
      order: 4,
      props: {
        text: '期待以上でした！これは革命的です。',
        name: '先行モニター',
        position: 'left',
      },
    },
    {
      id: 'payment-form-1',
      componentType: 'payment-form',
      category: 'payment',
      order: 5,
      props: {
        productName: 'ローンチ特別パッケージ',
        price: 49800,
        currency: 'JPY',
        buttonText: 'ローンチ特価で購入',
        buttonColor: '#dc2626',
      },
    },
    {
      id: 'accordion-1',
      componentType: 'accordion',
      category: 'content',
      order: 6,
      props: {
        items: 'ローンチ価格はいつまで？|○月○日までの限定価格です\n返金保証はありますか？|30日間の返金保証があります',
        defaultOpen: true,
      },
    },
    {
      id: 'footer-1',
      componentType: 'footer',
      category: 'other',
      order: 7,
      props: {
        copyright: '© 2026 Your Company. All rights reserved.',
        links: 'プライバシーポリシー\n特定商取引法に基づく表記',
      },
    },
  ],
};

/**
 * 全テンプレートをエクスポート
 */
export const LP_TEMPLATES: LPTemplate[] = [
  optinSimple,
  optinLine,
  optinVideo,
  salesStandard,
  salesLimitedOffer,
  webinarStandard,
  webinarAuto,
  launchTeaser,
  launchFull,
];

export default LP_TEMPLATES;
