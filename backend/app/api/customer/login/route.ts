import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: corsHeaders });
    }

    const token = await encrypt({ userId: customer.id, email: customer.email });

    return NextResponse.json(
      {
        message: 'Signed in successfully',
        token, // ✅ return token in body instead of setting a cookie
        user: { id: customer.id, email: customer.email, name: customer.name },
      },
      { status: 204, headers: corsHeaders }
    );
  } catch (error) {
    console.error('LOGIN ROUTE ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}