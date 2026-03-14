/**
 * 動画詳細API
 * GET: 動画取得
 * PATCH: 動画更新
 * DELETE: 動画削除
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/tenant"
import { z } from "zod"
import { VideoStatus, VideoGateType } from "@prisma/client"

const updateVideoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  videoUrl: z.string().min(1).optional(),
  thumbnailUrl: z.string().optional().nullable(),
  duration: z.number().int().positive().optional().nullable(),
  status: z.nativeEnum(VideoStatus).optional(),
  gateEnabled: z.boolean().optional(),
  gateType: z.nativeEnum(VideoGateType).optional(),
  gateTitle: z.string().optional().nullable(),
  gateButtonLabel: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const video = await prisma.video.findFirst({
      where: { id, tenantId: currentUser.tenantId },
      include: {
        gates: {
          orderBy: { watchedAt: "desc" },
          take: 100,
        },
        _count: { select: { gates: true } },
      },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error("Video GET error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = updateVideoSchema.parse(body)

    const existing = await prisma.video.findFirst({
      where: { id, tenantId: currentUser.tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const video = await prisma.video.update({
      where: { id },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.videoUrl !== undefined && { videoUrl: validated.videoUrl }),
        ...(validated.thumbnailUrl !== undefined && { thumbnailUrl: validated.thumbnailUrl }),
        ...(validated.duration !== undefined && { duration: validated.duration }),
        ...(validated.status !== undefined && { status: validated.status }),
        ...(validated.gateEnabled !== undefined && { gateEnabled: validated.gateEnabled }),
        ...(validated.gateType !== undefined && { gateType: validated.gateType }),
        ...(validated.gateTitle !== undefined && { gateTitle: validated.gateTitle }),
        ...(validated.gateButtonLabel !== undefined && { gateButtonLabel: validated.gateButtonLabel }),
      },
      include: {
        _count: { select: { gates: true } },
      },
    })

    return NextResponse.json({ video })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Video PATCH error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.video.findFirst({
      where: { id, tenantId: currentUser.tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    await prisma.video.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Video DELETE error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 })
  }
}
