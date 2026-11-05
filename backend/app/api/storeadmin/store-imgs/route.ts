import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import path from 'path';
import {
  uploadToSpaces,
  deleteFromSpaces,
} from '@/lib/spaces';
import { StoreImageType } from '@prisma/client';
import {
  assertCanUploadStoreImage,
  getStorePlanEntitlements,
} from '@/lib/plan-entitlements';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods':
    'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization',
};

const STOREADMIN_TYPES: StoreImageType[] = [
  StoreImageType.COVER_PHOTO,
  StoreImageType.ADVERTISE_PHOTO,
];

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_BYTES = 5 * 1024 * 1024;

function verifyStoreAdmin(req: Request) {
  const authHeader =
    req.headers.get('Authorization');

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
        error:
          'Forbidden. Store Admin access required.',
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

function isAllowedType(
  value: string
): value is StoreImageType {
  return STOREADMIN_TYPES.includes(
    value as StoreImageType
  );
}

async function resolveStoreId(
  storeAdminId: string
) {
  const store = await prisma.store.findUnique({
    where: {
      storeAdminId,
    },
    select: {
      id: true,
    },
  });

  if (!store) {
    throw new Error(
      'No store is linked to this Store Admin.'
    );
  }

  return store.id;
}

export async function GET(req: Request) {
  try {
    const auth = verifyStoreAdmin(req);

    if ('error' in auth) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        {
          status: auth.status,
          headers: corsHeaders,
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const typeParam =
      searchParams.get('type');

    let type: StoreImageType | undefined;

    if (typeParam) {
      if (!isAllowedType(typeParam)) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Store Admin can manage only COVER_PHOTO and ADVERTISE_PHOTO.',
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      type = typeParam;
    }

    const images =
      await prisma.storeAdminImg.findMany({
        where: {
          storeAdminId: auth.decoded.id,
          ...(type ? { type } : {}),
        },
        orderBy: [
          { type: 'asc' },
          { displayOrder: 'asc' },
          { createdAt: 'desc' },
        ],
      });

    const entitlements =
      await getStorePlanEntitlements(
        auth.decoded.id
      );

    return NextResponse.json(
      {
        success: true,
        images,
        entitlements,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Failed to fetch store images.',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function POST(req: Request) {
  let uploadedKey: string | null = null;

  try {
    const auth = verifyStoreAdmin(req);

    if ('error' in auth) {
      return NextResponse.json(
        {
          success: false,
          error: auth.error,
        },
        {
          status: auth.status,
          headers: corsHeaders,
        }
      );
    }

    const storeAdmin =
      await prisma.storeAdmin.findUnique({
        where: {
          id: auth.decoded.id,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!storeAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Store admin not found.',
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    if (storeAdmin.status === 'RESTRICTED') {
      return NextResponse.json(
        {
          success: false,
          error:
            'Access Restricted. Your account has been disabled.',
        },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    const formData = await req.formData();
    const file =
      formData.get('file') as File | null;
    const typeRaw =
      formData.get('type');
    const displayOrderRaw =
      formData.get('displayOrder');

    const type =
      typeof typeRaw === 'string'
        ? typeRaw.trim()
        : '';

    if (!file || !type) {
      return NextResponse.json(
        {
          success: false,
          error:
            'file and type are required.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (!isAllowedType(type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Store Admin can upload only COVER_PHOTO and ADVERTISE_PHOTO.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Only JPEG, PNG and WEBP images are allowed.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error:
            'File too large. Maximum size is 5MB.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Dynamic DB-driven plan check.
    const permission =
      await assertCanUploadStoreImage(
        auth.decoded.id,
        type
      );

    if (!permission.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: permission.code,
          error: permission.error,
          entitlements:
            permission.entitlements,
        },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    const storeId = await resolveStoreId(
      auth.decoded.id
    );

    let displayOrder = 1;

    if (
      typeof displayOrderRaw === 'string' &&
      displayOrderRaw.trim() !== ''
    ) {
      const parsed = Number.parseInt(
        displayOrderRaw,
        10
      );

      if (
        Number.isFinite(parsed) &&
        parsed > 0
      ) {
        displayOrder = parsed;
      }
    }

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    let extension = path.extname(file.name);

    if (!extension) {
      extension =
        file.type === 'image/png'
          ? '.png'
          : file.type === 'image/webp'
          ? '.webp'
          : '.jpg';
    }

    uploadedKey =
      `store-images/${auth.decoded.id}/` +
      `${storeId}/` +
      `${type.toLowerCase()}/` +
      `${crypto.randomUUID()}${extension}`;

    const url = await uploadToSpaces(
      buffer,
      uploadedKey,
      file.type
    );

    const image =
      await prisma.storeAdminImg.create({
        data: {
          img: url,
          type,
          displayOrder,
          isActive: true,
          storeAdminId: auth.decoded.id,
          storeId,
        },
      });

    const updatedEntitlements =
      await getStorePlanEntitlements(
        auth.decoded.id
      );

    return NextResponse.json(
      {
        success: true,
        message:
          `${type} uploaded successfully.`,
        image,
        entitlements:
          updatedEntitlements,
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    if (uploadedKey) {
      try {
        await deleteFromSpaces(uploadedKey);
      } catch (cleanupError) {
        console.error(
          'Failed to clean uploaded image:',
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Failed to upload store image.',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}
