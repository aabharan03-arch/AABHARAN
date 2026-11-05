import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ImagePlus,
  Trash2,
  RefreshCw,
  Crown,
  Image as ImageIcon,
  Megaphone,
  Package,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

import {
  deleteStoreAdminImage,
  fetchStoreAdminImages,
  uploadStoreAdminImage,
  type StoreAdminImage,
  type StoreAdminImageType,
  type StorePlanEntitlements,
} from '../../lib/api';

// ============================================================
// THEME
// ============================================================

const T = {
  ivory: '#f8f5ea',
  ivory2: '#fffdf7',

  navy: '#11182d',
  navy2: '#1a2238',

  gold: '#c8a545',
  goldLight: '#f5ecd2',

  muted: '#6f7480',

  border: '#ded8c7',

  green: '#207a55',
  greenBg: '#eaf7f0',

  amber: '#a66d12',
  amberBg: '#fff7df',

  red: '#b64646',
  redBg: '#fff0f0',
};

// ============================================================
// MAIN PAGE
// ============================================================

export function StoreImagesPage() {
  const [images, setImages] =
    useState<StoreAdminImage[]>([]);

  const [entitlements, setEntitlements] =
    useState<StorePlanEntitlements | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [busyType, setBusyType] =
    useState<StoreAdminImageType | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  // ----------------------------------------------------------
  // LOAD
  // ----------------------------------------------------------

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result =
        await fetchStoreAdminImages();

      setImages(result.images ?? []);

      setEntitlements(
        result.entitlements ?? null
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load store images.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // ----------------------------------------------------------
  // FILTERED IMAGES
  // ----------------------------------------------------------

  const covers = useMemo(
    () =>
      images.filter(
        image =>
          image.type === 'COVER_PHOTO'
      ),
    [images]
  );

  const ads = useMemo(
    () =>
      images.filter(
        image =>
          image.type ===
          'ADVERTISE_PHOTO'
      ),
    [images]
  );

  // ----------------------------------------------------------
  // UPLOAD
  // ----------------------------------------------------------

  async function upload(
    type: StoreAdminImageType,
    file: File
  ) {
    try {
      setBusyType(type);
      setError(null);

      const result =
        await uploadStoreAdminImage({
          type,
          file,
        });

      setImages(current => [
        result.image,
        ...current,
      ]);

      if (result.entitlements) {
        setEntitlements(
          result.entitlements
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Upload failed.'
      );
    } finally {
      setBusyType(null);
    }
  }

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  async function remove(
    image: StoreAdminImage
  ) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this image?'
    );

    if (!confirmed) return;

    try {
      setDeletingId(image.id);
      setError(null);

      const result =
        await deleteStoreAdminImage(
          image.id
        );

      setImages(current =>
        current.filter(
          item => item.id !== image.id
        )
      );

      if (result.entitlements) {
        setEntitlements(
          result.entitlements
        );
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Delete failed.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------

  if (loading) {
    return <LoadingState />;
  }

  const plan =
    entitlements?.plan ?? null;

  const usage =
    entitlements?.usage ?? null;

  return (
    <div
      className="min-h-full"
      style={{
        background: T.ivory,
        color: T.navy,
      }}
    >
      <div className="p-5 md:p-7 lg:p-9 space-y-7">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <div
                className="h-10 w-10 rounded-xl grid place-items-center"
                style={{
                  background:
                    T.goldLight,
                  color: T.gold,
                }}
              >
                <ImagePlus className="h-5 w-5" />
              </div>

              <div>
                <h1
                  className="text-2xl md:text-3xl font-semibold tracking-tight"
                  style={{
                    color: T.navy,
                  }}
                >
                  Store Images
                </h1>

                <p
                  className="text-sm mt-1"
                  style={{
                    color: T.muted,
                  }}
                >
                  Manage your cover and advertisement images based on your membership plan.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="h-10 px-4 rounded-xl border inline-flex items-center justify-center gap-2 text-sm font-medium transition hover:shadow-sm"
            style={{
              background: T.ivory2,
              borderColor: T.border,
              color: T.navy,
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            className="rounded-xl border px-4 py-3 flex items-start gap-3"
            style={{
              background: T.redBg,
              borderColor: '#efc6c6',
              color: T.red,
            }}
          >
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />

            <div>
              <div className="font-semibold text-sm">
                Something went wrong
              </div>

              <div className="text-sm mt-0.5">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            PLAN CARD
        ================================================== */}

        {entitlements && plan && usage && (
          <section
            className="rounded-2xl border overflow-hidden"
            style={{
              background: T.ivory2,
              borderColor: T.border,
            }}
          >
            <div
              className="px-5 md:px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              style={{
                background:
                  'linear-gradient(135deg, #11182d 0%, #1d2742 100%)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-11 w-11 rounded-xl grid place-items-center"
                  style={{
                    background:
                      'rgba(200,165,69,0.14)',
                    color: T.gold,
                  }}
                >
                  <Crown className="h-5 w-5" />
                </div>

                <div>
                  <div
                    className="text-xs uppercase tracking-[0.15em]"
                    style={{
                      color:
                        'rgba(255,255,255,0.65)',
                    }}
                  >
                    Current Plan
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <h2
                      className="text-xl font-semibold"
                      style={{
                        color: '#ffffff',
                      }}
                    >
                      {plan.name}
                    </h2>

                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        background:
                          'rgba(200,165,69,0.16)',
                        color: '#e9ca70',
                      }}
                    >
                      Priority {plan.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="inline-flex items-center gap-2 text-xs"
                style={{
                  color:
                    'rgba(255,255,255,0.7)',
                }}
              >
                <ShieldCheck className="h-4 w-4" />
                Limits managed by your plan
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="grid gap-4 md:grid-cols-3">

                <UsageCard
                  icon={Package}
                  label="Products"
                  current={usage.products}
                  maximum={
                    plan.maxProducts
                  }
                />

                <UsageCard
                  icon={ImageIcon}
                  label="Cover Photos"
                  current={
                    usage.coverPhotos
                  }
                  maximum={
                    plan.maxCoverPhotos
                  }
                />

                <UsageCard
                  icon={Megaphone}
                  label="Advertisement Photos"
                  current={
                    usage.advertisePhotos
                  }
                  maximum={
                    plan.maxAdvertisePhotos
                  }
                />
              </div>
            </div>
          </section>
        )}

        {/* ==================================================
            IMAGE SECTIONS
        ================================================== */}

        <div className="grid gap-6">

          <ImageSection
            title="Cover Photos"
            description="These images are used as store cover banners on the customer side."
            icon={ImageIcon}
            images={covers}
            maximum={
              plan?.maxCoverPhotos ?? 0
            }
            busy={
              busyType ===
              'COVER_PHOTO'
            }
            deletingId={deletingId}
            accent="cover"
            onUpload={file =>
              upload(
                'COVER_PHOTO',
                file
              )
            }
            onDelete={remove}
          />

          <ImageSection
            title="Advertisement Photos"
            description="Promotional images displayed in advertisement sections."
            icon={Megaphone}
            images={ads}
            maximum={
              plan?.maxAdvertisePhotos ??
              0
            }
            busy={
              busyType ===
              'ADVERTISE_PHOTO'
            }
            deletingId={deletingId}
            accent="advertise"
            onUpload={file =>
              upload(
                'ADVERTISE_PHOTO',
                file
              )
            }
            onDelete={remove}
          />

        </div>

        {/* ==================================================
            POPUP FEATURE
        ================================================== */}

        {plan && (
          <section
            className="rounded-2xl border p-5 md:p-6"
            style={{
              background: T.ivory2,
              borderColor: T.border,
            }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-start gap-3">

                <div
                  className="h-11 w-11 rounded-xl grid place-items-center shrink-0"
                  style={{
                    background:
                      plan.popupEnabled
                        ? T.greenBg
                        : T.amberBg,
                    color:
                      plan.popupEnabled
                        ? T.green
                        : T.amber,
                  }}
                >
                  <Sparkles className="h-5 w-5" />
                </div>

                <div>
                  <h3
                    className="font-semibold text-lg"
                    style={{
                      color: T.navy,
                    }}
                  >
                    Popup Promotion
                  </h3>

                  <p
                    className="text-sm mt-1"
                    style={{
                      color: T.muted,
                    }}
                  >
                    Show promotional popup content to customers visiting your store.
                  </p>
                </div>
              </div>

              <div>
                {plan.popupEnabled ? (
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background:
                        T.greenBg,
                      color: T.green,
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Included in plan
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
                    style={{
                      background:
                        T.amberBg,
                      color: T.amber,
                    }}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Not included
                  </span>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ============================================================
// USAGE CARD
// ============================================================

function UsageCard({
  icon: Icon,
  label,
  current,
  maximum,
}: {
  icon: React.ElementType;
  label: string;
  current: number;
  maximum: number | null;
}) {
  const unlimited =
    maximum === null;

  const percentage =
    unlimited
      ? 0
      : maximum === 0
      ? 0
      : Math.min(
          (current / maximum) * 100,
          100
        );

  const reached =
    !unlimited &&
    maximum !== 0 &&
    current >= maximum;

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: T.border,
        background: '#ffffff',
      }}
    >
      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-3">

          <div
            className="h-9 w-9 rounded-lg grid place-items-center"
            style={{
              background: T.goldLight,
              color: T.gold,
            }}
          >
            <Icon className="h-4 w-4" />
          </div>

          <div>
            <div
              className="text-xs font-medium"
              style={{
                color: T.muted,
              }}
            >
              {label}
            </div>

            <div
              className="font-semibold text-lg mt-0.5"
              style={{
                color: T.navy,
              }}
            >
              {current}
              <span
                className="text-sm font-normal"
                style={{
                  color: T.muted,
                }}
              >
                {' '}
                /{' '}
                {unlimited
                  ? 'Unlimited'
                  : maximum}
              </span>
            </div>
          </div>
        </div>

        {reached && (
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full"
            style={{
              background: T.redBg,
              color: T.red,
            }}
          >
            LIMIT
          </span>
        )}
      </div>

      {!unlimited && (
        <div className="mt-4">
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{
              background: '#ece8da',
            }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${percentage}%`,
                background:
                  reached
                    ? T.red
                    : T.gold,
              }}
            />
          </div>

          <div
            className="mt-2 text-[11px]"
            style={{
              color: T.muted,
            }}
          >
            {maximum === 0
              ? 'Not included in plan'
              : `${Math.max(
                  maximum - current,
                  0
                )} remaining`}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// IMAGE SECTION
// ============================================================

function ImageSection({
  title,
  description,
  icon: Icon,
  images,
  maximum,
  busy,
  deletingId,
  accent,
  onUpload,
  onDelete,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  images: StoreAdminImage[];
  maximum: number;
  busy: boolean;
  deletingId: string | null;
  accent: 'cover' | 'advertise';
  onUpload: (file: File) => void;
  onDelete: (
    image: StoreAdminImage
  ) => void;
}) {
  const activeCount =
    images.filter(
      image => image.isActive
    ).length;

  const reached =
    maximum <= 0 ||
    activeCount >= maximum;

  const percentage =
    maximum <= 0
      ? 0
      : Math.min(
          (activeCount / maximum) *
            100,
          100
        );

  const accentBg =
    accent === 'cover'
      ? '#eef3ff'
      : '#fff2e4';

  const accentColor =
    accent === 'cover'
      ? '#4d6fbf'
      : '#b46b21';

  return (
    <section
      className="rounded-2xl border overflow-hidden"
      style={{
        background: T.ivory2,
        borderColor: T.border,
      }}
    >
      {/* HEADER */}

      <div className="p-5 md:p-6 border-b"
        style={{
          borderColor: T.border,
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div className="flex items-start gap-3">

            <div
              className="h-11 w-11 rounded-xl grid place-items-center shrink-0"
              style={{
                background:
                  accentBg,
                color:
                  accentColor,
              }}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2
                  className="text-lg font-semibold"
                  style={{
                    color: T.navy,
                  }}
                >
                  {title}
                </h2>

                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    background:
                      reached &&
                      maximum > 0
                        ? T.redBg
                        : T.goldLight,
                    color:
                      reached &&
                      maximum > 0
                        ? T.red
                        : T.gold,
                  }}
                >
                  {activeCount} /{' '}
                  {maximum}
                </span>
              </div>

              <p
                className="mt-1 text-sm"
                style={{
                  color: T.muted,
                }}
              >
                {description}
              </p>
            </div>
          </div>

          <label
            className={`h-10 px-4 rounded-xl inline-flex items-center justify-center gap-2 text-sm font-semibold transition ${
              reached || busy
                ? 'cursor-not-allowed'
                : 'cursor-pointer hover:opacity-90'
            }`}
            style={{
              background:
                reached || busy
                  ? '#e9e6db'
                  : T.navy,
              color:
                reached || busy
                  ? '#999589'
                  : '#ffffff',
            }}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}

            {busy
              ? 'Uploading...'
              : reached
              ? maximum === 0
                ? 'Not Available'
                : 'Limit Reached'
              : 'Upload Image'}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={
                reached || busy
              }
              className="hidden"
              onChange={e => {
                const file =
                  e.target.files?.[0];

                if (file) {
                  onUpload(file);
                }

                e.target.value = '';
              }}
            />
          </label>
        </div>

        {/* PROGRESS */}

        {maximum > 0 && (
          <div className="mt-5">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{
                background: '#ece8da',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${percentage}%`,
                  background:
                    reached
                      ? T.red
                      : T.gold,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* NOT INCLUDED */}

      {maximum === 0 ? (
        <div className="p-5 md:p-6">
          <div
            className="rounded-xl p-5 flex items-start gap-3"
            style={{
              background:
                T.amberBg,
              color:
                T.amber,
            }}
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />

            <div>
              <div className="font-semibold text-sm">
                Feature not included
              </div>

              <div className="text-sm mt-1">
                Your current plan does not include {title.toLowerCase()}.
                Upgrade your plan to enable this feature.
              </div>
            </div>
          </div>
        </div>
      ) : images.length === 0 ? (
        <EmptyImageState
          title={title}
          reached={reached}
          busy={busy}
          onUpload={onUpload}
        />
      ) : (
        <div className="p-5 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">

            {images.map(image => (
              <ImageCard
                key={image.id}
                image={image}
                title={title}
                deleting={
                  deletingId ===
                  image.id
                }
                onDelete={() =>
                  onDelete(image)
                }
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// IMAGE CARD
// ============================================================

function ImageCard({
  image,
  title,
  deleting,
  onDelete,
}: {
  image: StoreAdminImage;
  title: string;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <div
      className="group rounded-xl overflow-hidden border bg-white"
      style={{
        borderColor: T.border,
      }}
    >
      <div className="relative aspect-[16/8.5] overflow-hidden bg-gray-100">

        <img
          src={image.img}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        <div className="absolute inset-x-0 top-0 p-2 flex justify-between">

          {image.isActive ? (
            <span
              className="rounded-full px-2 py-1 text-[10px] font-semibold"
              style={{
                background:
                  'rgba(255,255,255,0.92)',
                color:
                  T.green,
              }}
            >
              Active
            </span>
          ) : (
            <span
              className="rounded-full px-2 py-1 text-[10px] font-semibold"
              style={{
                background:
                  'rgba(255,255,255,0.92)',
                color:
                  T.muted,
              }}
            >
              Inactive
            </span>
          )}

          <button
            type="button"
            disabled={deleting}
            onClick={onDelete}
            className="h-8 w-8 rounded-lg grid place-items-center shadow-sm transition hover:scale-105 disabled:opacity-50"
            style={{
              background:
                'rgba(255,255,255,0.94)',
              color: T.red,
            }}
            title="Delete image"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="px-3 py-3 flex items-center justify-between">
        <div>
          <div
            className="text-xs font-medium"
            style={{
              color: T.navy,
            }}
          >
            Display order
          </div>

          <div
            className="text-xs mt-0.5"
            style={{
              color: T.muted,
            }}
          >
            #{image.displayOrder}
          </div>
        </div>

        <div
          className="text-[10px]"
          style={{
            color: T.muted,
          }}
        >
          {image.createdAt
            ? new Date(
                image.createdAt
              ).toLocaleDateString(
                'en-IN'
              )
            : ''}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyImageState({
  title,
  reached,
  busy,
  onUpload,
}: {
  title: string;
  reached: boolean;
  busy: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="p-5 md:p-6">

      <div
        className="rounded-xl border border-dashed p-8 text-center"
        style={{
          borderColor:
            T.border,
          background:
            '#fbfaf5',
        }}
      >
        <div
          className="mx-auto h-12 w-12 rounded-xl grid place-items-center"
          style={{
            background:
              T.goldLight,
            color:
              T.gold,
          }}
        >
          <ImagePlus className="h-5 w-5" />
        </div>

        <h3
          className="mt-4 font-semibold"
          style={{
            color: T.navy,
          }}
        >
          No {title.toLowerCase()} yet
        </h3>

        <p
          className="mt-1 text-sm"
          style={{
            color: T.muted,
          }}
        >
          Upload your first image to start displaying it to customers.
        </p>

        {!reached && (
          <label
            className="mt-5 h-10 px-4 rounded-xl inline-flex items-center gap-2 cursor-pointer text-sm font-semibold"
            style={{
              background:
                T.navy,
              color:
                '#ffffff',
            }}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}

            Upload Image

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              className="hidden"
              onChange={e => {
                const file =
                  e.target.files?.[0];

                if (file) {
                  onUpload(file);
                }

                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LOADING
// ============================================================

function LoadingState() {
  return (
    <div
      className="min-h-full p-6 lg:p-9"
      style={{
        background:
          T.ivory,
      }}
    >
      <div className="animate-pulse space-y-6">

        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-lg" />
          <div className="mt-2 h-4 w-80 bg-gray-200 rounded-lg" />
        </div>

        <div className="h-48 bg-white rounded-2xl border" />

        <div className="h-52 bg-white rounded-2xl border" />

        <div className="h-52 bg-white rounded-2xl border" />
      </div>
    </div>
  );
}