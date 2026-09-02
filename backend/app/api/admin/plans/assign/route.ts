// app/api/admin/plans/assign/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(    { error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }
    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token.' }, { status: 401, headers: corsHeaders });
    }
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403, headers: corsHeaders });
    }

    const { storeAdminId, planId } = await req.json();
    if (!storeAdminId || !planId) {
      return NextResponse.json({ error: 'storeAdminId and planId are required.' }, { status: 400, headers: corsHeaders });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found.' }, { status: 404, headers: corsHeaders });
    }

    const startDate = new Date();
    const expiryDate = new Date(startDate);
    expiryDate.setMonth(expiryDate.getMonth() + plan.months);

    const subscription = await prisma.$transaction(async (tx) => {
      // Deactivate any current active subscription for this store admin
      await tx.storeSubscription.updateMany({
        where: { storeAdminId, isActive: true },
        data: { isActive: false },
      });

      // Create the new active subscription
      return tx.storeSubscription.create({
        data: {
          storeAdminId,
          planId,
          amountPaid: plan.cost,
          startDate,
          expiryDate,
          isActive: true,
        },
        include: { plan: true },
      });
    });

    return NextResponse.json(
      { message: 'Plan assigned successfully.', subscription },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Assign Plan Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}