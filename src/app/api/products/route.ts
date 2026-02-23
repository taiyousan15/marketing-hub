import { NextResponse } from 'next/server';
import { getProducts, createProduct } from '@/actions/products';

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('GET /api/products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const product = await createProduct(body);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    console.error('POST /api/products error:', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
