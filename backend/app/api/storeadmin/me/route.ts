// app/api/store-admin/me/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Token missing.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };

    if (decoded.role !== 'storeadmin') {
      return NextResponse.json(
        { error: 'Forbidden. Invalid role.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Fetch latest user details from Database
    const storeAdmin = await prisma.storeAdmin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        status: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!storeAdmin) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (storeAdmin.status === 'RESTRICTED') {
      return NextResponse.json(
        { error: 'Access Restricted. Your account has been disabled.' },
        { status: 403, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { storeAdmin: { ...storeAdmin, role: 'storeadmin' } },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid or expired token.', details: error.message },
      { status: 401, headers: corsHeaders }
    );
  }
}