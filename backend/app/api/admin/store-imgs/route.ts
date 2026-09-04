import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import path from 'path';
import { uploadToSpaces, deleteFromSpaces } from '@/lib/spaces';
import { StoreImageType } from '@prisma/client';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// ---------- Token helpers ----------

function verifyAnyToken(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized. Token missing.', status: 401 } as const;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return { decoded } as const;
  } catch {
    return { error: 'Invalid or expired token.', status: 401 } as const;
  }
}

function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized. Token missing.', status: 401 } as const;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };
    if (decoded.role !== 'admin') {
      return { error: 'Forbidden. Admin access required.', status: 403 } as const;
    }
    return { decoded };
  } catch {
    return { error: 'Invalid or expired token.', status: 401 } as const;
  }
}

// ---------- Constants ----------

const VALID_TYPES = ['COVER_PHOTO', 'FIRST_PHOTO', 'ADVERTISE_PHOTO'];
const CAPS: Record<string, number> = {
  COVER_PHOTO: 1,
  FIRST_PHOTO: 5,
  ADVERTISE_PHOTO: 10,
};
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// =====================================================
// GET /api/admin/store-images
// =====================================================
export async function GET(req: Request) {
  try {
    const auth = verifyAnyToken(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const storeAdminId = searchParams.get('storeAdminId');
    const storeId = searchParams.get('storeId');

    const images = await prisma.storeAdminImg.findMany({
      where: {
        ...(type && VALID_TYPES.includes(type) ? { type: type as any } : {}),
        ...(storeAdminId ? { storeAdminId } : {}),
        ...(storeId ? { storeId } : {}),
      },
      orderBy: [{ type: 'asc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(
      { success: true, count: images.length, images },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Fetch store images error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

// =====================================================
// POST /api/admin/store-images — admin only
// multipart/form-data:
//   file (required), type (required), storeAdminId (required),
//   expiryDate (optional ISO), displayOrder (optional), storeId (optional)
// =====================================================
export async function POST(req: Request) {
  try {
    const auth = verifyAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;
    const storeAdminId = formData.get('storeAdminId') as string | null;
    const expiryDate = formData.get('expiryDate') as string | null;
    const displayOrderRaw = formData.get('displayOrder');
    const storeId = formData.get('storeId') as string | null;

    // --- Field validation ---
    if (!file || !type || !storeAdminId) {
      return NextResponse.json(
        { error: 'file, type and storeAdminId are required.' },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_MIME.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Max 5MB.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // --- Validate target store admin exists ---
    const storeAdmin = await prisma.storeAdmin.findUnique({
      where: { id: storeAdminId },
      select: { id: true },
    });
    if (!storeAdmin) {
      return NextResponse.json({ error: 'Store admin not found.' }, { status: 404, headers: corsHeaders });
    }

    // --- Resolve storeId (server-side, never trusted from client blindly) ---
    let resolvedStoreId: string | null = null;
    if (storeId) {
      const store = await prisma.store.findFirst({
        where: { id: storeId, storeAdminId },
        select: { id: true },
      });
      if (!store) {
        return NextResponse.json(
          { error: 'storeId does not belong to the given storeAdminId.' },
          { status: 400, headers: corsHeaders }
        );
      }
      resolvedStoreId = store.id;
    } else {
      const store = await prisma.store.findUnique({
        where: { storeAdminId },
        select: { id: true },
      });
      resolvedStoreId = store?.id ?? null;
    }

    // --- Cap check per type ---
    const count = await prisma.storeAdminImg.count({
      where: { storeAdminId, type: type as StoreImageType, isActive: true },
    });
    if (count >= CAPS[type]) {
      return NextResponse.json(
        { error: `Limit reached: max ${CAPS[type]} active ${type} image(s). Remove one first.` },
        { status: 400, headers: corsHeaders }
      );
    }

    // --- Upload to DigitalOcean Spaces ---
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext =
      path.extname(file.name) ||
      (file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg');
    const key = `store-images/${storeAdminId}/${type.toLowerCase()}/${crypto.randomUUID()}${ext}`;

    // uploadToSpaces returns the URL string directly (see /api/admin/store/settings assets route).
    const url = await uploadToSpaces(buffer, key, file.type);

    if (!url) {
      console.error('uploadToSpaces returned no url for key:', key);
      return NextResponse.json(
        { error: 'Upload succeeded but no URL was returned. Please retry.' },
        { status: 500, headers: corsHeaders }
      );
    }

    // --- Save to DB (clean up file if insert fails) ---
    try {
      const image = await prisma.storeAdminImg.create({
        data: {
          img: url,
          type: type as StoreImageType,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          displayOrder:
            typeof displayOrderRaw === 'string' && !isNaN(parseInt(displayOrderRaw, 10))
              ? parseInt(displayOrderRaw, 10)
              : count + 1,
          storeAdminId,
          storeId: resolvedStoreId,
        },
      });

      return NextResponse.json({ success: true, image }, { status: 201, headers: corsHeaders });
    } catch (dbError: any) {
      await deleteFromSpaces(key).catch(() => {});
      console.error('DB insert failed after upload:', dbError);
      return NextResponse.json(
        { error: 'Failed to save image record.' },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    console.error('Create store image error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add image.' },
      { status: 500, headers: corsHeaders }
    );
  }
}