import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
    const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET!);
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: corsHeaders });
    }

    const { id } = await params;
    const { amount, discount, status, method, txnRef, notes } = await req.json();

    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Payment not found.' }, { status: 404, headers: corsHeaders });
    }

    const data: any = {};
    if (amount != null) data.amount = Number(amount);
    if (discount != null) data.discount = Number(discount);
    if (method) data.method = method;
    if (txnRef !== undefined) data.txnRef = txnRef;
    if (notes !== undefined) data.notes = notes;
    if (status) {
      if (!['PAID', 'PENDING', 'FAILED', 'REFUNDED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400, headers: corsHeaders });
      }
      data.status = status;
    }

    const payment = await prisma.payment.update({
      where: { id },
      data,
      include: {
        storeAdmin: { select: { id: true, name: true, email: true, store: { select: { name: true } } } },
        plan: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ message: 'Payment updated.', payment }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Update Payment Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}