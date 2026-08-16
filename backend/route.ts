import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173', 
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true', 
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST() {
  // Instruct the browser to delete the session cookie
  (await cookies()).delete('session');

  return NextResponse.json({ message: 'Logged out successfully' }, { status: 200, headers: corsHeaders });
}