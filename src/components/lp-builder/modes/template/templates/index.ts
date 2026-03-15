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
 * アフィリエイト募集LPテンプレート
 */
const affiliateRecruit: LPTemplate = {
  id: 'affiliate-recruit',
  name: 'アフィリエイト募集LP',
  description: 'パートナー・アフィリエイター募集に最適なLP',
  category: 'optin',
  thumbnail: '/templates/affiliate-recruit.png',
  tags: ['アフィリエイト', 'パートナー募集', '収益化'],
  popularity: 80,
  components: [
    {
      id: 'aff-header-1',
      componentType: 'header',
      category: 'other',
      order: 0,
      props: {
        logoText: 'パートナープログラム',
        backgroundColor: '#1e40af',
      },
    },
    {
      id: 'aff-headline-1',
      componentType: 'headline',
      category: 'headline',
      order: 1,
      props: {
        text: 'パートナーとして収益化しませんか？',
        fontSize: 40,
        fontSizeSp: 28,
        textColor: '#1f2937',
        textAlign: 'center',
      },
    },
    {
      id: 'aff-subhead-1',
      componentType: 'subhead',
      category: 'headline',
      order: 2,
      props: {
        text: 'あなたのネットワークを活かして、成果報酬型の報酬を獲得しましょう',
        fontSize: 20,
        fontSizeSp: 16,
        textColor: '#4b5563',
        textAlign: 'center',
      },
    },
    {
      id: 'aff-spacer-1',
      componentType: 'spacer',
      category: 'basic',
      order: 3,
      props: {
        height: 40,
        heightSp: 20,
      },
    },
    {
      id: 'aff-bullet-1',
      componentType: 'bullet',
      category: 'content',
      order: 4,
      props: {
        items: 'スタンダード: 売上の10%を報酬として獲得\nシルバー: 売上の12%（10件以上の成約で昇格）\nゴールド: 売上の15%（30件以上の成約で昇格）\nVIP: 売上の20%（招待制・特別パートナー向け）',
        icon: 'check',
        iconColor: '#1e40af',
      },
    },
    {
      id: 'aff-spacer-2',
      componentType: 'spacer',
      category: 'basic',
      order: 5,
      props: {
        height: 40,
        heightSp: 20,
      },
    },
    {
      id: 'aff-cta-1',
      componentType: 'cta-button',
      category: 'button',
      order: 6,
      props: {
        text: '今すぐパートナー登録',
        url: '/affiliate/join',
        backgroundColor: '#1e40af',
        textColor: '#ffffff',
        size: 'large',
        align: 'center',
      },
    },
    {
      id: 'aff-footer-1',
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
 * トリップワイヤーファネルテンプレート
 */
const salesTripwire: LPTemplate = {
  id: 'sales-tripwire',
  name: 'トリップワイヤー',
  description: '低価格商品で顧客を獲得し、高額商品へ導くファネル',
  category: 'sales',
  thumbnail: '/templates/sales-tripwire.png',
  tags: ['トリップワイヤー', '低価格', 'アップセル'],
  popularity: 78,
  components: [
    { id: 'tw-noti-1', componentType: 'notification-bar', category: 'layout', order: 0, props: { text: '🔥 本日限定！特別価格でご提供中', backgroundColor: '#dc2626', textColor: '#ffffff', sticky: true, closeable: true } },
    { id: 'tw-headline-1', componentType: 'headline', category: 'headline', order: 1, props: { text: 'たった980円で始める成功への第一歩', fontSize: 36, fontSizeSp: 24, textColor: '#1f2937', textAlign: 'center' } },
    { id: 'tw-subhead-1', componentType: 'subhead', category: 'headline', order: 2, props: { text: '通常価格¥9,800のコンテンツを今だけ90%OFFでお試し', fontSize: 18, fontSizeSp: 14, textColor: '#4b5563', textAlign: 'center' } },
    { id: 'tw-image-1', componentType: 'image', category: 'basic', order: 3, props: { src: '', alt: '商品イメージ', width: 60 } },
    { id: 'tw-bullet-1', componentType: 'bullet', category: 'content', order: 4, props: { items: '動画教材（全5本）\nワークシートPDF\nメールサポート7日間', icon: 'check', iconColor: '#22c55e' } },
    { id: 'tw-price-1', componentType: 'price-table', category: 'payment', order: 5, props: { plans: 'お試しプラン|¥980|動画教材5本,ワークシートPDF,メールサポート7日間|/checkout/trial', recommended: 'お試しプラン', backgroundColor: '#ffffff' } },
    { id: 'tw-btn-1', componentType: 'purchase-button', category: 'payment', order: 6, props: { text: '¥980で今すぐ始める', price: '¥9,800 → ¥980', backgroundColor: '#22c55e', animation: 'shine' } },
    { id: 'tw-footer-1', componentType: 'footer', category: 'other', order: 7, props: { copyright: '© 2026 Your Company. All rights reserved.', links: 'プライバシーポリシー\n特定商取引法に基づく表記' } },
  ],
};

/**
 * コンサルファネルテンプレート
 */
const consultationStandard: LPTemplate = {
  id: 'consultation-standard',
  name: '個別相談ファネル',
  description: '無料相談・個別コンサルティングの申込を獲得するLP',
  category: 'consultation',
  thumbnail: '/templates/consultation-standard.png',
  tags: ['コンサルティング', '無料相談', '個別'],
  popularity: 86,
  components: [
    { id: 'cs-header-1', componentType: 'header', category: 'other', order: 0, props: { logoText: 'コンサルティング', backgroundColor: '#ffffff' } },
    { id: 'cs-headline-1', componentType: 'headline', category: 'headline', order: 1, props: { text: '無料個別相談であなたの課題を解決します', fontSize: 32, fontSizeSp: 22, textColor: '#1f2937', textAlign: 'center' } },
    { id: 'cs-subhead-1', componentType: 'subhead', category: 'headline', order: 2, props: { text: '毎月先着10名様限定・完全無料', fontSize: 18, textColor: '#dc2626', textAlign: 'center' } },
    { id: 'cs-profile-1', componentType: 'profile-card', category: 'social', order: 3, props: { name: 'コンサルタント名', title: '代表取締役 / マーケティング専門家', image: '', bio: '15年以上のマーケティング経験。累計1,000社以上の支援実績。著書3冊。', backgroundColor: '#f9fafb', imageShape: 'circle' } },
    { id: 'cs-badge-1', componentType: 'achievement-badge', category: 'social', order: 4, props: { items: '1,000+|支援企業数\n15年|業界経験\n98%|満足度', columns: 3, badgeColor: '#3b82f6', textColor: '#ffffff' } },
    { id: 'cs-timeline-1', componentType: 'timeline', category: 'content', order: 5, props: { items: 'STEP1|フォームから申込\nSTEP2|日程調整（メールで連絡）\nSTEP3|Zoomで60分相談\nSTEP4|最適なプランをご提案', style: 'vertical', lineColor: '#3b82f6', dotColor: '#3b82f6' } },
    { id: 'cs-bubble-1', componentType: 'speech-bubble', category: 'content', order: 6, props: { text: '相談して方向性が明確になりました。おかげで売上が2倍に！', name: '山田太郎（30代・経営者）', position: 'left', backgroundColor: '#eff6ff' } },
    { id: 'cs-form-1', componentType: 'event-form', category: 'other', order: 7, props: { title: '無料個別相談', date: 'ご希望の日時をお選びください', location: 'オンライン（Zoom）', buttonText: '無料相談に申し込む', buttonColor: '#3b82f6' } },
    { id: 'cs-footer-1', componentType: 'footer', category: 'other', order: 8, props: { copyright: '© 2026 Your Company. All rights reserved.', links: 'プライバシーポリシー\n特定商取引法に基づく表記' } },
  ],
};

/**
 * アンケート・診断ファネルテンプレート
 */
const surveyFunnel: LPTemplate = {
  id: 'survey-funnel',
  name: 'アンケート・診断ファネル',
  description: '診断・アンケートで興味を引きリードを獲得するLP',
  category: 'optin',
  thumbnail: '/templates/survey-funnel.png',
  tags: ['診断', 'アンケート', 'クイズ'],
  popularity: 83,
  components: [
    { id: 'sf-headline-1', componentType: 'headline', category: 'headline', order: 0, props: { text: 'あなたのタイプを無料診断！', fontSize: 36, fontSizeSp: 24, textColor: '#1f2937', textAlign: 'center' } },
    { id: 'sf-subhead-1', componentType: 'subhead', category: 'headline', order: 1, props: { text: 'たった3分の質問に答えるだけ。最適な解決策がわかります。', fontSize: 18, textColor: '#4b5563', textAlign: 'center' } },
    { id: 'sf-progress-1', componentType: 'progress-bar', category: 'other', order: 2, props: { label: '診断の進捗', value: 0, max: 100, showPercentage: true, barColor: '#8b5cf6' } },
    { id: 'sf-form-1', componentType: 'custom-form', category: 'form', order: 3, props: { title: '質問1: あなたの現在の状況は？', fields: '現在の状況|select\nお名前|text\nメールアドレス|email', buttonText: '診断結果を見る', buttonColor: '#8b5cf6' } },
    { id: 'sf-rating-1', componentType: 'rating-stars', category: 'social', order: 4, props: { rating: 4.8, maxRating: 5, reviewCount: '12,345人が診断済み', size: 'medium', color: '#f59e0b' } },
    { id: 'sf-footer-1', componentType: 'footer', category: 'other', order: 5, props: { copyright: '© 2026 Your Company. All rights reserved.', links: 'プライバシーポリシー' } },
  ],
};

/**
 * イベント・セミナー申込テンプレート
 */
const eventRegistration: LPTemplate = {
  id: 'event-registration',
  name: 'イベント・セミナー申込',
  description: 'セミナーやワークショップの参加者を集めるLP',
  category: 'event',
  thumbnail: '/templates/event-registration.png',
  tags: ['セミナー', 'ワークショップ', 'イベント'],
  popularity: 88,
  components: [
    { id: 'ev-header-1', componentType: 'header', category: 'other', order: 0, props: { logoText: 'セミナー事務局', backgroundColor: '#ffffff' } },
    { id: 'ev-headline-1', componentType: 'headline', category: 'headline', order: 1, props: { text: '実践セミナー開催決定！', fontSize: 36, fontSizeSp: 24, textColor: '#1f2937', textAlign: 'center' } },
    { id: 'ev-subhead-1', componentType: 'subhead', category: 'headline', order: 2, props: { text: 'プロから直接学べる貴重な機会をお見逃しなく', fontSize: 18, textColor: '#4b5563', textAlign: 'center' } },
    { id: 'ev-schedule-1', componentType: 'event-schedule', category: 'other', order: 3, props: { title: '開催日程', dates: '4/10（木）14:00〜17:00|東京会場|残り5席\n4/15（火）14:00〜17:00|大阪会場|残り8席\n4/20（日）14:00〜17:00|オンライン|残り20席', buttonText: 'この日程で申し込む' } },
    { id: 'ev-iconlist-1', componentType: 'icon-list', category: 'content', order: 4, props: { items: '📚|基礎から応用まで体系的に学習\n🛠️|実践ワークで即実践可能\n📝|オリジナルテキスト付き\n🎁|参加者限定特典あり', iconColor: '#3b82f6', fontSize: 16, gap: 12 } },
    { id: 'ev-profile-1', componentType: 'profile-card', category: 'social', order: 5, props: { name: '講師名', title: '○○の専門家', image: '', bio: '20年以上の実務経験。セミナー登壇100回以上。著書多数。', backgroundColor: '#f9fafb', imageShape: 'circle' } },
    { id: 'ev-map-1', componentType: 'map-embed', category: 'other', order: 6, props: { embedUrl: '', height: 300, borderRadius: 8 } },
    { id: 'ev-footer-1', componentType: 'footer', category: 'other', order: 7, props: { copyright: '© 2026 セミナー事務局. All rights reserved.', links: 'プライバシーポリシー\n特定商取引法に基づく表記' } },
  ],
};

/**
 * 会員サイト・コース販売テンプレート
 */
const membershipCourse: LPTemplate = {
  id: 'membership-course',
  name: '会員サイト・コース販売',
  description: 'オンラインコースやメンバーシップの販売LP',
  category: 'membership',
  thumbnail: '/templates/membership-course.png',
  tags: ['オンラインコース', '会員サイト', 'メンバーシップ'],
  popularity: 84,
  components: [
    { id: 'mb-header-1', componentType: 'header', category: 'other', order: 0, props: { logoText: 'Online Academy', backgroundColor: '#ffffff' } },
    { id: 'mb-headline-1', componentType: 'headline', category: 'headline', order: 1, props: { text: 'プロが教えるオンライン完全マスターコース', fontSize: 36, fontSizeSp: 24, textColor: '#1f2937', textAlign: 'center' } },
    { id: 'mb-video-1', componentType: 'video', category: 'basic', order: 2, props: { videoUrl: '', autoplay: false, controls: true, aspectRatio: '16:9' } },
    { id: 'mb-badge-1', componentType: 'achievement-badge', category: 'social', order: 3, props: { items: '5,000+|受講者数\n4.8|平均評価\n30日|返金保証', columns: 3, badgeColor: '#8b5cf6', textColor: '#ffffff' } },
    { id: 'mb-timeline-1', componentType: 'timeline', category: 'content', order: 4, props: { items: 'Week 1|基礎編 - 全体像を理解する\nWeek 2|実践編 - 手を動かして学ぶ\nWeek 3|応用編 - 実案件で実践\nWeek 4|発展編 - 独自スキルを確立', style: 'vertical', lineColor: '#8b5cf6', dotColor: '#8b5cf6' } },
    { id: 'mb-compare-1', componentType: 'comparison-table', category: 'content', order: 5, props: { headers: '項目|独学|当コース', rows: '学習期間|6ヶ月〜|4週間\nサポート|なし|専任メンター\n実践課題|なし|毎週あり\n質問対応|なし|24時間チャット\n修了証|なし|デジタル証明書', highlightColumn: '3', highlightColor: '#ede9fe' } },
    { id: 'mb-price-1', componentType: 'price-table', category: 'payment', order: 6, props: { plans: 'ベーシック|¥29,800|動画講座全編,ワークシート,メールサポート|/checkout/basic\nプレミアム|¥59,800|動画講座全編,ワークシート,個別メンタリング月2回,コミュニティ参加権|/checkout/premium', recommended: 'プレミアム', backgroundColor: '#ffffff' } },
    { id: 'mb-faq-1', componentType: 'accordion', category: 'content', order: 7, props: { items: '未経験でも大丈夫ですか？|はい、基礎の基礎から丁寧に解説しています\n返金保証はありますか？|30日間の全額返金保証があります\nいつでも受講できますか？|はい、オンデマンドで24時間いつでもアクセス可能です', defaultOpen: true } },
    { id: 'mb-fcta-1', componentType: 'floating-cta', category: 'button', order: 8, props: { text: '今すぐコースに申し込む', subText: '30日間返金保証付き', backgroundColor: '#8b5cf6', textColor: '#ffffff', url: '', position: 'bottom' } },
    { id: 'mb-footer-1', componentType: 'footer', category: 'other', order: 9, props: { copyright: '© 2026 Online Academy. All rights reserved.', links: 'プライバシーポリシー\n特定商取引法に基づく表記' } },
  ],
};

/**
 * サンキュー・アップセルファネルテンプレート
 */
const thankyouUpsell: LPTemplate = {
  id: 'thankyou-upsell',
  name: 'サンキュー＋アップセル',
  description: '購入後のサンキューページにアップセルを組み込むLP',
  category: 'sales',
  thumbnail: '/templates/thankyou-upsell.png',
  tags: ['サンキュー', 'アップセル', 'ワンタイムオファー'],
  popularity: 76,
  components: [
    { id: 'tu-headline-1', componentType: 'headline', category: 'headline', order: 0, props: { text: 'ご購入ありがとうございます！', fontSize: 36, fontSizeSp: 24, textColor: '#1f2937', textAlign: 'center' } },
    { id: 'tu-text-1', componentType: 'text', category: 'basic', order: 1, props: { content: '登録メールアドレスに確認メールをお送りしました。\nメールに記載のリンクからコンテンツにアクセスできます。', fontSize: 16, textColor: '#4b5563', textAlign: 'center' } },
    { id: 'tu-divider-1', componentType: 'divider', category: 'basic', order: 2, props: { style: 'dashed', color: '#e5e7eb', thickness: 2, width: 80 } },
    { id: 'tu-noti-1', componentType: 'notification-bar', category: 'layout', order: 3, props: { text: '⏰ 特別オファー！このページ限定・今から30分以内のみ', backgroundColor: '#f59e0b', textColor: '#1f2937', sticky: false, closeable: false } },
    { id: 'tu-subhead-1', componentType: 'subhead', category: 'headline', order: 4, props: { text: '購入者限定のワンタイムオファー', fontSize: 24, textColor: '#dc2626', textAlign: 'center' } },
    { id: 'tu-countdown-1', componentType: 'countdown', category: 'other', order: 5, props: { title: 'オファー終了まで', endDate: '', style: 'urgent', backgroundColor: '#dc2626' } },
    { id: 'tu-bullet-1', componentType: 'bullet', category: 'content', order: 6, props: { items: 'プレミアムテンプレート集（¥19,800相当）\n1on1コンサルティング1回（¥30,000相当）\n限定コミュニティ永久アクセス権（¥9,800/月相当）', icon: 'star', iconColor: '#f59e0b' } },
    { id: 'tu-btn-1', componentType: 'purchase-button', category: 'payment', order: 7, props: { text: '特別価格 ¥14,800 で追加購入', price: '通常¥59,600 → ¥14,800（75%OFF）', backgroundColor: '#dc2626', animation: 'shake' } },
    { id: 'tu-skip-1', componentType: 'anchor-link', category: 'button', order: 8, props: { text: 'いいえ、このオファーは不要です', targetId: '', textColor: '#9ca3af', textAlign: 'center', fontSize: 14 } },
    { id: 'tu-footer-1', componentType: 'footer', category: 'other', order: 9, props: { copyright: '© 2026 Your Company. All rights reserved.', links: 'プライバシーポリシー' } },
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
  salesTripwire,
  thankyouUpsell,
  webinarStandard,
  webinarAuto,
  launchTeaser,
  launchFull,
  affiliateRecruit,
  consultationStandard,
  surveyFunnel,
  eventRegistration,
  membershipCourse,
];

export default LP_TEMPLATES;
