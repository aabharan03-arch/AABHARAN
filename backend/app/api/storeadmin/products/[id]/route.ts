import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { uploadToSpaces, deleteFromSpaces } from '@/lib/spaces';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
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

// Helper to extract bucket key from DigitalOcean Spaces public URL
function extractKeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Returns key path after pathname starting slash (e.g., 'products/admin_id/123-file.png')
    return parsed.pathname.startsWith('/') ? parsed.pathname.slice(1) : parsed.pathname;
  } catch {
    return url.split('.com/')[1] ?? null;
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// Next.js 15: params is a Promise
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const auth = verifyStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }
    const { decoded } = auth;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404, headers: corsHeaders });
    }
    if (existing.storeId !== decoded.id) {
      return NextResponse.json({ error: 'Forbidden. Not your product.' }, { status: 403, headers: corsHeaders });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string | null;
    const category = formData.get('category') as string | null;
    const metalType = formData.get('metalType') as string | null;
    const purity = formData.get('purity') as string | null;
    const weight = formData.get('weight') as string | null;
    const description = formData.get('description') as string | null;
    const featuredRaw = formData.get('featured') as string | null;

    // 1. Extract existing image URLs retained by the frontend
    let retainedImages: string[] = [];
    const existingImagesRaw = formData.get('existingImages');
    if (existingImagesRaw) {
      try {
        retainedImages = JSON.parse(existingImagesRaw as string);
      } catch {
        retainedImages = formData.getAll('existingImages') as string[];
      }
    } else {
      // If client didn't explicitly pass existingImages, fall back to current saved images
      retainedImages = existing.images as string[];
    }

    // Explicitly typed (url: string) on filter callback
    const removedImages = (existing.images as string[]).filter((url: string) => !retainedImages.includes(url));
    for (const url of removedImages) {
      const key = extractKeyFromUrl(url);
      if (key) {
        try {
          await deleteFromSpaces(key);
        } catch {
          /* ignore best-effort cleanup errors */
        }
      }
    }

    // 2. Upload newly attached file(s)
    const newFiles = formData.getAll('images') as File[];
    const uploadedUrls: string[] = [];

    for (const file of newFiles) {
      if (!(file instanceof File) || file.size === 0) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const key = `products/${decoded.id}/${Date.now()}-${cleanFileName}`;
      
      const url = await uploadToSpaces(buffer, key, file.type);
      uploadedUrls.push(url);
    }

    // 3. Merge retained old image URLs with newly uploaded DO Space URLs
    const finalImages = [...retainedImages, ...uploadedUrls];

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? undefined,
        category: category ?? undefined,
        metalType: metalType ?? undefined,
        purity: purity ?? undefined,
        weight: weight ?? undefined,
        description: description ?? undefined,
        featured: featuredRaw !== null ? featuredRaw === 'true' : undefined,
        images: finalImages,
      },
    });

    return NextResponse.json({ product }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to update product.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const auth = verifyStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }
    const { decoded } = auth;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404, headers: corsHeaders });
    }
    if (existing.storeId !== decoded.id) {
      return NextResponse.json({ error: 'Forbidden. Not your product.' }, { status: 403, headers: corsHeaders });
    }

    // Best-effort cleanup of all image files in DigitalOcean Spaces
    for (const url of (existing.images as string[])) {
      const key = extractKeyFromUrl(url);
      if (key) {
        try {
          await deleteFromSpaces(key);
        } catch {
          /* ignore cleanup failure */
        }
      }
    }

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete product.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}