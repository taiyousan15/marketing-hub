/**
 * UTMトラッキング分析API
 * GET: UTM別の流入・コンバージョン集計
 * POST: コンタクト登録時のUTMパラメータ記録
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const utmUpdateSchema = z.object({
  contactId: z.string(),
  tenantId: z.string(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  utmTerm: z.string().optional(),
  metaAdId: z.string().optional(),
  metaAdsetId: z.string().optional(),
  metaCampaignId: z.string().optional(),
  metaAdAccountId: z.string().optional(),
  lineProjectId: z.string().optional(),
})

// UTM分析データ取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const groupBy = searchParams.get("groupBy") ?? "utmSource"

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 })
    }

    const dateFilter = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    }

    const whereClause = {
      tenantId,
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    }

    // UTMソース別集計
    const [bySource, byMedium, byCampaign, total, lineProjectBreakdown] =
      await Promise.all([
        // ソース別
        prisma.$queryRaw<Array<{ utmSource: string | null; count: bigint }>>`
          SELECT "utmSource", COUNT(*) as count
          FROM "Contact"
          WHERE "tenantId" = ${tenantId}
            ${from ? prisma.$queryRaw`AND "createdAt" >= ${new Date(from)}` : prisma.$queryRaw`AND 1=1`}
            ${to ? prisma.$queryRaw`AND "createdAt" <= ${new Date(to)}` : prisma.$queryRaw`AND 1=1`}
          GROUP BY "utmSource"
          ORDER BY count DESC
          LIMIT 20
        `,
        // メディア別
        prisma.$queryRaw<Array<{ utmMedium: string | null; count: bigint }>>`
          SELECT "utmMedium", COUNT(*) as count
          FROM "Contact"
          WHERE "tenantId" = ${tenantId}
          GROUP BY "utmMedium"
          ORDER BY count DESC
          LIMIT 20
        `,
        // キャンペーン別
        prisma.$queryRaw<Array<{ utmCampaign: string | null; count: bigint }>>`
          SELECT "utmCampaign", COUNT(*) as count
          FROM "Contact"
          WHERE "tenantId" = ${tenantId}
          GROUP BY "utmCampaign"
          ORDER BY count DESC
          LIMIT 20
        `,
        // 総数
        prisma.contact.count({ where: whereClause }),
        // LINEプロジェクト別内訳
        prisma.$queryRaw<Array<{
          lineProjectId: string | null
          projectName: string | null
          utmSource: string | null
          count: bigint
        }>>`
          SELECT c."lineProjectId", lp."name" as "projectName", c."utmSource", COUNT(*) as count
          FROM "Contact" c
          LEFT JOIN "LineProject" lp ON c."lineProjectId" = lp."id"
          WHERE c."tenantId" = ${tenantId}
          GROUP BY c."lineProjectId", lp."name", c."utmSource"
          ORDER BY count DESC
          LIMIT 50
        `,
      ])

    return NextResponse.json({
      total,
      bySource: bySource.map(r => ({
        source: r.utmSource ?? "(direct)",
        count: Number(r.count),
      })),
      byMedium: byMedium.map(r => ({
        medium: r.utmMedium ?? "(none)",
        count: Number(r.count),
      })),
      byCampaign: byCampaign.map(r => ({
        campaign: r.utmCampaign ?? "(none)",
        count: Number(r.count),
      })),
      lineProjectBreakdown: lineProjectBreakdown.map(r => ({
        lineProjectId: r.lineProjectId,
        projectName: r.projectName ?? "(unassigned)",
        utmSource: r.utmSource ?? "(direct)",
        count: Number(r.count),
      })),
    })
  } catch (error) {
    console.error("UTM analytics error:", error)
    return NextResponse.json({ error: "Failed to fetch UTM analytics" }, { status: 500 })
  }
}

// UTMパラメータをコンタクトに記録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = utmUpdateSchema.parse(body)
    const { contactId, tenantId, lineProjectId, ...utmFields } = validated

    // 既存コンタクトのUTMが未設定の場合のみ更新（上書きしない）
    let contact: { utmSource?: string | null; lineProjectId?: string | null } | null = null
    try {
      contact = await prisma.contact.findFirst({
        where: { id: contactId, tenantId },
        select: { utmSource: true, lineProjectId: true } as never,
      }) as { utmSource?: string | null; lineProjectId?: string | null } | null
    } catch (_e) {
      // Fields may not exist in schema; fall back to a bare existence check
      const bare = await prisma.contact.findFirst({ where: { id: contactId, tenantId } })
      contact = bare ? {} : null
    }

    if (contact === null) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 })
    }

    const updateData: Record<string, string | undefined> = {}

    // UTMは最初の流入のみ記録（上書き防止）
    if (!contact.utmSource) {
      Object.assign(updateData, utmFields)
    }

    // LINEプロジェクトは常に更新
    if (lineProjectId && !contact.lineProjectId) {
      updateData.lineProjectId = lineProjectId
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No update needed", contact })
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: updateData,
    })

    return NextResponse.json({ contact: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("UTM update error:", error)
    return NextResponse.json({ error: "Failed to update UTM data" }, { status: 500 })
  }
}
