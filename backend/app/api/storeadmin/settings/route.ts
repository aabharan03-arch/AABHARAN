import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// GET: Fetch store profile & branches
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Token missing.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };

    if (decoded.role !== 'storeadmin') {
      return NextResponse.json(
        { error: 'Forbidden. Invalid role.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const storeAdmin = await prisma.storeAdmin.findUnique({
      where: { id: decoded.id },
      select: { id: true, status: true },
    });

    if (!storeAdmin) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (storeAdmin.status === 'RESTRICTED') {
      return NextResponse.json(
        { error: 'Access Restricted. Your account has been disabled.' },
        { status: 403, headers: corsHeaders }
      );
    }

    let store = await prisma.store.findUnique({
      where: { storeAdminId: storeAdmin.id },
      include: { branches: true },
    });

    if (!store) {
      store = await prisma.store.create({
        data: {
          name: 'My Store',
          storeAdminId: storeAdmin.id,
        },
        include: { branches: true },
      });
    }

    return NextResponse.json({ store }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid or expired token.', details: error.message },
      { status: 401, headers: corsHeaders }
    );
  }
}

// PUT: Update basic info & social links
export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Token missing.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };

    if (decoded.role !== 'storeadmin') {
      return NextResponse.json(
        { error: 'Forbidden. Invalid role.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const storeAdmin = await prisma.storeAdmin.findUnique({
      where: { id: decoded.id },
      select: { id: true, status: true },
    });

    if (!storeAdmin) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (storeAdmin.status === 'RESTRICTED') {
      return NextResponse.json(
        { error: 'Access Restricted. Your account has been disabled.' },
        { status: 403, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { name, about, contactNumber, whatsapp, email, website, socialLinks } = body;

    const updatedStore = await prisma.store.upsert({
      where: { storeAdminId: storeAdmin.id },
      update: {
        name,
        about,
        contactNumber,
        whatsapp,
        email,
        website,
        instagram: socialLinks?.instagram ?? null,
        facebook: socialLinks?.facebook ?? null,
      },
      create: {
        storeAdminId: storeAdmin.id,
        name: name || 'My Store',
        about,
        contactNumber,
        whatsapp,
        email,
        website,
        instagram: socialLinks?.instagram ?? null,
        facebook: socialLinks?.facebook ?? null,
      },
      include: { branches: true },
    });

    return NextResponse.json(
      { message: 'Store updated successfully.', store: updatedStore },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid or expired token.', details: error.message },
      { status: 401, headers: corsHeaders }
    );
  }
}