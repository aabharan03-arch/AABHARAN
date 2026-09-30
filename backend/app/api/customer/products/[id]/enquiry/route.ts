// app/api/products/[id]/enquire/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ----------------------------------------------------------
    // Product ID from URL
    // Example:
    // /api/products/40c012ec-e778-473d-a57e-7f7c9fabf6c3/enquire
    // ----------------------------------------------------------
    const { id: productId } = await params;

    // ----------------------------------------------------------
    // Customer enquiry data
    // ----------------------------------------------------------
    const {
      fullName,
      email,
      phone,
      message,
    } = await req.json();

    // ----------------------------------------------------------
    // Validation
    // ----------------------------------------------------------
    if (
      !fullName?.trim() ||
      !email?.trim() ||
      !message?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Full name, email, and message are required.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    if (!isValidEmail(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Please provide a valid email address.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // ----------------------------------------------------------
    // Get product
    //
    // IMPORTANT:
    // Product.storeId contains StoreAdmin.id
    // So frontend does NOT need to send storeAdminId.
    // ----------------------------------------------------------
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },

      select: {
        id: true,
        name: true,
        storeId: true,
        enquriycount: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found.',
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // ----------------------------------------------------------
    // Product must have a StoreAdmin ID
    // ----------------------------------------------------------
    if (!product.storeId?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This product has no associated store.',
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // ----------------------------------------------------------
    // Verify StoreAdmin exists
    // ----------------------------------------------------------
    const storeAdmin =
      await prisma.storeAdmin.findUnique({
        where: {
          id: product.storeId.trim(),
        },

        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    if (!storeAdmin) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Associated store admin not found.',
        },
        {
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // ----------------------------------------------------------
    // Transaction
    //
    // 1. Create enquiry
    // 2. Increment enquriycount
    //
    // If either operation fails, both are rolled back.
    // ----------------------------------------------------------
    const result = await prisma.$transaction(
      async (tx) => {
        // Create enquiry
        const enquiry =
          await tx.enquiry.create({
            data: {
              productId: product.id,

              // Automatically taken from Product.storeId
              storeAdminId:
                product.storeId!.trim(),

              fullName: fullName.trim(),

              email: email.trim(),

              phone:
                phone?.trim() || null,

              message:
                message.trim(),
            },
          });

        // Increment Product enquiry count
        const updatedProduct =
          await tx.product.update({
            where: {
              id: product.id,
            },

            data: {
              enquriycount: {
                increment: 1,
              },
            },

            select: {
              id: true,
              name: true,
              enquriycount: true,
            },
          });

        return {
          enquiry,
          updatedProduct,
        };
      }
    );

    // ----------------------------------------------------------
    // Success response
    // ----------------------------------------------------------
    return NextResponse.json(
      {
        success: true,

        message:
          'Enquiry submitted successfully.',

        enquiryId:
          result.enquiry.id,

        product: {
          id:
            result.updatedProduct.id,

          name:
            result.updatedProduct.name,

          enquriycount:
            result.updatedProduct
              .enquriycount,
        },

        storeAdmin: {
          id: storeAdmin.id,
          name: storeAdmin.name,
          email: storeAdmin.email,
        },
      },
      {
        status: 201,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error(
      'Product enquiry error:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          'Failed to submit enquiry.',

        details:
          process.env.NODE_ENV ===
          'development'
            ? error.message
            : undefined,
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}