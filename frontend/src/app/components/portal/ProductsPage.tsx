import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Edit, Trash2, Copy, Star, Eye, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORIES, METAL_TYPES } from '../data/mockData';
import type { Product } from '../data/mockData';
import { fetchProducts, createProduct, updateProduct, deleteProduct as deleteProductApi, getCurrentStoreId, fetchCategories, fetchMetalTypes } from '../../lib/api';

const PURITY_OPTIONS = ['22K', '24K', '18K', '925 Sterling Silver', 'PT950', 'PT900'];

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

// Key template for caching in local storage
const CACHE_KEY_PREFIX = 'products_cache_store_';

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // API-fetched categories and metal types
  const [apiCategories, setApiCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [apiMetalTypes, setApiMetalTypes] = useState<Array<{ id: string; name: string }>>([]);

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [metalFilter, setMetalFilter] = useState('All');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [prefill, setPrefill] = useState<Partial<Product> | null>(null);

  const loadProducts = useCallback(async (ignoreCache = false) => {
    setLoading(true);
    setLoadError(null);
    const storeId = getCurrentStoreId();
    
    if (!storeId) {
      setLoadError('Not logged in — no store admin session found.');
      setLoading(false);
      return;
    }

    const cacheKey = `${CACHE_KEY_PREFIX}${storeId}`;

    // 1. Check LocalStorage first if ignoreCache is false
    if (!ignoreCache) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached);
          setProducts(parsedCache);
          setLoading(false);
          // Still fetch categories and metal types in background
          try {
            const cats = await fetchCategories();
            setApiCategories(cats);
          } catch (err) {
            console.error('Failed to fetch categories:', err);
          }
          try {
            const metals = await fetchMetalTypes();
            setApiMetalTypes(metals);
          } catch (err) {
            console.error('Failed to fetch metal types:', err);
          }
          return; // Skip main API call if cache hit
        } catch {
          localStorage.removeItem(cacheKey);
        }
      }
    }

    // 2. Fetch from API if no cache or cache ignored
    try {
      const [data, cats, metals] = await Promise.all([
        fetchProducts(storeId),
        fetchCategories(),
        fetchMetalTypes(),
      ]);
      const productList = data as Product[];
      setProducts(productList);
      setApiCategories(cats);
      setApiMetalTypes(metals);
      // Save data locally
      localStorage.setItem(cacheKey, JSON.stringify(productList));
    } catch (err: any) {
      setLoadError(err.message ?? 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Sync state changes with localStorage cache to keep local cache fresh
  const updateProductsAndCache = (newProducts: Product[] | ((prev: Product[]) => Product[])) => {
    setProducts((prev) => {
      const updated = typeof newProducts === 'function' ? newProducts(prev) : newProducts;
      const storeId = getCurrentStoreId();
      if (storeId) {
        localStorage.setItem(`${CACHE_KEY_PREFIX}${storeId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Memoize filtered results so we don't recalculate unless dependencies change
  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchesQuery = !query || p.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
      const matchesMetal = metalFilter === 'All' || p.metalType === metalFilter;
      return matchesQuery && matchesCategory && matchesMetal;
    });
  }, [products, query, categoryFilter, metalFilter]);

  const hasActiveFilters = query || categoryFilter !== 'All' || metalFilter !== 'All';

  function clearFilters() {
    setQuery('');
    setCategoryFilter('All');
    setMetalFilter('All');
  }

  async function handleDelete(product: Product) {
    try {
      await deleteProductApi(product.id);
      updateProductsAndCache(ps => ps.filter(p => p.id !== product.id));
    } catch (err: any) {
      alert(err.message ?? 'Failed to delete product.');
    } finally {
      setDeleteProduct(null);
    }
  }

  function handleDuplicate(product: Product) {
    setEditProduct(null);
    setAddModalOpen(true);
    setPrefill({ ...product, id: undefined, name: `${product.name} (Copy)`, featured: false } as any);
  }

  async function handleToggleFeatured(product: Product) {
    const nextFeatured = !product.featured;
    updateProductsAndCache(ps => ps.map(p => p.id === product.id ? { ...p, featured: nextFeatured } : p));
    try {
      const fd = new FormData();
      fd.append('featured', String(nextFeatured));
      fd.append('existingImages', JSON.stringify(product.images || []));
      await updateProduct(product.id, fd);
    } catch (err: any) {
      updateProductsAndCache(ps => ps.map(p => p.id === product.id ? { ...p, featured: product.featured } : p));
      alert(err.message ?? 'Failed to update featured status.');
    }
  }

  return (
    <div className="flex flex-col gap-xl" style={{ fontFamily: 'Inter, var(--font-family-sans)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
      `}</style>

      {/* Header */}
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
          <div style={{ width: '40px', height: '2px', backgroundColor: T.gold, marginTop: '12px', marginBottom: '10px' }} />
          <p style={{ color: T.muted, fontSize: '13px' }}>
            {loading
              ? 'Loading products…'
              : `${filtered.length} of ${products.length} products${hasActiveFilters ? ' · filtered' : ' in your catalogue'}`}
          </p>
        </div>
        <button
          onClick={() => { setPrefill(null); setAddModalOpen(true); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: T.navy,
            color: T.gold,
            border: 'none',
            borderRadius: '10px',
            padding: '11px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div
        style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: `1px solid ${T.ivoryShade}` }}
        className="flex flex-col gap-lg"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-lg">
          <div className="relative flex-shrink-0 w-full md:w-[240px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" color={T.muted} />
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-corner-md focus:outline-none"
              style={{
                fontFamily: 'Inter, var(--font-family-sans)',
                backgroundColor: T.ivory,
                border: `1px solid ${T.ivoryShade}`,
                color: T.navy,
                paddingLeft: '34px',
                paddingRight: '14px',
                height: '38px',
                fontSize: '13px',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = T.gold)}
              onBlur={e => (e.currentTarget.style.borderColor = T.ivoryShade)}
            />
          </div>

          <div style={{ width: '1px', alignSelf: 'stretch', backgroundColor: T.ivoryShade }} className="hidden md:block" />

          {/* Category filter */}
          <div className="flex flex-col gap-xs flex-1 min-w-0">
            <span style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.muted }}>
              Category
            </span>
            <div className="flex gap-xs flex-wrap">
              {(() => {
                const apiCatNames = apiCategories.map(c => c.name);
                const defaultCats = CATEGORIES.filter(c => c !== 'All');
                const combined = Array.from(new Set([...defaultCats, ...apiCatNames]));
                return ['All', ...combined].map(cat => {
                const active = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className="whitespace-nowrap transition-all"
                    style={{
                      fontFamily: 'Inter, var(--font-family-sans)',
                      backgroundColor: active ? T.navy : T.ivory,
                      color: active ? T.gold : T.muted,
                      border: `1px solid ${active ? T.navy : T.ivoryShade}`,
                      borderRadius: '999px',
                      padding: '6px 13px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {cat}
                  </button>
                );
              })})}
            </div>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: T.ivoryShade }} />

        <div className="flex flex-col md:flex-row md:items-center gap-lg">
          {/* Metal type filter */}
          <div className="flex flex-col gap-xs flex-1 min-w-0">
            <span style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.muted }}>
              Metal Type
            </span>
            <div className="flex gap-xs flex-wrap">
              {(() => {
                const apiMetalNames = apiMetalTypes.map(m => m.name);
                const defaultMetals = METAL_TYPES.filter(m => m !== 'All');
                const combined = Array.from(new Set([...defaultMetals, ...apiMetalNames]));
                return ['All', ...combined].map(metal => {
                const active = metalFilter === metal;
                return (
                  <button
                    key={metal}
                    onClick={() => setMetalFilter(metal)}
                    className="whitespace-nowrap transition-all"
                    style={{
                      fontFamily: 'Inter, var(--font-family-sans)',
                      backgroundColor: active ? T.navy : T.ivory,
                      color: active ? T.gold : T.muted,
                      border: `1px solid ${active ? T.navy : T.ivoryShade}`,
                      borderRadius: '999px',
                      padding: '6px 13px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {metal}
                  </button>
                );
              })})}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex-shrink-0 flex items-center gap-xs"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: T.danger,
                backgroundColor: T.dangerSoft,
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: 'pointer',
              }}
            >
              <X size={13} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Skeleton Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && loadError && (
        <div
          className="text-center"
          style={{ backgroundColor: T.dangerSoft, borderRadius: '16px', padding: '32px 24px', border: `1px solid ${T.danger}` }}
        >
          <p style={{ fontSize: '13.5px', color: T.danger, marginBottom: '14px' }}>{loadError}</p>
          <button
            onClick={() => loadProducts(true)}
            style={{
              fontSize: '13px', fontWeight: 600, color: '#fff', backgroundColor: T.danger,
              border: 'none', borderRadius: '10px', padding: '9px 18px', cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !loadError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
          <AnimatePresence>
            {filtered.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onToggleFeatured={handleToggleFeatured}
                onEdit={p => { setPrefill(null); setEditProduct(p); }}
                onDuplicate={handleDuplicate}
                onDelete={p => setDeleteProduct(p)}
              />
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div
              className="col-span-1 md:col-span-2 lg:col-span-3 text-center"
              style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '48px 24px', border: `1px solid ${T.ivoryShade}` }}
            >
              <p style={{ fontSize: '13.5px', color: T.muted, marginBottom: '18px' }}>
                {hasActiveFilters ? 'No products match your filters.' : 'No products yet.'}
              </p>
              {hasActiveFilters ? (
                <button
                  onClick={clearFilters}
                  style={{
                    fontSize: '13px', fontWeight: 600, color: T.navy, backgroundColor: T.ivory,
                    border: `1px solid ${T.ivoryShade}`, borderRadius: '10px', padding: '10px 20px', cursor: 'pointer',
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  onClick={() => { setPrefill(null); setAddModalOpen(true); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    fontSize: '13px', fontWeight: 600, color: T.gold, backgroundColor: T.navy,
                    border: 'none', borderRadius: '10px', padding: '11px 20px', cursor: 'pointer',
                  }}
                >
                  <Plus size={16} /> Add Your First Product
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <ProductFormModal
        isOpen={addModalOpen || editProduct !== null}
        product={editProduct}
        prefill={prefill}
        apiCategories={apiCategories}
        apiMetalTypes={apiMetalTypes}
        onClose={() => { setAddModalOpen(false); setEditProduct(null); setPrefill(null); }}
        onSaved={(saved, isNew) => {
          if (isNew) {
            updateProductsAndCache(ps => [saved, ...ps]);
          } else {
            updateProductsAndCache(ps => ps.map(p => p.id === saved.id ? saved : p));
          }
          setAddModalOpen(false);
          setEditProduct(null);
          setPrefill(null);
        }}
      />

      {/* Delete Confirm Modal */}
      {deleteProduct && (
        <div
          className="fixed inset-0 flex items-center justify-center p-lg"
          style={{ backgroundColor: 'rgba(4, 9, 30, 0.55)', zIndex: 100 }}
          onClick={() => setDeleteProduct(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '420px',
              border: `1px solid ${T.ivoryShade}`, boxShadow: '0 24px 60px rgba(4, 9, 30, 0.25)',
            }}
          >
            <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: `1px solid ${T.ivoryShade}` }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 500, color: T.navy }}>Delete Product</h2>
              <button
                onClick={() => setDeleteProduct(null)}
                aria-label="Close"
                style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: T.ivory, border: 'none', cursor: 'pointer' }}
              >
                <X size={15} color={T.navy} />
              </button>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: '13.5px', color: T.muted, lineHeight: 1.6 }}>
                Are you sure you want to delete <strong style={{ color: T.navy, fontWeight: 600 }}>{deleteProduct.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-md" style={{ padding: '16px 24px', borderTop: `1px solid ${T.ivoryShade}` }}>
              <button
                onClick={() => setDeleteProduct(null)}
                style={{ fontSize: '13px', fontWeight: 500, color: T.navy, backgroundColor: '#fff', border: `1px solid ${T.ivoryShade}`, borderRadius: '10px', padding: '10px 18px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteProduct)}
                style={{ fontSize: '13px', fontWeight: 600, color: '#fff', backgroundColor: T.danger, border: 'none', borderRadius: '10px', padding: '10px 18px', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loading Card Component
// ---------------------------------------------------------------------------
function ProductCardSkeleton() {
  return (
    <div
      className="animate-pulse"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        border: `1px solid ${T.ivoryShade}`,
        overflow: 'hidden',
      }}
    >
      {/* Image Skeleton */}
      <div style={{ paddingBottom: '66%', backgroundColor: T.ivoryShade, position: 'relative' }} />

      <div className="p-xl flex flex-col gap-lg">
        {/* Title and tags skeleton */}
        <div>
          <div style={{ height: '20px', backgroundColor: T.ivoryShade, borderRadius: '6px', width: '70%', marginBottom: '8px' }} />
          <div className="flex items-center gap-xs mt-sm">
            <div style={{ height: '20px', width: '50px', backgroundColor: T.ivoryShade, borderRadius: '999px' }} />
            <div style={{ height: '20px', width: '60px', backgroundColor: T.ivoryShade, borderRadius: '999px' }} />
            <div style={{ height: '20px', width: '40px', backgroundColor: T.ivoryShade, borderRadius: '999px' }} />
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="flex flex-col gap-xs">
          <div style={{ height: '14px', backgroundColor: T.ivoryShade, borderRadius: '4px', width: '100%' }} />
          <div style={{ height: '14px', backgroundColor: T.ivoryShade, borderRadius: '4px', width: '80%' }} />
        </div>

        {/* Actions Skeleton */}
        <div className="flex items-center gap-sm" style={{ paddingTop: '12px', borderTop: `1px solid ${T.ivoryShade}` }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: T.ivoryShade }} />
          <div style={{ width: '60px', height: '34px', borderRadius: '9px', backgroundColor: T.ivoryShade }} />
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: T.ivoryShade }} />
          <div style={{ width: '70px', height: '34px', borderRadius: '9px', backgroundColor: T.ivoryShade, marginLeft: 'auto' }} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Card Component with Multi-Photo Gallery Support
// ---------------------------------------------------------------------------
function ProductCard({
  product,
  onToggleFeatured,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  product: Product;
  onToggleFeatured: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDuplicate: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const images = product.images && product.images.length > 0 ? product.images : ['/placeholder.jpg'];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: `1px solid ${T.ivoryShade}`, overflow: 'hidden' }}
    >
      <div className="relative group" style={{ paddingBottom: '66%' }}>
        <img
          src={images[activeImgIndex]}
          alt={`${product.name} image ${activeImgIndex + 1}`}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
        />

        {/* Multi-Image Controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/75"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/75"
            >
              <ChevronRight size={16} />
            </button>
            
            {/* Dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-1 rounded-full">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIndex(idx);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    activeImgIndex === idx ? 'bg-amber-400 w-3' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {product.featured && (
          <div className="absolute top-md left-md">
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
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
        <div className="absolute top-md right-md">
          <div
            className="flex items-center gap-xs"
            style={{ backgroundColor: 'rgba(4,9,30,0.72)', borderRadius: '999px', padding: '4px 10px' }}
          >
            <Eye size={11} color={T.ivory} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: T.ivory }}>{product.views}</span>
          </div>
        </div>
      </div>

      <div className="p-xl flex flex-col gap-lg">
        <div>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 500, color: T.navy }}>{product.name}</p>
          <div className="flex items-center gap-xs mt-sm flex-wrap">
            <span style={{ fontSize: '11px', fontWeight: 600, color: T.navy, backgroundColor: T.ivory, border: `1px solid ${T.ivoryShade}`, padding: '3px 9px', borderRadius: '999px' }}>
              {product.category}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: T.muted, backgroundColor: T.ivory, border: `1px solid ${T.ivoryShade}`, padding: '3px 9px', borderRadius: '999px' }}>
              {product.metalType}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: T.muted, backgroundColor: T.ivory, border: `1px solid ${T.ivoryShade}`, padding: '3px 9px', borderRadius: '999px' }}>
              {product.purity}
            </span>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: T.muted, lineHeight: 1.5 }} className="line-clamp-2">{product.description}</p>

        {/* Actions */}
        <div className="flex items-center gap-sm" style={{ paddingTop: '12px', borderTop: `1px solid ${T.ivoryShade}` }}>
          <button
            onClick={() => onToggleFeatured(product)}
            title={product.featured ? 'Remove from featured' : 'Mark as featured'}
            className="flex items-center justify-center transition-colors"
            style={{
              width: '34px', height: '34px', borderRadius: '9px',
              backgroundColor: product.featured ? T.goldSoft : T.ivory,
              border: `1px solid ${product.featured ? T.gold : T.ivoryShade}`,
            }}
          >
            <Star size={15} color={product.featured ? T.navy : T.muted} fill={product.featured ? T.navy : 'none'} />
          </button>

          <button
            onClick={() => onEdit(product)}
            className="flex items-center gap-xs transition-colors"
            style={{
              height: '34px', borderRadius: '9px', padding: '0 12px',
              backgroundColor: T.ivory, border: `1px solid ${T.ivoryShade}`,
              fontSize: '12px', fontWeight: 600, color: T.navy,
            }}
          >
            <Edit size={13} /> Edit
          </button>

          <button
            onClick={() => onDuplicate(product)}
            title="Duplicate"
            className="flex items-center justify-center transition-colors"
            style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: T.ivory, border: `1px solid ${T.ivoryShade}` }}
          >
            <Copy size={14} color={T.muted} />
          </button>

          <button
            onClick={() => onDelete(product)}
            className="flex items-center gap-xs transition-colors ml-auto"
            style={{
              height: '34px', borderRadius: '9px', padding: '0 12px',
              backgroundColor: T.dangerSoft, border: `1px solid ${T.dangerSoft}`,
              fontSize: '12px', fontWeight: 600, color: T.danger,
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Product Form Modal Component (Multiple Image Upload Support)
// ---------------------------------------------------------------------------
function ProductFormModal({ isOpen, product, prefill, apiCategories, apiMetalTypes, onClose, onSaved }: {
  isOpen: boolean;
  product: Product | null;
  prefill: Partial<Product> | null;
  apiCategories: Array<{ id: string; name: string }>;
  apiMetalTypes: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: (p: Product, isNew: boolean) => void;
}) {
  // Use first API category/metal as default, fallback to hardcoded defaults
  const defaultCategory = apiCategories.length > 0 ? apiCategories[0].name : 'Rings';
  const defaultMetalType = apiMetalTypes.length > 0 ? apiMetalTypes[0].name : '22K Gold';

  const initial = product ?? prefill ?? {
    name: '', category: defaultCategory, metalType: defaultMetalType, purity: '22K', weight: '', description: '', featured: false, displayOrder: 1,
    images: [],
    storeId: CURRENT_STORE_ID_FALLBACK, storeName: 'Tanishq', storeLogo: '', views: 0,
  };

  const [form, setForm] = useState<Partial<Product>>(initial);
  const [existingImages, setExistingImages] = useState<string[]>(initial.images || []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-sync form when switching between add / edit / duplicate-prefill
  useEffect(() => {
    const currentData = product ?? prefill ?? {
      name: '', category: defaultCategory, metalType: defaultMetalType, purity: '22K', weight: '', description: '', featured: false, displayOrder: 1,
      images: [],
      storeId: CURRENT_STORE_ID_FALLBACK, storeName: 'Tanishq', storeLogo: '', views: 0,
    };
    setForm(currentData);
    setExistingImages(currentData.images || []);
    setImageFiles([]);
    setError(null);
  }, [product, prefill, isOpen, defaultCategory, defaultMetalType]);

  // Append newly picked files without overwriting existing selection
  function handleImageFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...selected]);
    }
  }

  // Remove individual pre-existing image
  function removeExistingImage(index: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  }

  // Remove individual staged new file
  function removeNewFile(index: number) {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!form.name) return;
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('name', form.name ?? '');
      fd.append('category', form.category ?? '');
      fd.append('metalType', form.metalType ?? '');
      fd.append('purity', form.purity ?? '');
      fd.append('weight', form.weight ?? '');
      fd.append('description', form.description ?? '');
      fd.append('featured', String(form.featured ?? false));
      fd.append('storeName', form.storeName ?? 'Tanishq');

      // Send list of remaining pre-existing image URLs
      fd.append('existingImages', JSON.stringify(existingImages));

      // Append each newly selected file
      imageFiles.forEach(file => fd.append('images', file));

      const isNew = !product;
      const saved = isNew
        ? await createProduct(fd)
        : await updateProduct(product!.id, fd);

      onSaved(saved as Product, isNew);
    } catch (err: any) {
      setError(err.message ?? 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    fontFamily: 'Inter, var(--font-family-sans)',
    backgroundColor: T.ivory,
    border: `1px solid ${T.ivoryShade}`,
    color: T.navy,
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '13.5px',
    width: '100%',
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = { fontSize: '12px', fontWeight: 600, color: T.muted, marginBottom: '6px', display: 'block' };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-lg"
      style={{ backgroundColor: 'rgba(4, 9, 30, 0.55)', zIndex: 100 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
          border: `1px solid ${T.ivoryShade}`, boxShadow: '0 24px 60px rgba(4, 9, 30, 0.25)',
        }}
      >
        <div className="flex items-center justify-between" style={{ padding: '22px 26px', borderBottom: `1px solid ${T.ivoryShade}` }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 500, color: T.navy }}>
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'flex', items: 'center', justifyContent: 'center', backgroundColor: T.ivory, border: 'none', cursor: 'pointer' }}
          >
            <X size={16} color={T.navy} />
          </button>
        </div>

        <div className="flex flex-col gap-lg" style={{ padding: '22px 26px', fontFamily: 'Inter, var(--font-family-sans)' }}>
          {error && (
            <div style={{ backgroundColor: T.dangerSoft, border: `1px solid ${T.danger}`, borderRadius: '10px', padding: '10px 14px' }}>
              <p style={{ fontSize: '12.5px', color: T.danger }}>{error}</p>
            </div>
          )}

          <div>
            <label style={labelStyle}>Product Name</label>
            <input style={inputStyle} placeholder="e.g. Diamond Solitaire Ring" value={form.name ?? ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="flex gap-lg flex-col sm:flex-row">
            <div className="flex-1">
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category ?? defaultCategory} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {(() => {
                  const apiCatNames = apiCategories.map(c => c.name);
                  const defaultCats = CATEGORIES.filter(c => c !== 'All');
                  return Array.from(new Set([...defaultCats, ...apiCatNames])).map(c => <option key={c} value={c}>{c}</option>);
                })()}
              </select>
            </div>
            <div className="flex-1">
              <label style={labelStyle}>Metal Type</label>
              <select style={inputStyle} value={form.metalType ?? defaultMetalType} onChange={e => setForm(f => ({ ...f, metalType: e.target.value }))}>
                {(() => {
                  const apiMetalNames = apiMetalTypes.map(m => m.name);
                  const defaultMetals = METAL_TYPES.filter(m => m !== 'All');
                  return Array.from(new Set([...defaultMetals, ...apiMetalNames])).map(m => <option key={m} value={m}>{m}</option>);
                })()}
              </select>
            </div>
          </div>

          <div className="flex gap-lg flex-col sm:flex-row">
            <div className="flex-1">
              <label style={labelStyle}>Purity</label>
              <select style={inputStyle} value={form.purity ?? '22K'} onChange={e => setForm(f => ({ ...f, purity: e.target.value }))}>
                {PURITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label style={labelStyle}>Weight (Optional)</label>
              <input style={inputStyle} placeholder="e.g. 4.2g" value={form.weight ?? ''} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical' }}
              rows={3}
              placeholder="Describe the product..."
              value={form.description ?? ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <label className="flex items-center gap-md" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.featured ?? false}
              onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
              style={{ width: '16px', height: '16px', accentColor: T.gold }}
            />
            <span style={{ fontSize: '13.5px', color: T.navy }}>Mark as Featured Product</span>
          </label>

          {/* Multi-Photo Upload & Preview Container */}
          <div style={{ backgroundColor: T.ivory, borderRadius: '12px', padding: '16px', border: `1px solid ${T.ivoryShade}` }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: T.muted, marginBottom: '10px' }}>Product Images</p>
            <div className="flex gap-md flex-wrap">
              {/* Existing Uploaded Images */}
              {existingImages.map((img, i) => (
                <div key={`existing-${i}`} className="relative group" style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${T.ivoryShade}`, flexShrink: 0 }}>
                  <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Newly Picked Files */}
              {imageFiles.map((file, i) => (
                <div key={`new-${i}`} className="relative group" style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${T.gold}`, flexShrink: 0 }}>
                  <img src={URL.createObjectURL(file)} alt={`New upload ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewFile(i)}
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* File Input Picker */}
              <input
                type="file"
                accept="image/*"
                multiple
                id="product-image-input"
                style={{ display: 'none' }}
                onChange={handleImageFileSelect}
              />
              <label
                htmlFor="product-image-input"
                style={{
                  width: '64px', height: '64px', borderRadius: '10px', border: `2px dashed ${T.ivoryShade}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, backgroundColor: '#fff', cursor: 'pointer',
                }}
              >
                <Plus size={18} />
              </label>
            </div>
            <p style={{ fontSize: '11.5px', color: T.muted, marginTop: '10px' }}>
              Select multiple photos. You can delete or add more before saving.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-md" style={{ padding: '18px 26px', borderTop: `1px solid ${T.ivoryShade}` }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ fontSize: '13px', fontWeight: 500, color: T.navy, backgroundColor: '#fff', border: `1px solid ${T.ivoryShade}`, borderRadius: '10px', padding: '10px 18px', cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              fontSize: '13px', fontWeight: 600, color: T.gold, backgroundColor: T.navy, border: 'none', borderRadius: '10px', padding: '10px 20px',
              cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: saving ? 0.7 : 1,
            }}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

const CURRENT_STORE_ID_FALLBACK = '1';