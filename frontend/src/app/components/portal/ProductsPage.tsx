
import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type {
  CSSProperties,
  ChangeEvent,
  MouseEvent,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Copy,
  Star,
  Eye,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import {
  CATEGORIES,
  METAL_TYPES,
} from '../data/mockData';
import type { Product } from '../data/mockData';

import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct as deleteProductApi,
  getCurrentStoreId,
  fetchCategories,
  fetchMetalTypes,
} from '../../lib/api';

// ============================================================
// CONFIGURATION
// ============================================================

const MAX_PRODUCT_IMAGES = 2;
const MAX_IMAGE_SIZE_BYTES = 500 * 1024;
const CACHE_KEY_PREFIX = 'products_cache_store_';

const PURITY_OPTIONS = [
  '22K',
  '24K',
  '18K',
  '925 Sterling Silver',
  'PT950',
  'PT900',
];

const T = {
  ivory: '#f9f7ee',
  ivoryShade: '#eeead9',
  navy: '#04091e',
  gold: '#c9a44c',
  goldSoft: '#e4d6ab',
  muted: '#6b6b5f',
  danger: '#b0473f',
  dangerSoft: '#f6e3e1',
};

type Option = {
  id: string;
  name: string;
};

const inputStyle: CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  backgroundColor: T.ivory,
  border: `1px solid ${T.ivoryShade}`,
  color: T.navy,
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '13.5px',
  width: '100%',
  outline: 'none',
};

const labelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: T.muted,
  marginBottom: '6px',
  display: 'block',
};

const primaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  backgroundColor: T.navy,
  color: T.gold,
  border: 'none',
  borderRadius: '10px',
  padding: '11px 20px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  backgroundColor: T.ivory,
  color: T.navy,
  border: `1px solid ${T.ivoryShade}`,
  borderRadius: '9px',
  padding: '9px 12px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

function getCacheKey(storeId: string) {
  return `${CACHE_KEY_PREFIX}${storeId}`;
}

function cacheProducts(
  storeId: string,
  products: Product[]
) {
  try {
    localStorage.setItem(
      getCacheKey(storeId),
      JSON.stringify(products)
    );
  } catch (error) {
    console.warn('Unable to cache products:', error);
  }
}

function getUniqueOptions(
  defaults: string[],
  apiOptions: Option[],
  current?: string
) {
  return Array.from(
    new Set(
      [
        ...defaults.filter(x => x !== 'All'),
        ...apiOptions.map(x => x.name),
        ...(current ? [current] : []),
      ].filter(Boolean)
    )
  );
}

// ============================================================
// MAIN PRODUCTS PAGE - NAMED EXPORT REQUIRED BY App.tsx
// ============================================================

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(
    null
  );

  const [apiCategories, setApiCategories] = useState<
    Option[]
  >([]);
  const [apiMetalTypes, setApiMetalTypes] = useState<
    Option[]
  >([]);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] =
    useState('All');
  const [metalFilter, setMetalFilter] = useState('All');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editProduct, setEditProduct] =
    useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] =
    useState<Product | null>(null);
  const [prefill, setPrefill] =
    useState<Partial<Product> | null>(null);

  const [deleting, setDeleting] = useState(false);
  const [featuredBusyId, setFeaturedBusyId] =
    useState<string | null>(null);

  // ----------------------------------------------------------
  // LOAD PRODUCTS
  // ----------------------------------------------------------

  const loadProducts = useCallback(
    async (ignoreCache = false) => {
      setLoading(true);
      setLoadError(null);

      const storeId = getCurrentStoreId();

      if (!storeId) {
        setProducts([]);
        setLoadError(
          'Not logged in — no store admin session found.'
        );
        setLoading(false);
        return;
      }

      try {
        if (!ignoreCache) {
          const cached = localStorage.getItem(
            getCacheKey(storeId)
          );

          if (cached) {
            try {
              const parsed = JSON.parse(cached);

              if (Array.isArray(parsed)) {
                setProducts(parsed as Product[]);
                setLoading(false);

                // Fetch dropdown options without blocking
                // the cached product display.
                const results = await Promise.allSettled([
                  fetchCategories(),
                  fetchMetalTypes(),
                ]);

                if (results[0].status === 'fulfilled') {
                  setApiCategories(results[0].value);
                }

                if (results[1].status === 'fulfilled') {
                  setApiMetalTypes(results[1].value);
                }

                return;
              }
            } catch {
              localStorage.removeItem(
                getCacheKey(storeId)
              );
            }
          }
        }

        const results = await Promise.allSettled([
          fetchProducts(storeId),
          fetchCategories(),
          fetchMetalTypes(),
        ]);

        const productResult = results[0];

        if (productResult.status === 'rejected') {
          throw productResult.reason;
        }

        const productList = productResult.value as Product[];

        if (!Array.isArray(productList)) {
          throw new Error('Invalid products response.');
        }

        setProducts(productList);
        cacheProducts(storeId, productList);

        if (results[1].status === 'fulfilled') {
          setApiCategories(results[1].value);
        }

        if (results[2].status === 'fulfilled') {
          setApiMetalTypes(results[2].value);
        }
      } catch (err: unknown) {
        setLoadError(
          err instanceof Error
            ? err.message
            : 'Failed to load products.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  // ----------------------------------------------------------
  // PRODUCT STATE + CACHE
  // ----------------------------------------------------------

  const updateProductsAndCache = useCallback(
    (updater: (prev: Product[]) => Product[]) => {
      setProducts(prev => updater(prev));
    },
    []
  );

  useEffect(() => {
    if (loading || loadError) return;

    const storeId = getCurrentStoreId();
    if (storeId) {
      cacheProducts(storeId, products);
    }
  }, [products, loading, loadError]);

  // ----------------------------------------------------------
  // FILTER OPTIONS
  // ----------------------------------------------------------

  const categoryOptions = useMemo(
    () =>
      getUniqueOptions(
        CATEGORIES,
        apiCategories,
        categoryFilter !== 'All'
          ? categoryFilter
          : undefined
      ),
    [apiCategories, categoryFilter]
  );

  const metalOptions = useMemo(
    () =>
      getUniqueOptions(
        METAL_TYPES,
        apiMetalTypes,
        metalFilter !== 'All'
          ? metalFilter
          : undefined
      ),
    [apiMetalTypes, metalFilter]
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return products.filter(product => {
      const matchesQuery =
        !search ||
        (product.name || '')
          .toLowerCase()
          .includes(search);

      const matchesCategory =
        categoryFilter === 'All' ||
        product.category === categoryFilter;

      const matchesMetal =
        metalFilter === 'All' ||
        product.metalType === metalFilter;

      return (
        matchesQuery &&
        matchesCategory &&
        matchesMetal
      );
    });
  }, [products, query, categoryFilter, metalFilter]);

  const hasActiveFilters =
    Boolean(query.trim()) ||
    categoryFilter !== 'All' ||
    metalFilter !== 'All';

  function clearFilters() {
    setQuery('');
    setCategoryFilter('All');
    setMetalFilter('All');
  }

  // ----------------------------------------------------------
  // CREATE / EDIT
  // ----------------------------------------------------------

  function openAddModal() {
    setEditProduct(null);
    setPrefill(null);
    setAddModalOpen(true);
  }

  function openEditModal(product: Product) {
    setAddModalOpen(false);
    setPrefill(null);
    setEditProduct(product);
  }

  function closeModal() {
    setAddModalOpen(false);
    setEditProduct(null);
    setPrefill(null);
  }

  function handleDuplicate(product: Product) {
    const {
      id: _id,
      ...copyFields
    } = product;

    setEditProduct(null);

    setPrefill({
      ...copyFields,
      name: `${product.name} (Copy)`,
      featured: false,
      views: 0,
      // Existing image URLs are reused.
      // The 2-image restriction still applies.
      images: (product.images || []).slice(
        0,
        MAX_PRODUCT_IMAGES
      ),
    });

    setAddModalOpen(true);
  }

  function handleSaved(
    saved: Product,
    isNew: boolean
  ) {
    updateProductsAndCache(prev => {
      if (isNew) {
        return [
          saved,
          ...prev.filter(p => p.id !== saved.id),
        ];
      }

      return prev.map(p =>
        p.id === saved.id ? saved : p
      );
    });

    closeModal();
  }

  // ----------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------

  async function handleDelete(product: Product) {
    if (deleting) return;

    setDeleting(true);

    try {
      await deleteProductApi(product.id);

      updateProductsAndCache(prev =>
        prev.filter(p => p.id !== product.id)
      );

      setDeleteProduct(null);
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to delete product.'
      );
    } finally {
      setDeleting(false);
    }
  }

  // ----------------------------------------------------------
  // FEATURED STATUS
  // ----------------------------------------------------------

  async function handleToggleFeatured(product: Product) {
    if (featuredBusyId) return;

    setFeaturedBusyId(product.id);

    const nextFeatured = !product.featured;

    try {
      const fd = new FormData();

      fd.append('featured', String(nextFeatured));
      fd.append(
        'existingImages',
        JSON.stringify(product.images || [])
      );

      const updated = await updateProduct(
        product.id,
        fd
      );

      updateProductsAndCache(prev =>
        prev.map(p =>
          p.id === product.id
            ? {
                ...p,
                ...(updated || {}),
                featured: nextFeatured,
              }
            : p
        )
      );
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to update featured status.'
      );
    } finally {
      setFeaturedBusyId(null);
    }
  }

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div
      className="flex flex-col gap-xl"
      style={{
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      {/* PAGE HEADER */}
      <div className="flex items-start justify-between flex-wrap gap-lg">
        <div>
          <h1
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '30px',
              fontWeight: 500,
              color: T.navy,
              marginTop: '6px',
              letterSpacing: '-0.01em',
            }}
          >
            Products
          </h1>

          <div
            style={{
              width: '40px',
              height: '2px',
              backgroundColor: T.gold,
              marginTop: '12px',
              marginBottom: '10px',
            }}
          />

          <p
            style={{
              color: T.muted,
              fontSize: '13px',
            }}
          >
            {loading
              ? 'Loading products…'
              : `${filtered.length} of ${products.length} products${
                  hasActiveFilters
                    ? ' · filtered'
                    : ' in your catalogue'
                }`}
          </p>
        </div>

        <div className="flex items-center gap-sm">
          <button
            onClick={() => void loadProducts(true)}
            title="Refresh products"
            style={secondaryButton}
            disabled={loading}
          >
            <RefreshCw
              size={15}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            onClick={openAddModal}
            style={primaryButton}
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '16px 20px',
          border: `1px solid ${T.ivoryShade}`,
        }}
        className="flex flex-col md:flex-row md:items-center gap-lg"
      >
        <div className="relative w-full md:w-[300px]">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
            color={T.muted}
          />

          <input
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              ...inputStyle,
              paddingLeft: '36px',
              height: '40px',
            }}
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-xs"
            style={{
              ...secondaryButton,
              color: T.danger,
              backgroundColor: T.dangerSoft,
            }}
          >
            <X size={13} />
            Clear filters
          </button>
        )}
      </div>

      {/* CATEGORY + METAL FILTERS */}
      <div
        className="flex flex-col md:flex-row gap-lg"
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          border: `1px solid ${T.ivoryShade}`,
          padding: '16px 20px',
        }}
      >
        <div className="flex-1 min-w-0">
          <label style={labelStyle}>Category</label>

          <select
            value={categoryFilter}
            onChange={e =>
              setCategoryFilter(e.target.value)
            }
            style={inputStyle}
          >
            <option value="All">All Categories</option>

            {categoryOptions.map(category => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-0">
          <label style={labelStyle}>Metal Type</label>

          <select
            value={metalFilter}
            onChange={e =>
              setMetalFilter(e.target.value)
            }
            style={inputStyle}
          >
            <option value="All">All Metal Types</option>

            {metalOptions.map(metal => (
              <option
                key={metal}
                value={metal}
              >
                {metal}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ERROR */}
      {!loading && loadError && (
        <div
          className="text-center"
          style={{
            backgroundColor: T.dangerSoft,
            borderRadius: '16px',
            padding: '32px 24px',
            border: `1px solid ${T.danger}`,
          }}
        >
          <AlertCircle
            size={24}
            color={T.danger}
            className="mx-auto mb-3"
          />

          <p
            style={{
              fontSize: '13px',
              color: T.danger,
              marginBottom: '14px',
            }}
          >
            {loadError}
          </p>

          <button
            onClick={() => void loadProducts(true)}
            style={{
              ...primaryButton,
              backgroundColor: T.danger,
              color: '#fff',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* PRODUCTS GRID */}
      {!loading && !loadError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
          <AnimatePresence>
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                featuredBusy={
                  featuredBusyId === product.id
                }
                onToggleFeatured={
                  handleToggleFeatured
                }
                onEdit={openEditModal}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteProduct}
              />
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div
              className="col-span-1 md:col-span-2 lg:col-span-3 text-center"
              style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '48px 24px',
                border: `1px solid ${T.ivoryShade}`,
              }}
            >
              <p
                style={{
                  fontSize: '13.5px',
                  color: T.muted,
                  marginBottom: '18px',
                }}
              >
                {hasActiveFilters
                  ? 'No products match your filters.'
                  : 'No products yet.'}
              </p>

              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  style={secondaryButton}
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={openAddModal}
                  style={primaryButton}
                >
                  <Plus size={16} />
                  Add Your First Product
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <ProductFormModal
        isOpen={
          addModalOpen || editProduct !== null
        }
        product={editProduct}
        prefill={prefill}
        apiCategories={apiCategories}
        apiMetalTypes={apiMetalTypes}
        onClose={closeModal}
        onSaved={handleSaved}
      />

      {/* DELETE CONFIRMATION */}
      {deleteProduct && (
        <div
          className="fixed inset-0 flex items-center justify-center p-lg"
          style={{
            backgroundColor: 'rgba(4,9,30,0.55)',
            zIndex: 100,
          }}
          onClick={() => {
            if (!deleting) setDeleteProduct(null);
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '420px',
              boxShadow:
                '0 24px 60px rgba(4,9,30,0.25)',
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: '20px 24px',
                borderBottom: `1px solid ${T.ivoryShade}`,
              }}
            >
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: '18px',
                  color: T.navy,
                }}
              >
                Delete Product
              </h2>

              <button
                onClick={() => setDeleteProduct(null)}
                disabled={deleting}
                style={secondaryButton}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <p
                style={{
                  fontSize: '13.5px',
                  color: T.muted,
                  lineHeight: 1.6,
                }}
              >
                Are you sure you want to delete{' '}
                <strong style={{ color: T.navy }}>
                  {deleteProduct.name}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>

            <div
              className="flex items-center justify-end gap-md"
              style={{
                padding: '16px 24px',
                borderTop: `1px solid ${T.ivoryShade}`,
              }}
            >
              <button
                onClick={() => setDeleteProduct(null)}
                disabled={deleting}
                style={secondaryButton}
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  void handleDelete(deleteProduct)
                }
                disabled={deleting}
                style={{
                  ...primaryButton,
                  color: '#fff',
                  backgroundColor: T.danger,
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? (
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                ) : (
                  <Trash2 size={14} />
                )}

                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PRODUCT CARD SKELETON
// ============================================================

function ProductCardSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: `1px solid ${T.ivoryShade}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          paddingBottom: '66%',
          backgroundColor: T.ivoryShade,
        }}
      />

      <div className="p-xl flex flex-col gap-lg">
        <div
          style={{
            height: '20px',
            width: '70%',
            backgroundColor: T.ivoryShade,
            borderRadius: '6px',
          }}
        />

        <div
          style={{
            height: '14px',
            width: '90%',
            backgroundColor: T.ivoryShade,
            borderRadius: '5px',
          }}
        />

        <div
          style={{
            height: '14px',
            width: '65%',
            backgroundColor: T.ivoryShade,
            borderRadius: '5px',
          }}
        />

        <div className="flex gap-sm">
          {[34, 65, 34, 65].map((width, i) => (
            <div
              key={i}
              style={{
                width,
                height: '34px',
                borderRadius: '9px',
                backgroundColor: T.ivoryShade,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT CARD
// ============================================================

type ProductCardProps = {
  product: Product;
  featuredBusy: boolean;
  onToggleFeatured: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDuplicate: (p: Product) => void;
  onDelete: (p: Product) => void;
};

function ProductCard({
  product,
  featuredBusy,
  onToggleFeatured,
  onEdit,
  onDuplicate,
  onDelete,
}: ProductCardProps) {
  const [activeImgIndex, setActiveImgIndex] =
    useState(0);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [];

  const safeIndex =
    images.length > 0
      ? Math.min(activeImgIndex, images.length - 1)
      : 0;

  function nextImage(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();

    if (images.length > 1) {
      setActiveImgIndex(prev =>
        (prev + 1) % images.length
      );
    }
  }

  function prevImage(e: MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();

    if (images.length > 1) {
      setActiveImgIndex(prev =>
        (prev - 1 + images.length) %
        images.length
      );
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        border: `1px solid ${T.ivoryShade}`,
        overflow: 'hidden',
      }}
    >
      {/* IMAGE */}
      <div
        className="relative group"
        style={{
          paddingBottom: '66%',
          backgroundColor: T.ivory,
        }}
      >
        {images.length > 0 ? (
          <img
            src={images[safeIndex]}
            alt={`${product.name} image ${safeIndex + 1}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ImagePlus
              size={34}
              color={T.goldSoft}
            />

            <span
              style={{
                color: T.muted,
                fontSize: '12px',
                marginTop: '8px',
              }}
            >
              No Image
            </span>
          </div>
        )}

        {/* IMAGE NAVIGATION */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/75"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full hover:bg-black/75"
            >
              <ChevronRight size={16} />
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-1 rounded-full">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() =>
                    setActiveImgIndex(index)
                  }
                  aria-label={`Show image ${index + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    safeIndex === index
                      ? 'bg-amber-400 w-3'
                      : 'bg-white/60 w-1.5'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* FEATURED BADGE */}
        {product.featured && (
          <div className="absolute top-md left-md">
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: T.navy,
                backgroundColor: T.gold,
                padding: '4px 10px',
                borderRadius: '999px',
              }}
            >
              ★ Featured
            </span>
          </div>
        )}

        {/* VIEWS */}
        <div className="absolute top-md right-md">
          <div
            className="flex items-center gap-xs"
            style={{
              backgroundColor: 'rgba(4,9,30,0.72)',
              borderRadius: '999px',
              padding: '4px 10px',
            }}
          >
            <Eye size={11} color={T.ivory} />

            <span
              style={{
                color: T.ivory,
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {product.views ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* CARD CONTENT */}
      <div className="p-xl flex flex-col gap-lg">
        <div>
          <p
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '16px',
              fontWeight: 500,
              color: T.navy,
            }}
          >
            {product.name}
          </p>

          <div className="flex items-center gap-xs mt-sm flex-wrap">
            {[
              product.category,
              product.metalType,
              product.purity,
            ].filter(Boolean).map((value, index) => (
              <span
                key={`${value}-${index}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: index === 0 ? T.navy : T.muted,
                  backgroundColor: T.ivory,
                  border: `1px solid ${T.ivoryShade}`,
                  padding: '3px 9px',
                  borderRadius: '999px',
                }}
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        <p
          className="line-clamp-2"
          style={{
            fontSize: '13px',
            color: T.muted,
            lineHeight: 1.5,
            minHeight: '38px',
          }}
        >
          {product.description || 'No description'}
        </p>

        {/* ACTION BUTTONS */}
        <div
          className="flex items-center gap-sm flex-wrap"
          style={{
            paddingTop: '12px',
            borderTop: `1px solid ${T.ivoryShade}`,
          }}
        >
          <button
            onClick={() => onToggleFeatured(product)}
            disabled={featuredBusy}
            title={
              product.featured
                ? 'Remove from featured'
                : 'Mark as featured'
            }
            style={{
              ...secondaryButton,
              width: '34px',
              height: '34px',
              padding: 0,
              backgroundColor: product.featured
                ? T.goldSoft
                : T.ivory,
            }}
          >
            {featuredBusy ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : (
              <Star
                size={15}
                color={
                  product.featured
                    ? T.navy
                    : T.muted
                }
                fill={
                  product.featured
                    ? T.navy
                    : 'none'
                }
              />
            )}
          </button>

          <button
            onClick={() => onEdit(product)}
            style={{
              ...secondaryButton,
              height: '34px',
            }}
          >
            <Edit size={13} />
            Edit
          </button>

          <button
            onClick={() => onDuplicate(product)}
            title="Duplicate"
            style={{
              ...secondaryButton,
              width: '34px',
              height: '34px',
              padding: 0,
            }}
          >
            <Copy size={14} />
          </button>

          <button
            onClick={() => onDelete(product)}
            className="ml-auto"
            style={{
              ...secondaryButton,
              height: '34px',
              backgroundColor: T.dangerSoft,
              color: T.danger,
              borderColor: T.dangerSoft,
            }}
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// NEW IMAGE PREVIEW WITH OBJECT URL CLEANUP
// ============================================================

function NewImagePreview({
  file,
  index,
  onRemove,
  disabled,
}: {
  file: File;
  index: number;
  onRemove: () => void;
  disabled: boolean;
}) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(file);

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div
      className="relative"
      style={{
        width: '80px',
        height: '80px',
        borderRadius: '10px',
        overflow: 'hidden',
        border: `1px solid ${T.gold}`,
        backgroundColor: '#fff',
        flexShrink: 0,
      }}
    >
      {previewUrl && (
        <img
          src={previewUrl}
          alt={`New upload ${index + 1}`}
          className="w-full h-full object-cover"
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        title="Remove image"
        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"
      >
        <X size={12} />
      </button>

      <div
        className="absolute bottom-0 inset-x-0 text-center"
        style={{
          backgroundColor: 'rgba(4,9,30,0.75)',
          color: '#fff',
          fontSize: '10px',
          padding: '4px 2px',
        }}
      >
        {(file.size / 1024).toFixed(1)} KB
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT FORM MODAL
// MAX 2 IMAGES, EACH <= 500 KB
// ============================================================

type ProductFormModalProps = {
  isOpen: boolean;
  product: Product | null;
  prefill: Partial<Product> | null;
  apiCategories: Option[];
  apiMetalTypes: Option[];
  onClose: () => void;
  onSaved: (p: Product, isNew: boolean) => void;
};

function ProductFormModal({
  isOpen,
  product,
  prefill,
  apiCategories,
  apiMetalTypes,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const defaultCategory =
    apiCategories[0]?.name ||
    CATEGORIES.find(c => c !== 'All') ||
    'Rings';

  const defaultMetalType =
    apiMetalTypes[0]?.name ||
    METAL_TYPES.find(m => m !== 'All') ||
    '22K Gold';

  const createInitialForm = (): Partial<Product> => ({
    name: '',
    category: defaultCategory,
    metalType: defaultMetalType,
    purity: '22K',
    weight: '',
    description: '',
    featured: false,
    displayOrder: 1,
    images: [],
    storeId: getCurrentStoreId() || '',
    storeName: '',
    storeLogo: '',
    views: 0,
  });

  const [form, setForm] = useState<Partial<Product>>(
    () => product ?? prefill ?? createInitialForm()
  );

  const [existingImages, setExistingImages] =
    useState<string[]>(
      product?.images || prefill?.images || []
    );

  const [imageFiles, setImageFiles] =
    useState<File[]>([]);

  const [saving, setSaving] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [imageError, setImageError] =
    useState<string | null>(null);

  // ----------------------------------------------------------
  // RESET MODAL
  // ----------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    const initialData =
      product ?? prefill ?? createInitialForm();

    setForm(initialData);
    setExistingImages(initialData.images || []);
    setImageFiles([]);
    setError(null);
    setImageError(null);
  }, [
    product,
    prefill,
    isOpen,
    defaultCategory,
    defaultMetalType,
  ]);

  // ----------------------------------------------------------
  // IMAGE LIMIT COUNTERS
  // ----------------------------------------------------------

  const totalImages =
    existingImages.length + imageFiles.length;

  const remainingSlots = Math.max(
    0,
    MAX_PRODUCT_IMAGES - totalImages
  );

  const imageLimitExceeded =
    totalImages > MAX_PRODUCT_IMAGES;

  // ----------------------------------------------------------
  // IMAGE VALIDATION
  // ----------------------------------------------------------

  function handleImageFileSelect(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const input = e.currentTarget;

    const selected = Array.from(
      input.files || []
    );

    // Reset to allow reselecting the same file.
    input.value = '';

    if (selected.length === 0) return;

    setImageError(null);

    if (remainingSlots <= 0) {
      setImageError(
        'Maximum 2 images are allowed per product. Remove an image before adding another.'
      );
      return;
    }

    const accepted: File[] = [];
    const errors: string[] = [];

    for (const file of selected) {
      // FILE TYPE
      if (!file.type.startsWith('image/')) {
        errors.push(
          `"${file.name}" is not an image file.`
        );
        continue;
      }

      // SIZE LIMIT: 500 KB
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        errors.push(
          `"${file.name}" is ${(file.size / 1024).toFixed(1)} KB. Image size must be less than or equal to 500 KB.`
        );
        continue;
      }

      // DUPLICATE FILE CHECK
      const duplicate = [
        ...imageFiles,
        ...accepted,
      ].some(
        existing =>
          existing.name === file.name &&
          existing.size === file.size &&
          existing.lastModified === file.lastModified
      );

      if (duplicate) {
        errors.push(
          `"${file.name}" is already selected.`
        );
        continue;
      }

      // COUNT LIMIT
      if (accepted.length >= remainingSlots) {
        errors.push(
          'Only 2 images are allowed per product. Extra images were not added.'
        );
        break;
      }

      accepted.push(file);
    }

    if (accepted.length > 0) {
      setImageFiles(prev => [
        ...prev,
        ...accepted,
      ]);
    }

    if (errors.length > 0) {
      setImageError(errors.join('\n'));
    }
  }

  // ----------------------------------------------------------
  // REMOVE IMAGES
  // ----------------------------------------------------------

  function removeExistingImage(index: number) {
    if (saving) return;

    setExistingImages(prev =>
      prev.filter((_, i) => i !== index)
    );

    setImageError(null);
  }

  function removeNewFile(index: number) {
    if (saving) return;

    setImageFiles(prev =>
      prev.filter((_, i) => i !== index)
    );

    setImageError(null);
  }

  // ----------------------------------------------------------
  // SAVE FORM
  // ----------------------------------------------------------

  async function handleSave() {
    if (saving) return;

    setError(null);
    setImageError(null);

    if (!form.name?.trim()) {
      setError('Product name is required.');
      return;
    }

    if (imageLimitExceeded) {
      setImageError(
        'Maximum 2 images are allowed per product. Remove extra images.'
      );
      return;
    }

    const oversized = imageFiles.find(
      file => file.size > MAX_IMAGE_SIZE_BYTES
    );

    if (oversized) {
      setImageError(
        `"${oversized.name}" exceeds the maximum size of 500 KB.`
      );
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();

      fd.append('name', form.name.trim());
      fd.append('category', form.category ?? '');
      fd.append('metalType', form.metalType ?? '');
      fd.append('purity', form.purity ?? '');
      fd.append('weight', form.weight ?? '');
      fd.append(
        'description',
        form.description ?? ''
      );
      fd.append(
        'featured',
        String(form.featured ?? false)
      );
      fd.append(
        'storeName',
        form.storeName ?? ''
      );

      // Preserve only remaining existing images.
      fd.append(
        'existingImages',
        JSON.stringify(existingImages)
      );

      // Append valid new files.
      imageFiles.forEach(file => {
        fd.append('images', file);
      });

      const isNew = !product;

      const saved = isNew
        ? await createProduct(fd)
        : await updateProduct(product.id, fd);

      onSaved(saved as Product, isNew);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save product.'
      );
    } finally {
      setSaving(false);
    }
  }

  // ----------------------------------------------------------
  // OPTIONS
  // ----------------------------------------------------------

  const categoryOptions = getUniqueOptions(
    CATEGORIES,
    apiCategories,
    form.category
  );

  const metalOptions = getUniqueOptions(
    METAL_TYPES,
    apiMetalTypes,
    form.metalType
  );

  const purityOptions = Array.from(
    new Set([
      ...PURITY_OPTIONS,
      ...(form.purity ? [form.purity] : []),
    ])
  );

  if (!isOpen) return null;

  // ----------------------------------------------------------
  // RENDER MODAL
  // ----------------------------------------------------------

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-lg"
      style={{
        backgroundColor: 'rgba(4,9,30,0.55)',
        zIndex: 100,
      }}
      onClick={() => {
        if (!saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          product ? 'Edit Product' : 'Add New Product'
        }
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: `1px solid ${T.ivoryShade}`,
          boxShadow:
            '0 24px 60px rgba(4,9,30,0.25)',
        }}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '22px 26px',
            borderBottom: `1px solid ${T.ivoryShade}`,
          }}
        >
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '20px',
              fontWeight: 500,
              color: T.navy,
            }}
          >
            {product
              ? 'Edit Product'
              : prefill
                ? 'Duplicate Product'
                : 'Add New Product'}
          </h2>

          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            style={secondaryButton}
          >
            <X size={16} />
          </button>
        </div>

        {/* FORM BODY */}
        <div
          className="flex flex-col gap-lg"
          style={{
            padding: '22px 26px',
          }}
        >
          {/* FORM ERROR */}
          {error && (
            <div
              role="alert"
              style={{
                backgroundColor: T.dangerSoft,
                border: `1px solid ${T.danger}`,
                borderRadius: '10px',
                padding: '12px',
                color: T.danger,
                fontSize: '12.5px',
              }}
            >
              {error}
            </div>
          )}

          {/* PRODUCT NAME */}
          <div>
            <label style={labelStyle}>
              Product Name
            </label>

            <input
              style={inputStyle}
              placeholder="e.g. Diamond Solitaire Ring"
              value={form.name ?? ''}
              disabled={saving}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
            />
          </div>

          {/* CATEGORY + METAL */}
          <div className="flex gap-lg flex-col sm:flex-row">
            <div className="flex-1">
              <label style={labelStyle}>
                Category
              </label>

              <select
                style={inputStyle}
                value={
                  form.category ?? defaultCategory
                }
                disabled={saving}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
              >
                {categoryOptions.map(category => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label style={labelStyle}>
                Metal Type
              </label>

              <select
                style={inputStyle}
                value={
                  form.metalType ?? defaultMetalType
                }
                disabled={saving}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    metalType: e.target.value,
                  }))
                }
              >
                {metalOptions.map(metal => (
                  <option
                    key={metal}
                    value={metal}
                  >
                    {metal}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PURITY + WEIGHT */}
          <div className="flex gap-lg flex-col sm:flex-row">
            <div className="flex-1">
              <label style={labelStyle}>
                Purity
              </label>

              <select
                style={inputStyle}
                value={form.purity ?? '22K'}
                disabled={saving}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    purity: e.target.value,
                  }))
                }
              >
                {purityOptions.map(purity => (
                  <option
                    key={purity}
                    value={purity}
                  >
                    {purity}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label style={labelStyle}>
                Weight (Optional)
              </label>

              <input
                style={inputStyle}
                placeholder="e.g. 4.2g"
                value={form.weight ?? ''}
                disabled={saving}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    weight: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label style={labelStyle}>
              Description
            </label>

            <textarea
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
              rows={3}
              placeholder="Describe the product..."
              value={form.description ?? ''}
              disabled={saving}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          {/* FEATURED CHECKBOX */}
          <label
            className="flex items-center gap-md"
            style={{
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={form.featured ?? false}
              disabled={saving}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  featured: e.target.checked,
                }))
              }
              style={{
                width: '16px',
                height: '16px',
                accentColor: T.gold,
              }}
            />

            <span
              style={{
                fontSize: '13.5px',
                color: T.navy,
              }}
            >
              Mark as Featured Product
            </span>
          </label>

          {/* IMAGE UPLOAD */}
          <div
            style={{
              backgroundColor: T.ivory,
              borderRadius: '12px',
              padding: '16px',
              border: `1px solid ${T.ivoryShade}`,
            }}
          >
            {/* IMAGE HEADER */}
            <div className="flex items-center justify-between gap-md flex-wrap">
              <div className="flex items-center gap-sm">
                <ImagePlus
                  size={17}
                  color={T.gold}
                />

                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: T.navy,
                  }}
                >
                  Product Images
                </span>
              </div>

              <span
                style={{
                  backgroundColor:
                    imageLimitExceeded
                      ? T.dangerSoft
                      : '#fff',
                  border: `1px solid ${
                    imageLimitExceeded
                      ? T.danger
                      : T.ivoryShade
                  }`,
                  color:
                    imageLimitExceeded
                      ? T.danger
                      : T.navy,
                  borderRadius: '999px',
                  padding: '5px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                {totalImages} / {MAX_PRODUCT_IMAGES} Images
              </span>
            </div>

            {/* UPLOAD REQUIREMENTS */}
            <div
              style={{
                marginTop: '12px',
                marginBottom: '14px',
                backgroundColor: '#fff8e6',
                border: '1px solid #ead9a6',
                borderRadius: '10px',
                padding: '11px 13px',
              }}
            >
              <div className="flex items-start gap-sm">
                <AlertCircle
                  size={17}
                  color="#8c641d"
                  style={{
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                />

                <div>
                  <p
                    style={{
                      color: '#8c641d',
                      fontSize: '12px',
                      fontWeight: 700,
                      marginBottom: '5px',
                    }}
                  >
                    Image Upload Requirements
                  </p>

                  <p
                    style={{
                      color: '#756340',
                      fontSize: '11.5px',
                      lineHeight: 1.7,
                    }}
                  >
                    Each image must be less than
                    or equal to 500 KB.
                  </p>

                  <p
                    style={{
                      color: '#756340',
                      fontSize: '11.5px',
                      lineHeight: 1.7,
                    }}
                  >
                    Maximum 2 images per product.
                  </p>
                </div>
              </div>
            </div>

            {/* IMAGE ERROR */}
            {imageError && (
              <div
                role="alert"
                style={{
                  backgroundColor: T.dangerSoft,
                  border: `1px solid ${T.danger}`,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  marginBottom: '12px',
                }}
              >
                <p
                  style={{
                    color: T.danger,
                    fontSize: '12px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {imageError}
                </p>
              </div>
            )}

            {/* PREVIEWS */}
            <div className="flex gap-md flex-wrap">
              {/* EXISTING IMAGES */}
              {existingImages.map((img, index) => (
                <div
                  key={`existing-${index}`}
                  className="relative"
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: `1px solid ${T.ivoryShade}`,
                    backgroundColor: '#fff',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={img}
                    alt={`Existing image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      removeExistingImage(index)
                    }
                    title="Remove image"
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>

                  <div
                    className="absolute bottom-0 inset-x-0 text-center"
                    style={{
                      backgroundColor:
                        'rgba(4,9,30,0.75)',
                      color: '#fff',
                      fontSize: '10px',
                      padding: '4px 2px',
                    }}
                  >
                    Existing
                  </div>
                </div>
              ))}

              {/* NEW FILES */}
              {imageFiles.map((file, index) => (
                <NewImagePreview
                  key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                  file={file}
                  index={index}
                  disabled={saving}
                  onRemove={() =>
                    removeNewFile(index)
                  }
                />
              ))}

              {/* ADD IMAGE BUTTON */}
              {remainingSlots > 0 && !saving && (
                <label
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '10px',
                    border: `2px dashed ${T.gold}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    color: T.muted,
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <Plus
                    size={20}
                    color={T.gold}
                  />

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                    }}
                  >
                    Add Image
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{
                      display: 'none',
                    }}
                    onChange={
                      handleImageFileSelect
                    }
                  />
                </label>
              )}
            </div>

            {/* IMAGE STATUS */}
            <p
              style={{
                fontSize: '11.5px',
                color:
                  imageLimitExceeded
                    ? T.danger
                    : T.muted,
                marginTop: '12px',
                lineHeight: 1.6,
              }}
            >
              {imageLimitExceeded
                ? 'Too many images. Remove extra images before saving.'
                : remainingSlots > 0
                  ? `You can upload ${remainingSlots} more image${
                      remainingSlots === 1
                        ? ''
                        : 's'
                    }. Maximum 500 KB per image.`
                  : 'Maximum 2 images reached. Remove an image to upload another.'}
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div
          className="flex items-center justify-end gap-md"
          style={{
            padding: '18px 26px',
            borderTop: `1px solid ${T.ivoryShade}`,
          }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            style={secondaryButton}
          >
            Cancel
          </button>

          <button
            onClick={() => void handleSave()}
            disabled={
              saving || imageLimitExceeded
            }
            style={{
              ...primaryButton,
              opacity:
                saving || imageLimitExceeded
                  ? 0.6
                  : 1,
              cursor:
                saving || imageLimitExceeded
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {saving && (
              <Loader2
                size={14}
                className="animate-spin"
              />
            )}

            {saving
              ? 'Saving…'
              : product
                ? 'Update Product'
                : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
