// app/api/customer/wishlist/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: corsHeaders });
    }
    const token = authHeader.split(' ')[1];

    let userId: string;
    try {
      const payload = await decrypt(token);
      if (!payload?.userId) {
        return NextResponse.json({ error: 'Invalid token payload.' }, { status: 401, headers: corsHeaders });
      }
      userId = payload.userId as string;
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401, headers: corsHeaders });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });

    return NextResponse.json(
      {
        success: true,
        count: items.length,
        products: items.map((i) => i.product),
        productIds: items.map((i) => i.productId),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Wishlist fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch wishlist.' },
      { status: 500, headers: corsHeaders }
    );
  }
}     