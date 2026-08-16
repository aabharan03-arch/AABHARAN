import { NextResponse } from 'next/server';

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
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: corsHeaders });
    }

    // No server-side session to destroy with stateless JWTs.
    // If you later add token blacklisting/revocation (e.g. a Redis
    // denylist keyed by token or jti), do it here.

    return NextResponse.json({ message: 'Logged out successfully' }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('LOGOUT ROUTE ERROR:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
}