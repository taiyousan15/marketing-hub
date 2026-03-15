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
import { TOOLS } from "@/lib/mcp/tool-definitions"
import { executeTool } from "@/lib/mcp/tool-executor"

// ============================================================
// 型定義
// ============================================================

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
// HTTP ハンドラー
// ============================================================

export async function GET() {
  return NextResponse.json({
    name: "marketing-hub",
    version: "2.0.0",
    description: "Marketing Hub MCP Server - 42 tools for contacts, events, funnels, campaigns, CRM, courses, automation, analytics, and more",
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
      serverInfo: { name: "marketing-hub", version: "2.0.0" },
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
