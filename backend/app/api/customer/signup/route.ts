import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

function getCorsHeaders(origin: string | null) {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://aabharan03.vercel.app/', 
    'https://www.aabharan.in/',
    'https://aabharan.in/',
    // add your prod frontend domain(s)
  ];

  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin! : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return NextResponse.json({}, { headers: getCorsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { email, password, name } = await request.json();

    const existingUser = await prisma.customer.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400, headers: corsHeaders }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.customer.create({
      data: { email, password: hashedPassword, name },
    });

    return NextResponse.json(
      { message: 'User created successfully' },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("SIGNUP ROUTE ERROR:", error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}