import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function getCorsHeaders(origin: string | null) {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://aabharan03.vercel.app',
    'https://www.aabharan.in',
    'https://aabharan.in',
  ];

  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const body = await request.json();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const password = body.password;

    // -----------------------------
    // Basic validation
    // -----------------------------
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        {
          error: 'Name, email, phone number and password are required',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Indian 10 digit mobile validation
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        {
          error: 'Please enter a valid 10 digit mobile number',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error: 'Password must contain at least 6 characters',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // -----------------------------
    // Check existing email
    // -----------------------------
    const existingUser = await prisma.customer.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'An account already exists with this email',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // -----------------------------
    // Hash password
    // -----------------------------
    const hashedPassword = await bcrypt.hash(password, 10);

    // -----------------------------
    // Create customer
    // -----------------------------
    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: customer,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('SIGNUP ROUTE ERROR:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}