import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/prisma";
import { processPurchase } from "@/lib/affiliate/service";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // イベントタイプに応じた処理
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
      break;

    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
      break;

    case "invoice.payment_failed":
      await handleInvoiceFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`Unhandled Stripe event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log("Checkout completed:", session.id);

  const { tenantId, contactId, productId } = session.metadata || {};

  if (!tenantId || !contactId || !productId) {
    console.error("Missing metadata in checkout session");
    return;
  }

  // 注文を完了状態に更新
  const updatedOrders = await prisma.order.updateMany({
    where: {
      stripePaymentIntentId: session.payment_intent as string,
    },
    data: {
      status: "COMPLETED",
    },
  });

  // 注文情報を取得
  const order = await prisma.order.findFirst({
    where: {
      stripePaymentIntentId: session.payment_intent as string,
    },
  });

  // 商品に紐付いたコースがあれば、受講権限を付与
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { course: true },
  });

  if (product?.courseId) {
    await prisma.courseEnrollment.upsert({
      where: {
        courseId_contactId: {
          courseId: product.courseId,
          contactId,
        },
      },
      create: {
        courseId: product.courseId,
        contactId,
      },
      update: {},
    });
  }

  // アフィリエイト報酬を処理
  // コンタクトに紹介者がいる場合、バックエンド報酬を計算
  if (order && product?.affiliateEnabled) {
    try {
      const affiliateResult = await processPurchase({
        tenantId,
        orderId: order.id,
        contactId,
        productId,
        amount: order.amount,
      });

      if (affiliateResult.success) {
        console.log(
          `Affiliate commissions created for order ${order.id}:`,
          affiliateResult.commissions
        );
      }
    } catch (error) {
      console.error("Error processing affiliate commission:", error);
      // アフィリエイト処理のエラーは決済には影響させない
    }
  }

  // TODO: サンクスメール送信、タグ付与などのアクション
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment succeeded:", paymentIntent.id);

  // 注文ステータスを更新
  await prisma.order.updateMany({
    where: {
      stripePaymentIntentId: paymentIntent.id,
    },
    data: {
      status: "COMPLETED",
      stripeChargeId: paymentIntent.latest_charge as string,
    },
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment failed:", paymentIntent.id);

  // 注文ステータスを更新
  await prisma.order.updateMany({
    where: {
      stripePaymentIntentId: paymentIntent.id,
    },
    data: {
      status: "FAILED",
    },
  });

  // TODO: 支払い失敗通知を送信
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);

  // Stripe APIの型定義に対応
  const sub = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    unpaid: "UNPAID",
    incomplete: "PAUSED",
    incomplete_expired: "CANCELED",
    trialing: "ACTIVE",
    paused: "PAUSED",
  };

  // サブスクリプション情報を更新
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: (statusMap[subscription.status] || "PAUSED") as "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID" | "PAUSED",
      ...(sub.current_period_start && {
        currentPeriodStart: new Date(sub.current_period_start * 1000),
      }),
      ...(sub.current_period_end && {
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      }),
    },
  });
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  console.log("Subscription canceled:", subscription.id);

  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
    },
  });

  // TODO: 解約通知、アクセス権削除などのアクション
}

async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  console.log("Invoice payment failed:", invoice.id);

  // TODO: 支払い失敗通知を送信
}
