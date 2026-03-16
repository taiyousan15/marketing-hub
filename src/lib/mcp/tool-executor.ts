/**
 * MCP Tool Executor
 * 全ツールの実行ハンドラー
 */

import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import { sendEmail, sendBatchEmails } from "@/lib/email/resend-client"
import { pushTextMessage, multicastMessage } from "@/lib/line/client"
import { sendSMS } from "@/lib/sms/twilio-client"

// ============================================================
// 共通スキーマ
// ============================================================

const limitSchema = (max: number, defaultVal: number) =>
  z.number().int().min(1).max(max).default(defaultVal)

const daysSchema = z.number().int().min(1).max(365).default(30)

// ============================================================
// ツール実行
// ============================================================

export async function executeTool(
  name: string,
  args: unknown,
  tenantId: string
): Promise<unknown> {
  const a = args ?? {}

  switch (name) {
    // ========================================================
    // コンタクト管理
    // ========================================================
    case "contacts_list": {
      const { limit, search, tag } = z.object({
        limit: limitSchema(100, 20),
        search: z.string().optional(),
        tag: z.string().optional(),
      }).parse(a)

      const tagFilter = tag ? {
        contactTags: { some: { tag: { name: { equals: tag, mode: "insensitive" as const } } } },
      } : {}

      const contacts = await prisma.contact.findMany({
        where: {
          tenantId,
          ...tagFilter,
          ...(search ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          } : {}),
        },
        select: {
          id: true, name: true, email: true, phone: true,
          lifecycleStage: true, score: true, createdAt: true,
          tags: { select: { tag: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return {
        contacts: contacts.map(c => ({
          ...c,
          tagNames: c.tags.map((ct: { tag: { name: string } }) => ct.tag.name),
          tags: undefined,
        })),
        total: contacts.length,
      }
    }

    case "contacts_create": {
      const validated = z.object({
        email: z.string().email(),
        name: z.string().optional().nullable(),
        phone: z.string().optional().nullable(),
      }).parse(a)

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
      const { email } = z.object({ email: z.string() }).parse(a)
      const contacts = await prisma.contact.findMany({
        where: { tenantId, email: { contains: email, mode: "insensitive" } },
        select: { id: true, name: true, email: true, phone: true, lifecycleStage: true },
        take: 10,
      })
      return { contacts }
    }

    case "contacts_update": {
      const { contactId, ...updates } = z.object({
        contactId: z.string(),
        name: z.string().optional(),
        phone: z.string().optional(),
        lifecycleStage: z.string().optional(),
      }).parse(a)

      const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId } })
      if (!contact) throw new Error("連絡先が見つかりません")

      const updated = await prisma.contact.update({
        where: { id: contactId },
        data: {
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
          ...(updates.lifecycleStage !== undefined ? { lifecycleStage: updates.lifecycleStage as never } : {}),
        },
      })
      return { contact: updated }
    }

    case "contacts_add_tag": {
      const { contactId, tagName } = z.object({
        contactId: z.string(),
        tagName: z.string().min(1),
      }).parse(a)

      const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId } })
      if (!contact) throw new Error("連絡先が見つかりません")

      const tag = await prisma.tag.upsert({
        where: { tenantId_name: { tenantId, name: tagName } },
        create: { tenantId, name: tagName },
        update: {},
      })

      const existing = await prisma.contactTag.findFirst({
        where: { contactId, tagId: tag.id },
      })
      if (existing) {
        return { message: `タグ「${tagName}」は既に付与されています` }
      }

      await prisma.contactTag.create({ data: { contactId, tagId: tag.id } })
      return { message: `タグ「${tagName}」を追加しました` }
    }

    // ========================================================
    // タグ管理
    // ========================================================
    case "tags_list": {
      const { search } = z.object({ search: z.string().optional() }).parse(a)
      const tags = await prisma.tag.findMany({
        where: {
          tenantId,
          ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        },
        include: { _count: { select: { contacts: true } } },
        orderBy: { name: "asc" },
      })
      return { tags: tags.map(t => ({ ...t, contactCount: t._count.contacts, _count: undefined })) }
    }

    case "tags_create": {
      const { name, color } = z.object({
        name: z.string().min(1),
        color: z.string().optional(),
      }).parse(a)

      const existing = await prisma.tag.findFirst({ where: { tenantId, name } })
      if (existing) return { tag: existing, created: false, message: "既に存在するタグです" }

      const tag = await prisma.tag.create({
        data: { tenantId, name, ...(color ? { color } : {}) },
      })
      return { tag, created: true }
    }

    // ========================================================
    // キャンペーン
    // ========================================================
    case "campaigns_list": {
      const { status, type, limit } = z.object({
        status: z.string().optional(),
        type: z.string().optional(),
        limit: limitSchema(50, 20),
      }).parse(a)

      const campaigns = await prisma.campaign.findMany({
        where: {
          tenantId,
          ...(status ? { status: status as never } : {}),
          ...(type ? { type: type as never } : {}),
        },
        include: {
          _count: { select: { steps: true, contacts: true } },
          segment: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { campaigns }
    }

    case "campaigns_get": {
      const { campaignId } = z.object({ campaignId: z.string() }).parse(a)
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, tenantId },
        include: {
          steps: { orderBy: { order: "asc" } },
          segment: { select: { id: true, name: true } },
          _count: { select: { contacts: true, executions: true } },
        },
      })
      if (!campaign) throw new Error("キャンペーンが見つかりません")
      return { campaign }
    }

    case "campaigns_update_status": {
      const { campaignId, status } = z.object({
        campaignId: z.string(),
        status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]),
      }).parse(a)

      const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, tenantId } })
      if (!campaign) throw new Error("キャンペーンが見つかりません")

      const updated = await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: status as never },
      })
      return { campaign: updated, message: `ステータスを「${status}」に変更しました` }
    }

    // ========================================================
    // 商品・注文・サブスクリプション
    // ========================================================
    case "products_list": {
      const { type, isActive, limit } = z.object({
        type: z.string().optional(),
        isActive: z.boolean().default(true),
        limit: limitSchema(50, 20),
      }).parse(a)

      const products = await prisma.product.findMany({
        where: {
          tenantId,
          isActive,
          ...(type ? { type: type as never } : {}),
        },
        select: {
          id: true, name: true, description: true, price: true, currency: true,
          type: true, isActive: true, recurringInterval: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { products }
    }

    case "orders_list": {
      const { status, contactId, limit } = z.object({
        status: z.string().optional(),
        contactId: z.string().optional(),
        limit: limitSchema(100, 20),
      }).parse(a)

      const orders = await prisma.order.findMany({
        where: {
          tenantId,
          ...(status ? { status: status as never } : {}),
          ...(contactId ? { contactId } : {}),
        },
        include: {
          contact: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { orders }
    }

    case "orders_get": {
      const { orderId } = z.object({ orderId: z.string() }).parse(a)
      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
        include: {
          contact: { select: { id: true, name: true, email: true, phone: true } },
          product: { select: { id: true, name: true, price: true, type: true } },
        },
      })
      if (!order) throw new Error("注文が見つかりません")
      return { order }
    }

    case "subscriptions_list": {
      const { status, limit } = z.object({
        status: z.string().optional(),
        limit: limitSchema(50, 20),
      }).parse(a)

      const subscriptions = await prisma.subscription.findMany({
        where: {
          tenantId,
          ...(status ? { status: status as never } : {}),
        },
        include: {
          contact: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { subscriptions }
    }

    // ========================================================
    // CRMパイプライン
    // ========================================================
    case "pipeline_list": {
      const pipelines = await prisma.pipeline.findMany({
        where: { tenantId },
        include: {
          stages: { orderBy: { order: "asc" }, select: { id: true, name: true, order: true, color: true, probability: true } },
          _count: { select: { deals: true } },
        },
      })
      return { pipelines }
    }

    case "deals_list": {
      const { pipelineId, status, limit } = z.object({
        pipelineId: z.string().optional(),
        status: z.string().optional(),
        limit: limitSchema(50, 20),
      }).parse(a)

      const deals = await prisma.deal.findMany({
        where: {
          tenantId,
          ...(pipelineId ? { pipelineId } : {}),
          ...(status ? { status: status as never } : {}),
        },
        include: {
          stage: { select: { id: true, name: true, color: true } },
          contact: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { deals }
    }

    case "deals_create": {
      const validated = z.object({
        title: z.string().min(1),
        pipelineId: z.string(),
        stageId: z.string(),
        contactId: z.string().optional(),
        amount: z.number().optional(),
        currency: z.string().default("JPY"),
      }).parse(a)

      const deal = await prisma.deal.create({
        data: {
          tenantId,
          title: validated.title,
          pipelineId: validated.pipelineId,
          stageId: validated.stageId,
          contactId: validated.contactId ?? null,
          amount: validated.amount ?? 0,
          currency: validated.currency,
          status: "OPEN",
        },
      })
      return { deal, message: `商談「${deal.title}」を作成しました` }
    }

    case "deals_update": {
      const { dealId, ...updates } = z.object({
        dealId: z.string(),
        stageId: z.string().optional(),
        status: z.enum(["OPEN", "WON", "LOST"]).optional(),
        amount: z.number().optional(),
      }).parse(a)

      const deal = await prisma.deal.findFirst({ where: { id: dealId, tenantId } })
      if (!deal) throw new Error("商談が見つかりません")

      const updated = await prisma.deal.update({
        where: { id: dealId },
        data: {
          ...(updates.stageId ? { stageId: updates.stageId } : {}),
          ...(updates.status ? { status: updates.status as never } : {}),
          ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
          ...(updates.status === "WON" || updates.status === "LOST" ? { closedAt: new Date() } : {}),
        },
        include: { stage: { select: { name: true } } },
      })
      return { deal: updated }
    }

    // ========================================================
    // イベント
    // ========================================================
    case "events_list": {
      const { status, type, limit } = z.object({
        status: z.string().optional(),
        type: z.string().optional(),
        limit: limitSchema(50, 10),
      }).parse(a)

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
      const validated = z.object({
        name: z.string().min(1),
        type: z.enum(["SEMINAR", "CONSULTATION", "WEBINAR", "LIVESTREAM"]),
        startAt: z.string().datetime(),
        endAt: z.string().datetime(),
        isOnline: z.boolean().default(true),
        description: z.string().optional().nullable(),
        capacity: z.number().int().positive().optional().nullable(),
      }).parse(a)

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

    case "event_registrations_list": {
      const { eventId, status } = z.object({
        eventId: z.string(),
        status: z.string().optional(),
      }).parse(a)

      const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } })
      if (!event) throw new Error("イベントが見つかりません")

      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
          ...(status ? { status: status as never } : {}),
        },
        include: { contact: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { registeredAt: "desc" },
      })
      return { event: { id: event.id, name: event.name }, registrations, total: registrations.length }
    }

    // ========================================================
    // ファネル
    // ========================================================
    case "funnels_list": {
      const { limit } = z.object({ limit: limitSchema(20, 10) }).parse(a)
      const funnels = await prisma.funnel.findMany({
        where: { tenantId },
        include: { _count: { select: { pages: true, steps: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { funnels }
    }

    case "funnels_get": {
      const { funnelId } = z.object({ funnelId: z.string() }).parse(a)
      const funnel = await prisma.funnel.findFirst({
        where: { id: funnelId, tenantId },
        include: {
          pages: {
            select: { id: true, name: true, slug: true, pageViews: true, conversions: true, order: true },
            orderBy: { order: "asc" },
          },
          steps: {
            select: { id: true, name: true, type: true, order: true },
            orderBy: { order: "asc" },
          },
        },
      })
      if (!funnel) throw new Error("ファネルが見つかりません")

      const totalPV = funnel.pages.reduce((sum, p) => sum + (p.pageViews ?? 0), 0)
      const totalCV = funnel.pages.reduce((sum, p) => sum + (p.conversions ?? 0), 0)
      return {
        funnel,
        stats: { totalPageViews: totalPV, totalConversions: totalCV, conversionRate: totalPV > 0 ? ((totalCV / totalPV) * 100).toFixed(2) + "%" : "0%" },
      }
    }

    // ========================================================
    // フォーム
    // ========================================================
    case "forms_list": {
      const { status, limit } = z.object({
        status: z.string().optional(),
        limit: limitSchema(20, 10),
      }).parse(a)

      const forms = await prisma.form.findMany({
        where: {
          tenantId,
          ...(status ? { status: status as never } : {}),
        },
        include: { _count: { select: { submissions: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { forms: forms.map(f => ({ ...f, submissionCount: f._count.submissions, _count: undefined })) }
    }

    case "form_submissions_list": {
      const { formId, limit } = z.object({
        formId: z.string(),
        limit: limitSchema(100, 20),
      }).parse(a)

      const form = await prisma.form.findFirst({ where: { id: formId, tenantId } })
      if (!form) throw new Error("フォームが見つかりません")

      const submissions = await prisma.formSubmission.findMany({
        where: { formId },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { form: { id: form.id, name: form.name }, submissions, total: submissions.length }
    }

    // ========================================================
    // 動画管理
    // ========================================================
    case "videos_list": {
      const { status, limit } = z.object({
        status: z.string().optional(),
        limit: limitSchema(20, 10),
      }).parse(a)

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const videos = await (prisma as any).video.findMany({
          where: {
            tenantId,
            ...(status ? { status } : {}),
          },
          include: { _count: { select: { gates: true } } },
          orderBy: { createdAt: "desc" },
          take: limit,
        })
        return { videos }
      } catch (_e) {
        return { videos: [], error: "Video model not available" }
      }
    }

    // ========================================================
    // 会員サイト・コース
    // ========================================================
    case "courses_list": {
      const { isPublished, limit } = z.object({
        isPublished: z.boolean().optional(),
        limit: limitSchema(20, 10),
      }).parse(a)

      const courses = await prisma.course.findMany({
        where: {
          tenantId,
          ...(isPublished !== undefined ? { isPublished } : {}),
        },
        include: {
          _count: { select: { lessons: true, enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { courses }
    }

    case "courses_get": {
      const { courseId } = z.object({ courseId: z.string() }).parse(a)
      const course = await prisma.course.findFirst({
        where: { id: courseId, tenantId },
        include: {
          lessons: {
            select: { id: true, name: true, isPublished: true, duration: true, order: true },
            orderBy: { order: "asc" },
          },
          _count: { select: { enrollments: true } },
        },
      })
      if (!course) throw new Error("コースが見つかりません")
      return { course }
    }

    case "enrollments_list": {
      const { courseId, limit } = z.object({
        courseId: z.string(),
        limit: limitSchema(100, 20),
      }).parse(a)

      const course = await prisma.course.findFirst({ where: { id: courseId, tenantId } })
      if (!course) throw new Error("コースが見つかりません")

      const enrollments = await prisma.courseEnrollment.findMany({
        where: { courseId },
        include: { contact: { select: { id: true, name: true, email: true } } },
        orderBy: { enrolledAt: "desc" },
        take: limit,
      })
      return { course: { id: course.id, name: course.name }, enrollments, total: enrollments.length }
    }

    // ========================================================
    // 自動化・ジャーニー
    // ========================================================
    case "automation_rules_list": {
      const { isActive, limit } = z.object({
        isActive: z.boolean().optional(),
        limit: limitSchema(20, 10),
      }).parse(a)

      const rules = await prisma.automationRule.findMany({
        where: {
          tenantId,
          ...(isActive !== undefined ? { isActive } : {}),
        },
        include: {
          triggers: { select: { id: true, type: true } },
          actions: { select: { id: true, type: true, order: true }, orderBy: { order: "asc" } },
          _count: { select: { executions: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { rules }
    }

    case "automation_executions_list": {
      const { ruleId, status, limit } = z.object({
        ruleId: z.string().optional(),
        status: z.string().optional(),
        limit: limitSchema(50, 20),
      }).parse(a)

      const executions = await prisma.automationExecution.findMany({
        where: {
          rule: { tenantId },
          ...(ruleId ? { ruleId } : {}),
          ...(status ? { status: status as never } : {}),
        },
        include: {
          rule: { select: { id: true, name: true } },
        },
        orderBy: { triggeredAt: "desc" },
        take: limit,
      })
      return { executions }
    }

    case "journeys_list": {
      const { status, limit } = z.object({
        status: z.string().optional(),
        limit: limitSchema(20, 10),
      }).parse(a)

      const journeys = await prisma.journey.findMany({
        where: {
          tenantId,
          ...(status ? { status: status as never } : {}),
        },
        include: { _count: { select: { nodes: true, edges: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { journeys }
    }

    // ========================================================
    // セグメント
    // ========================================================
    case "segments_list": {
      const { limit } = z.object({ limit: limitSchema(20, 10) }).parse(a)
      const segments = await prisma.segment.findMany({
        where: { tenantId },
        select: {
          id: true, name: true, description: true, color: true,
          memberCount: true, autoUpdate: true, rulesLogic: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { segments }
    }

    // ========================================================
    // LINE連携
    // ========================================================
    case "line_projects_list": {
      const projects = await prisma.lineProject.findMany({
        where: { tenantId },
        include: {
          _count: { select: { accounts: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      return { projects }
    }

    case "line_accounts_list": {
      const { projectId } = z.object({ projectId: z.string().optional() }).parse(a)
      const accounts = await prisma.lineAccount.findMany({
        where: {
          tenantId,
          ...(projectId ? { projectId } : {}),
        },
        select: {
          id: true, name: true, botDisplayName: true, botBasicId: true,
          isConnected: true, isActive: true, currentFriends: true, maxFriends: true,
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      return { accounts }
    }

    // ========================================================
    // Meta広告
    // ========================================================
    case "meta_ads_report": {
      const { days, accountId } = z.object({
        days: daysSchema,
        accountId: z.string().optional(),
      }).parse(a)

      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      let stats: Array<{
        impressions: number
        clicks: number
        spend: number
        leads: number
        purchases: number
        revenue: number
      }> = []
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stats = await (prisma as any).metaAdsCampaignStat.findMany({
          where: {
            account: { tenantId },
            date: { gte: since },
            ...(accountId ? { accountId } : {}),
          },
          orderBy: { date: "desc" },
          take: 100,
        })
      } catch (_e) {
        return { error: "Meta Ads model not available", period: `過去${days}日間`, totals: {}, campaigns: 0 }
      }

      const totals = stats.reduce(
        (acc, s) => ({
          impressions: acc.impressions + (s.impressions ?? 0),
          clicks: acc.clicks + (s.clicks ?? 0),
          spend: acc.spend + (s.spend ?? 0),
          leads: acc.leads + (s.leads ?? 0),
          purchases: acc.purchases + (s.purchases ?? 0),
          revenue: acc.revenue + (s.revenue ?? 0),
        }),
        { impressions: 0, clicks: 0, spend: 0, leads: 0, purchases: 0, revenue: 0 }
      )

      return {
        period: `過去${days}日間`,
        totals: {
          ...totals,
          ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) + "%" : "0%",
          cpc: totals.clicks > 0 ? Math.round(totals.spend / totals.clicks) : 0,
          roas: totals.spend > 0 ? ((totals.revenue / totals.spend) * 100).toFixed(1) + "%" : "0%",
        },
        campaigns: stats.length,
      }
    }

    // ========================================================
    // アフィリエイト
    // ========================================================
    case "partners_list": {
      const { status, limit } = z.object({
        status: z.string().optional(),
        limit: limitSchema(50, 20),
      }).parse(a)

      const partners = await prisma.partner.findMany({
        where: {
          tenantId,
          ...(status ? { status: status as never } : {}),
        },
        select: {
          id: true, name: true, email: true, code: true,
          commissionRate: true, status: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { partners }
    }

    case "affiliate_conversions_list": {
      const { partnerId, status, limit } = z.object({
        partnerId: z.string().optional(),
        status: z.string().optional(),
        limit: limitSchema(100, 20),
      }).parse(a)

      const conversions = await prisma.affiliateConversion.findMany({
        where: {
          tenantId,
          ...(partnerId ? { partnerId } : {}),
          ...(status ? { status: status as never } : {}),
        },
        include: {
          partner: { select: { id: true, name: true, code: true } },
          AffiliateLink: { select: { id: true, url: true, linkCode: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { conversions }
    }

    case "affiliate_stats": {
      const { days } = z.object({ days: daysSchema }).parse(a)
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const [totalPartners, activePartners, totalClicks, totalConversions, pendingPayouts] = await Promise.all([
        prisma.partner.count({ where: { tenantId } }),
        prisma.partner.count({ where: { tenantId, status: "ACTIVE" } }),
        prisma.affiliateClick.count({ where: { tenantId, clickedAt: { gte: since } } }),
        prisma.affiliateConversion.count({ where: { tenantId, createdAt: { gte: since } } }),
        prisma.affiliateCommission.count({ where: { tenantId, status: "PENDING" } }),
      ])

      return {
        period: `過去${days}日間`,
        partners: { total: totalPartners, active: activePartners },
        clicks: totalClicks,
        conversions: totalConversions,
        conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) + "%" : "0%",
        pendingPayouts,
      }
    }

    // ========================================================
    // ライブ配信・ウェビナー
    // ========================================================
    case "livestreams_list": {
      const { status, limit } = z.object({
        status: z.string().optional(),
        limit: limitSchema(20, 10),
      }).parse(a)

      const livestreams = await prisma.liveStream.findMany({
        where: {
          tenantId,
          ...(status ? { status: status as never } : {}),
        },
        include: {
          event: { select: { id: true, name: true } },
          _count: { select: { chatMessages: true } },
        },
        orderBy: { startAt: "desc" },
        take: limit,
      })
      return { livestreams }
    }

    case "auto_webinars_list": {
      const { status, limit } = z.object({
        status: z.string().optional(),
        limit: limitSchema(20, 10),
      }).parse(a)

      const webinars = await prisma.automatedWebinar.findMany({
        where: {
          tenantId,
          ...(status ? { status: status as never } : {}),
        },
        select: {
          id: true, name: true, description: true, status: true,
          videoDuration: true, simulatedChatEnabled: true, aiBotEnabled: true,
          replayEnabled: true, scheduleType: true, createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })
      return { webinars }
    }

    // ========================================================
    // 分析・レポート
    // ========================================================
    case "analytics_summary": {
      const { days } = z.object({ days: daysSchema }).parse(a)
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const [
        totalContacts, newContacts,
        totalEvents, upcomingEvents,
        totalOrders, completedOrders,
        totalProducts, activePartners,
        totalFunnels, activeCampaigns,
      ] = await Promise.all([
        prisma.contact.count({ where: { tenantId } }),
        prisma.contact.count({ where: { tenantId, createdAt: { gte: since } } }),
        prisma.event.count({ where: { tenantId } }),
        prisma.event.count({ where: { tenantId, status: "SCHEDULED", startAt: { gte: new Date() } } }),
        prisma.order.count({ where: { tenantId, createdAt: { gte: since } } }),
        prisma.order.count({ where: { tenantId, status: "COMPLETED", createdAt: { gte: since } } }),
        prisma.product.count({ where: { tenantId, isActive: true } }),
        prisma.partner.count({ where: { tenantId, status: "ACTIVE" } }),
        prisma.funnel.count({ where: { tenantId } }),
        prisma.campaign.count({ where: { tenantId, status: "ACTIVE" } }),
      ])

      return {
        period: `過去${days}日間`,
        contacts: { total: totalContacts, new: newContacts },
        events: { total: totalEvents, upcoming: upcomingEvents },
        orders: { period: totalOrders, completed: completedOrders },
        products: { active: totalProducts },
        partners: { active: activePartners },
        funnels: { total: totalFunnels },
        campaigns: { active: activeCampaigns },
      }
    }

    case "analytics_revenue": {
      const { days } = z.object({ days: daysSchema }).parse(a)
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const orders = await prisma.order.findMany({
        where: { tenantId, status: "COMPLETED", createdAt: { gte: since } },
        select: { amount: true, currency: true, createdAt: true },
      })

      const totalRevenue = orders.reduce((sum, o) => sum + o.amount, 0)
      const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0

      const activeSubscriptions = await prisma.subscription.count({
        where: { tenantId, status: "ACTIVE" },
      })

      return {
        period: `過去${days}日間`,
        revenue: {
          total: totalRevenue,
          orders: orders.length,
          avgOrderValue,
          currency: "JPY",
        },
        subscriptions: { active: activeSubscriptions },
      }
    }

    case "analytics_utm": {
      const { days, limit } = z.object({
        days: daysSchema,
        limit: limitSchema(50, 10),
      }).parse(a)

      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      try {
        const contacts = await (prisma as never as {
          contact: {
            findMany: (args: unknown) => Promise<Array<{ utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null }>>
          }
        }).contact.findMany({
          where: {
            tenantId,
            createdAt: { gte: since },
            utmSource: { not: null },
          },
          select: { utmSource: true, utmMedium: true, utmCampaign: true },
        })

        const sourceMap = new Map<string, number>()
        for (const c of contacts) {
          const key = c.utmSource ?? "direct"
          sourceMap.set(key, (sourceMap.get(key) ?? 0) + 1)
        }

        const sources = Array.from(sourceMap.entries())
          .sort((x, y) => y[1] - x[1])
          .slice(0, limit)
          .map(([source, count]) => ({ source, count }))

        return {
          period: `過去${days}日間`,
          totalTracked: contacts.length,
          topSources: sources,
        }
      } catch (_e) {
        return { error: "UTM fields not available", period: `過去${days}日間`, totalTracked: 0, topSources: [] }
      }
    }

    // ========================================================
    // グローバル検索
    // ========================================================
    case "search_global": {
      const { query, limit } = z.object({
        query: z.string().min(1),
        limit: limitSchema(20, 5),
      }).parse(a)

      const [contacts, events, funnels, products, courses] = await Promise.all([
        prisma.contact.findMany({
          where: {
            tenantId,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, email: true },
          take: limit,
        }),
        prisma.event.findMany({
          where: { tenantId, name: { contains: query, mode: "insensitive" } },
          select: { id: true, name: true, type: true, status: true, startAt: true },
          take: limit,
        }),
        prisma.funnel.findMany({
          where: { tenantId, name: { contains: query, mode: "insensitive" } },
          select: { id: true, name: true },
          take: limit,
        }),
        prisma.product.findMany({
          where: { tenantId, name: { contains: query, mode: "insensitive" } },
          select: { id: true, name: true, price: true, type: true },
          take: limit,
        }),
        prisma.course.findMany({
          where: { tenantId, name: { contains: query, mode: "insensitive" } },
          select: { id: true, name: true, isPublished: true },
          take: limit,
        }),
      ])

      return {
        query,
        results: {
          contacts: { items: contacts, count: contacts.length },
          events: { items: events, count: events.length },
          funnels: { items: funnels, count: funnels.length },
          products: { items: products, count: products.length },
          courses: { items: courses, count: courses.length },
        },
        totalResults: contacts.length + events.length + funnels.length + products.length + courses.length,
      }
    }

    // ========================================================
    // メッセージ送信
    // ========================================================
    case "email_send": {
      const { contactIds, subject, html, text } = z.object({
        contactIds: z.array(z.string()).min(1).max(500),
        subject: z.string().min(1),
        html: z.string().optional(),
        text: z.string().optional(),
      }).parse(a)

      const contacts = await prisma.contact.findMany({
        where: { id: { in: contactIds }, tenantId, emailOptIn: true },
        select: { id: true, name: true, email: true },
      })

      const withEmail = contacts.filter(c => c.email)
      if (withEmail.length === 0) {
        return { sent: 0, message: "メールアドレスが登録されている連絡先がありません" }
      }

      const emailBody = html ?? `<p>${(text ?? "").replace(/\n/g, "<br>")}</p>`
      const emails = withEmail.map(c => ({
        to: c.email!,
        subject,
        html: emailBody,
      }))

      const result = await sendBatchEmails(emails)

      // MessageHistory にログ
      await prisma.messageHistory.createMany({
        data: withEmail.map(c => ({
          tenantId,
          contactId: c.id,
          channel: "EMAIL" as const,
          direction: "OUTBOUND" as const,
          content: { subject, html: emailBody },
          status: "SENT" as const,
          sentAt: new Date(),
        })),
      })

      return {
        sent: withEmail.length,
        skipped: contactIds.length - withEmail.length,
        success: result.success,
        message: `${withEmail.length}件のメールを送信しました`,
      }
    }

    case "line_send": {
      const { contactIds, message } = z.object({
        contactIds: z.array(z.string()).min(1).max(500),
        message: z.string().min(1),
      }).parse(a)

      const contacts = await prisma.contact.findMany({
        where: { id: { in: contactIds }, tenantId, lineOptIn: true, lineUserId: { not: null } },
        select: { id: true, name: true, lineUserId: true },
      })

      if (contacts.length === 0) {
        return { sent: 0, message: "LINE連携済みの連絡先がありません" }
      }

      const lineUserIds = contacts.map(c => c.lineUserId!).filter(Boolean)

      if (lineUserIds.length === 1) {
        await pushTextMessage(lineUserIds[0], message)
      } else {
        await multicastMessage(lineUserIds, [{ type: "text", text: message }])
      }

      // MessageHistory にログ
      await prisma.messageHistory.createMany({
        data: contacts.map(c => ({
          tenantId,
          contactId: c.id,
          channel: "LINE" as const,
          direction: "OUTBOUND" as const,
          content: { text: message },
          status: "SENT" as const,
          sentAt: new Date(),
        })),
      })

      return {
        sent: contacts.length,
        skipped: contactIds.length - contacts.length,
        message: `${contacts.length}件のLINEメッセージを送信しました`,
      }
    }

    case "sms_send": {
      const { contactIds, message: smsBody } = z.object({
        contactIds: z.array(z.string()).min(1).max(100),
        message: z.string().min(1),
      }).parse(a)

      const contacts = await prisma.contact.findMany({
        where: { id: { in: contactIds }, tenantId, smsOptIn: true, phone: { not: null } },
        select: { id: true, name: true, phone: true },
      })

      if (contacts.length === 0) {
        return { sent: 0, message: "電話番号が登録されている連絡先がありません" }
      }

      let sent = 0
      let failed = 0
      for (const c of contacts) {
        const result = await sendSMS({
          to: c.phone!,
          body: smsBody,
          tenantId,
          contactId: c.id,
        })
        if (result.success) {
          sent++
        } else {
          failed++
        }
      }

      return {
        sent,
        failed,
        skipped: contactIds.length - contacts.length,
        message: `${sent}件のSMSを送信しました${failed > 0 ? `（${failed}件失敗）` : ""}`,
      }
    }

    case "message_send_by_tag": {
      const { tagName, channel, subject, message: msgBody } = z.object({
        tagName: z.string().min(1),
        channel: z.enum(["EMAIL", "LINE", "SMS"]),
        subject: z.string().optional(),
        message: z.string().min(1),
      }).parse(a)

      // タグで連絡先を取得
      const tag = await prisma.tag.findFirst({
        where: { tenantId, name: { equals: tagName, mode: "insensitive" } },
      })
      if (!tag) throw new Error(`タグ「${tagName}」が見つかりません`)

      const contactTags = await prisma.contactTag.findMany({
        where: { tagId: tag.id },
        include: {
          contact: {
            select: { id: true, name: true, email: true, phone: true, lineUserId: true, emailOptIn: true, lineOptIn: true, smsOptIn: true },
          },
        },
      })

      const contactIds = contactTags.map(ct => ct.contact.id)

      if (contactIds.length === 0) {
        return { sent: 0, message: `タグ「${tagName}」に連絡先がありません` }
      }

      // 各チャネルの送信ツールを再利用
      switch (channel) {
        case "EMAIL":
          if (!subject) throw new Error("メール送信にはsubjectが必須です")
          return executeTool("email_send", { contactIds, subject, html: msgBody }, tenantId)
        case "LINE":
          return executeTool("line_send", { contactIds, message: msgBody }, tenantId)
        case "SMS":
          return executeTool("sms_send", { contactIds, message: msgBody }, tenantId)
        default:
          throw new Error(`未対応のチャネル: ${channel}`)
      }
    }

    // ========================================================
    // メッセージ履歴・開封追跡
    // ========================================================
    case "messages_list": {
      const { contactId, campaignId, channel, status, notOpened, limit } = z.object({
        contactId: z.string().optional(),
        campaignId: z.string().optional(),
        channel: z.string().optional(),
        status: z.string().optional(),
        notOpened: z.boolean().optional(),
        limit: limitSchema(100, 50),
      }).parse(a)

      const messages = await prisma.messageHistory.findMany({
        where: {
          tenantId,
          direction: "OUTBOUND",
          ...(contactId ? { contactId } : {}),
          ...(campaignId ? { campaignId } : {}),
          ...(channel ? { channel: channel as never } : {}),
          ...(status ? { status: status as never } : {}),
          ...(notOpened ? {
            openedAt: null,
            status: { in: ["SENT", "DELIVERED"] },
          } : {}),
        },
        include: {
          contact: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      })

      return {
        messages: messages.map(m => ({
          id: m.id,
          contactId: m.contactId,
          contactName: m.contact.name,
          contactEmail: m.contact.email,
          channel: m.channel,
          status: m.status,
          sentAt: m.sentAt,
          openedAt: m.openedAt,
          clickedAt: m.clickedAt,
          campaignId: m.campaignId,
        })),
        total: messages.length,
      }
    }

    case "messages_open_report": {
      const { campaignId, days, channel } = z.object({
        campaignId: z.string().optional(),
        days: daysSchema,
        channel: z.string().optional(),
      }).parse(a)

      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

      const messages = await prisma.messageHistory.findMany({
        where: {
          tenantId,
          direction: "OUTBOUND",
          createdAt: { gte: since },
          ...(campaignId ? { campaignId } : {}),
          ...(channel ? { channel: channel as never } : {}),
        },
        include: {
          contact: { select: { id: true, name: true, email: true } },
        },
      })

      const total = messages.length
      const opened = messages.filter(m => m.openedAt !== null)
      const clicked = messages.filter(m => m.clickedAt !== null)
      const notOpenedList = messages
        .filter(m => m.openedAt === null && (m.status === "SENT" || m.status === "DELIVERED"))
        .map(m => ({
          contactId: m.contactId,
          contactName: m.contact.name,
          contactEmail: m.contact.email,
        }))

      return {
        period: `過去${days}日間`,
        total,
        opened: opened.length,
        openRate: total > 0 ? ((opened.length / total) * 100).toFixed(1) + "%" : "0%",
        clicked: clicked.length,
        clickRate: total > 0 ? ((clicked.length / total) * 100).toFixed(1) + "%" : "0%",
        notOpened: notOpenedList.length,
        notOpenedContacts: notOpenedList.slice(0, 100),
      }
    }

    // ========================================================
    // イベントリマインダー
    // ========================================================
    case "event_send_reminder": {
      const { eventId, channel, subject, message: reminderMsg, onlyUnreminded } = z.object({
        eventId: z.string(),
        channel: z.enum(["EMAIL", "LINE", "SMS"]).default("EMAIL"),
        subject: z.string().optional(),
        message: z.string().min(1),
        onlyUnreminded: z.boolean().default(true),
      }).parse(a)

      const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } })
      if (!event) throw new Error("イベントが見つかりません")

      // REGISTERED / CONFIRMED のみ対象（CANCELED / NO_SHOW は除外）
      const registrations = await prisma.eventRegistration.findMany({
        where: {
          eventId,
          status: { in: ["REGISTERED", "CONFIRMED"] },
          ...(onlyUnreminded ? { dayBeforeReminderSent: false } : {}),
        },
        include: {
          contact: { select: { id: true, name: true, email: true, phone: true, lineUserId: true, emailOptIn: true, lineOptIn: true, smsOptIn: true } },
        },
      })

      if (registrations.length === 0) {
        return { sent: 0, message: "リマインド対象の申込者がいません" }
      }

      const contactIds = registrations.map(r => r.contact.id)

      // 送信
      let result: unknown
      const emailSubject = subject ?? `【リマインド】${event.name}`
      switch (channel) {
        case "EMAIL":
          result = await executeTool("email_send", { contactIds, subject: emailSubject, html: reminderMsg }, tenantId)
          break
        case "LINE":
          result = await executeTool("line_send", { contactIds, message: reminderMsg }, tenantId)
          break
        case "SMS":
          result = await executeTool("sms_send", { contactIds, message: reminderMsg }, tenantId)
          break
      }

      // リマインド送信済みフラグを更新
      await prisma.eventRegistration.updateMany({
        where: { id: { in: registrations.map(r => r.id) } },
        data: {
          dayBeforeReminderSent: true,
          dayBeforeReminderSentAt: new Date(),
        },
      })

      return {
        event: { id: event.id, name: event.name },
        channel,
        targetCount: registrations.length,
        result,
        message: `${event.name}の申込者${registrations.length}名にリマインドを送信しました`,
      }
    }

    // ========================================================
    // 条件タグ付与
    // ========================================================
    case "contacts_bulk_tag": {
      const { tagName, conditions } = z.object({
        tagName: z.string().min(1),
        conditions: z.object({
          lifecycleStage: z.string().optional(),
          minScore: z.number().optional(),
          hasTag: z.string().optional(),
          notHasTag: z.string().optional(),
          createdAfter: z.string().optional(),
          createdBefore: z.string().optional(),
          emailOptIn: z.boolean().optional(),
          hasLineUserId: z.boolean().optional(),
        }),
      }).parse(a)

      // タグを upsert
      const tag = await prisma.tag.upsert({
        where: { tenantId_name: { tenantId, name: tagName } },
        create: { tenantId, name: tagName },
        update: {},
      })

      // 条件フィルタを構築
      const where: Record<string, unknown> = { tenantId }

      if (conditions.lifecycleStage) {
        where.lifecycleStage = conditions.lifecycleStage as never
      }
      if (conditions.minScore !== undefined) {
        where.score = { gte: conditions.minScore }
      }
      if (conditions.createdAfter) {
        where.createdAt = { ...(where.createdAt as Record<string, unknown> ?? {}), gte: new Date(conditions.createdAfter) }
      }
      if (conditions.createdBefore) {
        where.createdAt = { ...(where.createdAt as Record<string, unknown> ?? {}), lte: new Date(conditions.createdBefore) }
      }
      if (conditions.emailOptIn !== undefined) {
        where.emailOptIn = conditions.emailOptIn
      }
      if (conditions.hasLineUserId) {
        where.lineUserId = { not: null }
      }
      if (conditions.hasTag) {
        const requiredTag = await prisma.tag.findFirst({ where: { tenantId, name: { equals: conditions.hasTag, mode: "insensitive" } } })
        if (requiredTag) {
          where.tags = { some: { tagId: requiredTag.id } }
        }
      }
      if (conditions.notHasTag) {
        const excludeTag = await prisma.tag.findFirst({ where: { tenantId, name: { equals: conditions.notHasTag, mode: "insensitive" } } })
        if (excludeTag) {
          where.tags = {
            ...(where.tags as Record<string, unknown> ?? {}),
            none: { tagId: excludeTag.id },
          }
        }
      }

      // 該当連絡先を取得
      const contacts = await prisma.contact.findMany({
        where,
        select: { id: true },
      })

      if (contacts.length === 0) {
        return { tagged: 0, message: "条件に合致する連絡先がありません" }
      }

      // 既にタグが付いている連絡先を除外
      const existing = await prisma.contactTag.findMany({
        where: { tagId: tag.id, contactId: { in: contacts.map(c => c.id) } },
        select: { contactId: true },
      })
      const existingIds = new Set(existing.map(e => e.contactId))
      const newContacts = contacts.filter(c => !existingIds.has(c.id))

      if (newContacts.length > 0) {
        await prisma.contactTag.createMany({
          data: newContacts.map(c => ({ contactId: c.id, tagId: tag.id })),
          skipDuplicates: true,
        })
      }

      return {
        tagged: newContacts.length,
        alreadyTagged: existingIds.size,
        totalMatched: contacts.length,
        message: `${newContacts.length}件の連絡先にタグ「${tagName}」を付与しました`,
      }
    }

    // ========================================================
    // ファネルページ作成・更新
    // ========================================================
    case "funnel_page_create": {
      const validated = z.object({
        funnelId: z.string(),
        name: z.string().min(1),
        slug: z.string().min(1),
        content: z.array(z.object({
          componentType: z.string(),
          props: z.record(z.string(), z.unknown()).default({}),
          order: z.number().default(0),
        })),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
      }).parse(a)

      const funnel = await prisma.funnel.findFirst({ where: { id: validated.funnelId, tenantId } })
      if (!funnel) throw new Error("ファネルが見つかりません")

      // コンポーネントにIDを付与
      const components = validated.content.map((comp, idx) => ({
        id: `comp_${Date.now()}_${idx}`,
        componentType: comp.componentType,
        category: "content",
        order: comp.order || idx,
        props: comp.props,
      }))

      // 既存ページ数から order を決定
      const existingPages = await prisma.funnelPage.count({ where: { funnelId: validated.funnelId } })

      const page = await prisma.funnelPage.create({
        data: {
          funnelId: validated.funnelId,
          name: validated.name,
          slug: validated.slug,
          content: JSON.parse(JSON.stringify(components)),
          seoTitle: validated.seoTitle ?? null,
          seoDescription: validated.seoDescription ?? null,
          order: existingPages,
        },
      })

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://marketing-hub.example.com"
      return {
        page,
        publicUrl: `${baseUrl}/p/${validated.funnelId}/${validated.slug}`,
        message: `LP「${validated.name}」を作成しました`,
      }
    }

    case "funnel_page_update": {
      const validated = z.object({
        pageId: z.string(),
        name: z.string().optional(),
        content: z.array(z.object({
          componentType: z.string(),
          props: z.record(z.string(), z.unknown()).default({}),
          order: z.number().default(0),
        })).optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
      }).parse(a)

      const page = await prisma.funnelPage.findFirst({
        where: { id: validated.pageId },
        include: { funnel: { select: { tenantId: true } } },
      })
      if (!page || page.funnel.tenantId !== tenantId) throw new Error("ページが見つかりません")

      const updateData: Record<string, unknown> = {}
      if (validated.name) updateData.name = validated.name
      if (validated.seoTitle !== undefined) updateData.seoTitle = validated.seoTitle
      if (validated.seoDescription !== undefined) updateData.seoDescription = validated.seoDescription
      if (validated.content) {
        updateData.content = validated.content.map((comp, idx) => ({
          id: `comp_${Date.now()}_${idx}`,
          componentType: comp.componentType,
          category: "content",
          order: comp.order || idx,
          props: comp.props,
        }))
      }

      const updated = await prisma.funnelPage.update({
        where: { id: validated.pageId },
        data: updateData,
      })

      return { page: updated, message: `ページ「${updated.name}」を更新しました` }
    }

    // ========================================================
    // タグ削除
    // ========================================================
    case "contacts_remove_tag": {
      const { contactId, tagName } = z.object({
        contactId: z.string(),
        tagName: z.string().min(1),
      }).parse(a)

      const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId } })
      if (!contact) throw new Error("連絡先が見つかりません")

      const tag = await prisma.tag.findFirst({ where: { tenantId, name: { equals: tagName, mode: "insensitive" } } })
      if (!tag) throw new Error(`タグ「${tagName}」が見つかりません`)

      const contactTag = await prisma.contactTag.findFirst({ where: { contactId, tagId: tag.id } })
      if (!contactTag) {
        return { message: `タグ「${tagName}」は付与されていません` }
      }

      await prisma.contactTag.delete({ where: { id: contactTag.id } })
      return { message: `タグ「${tagName}」を削除しました` }
    }

    // LINE連携拡張 (5)
    // ============================================================
    case "line_rich_menu_list": {
      const { tabGroup } = z.object({ tabGroup: z.string().optional() }).parse(a)
      const menus = await prisma.lineRichMenu.findMany({
        where: {
          tenantId,
          ...(tabGroup ? { tabGroup } : {}),
        },
        orderBy: [{ tabGroup: "asc" }, { tabOrder: "asc" }, { createdAt: "desc" }],
      })
      return { menus, total: menus.length }
    }

    case "line_rich_menu_switch": {
      const { lineUserId, tabGroup, tabOrder } = z.object({
        lineUserId: z.string(),
        tabGroup: z.string(),
        tabOrder: z.number().int().min(0).default(0),
      }).parse(a)

      const targetMenu = await prisma.lineRichMenu.findFirst({
        where: { tenantId, tabGroup, tabOrder },
      })

      if (!targetMenu?.lineRichMenuId) {
        throw new Error(`タブグループ「${tabGroup}」のタブ${tabOrder}にリッチメニューが見つかりません`)
      }

      const { lineClient } = await import("@/lib/line/client")
      if (!lineClient) throw new Error("LINE client not configured")

      await lineClient.linkRichMenuToUser(lineUserId, targetMenu.lineRichMenuId)
      return { success: true, menuId: targetMenu.id, menuName: targetMenu.name }
    }

    case "line_auto_reply_list": {
      const { activeOnly } = z.object({ activeOnly: z.boolean().default(false) }).parse(a)
      const rules = await prisma.lineAutoReply.findMany({
        where: {
          tenantId,
          ...(activeOnly ? { isActive: true } : {}),
        },
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      })
      return { rules, total: rules.length }
    }

    case "line_auto_reply_create": {
      const { name, keyword, matchType, replyText, priority } = z.object({
        name: z.string().min(1),
        keyword: z.string().min(1),
        matchType: z.enum(["exact", "contains", "startsWith", "regex"]).default("contains"),
        replyText: z.string().min(1),
        priority: z.number().int().default(0),
      }).parse(a)

      const rule = await prisma.lineAutoReply.create({
        data: {
          tenantId,
          name,
          keyword,
          matchType,
          replyType: "text",
          replyContent: { text: replyText },
          priority,
        },
      })
      return { rule, message: `自動応答ルール「${name}」を作成しました` }
    }

    case "line_segment_send": {
      const { message, tagName, minScore, source } = z.object({
        message: z.string().min(1),
        tagName: z.string().optional(),
        minScore: z.number().optional(),
        source: z.string().optional(),
      }).parse(a)

      const where: Record<string, unknown> = {
        tenantId,
        lineUserId: { not: null },
        lineOptIn: true,
      }

      if (minScore !== undefined) {
        where.score = { gte: minScore }
      }
      if (source) {
        where.source = source
      }

      const contacts = await prisma.contact.findMany({
        where,
        include: tagName ? { tags: { include: { tag: true } } } : undefined,
      })

      // Tag filter in memory
      const filtered = tagName
        ? contacts.filter((c: Record<string, unknown>) => {
            const tags = c.tags as Array<{ tag: { name: string } }> | undefined
            return tags?.some(t => t.tag.name.toLowerCase() === tagName.toLowerCase())
          })
        : contacts

      const lineUserIds = filtered
        .map((c: Record<string, unknown>) => c.lineUserId as string | null)
        .filter((id): id is string => id !== null)

      if (lineUserIds.length === 0) {
        return { sent: 0, message: "条件に一致するLINE連携済みの連絡先がありません" }
      }

      // Send in batches of 500
      for (let i = 0; i < lineUserIds.length; i += 500) {
        const batch = lineUserIds.slice(i, i + 500)
        await multicastMessage(batch, [{ type: "text", text: message }])
      }

      return {
        sent: lineUserIds.length,
        message: `${lineUserIds.length}件のLINEメッセージを送信しました`,
      }
    }

    // LPビルダー (3)
    // ============================================================
    case "lp_component_list": {
      const { category } = z.object({ category: z.string().optional() }).parse(a)
      const { getAllComponents } = await import("@/components/lp-builder/components-registry")
      const allComponents = getAllComponents()
      const filtered = category
        ? allComponents.filter((c: { category: string }) => c.category === category)
        : allComponents
      return {
        components: filtered.map((c: { type: string; name: string; category: string; description?: string }) => ({
          type: c.type,
          name: c.name,
          category: c.category,
          description: c.description,
        })),
        total: filtered.length,
      }
    }

    case "lp_template_list": {
      const { category } = z.object({ category: z.string().optional() }).parse(a)
      const { LP_TEMPLATES } = await import("@/components/lp-builder/modes/template/templates/index")
      const filtered = category
        ? LP_TEMPLATES.filter(t => t.category === category)
        : LP_TEMPLATES
      return {
        templates: filtered.map(t => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          tags: t.tags,
          componentsCount: t.components.length,
        })),
        total: filtered.length,
      }
    }

    case "lp_page_create_from_template": {
      const { funnelId, templateId, pageName, slug } = z.object({
        funnelId: z.string(),
        templateId: z.string(),
        pageName: z.string().min(1),
        slug: z.string().min(1),
      }).parse(a)

      // Verify funnel ownership
      const funnel = await prisma.funnel.findFirst({
        where: { id: funnelId, tenantId },
      })
      if (!funnel) throw new Error("ファネルが見つかりません")

      // Get template
      const { LP_TEMPLATES } = await import("@/components/lp-builder/modes/template/templates/index")
      const template = LP_TEMPLATES.find(t => t.id === templateId)
      if (!template) throw new Error(`テンプレート「${templateId}」が見つかりません`)

      // Get max order for existing pages
      const maxPage = await prisma.funnelPage.findFirst({
        where: { funnelId },
        orderBy: { order: "desc" },
        select: { order: true },
      })

      const page = await prisma.funnelPage.create({
        data: {
          funnelId,
          name: pageName,
          slug,
          order: (maxPage?.order ?? 0) + 1,
          content: template.components as unknown as import("@prisma/client").Prisma.JsonArray,
        },
      })

      return {
        page: { id: page.id, name: page.name, slug: page.slug },
        template: { id: template.id, name: template.name },
        message: `テンプレート「${template.name}」からページ「${pageName}」を作成しました`,
      }
    }

    case "livestream_list": {
      const { tenantId, status, limit } = args as Record<string, unknown>
      const where: Record<string, unknown> = { tenantId: tenantId as string }
      if (status) where.status = status as string
      const livestreams = await prisma.liveStream.findMany({
        where,
        orderBy: { startAt: "desc" },
        take: (limit as number | undefined) ?? 20,
        include: { event: { select: { id: true, name: true } } },
      })
      return { livestreams, total: livestreams.length }
    }

    case "livestream_create": {
      const { tenantId, name, description, startAt, eventId, chatEnabled, recordingEnabled } = args as Record<string, unknown>
      const { generateRoomName } = await import("@/lib/livestream/livekit")
      const roomId = (eventId as string | undefined) ?? `standalone-${Date.now()}`
      const roomName = generateRoomName(roomId)
      const livestream = await prisma.liveStream.create({
        data: {
          tenantId: tenantId as string,
          name: name as string,
          description: (description as string | undefined) ?? null,
          startAt: new Date(startAt as string),
          eventId: (eventId as string | undefined) ?? null,
          chatEnabled: (chatEnabled as boolean | undefined) ?? true,
          recordingEnabled: (recordingEnabled as boolean | undefined) ?? false,
          roomName,
          status: "SCHEDULED",
        },
      })
      return {
        livestream: { id: livestream.id, name: livestream.name, roomName: livestream.roomName, startAt: livestream.startAt, status: livestream.status },
        message: `ライブ配信「${livestream.name}」をスケジュールしました`,
      }
    }

    case "livestream_update_status": {
      const { tenantId, livestreamId, status } = args as Record<string, unknown>
      const updateData: Record<string, unknown> = { status: status as string }
      if (status === "COMPLETED" || status === "CANCELED") {
        updateData.endAt = new Date()
      }
      const livestream = await prisma.liveStream.update({
        where: { id: livestreamId as string, tenantId: tenantId as string },
        data: updateData,
      })
      return {
        livestream: { id: livestream.id, name: livestream.name, status: livestream.status },
        message: `ライブ配信「${livestream.name}」のステータスを「${status}」に更新しました`,
      }
    }

    case "livestream_chat_list": {
      const { tenantId, livestreamId, limit } = args as Record<string, unknown>
      const messages = await prisma.liveChatMessage.findMany({
        where: { livestreamId: livestreamId as string, livestream: { tenantId: tenantId as string } },
        orderBy: { createdAt: "asc" },
        take: (limit as number | undefined) ?? 50,
      })
      return { messages, total: messages.length }
    }

    case "livestream_chat_send": {
      const { tenantId, livestreamId, content, senderName, messageType } = args as Record<string, unknown>
      const livestream = await prisma.liveStream.findFirst({
        where: { id: livestreamId as string, tenantId: tenantId as string },
      })
      if (!livestream) throw new Error(`LiveStream not found: ${livestreamId as string}`)
      const message = await prisma.liveChatMessage.create({
        data: {
          tenantId: tenantId as string,
          livestreamId: livestreamId as string,
          content: content as string,
          senderName: (senderName as string | undefined) ?? "システム",
          messageType: (messageType as string | undefined) ?? "ANNOUNCEMENT",
        },
      })
      return {
        message: { id: message.id, content: message.content, senderName: message.senderName, messageType: message.messageType },
        result: "メッセージを送信しました",
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
