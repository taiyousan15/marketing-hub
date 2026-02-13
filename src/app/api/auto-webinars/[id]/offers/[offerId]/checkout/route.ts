import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string; offerId: string }>;
}

/**
 * Stripeチェックアウトセッション作成 - Stub Implementation
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, offerId } = await params;

    if (!id || !offerId) {
      return NextResponse.json(
        { error: "Webinar ID and Offer ID required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: false,
      error: "Stripe checkout not implemented",
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
