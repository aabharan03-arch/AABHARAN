// app/api/store/public/[slug]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

/**
 * GET /api/store/public/[slug]
 *
 * Public, unauthenticated route — this is what a customer's browser hits
 * after scanning the store's QR code (QR encodes /s/[slug], which calls
 * this endpoint). Returns only customer-facing fields: never storeAdminId,
 * admin email, password hash, or account status internals.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Missing store slug.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const store = await prisma.store.findUnique({
      where: { publicSlug: slug },
      select: {
        id: true,
        name: true,
        about: true,
        logo: true,
        coverBanner: true,
        contactNumber: true,
        whatsapp: true,
        email: true,
        website: true,
        instagram: true,
        facebook: true,
        createdAt: true,
        updatedAt: true,
        branches: {
          select: {
            id: true,
            name: true,
            managerName: true,
            phone: true,
            whatsapp: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            lat: true,
            lng: true,
            mapUrl: true,
          },
        },
        // Don't select storeAdminId or the storeAdmin relation here —
        // this response goes straight to an anonymous customer's browser.
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Products aren't a Prisma relation on Store — fetch by storeId separately.
    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        category: true,
        metalType: true,
        purity: true,
        weight: true,
        description: true,
        featured: true,
        displayOrder: true,
        images: true,
        views: true,
        storeId: true,
        storeName: true,
        storeLogo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        message: 'Store profile ready.',
        data: {
          ...store,
          products,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Public store fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}