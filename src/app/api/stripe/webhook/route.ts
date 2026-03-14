/**
 * Stripe Webhook Handler
 * checkout.session.completed → Order 作成
 * invoice.payment_succeeded → Subscription 更新
 * customer.subscription.deleted → Subscription キャンセル
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { stripe, constructWebhookEvent } from "@/lib/stripe/client"
import type Stripe from "stripe"

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch (err) {
    console.error("Webhook signature verification failed:", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
      default:
        // 未処理イベントは無視
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Webhook handler error for ${event.type}:`, error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { tenantId, productId, contactId } = session.metadata ?? {}
  if (!tenantId || !productId) return

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
  })
  if (!product) return

  let resolvedContactId = contactId ?? null

  // contactIdがない場合はメールから検索または作成
  if (!resolvedContactId && session.customer_details?.email) {
    const email = session.customer_details.email
    const name = session.customer_details.name ?? undefined

    let contact = await prisma.contact.findFirst({
      where: { tenantId, email },
    })

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          tenantId,
          email,
          name: name ?? null,
        },
      })
    }
    resolvedContactId = contact.id
  }

  if (!resolvedContactId) return

  if (product.type === "ONE_TIME") {
    await prisma.order.create({
      data: {
        tenantId,
        contactId: resolvedContactId,
        productId,
        amount: session.amount_total ?? product.price,
        currency: (session.currency ?? product.currency).toUpperCase(),
        status: "COMPLETED",
        stripePaymentIntentId: typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      },
    })
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceAny = invoice as any
  if (!invoiceAny.subscription) return

  const subscriptionId = typeof invoiceAny.subscription === "string"
    ? invoiceAny.subscription
    : invoiceAny.subscription.id

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!subscription) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId) as any

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "ACTIVE",
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    },
  })
}

async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: stripeSubscription.id },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  })
}
