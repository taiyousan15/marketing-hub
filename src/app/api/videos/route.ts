/**
 * 動画管理API
 * GET: 動画一覧取得
 * POST: 動画作成
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/tenant"
import { z } from "zod"
import { VideoStatus, VideoGateType } from "@prisma/client"

const createVideoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  videoUrl: z.string().min(1),
  thumbnailUrl: z.string().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  gateEnabled: z.boolean().default(false),
  gateType: z.nativeEnum(VideoGateType).default("EMAIL"),
  gateTitle: z.string().optional().nullable(),
  gateButtonLabel: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as VideoStatus | null

    const videos = await prisma.video.findMany({
      where: {
        tenantId: currentUser.tenantId,
        ...(status ? { status } : {}),
      },
      include: {
        _count: { select: { gates: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Videos GET error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = createVideoSchema.parse(body)

    const video = await prisma.video.create({
      data: {
        tenantId: currentUser.tenantId,
        title: validated.title,
        description: validated.description ?? null,
        videoUrl: validated.videoUrl,
        thumbnailUrl: validated.thumbnailUrl ?? null,
        duration: validated.duration ?? null,
        gateEnabled: validated.gateEnabled,
        gateType: validated.gateType,
        gateTitle: validated.gateTitle ?? null,
        gateButtonLabel: validated.gateButtonLabel ?? null,
        status: VideoStatus.DRAFT,
      },
      include: {
        _count: { select: { gates: true } },
      },
    })

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Videos POST error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 })
  }
}
