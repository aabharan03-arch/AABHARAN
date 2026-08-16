import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// PUT: Update single branch
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Token missing.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];
    
    let decoded: { id: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        role: string;
      };
    } catch (jwtError: any) {
      return NextResponse.json(
        { error: 'Invalid or expired token.', details: jwtError.message },
        { status: 401, headers: corsHeaders }
      );
    }

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

    const { id: branchId } = await params;
    const existingBranch = await prisma.branch.findFirst({
      where: { id: branchId, store: { storeAdminId: storeAdmin.id } },
    });

    if (!existingBranch) {
      return NextResponse.json(
        { error: 'Branch not found or unauthorized.' },
        { status: 404, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { name, managerName, phone, whatsapp, address, city, state, pincode, lat, lng, mapUrl } = body;

    const updatedBranch = await prisma.branch.update({
      where: { id: branchId },
      data: {
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
      { message: 'Branch updated successfully.', branch: updatedBranch },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE: Remove single branch
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Token missing.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];

    let decoded: { id: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        role: string;
      };
    } catch (jwtError: any) {
      return NextResponse.json(
        { error: 'Invalid or expired token.', details: jwtError.message },
        { status: 401, headers: corsHeaders }
      );
    }

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

    const { id: branchId } = await params;
    const existingBranch = await prisma.branch.findFirst({
      where: { id: branchId, store: { storeAdminId: storeAdmin.id } },
    });

    if (!existingBranch) {
      return NextResponse.json(
        { error: 'Branch not found or unauthorized.' },
        { status: 404, headers: corsHeaders }
      );
    }

    await prisma.branch.delete({ where: { id: branchId } });

    return NextResponse.json(
      { message: 'Branch deleted successfully.' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}