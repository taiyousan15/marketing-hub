/**
 * LP Builder コンポーネントレジストリ
 * 80+ コンポーネントの定義と登録
 */

import { LPComponent, ComponentCategory } from './types';

/**
 * コンポーネントレジストリ
 * カテゴリごとに整理された80+のLPコンポーネント
 */
export const COMPONENT_REGISTRY: Record<ComponentCategory, LPComponent[]> = {
  header: [
    {
      id: 'header-simple',
      type: 'header-simple',
      category: 'header',
      name: 'シンプルヘッダー',
      description: 'ロゴとナビゲーションのみのシンプルなヘッダー',
      icon: 'LayoutPanelTop',
      defaultProps: [
        { key: 'logo', label: 'ロゴ画像', type: 'image', value: '' },
        { key: 'logoText', label: 'ロゴテキスト', type: 'text', value: 'ブランド名', placeholder: 'ブランド名を入力' },
        { key: 'navItems', label: 'ナビゲーション', type: 'textarea', value: '特徴\n料金\nお問い合わせ' },
        { key: 'ctaText', label: 'CTAボタン', type: 'text', value: '今すぐ始める' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#ffffff' },
      ],
    },
    {
      id: 'header-sticky',
      type: 'header-sticky',
      category: 'header',
      name: '固定ヘッダー',
      description: 'スクロール時に固定されるヘッダー',
      icon: 'Pin',
      defaultProps: [
        { key: 'logo', label: 'ロゴ画像', type: 'image', value: '' },
        { key: 'logoText', label: 'ロゴテキスト', type: 'text', value: 'ブランド名' },
        { key: 'navItems', label: 'ナビゲーション', type: 'textarea', value: '特徴\n料金\nお問い合わせ' },
        { key: 'ctaText', label: 'CTAボタン', type: 'text', value: '無料で始める' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#ffffff' },
        { key: 'sticky', label: '固定表示', type: 'boolean', value: true },
      ],
    },
    {
      id: 'header-transparent',
      type: 'header-transparent',
      category: 'header',
      name: '透明ヘッダー',
      description: 'ヒーローセクションに重ねる透明ヘッダー',
      icon: 'Glasses',
      defaultProps: [
        { key: 'logo', label: 'ロゴ画像', type: 'image', value: '' },
        { key: 'logoText', label: 'ロゴテキスト', type: 'text', value: 'ブランド名' },
        { key: 'navItems', label: 'ナビゲーション', type: 'textarea', value: '特徴\n料金\nお問い合わせ' },
        { key: 'textColor', label: 'テキスト色', type: 'color', value: '#ffffff' },
      ],
    },
    {
      id: 'header-mega-menu',
      type: 'header-mega-menu',
      category: 'header',
      name: 'メガメニューヘッダー',
      description: '大規模なドロップダウンメニュー付き',
      icon: 'Menu',
      defaultProps: [
        { key: 'logo', label: 'ロゴ画像', type: 'image', value: '' },
        { key: 'logoText', label: 'ロゴテキスト', type: 'text', value: 'ブランド名' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#ffffff' },
      ],
    },
    {
      id: 'header-centered',
      type: 'header-centered',
      category: 'header',
      name: 'センター配置ヘッダー',
      description: 'ロゴとナビを中央配置',
      icon: 'AlignCenter',
      defaultProps: [
        { key: 'logo', label: 'ロゴ画像', type: 'image', value: '' },
        { key: 'logoText', label: 'ロゴテキスト', type: 'text', value: 'ブランド名' },
        { key: 'navItems', label: 'ナビゲーション', type: 'textarea', value: '特徴\n料金\nお問い合わせ' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#ffffff' },
      ],
    },
  ],

  hero: [
    {
      id: 'hero-classic',
      type: 'hero-classic',
      category: 'hero',
      name: 'クラシックヒーロー',
      description: '見出し、説明、CTAの標準的なヒーロー',
      icon: 'Rocket',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'あなたのビジネスを加速させる', placeholder: '魅力的な見出し' },
        { key: 'subheadline', label: 'サブ見出し', type: 'textarea', value: '最先端のツールで生産性を10倍に' },
        { key: 'ctaPrimary', label: 'メインCTA', type: 'text', value: '今すぐ無料で始める' },
        { key: 'ctaSecondary', label: 'サブCTA', type: 'text', value: '詳しく見る' },
        { key: 'backgroundImage', label: '背景画像', type: 'image', value: '' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#f3f4f6' },
      ],
    },
    {
      id: 'hero-split',
      type: 'hero-split',
      category: 'hero',
      name: '分割ヒーロー',
      description: 'テキストと画像を左右に配置',
      icon: 'Split',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'あなたのビジネスを変革' },
        { key: 'description', label: '説明文', type: 'textarea', value: '最新のAI技術であなたのワークフローを最適化' },
        { key: 'ctaText', label: 'CTAボタン', type: 'text', value: '無料トライアル' },
        { key: 'image', label: '画像', type: 'image', value: '' },
        { key: 'imagePosition', label: '画像位置', type: 'select', value: 'right', options: [
          { label: '右', value: 'right' },
          { label: '左', value: 'left' },
        ]},
      ],
    },
    {
      id: 'hero-video',
      type: 'hero-video',
      category: 'hero',
      name: 'ビデオヒーロー',
      description: '背景に動画を配置',
      icon: 'Video',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '未来を創造する' },
        { key: 'description', label: '説明文', type: 'textarea', value: '革新的なソリューション' },
        { key: 'videoUrl', label: '動画URL', type: 'text', value: '' },
        { key: 'ctaText', label: 'CTAボタン', type: 'text', value: '今すぐ体験' },
      ],
    },
    {
      id: 'hero-gradient',
      type: 'hero-gradient',
      category: 'hero',
      name: 'グラデーションヒーロー',
      description: '美しいグラデーション背景',
      icon: 'Sparkles',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '次世代のソリューション' },
        { key: 'description', label: '説明文', type: 'textarea', value: 'AIが可能にする新しい働き方' },
        { key: 'ctaText', label: 'CTAボタン', type: 'text', value: '始める' },
        { key: 'gradientFrom', label: 'グラデーション開始色', type: 'color', value: '#667eea' },
        { key: 'gradientTo', label: 'グラデーション終了色', type: 'color', value: '#764ba2' },
      ],
    },
    {
      id: 'hero-animated',
      type: 'hero-animated',
      category: 'hero',
      name: 'アニメーションヒーロー',
      description: '動的なアニメーション付き',
      icon: 'Zap',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'イノベーションの力' },
        { key: 'description', label: '説明文', type: 'textarea', value: '未来を切り開くテクノロジー' },
        { key: 'ctaText', label: 'CTAボタン', type: 'text', value: 'デモを見る' },
        { key: 'animationStyle', label: 'アニメーション', type: 'select', value: 'fade', options: [
          { label: 'フェード', value: 'fade' },
          { label: 'スライド', value: 'slide' },
          { label: 'ズーム', value: 'zoom' },
        ]},
      ],
    },
    {
      id: 'hero-minimal',
      type: 'hero-minimal',
      category: 'hero',
      name: 'ミニマルヒーロー',
      description: 'シンプルで洗練されたデザイン',
      icon: 'Minimize2',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'シンプルこそ最高' },
        { key: 'ctaText', label: 'CTAボタン', type: 'text', value: '始める' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#ffffff' },
      ],
    },
    {
      id: 'hero-fullscreen',
      type: 'hero-fullscreen',
      category: 'hero',
      name: 'フルスクリーンヒーロー',
      description: '画面全体を使用',
      icon: 'Maximize2',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '圧倒的な体験' },
        { key: 'description', label: '説明文', type: 'textarea', value: 'あなたの可能性を最大化' },
        { key: 'ctaText', label: 'CTAボタン', type: 'text', value: '無料で始める' },
        { key: 'backgroundImage', label: '背景画像', type: 'image', value: '' },
      ],
    },
    {
      id: 'hero-3d',
      type: 'hero-3d',
      category: 'hero',
      name: '3Dヒーロー',
      description: '3Dエフェクト付き',
      icon: 'Box',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '立体的な未来' },
        { key: 'description', label: '説明文', type: 'textarea', value: '次元を超えた体験' },
        { key: 'ctaText', label: 'CTAボタン', type: 'text', value: '体験する' },
      ],
    },
  ],

  problem: [
    {
      id: 'problem-grid',
      type: 'problem-grid',
      category: 'problem',
      name: '問題グリッド',
      description: '複数の問題点をグリッド表示',
      icon: 'AlertCircle',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'こんなお悩みありませんか？' },
        { key: 'problems', label: '問題点', type: 'textarea', value: '時間が足りない\nコストが高い\n成果が出ない' },
        { key: 'columns', label: '列数', type: 'number', value: 3 },
      ],
    },
    {
      id: 'problem-list',
      type: 'problem-list',
      category: 'problem',
      name: '問題リスト',
      description: 'チェックマーク付きリスト',
      icon: 'ListChecks',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'こんな課題を抱えていませんか？' },
        { key: 'problems', label: '問題点', type: 'textarea', value: '作業に時間がかかる\n人件費が増加している\n品質が安定しない' },
      ],
    },
    {
      id: 'problem-illustration',
      type: 'problem-illustration',
      category: 'problem',
      name: '図解問題',
      description: 'イラスト付き問題提起',
      icon: 'Image',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'よくある課題' },
        { key: 'description', label: '説明', type: 'textarea', value: '多くの企業が直面している問題' },
        { key: 'image', label: '画像', type: 'image', value: '' },
        { key: 'problems', label: '問題点', type: 'textarea', value: '効率が悪い\nミスが多い\nコストが増大' },
      ],
    },
    {
      id: 'problem-comparison',
      type: 'problem-comparison',
      category: 'problem',
      name: 'Before/After',
      description: '問題と解決後の比較',
      icon: 'GitCompare',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '導入前と導入後' },
        { key: 'before', label: '導入前', type: 'textarea', value: '手作業で3時間\nミス率20%' },
        { key: 'after', label: '導入後', type: 'textarea', value: '自動化で10分\nミス率0%' },
      ],
    },
    {
      id: 'problem-stats',
      type: 'problem-stats',
      category: 'problem',
      name: '統計で見る問題',
      description: '数字で問題を可視化',
      icon: 'BarChart3',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'データが語る現実' },
        { key: 'stats', label: '統計データ', type: 'textarea', value: '75%の企業が非効率を実感\n年間1000万円の損失' },
      ],
    },
    {
      id: 'problem-timeline',
      type: 'problem-timeline',
      category: 'problem',
      name: '問題の経緯',
      description: 'タイムライン形式で問題を説明',
      icon: 'Clock',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '問題の深刻化' },
        { key: 'timeline', label: 'タイムライン', type: 'textarea', value: '2020年: 問題発生\n2022年: 深刻化\n2024年: 限界に' },
      ],
    },
  ],

  solution: [
    {
      id: 'solution-features',
      type: 'solution-features',
      category: 'solution',
      name: '機能一覧',
      description: '主要機能をカード形式で表示',
      icon: 'Lightbulb',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '私たちのソリューション' },
        { key: 'features', label: '機能', type: 'textarea', value: 'AI自動化|作業時間90%削減\n高精度分析|ミスゼロを実現\nクラウド統合|どこでも利用可能' },
        { key: 'columns', label: '列数', type: 'number', value: 3 },
      ],
    },
    {
      id: 'solution-steps',
      type: 'solution-steps',
      category: 'solution',
      name: '解決ステップ',
      description: 'ステップバイステップで説明',
      icon: 'Footprints',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '3つのステップで解決' },
        { key: 'steps', label: 'ステップ', type: 'textarea', value: '1. 簡単登録|3分で完了\n2. 自動設定|AIが最適化\n3. 即利用開始|すぐに効果実感' },
      ],
    },
    {
      id: 'solution-diagram',
      type: 'solution-diagram',
      category: 'solution',
      name: 'ソリューション図解',
      description: 'フロー図で解決策を説明',
      icon: 'Network',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '仕組みの全体像' },
        { key: 'description', label: '説明', type: 'textarea', value: 'シンプルな3ステップで完結' },
        { key: 'diagram', label: '図解画像', type: 'image', value: '' },
      ],
    },
    {
      id: 'solution-benefits',
      type: 'solution-benefits',
      category: 'solution',
      name: 'ベネフィット一覧',
      description: '得られるメリット',
      icon: 'TrendingUp',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '導入メリット' },
        { key: 'benefits', label: 'メリット', type: 'textarea', value: 'コスト削減\n生産性向上\n品質改善' },
      ],
    },
    {
      id: 'solution-demo',
      type: 'solution-demo',
      category: 'solution',
      name: 'デモ動画',
      description: '実際の使用方法を動画で紹介',
      icon: 'PlayCircle',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '使い方は簡単' },
        { key: 'videoUrl', label: '動画URL', type: 'text', value: '' },
        { key: 'description', label: '説明', type: 'textarea', value: '3分でわかる使い方' },
      ],
    },
    {
      id: 'solution-integration',
      type: 'solution-integration',
      category: 'solution',
      name: '連携サービス',
      description: '他サービスとの連携',
      icon: 'Link',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '主要サービスと連携' },
        { key: 'integrations', label: '連携サービス', type: 'textarea', value: 'Slack\nGoogle Workspace\nSalesforce' },
      ],
    },
    {
      id: 'solution-customization',
      type: 'solution-customization',
      category: 'solution',
      name: 'カスタマイズ可能',
      description: 'カスタマイズオプション',
      icon: 'Palette',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'あなた好みにカスタマイズ' },
        { key: 'options', label: 'オプション', type: 'textarea', value: 'デザインテーマ\nワークフロー\nダッシュボード' },
      ],
    },
  ],

  testimonial: [
    {
      id: 'testimonial-cards',
      type: 'testimonial-cards',
      category: 'testimonial',
      name: 'お客様の声カード',
      description: 'カード形式の評価',
      icon: 'MessageSquare',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'お客様の声' },
        { key: 'testimonials', label: '評価', type: 'textarea', value: '山田太郎|株式会社A|導入後、業務効率が3倍に！\n佐藤花子|B社|コスト削減に成功しました' },
      ],
    },
    {
      id: 'testimonial-slider',
      type: 'testimonial-slider',
      category: 'testimonial',
      name: 'スライダー形式',
      description: 'スライドショー形式',
      icon: 'ChevronsRight',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '導入企業の声' },
        { key: 'testimonials', label: '評価', type: 'textarea', value: '田中次郎|C社|革新的なツールです\n鈴木一郎|D社|おすすめです' },
        { key: 'autoPlay', label: '自動再生', type: 'boolean', value: true },
      ],
    },
    {
      id: 'testimonial-video',
      type: 'testimonial-video',
      category: 'testimonial',
      name: 'ビデオ評価',
      description: '動画インタビュー',
      icon: 'Video',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'お客様インタビュー' },
        { key: 'videoUrl', label: '動画URL', type: 'text', value: '' },
        { key: 'name', label: '名前', type: 'text', value: '山田太郎' },
        { key: 'company', label: '会社名', type: 'text', value: '株式会社A' },
      ],
    },
    {
      id: 'testimonial-stats',
      type: 'testimonial-stats',
      category: 'testimonial',
      name: '満足度統計',
      description: '数字で見る評価',
      icon: 'Star',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '高い満足度' },
        { key: 'rating', label: '平均評価', type: 'number', value: 4.8 },
        { key: 'totalReviews', label: 'レビュー数', type: 'number', value: 1250 },
        { key: 'satisfaction', label: '満足度', type: 'number', value: 98 },
      ],
    },
    {
      id: 'testimonial-quotes',
      type: 'testimonial-quotes',
      category: 'testimonial',
      name: '引用形式',
      description: '大きな引用符で強調',
      icon: 'Quote',
      defaultProps: [
        { key: 'quote', label: '引用文', type: 'textarea', value: 'このツールなしでは仕事になりません' },
        { key: 'author', label: '著者', type: 'text', value: '山田太郎' },
        { key: 'position', label: '役職', type: 'text', value: 'CEO' },
      ],
    },
    {
      id: 'testimonial-logo-wall',
      type: 'testimonial-logo-wall',
      category: 'testimonial',
      name: '導入企業ロゴ',
      description: 'ロゴ一覧',
      icon: 'Building2',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '導入実績' },
        { key: 'logos', label: 'ロゴ画像（カンマ区切り）', type: 'textarea', value: '' },
      ],
    },
  ],

  cta: [
    {
      id: 'cta-simple',
      type: 'cta-simple',
      category: 'cta',
      name: 'シンプルCTA',
      description: '基本的な行動喚起',
      icon: 'Hand',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '今すぐ始めよう' },
        { key: 'description', label: '説明', type: 'textarea', value: '無料トライアルで全機能を体験' },
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: '無料で始める' },
        { key: 'buttonColor', label: 'ボタン色', type: 'color', value: '#3b82f6' },
      ],
    },
    {
      id: 'cta-split',
      type: 'cta-split',
      category: 'cta',
      name: '分割CTA',
      description: '2つの選択肢',
      icon: 'ArrowLeftRight',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'あなたに合ったプランを' },
        { key: 'primaryCta', label: 'メインCTA', type: 'text', value: '無料トライアル' },
        { key: 'secondaryCta', label: 'セカンダリCTA', type: 'text', value: 'デモを見る' },
      ],
    },
    {
      id: 'cta-urgency',
      type: 'cta-urgency',
      category: 'cta',
      name: '緊急性CTA',
      description: '限定感を演出',
      icon: 'AlertTriangle',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '期間限定オファー' },
        { key: 'urgencyText', label: '緊急性メッセージ', type: 'text', value: '残り24時間！' },
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: '今すぐ申し込む' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#dc2626' },
      ],
    },
    {
      id: 'cta-sticky-bar',
      type: 'cta-sticky-bar',
      category: 'cta',
      name: '固定バーCTA',
      description: '画面下部に固定',
      icon: 'ChevronDown',
      defaultProps: [
        { key: 'text', label: 'テキスト', type: 'text', value: '特別オファー実施中' },
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: '詳細を見る' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#1f2937' },
      ],
    },
    {
      id: 'cta-fullscreen',
      type: 'cta-fullscreen',
      category: 'cta',
      name: 'フルスクリーンCTA',
      description: '大きなインパクト',
      icon: 'Maximize',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '今すぐ変革を始めよう' },
        { key: 'description', label: '説明', type: 'textarea', value: '無料トライアルで全機能が使える' },
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: '無料で始める' },
        { key: 'backgroundImage', label: '背景画像', type: 'image', value: '' },
      ],
    },
    {
      id: 'cta-social-proof',
      type: 'cta-social-proof',
      category: 'cta',
      name: '社会的証明CTA',
      description: '実績を添えて',
      icon: 'Users',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '10,000社以上が導入' },
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: 'あなたも始める' },
        { key: 'stats', label: '統計', type: 'text', value: '導入企業数: 10,000+' },
      ],
    },
  ],

  form: [
    {
      id: 'form-contact',
      type: 'form-contact',
      category: 'form',
      name: 'お問い合わせフォーム',
      description: '基本的な問い合わせ',
      icon: 'Mail',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'お問い合わせ' },
        { key: 'fields', label: 'フィールド', type: 'textarea', value: '名前\nメールアドレス\n電話番号\nお問い合わせ内容' },
        { key: 'submitText', label: '送信ボタン', type: 'text', value: '送信する' },
      ],
    },
    {
      id: 'form-registration',
      type: 'form-registration',
      category: 'form',
      name: '登録フォーム',
      description: 'ユーザー登録',
      icon: 'UserPlus',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '無料アカウント作成' },
        { key: 'fields', label: 'フィールド', type: 'textarea', value: '名前\nメールアドレス\nパスワード' },
        { key: 'submitText', label: '送信ボタン', type: 'text', value: 'アカウント作成' },
      ],
    },
    {
      id: 'form-newsletter',
      type: 'form-newsletter',
      category: 'form',
      name: 'メルマガ登録',
      description: 'ニュースレター購読',
      icon: 'Newspaper',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'ニュースレター購読' },
        { key: 'description', label: '説明', type: 'textarea', value: '最新情報をお届けします' },
        { key: 'submitText', label: '送信ボタン', type: 'text', value: '購読する' },
      ],
    },
    {
      id: 'form-multi-step',
      type: 'form-multi-step',
      category: 'form',
      name: 'マルチステップフォーム',
      description: '段階的な入力',
      icon: 'ListOrdered',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '簡単3ステップで登録' },
        { key: 'steps', label: 'ステップ', type: 'number', value: 3 },
        { key: 'submitText', label: '送信ボタン', type: 'text', value: '送信' },
      ],
    },
    {
      id: 'form-quiz',
      type: 'form-quiz',
      category: 'form',
      name: '診断フォーム',
      description: '質問形式',
      icon: 'HelpCircle',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'あなたに最適なプランは？' },
        { key: 'questions', label: '質問', type: 'textarea', value: '業種は？\n従業員数は？\n予算は？' },
        { key: 'submitText', label: '送信ボタン', type: 'text', value: '診断する' },
      ],
    },
    {
      id: 'form-inline',
      type: 'form-inline',
      category: 'form',
      name: 'インラインフォーム',
      description: '横並びフォーム',
      icon: 'ArrowRight',
      defaultProps: [
        { key: 'placeholder', label: 'プレースホルダー', type: 'text', value: 'メールアドレスを入力' },
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: '無料で始める' },
      ],
    },
  ],

  pricing: [
    {
      id: 'pricing-3tier',
      type: 'pricing-3tier',
      category: 'pricing',
      name: '3プラン価格表',
      description: 'スタンダードな3段階',
      icon: 'DollarSign',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'シンプルな料金プラン' },
        { key: 'plans', label: 'プラン（名前|価格|機能）', type: 'textarea', value: 'ベーシック|¥1,980/月|基本機能,5GB,サポート\nプロ|¥4,980/月|全機能,50GB,優先サポート\nエンタープライズ|お問い合わせ|無制限,専任担当,カスタマイズ' },
      ],
    },
    {
      id: 'pricing-comparison',
      type: 'pricing-comparison',
      category: 'pricing',
      name: '機能比較表',
      description: '詳細な比較',
      icon: 'Table',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'プラン比較' },
        { key: 'features', label: '機能比較', type: 'textarea', value: '機能A|○|○|○\n機能B|×|○|○\n機能C|×|×|○' },
      ],
    },
    {
      id: 'pricing-toggle',
      type: 'pricing-toggle',
      category: 'pricing',
      name: '月額/年額切替',
      description: '料金プラン切替',
      icon: 'ToggleLeft',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '最適なプランを選択' },
        { key: 'monthlyPrice', label: '月額料金', type: 'text', value: '¥4,980' },
        { key: 'yearlyPrice', label: '年額料金', type: 'text', value: '¥49,800（2ヶ月分お得）' },
      ],
    },
    {
      id: 'pricing-featured',
      type: 'pricing-featured',
      category: 'pricing',
      name: 'おすすめプラン強調',
      description: '人気プランをハイライト',
      icon: 'Crown',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '料金プラン' },
        { key: 'featuredPlan', label: 'おすすめプラン', type: 'text', value: 'プロ' },
        { key: 'badge', label: 'バッジテキスト', type: 'text', value: '最も人気' },
      ],
    },
    {
      id: 'pricing-calculator',
      type: 'pricing-calculator',
      category: 'pricing',
      name: '料金計算ツール',
      description: 'インタラクティブ計算',
      icon: 'Calculator',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '料金シミュレーション' },
        { key: 'basePrice', label: '基本料金', type: 'number', value: 1980 },
        { key: 'unit', label: '単位', type: 'text', value: '円/月' },
      ],
    },
  ],

  faq: [
    {
      id: 'faq-accordion',
      type: 'faq-accordion',
      category: 'faq',
      name: 'アコーディオンFAQ',
      description: '展開式Q&A',
      icon: 'ChevronDown',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'よくある質問' },
        { key: 'items', label: 'Q&A（質問|回答）', type: 'textarea', value: '無料トライアルはありますか？|はい、14日間の無料トライアルがあります\n支払い方法は？|クレジットカード、請求書払いに対応' },
      ],
    },
    {
      id: 'faq-grid',
      type: 'faq-grid',
      category: 'faq',
      name: 'グリッド表示FAQ',
      description: 'カード形式',
      icon: 'Grid3x3',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'よくある質問' },
        { key: 'items', label: 'Q&A', type: 'textarea', value: '契約期間は？|最短1ヶ月から\n解約方法は？|管理画面から即座に解約可能' },
        { key: 'columns', label: '列数', type: 'number', value: 2 },
      ],
    },
    {
      id: 'faq-search',
      type: 'faq-search',
      category: 'faq',
      name: '検索可能FAQ',
      description: '検索バー付き',
      icon: 'Search',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'ヘルプセンター' },
        { key: 'placeholder', label: '検索プレースホルダー', type: 'text', value: '質問を検索...' },
      ],
    },
    {
      id: 'faq-category',
      type: 'faq-category',
      category: 'faq',
      name: 'カテゴリ分けFAQ',
      description: 'カテゴリごとに整理',
      icon: 'FolderOpen',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'よくある質問' },
        { key: 'categories', label: 'カテゴリ', type: 'textarea', value: '料金について\n機能について\nサポートについて' },
      ],
    },
  ],

  countdown: [
    {
      id: 'countdown-simple',
      type: 'countdown-simple',
      category: 'countdown',
      name: 'シンプルカウントダウン',
      description: '基本的なタイマー',
      icon: 'Timer',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'キャンペーン終了まで' },
        { key: 'endDate', label: '終了日時', type: 'text', value: '2026-12-31 23:59:59' },
        { key: 'showDays', label: '日数表示', type: 'boolean', value: true },
      ],
    },
    {
      id: 'countdown-urgency',
      type: 'countdown-urgency',
      category: 'countdown',
      name: '緊急カウントダウン',
      description: '緊急性を強調',
      icon: 'AlertCircle',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: '特別価格は残りわずか！' },
        { key: 'endDate', label: '終了日時', type: 'text', value: '2026-12-31 23:59:59' },
        { key: 'urgencyMessage', label: '緊急メッセージ', type: 'text', value: '今すぐお申し込みを！' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#dc2626' },
      ],
    },
    {
      id: 'countdown-evergreen',
      type: 'countdown-evergreen',
      category: 'countdown',
      name: 'エバーグリーンタイマー',
      description: '訪問者ごとにリセット',
      icon: 'RefreshCw',
      defaultProps: [
        { key: 'headline', label: '見出し', type: 'text', value: 'あなた専用の特別オファー' },
        { key: 'duration', label: '時間（分）', type: 'number', value: 30 },
        { key: 'message', label: 'メッセージ', type: 'text', value: '残り時間以内にお申し込みで特典あり！' },
      ],
    },
  ],

  footer: [
    {
      id: 'footer-simple',
      type: 'footer-simple',
      category: 'footer',
      name: 'シンプルフッター',
      description: '基本的なフッター',
      icon: 'LayoutPanelBottom',
      defaultProps: [
        { key: 'copyright', label: '著作権表示', type: 'text', value: '© 2026 Your Company. All rights reserved.' },
        { key: 'links', label: 'リンク', type: 'textarea', value: 'プライバシーポリシー\n利用規約\nお問い合わせ' },
      ],
    },
    {
      id: 'footer-detailed',
      type: 'footer-detailed',
      category: 'footer',
      name: '詳細フッター',
      description: '複数カラムのフッター',
      icon: 'Columns3',
      defaultProps: [
        { key: 'logo', label: 'ロゴ画像', type: 'image', value: '' },
        { key: 'description', label: '説明', type: 'textarea', value: '会社の簡単な説明' },
        { key: 'columns', label: 'カラム（タイトル|リンク）', type: 'textarea', value: 'サービス|機能,料金,事例\n会社情報|会社概要,採用,ニュース' },
        { key: 'copyright', label: '著作権', type: 'text', value: '© 2026 Your Company' },
      ],
    },
    {
      id: 'footer-social',
      type: 'footer-social',
      category: 'footer',
      name: 'SNSフッター',
      description: 'SNSリンク強調',
      icon: 'Share2',
      defaultProps: [
        { key: 'copyright', label: '著作権', type: 'text', value: '© 2026 Your Company' },
        { key: 'socialLinks', label: 'SNSリンク（名前|URL）', type: 'textarea', value: 'Twitter|https://twitter.com\nFacebook|https://facebook.com\nLinkedIn|https://linkedin.com' },
      ],
    },
  ],
};

/**
 * カテゴリ表示名の定義
 */
export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  header: 'ヘッダー',
  hero: 'ヒーロー',
  problem: '問題提起',
  solution: '解決策',
  testimonial: 'お客様の声',
  cta: 'CTA（行動喚起）',
  form: 'フォーム',
  pricing: '料金表',
  faq: 'よくある質問',
  countdown: 'カウントダウン',
  footer: 'フッター',
};

/**
 * カテゴリ別にコンポーネントを取得
 */
export function getComponentsByCategory(category: ComponentCategory): LPComponent[] {
  return COMPONENT_REGISTRY[category] || [];
}

/**
 * すべてのコンポーネントを取得
 */
export function getAllComponents(): LPComponent[] {
  return Object.values(COMPONENT_REGISTRY).flat();
}

/**
 * IDからコンポーネントを取得
 */
export function getComponentById(id: string): LPComponent | undefined {
  return getAllComponents().find((comp) => comp.id === id);
}

/**
 * タイプからコンポーネントを取得
 */
export function getComponentByType(type: string): LPComponent | undefined {
  return getAllComponents().find((comp) => comp.type === type);
}

/**
 * カテゴリ一覧を取得
 */
export function getCategories(): ComponentCategory[] {
  return Object.keys(COMPONENT_REGISTRY) as ComponentCategory[];
}
