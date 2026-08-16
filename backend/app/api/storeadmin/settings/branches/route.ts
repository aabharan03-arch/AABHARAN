import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req: Request) {
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

    const storeAdmin = await prisma.storeAdmin.findUnique({
      where: { id: decoded.id },
      select: { id: true, status: true },
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

    const store = await prisma.store.findUnique({
      where: { storeAdminId: storeAdmin.id },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found. Please save basic info first.' },
        { status: 404, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { name, managerName, phone, whatsapp, address, city, state, pincode, lat, lng, mapUrl } = body;

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Branch name and address are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        storeId: store.id,
        name,
        managerName,
        phone,
        whatsapp,
        address,
        city,
        state,
        pincode,
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
        mapUrl,
      },
    });

    return NextResponse.json(
      { message: 'Branch created successfully.', branch },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid or expired token.', details: error.message },
      { status: 401, headers: corsHeaders }
    );
  }
}