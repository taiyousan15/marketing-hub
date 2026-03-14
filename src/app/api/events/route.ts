/**
 * イベント管理API
 * GET: イベント一覧取得
 * POST: イベント作成
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/tenant"
import { z } from "zod"
import { EventType, EventStatus } from "@prisma/client"

const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  type: z.nativeEnum(EventType),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  timezone: z.string().default("Asia/Tokyo"),
  isOnline: z.boolean().default(true),
  location: z.string().optional().nullable(),
  meetingUrl: z.string().url().optional().nullable().or(z.literal("")),
  capacity: z.number().int().positive().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as EventType | null
    const status = searchParams.get("status") as EventStatus | null

    const events = await prisma.event.findMany({
      where: {
        tenantId: currentUser.tenantId,
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        _count: { select: { registrations: true } },
      },
      orderBy: { startAt: "asc" },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error("Events GET error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = createEventSchema.parse(body)

    const event = await prisma.event.create({
      data: {
        tenantId: currentUser.tenantId,
        name: validated.name,
        description: validated.description ?? null,
        type: validated.type,
        startAt: new Date(validated.startAt),
        endAt: new Date(validated.endAt),
        timezone: validated.timezone,
        isOnline: validated.isOnline,
        location: validated.location ?? null,
        meetingUrl: validated.meetingUrl || null,
        capacity: validated.capacity ?? null,
        status: EventStatus.SCHEDULED,
      },
      include: {
        _count: { select: { registrations: true } },
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Events POST error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}
