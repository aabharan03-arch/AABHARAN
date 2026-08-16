// app/api/store-admin/logout/route.ts
import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function POST() {
  // Since JWT is stateless, logout primarily handled client-side by clearing localStorage/cookies.
  return NextResponse.json(
    { message: 'Logged out successfully.' },
    { status: 200, headers: corsHeaders }
  );
}