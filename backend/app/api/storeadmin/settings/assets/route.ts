import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import path from 'path';
import { uploadToSpaces } from '@/lib/spaces';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

export async function POST(req: Request) {
  try {
    const auth = verifyStoreAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }
    const { decoded } = auth;

    const formData = await req.formData();

    const logoFile = formData.get('logo') as File | null;
    const bannerFile = formData.get('coverBanner') as File | null;

    if (!logoFile && !bannerFile) {
      return NextResponse.json({ error: 'No files provided for upload.' }, { status: 400, headers: corsHeaders });
    }

    const updateData: Record<string, any> = {};

    if (logoFile && logoFile.size > 0) {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const ext = path.extname(logoFile.name) || '.jpg';
      const key = `store-logos/${decoded.id}/${Date.now()}${ext}`;
      updateData.logo = await uploadToSpaces(buffer, key, logoFile.type || 'image/jpeg');
    }

    if (bannerFile && bannerFile.size > 0) {
      const buffer = Buffer.from(await bannerFile.arrayBuffer());
      const ext = path.extname(bannerFile.name) || '.jpg';
      const key = `store-banners/${decoded.id}/${Date.now()}${ext}`;
      updateData.coverBanner = await uploadToSpaces(buffer, key, bannerFile.type || 'image/jpeg');
    }

    // Persist to DB — Store is a separate model linked via storeAdminId,
    // not fields directly on StoreAdmin. Upsert because a brand-new store
    // admin may not have a Store row yet (e.g. first time visiting Settings).
    const updated = await prisma.store.upsert({
      where: { storeAdminId: decoded.id },
      update: updateData,
      create: {
        storeAdminId: decoded.id,
        name: 'My Store', // placeholder — overwritten once they save Basic Info
        ...updateData,
      },
    });

    return NextResponse.json({ success: true, data: updateData }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Store assets upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload files.' },
      { status: 500, headers: corsHeaders }
    );
  }
}