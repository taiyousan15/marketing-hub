/**
 * イベント詳細API
 * GET: イベント取得
 * PATCH: イベント更新
 * DELETE: イベント削除
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/tenant"
import { z } from "zod"
import { EventStatus } from "@prisma/client"

const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  isOnline: z.boolean().optional(),
  location: z.string().optional().nullable(),
  meetingUrl: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  status: z.nativeEnum(EventStatus).optional(),
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

    const event = await prisma.event.findFirst({
      where: { id, tenantId: currentUser.tenantId },
      include: {
        registrations: {
          include: {
            contact: {
              select: { id: true, name: true, email: true, phone: true, lineUserId: true },
            },
          },
          orderBy: { registeredAt: "desc" },
        },
        _count: { select: { registrations: true } },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Event GET error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
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
    const validated = updateEventSchema.parse(body)

    const existing = await prisma.event.findFirst({
      where: { id, tenantId: currentUser.tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const event = await prisma.event.update({
      where: { id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.startAt !== undefined && { startAt: new Date(validated.startAt) }),
        ...(validated.endAt !== undefined && { endAt: new Date(validated.endAt) }),
        ...(validated.isOnline !== undefined && { isOnline: validated.isOnline }),
        ...(validated.location !== undefined && { location: validated.location }),
        ...(validated.meetingUrl !== undefined && { meetingUrl: validated.meetingUrl }),
        ...(validated.capacity !== undefined && { capacity: validated.capacity }),
        ...(validated.status !== undefined && { status: validated.status }),
      },
      include: {
        _count: { select: { registrations: true } },
      },
    })

    return NextResponse.json({ event })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Event PATCH error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
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

    const existing = await prisma.event.findFirst({
      where: { id, tenantId: currentUser.tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await prisma.event.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Event DELETE error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
