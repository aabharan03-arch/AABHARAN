import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// GET: Retrieve all categories for the store admin
export async function GET(req: Request) {
  try {
    const auth = await authenticateStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const categories = await prisma.category.findMany({
      where: { storeAdminId: auth.storeAdmin.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ categories }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST: Create a new category
export async function POST(req: Request) {
  try {
    const auth = await authenticateStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required.' }, { status: 400, headers: corsHeaders });
    }

    // Check for duplicate category name for this store admin
    const existingCategory = await prisma.category.findFirst({
      where: {
        storeAdminId: auth.storeAdmin.id,
        name: { equals: name.trim(), mode: 'insensitive' },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: `Category '${name.trim()}' already exists.` },
        { status: 409, headers: corsHeaders }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description || null,
        storeAdminId: auth.storeAdmin.id,
      },
    });

    return NextResponse.json(
      { message: 'Category created successfully.', category },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}