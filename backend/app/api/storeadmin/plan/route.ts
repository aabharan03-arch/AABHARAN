import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getStorePlanEntitlements } from '@/lib/plan-entitlements';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods':
    'GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization',
};

function verifyStoreAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');

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
        error: 'Forbidden. Store Admin access required.',
        status: 403,
      } as const;
    }

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

    const entitlements =
      await getStorePlanEntitlements(
        auth.decoded.id
      );

    return NextResponse.json(
      {
        success: true,
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
          'Failed to fetch plan entitlements.',
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
