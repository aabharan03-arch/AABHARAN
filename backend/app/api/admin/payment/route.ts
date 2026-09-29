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
    const decoded: any = jwt.verify(
      authHeader.split(' ')[1],
      process.env.JWT_SECRET!
    );

    return decoded.role === 'admin' ? decoded : null;
  } catch {
    return null;
  }
}

type PaymentBreakdownInput = {
  method: 'UPI' | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';
  amount: number;
  txnRef?: string;
};

function normalizePayment(payment: any) {
  const stored = payment.paymentBreakdown || [];

  return {
    ...payment,
    paymentBreakdown:
      stored.length > 0
        ? stored
        : [
            {
              id: `legacy-${payment.id}`,
              paymentId: payment.id,
              method: payment.method,
              amount: payment.amount - payment.discount,
              txnRef: payment.txnRef,
              createdAt: payment.createdAt,
            },
          ],
  };
}

// GET /api/admin/payments
export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const payments = await prisma.payment.findMany({
      orderBy: { paidAt: 'desc' },
      include: {
        paymentBreakdown: {
          orderBy: { createdAt: 'asc' },
        },
        storeAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
            store: {
              select: {
                name: true,
              },
            },
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const normalizedPayments = payments.map(normalizePayment);

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(
      startOfToday.getDate() - ((startOfToday.getDay() + 6) % 7)
    );

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const sum = (list: typeof normalizedPayments) =>
      list.reduce(
        (acc, payment) =>
          acc + (payment.amount - payment.discount),
        0
      );

    const paid = normalizedPayments.filter(
      (payment) => payment.status === 'PAID'
    );

    const summary = {
      today: sum(
        paid.filter(
          (payment) => new Date(payment.paidAt) >= startOfToday
        )
      ),
      week: sum(
        paid.filter(
          (payment) => new Date(payment.paidAt) >= startOfWeek
        )
      ),
      month: sum(
        paid.filter(
          (payment) => new Date(payment.paidAt) >= startOfMonth
        )
      ),
      lifetime: sum(paid),
    };

    return NextResponse.json(
      {
        success: true,
        payments: normalizedPayments,
        summary,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Get Payments Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/admin/payments
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: corsHeaders }
      );
    }

    const {
      storeAdminId,
      planId,
      amount,
      discount,
      collectedBy,
      notes,
      paymentBreakdown,
    } = await req.json();

    if (!storeAdminId || amount == null) {
      return NextResponse.json(
        { error: 'storeAdminId and amount are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const billAmount = Number(amount);
    const discountAmount = Number(discount) || 0;
    const netPayable = Number(
      (billAmount - discountAmount).toFixed(2)
    );

    if (!Number.isFinite(billAmount) || billAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than zero.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      !Number.isFinite(discountAmount) ||
      discountAmount < 0 ||
      discountAmount > billAmount
    ) {
      return NextResponse.json(
        { error: 'Invalid discount amount.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!Array.isArray(paymentBreakdown) || paymentBreakdown.length === 0) {
      return NextResponse.json(
        { error: 'At least one payment method is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const allowedMethods = new Set([
      'UPI',
      'CASH',
      'CARD',
      'BANK_TRANSFER',
      'CHEQUE',
      'OTHER',
    ]);

    const normalizedBreakdown: PaymentBreakdownInput[] =
      paymentBreakdown.map((item: any) => ({
        method: String(item.method || '').toUpperCase() as PaymentBreakdownInput['method'],
        amount: Number(item.amount),
        txnRef: item.txnRef
          ? String(item.txnRef).trim()
          : undefined,
      }));

    for (const split of normalizedBreakdown) {
      if (!allowedMethods.has(split.method)) {
        return NextResponse.json(
          { error: `Invalid payment method: ${split.method}` },
          { status: 400, headers: corsHeaders }
        );
      }

      if (!Number.isFinite(split.amount) || split.amount <= 0) {
        return NextResponse.json(
          {
            error:
              'Every payment split must have an amount greater than zero.',
          },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    const splitTotal = Number(
      normalizedBreakdown
        .reduce((sum, split) => sum + split.amount, 0)
        .toFixed(2)
    );

    if (Math.abs(splitTotal - netPayable) > 0.01) {
      return NextResponse.json(
        {
          error:
            `Payment breakdown total (${splitTotal}) must equal ` +
            `the net payable amount (${netPayable}).`,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const storeAdmin = await prisma.storeAdmin.findUnique({
      where: { id: storeAdminId },
      include: { store: true },
    });

    if (!storeAdmin) {
      return NextResponse.json(
        { error: 'Store admin not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    let planName = 'Custom';
    let planMonths: number | null = null;

    if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      });

      if (!plan) {
        return NextResponse.json(
          { error: 'Plan not found.' },
          { status: 404, headers: corsHeaders }
        );
      }

      planName = plan.name;
      planMonths = plan.months;
    }

    const year = new Date().getFullYear();
    const invoiceNo = `INV-${year}-${Date.now()
      .toString()
      .slice(-6)}`;

    const payment = await prisma.$transaction(async (tx) => {
      const single =
        normalizedBreakdown.length === 1
          ? normalizedBreakdown[0]
          : null;

      const paymentRecord = await tx.payment.create({
        data: {
          invoiceNo,
          storeAdminId,
          planId: planId || null,
          planName,

          // Legacy fields retained for older frontend/backend code.
          method: single?.method || 'OTHER',
          txnRef: single?.txnRef || null,

          amount: billAmount,
          discount: discountAmount,
          collectedBy: collectedBy || 'Admin',
          notes: notes || null,
          status: 'PAID',

          paymentBreakdown: {
            create: normalizedBreakdown.map((split) => ({
              method: split.method,
              amount: split.amount,
              txnRef: split.txnRef || null,
            })),
          },
        },
        include: {
          paymentBreakdown: {
            orderBy: { createdAt: 'asc' },
          },
          storeAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
              store: {
                select: {
                  name: true,
                },
              },
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (planId && planMonths) {
        await tx.storeSubscription.updateMany({
          where: {
            storeAdminId,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        const expiryDate = new Date();
        expiryDate.setMonth(
          expiryDate.getMonth() + planMonths
        );

        await tx.storeSubscription.create({
          data: {
            storeAdminId,
            planId,
            amountPaid: netPayable,
            startDate: new Date(),
            expiryDate,
            isActive: true,
          },
        });
      }

      return paymentRecord;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Payment recorded.',
        payment: normalizePayment(payment),
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Create Payment Error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}
