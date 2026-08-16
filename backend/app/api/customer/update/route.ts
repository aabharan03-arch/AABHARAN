import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function PATCH(request: Request) {
  try {
    // 1. Extract Bearer Token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or malformed token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify JWT token
    let decoded: { userId?: string; email?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId?: string;
        email?: string;
      };
    } catch (err) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401, headers: corsHeaders }
      );
    }

    const userEmail = decoded.email;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized: Token payload missing email' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 3. Parse request body (no longer requires email in body)
    const { currentPassword, name, newPassword } = await request.json();

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Current password is required to verify changes' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Find customer using the verified email from the token
    const customer = await prisma.customer.findUnique({
      where: { email: userEmail },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 5. Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      customer.password
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Incorrect current password' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 6. Build dynamic update payload
    const updateData: { name?: string; phone?: string; password?: string } = {};

    if (name) updateData.name = name;
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No fields provided to update' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 7. Update user in database
    const updatedCustomer = await prisma.customer.update({
      where: { email: userEmail },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Customer updated successfully',
        user: updatedCustomer,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('UPDATE ROUTE ERROR:', error);

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500, headers: corsHeaders }
    );
  }
}