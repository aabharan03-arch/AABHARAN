// app/api/products/[id]/enquire/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { fullName, email, phone, message } = await req.json();

    // --- Basic validation ---
    if (!fullName?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Full name, email, and message are required.' },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // --- Look up the product to resolve which store owns it ---
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, storeId: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found.' },
        { status: 404, headers: corsHeaders }
      );
    }
    if (!product.storeId) {
      return NextResponse.json(
        { error: 'This product has no associated store.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // --- Persist the enquiry ---
    // Product.storeId references StoreAdmin.id (per the existing routes' convention).
    const enquiry = await prisma.enquiry.create({
      data: {
        productId: product.id,
        storeAdminId: product.storeId,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        message: message.trim(),
      },
    });

    return NextResponse.json(
      { success: true, message: 'Enquiry submitted successfully.', enquiryId: enquiry.id },
      { status: 201, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Product enquiry error:', error);
    return NextResponse.json(
      { error: 'Failed to submit enquiry.', details: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}