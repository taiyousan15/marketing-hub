/**
 * A2A Agent Card
 * Google A2A Protocol: /.well-known/agent.json
 */

import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://marketing-hub.example.com"

  return NextResponse.json({
    name: "Marketing Hub Agent",
    description: "AI-powered marketing automation platform. Manage contacts, events, funnels, videos, and campaigns.",
    version: "1.0.0",
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
        description: "Create, search, and manage marketing contacts and leads",
        examples: [
          "新しいリードを登録してください",
          "メールアドレスで連絡先を検索してください",
          "最近追加された連絡先を一覧表示してください",
        ],
      },
      {
        id: "event-management",
        name: "Event & Webinar Management",
        description: "Create and manage seminars, webinars, consultations, and live streams",
        examples: [
          "来週のセミナーを作成してください",
          "予定されているイベント一覧を教えてください",
          "ウェビナーの申込状況を確認してください",
        ],
      },
      {
        id: "funnel-management",
        name: "Funnel Management",
        description: "View and manage sales funnels and landing pages",
        examples: [
          "アクティブなファネル一覧を表示してください",
          "ファネルの転換率を確認してください",
        ],
      },
      {
        id: "video-management",
        name: "Video Management",
        description: "Manage video content with email gate functionality",
        examples: [
          "公開中の動画一覧を表示してください",
          "動画のリード獲得数を確認してください",
        ],
      },
      {
        id: "analytics",
        name: "Marketing Analytics",
        description: "Get marketing performance metrics and summaries",
        examples: [
          "今月のマーケティング指標を教えてください",
          "新規リード数を確認してください",
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
