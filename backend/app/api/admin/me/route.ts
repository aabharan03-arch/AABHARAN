import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // 👈 Import your Prisma client instance

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: corsHeaders });
    }

    // 1. Decrypt token to get basic payload (e.g., userId or email)
    const payload = await decrypt(token);

    if (!payload || (!payload.id && !payload.sub && !payload.email)) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 401, headers: corsHeaders });
    }

    // Determine user identifier from payload
    const userId = (payload.id || payload.sub) as string;

    // 2. Query database for full customer record
    const admin = await prisma.admin.findUnique({
      where: userId ? { id: userId } : { email: payload.email as string },
      select: {
        id: true,
        email: true,
        // Add any other user properties needed by frontend
      },
    });

    if (!admin) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: corsHeaders });
    }

    // 3. Return user object containing the name
    return NextResponse.json({ user: admin }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('ME ROUTE ERROR:', error);
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401, headers: corsHeaders });
  }
}