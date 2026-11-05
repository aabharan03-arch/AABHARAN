import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import {
  deleteFromSpaces,
} from '@/lib/spaces';
import { StoreImageType } from '@prisma/client';
import {
  getStorePlanEntitlements,
} from '@/lib/plan-entitlements';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods':
    'PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization',
};

function verifyStoreAdmin(req: Request) {
  const authHeader =
    req.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      authHeader.split(' ')[1],
      process.env.JWT_SECRET!
    ) as {
      id: string;
      role: string;
    };

    return decoded.role === 'storeadmin'
      ? decoded
      : null;
  } catch {
    return null;
  }
}

function spacesKeyFromUrl(url: string) {
  try {
    return decodeURIComponent(
      new URL(url).pathname.replace(/^\/+/, '')
    );
  } catch {
    return null;
  }
}

export async function PATCH(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const decoded = verifyStoreAdmin(req);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    const { id } = await context.params;

    const image =
      await prisma.storeAdminImg.findFirst({
        where: {
          id,
          storeAdminId: decoded.id,
        },
      });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found.' },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    const body = await req.json();

    // Store Admin may only control order/active state.
    // Ownership/type cannot be reassigned.
    const updated =
      await prisma.storeAdminImg.update({
        where: { id },
        data: {
          ...(Number.isInteger(
            body.displayOrder
          ) &&
          body.displayOrder > 0
            ? {
                displayOrder:
                  body.displayOrder,
              }
            : {}),
          ...(typeof body.isActive ===
          'boolean'
            ? {
                isActive: body.isActive,
              }
            : {}),
        },
      });

    return NextResponse.json(
      {
        success: true,
        image: updated,
        entitlements:
          await getStorePlanEntitlements(
            decoded.id
          ),
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to update image.',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

export async function DELETE(
  req: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const decoded = verifyStoreAdmin(req);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized.' },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    const { id } = await context.params;

    const image =
      await prisma.storeAdminImg.findFirst({
        where: {
          id,
          storeAdminId: decoded.id,
          type: {
            in: [
              StoreImageType.COVER_PHOTO,
              StoreImageType.ADVERTISE_PHOTO,
            ],
          },
        },
      });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found.' },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    await prisma.storeAdminImg.delete({
      where: { id },
    });

    const key = spacesKeyFromUrl(image.img);

    if (key) {
      try {
        await deleteFromSpaces(key);
      } catch (error) {
        console.error(
          'Failed to delete Spaces object:',
          error
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Image deleted.',
        entitlements:
          await getStorePlanEntitlements(
            decoded.id
          ),
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to delete image.',
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
