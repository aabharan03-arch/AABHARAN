// app/api/admin/store-admins/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Update to your admin panel URL in production
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function PATCH(req: Request) {
  try {
    // 1. Verify the Authorization Token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. No token provided.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];
    let decodedToken: any;

    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid or expired token.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Strict Role Verification (Only Admins can change status)
    if (decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only Admins can modify store statuses.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // 3. Parse Request Body
    const body = await req.json();
    const { storeId, status } = body;

    if (!storeId || !status) {
      return NextResponse.json(
        { error: 'storeId and status are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Validate the Status matches your Prisma Enum
    if (!['ACTIVE', 'RESTRICTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be ACTIVE or RESTRICTED.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. Update the StoreAdmin in the database
    const updatedStore = await prisma.storeAdmin.update({
      where: { id: storeId },
      data: { status: status },
      select: {
        id: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    });

    // 6. Return Success Response
    return NextResponse.json(
      {
        message: `Store status successfully updated to ${status}.`,
        storeAdmin: updatedStore,
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Update Status Error:', error);
    
    // Handle Prisma's "Record not found" error specifically
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Store Admin not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}