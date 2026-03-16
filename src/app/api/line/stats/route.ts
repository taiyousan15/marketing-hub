/**
 * LINEプロジェクト別統計API
 * プロジェクトごとの友達数・流入元・配信実績を集計
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId")
    const projectId = searchParams.get("projectId")

    if (!tenantId) {
      return NextResponse.json({ error: "tenantId is required" }, { status: 400 })
    }

    const projectWhere = {
      tenantId,
      ...(projectId && { id: projectId }),
    }

    const projects = await prisma.lineProject.findMany({
      where: projectWhere,
      include: {
        accounts: {
          select: {
            id: true,
            botDisplayName: true,
            currentFriends: true,
            isActive: true,
            isConnected: true,
          },
        },
        distributionSetting: true,
      },
      orderBy: { createdAt: "asc" },
    })

    // プロジェクト別コンタクト数・UTM内訳を一括取得
    const projectIds = projects.map(p => p.id)

    const [contactsByProject, utmByProject, recentCampaigns] = await Promise.all([
      // プロジェクト別コンタクト総数
      prisma.$queryRaw<Array<{ lineProjectId: string; count: bigint }>>`
        SELECT "lineProjectId", COUNT(*) as count
        FROM "Contact"
        WHERE "tenantId" = ${tenantId}
          AND "lineProjectId" = ANY(${projectIds}::text[])
        GROUP BY "lineProjectId"
      `,
      // プロジェクト別UTM流入内訳
      prisma.$queryRaw<Array<{
        lineProjectId: string
        utmSource: string | null
        count: bigint
      }>>`
        SELECT "lineProjectId", "utmSource", COUNT(*) as count
        FROM "Contact"
        WHERE "tenantId" = ${tenantId}
          AND "lineProjectId" = ANY(${projectIds}::text[])
        GROUP BY "lineProjectId", "utmSource"
        ORDER BY count DESC
      `,
      // プロジェクト関連キャンペーンの最新実績（LINE_STEPキャンペーン）
      prisma.campaign.findMany({
        where: {
          tenantId,
          type: "LINE_STEP",
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ])

    const contactCountMap = new Map(
      contactsByProject.map(r => [r.lineProjectId, Number(r.count)])
    )

    const utmMap = new Map<string, Array<{ source: string; count: number }>>()
    for (const r of utmByProject) {
      if (!r.lineProjectId) continue
      const existing = utmMap.get(r.lineProjectId) ?? []
      existing.push({ source: r.utmSource ?? "(direct)", count: Number(r.count) })
      utmMap.set(r.lineProjectId, existing)
    }

    const result = projects.map(project => {
      const totalFriends = project.accounts.reduce(
        (sum, acc) => sum + (acc.currentFriends ?? 0),
        0
      )
      const activeAccounts = project.accounts.filter(
        a => a.isActive && a.isConnected
      ).length

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        color: project.color,
        isActive: project.isActive,
        totalAccounts: project.accounts.length,
        activeAccounts,
        totalFriends,
        totalContacts: contactCountMap.get(project.id) ?? 0,
        distributionEnabled: project.distributionSetting?.isEnabled ?? false,
        distributionType: project.distributionSetting?.distributionType ?? "ROUND_ROBIN",
        accounts: project.accounts,
        utmBreakdown: utmMap.get(project.id) ?? [],
      }
    })

    // 全体サマリー
    const summary = {
      totalProjects: projects.length,
      totalFriends: result.reduce((s, p) => s + p.totalFriends, 0),
      totalContacts: result.reduce((s, p) => s + p.totalContacts, 0),
      totalAccounts: result.reduce((s, p) => s + p.totalAccounts, 0),
    }

    return NextResponse.json({
      projects: result,
      summary,
      recentCampaigns,
    })
  } catch (error) {
    console.error("LINE stats error:", error)
    return NextResponse.json({ error: "Failed to fetch LINE stats" }, { status: 500 })
  }
}
