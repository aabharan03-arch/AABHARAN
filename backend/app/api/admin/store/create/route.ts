// app/api/admin/store-admins/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace with your frontend domain
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    // 1. Verify the Admin Authorization Token
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

    // 2. Check Role Authorization (Strictly Admin only)
    if (decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only Admins can create Store accounts.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // 3. Parse and Validate Request Body
    const { name, email, password } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Check if the StoreAdmin email already exists
    const existingStore = await prisma.storeAdmin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingStore) {
      return NextResponse.json(
        { error: 'A Store Admin with this email already exists.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Create StoreAdmin + Store together in a transaction.
    //    This guarantees every StoreAdmin has exactly one Store from the
    //    moment they're created, so publicSlug (Store's @default(cuid()))
    //    is always generated and QR/branch routes never hit a missing store.
    const { newStoreAdmin, store } = await prisma.$transaction(async (tx) => {
      const newStoreAdmin = await tx.storeAdmin.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name: name,
          // status automatically defaults to 'ACTIVE' based on your Prisma schema
        },
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
          // We omit the password for security
        },
      });

      const store = await tx.store.create({
        data: {
          name: name, // placeholder store name — admin can rename later via store settings
          storeAdminId: newStoreAdmin.id,
          // publicSlug intentionally omitted — Prisma applies @default(cuid())
        },
        select: {
          id: true,
          publicSlug: true,
        },
      });

      return { newStoreAdmin, store };
    });

    // 7. Return Success Response
    return NextResponse.json(
      {
        message: 'Store Admin created successfully.',
        storeAdmin: newStoreAdmin,
        store,
      },
      { status: 201, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('StoreAdmin Creation Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}