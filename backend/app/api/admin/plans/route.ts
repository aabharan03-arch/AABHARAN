// app/api/admin/plans/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace with your frontend domain in production
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

function verifyAdmin(req: Request): { ok: true; decoded: any } | { ok: false; response: NextResponse } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Unauthorized. No token provided.' },
        { status: 401, headers: corsHeaders }
      ),
    };
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return { ok: true, decoded };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid or expired token.' },
        { status: 401, headers: corsHeaders }
      ),
    };
  }
}

// GET /api/admin/plans — list all plans
export async function GET(req: Request) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.ok) return auth.response;

    const plans = await prisma.plan.findMany({
      orderBy: { cost: 'asc' },
    });

    return NextResponse.json(
      { success: true, count: plans.length, plans },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Fetch Plans Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/admin/plans — create a new plan
export async function POST(req: Request) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.ok) return auth.response;

    if (auth.decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only Admins can create plans.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { name, months, cost } = body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'name is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (months === undefined || typeof months !== 'number' || !Number.isInteger(months) || months <= 0) {
      return NextResponse.json(
        { error: 'months is required and must be a positive integer.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (cost === undefined || typeof cost !== 'number' || cost < 0) {
      return NextResponse.json(
        { error: 'cost is required and must be a non-negative number.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name: name.trim(),
        months,
        cost,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Plan created successfully.', plan },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Create Plan Error:', error);

    // Handle unique constraint violation on `name`
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A plan with this name already exists.' },
        { status: 409, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}