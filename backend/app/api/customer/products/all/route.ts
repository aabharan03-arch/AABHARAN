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

    // 2. Collect unique storeIds
    const storeAdminIds = Array.from(
      new Set(
        products
          .map((p: any) => p.storeId?.trim())
          .filter(
            (id: string | undefined): id is string =>
              Boolean(id)
          )
      )
    );

    // 3. Fetch matching StoreAdmins
    const storeAdmins =
      storeAdminIds.length > 0
        ? await prisma.storeAdmin.findMany({
            where: {
              id: {
                in: storeAdminIds,
              },
            },
            select: {
              id: true,
              email: true,
              store: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                  email: true,
                },
              },
            },
          })
        : [];

    // 4. Map StoreAdmin ID to Store details
    const storeMap = new Map<
      string,
      {
        id: string;
        name: string;
        logo: string | null;
        email: string | null;
      }
    >();

    for (const sa of storeAdmins as any[]) {
      if (sa.store) {
        storeMap.set(sa.id.trim(), {
          ...sa.store,
          email: sa.store.email || sa.email || null,
        });
      }
    }

    // 5. Build product response
    const formattedProducts = products.map(
      (product: any) => {
        const matchedStore = product.storeId
          ? storeMap.get(product.storeId.trim())
          : null;

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

          // Product statistics
          views: product.views,

          // Total number of enquiries for this product
          enquriycount: product.enquriycount ?? 0,

          // Store details
          storeId: product.storeId,
          storeName: matchedStore?.name || null,
          storeLogo: matchedStore?.logo || null,
          storeEmail: matchedStore?.email || null,

          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        };
      }
    );

    // 6. Return Product Details
    return NextResponse.json(
      {
        success: true,
        count: formattedProducts.length,
        products: formattedProducts,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error('Fetch Products Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}