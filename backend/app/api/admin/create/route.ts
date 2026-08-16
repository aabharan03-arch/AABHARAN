// app/api/admin/setup/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Define CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Change '*' to your specific frontend URL in production (e.g., 'https://my-store.com')
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Basic validation
    if (!email || !password ) {
      return NextResponse.json(
        { error: 'Email, and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Check if this email is already registered as an Admin
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the Admin in the database
    const newAdmin = await prisma.admin.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        // Notice we DO NOT select the password to keep it secure
      },
    });

    // 5. Return success response with CORS headers
    return NextResponse.json(
      {
        message: 'Admin created successfully',
        admin: newAdmin,
      },
      { status: 201, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Admin Creation Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}