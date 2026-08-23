// app/api/store/[id]/qr/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

function buildStorePublicUrl(publicSlug: string): string {
  const base = process.env.NEXT_PUBLIC_FRONTEND_URL;
  if (!base) throw new Error('NEXT_PUBLIC_FRONTEND_URL is not set');
  return `${base.replace(/\/$/, '')}/s/${publicSlug}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') === 'svg' ? 'svg' : 'png';

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { publicSlug: true },
    });

    if (!store || !store.publicSlug) {
      return NextResponse.json({ error: 'Store not found.' }, { status: 404 });
    }

    const targetUrl = buildStorePublicUrl(store.publicSlug);

    if (format === 'svg') {
      const svg = await QRCode.toString(targetUrl, {
        type: 'svg',
        width: 512,
        margin: 2,
      });
      return new NextResponse(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    const pngBuffer = await QRCode.toBuffer(targetUrl, {
      type: 'png',
      width: 512,
      margin: 2,
    });

    // Pass as Uint8Array to satisfy Web API BodyInit types
    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code.', details: error.message },
      { status: 500 }
    );
  }
}