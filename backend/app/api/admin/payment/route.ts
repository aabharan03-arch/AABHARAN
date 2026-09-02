import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded: any = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET!);
    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
}

// GET /api/admin/payments — all payments + summaries
export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const payments = await prisma.payment.findMany({
      orderBy: { paidAt: 'desc' },
      include: {
        storeAdmin: { select: { id: true, name: true, email: true, store: { select: { name: true } } } },
        plan: { select: { id: true, name: true } },
      },
    });

    // ---- Revenue summaries (only PAID payments count) ----
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7)); // Monday
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const sum = (list: typeof payments) =>
      list.reduce((acc, p) => acc + (p.amount - p.discount), 0);

    const paid = payments.filter((p) => p.status === 'PAID');

    const summary = {
      today: sum(paid.filter((p) => new Date(p.paidAt) >= startOfToday)),
      week: sum(paid.filter((p) => new Date(p.paidAt) >= startOfWeek)),
      month: sum(paid.filter((p) => new Date(p.paidAt) >= startOfMonth)),
      lifetime: sum(paid),
    };

    return NextResponse.json({ payments, summary }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Get Payments Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/admin/payments — record a new payment
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { storeAdminId, planId, method, amount, discount, txnRef, collectedBy, notes } =
      await req.json();

    if (!storeAdminId || amount == null) {
      return NextResponse.json(
        { error: 'storeAdminId and amount are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const storeAdmin = await prisma.storeAdmin.findUnique({
      where: { id: storeAdminId },
      include: { store: true },
    });
    if (!storeAdmin) {
      return NextResponse.json({ error: 'Store admin not found.' }, { status: 404, headers: corsHeaders });
    }

    // Resolve plan name (snapshot) if planId provided
    let planName = 'Custom';
    let planMonths: number | null = null;
    if (planId) {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        return NextResponse.json({ error: 'Plan not found.' }, { status: 404, headers: corsHeaders });
      }
      planName = plan.name;
      planMonths = plan.months;
    }

    // Generate sequential invoice number: INV-2025-0001
    const year = new Date().getFullYear();
    const count = await prisma.payment.count();
    const invoiceNo = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    const payment = await prisma.$transaction(async (tx) => {
      const paymentRecord = await tx.payment.create({
        data: {
          invoiceNo,
          txnRef: txnRef || null,
          storeAdminId,
          planId: planId || null,
          planName,
          method: method || 'UPI',
          amount: Number(amount),
          discount: Number(discount) || 0,
          collectedBy: collectedBy || 'Admin',
          notes: notes || null,
          status: 'PAID',
        },
        include: {
          storeAdmin: { select: { id: true, name: true, email: true, store: { select: { name: true } } } },
          plan: { select: { id: true, name: true } },
        },
      });

      // Optionally auto-create an active subscription matching this payment
      if (planId && planMonths) {
        await tx.storeSubscription.updateMany({
          where: { storeAdminId, isActive: true },
          data: { isActive: false },
        });

        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + planMonths);

        await tx.storeSubscription.create({
          data: {
            storeAdminId,
            planId,
            amountPaid: Number(amount),
            startDate: new Date(),
            expiryDate,
            isActive: true,
          },
        });
      }

      return paymentRecord;
    });

    return NextResponse.json({ message: 'Payment recorded.', payment }, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    console.error('Create Payment Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}