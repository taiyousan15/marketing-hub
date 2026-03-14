/**
 * Marketing Hub MCP Server
 *
 * Model Context Protocol (MCP) サーバーエンドポイント
 * 外部AIエージェントがMarketing Hubの機能をツールとして利用可能にする
 *
 * POST /api/mcp - JSON-RPC 2.0 メッセージ処理
 * GET  /api/mcp - サーバー情報
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

// ============================================================
// 型定義
// ============================================================

interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: "object"
    properties: Record<string, unknown>
    required?: string[]
  }
}

interface JsonRpcRequest {
  jsonrpc: "2.0"
  id: string | number | null
  method: string
  params?: unknown
}

// ============================================================
// 認証ヘルパー
// ============================================================

async function authenticateRequest(request: NextRequest): Promise<{ tenantId: string } | null> {
  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.slice(7)

  // パートナーアクセストークンで認証
  const partner = await prisma.partner.findFirst({
    where: { partnerAccessToken: token },
  }).catch(() => null)

  if (partner) {
    return { tenantId: partner.tenantId }
  }

  // テナントのシークレットキー (TENANT_ID:SECRET 形式)
  const parts = token.split(":")
  if (parts.length === 2) {
    const [tenantId, secret] = parts
    const tenant = await prisma.tenant.findFirst({
      where: { id: tenantId },
      select: { id: true, settings: true },
    }).catch(() => null)

    if (tenant) {
      const settings = tenant.settings as Record<string, unknown>
      if (settings?.mcpSecret === secret) {
        return { tenantId: tenant.id }
      }
    }
  }

  return null
}

// ============================================================
// ツール定義
// ============================================================

const TOOLS: MCPTool[] = [
  {
    name: "contacts_list",
    description: "連絡先（リード・顧客）の一覧を取得する。フィルタリング可能。",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "取得件数 (最大100)", default: 20 },
        search: { type: "string", description: "名前またはメールで検索" },
        tag: { type: "string", description: "タグでフィルタ" },
      },
    },
  },
  {
    name: "contacts_create",
    description: "新しい連絡先を作成する",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "名前" },
        email: { type: "string", description: "メールアドレス" },
        phone: { type: "string", description: "電話番号" },
      },
      required: ["email"],
    },
  },
  {
    name: "contacts_search",
    description: "連絡先をメールアドレスで検索する",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "検索するメールアドレス" },
      },
      required: ["email"],
    },
  },
  {
    name: "events_list",
    description: "イベント・セミナー・ウェビナーの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELED"],
          description: "ステータスでフィルタ",
        },
        type: {
          type: "string",
          enum: ["SEMINAR", "CONSULTATION", "WEBINAR", "LIVESTREAM"],
          description: "種別でフィルタ",
        },
        limit: { type: "number", description: "取得件数 (最大50)", default: 10 },
      },
    },
  },
  {
    name: "events_create",
    description: "新しいイベントを作成する",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "イベント名" },
        type: {
          type: "string",
          enum: ["SEMINAR", "CONSULTATION", "WEBINAR", "LIVESTREAM"],
          description: "イベント種別",
        },
        startAt: { type: "string", description: "開始日時 (ISO 8601形式)" },
        endAt: { type: "string", description: "終了日時 (ISO 8601形式)" },
        isOnline: { type: "boolean", description: "オンライン開催かどうか", default: true },
        description: { type: "string", description: "説明" },
        capacity: { type: "number", description: "定員" },
      },
      required: ["name", "type", "startAt", "endAt"],
    },
  },
  {
    name: "funnels_list",
    description: "セールスファネルの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },
  {
    name: "videos_list",
    description: "動画コンテンツの一覧を取得する",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
          description: "ステータスでフィルタ",
        },
        limit: { type: "number", description: "取得件数 (最大20)", default: 10 },
      },
    },
  },
  {
    name: "analytics_summary",
    description: "マーケティング指標のサマリーを取得する（訪問者数・リード数・転換率など）",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "number", description: "過去何日間のデータか", default: 30 },
      },
    },
  },
]

// ============================================================
// ツール実行ハンドラー
// ============================================================

const contactsListSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  tag: z.string().optional(),
})

const contactsCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
})

const eventsListSchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(10),
})

const eventsCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["SEMINAR", "CONSULTATION", "WEBINAR", "LIVESTREAM"]),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  isOnline: z.boolean().default(true),
  description: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
})

const analyticsSchema = z.object({
  days: z.number().int().min(1).max(365).default(30),
})

async function executeTool(
  name: string,
  args: unknown,
  tenantId: string
): Promise<unknown> {
  switch (name) {
    case "contacts_list": {
      const { limit, search } = contactsListSchema.parse(args ?? {})
      const contacts = await prisma.contact.findMany({
        where: {
          tenantId,
          ...(search ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          } : {}),
        },
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { contacts, total: contacts.length }
    }

    case "contacts_create": {
      const validated = contactsCreateSchema.parse(args)
      const existing = await prisma.contact.findFirst({
        where: { tenantId, email: validated.email },
      })
      if (existing) {
        return { contact: existing, created: false, message: "既に存在する連絡先です" }
      }
      const contact = await prisma.contact.create({
        data: { tenantId, email: validated.email, name: validated.name ?? null, phone: validated.phone ?? null },
      })
      return { contact, created: true }
    }

    case "contacts_search": {
      const { email } = z.object({ email: z.string() }).parse(args)
      const contacts = await prisma.contact.findMany({
        where: { tenantId, email: { contains: email, mode: "insensitive" } },
        select: { id: true, name: true, email: true, phone: true },
        take: 10,
      })
      return { contacts }
    }

    case "events_list": {
      const { status, type, limit } = eventsListSchema.parse(args ?? {})
      const events = await prisma.event.findMany({
        where: {
          tenantId,
          ...(status ? { status: status as never } : {}),
          ...(type ? { type: type as never } : {}),
        },
        include: { _count: { select: { registrations: true } } },
        orderBy: { startAt: "asc" },
        take: limit,
      })
      return { events }
    }

    case "events_create": {
      const validated = eventsCreateSchema.parse(args)
      const event = await prisma.event.create({
        data: {
          tenantId,
          name: validated.name,
          type: validated.type as never,
          startAt: new Date(validated.startAt),
          endAt: new Date(validated.endAt),
          isOnline: validated.isOnline,
          description: validated.description ?? null,
          capacity: validated.capacity ?? null,
          timezone: "Asia/Tokyo",
          status: "SCHEDULED",
        },
      })
      return { event, message: `イベント「${event.name}」を作成しました` }
    }

    case "funnels_list": {
      const { limit } = z.object({ limit: z.number().default(10) }).parse(args ?? {})
      const funnels = await prisma.funnel.findMany({
        where: { tenantId },
        include: { _count: { select: { pages: true, steps: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { funnels }
    }

    case "videos_list": {
      const { status, limit } = z.object({
        status: z.string().optional(),
        limit: z.number().default(10),
      }).parse(args ?? {})
      const videos = await prisma.video.findMany({
        where: {
          tenantId,
          ...(status ? { status: status as never } : {}),
        },
        include: { _count: { select: { gates: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { videos }
    }

    case "analytics_summary": {
      const { days } = analyticsSchema.parse(args ?? {})
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const [totalContacts, newContacts, totalEvents, upcomingEvents] = await Promise.all([
        prisma.contact.count({ where: { tenantId } }),
        prisma.contact.count({ where: { tenantId, createdAt: { gte: since } } }),
        prisma.event.count({ where: { tenantId } }),
        prisma.event.count({ where: { tenantId, status: "SCHEDULED", startAt: { gte: new Date() } } }),
      ])

      return {
        period: `過去${days}日間`,
        contacts: { total: totalContacts, new: newContacts },
        events: { total: totalEvents, upcoming: upcomingEvents },
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// ============================================================
// HTTP ハンドラー
// ============================================================

export async function GET() {
  return NextResponse.json({
    name: "marketing-hub",
    version: "1.0.0",
    description: "Marketing Hub MCP Server - AI agents can manage contacts, events, funnels, and videos",
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: { listChanged: false },
    },
    tools: TOOLS.map(t => ({ name: t.name, description: t.description })),
  })
}

export async function POST(request: NextRequest) {
  // CORS対応
  const origin = request.headers.get("origin")
  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
  if (origin) {
    corsHeaders["Access-Control-Allow-Origin"] = origin
  }

  let body: JsonRpcRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400, headers: corsHeaders }
    )
  }

  const { id, method, params } = body

  const respond = (result: unknown) =>
    NextResponse.json({ jsonrpc: "2.0", id, result }, { headers: corsHeaders })

  const respondError = (code: number, message: string, status = 200) =>
    NextResponse.json(
      { jsonrpc: "2.0", id, error: { code, message } },
      { status, headers: corsHeaders }
    )

  // initialize - 認証不要
  if (method === "initialize") {
    return respond({
      protocolVersion: "2024-11-05",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "marketing-hub", version: "1.0.0" },
    })
  }

  // notifications/initialized - no response needed
  if (method === "notifications/initialized") {
    return new NextResponse(null, { status: 204, headers: corsHeaders })
  }

  // tools/list - 認証不要
  if (method === "tools/list") {
    return respond({ tools: TOOLS })
  }

  // tools/call - 認証必要
  if (method === "tools/call") {
    const auth = await authenticateRequest(request)
    if (!auth) {
      return respondError(-32001, "Unauthorized: Bearer token required", 401)
    }

    const { name, arguments: args } = (params as { name: string; arguments: unknown }) ?? {}
    if (!name) {
      return respondError(-32602, "Invalid params: missing tool name")
    }

    try {
      const result = await executeTool(name, args, auth.tenantId)
      return respond({
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return respondError(-32602, `Invalid arguments: ${error.issues.map(i => i.message).join(", ")}`)
      }
      const message = error instanceof Error ? error.message : "Tool execution failed"
      return respondError(-32603, message)
    }
  }

  return respondError(-32601, `Method not found: ${method}`)
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
