// app/api/storeadmin/qr/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

function getAppBase(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error('NEXT_PUBLIC_APP_URL is not set');
  return base.replace(/\/$/, '');


}



function getFrontendBase(): string {
  const base = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (!base) throw new Error('NEXT_PUBLIC_FRONTEND_URL is not set');
  return base.replace(/\/$/, '');
}

function buildStorePublicUrl(publicSlug: string): string {
  return `${getFrontendBase()}/s/${publicSlug}`; // points to Vite frontend
}

function buildQrImageUrl(storeId: string): string {
  return `${getAppBase()}/api/store/${storeId}/qr`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Token missing.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];

    let decoded: { id: string; role: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        role: string;
      };
    } catch (jwtError: any) {
      return NextResponse.json(
        { error: 'Invalid or expired token.', details: jwtError.message },
        { status: 401, headers: corsHeaders }
      );
    }

    if (decoded.role !== 'storeadmin') {
      return NextResponse.json(
        { error: 'Forbidden. Invalid role.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const storeAdmin = await prisma.storeAdmin.findUnique({
      where: { id: decoded.id },
      select: { id: true, status: true },
    });

    if (!storeAdmin) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (storeAdmin.status === 'RESTRICTED') {
      return NextResponse.json(
        { error: 'Access Restricted. Your account has been disabled.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const { id: storeId } = await params;

    const store = await prisma.store.findFirst({
      where: { id: storeId, storeAdminId: storeAdmin.id },
      select: { id: true, name: true, publicSlug: true },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found or unauthorized.' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!store.publicSlug) {
      return NextResponse.json(
        { error: 'Store is missing a publicSlug. Contact support.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const qrTargetUrl = buildStorePublicUrl(store.publicSlug);
    const qrImageUrl = buildQrImageUrl(store.id);

    return NextResponse.json(
      {
        message: 'QR code ready.',
        data: {
          storeId: store.id,
          publicSlug: store.publicSlug,
          qrTargetUrl,
          qrImageUrl,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}