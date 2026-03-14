/**
 * 動画ゲートAPI
 * POST: 視聴情報登録（メールゲート通過）
 * GET: ゲート通過者一覧
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"

const gateEntrySchema = z.object({
  email: z.string().email(),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = gateEntrySchema.parse(body)

    const video = await prisma.video.findUnique({
      where: { id },
      select: { id: true, gateEnabled: true, status: true },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    if (video.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Video not available" }, { status: 403 })
    }

    await prisma.videoGateEntry.upsert({
      where: {
        videoId_email: { videoId: id, email: validated.email },
      },
      update: { watchedAt: new Date() },
      create: {
        videoId: id,
        email: validated.email,
        name: validated.name ?? null,
        phone: validated.phone ?? null,
      },
    })

    await prisma.video.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Video gate POST error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to register gate entry" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { searchParams } = new URL(request.url)
    const tenantCheck = searchParams.get("tenantId")

    if (!tenantCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const video = await prisma.video.findFirst({
      where: { id, tenantId: tenantCheck },
      include: {
        gates: { orderBy: { watchedAt: "desc" } },
        _count: { select: { gates: true } },
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json({ gates: video.gates, total: video._count.gates })
  } catch (error) {
    console.error("Video gate GET error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to fetch gate entries" }, { status: 500 })
  }
}
