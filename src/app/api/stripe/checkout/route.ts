/**
 * Stripe Checkout Session API
 * POST: チェックアウトセッション作成
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getCurrentUser } from "@/lib/auth/tenant"
import { stripe, createCheckoutSession } from "@/lib/stripe/client"
import { z } from "zod"

const checkoutSchema = z.object({
  productId: z.string(),
  contactId: z.string().optional(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
})

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 503 }
      )
    }

    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = checkoutSchema.parse(body)

    const product = await prisma.product.findFirst({
      where: { id: validated.productId, tenantId: currentUser.tenantId, isActive: true },
    })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (!product.stripePriceId) {
      return NextResponse.json(
        { error: "Product is not synced with Stripe. Please re-save the product." },
        { status: 400 }
      )
    }

    let stripeCustomerId: string | undefined

    if (validated.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: validated.contactId, tenantId: currentUser.tenantId },
      })

      if (contact) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: currentUser.tenantId },
          select: { stripeCustomerId: true },
        })
        stripeCustomerId = tenant?.stripeCustomerId ?? undefined
      }
    }

    const mode = product.type === "SUBSCRIPTION" ? "subscription" : "payment"

    const session = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId: product.stripePriceId,
      successUrl: validated.successUrl,
      cancelUrl: validated.cancelUrl,
      mode,
      metadata: {
        tenantId: currentUser.tenantId,
        productId: product.id,
        ...(validated.contactId ? { contactId: validated.contactId } : {}),
      },
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    console.error("Stripe checkout POST error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
