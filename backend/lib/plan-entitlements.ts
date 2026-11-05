import { prisma } from '@/lib/prisma';
import { StoreImageType } from '@prisma/client';

export type EffectivePlanEntitlements = {
  storeAdminId: string;
  source: 'ASSIGNED_PLAN' | 'BASIC_FALLBACK';
  subscription: {
    id: string | null;
    startDate: Date | null;
    expiryDate: Date | null;
    isExpired: boolean;
  };
  plan: {
    id: string | null;
    name: string;
    cost: number;
    months: number;
    maxProducts: number | null;
    maxCoverPhotos: number;
    maxAdvertisePhotos: number;
    popupEnabled: boolean;
    priority: number;
  };
  usage: {
    products: number;
    coverPhotos: number;
    advertisePhotos: number;
  };
  remaining: {
    products: number | null;
    coverPhotos: number;
    advertisePhotos: number;
  };
};

function remaining(maximum: number | null, current: number) {
  if (maximum === null) return null;
  return Math.max(maximum - current, 0);
}

async function getBasicFallbackPlan() {
  const basic = await prisma.plan.findFirst({
    where: {
      name: {
        equals: 'BASIC',
        mode: 'insensitive',
      },
    },
    orderBy: {
      priority: 'asc',
    },
  });

  // Fallback values are only used if no BASIC plan exists yet.
  // Once BASIC exists, all limits come from the database.
  return basic ?? {
    id: null,
    name: 'BASIC',
    months: 1,
    cost: 0,
    maxProducts: 20,
    maxCoverPhotos: 0,
    maxAdvertisePhotos: 0,
    popupEnabled: false,
    priority: 1,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

export async function getStorePlanEntitlements(
  storeAdminId: string
): Promise<EffectivePlanEntitlements> {
  const now = new Date();

  const storeAdmin = await prisma.storeAdmin.findUnique({
    where: { id: storeAdminId },
    select: {
      id: true,
      status: true,
      subscriptions: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        include: {
          plan: true,
        },
      },
    },
  });

  if (!storeAdmin) {
    throw new Error('Store admin not found.');
  }

  const activeSubscription = storeAdmin.subscriptions[0] ?? null;
  const hasUsableSubscription =
    !!activeSubscription &&
    activeSubscription.isActive &&
    activeSubscription.expiryDate > now;

  const selectedPlan = hasUsableSubscription
    ? activeSubscription!.plan
    : await getBasicFallbackPlan();

  const [
    productCount,
    coverPhotoCount,
    advertisePhotoCount,
  ] = await Promise.all([
    prisma.product.count({
      where: {
        storeId: storeAdminId,
      },
    }),
    prisma.storeAdminImg.count({
      where: {
        storeAdminId,
        type: StoreImageType.COVER_PHOTO,
        isActive: true,
      },
    }),
    prisma.storeAdminImg.count({
      where: {
        storeAdminId,
        type: StoreImageType.ADVERTISE_PHOTO,
        isActive: true,
      },
    }),
  ]);

  return {
    storeAdminId,
    source: hasUsableSubscription ? 'ASSIGNED_PLAN' : 'BASIC_FALLBACK',
    subscription: {
      id: hasUsableSubscription ? activeSubscription!.id : null,
      startDate: hasUsableSubscription
        ? activeSubscription!.startDate
        : null,
      expiryDate: activeSubscription?.expiryDate ?? null,
      isExpired:
        !!activeSubscription &&
        activeSubscription.expiryDate <= now,
    },
    plan: {
      id: selectedPlan.id,
      name: selectedPlan.name,
      cost: selectedPlan.cost,
      months: selectedPlan.months,
      maxProducts: selectedPlan.maxProducts,
      maxCoverPhotos: selectedPlan.maxCoverPhotos,
      maxAdvertisePhotos: selectedPlan.maxAdvertisePhotos,
      popupEnabled: selectedPlan.popupEnabled,
      priority: selectedPlan.priority,
    },
    usage: {
      products: productCount,
      coverPhotos: coverPhotoCount,
      advertisePhotos: advertisePhotoCount,
    },
    remaining: {
      products: remaining(
        selectedPlan.maxProducts,
        productCount
      ),
      coverPhotos: Math.max(
        selectedPlan.maxCoverPhotos - coverPhotoCount,
        0
      ),
      advertisePhotos: Math.max(
        selectedPlan.maxAdvertisePhotos -
          advertisePhotoCount,
        0
      ),
    },
  };
}

export async function assertCanCreateProduct(
  storeAdminId: string
) {
  const entitlements =
    await getStorePlanEntitlements(storeAdminId);

  const maximum = entitlements.plan.maxProducts;

  if (
    maximum !== null &&
    entitlements.usage.products >= maximum
  ) {
    return {
      allowed: false as const,
      entitlements,
      error: `Your ${entitlements.plan.name} plan allows up to ${maximum} products.`,
      code: 'PRODUCT_LIMIT_REACHED',
    };
  }

  return {
    allowed: true as const,
    entitlements,
  };
}

export async function assertCanUploadStoreImage(
  storeAdminId: string,
  type: StoreImageType
) {
  const entitlements =
    await getStorePlanEntitlements(storeAdminId);

  let maximum: number;
  let current: number;
  let featureLabel: string;

  if (type === StoreImageType.COVER_PHOTO) {
    maximum = entitlements.plan.maxCoverPhotos;
    current = entitlements.usage.coverPhotos;
    featureLabel = 'cover photos';
  } else if (
    type === StoreImageType.ADVERTISE_PHOTO
  ) {
    maximum =
      entitlements.plan.maxAdvertisePhotos;
    current =
      entitlements.usage.advertisePhotos;
    featureLabel = 'advertisement photos';
  } else {
    return {
      allowed: false as const,
      entitlements,
      code: 'IMAGE_TYPE_NOT_STOREADMIN_MANAGED',
      error:
        'This image type is not available for Store Admin upload.',
    };
  }

  if (maximum <= 0) {
    return {
      allowed: false as const,
      entitlements,
      code: 'FEATURE_NOT_INCLUDED',
      error: `${featureLabel} are not included in your ${entitlements.plan.name} plan.`,
    };
  }

  if (current >= maximum) {
    return {
      allowed: false as const,
      entitlements,
      code: 'PLAN_LIMIT_REACHED',
      error: `Your ${entitlements.plan.name} plan allows up to ${maximum} ${featureLabel}.`,
    };
  }

  return {
    allowed: true as const,
    entitlements,
    maximum,
    current,
    remaining: Math.max(maximum - current, 0),
  };
}
