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
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

// =====================================================
// TOKEN HELPERS
// =====================================================

function verifyAnyToken(req: Request) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: 'Unauthorized. Token missing.',
      status: 401,
    } as const;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );

    return {
      decoded,
    } as const;
  } catch {
    return {
      error: 'Invalid or expired token.',
      status: 401,
    } as const;
  }
}

function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: 'Unauthorized. Token missing.',
      status: 401,
    } as const;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      id: string;
      role: string;
    };

    if (decoded.role !== 'admin') {
      return {
        error: 'Forbidden. Admin access required.',
        status: 403,
      } as const;
    }

    return {
      decoded,
    };
  } catch {
    return {
      error: 'Invalid or expired token.',
      status: 401,
    } as const;
  }
}

// =====================================================
// CONSTANTS
// =====================================================

const VALID_TYPES: StoreImageType[] = [
  StoreImageType.COVER_PHOTO,
  StoreImageType.FIRST_PHOTO,
  StoreImageType.ADVERTISE_PHOTO,
];

const CAPS: Record<StoreImageType, number> = {
  [StoreImageType.COVER_PHOTO]: 5,
  [StoreImageType.FIRST_PHOTO]: 5,
  [StoreImageType.ADVERTISE_PHOTO]: 10,
};

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const MAX_BYTES = 5 * 1024 * 1024;

// =====================================================
// HELPERS
// =====================================================

function isValidStoreImageType(
  value: string
): value is StoreImageType {
  return VALID_TYPES.includes(
    value as StoreImageType
  );
}

// =====================================================
// GET
// /api/admin/store-imgs
//
// Examples:
//
// /api/admin/store-imgs?type=COVER_PHOTO
//
// /api/admin/store-imgs?type=COVER_PHOTO&storeId=xxx
//
// /api/admin/store-imgs?storeAdminId=xxx
//
// =====================================================

export async function GET(req: Request) {
  try {
    // Enable this if GET should require auth
    //
    // const auth = verifyAnyToken(req);
    //
    // if ('error' in auth) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: auth.error,
    //     },
    //     {
    //       status: auth.status,
    //       headers: corsHeaders,
    //     }
    //   );
    // }

    const { searchParams } = new URL(req.url);

    const typeParam =
      searchParams.get('type');

    const storeAdminId =
      searchParams.get('storeAdminId');

    const storeId =
      searchParams.get('storeId');

    // ---------------------------------------------
    // Validate and safely convert query type
    // ---------------------------------------------

    let type: StoreImageType | undefined;

    if (typeParam) {
      if (
        !isValidStoreImageType(typeParam)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid type. Must be one of: ${VALID_TYPES.join(
              ', '
            )}`,
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      type = typeParam;
    }

    // ---------------------------------------------
    // Fetch images
    // ---------------------------------------------

    const images =
      await prisma.storeAdminImg.findMany({
        where: {
          ...(type
            ? {
                type,
              }
            : {}),

          ...(storeAdminId
            ? {
                storeAdminId,
              }
            : {}),

          ...(storeId
            ? {
                storeId,
              }
            : {}),
        },

        orderBy: [
          {
            type: 'asc',
          },
          {
            displayOrder: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

    return NextResponse.json(
      {
        success: true,
        count: images.length,
        images,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error(
      'Fetch store images error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error?.message,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// =====================================================
// POST
// /api/admin/store-imgs
//
// multipart/form-data:
//
// file
// type
// storeAdminId
// storeId
// expiryDate
// displayOrder
//
// =====================================================

export async function POST(req: Request) {
  try {
    // =================================================
    // AUTH
    // =================================================

    const auth = verifyAdmin(req);

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

    // =================================================
    // FORM DATA
    // =================================================

    const formData =
      await req.formData();

    const file =
      formData.get('file') as File | null;

    const typeRaw =
      formData.get('type');

    const storeAdminIdRaw =
      formData.get('storeAdminId');

    const storeIdRaw =
      formData.get('storeId');

    const expiryDateRaw =
      formData.get('expiryDate');

    const displayOrderRaw =
      formData.get('displayOrder');

    const type =
      typeof typeRaw === 'string'
        ? typeRaw.trim()
        : null;

    const storeAdminId =
      typeof storeAdminIdRaw === 'string'
        ? storeAdminIdRaw.trim()
        : null;

    const storeId =
      typeof storeIdRaw === 'string'
        ? storeIdRaw.trim()
        : null;

    const expiryDate =
      typeof expiryDateRaw === 'string'
        ? expiryDateRaw.trim()
        : null;

    // =================================================
    // REQUIRED FIELDS
    // =================================================

    if (
      !file ||
      !type ||
      !storeAdminId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'file, type and storeAdminId are required.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // =================================================
    // TYPE VALIDATION
    // =================================================

    if (
      !isValidStoreImageType(type)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(
            ', '
          )}`,
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // From here onwards TypeScript knows:
    //
    // type = StoreImageType

    // =================================================
    // FILE TYPE
    // =================================================

    if (
      !ALLOWED_MIME.includes(
        file.type
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type. Allowed: ${ALLOWED_MIME.join(
            ', '
          )}`,
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // =================================================
    // FILE SIZE
    // =================================================

    if (
      file.size > MAX_BYTES
    ) {
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

    // =================================================
    // STORE ADMIN VALIDATION
    // =================================================

    const storeAdmin =
      await prisma.storeAdmin.findUnique({
        where: {
          id: storeAdminId,
        },

        select: {
          id: true,
        },
      });

    if (!storeAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Store admin not found.',
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // =================================================
    // RESOLVE STORE
    // =================================================

    let resolvedStoreId: string | null =
      null;

    // -------------------------------------------------
    // Store ID explicitly sent
    // -------------------------------------------------

    if (storeId) {
      const store =
        await prisma.store.findFirst({
          where: {
            id: storeId,
            storeAdminId,
          },

          select: {
            id: true,
          },
        });

      if (!store) {
        return NextResponse.json(
          {
            success: false,
            error:
              'storeId does not belong to the given storeAdminId.',
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      resolvedStoreId = store.id;
    }

    // -------------------------------------------------
    // No storeId supplied
    // -------------------------------------------------

    else {
      const stores =
        await prisma.store.findMany({
          where: {
            storeAdminId,
          },

          select: {
            id: true,
          },

          take: 2,
        });

      if (
        stores.length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'No store found for this store admin.',
          },
          {
            status: 404,
            headers: corsHeaders,
          }
        );
      }

      if (
        stores.length === 1
      ) {
        resolvedStoreId =
          stores[0].id;
      }

      if (
        stores.length > 1
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'This admin has multiple stores. storeId is required.',
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }
    }

    if (!resolvedStoreId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Unable to resolve store.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // =================================================
    // ACTIVE IMAGE COUNT
    //
    // IMPORTANT:
    // Count is PER STORE + PER TYPE
    // =================================================

    const activeImageCount =
      await prisma.storeAdminImg.count({
        where: {
          storeId:
            resolvedStoreId,

          type,

          isActive: true,
        },
      });

    const maxAllowed =
      CAPS[type];

    if (
      activeImageCount >=
      maxAllowed
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            `Limit reached for this store. ` +
            `Maximum ${maxAllowed} active ${type} image(s) allowed.`,

          type,

          storeId:
            resolvedStoreId,

          currentCount:
            activeImageCount,

          maxAllowed,
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // =================================================
    // DISPLAY ORDER
    // =================================================

    let displayOrder =
      activeImageCount + 1;

    if (
      typeof displayOrderRaw ===
        'string' &&
      displayOrderRaw.trim() !== ''
    ) {
      const parsed =
        Number.parseInt(
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

    // =================================================
    // EXPIRY DATE
    // =================================================

    let parsedExpiryDate:
      | Date
      | null = null;

    if (expiryDate) {
      parsedExpiryDate =
        new Date(expiryDate);

      if (
        Number.isNaN(
          parsedExpiryDate.getTime()
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid expiryDate.',
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }
    }

    // =================================================
    // FILE EXTENSION
    // =================================================

    const buffer =
      Buffer.from(
        await file.arrayBuffer()
      );

    let extension =
      path.extname(file.name);

    if (!extension) {
      if (
        file.type ===
        'image/png'
      ) {
        extension = '.png';
      } else if (
        file.type ===
        'image/webp'
      ) {
        extension = '.webp';
      } else {
        extension = '.jpg';
      }
    }

    // =================================================
    // DIGITALOCEAN PATH
    // =================================================

    const key =
      `store-images/` +
      `${storeAdminId}/` +
      `${resolvedStoreId}/` +
      `${type.toLowerCase()}/` +
      `${crypto.randomUUID()}` +
      `${extension}`;

    // =================================================
    // UPLOAD
    // =================================================

    let url: string;

    try {
      url =
        await uploadToSpaces(
          buffer,
          key,
          file.type
        );
    } catch (uploadError) {
      console.error(
        'Spaces upload failed:',
        uploadError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to upload image.',
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    if (!url) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Upload succeeded but no URL was returned.',
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // =================================================
    // CREATE DB RECORD
    // =================================================

    try {
      const image =
        await prisma.storeAdminImg.create({
          data: {
            img: url,

            type,

            expiryDate:
              parsedExpiryDate,

            displayOrder,

            isActive: true,

            storeAdminId,

            storeId:
              resolvedStoreId,
          },
        });

      return NextResponse.json(
        {
          success: true,

          message:
            `${type} uploaded successfully.`,

          image,

          storeId:
            resolvedStoreId,

          limits: {
            current:
              activeImageCount +
              1,

            maximum:
              maxAllowed,

            remaining:
              Math.max(
                maxAllowed -
                  (activeImageCount +
                    1),
                0
              ),
          },
        },
        {
          status: 201,
          headers: corsHeaders,
        }
      );
    } catch (dbError: any) {
      // -----------------------------------------------
      // DB failed, remove uploaded Spaces file
      // -----------------------------------------------

      try {
        await deleteFromSpaces(
          key
        );
      } catch (
        cleanupError
      ) {
        console.error(
          'Failed to clean uploaded file:',
          cleanupError
        );
      }

      console.error(
        'DB insert failed after upload:',
        dbError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            'Failed to save image record.',
          details:
            dbError?.message,
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  } catch (error: any) {
    console.error(
      'Create store image error:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          'Failed to add image.',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}