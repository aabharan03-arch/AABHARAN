// app/api/store-admins/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Replace with your frontend domain
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    // 1. Fetch StoreAdmins with nested Store, Branch, and active Subscription+Plan relations
    const storeAdmins = await prisma.storeAdmin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          where: { isActive: true },
          select: {
            id: true,
            amountPaid: true,
            startDate: true,
            expiryDate: true,
            plan: {
              select: {
                id: true,
                name: true,
                months: true,
                cost: true,
              },
            },
          },
          take: 1,
        },
        store: {
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
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 2. Extract StoreAdmin IDs (Since Product.storeId = decoded.id = StoreAdmin.id)
    const adminIds = storeAdmins.map((sa: { id: string }) => sa.id);

    // 3. Fetch products where storeId matches StoreAdmin.id
    const products = adminIds.length > 0
      ? await prisma.product.findMany({
          where: {
            storeId: {
              in: adminIds,
            },
          },
          orderBy: {
            displayOrder: 'asc',
          },
        })
      : [];

    // 4. Group products by StoreAdmin ID
    const productsByAdminId = new Map<string, typeof products>();

    for (const product of products) {
      if (!product.storeId) continue;

      const key = product.storeId.trim();
      if (!productsByAdminId.has(key)) {
        productsByAdminId.set(key, []);
      }
      productsByAdminId.get(key)!.push(product);
    }

    // 5. Attach product list into store.products, and flatten active subscription/plan
    const formattedStoreAdmins = storeAdmins.map((sa: any) => {
      const adminProducts = productsByAdminId.get(sa.id.trim()) || [];
      const activeSubscription = sa.subscriptions?.[0] || null;

      return {
        id: sa.id,
        name: sa.name,
        email: sa.email,
        status: sa.status,
        createdAt: sa.createdAt,
        updatedAt: sa.updatedAt,
        plan: activeSubscription?.plan
          ? {
              id: activeSubscription.plan.id,
              name: activeSubscription.plan.name,
              months: activeSubscription.plan.months,
              cost: activeSubscription.plan.cost,
            }
          : null,
        subscription: activeSubscription
          ? {
              id: activeSubscription.id,
              amountPaid: activeSubscription.amountPaid,
              startDate: activeSubscription.startDate,
              expiryDate: activeSubscription.expiryDate,
            }
          : null,
        store: sa.store
          ? {
              ...sa.store,
              products: adminProducts,
            }
          : null,
      };
    });

    // 6. Return Response
    return NextResponse.json(
      {
        success: true,
        count: formattedStoreAdmins.length,
        storeAdmins: formattedStoreAdmins,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Fetch StoreAdmins Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}