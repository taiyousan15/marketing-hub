import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import Stripe from "stripe";

interface RouteParams {
  params: Promise<{ id: string; offerId: string }>;
}

// Stripe初期化（環境変数から）
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Stripeチェックアウトセッション作成
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, offerId } = await params;
    const body = await request.json();
    const { sessionToken, contactId, priceId } = body;

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    // オファーの存在確認
    const offer = await prisma.autoWebinarTimedOffer.findFirst({
      where: {
        id: offerId,
        webinarId: id,
      },
      include: {
        webinar: {
          select: { tenantId: true, title: true },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (!offer.stripePriceId && !priceId) {
      return NextResponse.json(
        { error: "No price configured for this offer" },
        { status: 400 }
      );
    }

    // コンタクト情報を取得（あれば）
    let customerEmail: string | undefined;
    if (contactId) {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { email: true },
      });
      customerEmail = contact?.email || undefined;
    }

    // 成功/キャンセルURL
    const origin = request.headers.get("origin") || "http://localhost:3000";
    const successUrl = offer.stripeSuccessUrl || `${origin}/webinar/${id}/watch?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = offer.stripeCancelUrl || `${origin}/webinar/${id}/watch?canceled=true`;

    // Stripeチェックアウトセッション作成
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: offer.stripePriceId || priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        webinarId: id,
        offerId: offerId,
        sessionToken: sessionToken || "",
        contactId: contactId || "",
      },
      allow_promotion_codes: true,
    });

    // クリックカウントを更新
    await prisma.autoWebinarTimedOffer.update({
      where: { id: offerId },
      data: {
        clickCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("Failed to create checkout session:", error);

    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
