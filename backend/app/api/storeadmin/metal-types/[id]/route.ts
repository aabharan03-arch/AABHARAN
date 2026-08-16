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

// Authentication Helper
async function authenticateStoreAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized. Token missing.', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  let decoded: { id: string; role: string };

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
  } catch (err: any) {
    return { error: 'Invalid or expired token.', status: 401 };
  }

  if (decoded.role !== 'storeadmin') {
    return { error: 'Forbidden. Invalid role.', status: 403 };
  }

  const storeAdmin = await prisma.storeAdmin.findUnique({
    where: { id: decoded.id },
    select: { id: true, status: true },
  });

  if (!storeAdmin) {
    return { error: 'User not found.', status: 404 };
  }

  if (storeAdmin.status === 'RESTRICTED') {
    return { error: 'Access Restricted. Your account has been disabled.', status: 403 };
  }

  return { storeAdmin };
}

// PUT: Edit metal type details
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const { id: metalTypeId } = await params;
    const body = await req.json();
    const { name, description } = body;

    // Check ownership
    const existingMetalType = await prisma.metalType.findFirst({
      where: { id: metalTypeId, storeAdminId: auth.storeAdmin.id },
    });

    if (!existingMetalType) {
      return NextResponse.json(
        { error: 'Metal type not found or unauthorized.' },
        { status: 404, headers: corsHeaders }
      );
    }

    // If changing name, check if another metal type already has that name
    if (name && name.trim().toLowerCase() !== existingMetalType.name.toLowerCase()) {
      const duplicate = await prisma.metalType.findFirst({
        where: {
          storeAdminId: auth.storeAdmin.id,
          name: { equals: name.trim(), mode: 'insensitive' },
          id: { not: metalTypeId },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: `Metal type name '${name.trim()}' is already in use.` },
          { status: 409, headers: corsHeaders }
        );
      }
    }

    const updatedMetalType = await prisma.metalType.update({
      where: { id: metalTypeId },
      data: {
        name: name ? name.trim() : existingMetalType.name,
        description: description !== undefined ? description : existingMetalType.description,
      },
    });

    return NextResponse.json(
      { message: 'Metal type updated successfully.', metalType: updatedMetalType },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE: Delete a metal type
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const { id: metalTypeId } = await params;

    // Check ownership
    const existingMetalType = await prisma.metalType.findFirst({
      where: { id: metalTypeId, storeAdminId: auth.storeAdmin.id },
    });

    if (!existingMetalType) {
      return NextResponse.json(
        { error: 'Metal type not found or unauthorized.' },
        { status: 404, headers: corsHeaders }
      );
    }

    await prisma.metalType.delete({ where: { id: metalTypeId } });

    return NextResponse.json(
      { message: 'Metal type deleted successfully.' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}