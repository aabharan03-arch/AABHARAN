import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { encrypt } from '@/lib/auth';

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, customer.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await encrypt({ userId: customer.id, email: customer.email });

    return NextResponse.json(
      {
        message: 'Signed in successfully',
        token,
        user: { id: customer.id, email: customer.email, name: customer.name },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('LOGIN ROUTE ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}