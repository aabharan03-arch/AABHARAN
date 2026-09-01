// app/api/customer/wishlist/toggle/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

async function verifyCustomer(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Unauthorized. Token missing.', status: 401 } as const;
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = await decrypt(token);
    if (!payload?.userId) {
      return { error: 'Invalid token payload.', status: 401 } as const;
    }
    return { userId: payload.userId as string };
  } catch {
    return { error: 'Invalid or expired token.', status: 401 } as const;
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifyCustomer(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }
    const { userId } = auth;

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId is required.' }, { status: 400, headers: corsHeaders });
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: { customerId_productId: { customerId: userId, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false }, { status: 200, headers: corsHeaders });
    }

    await prisma.wishlistItem.create({
      data: { customerId: userId, productId },
    });
    return NextResponse.json({ liked: true }, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    console.error('Wishlist toggle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update wishlist.' },
      { status: 500, headers: corsHeaders }
    );
  }
}