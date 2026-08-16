import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    // 1. Fetch all products
    const products = await prisma.product.findMany({
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // 2. Collect unique storeIds with explicit parameter typing
    const storeAdminIds = Array.from(
      new Set(
        products
          .map((p: { storeId?: string | null }) => p.storeId?.trim())
          .filter((id): id is string => Boolean(id))
      )
    );

    // 3. Fetch matching StoreAdmins and select only essential Store info
    const storeAdmins = storeAdminIds.length > 0
      ? await prisma.storeAdmin.findMany({
          where: {
            id: {
              in: storeAdminIds,
            },
          },
          select: {
            id: true,
            store: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        })
      : [];

    // 4. Map StoreAdmin ID to its Store details for O(1) lookup
    const storeMap = new Map<string, { id: string; name: string; logo: string | null }>();
    
    for (const sa of storeAdmins as Array<{ id: string; store: { id: string; name: string; logo: string | null } | null }>) {
      if (sa.store) {
        storeMap.set(sa.id.trim(), sa.store);
      }
    }

    // 5. Build clean, product-only response objects with explicit parameter typing
    const formattedProducts = products.map((product: any) => {
      const matchedStore = product.storeId ? storeMap.get(product.storeId.trim()) : null;

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        metalType: product.metalType,
        description: product.description,
        purity: product.purity,
        weight: product.weight,
        featured: product.featured,
        displayOrder: product.displayOrder,
        images: product.images,
        views: product.views,
        storeId: product.storeId,
        storeName: matchedStore?.name || null,
        storeLogo: matchedStore?.logo || null,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    // 6. Return Product Details Only
    return NextResponse.json(
      {
        success: true,
        count: formattedProducts.length,
        products: formattedProducts,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Fetch Products Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}