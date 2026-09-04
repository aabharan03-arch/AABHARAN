import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

function verifySuperAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized. Token missing.', status: 401 } as const;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };
    if (decoded.role !== 'admin') {
      return { error: 'Forbidden. Super Admin access required.', status: 403 } as const;
    }
    return { decoded };
  } catch (error) {
    return { error: 'Invalid or expired token.', status: 401 } as const;
  }
}

export async function GET(req: Request) {
  try {
    const auth = verifySuperAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Directly fetch storeAdmin details without joining Store
    const enquiries = await prisma.enquiry.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
      },
      include: {
        storeAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      {
        success: true,
        count: enquiries.length,
        enquiries,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Fetch all enquiries error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}