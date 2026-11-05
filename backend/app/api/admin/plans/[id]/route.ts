import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods':
    'GET, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json(
    {},
    { status: 200, headers: corsHeaders }
  );
}

function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      authHeader.split(' ')[1],
      process.env.JWT_SECRET!
    ) as {
      id: string;
      role: string;
    };

    return decoded.role === 'admin'
      ? decoded
      : null;
  } catch {
    return null;
  }
}

function validateOptionalInteger(
  value: unknown,
  allowNull = false
) {
  if (allowNull && value === null) return true;

  return (
    Number.isInteger(value) &&
    Number(value) >= 0
  );
}

export async function PUT(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const admin = verifyAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.plan.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Plan not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (
      body.name !== undefined &&
      (typeof body.name !== 'string' ||
        !body.name.trim())
    ) {
      return NextResponse.json(
        { error: 'Invalid plan name.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      body.months !== undefined &&
      (!Number.isInteger(body.months) ||
        body.months <= 0)
    ) {
      return NextResponse.json(
        { error: 'Invalid months.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      body.cost !== undefined &&
      (typeof body.cost !== 'number' ||
        !Number.isFinite(body.cost) ||
        body.cost < 0)
    ) {
      return NextResponse.json(
        { error: 'Invalid cost.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (
      body.maxProducts !== undefined &&
      !validateOptionalInteger(
        body.maxProducts,
        true
      )
    ) {
      return NextResponse.json(
        {
          error:
            'maxProducts must be null or a non-negative whole number.',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    for (const field of [
      'maxCoverPhotos',
      'maxAdvertisePhotos',
      'priority',
    ] as const) {
      if (
        body[field] !== undefined &&
        !validateOptionalInteger(body[field])
      ) {
        return NextResponse.json(
          {
            error: `${field} must be a non-negative whole number.`,
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }
    }

    if (
      body.popupEnabled !== undefined &&
      typeof body.popupEnabled !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'popupEnabled must be boolean.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(body.name !== undefined
          ? { name: body.name.trim() }
          : {}),
        ...(body.months !== undefined
          ? { months: body.months }
          : {}),
        ...(body.cost !== undefined
          ? { cost: body.cost }
          : {}),
        ...(body.maxProducts !== undefined
          ? { maxProducts: body.maxProducts }
          : {}),
        ...(body.maxCoverPhotos !== undefined
          ? {
              maxCoverPhotos:
                body.maxCoverPhotos,
            }
          : {}),
        ...(body.maxAdvertisePhotos !== undefined
          ? {
              maxAdvertisePhotos:
                body.maxAdvertisePhotos,
            }
          : {}),
        ...(body.popupEnabled !== undefined
          ? {
              popupEnabled:
                body.popupEnabled,
            }
          : {}),
        ...(body.priority !== undefined
          ? { priority: body.priority }
          : {}),
      },
    });

    // No StoreSubscription update is required.
    // Existing subscriptions point to this Plan row,
    // so the new limits take effect immediately.

    return NextResponse.json(
      {
        success: true,
        message: 'Plan updated successfully.',
        plan,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error:
            'A plan with this name already exists.',
        },
        { status: 409, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
