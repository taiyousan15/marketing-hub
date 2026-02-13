/**
 * LP Builder コンポーネントレジストリ
 * UTAGE互換 34要素（9カテゴリ）
 */

import { LPComponent, ComponentCategory } from './types';

/**
 * UTAGE互換コンポーネントレジストリ
 * シンプルで使いやすい34要素
 */
export const COMPONENT_REGISTRY: Record<ComponentCategory, LPComponent[]> = {
  // ========================================
  // 基本要素 (7要素)
  // ========================================
  basic: [
    {
      id: 'text',
      type: 'text',
      category: 'basic',
      name: 'テキスト',
      description: '文章を表示（リンク設置可能）',
      icon: 'Type',
      defaultProps: [
        { key: 'content', label: 'テキスト', type: 'textarea', value: 'ここにテキストを入力してください', placeholder: 'テキストを入力' },
        { key: 'fontSize', label: '文字サイズ（PC）', type: 'number', value: 16 },
        { key: 'fontSizeSp', label: '文字サイズ（スマホ）', type: 'number', value: 14 },
        { key: 'lineHeight', label: '行間', type: 'number', value: 1.8 },
        { key: 'textColor', label: '文字色', type: 'color', value: '#333333' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: 'transparent' },
        { key: 'textAlign', label: '配置', type: 'select', value: 'left', options: [
          { label: '左揃え', value: 'left' },
          { label: '中央', value: 'center' },
          { label: '右揃え', value: 'right' },
        ]},
      ],
    },
    {
      id: 'image',
      type: 'image',
      category: 'basic',
      name: '画像',
      description: '画像を表示',
      icon: 'Image',
      defaultProps: [
        { key: 'src', label: '画像', type: 'image', value: '' },
        { key: 'alt', label: '代替テキスト', type: 'text', value: '', placeholder: '画像の説明' },
        { key: 'width', label: '幅（%）', type: 'number', value: 100 },
        { key: 'link', label: 'リンクURL', type: 'text', value: '', placeholder: 'https://' },
        { key: 'borderRadius', label: '角丸み', type: 'number', value: 0 },
      ],
    },
    {
      id: 'video',
      type: 'video',
      category: 'basic',
      name: '動画',
      description: 'YouTube/Vimeo/MP4動画を埋め込み',
      icon: 'Video',
      defaultProps: [
        { key: 'videoUrl', label: '動画URL', type: 'text', value: '', placeholder: 'YouTube/Vimeo URLまたはMP4' },
        { key: 'autoplay', label: '自動再生', type: 'boolean', value: false },
        { key: 'controls', label: 'コントロール表示', type: 'boolean', value: true },
        { key: 'aspectRatio', label: 'アスペクト比', type: 'select', value: '16:9', options: [
          { label: '16:9', value: '16:9' },
          { label: '4:3', value: '4:3' },
          { label: '1:1', value: '1:1' },
        ]},
      ],
    },
    {
      id: 'audio',
      type: 'audio',
      category: 'basic',
      name: '音声',
      description: '音声ファイルを再生',
      icon: 'Volume2',
      defaultProps: [
        { key: 'audioUrl', label: '音声URL', type: 'text', value: '', placeholder: 'MP3/WAV URL' },
        { key: 'autoplay', label: '自動再生', type: 'boolean', value: false },
        { key: 'showPlayer', label: 'プレイヤー表示', type: 'boolean', value: true },
      ],
    },
    {
      id: 'spacer',
      type: 'spacer',
      category: 'basic',
      name: '余白',
      description: '縦方向の余白を追加',
      icon: 'Space',
      defaultProps: [
        { key: 'height', label: '高さ（PC）', type: 'number', value: 40 },
        { key: 'heightSp', label: '高さ（スマホ）', type: 'number', value: 20 },
      ],
    },
    {
      id: 'divider',
      type: 'divider',
      category: 'basic',
      name: '区切り線',
      description: '水平の区切り線',
      icon: 'Minus',
      defaultProps: [
        { key: 'style', label: 'スタイル', type: 'select', value: 'solid', options: [
          { label: '実線', value: 'solid' },
          { label: '点線', value: 'dotted' },
          { label: '破線', value: 'dashed' },
        ]},
        { key: 'color', label: '色', type: 'color', value: '#e5e7eb' },
        { key: 'thickness', label: '太さ', type: 'number', value: 1 },
        { key: 'width', label: '幅（%）', type: 'number', value: 100 },
      ],
    },
    {
      id: 'pdf',
      type: 'pdf',
      category: 'basic',
      name: 'PDF',
      description: 'PDFファイルを埋め込み表示',
      icon: 'FileText',
      defaultProps: [
        { key: 'pdfUrl', label: 'PDF URL', type: 'text', value: '', placeholder: 'PDF URL' },
        { key: 'height', label: '高さ', type: 'number', value: 600 },
        { key: 'showDownload', label: 'ダウンロードボタン', type: 'boolean', value: true },
      ],
    },
  ],

  // ========================================
  // 見出し (2要素)
  // ========================================
  headline: [
    {
      id: 'headline',
      type: 'headline',
      category: 'headline',
      name: 'ヘッドライン',
      description: '大きな見出し（キャッチコピー）',
      icon: 'Heading1',
      defaultProps: [
        { key: 'text', label: 'テキスト', type: 'textarea', value: 'あなたのビジネスを加速させる', placeholder: 'キャッチコピーを入力' },
        { key: 'fontSize', label: '文字サイズ（PC）', type: 'number', value: 36 },
        { key: 'fontSizeSp', label: '文字サイズ（スマホ）', type: 'number', value: 24 },
        { key: 'textColor', label: '文字色', type: 'color', value: '#1f2937' },
        { key: 'shadowStyle', label: '影スタイル', type: 'select', value: 'none', options: [
          { label: 'なし', value: 'none' },
          { label: '灰影', value: 'gray' },
          { label: '白影', value: 'white' },
          { label: '黒影', value: 'black' },
        ]},
        { key: 'textAlign', label: '配置', type: 'select', value: 'center', options: [
          { label: '左揃え', value: 'left' },
          { label: '中央', value: 'center' },
          { label: '右揃え', value: 'right' },
        ]},
      ],
    },
    {
      id: 'subhead',
      type: 'subhead',
      category: 'headline',
      name: 'サブヘッド',
      description: '中程度の見出し',
      icon: 'Heading2',
      defaultProps: [
        { key: 'text', label: 'テキスト', type: 'textarea', value: '最先端のツールで生産性を10倍に', placeholder: 'サブ見出しを入力' },
        { key: 'fontSize', label: '文字サイズ（PC）', type: 'number', value: 24 },
        { key: 'fontSizeSp', label: '文字サイズ（スマホ）', type: 'number', value: 18 },
        { key: 'textColor', label: '文字色', type: 'color', value: '#4b5563' },
        { key: 'textAlign', label: '配置', type: 'select', value: 'center', options: [
          { label: '左揃え', value: 'left' },
          { label: '中央', value: 'center' },
          { label: '右揃え', value: 'right' },
        ]},
      ],
    },
  ],

  // ========================================
  // コンテンツ (5要素)
  // ========================================
  content: [
    {
      id: 'bullet',
      type: 'bullet',
      category: 'content',
      name: 'ボレット',
      description: '箇条書きリスト（チェックマーク付き）',
      icon: 'ListChecks',
      defaultProps: [
        { key: 'items', label: '項目（改行区切り）', type: 'textarea', value: '時間を大幅に節約\nコストを削減\n品質を向上', placeholder: '項目を改行で区切って入力' },
        { key: 'icon', label: 'アイコン', type: 'select', value: 'check', options: [
          { label: 'チェックマーク', value: 'check' },
          { label: '丸', value: 'circle' },
          { label: '矢印', value: 'arrow' },
          { label: '星', value: 'star' },
        ]},
        { key: 'iconColor', label: 'アイコン色', type: 'color', value: '#22c55e' },
        { key: 'fontSize', label: '文字サイズ', type: 'number', value: 16 },
      ],
    },
    {
      id: 'speech-bubble',
      type: 'speech-bubble',
      category: 'content',
      name: '吹き出し',
      description: '会話形式の吹き出し',
      icon: 'MessageCircle',
      defaultProps: [
        { key: 'text', label: 'テキスト', type: 'textarea', value: 'このサービスを使って本当に良かった！', placeholder: '吹き出しのテキスト' },
        { key: 'avatar', label: 'アバター画像', type: 'image', value: '' },
        { key: 'name', label: '名前', type: 'text', value: '山田太郎', placeholder: '発言者名' },
        { key: 'position', label: '位置', type: 'select', value: 'left', options: [
          { label: '左', value: 'left' },
          { label: '右', value: 'right' },
        ]},
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#f3f4f6' },
      ],
    },
    {
      id: 'imageText',
      type: 'imageText',
      category: 'content',
      name: '画像＋テキスト',
      description: '画像とテキストを横並び表示',
      icon: 'LayoutList',
      defaultProps: [
        { key: 'image', label: '画像', type: 'image', value: '' },
        { key: 'title', label: 'タイトル', type: 'text', value: '特徴タイトル', placeholder: 'タイトル' },
        { key: 'text', label: 'テキスト', type: 'textarea', value: '詳細な説明文をここに入力します。', placeholder: '説明文' },
        { key: 'imagePosition', label: '画像位置', type: 'select', value: 'left', options: [
          { label: '左', value: 'left' },
          { label: '右', value: 'right' },
        ]},
        { key: 'imageWidth', label: '画像幅（%）', type: 'number', value: 40 },
      ],
    },
    {
      id: 'table',
      type: 'table',
      category: 'content',
      name: '表',
      description: '表形式でデータ表示',
      icon: 'Table',
      defaultProps: [
        { key: 'data', label: 'データ（|区切り、改行で行）', type: 'textarea', value: '項目|内容\n料金|¥9,800/月\nサポート|24時間対応', placeholder: '項目|値（改行で行を追加）' },
        { key: 'headerBg', label: 'ヘッダー背景色', type: 'color', value: '#f3f4f6' },
        { key: 'borderColor', label: '罫線色', type: 'color', value: '#e5e7eb' },
      ],
    },
    {
      id: 'accordion',
      type: 'accordion',
      category: 'content',
      name: 'アコーディオン',
      description: '開閉式のQ&A・FAQ',
      icon: 'ChevronDown',
      defaultProps: [
        { key: 'items', label: '項目（質問|回答で改行）', type: 'textarea', value: '無料トライアルはありますか？|はい、14日間の無料トライアルがあります\n解約方法は？|管理画面からいつでも解約できます', placeholder: '質問|回答（改行で項目追加）' },
        { key: 'defaultOpen', label: '最初を開いた状態', type: 'boolean', value: true },
        { key: 'iconColor', label: 'アイコン色', type: 'color', value: '#6b7280' },
      ],
    },
  ],

  // ========================================
  // 動画 (4要素)
  // ========================================
  video: [
    {
      id: 'videoMenu',
      type: 'videoMenu',
      category: 'video',
      name: '動画メニュー',
      description: '複数動画をメニュー形式で表示',
      icon: 'PlaySquare',
      defaultProps: [
        { key: 'videos', label: '動画リスト（タイトル|URL）', type: 'textarea', value: '第1回 はじめに|https://youtube.com/xxx\n第2回 基本操作|https://youtube.com/yyy', placeholder: 'タイトル|URL（改行で追加）' },
        { key: 'layout', label: 'レイアウト', type: 'select', value: 'list', options: [
          { label: 'リスト', value: 'list' },
          { label: 'グリッド', value: 'grid' },
        ]},
      ],
    },
    {
      id: 'video-chapter',
      type: 'video-chapter',
      category: 'video',
      name: '動画チャプター',
      description: 'チャプター付き動画プレイヤー',
      icon: 'List',
      defaultProps: [
        { key: 'videoUrl', label: '動画URL', type: 'text', value: '', placeholder: 'YouTube/Vimeo URL' },
        { key: 'chapters', label: 'チャプター（時間|タイトル）', type: 'textarea', value: '0:00|イントロ\n1:30|本題\n5:00|まとめ', placeholder: '0:00|タイトル（改行で追加）' },
      ],
    },
    {
      id: 'auto-webinar',
      type: 'auto-webinar',
      category: 'video',
      name: '自動ウェビナー',
      description: 'スケジュール付き自動ウェビナー',
      icon: 'Calendar',
      defaultProps: [
        { key: 'videoUrl', label: '動画URL', type: 'text', value: '', placeholder: 'ウェビナー動画URL' },
        { key: 'title', label: 'タイトル', type: 'text', value: '無料ウェビナー', placeholder: 'ウェビナータイトル' },
        { key: 'scheduleType', label: 'スケジュール', type: 'select', value: 'ondemand', options: [
          { label: 'オンデマンド', value: 'ondemand' },
          { label: '定時開催', value: 'scheduled' },
          { label: 'エバーグリーン', value: 'evergreen' },
        ]},
        { key: 'ctaText', label: 'CTAボタン', type: 'text', value: '今すぐ参加', placeholder: 'ボタンテキスト' },
      ],
    },
  ],

  // ========================================
  // フォーム (3要素)
  // ========================================
  form: [
    {
      id: 'registration-form',
      type: 'registration-form',
      category: 'form',
      name: '登録フォーム',
      description: 'メールアドレス登録フォーム',
      icon: 'Mail',
      defaultProps: [
        { key: 'title', label: 'タイトル', type: 'text', value: '無料プレゼントを受け取る', placeholder: 'フォームタイトル' },
        { key: 'fields', label: 'フィールド', type: 'select', value: 'email', options: [
          { label: 'メールアドレスのみ', value: 'email' },
          { label: '名前+メール', value: 'name_email' },
          { label: '名前+メール+電話', value: 'full' },
        ]},
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: '今すぐ登録', placeholder: 'ボタンテキスト' },
        { key: 'buttonColor', label: 'ボタン色', type: 'color', value: '#22c55e' },
        { key: 'subText', label: 'サブテキスト', type: 'text', value: '登録は無料です', placeholder: 'ボタン下のテキスト' },
        { key: 'redirectUrl', label: 'リダイレクト先', type: 'text', value: '', placeholder: '登録後のURL' },
      ],
    },
    {
      id: 'custom-form',
      type: 'custom-form',
      category: 'form',
      name: 'カスタムフォーム',
      description: '自由にフィールドを設定できるフォーム',
      icon: 'FileInput',
      defaultProps: [
        { key: 'title', label: 'タイトル', type: 'text', value: 'お問い合わせ', placeholder: 'フォームタイトル' },
        { key: 'fields', label: 'フィールド（名前|タイプ）', type: 'textarea', value: 'お名前|text\nメールアドレス|email\nご質問|textarea', placeholder: 'フィールド名|text/email/textarea/select' },
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: '送信する', placeholder: 'ボタンテキスト' },
        { key: 'buttonColor', label: 'ボタン色', type: 'color', value: '#3b82f6' },
      ],
    },
    {
      id: 'comment',
      type: 'comment',
      category: 'form',
      name: 'コメント',
      description: 'コメント投稿・表示エリア',
      icon: 'MessageSquare',
      defaultProps: [
        { key: 'title', label: 'タイトル', type: 'text', value: 'コメントを残す', placeholder: 'セクションタイトル' },
        { key: 'placeholder', label: 'プレースホルダー', type: 'text', value: 'コメントを入力...', placeholder: '入力欄のプレースホルダー' },
        { key: 'requireName', label: '名前必須', type: 'boolean', value: true },
        { key: 'requireEmail', label: 'メール必須', type: 'boolean', value: false },
      ],
    },
  ],

  // ========================================
  // ボタン (2要素)
  // ========================================
  button: [
    {
      id: 'button',
      type: 'button',
      category: 'button',
      name: 'ボタン',
      description: 'クリック可能なCTAボタン',
      icon: 'MousePointer',
      defaultProps: [
        { key: 'text', label: 'テキスト', type: 'text', value: '今すぐ申し込む', placeholder: 'ボタンテキスト' },
        { key: 'subText', label: 'サブテキスト', type: 'text', value: '', placeholder: 'ボタン下のテキスト' },
        { key: 'action', label: '動作', type: 'select', value: 'link', options: [
          { label: 'ページを開く', value: 'link' },
          { label: '要素へスクロール', value: 'scroll' },
          { label: '要素を表示/非表示', value: 'toggle' },
        ]},
        { key: 'url', label: 'リンクURL', type: 'text', value: '', placeholder: 'https://' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#3b82f6' },
        { key: 'textColor', label: '文字色', type: 'color', value: '#ffffff' },
        { key: 'fontSize', label: '文字サイズ', type: 'number', value: 18 },
        { key: 'width', label: '幅（%）', type: 'number', value: 100 },
        { key: 'borderRadius', label: '角丸み', type: 'number', value: 8 },
        { key: 'animation', label: 'アニメーション', type: 'select', value: 'none', options: [
          { label: 'なし', value: 'none' },
          { label: 'ズームイン', value: 'zoom' },
          { label: 'ぷるぷる', value: 'shake' },
          { label: 'ゆらゆら', value: 'swing' },
          { label: 'ジャンプ', value: 'jump' },
          { label: 'キラッ', value: 'shine' },
        ]},
      ],
    },
    {
      id: 'next-link',
      type: 'next-link',
      category: 'button',
      name: '次へ進むリンク',
      description: 'ファネルの次ステップへ進むリンク',
      icon: 'ArrowRight',
      defaultProps: [
        { key: 'text', label: 'テキスト', type: 'text', value: '次へ進む →', placeholder: 'リンクテキスト' },
        { key: 'style', label: 'スタイル', type: 'select', value: 'text', options: [
          { label: 'テキストリンク', value: 'text' },
          { label: 'ボタン', value: 'button' },
        ]},
        { key: 'textColor', label: '文字色', type: 'color', value: '#3b82f6' },
        { key: 'textAlign', label: '配置', type: 'select', value: 'center', options: [
          { label: '左揃え', value: 'left' },
          { label: '中央', value: 'center' },
          { label: '右揃え', value: 'right' },
        ]},
      ],
    },
  ],

  // ========================================
  // LINE連携 (2要素)
  // ========================================
  line: [
    {
      id: 'line-add-button',
      type: 'line-add-button',
      category: 'line',
      name: 'LINE友だち追加ボタン',
      description: 'LINE公式アカウントへの友だち追加ボタン',
      icon: 'MessageCircle',
      defaultProps: [
        { key: 'lineId', label: 'LINE ID', type: 'text', value: '', placeholder: '@xxx' },
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: 'LINEで友だち追加', placeholder: 'ボタンテキスト' },
        { key: 'subText', label: 'サブテキスト', type: 'text', value: '無料特典をプレゼント！', placeholder: 'サブテキスト' },
        { key: 'size', label: 'サイズ', type: 'select', value: 'large', options: [
          { label: '小', value: 'small' },
          { label: '中', value: 'medium' },
          { label: '大', value: 'large' },
        ]},
      ],
    },
    {
      id: 'line-qr',
      type: 'line-qr',
      category: 'line',
      name: 'LINE友だち追加QRコード',
      description: 'LINE友だち追加用QRコード表示',
      icon: 'QrCode',
      defaultProps: [
        { key: 'lineId', label: 'LINE ID', type: 'text', value: '', placeholder: '@xxx' },
        { key: 'size', label: 'QRサイズ', type: 'number', value: 200 },
        { key: 'caption', label: 'キャプション', type: 'text', value: 'スマホでスキャンして友だち追加', placeholder: 'QR下のテキスト' },
      ],
    },
  ],

  // ========================================
  // 決済 (3要素)
  // ========================================
  payment: [
    {
      id: 'payment-form',
      type: 'payment-form',
      category: 'payment',
      name: '決済フォーム',
      description: 'クレジットカード決済フォーム',
      icon: 'CreditCard',
      defaultProps: [
        { key: 'productName', label: '商品名', type: 'text', value: '商品名', placeholder: '商品名' },
        { key: 'price', label: '価格', type: 'number', value: 9800 },
        { key: 'currency', label: '通貨', type: 'select', value: 'JPY', options: [
          { label: '日本円', value: 'JPY' },
          { label: 'USD', value: 'USD' },
        ]},
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: '購入する', placeholder: 'ボタンテキスト' },
        { key: 'buttonColor', label: 'ボタン色', type: 'color', value: '#dc2626' },
      ],
    },
    {
      id: 'purchase-button',
      type: 'purchase-button',
      category: 'payment',
      name: '購入ボタン',
      description: '商品購入ページへ遷移するボタン',
      icon: 'ShoppingCart',
      defaultProps: [
        { key: 'text', label: 'ボタンテキスト', type: 'text', value: '今すぐ購入', placeholder: 'ボタンテキスト' },
        { key: 'price', label: '価格表示', type: 'text', value: '¥9,800', placeholder: '価格' },
        { key: 'url', label: '購入ページURL', type: 'text', value: '', placeholder: 'https://' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#dc2626' },
        { key: 'animation', label: 'アニメーション', type: 'select', value: 'shine', options: [
          { label: 'なし', value: 'none' },
          { label: 'キラッ', value: 'shine' },
          { label: 'ぷるぷる', value: 'shake' },
        ]},
      ],
    },
    {
      id: 'product-list',
      type: 'product-list',
      category: 'payment',
      name: '購入商品一覧',
      description: '購入可能な商品のリスト表示',
      icon: 'Package',
      defaultProps: [
        { key: 'title', label: 'タイトル', type: 'text', value: '商品一覧', placeholder: 'セクションタイトル' },
        { key: 'products', label: '商品（名前|価格|URL）', type: 'textarea', value: 'ベーシック|¥9,800|/checkout/basic\nプロ|¥19,800|/checkout/pro', placeholder: '商品名|価格|URL（改行で追加）' },
        { key: 'layout', label: 'レイアウト', type: 'select', value: 'grid', options: [
          { label: 'グリッド', value: 'grid' },
          { label: 'リスト', value: 'list' },
        ]},
      ],
    },
  ],

  // ========================================
  // その他 (7要素)
  // ========================================
  other: [
    {
      id: 'header',
      type: 'header',
      category: 'other',
      name: 'ヘッダー',
      description: 'ページ上部のヘッダー',
      icon: 'LayoutPanelTop',
      defaultProps: [
        { key: 'logo', label: 'ロゴ画像', type: 'image', value: '' },
        { key: 'logoText', label: 'ロゴテキスト', type: 'text', value: 'ブランド名', placeholder: 'ブランド名' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#ffffff' },
        { key: 'sticky', label: '固定表示', type: 'boolean', value: false },
      ],
    },
    {
      id: 'footer',
      type: 'footer',
      category: 'other',
      name: 'フッター',
      description: 'ページ下部のフッター',
      icon: 'LayoutPanelBottom',
      defaultProps: [
        { key: 'copyright', label: '著作権表示', type: 'text', value: '© 2026 Your Company. All rights reserved.', placeholder: 'コピーライト' },
        { key: 'links', label: 'リンク（改行区切り）', type: 'textarea', value: 'プライバシーポリシー\n特定商取引法に基づく表記\nお問い合わせ', placeholder: 'リンクテキスト' },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#1f2937' },
        { key: 'textColor', label: '文字色', type: 'color', value: '#ffffff' },
      ],
    },
    {
      id: 'countdown',
      type: 'countdown',
      category: 'other',
      name: 'カウントダウン',
      description: '期限までのカウントダウンタイマー',
      icon: 'Timer',
      defaultProps: [
        { key: 'title', label: 'タイトル', type: 'text', value: 'キャンペーン終了まで', placeholder: 'タイトル' },
        { key: 'endDate', label: '終了日時', type: 'text', value: '2026-12-31 23:59:59', placeholder: 'YYYY-MM-DD HH:MM:SS' },
        { key: 'style', label: 'スタイル', type: 'select', value: 'box', options: [
          { label: 'ボックス', value: 'box' },
          { label: 'フラット', value: 'flat' },
          { label: '緊急', value: 'urgent' },
        ]},
        { key: 'showDays', label: '日数表示', type: 'boolean', value: true },
        { key: 'backgroundColor', label: '背景色', type: 'color', value: '#dc2626' },
      ],
    },
    {
      id: 'progress-bar',
      type: 'progress-bar',
      category: 'other',
      name: 'プログレスバー',
      description: '進捗状況を表示するバー',
      icon: 'BarChart2',
      defaultProps: [
        { key: 'label', label: 'ラベル', type: 'text', value: '残り枠', placeholder: 'ラベル' },
        { key: 'value', label: '現在値', type: 'number', value: 73 },
        { key: 'max', label: '最大値', type: 'number', value: 100 },
        { key: 'showPercentage', label: '％表示', type: 'boolean', value: true },
        { key: 'barColor', label: 'バー色', type: 'color', value: '#22c55e' },
      ],
    },
    {
      id: 'custom-html',
      type: 'custom-html',
      category: 'other',
      name: 'カスタムHTML',
      description: '自由にHTMLコードを埋め込み',
      icon: 'Code',
      defaultProps: [
        { key: 'html', label: 'HTMLコード', type: 'textarea', value: '<div style="padding: 20px; background: #f3f4f6; border-radius: 8px;">\n  カスタムHTMLコンテンツ\n</div>', placeholder: 'HTMLコードを入力' },
      ],
    },
    {
      id: 'event-form',
      type: 'event-form',
      category: 'other',
      name: 'イベント申込フォーム',
      description: 'イベント・セミナーの申込フォーム',
      icon: 'CalendarPlus',
      defaultProps: [
        { key: 'title', label: 'イベント名', type: 'text', value: '無料セミナー', placeholder: 'イベント名' },
        { key: 'date', label: '開催日時', type: 'text', value: '', placeholder: '2026年1月1日 14:00〜' },
        { key: 'location', label: '開催場所', type: 'text', value: 'オンライン（Zoom）', placeholder: '場所' },
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: '今すぐ申し込む', placeholder: 'ボタンテキスト' },
        { key: 'buttonColor', label: 'ボタン色', type: 'color', value: '#3b82f6' },
      ],
    },
    {
      id: 'event-schedule',
      type: 'event-schedule',
      category: 'other',
      name: 'イベント日程一覧',
      description: '複数日程のイベント一覧',
      icon: 'CalendarDays',
      defaultProps: [
        { key: 'title', label: 'タイトル', type: 'text', value: '開催日程', placeholder: 'セクションタイトル' },
        { key: 'dates', label: '日程（日時|場所|残席）', type: 'textarea', value: '1/10 14:00〜|東京|残り5席\n1/15 14:00〜|オンライン|残り10席', placeholder: '日時|場所|残席（改行で追加）' },
        { key: 'buttonText', label: 'ボタンテキスト', type: 'text', value: 'この日程で申し込む', placeholder: 'ボタンテキスト' },
      ],
    },
  ],
};

/**
 * カテゴリ表示名の定義（UTAGE互換）
 */
export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  basic: '基本',
  headline: '見出し',
  content: 'コンテンツ',
  video: '動画',
  form: 'フォーム',
  button: 'ボタン',
  line: 'LINE',
  payment: '決済',
  other: 'その他',
};

/**
 * カテゴリアイコンの定義
 */
export const CATEGORY_ICONS: Record<ComponentCategory, string> = {
  basic: 'LayoutGrid',
  headline: 'Heading',
  content: 'FileText',
  video: 'Video',
  form: 'FileInput',
  button: 'MousePointer',
  line: 'MessageCircle',
  payment: 'CreditCard',
  other: 'Settings',
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

/**
 * コンポーネント総数を取得
 */
export function getComponentCount(): number {
  return getAllComponents().length;
}
