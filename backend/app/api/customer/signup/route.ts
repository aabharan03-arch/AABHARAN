import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Define your CORS headers to match the frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Update if your port changes
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true', 
};

// Handle the preflight OPTIONS request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    // Check if user exists
    const existingUser = await prisma.customer.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' }, 
        { status: 400, headers: corsHeaders }
      );
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.customer.create({
      data: { email, password: hashedPassword, name },
    });

    return NextResponse.json(
      { message: 'User created successfully' }, 
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    // Reveal the true error in your terminal
    console.error("SIGNUP ROUTE ERROR:", error);
    
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500, headers: corsHeaders }
    );
  }
}