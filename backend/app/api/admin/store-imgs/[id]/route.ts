import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { uploadToSpaces, deleteFromSpaces, keyFromUrl } from '@/lib/spaces';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
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

const VALID_TYPES = ['COVER_PHOTO', 'FIRST_PHOTO', 'ADVERTISE_PHOTO'];
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

// =====================================================
// PATCH /api/admin/store-images/[id] — admin only
// multipart/form-data with any subset of:
//   file (optional — replaces the image in Spaces), type, expiryDate,
//   displayOrder, isActive
// (JSON body also works if only editing non-file fields)
// =====================================================
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = verifyAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const { id } = await params;

    const existing = await prisma.storeAdminImg.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Image not found.' }, { status: 404, headers: corsHeaders });
    }

    // Accept both multipart (file present) and JSON (field edits only)
    const contentType = req.headers.get('content-type') || '';
    let file: File | null = null;
    let type: string | undefined;
    let expiryDate: string | null | undefined;
    let displayOrder: number | undefined;
    let isActive: boolean | undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      file = formData.get('file') as File | null;
      const typeRaw = formData.get('type') as string | null;
      const expiryRaw = formData.get('expiryDate');
      const orderRaw = formData.get('displayOrder');
      const activeRaw = formData.get('isActive');

      if (typeRaw) type = typeRaw;
      if (expiryRaw !== null) expiryDate = expiryRaw === '' ? null : (expiryRaw as string);
      if (orderRaw !== null && !isNaN(parseInt(orderRaw as string, 10))) {
        displayOrder = parseInt(orderRaw as string, 10);
      }
      if (activeRaw !== null) isActive = activeRaw === 'true';
    } else {
      const body = await req.json();
      type = body.type;
      expiryDate = body.expiryDate;
      displayOrder = body.displayOrder;
      isActive = body.isActive;
    }

    // --- Field validation ---
    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid type value.' }, { status: 400, headers: corsHeaders });
    }
    if (file) {
      if (!ALLOWED_MIME.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type. Allowed: ${ALLOWED_MIME.join(', ')}` },
          { status: 400, headers: corsHeaders }
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400, headers: corsHeaders });
      }
    }

    // --- Build update data ---
    const data: Record<string, any> = {
      ...(type !== undefined ? { type } : {}),
      ...(expiryDate !== undefined ? { expiryDate: expiryDate ? new Date(expiryDate) : null } : {}),
      ...(typeof displayOrder === 'number' ? { displayOrder } : {}),
      ...(typeof isActive === 'boolean' ? { isActive } : {}),
    };

    // --- If a new file is provided: upload new, delete old from Spaces ---
    let uploadedKey: string | null = null;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      uploadedKey = `store-images/existing.storeAdminId/{existing.storeAdminId}/existing.storeAdminId/{(type ?? existing.type).toLowerCase()}/crypto.randomUUID().{crypto.randomUUID()}.crypto.randomUUID().{ext}`;

      const { url } = await uploadToSpaces(buffer, uploadedKey, file.type);
      data.img = url;

      // best-effort cleanup of the old object
      const oldKey = keyFromUrl(existing.img);
      if (oldKey) {
        await deleteFromSpaces(oldKey).catch((e) => console.warn('Old image cleanup failed:', oldKey, e));
      }
    }

    const updated = await prisma.storeAdminImg.update({ where: { id }, data });

    return NextResponse.json({ success: true, image: updated }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Update store image error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update image.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// =====================================================
// DELETE /api/admin/store-images/[id] — admin only
// Removes the Spaces object, then the DB row
// =====================================================
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = verifyAdmin(req);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status, headers: corsHeaders });
    }

    const { id } = await params;

    const existing = await prisma.storeAdminImg.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Image not found.' }, { status: 404, headers: corsHeaders });
    }

    // Remove from Spaces (best-effort — DB row still gets deleted)
    const key = keyFromUrl(existing.img);
    if (key) {
      await deleteFromSpaces(key).catch((e) => console.warn('Spaces cleanup failed:', key, e));
    }

    await prisma.storeAdminImg.delete({ where: { id } });

    return NextResponse.json(
      { success: true, message: 'Image deleted.' },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Delete store image error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete image.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
