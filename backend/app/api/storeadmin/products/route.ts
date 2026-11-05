import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { uploadToSpaces } from '@/lib/spaces';
import { assertCanCreateProduct } from '@/lib/plan-entitlements';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods':
    'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization',
};

function verifyStoreAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return {
      error: 'Unauthorized. Token missing.',
      status: 401,
    } as const;
  }

  try {
    const decoded = jwt.verify(
      authHeader.split(' ')[1],
      process.env.JWT_SECRET!
    ) as {
      id: string;
      role: string;
    };

    if (decoded.role !== 'storeadmin') {
      return {
        error: 'Forbidden. Invalid role.',
        status: 403,
      } as const;
    }

    return { decoded } as const;
  } catch {
    return {
      error: 'Invalid or expired token.',
      status: 401,
    } as const;
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    { status: 200, headers: corsHeaders }
  );
}

export async function GET(req: Request) {
  try {
    const auth = verifyStoreAdmin(req);

    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        {
          status: auth.status,
          headers: corsHeaders,
        }
      );
    }

    // Never trust a storeId query param for ownership.
    // A Store Admin can only fetch their own products.
    const products = await prisma.product.findMany({
      where: {
        storeId: auth.decoded.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      { products },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to fetch products.',
        details: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = verifyStoreAdmin(req);

    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        {
          status: auth.status,
          headers: corsHeaders,
        }
      );
    }

    const { decoded } = auth;

    const storeAdmin =
      await prisma.storeAdmin.findUnique({
        where: { id: decoded.id },
      });

    if (!storeAdmin) {
      return NextResponse.json(
        { error: 'Store admin not found.' },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    if (storeAdmin.status === 'RESTRICTED') {
      return NextResponse.json(
        {
          error:
            'Access Restricted. Your account has been disabled.',
        },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    // IMPORTANT:
    // This reads the CURRENT Plan row from DB every time.
    // If Admin changes maxProducts, the new value applies immediately.
    const productPermission =
      await assertCanCreateProduct(decoded.id);

    if (!productPermission.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: productPermission.code,
          error: productPermission.error,
          entitlements:
            productPermission.entitlements,
        },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    const formData = await req.formData();

    const name = formData.get('name') as string;
    const category =
      formData.get('category') as string;
    const metalType =
      formData.get('metalType') as string;
    const purity =
      formData.get('purity') as string;
    const weight =
      formData.get('weight') as string | null;
    const description =
      formData.get('description') as string | null;
    const featured =
      formData.get('featured') === 'true';
    const storeName =
      (formData.get('storeName') as string) ??
      'Store';

    if (
      !name ||
      !category ||
      !metalType ||
      !purity
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: name, category, metalType, purity.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    let existingImages: string[] = [];
    const existingImagesRaw =
      formData.get('existingImages');

    if (existingImagesRaw) {
      try {
        existingImages = JSON.parse(
          existingImagesRaw as string
        );
      } catch {
        existingImages =
          formData.getAll(
            'existingImages'
          ) as string[];
      }
    }

    const fileEntries =
      formData.getAll('images');
    const uploadedImageUrls: string[] = [];

    for (const entry of fileEntries) {
      if (
        entry instanceof File &&
        entry.size > 0
      ) {
        const buffer = Buffer.from(
          await entry.arrayBuffer()
        );

        const cleanFileName =
          entry.name.replace(
            /[^a-zA-Z0-9.-]/g,
            '_'
          );

        const key =
          `products/${decoded.id}/` +
          `${crypto.randomUUID()}-${cleanFileName}`;

        const url = await uploadToSpaces(
          buffer,
          key,
          entry.type
        );

        uploadedImageUrls.push(url);
      }
    }

    const finalImages = [
      ...existingImages,
      ...uploadedImageUrls,
    ];

    const product =
      await prisma.product.create({
        data: {
          name,
          category,
          metalType,
          purity,
          weight: weight ?? undefined,
          description:
            description ?? undefined,
          featured,
          storeId: decoded.id,
          storeName,
          images: finalImages,
        },
      });

    return NextResponse.json(
      {
        success: true,
        product,
        entitlements:
          productPermission.entitlements,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to create product.',
        details: error.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
