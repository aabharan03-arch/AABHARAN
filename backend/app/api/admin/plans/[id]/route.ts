// app/api/admin/plans/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace with your frontend domain in production
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
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

// PUT /api/admin/plans/[id] — update name, months, cost
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = verifyAdmin(req);
    if (!auth.ok) return auth.response;

    if (auth.decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only Admins can update plans.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, months, cost } = body;

    // Build update payload from only the fields provided
    const data: { name?: string; months?: number; cost?: number } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { error: 'name must be a non-empty string.' },
          { status: 400, headers: corsHeaders }
        );
      }
      data.name = name.trim();
    }

    if (months !== undefined) {
      if (typeof months !== 'number' || !Number.isInteger(months) || months <= 0) {
        return NextResponse.json(
          { error: 'months must be a positive integer.' },
          { status: 400, headers: corsHeaders }
        );
      }
      data.months = months;
    }

    if (cost !== undefined) {
      if (typeof cost !== 'number' || cost < 0) {
        return NextResponse.json(
          { error: 'cost must be a non-negative number.' },
          { status: 400, headers: corsHeaders }
        );
      }
      data.cost = cost;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'At least one of name, months, cost must be provided.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const plan = await prisma.plan.update({
      where: { id },
      data,
    });

    return NextResponse.json(
      { success: true, message: 'Plan updated successfully.', plan },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Update Plan Error:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Plan not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

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