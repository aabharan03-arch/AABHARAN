// app/api/store-admin/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Update this to your frontend URL in production
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Find StoreAdmin by email
    const storeAdmin = await prisma.storeAdmin.findUnique({
      where: { email: email.toLowerCase() },
    });

    // 3. Reject if not found
    if (!storeAdmin) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 4. Verify password
    const isPasswordValid = await bcrypt.compare(password, storeAdmin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 5. ENFORCE STATUS CHECK: Block login if restricted
    if (storeAdmin.status === 'RESTRICTED') {
      return NextResponse.json(
        { error: 'Access Restricted. Your store account has been disabled. Please contact the administrator.' },
        { status: 403, headers: corsHeaders } // 403 Forbidden
      );
    }

    // 6. Generate JWT Token (Notice we tag the role as 'storeadmin' here)
    const token = jwt.sign(
      {
        id: storeAdmin.id,
        email: storeAdmin.email,
        role: 'storeadmin',
        status: storeAdmin.status,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1d' } // Token expires in 24 hours
    );

    // 7. Return success response with token
    return NextResponse.json(
      {
        message: 'Login successful.',
        token,
        storeAdmin: {
          id: storeAdmin.id,
          email: storeAdmin.email,
          status: storeAdmin.status,
          role: 'storeadmin',
        },
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('StoreAdmin Login Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}