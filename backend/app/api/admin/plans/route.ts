import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  'Access-Control-Allow-Methods':
    'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Unauthorized. No token provided.' },
        { status: 401, headers: corsHeaders }
      ),
    };
  }

  try {
    const decoded = jwt.verify(
      authHeader.split(' ')[1],
      process.env.JWT_SECRET!
    ) as {
      id: string;
      role: string;
    };

    if (decoded.role !== 'admin') {
      return {
        ok: false as const,
        response: NextResponse.json(
          { error: 'Forbidden. Admin access required.' },
          { status: 403, headers: corsHeaders }
        ),
      };
    }

    return {
      ok: true as const,
      decoded,
    };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Invalid or expired token.' },
        { status: 401, headers: corsHeaders }
      ),
    };
  }
}

function validatePlanBody(body: any) {
  const {
    name,
    months,
    cost,
    maxProducts,
    maxCoverPhotos,
    maxAdvertisePhotos,
    popupEnabled,
    priority,
  } = body;

  if (
    !name ||
    typeof name !== 'string' ||
    !name.trim()
  ) {
    return 'name is required.';
  }

  if (
    !Number.isInteger(months) ||
    months <= 0
  ) {
    return 'months must be a positive whole number.';
  }

  if (
    typeof cost !== 'number' ||
    !Number.isFinite(cost) ||
    cost < 0
  ) {
    return 'cost must be a non-negative number.';
  }

  if (
    maxProducts !== null &&
    (!Number.isInteger(maxProducts) ||
      maxProducts < 0)
  ) {
    return 'maxProducts must be null (unlimited) or a non-negative whole number.';
  }

  if (
    !Number.isInteger(maxCoverPhotos) ||
    maxCoverPhotos < 0
  ) {
    return 'maxCoverPhotos must be a non-negative whole number.';
  }

  if (
    !Number.isInteger(maxAdvertisePhotos) ||
    maxAdvertisePhotos < 0
  ) {
    return 'maxAdvertisePhotos must be a non-negative whole number.';
  }

  if (typeof popupEnabled !== 'boolean') {
    return 'popupEnabled must be true or false.';
  }

  if (
    !Number.isInteger(priority) ||
    priority < 0
  ) {
    return 'priority must be a non-negative whole number.';
  }

  return null;
}

// GET /api/admin/plans
export async function GET(req: Request) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.ok) return auth.response;

    const plans = await prisma.plan.findMany({
      orderBy: [
        { priority: 'asc' },
        { cost: 'asc' },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        count: plans.length,
        plans,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/admin/plans
export async function POST(req: Request) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const validationError = validatePlanBody(body);

    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400, headers: corsHeaders }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name: body.name.trim(),
        months: body.months,
        cost: body.cost,
        maxProducts: body.maxProducts,
        maxCoverPhotos: body.maxCoverPhotos,
        maxAdvertisePhotos:
          body.maxAdvertisePhotos,
        popupEnabled: body.popupEnabled,
        priority: body.priority,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Plan created successfully.',
        plan,
      },
      { status: 201, headers: corsHeaders }
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
