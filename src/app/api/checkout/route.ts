import { NextResponse } from 'next/server';
import { initiateCheckout } from '@/actions/orders';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { productId, contactId, successUrl, cancelUrl } = body;

    if (!productId || !contactId) {
      return NextResponse.json(
        { error: 'productId and contactId are required' },
        { status: 400 }
      );
    }

    const result = await initiateCheckout({
      productId,
      contactId,
      successUrl: successUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/orders?success=true`,
      cancelUrl: cancelUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/orders?canceled=true`,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed';
    console.error('POST /api/checkout error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
