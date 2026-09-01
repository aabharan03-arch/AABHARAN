// app/api/storeadmin/enquiries/route.ts
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

function verifyStoreAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized. Token missing.', status: 401 } as const;
  }
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    id: string;
    role: string;
  };
  if (decoded.role !== 'storeadmin') {
    return { error: 'Forbidden. Invalid role.', status: 403 } as const;
  }
  return { decoded };
}

// GET /api/storeadmin/enquiries — list all enquiries for the logged-in store admin
export async function GET(req: Request) {
  try {
    const auth = verifyStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }
    const { decoded } = auth;

    // Optional ?status=NEW|CONTACTED|CLOSED filter for the portal's tabs/filters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const enquiries = await prisma.enquiry.findMany({
      where: {
        storeAdminId: decoded.id,
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, images: true, category: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, count: enquiries.length, enquiries },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Fetch enquiries error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch enquiries.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH /api/storeadmin/enquiries — update an enquiry's status (mark contacted/closed)
export async function PATCH(req: Request) {
  try {
    const auth = verifyStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }
    const { decoded } = auth;

    const { enquiryId, status } = await req.json();
    if (!enquiryId || !status) {
      return NextResponse.json(
        { error: 'enquiryId and status are required.' },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!['NEW', 'CONTACTED', 'CLOSED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Scope the update to this store admin's own enquiries only —
    // prevents one store admin from editing another's records by guessing an id.
    const existing = await prisma.enquiry.findFirst({
      where: { id: enquiryId, storeAdminId: decoded.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Enquiry not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    const updated = await prisma.enquiry.update({
      where: { id: enquiryId },
      data: { status },
    });

    return NextResponse.json(
      { success: true, enquiry: updated },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Update enquiry error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update enquiry.' },
      { status: 500, headers: corsHeaders }
    );
  }
}