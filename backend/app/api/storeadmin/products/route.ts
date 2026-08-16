import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { uploadToSpaces } from '@/lib/spaces';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function verifyStoreAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized. Token missing.', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
    id: string;
    role: string;
  };

  if (decoded.role !== 'storeadmin') {
    return { error: 'Forbidden. Invalid role.', status: 403 };
  }

  return { decoded };
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const auth = verifyStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId') ?? auth.decoded.id;

    const products = await prisma.product.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid or expired token.', details: error.message },
      { status: 401, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = verifyStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }
    const { decoded } = auth;

    const formData = await req.formData();

    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const metalType = formData.get('metalType') as string;
    const purity = formData.get('purity') as string;
    const weight = formData.get('weight') as string | null;
    const description = formData.get('description') as string | null;
    const featured = formData.get('featured') === 'true';
    const storeName = (formData.get('storeName') as string) ?? 'Store';

    if (!name || !category || !metalType || !purity) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, metalType, purity.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Confirm store admin exists and isn't restricted
    const storeAdmin = await prisma.storeAdmin.findUnique({ where: { id: decoded.id } });
    if (!storeAdmin) {
      return NextResponse.json({ error: 'Store admin not found.' }, { status: 404, headers: corsHeaders });
    }
    if (storeAdmin.status === 'RESTRICTED') {
      return NextResponse.json(
        { error: 'Access Restricted. Your account has been disabled.' },
        { status: 403, headers: corsHeaders }
      );
    }

    // 1. Process existing image URLs (if sent from frontend)
    let existingImages: string[] = [];
    const existingImagesRaw = formData.get('existingImages');
    if (existingImagesRaw) {
      try {
        existingImages = JSON.parse(existingImagesRaw as string);
      } catch {
        existingImages = formData.getAll('existingImages') as string[];
      }
    }

    // 2. Upload all image files to DO Spaces
    const fileEntries = formData.getAll('images');
    const uploadedImageUrls: string[] = [];

    for (const entry of fileEntries) {
      if (entry instanceof File && entry.size > 0) {
        const buffer = Buffer.from(await entry.arrayBuffer());
        const cleanFileName = entry.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `products/${decoded.id}/${Date.now()}-${cleanFileName}`;
        
        const url = await uploadToSpaces(buffer, key, entry.type);
        uploadedImageUrls.push(url);
      }
    }

    // Combine existing URLs and newly uploaded DO Space URLs
    const finalImages = [...existingImages, ...uploadedImageUrls];

    const product = await prisma.product.create({
      data: {
        name,
        category,
        metalType,
        purity,
        weight: weight ?? undefined,
        description: description ?? undefined,
        featured,
        storeId: decoded.id,
        storeName,
        images: finalImages,
      },
    });

    return NextResponse.json({ product }, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create product.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}