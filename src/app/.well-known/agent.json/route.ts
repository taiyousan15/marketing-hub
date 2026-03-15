/**
 * A2A Agent Card
 * Google A2A Protocol: /.well-known/agent.json
 */

import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://marketing-hub.example.com"

  return NextResponse.json({
    name: "Marketing Hub Agent",
    description: "AI-powered marketing automation platform. Manage contacts, events, funnels, campaigns, CRM pipelines, courses, automation rules, and analytics.",
    version: "3.0.0",
    url: baseUrl,
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["application/json"],
    skills: [
      {
        id: "contact-management",
        name: "Contact Management",
        description: "Create, search, update, delete contacts. Add/remove tags.",
        examples: [
          "新しいリードを登録してください",
          "メールアドレスで連絡先を検索してください",
          "連絡先にタグを付与してください",
          "連絡先を削除してください",
        ],
      },
      {
        id: "tag-management",
        name: "Tag Management",
        description: "List and manage contact tags",
        examples: [
          "全タグ一覧を表示してください",
          "連絡先からタグを外してください",
        ],
      },
      {
        id: "campaign-management",
        name: "Campaign Management",
        description: "Create and manage email/LINE campaigns with analytics",
        examples: [
          "メールキャンペーンを作成してください",
          "キャンペーン一覧を表示してください",
          "キャンペーンの配信結果を確認してください",
        ],
      },
      {
        id: "product-order-management",
        name: "Product & Order Management",
        description: "Manage products, view orders and subscriptions",
        examples: [
          "商品一覧を表示してください",
          "最近の注文を確認してください",
          "アクティブなサブスクリプションを表示してください",
        ],
      },
      {
        id: "crm-pipeline",
        name: "CRM Pipeline",
        description: "Manage sales pipelines, deals, and deal stages",
        examples: [
          "パイプライン一覧を表示してください",
          "新しいディールを作成してください",
          "ディールのステージを更新してください",
        ],
      },
      {
        id: "event-management",
        name: "Event & Webinar Management",
        description: "Create and manage seminars, webinars, consultations, and live streams",
        examples: [
          "来週のセミナーを作成してください",
          "イベント一覧を表示してください",
          "イベントの申込者数を確認してください",
        ],
      },
      {
        id: "funnel-management",
        name: "Funnel Management",
        description: "View and manage sales funnels and landing pages",
        examples: [
          "アクティブなファネル一覧を表示してください",
          "ファネルの詳細を確認してください",
        ],
      },
      {
        id: "form-management",
        name: "Form Management",
        description: "Manage forms and view submissions",
        examples: [
          "フォーム一覧を表示してください",
          "フォームの回答を確認してください",
        ],
      },
      {
        id: "video-management",
        name: "Video Management",
        description: "Manage video content with email gate functionality",
        examples: [
          "公開中の動画一覧を表示してください",
        ],
      },
      {
        id: "course-management",
        name: "Course & Membership Management",
        description: "Manage online courses, lessons, and student enrollments",
        examples: [
          "コース一覧を表示してください",
          "コースの受講者一覧を確認してください",
          "コースに生徒を登録してください",
        ],
      },
      {
        id: "automation-journey",
        name: "Automation & Journey",
        description: "Manage automation rules and marketing journeys",
        examples: [
          "自動化ルール一覧を表示してください",
          "ジャーニー一覧を表示してください",
          "ジャーニーの実行状況を確認してください",
        ],
      },
      {
        id: "segment-management",
        name: "Segment Management",
        description: "View and manage contact segments",
        examples: [
          "セグメント一覧を表示してください",
        ],
      },
      {
        id: "line-integration",
        name: "LINE Integration",
        description: "Manage LINE projects, send broadcast/segment messages, and configure step campaigns",
        examples: [
          "LINEプロジェクト一覧を表示してください",
          "LINE一斉配信を実行してください",
          "セグメント条件でLINEメッセージを送信してください",
        ],
      },
      {
        id: "line-rich-menu-management",
        name: "LINE Rich Menu Management",
        description: "Manage segment-based rich menus with tab switching. Automatically assign menus based on contact attributes (score, tags, tier). Support tab groups for multi-tab navigation.",
        examples: [
          "リッチメニュー一覧を表示してください",
          "タブグループを切り替えてください",
          "全コンタクトのリッチメニューを再評価してください",
          "スコア50以上のユーザーに特別メニューを設定してください",
        ],
      },
      {
        id: "line-auto-reply",
        name: "LINE Auto Reply",
        description: "Configure keyword-based auto-reply rules with exact/contains/startsWith/regex matching. Supports text, flex message, image, video, and sticker replies with priority ordering.",
        examples: [
          "自動応答ルール一覧を表示してください",
          "「営業時間」キーワードで自動応答を作成してください",
          "正規表現マッチの自動応答ルールを追加してください",
          "自動応答の優先度を変更してください",
        ],
      },
      {
        id: "affiliate-management",
        name: "Affiliate & Partner Management",
        description: "Manage affiliate programs, partners, and conversion tracking",
        examples: [
          "パートナー一覧を表示してください",
          "アフィリエイト成果を確認してください",
          "パートナーの支払い状況を確認してください",
        ],
      },
      {
        id: "livestream-management",
        name: "Live Stream Management",
        description: "Manage live streams and automated webinars",
        examples: [
          "ライブ配信一覧を表示してください",
          "自動ウェビナーの設定を確認してください",
        ],
      },
      {
        id: "analytics",
        name: "Marketing Analytics",
        description: "Get marketing performance metrics, revenue analytics, UTM tracking, and global search",
        examples: [
          "今月のマーケティング指標を教えてください",
          "売上分析を表示してください",
          "UTMキャンペーンの成果を確認してください",
          "「セミナー」で全体検索してください",
        ],
      },
      {
        id: "messaging",
        name: "Direct Messaging",
        description: "Send emails, LINE messages, and SMS to contacts individually or by tag. Track open/read status.",
        examples: [
          "タグ「VIP」の連絡先にメールを送ってください",
          "LINE登録者にメッセージを一斉配信してください",
          "SMSでリマインダーを送信してください",
          "既読になっていない人のリストを出してください",
        ],
      },
      {
        id: "message-tracking",
        name: "Message Tracking & Reports",
        description: "View message delivery history, open/click rates, and identify unread contacts",
        examples: [
          "メールの開封レポートを表示してください",
          "未開封の連絡先一覧を出してください",
          "キャンペーンのクリック率を確認してください",
        ],
      },
      {
        id: "event-reminder",
        name: "Event Reminder",
        description: "Send reminder messages to event/seminar registrants via email, LINE, or SMS",
        examples: [
          "明日のセミナー参加者にリマインドメールを送ってください",
          "イベント申込者にLINEでリマインダーを送信してください",
        ],
      },
      {
        id: "bulk-tagging",
        name: "Conditional Bulk Tagging",
        description: "Tag contacts based on conditions (lifecycle stage, score, existing tags, opt-in status, etc.)",
        examples: [
          "スコア50以上の連絡先に「ホットリード」タグを付けてください",
          "メールオプトイン済みで「セミナー参加」タグがある人に「VIP」タグを付けてください",
        ],
      },
      {
        id: "lp-builder",
        name: "Landing Page Builder",
        description: "Create and update landing pages (funnel pages) with component-based content",
        examples: [
          "新しいLPを作成してください",
          "ファネルページのコンテンツを更新してください",
        ],
      },
      {
        id: "lp-template-builder",
        name: "LP Template Builder",
        description: "Create landing pages from 16 pre-built templates across 7 categories (optin, sales, webinar, launch, consultation, membership, event). 50 components in 11 categories including social proof, LINE integration, payment forms, and interactive elements.",
        examples: [
          "オプトインLP用のテンプレートを表示してください",
          "セールスページテンプレートでLPを作成してください",
          "利用可能なLPコンポーネント一覧を表示してください",
          "ウェビナー用LPをテンプレートから生成してください",
        ],
      },
    ],
    authentication: {
      schemes: ["bearer"],
      credentials: `POST ${baseUrl}/api/mcp with Authorization: Bearer TENANT_ID:SECRET`,
    },
    endpoints: {
      mcp: `${baseUrl}/api/mcp`,
    },
  })
}
