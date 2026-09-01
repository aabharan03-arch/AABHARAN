import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Store as StoreIcon,
  Tag,
  Layers,
  Weight,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { EnquiryModal } from '../shared/EnquiryModal';
import { API_BASE_URL } from '../../lib/api';

// --- TYPE DEFINITIONS ---

export interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
}

export interface Store {
  id: string;
  name: string;
  logo: string;
  coverBanner?: string;
  about?: string;
  branches?: Branch[];
}

export interface ProcessedStore {
  id: string;
  storeAdminId?: string;
  name: string;
  logo: string;
  city: string;
  coverBanner?: string;
  about?: string;
  branches?: Branch[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  metalType: string;
  purity?: string;
  weight?: string;
  description: string;
  featured: boolean;
  displayOrder?: number;
  images: string[];
  views?: number;
  storeId?: string;
  storeName?: string | null;
  storeLogo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// --- CACHE KEYS AND EXPIRY ---
const PRODUCTS_CACHE_KEY = 'aabharan_products_cache';
const STORES_CACHE_KEY = 'aabharan_stores_cache';
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes cache duration

// --- Wishlist API helpers (same pattern as ProductSection) ---
function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchWishlistIds(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/customer/wishlist`, {
      headers: { ...authHeaders() },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.productIds ?? []) as string[];
  } catch {
    return [];
  }
}

async function toggleWishlist(productId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/api/customer/wishlist/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ productId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to update wishlist (${res.status})`);
  }
  const data = await res.json();
  return data.liked as boolean;
}
// -----------------------------------------------------------------

export function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  // Loading and State
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<ProcessedStore[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeImg, setActiveImg] = useState<number>(0);
  const [enquiryOpen, setEnquiryOpen] = useState<boolean>(false);

  // Wishlist state — real "saved" status backed by the API, plus an
  // in-flight flag so the heart button can show a spinner and can't
  // be double-clicked into two overlapping requests.
  const [saved, setSaved] = useState<boolean>(false);
  const [wishlistBusy, setWishlistBusy] = useState<boolean>(false);

  // Reset image view index when route/productId changes
  useEffect(() => {
    setActiveImg(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  // Fetch Products & Stores (Cache-First, then API)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      let fetchedProducts: Product[] = [];
      let fetchedStores: ProcessedStore[] = [];

      // 1. Load Products from Cache or API
      try {
        const cachedProdData = localStorage.getItem(PRODUCTS_CACHE_KEY);
        if (cachedProdData) {
          const { data, timestamp } = JSON.parse(cachedProdData);
          if (Date.now() - timestamp < CACHE_EXPIRY_MS && Array.isArray(data) && data.length > 0) {
            fetchedProducts = data;
          }
        }

        if (fetchedProducts.length === 0) {
          const res = await fetch(`${API_BASE_URL}/api/customer/products/all`);
          if (res.ok) {
            const json = await res.json();
            const prodList = json.success && Array.isArray(json.products) ? json.products : Array.isArray(json) ? json : [];
            fetchedProducts = prodList;
            if (prodList.length > 0) {
              localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ data: prodList, timestamp: Date.now() }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      }

      // 2. Load Stores from Cache or API
      try {
        const cachedStoreData = localStorage.getItem(STORES_CACHE_KEY);
        if (cachedStoreData) {
          const { data, timestamp } = JSON.parse(cachedStoreData);
          if (Date.now() - timestamp < CACHE_EXPIRY_MS && Array.isArray(data) && data.length > 0) {
            fetchedStores = data;
          }
        }

        if (fetchedStores.length === 0) {
          const res = await fetch(`${API_BASE_URL}/api/admin/store/all`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.storeAdmins)) {
              const formatted: ProcessedStore[] = json.storeAdmins
                .filter((admin: any) => admin.store !== null)
                .map((admin: any) => {
                  const s = admin.store;
                  const mainBranchCity = s.branches?.[0]?.city;
                  return {
                    id: s.id,
                    storeAdminId: admin.id,
                    name: s.name,
                    logo: s.logo,
                    coverBanner: s.coverBanner,
                    about: s.about,
                    branches: s.branches || [],
                    city: mainBranchCity
                      ? mainBranchCity.charAt(0).toUpperCase() + mainBranchCity.slice(1)
                      : 'Main Branch',
                  };
                });
              fetchedStores = formatted;
              if (formatted.length > 0) {
                localStorage.setItem(STORES_CACHE_KEY, JSON.stringify({ data: formatted, timestamp: Date.now() }));
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load stores:', err);
      }

      setProducts(fetchedProducts);
      setStores(fetchedStores);
      setIsLoading(false);
    }

    loadData();
  }, []);

  // --- MEMOIZED DATA CALCULATIONS ---
  const memoizedProducts = useMemo(() => products, [products]);
  const memoizedStores = useMemo(() => stores, [stores]);

  const product = useMemo(
    () => memoizedProducts.find((p) => String(p.id) === String(productId)),
    [memoizedProducts, productId]
  );

  const store = useMemo(() => {
    if (!product) return undefined;
    return memoizedStores.find(
      (s) =>
        String(s.id) === String(product.storeId) ||
        String(s.storeAdminId ?? '') === String(product.storeId)
    );
  }, [memoizedStores, product]);

  const storeRouteId = store?.id ?? product?.storeId;

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return memoizedProducts
      .filter(
        (p) =>
          String(p.id) !== String(product.id) &&
          (p.category === product.category || String(p.storeId) === String(product.storeId))
      )
      .slice(0, 4);
  }, [memoizedProducts, product]);

  const productImages = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return product.images;
    }
    return ['https://via.placeholder.com/600?text=No+Image+Available'];
  }, [product]);

  // --- Fetch wishlist status once we know which product we're viewing ---
  useEffect(() => {
    if (!product) return;

    let cancelled = false;
    fetchWishlistIds().then((ids) => {
      if (!cancelled) {
        setSaved(ids.includes(String(product.id)));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  const handleToggleSaved = async () => {
    if (!product || wishlistBusy) return;

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/auth');
      return;
    }

    const previousSaved = saved;
    setWishlistBusy(true);
    setSaved(!previousSaved); // optimistic flip

    try {
      const liked = await toggleWishlist(String(product.id));
      setSaved(liked); // reconcile with server truth
    } catch (err) {
      console.error('Failed to update wishlist:', err);
      setSaved(previousSaved); // revert on failure
    } finally {
      setWishlistBusy(false);
    }
  };

  // --- SKELETON LOADING STATE ---
  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  // --- NOT FOUND STATE ---
  if (!product) {
    return (
      <div className="bg-[#f9f7ee] min-h-screen flex items-center justify-center p-6" style={{ fontFamily: 'var(--font-family-sans)' }}>
        <div className="text-center bg-white p-12 rounded-[24px] shadow-sm border border-gray-200 max-w-md w-full">
          <h2 className="text-2xl font-bold text-[#04091e]">Product Not Found</h2>
          <p className="text-gray-500 text-sm mt-2">
            The product you are looking for might have been removed or is temporarily unavailable.
          </p>
          <button
            className="mt-6 w-full px-6 py-3.5 bg-[#04091e] text-white font-bold rounded-xl shadow-md hover:bg-[#04091e]/90 transition-all cursor-pointer"
            onClick={() => navigate('/stores')}
          >
            Explore Stores
          </button>
        </div>
      </div>
    );
  }

  const storeDisplayName = product.storeName || store?.name || 'Jewellery Partner';
  const storeLogo = store?.logo || product.storeLogo || 'https://via.placeholder.com/150?text=Store';

  return (
    <div className="bg-[#f9f7ee] min-h-screen pb-24" style={{ fontFamily: 'var(--font-family-sans)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center flex-wrap gap-2 mb-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
          <Link to="/" className="hover:text-[#04091e] transition-colors">
            Home
          </Link>
          <ChevronRight size={14} />
          <Link to="/stores" className="hover:text-[#04091e] transition-colors">
            Stores
          </Link>
          <ChevronRight size={14} />
          {store && (
            <>
              <Link to={`/stores/${store.id}`} className="hover:text-[#04091e] transition-colors">
                {store.name}
              </Link>
              <ChevronRight size={14} />
            </>
          )}
          <span className="text-[#04091e] truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Main Gallery */}
          <div className="flex flex-col gap-6">
            <div className="relative bg-white rounded-[32px] overflow-hidden border border-gray-200 shadow-sm aspect-square p-2 group">
              <div className="w-full h-full rounded-[24px] overflow-hidden relative bg-[#f9f7ee]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeImg}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    src={productImages[activeImg]}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/600?text=Jewellery';
                    }}
                  />
                </AnimatePresence>

                {/* Navigation Arrows */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setActiveImg((i) => (i - 1 + productImages.length) % productImages.length)
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-md text-[#04091e] opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={() => setActiveImg((i) => (i + 1) % productImages.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white hover:scale-105 transition-all shadow-md text-[#04091e] opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Image Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-24 h-24 rounded-2xl overflow-hidden border-[3px] transition-all flex-shrink-0 cursor-pointer ${
                      i === activeImg
                        ? 'border-[#04091e] shadow-md scale-105'
                        : 'border-transparent hover:border-gray-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`View ${i + 1}`}
                      className="w-full h-full object-cover bg-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/150?text=Jewellery';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Column */}
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-[32px] p-8 md:p-10 flex flex-col gap-8 shadow-sm border border-gray-200">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-6">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-[#04091e] leading-tight">
                    {product.name}
                  </h1>
                  <button
                    onClick={handleToggleSaved}
                    disabled={wishlistBusy}
                    aria-label={saved ? 'Remove from liked products' : 'Save to liked products'}
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${
                      saved
                        ? 'bg-red-50 border-red-200 text-red-500'
                        : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-[#04091e]'
                    }`}
                  >
                    {wishlistBusy ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <Heart size={20} className={saved ? 'fill-red-500' : ''} />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-6 flex-wrap">
                  {product.featured && (
                    <span className="px-4 py-1.5 bg-[#04091e] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-sm">
                      Featured
                    </span>
                  )}
                  <span className="px-4 py-1.5 bg-[#f9f7ee] text-[#04091e] text-xs font-bold uppercase tracking-widest rounded-full border border-[#04091e]/10">
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Layers size={18} />, label: 'Metal Type', value: product.metalType },
                  { icon: <Tag size={18} />, label: 'Purity', value: product.purity },
                  { icon: <StoreIcon size={18} />, label: 'Category', value: product.category },
                  ...(product.weight
                    ? [{ icon: <Weight size={18} />, label: 'Weight', value: product.weight }]
                    : []),
                ].map((spec) => (
                  <div
                    key={spec.label}
                    className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2 text-gray-400 text-[11px] font-bold uppercase tracking-widest">
                      {spec.icon}
                      <span>{spec.label}</span>
                    </div>
                    <p className="text-[#04091e] font-extrabold text-lg">{spec.value || 'N/A'}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Description
                </h3>
                <p className="text-gray-600 leading-relaxed text-base whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setEnquiryOpen(true)}
                  className="flex-1 py-4 bg-[#04091e] text-white text-base font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-[#04091e]/90 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle size={20} /> Enquire Now
                </button>
                {storeRouteId && (
                  <button
                    onClick={() => navigate(`/stores/${storeRouteId}`)}
                    className="flex-1 py-4 bg-white border-2 border-gray-200 text-[#04091e] text-base font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center cursor-pointer"
                  >
                    View Store Details
                  </button>
                )}
              </div>
            </div>

            {/* Store Information Card */}
            <div className="bg-white rounded-[24px] p-6 md:p-8 border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Sold By
              </h3>
              {storeRouteId ? (
                <Link to={`/stores/${storeRouteId}`} className="flex items-center gap-6 group block">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm flex-shrink-0 group-hover:border-[#04091e]/30 transition-colors p-0.5 bg-white">
                    <img
                      src={storeLogo}
                      alt={storeDisplayName}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/150?text=Store';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-extrabold text-[#04091e] group-hover:text-blue-700 transition-colors truncate">
                      {store?.name || storeDisplayName}
                    </p>
                    <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-wider">
                      {(store?.city || 'Main Branch')} · {(store?.branches?.length || 0) || 0} Branch
                      {((store?.branches?.length || 0) !== 1 ? 'es' : '')}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#04091e] group-hover:bg-[#04091e] group-hover:text-white transition-colors flex-shrink-0">
                    <ChevronRight size={20} />
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                    <StoreIcon size={20} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#04091e]">{storeDisplayName}</p>
                    <p className="text-xs text-gray-400">Verified Jewellery Partner</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h2 className="text-3xl font-extrabold text-[#04091e]">You Might Also Like</h2>
              {storeRouteId && (
                <button
                  onClick={() => navigate(`/stores/${storeRouteId}`)}
                  className="text-[#04091e] font-bold text-sm hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View more from this store <ArrowRight size={16} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {relatedProducts.map((p) => (
                <RelatedProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <EnquiryModal product={product} isOpen={enquiryOpen} onClose={() => setEnquiryOpen(false)} />
    </div>
  );
}

// --- RELATED PRODUCT CARD COMPONENT ---
function RelatedProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white rounded-[24px] overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col cursor-pointer"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <div className="relative h-[280px] overflow-hidden bg-[#f9f7ee] flex-shrink-0">
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300?text=Jewellery'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Jewellery';
          }}
        />
        {product.featured && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3.5 py-1.5 bg-[#04091e] text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-md">
              Featured
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1 gap-2">
        <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
          {product.storeName || 'Jewellery Partner'}
        </p>
        <h3 className="text-lg font-extrabold text-[#04091e] leading-snug line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
            {product.category}
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
            {product.metalType}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// --- SKELETON COMPONENT ---
function ProductDetailSkeleton() {
  return (
    <div className="bg-[#f9f7ee] min-h-screen pb-24" style={{ fontFamily: 'var(--font-family-sans)' }}>
      <div className="max-w-7xl mx-auto px-6 py-12 animate-pulse">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 bg-gray-200 rounded-md w-1/4 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery Skeleton */}
          <div className="flex flex-col gap-6">
            <div className="bg-gray-200 rounded-[32px] aspect-square w-full" />
            <div className="flex gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-24 h-24 rounded-2xl bg-gray-200 flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="flex flex-col gap-8">
            <div className="bg-white rounded-[32px] p-8 md:p-10 flex flex-col gap-8 border border-gray-200">
              <div className="flex flex-col gap-4">
                <div className="h-8 bg-gray-200 rounded-lg w-3/4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded-full w-20" />
                  <div className="h-6 bg-gray-200 rounded-full w-24" />
                </div>
              </div>

              {/* Specs Skeleton */}
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl p-5 h-20" />
                ))}
              </div>

              {/* Description Skeleton */}
              <div className="flex flex-col gap-2">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-1" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>

              {/* Buttons Skeleton */}
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <div className="flex-1 h-14 bg-gray-200 rounded-xl" />
                <div className="flex-1 h-14 bg-gray-200 rounded-xl" />
              </div>
            </div>

            {/* Store Card Skeleton */}
            <div className="bg-white rounded-[24px] p-6 border border-gray-200 flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}