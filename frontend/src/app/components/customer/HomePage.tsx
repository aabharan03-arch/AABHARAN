import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

import { HERO_SLIDES, PROMOTIONAL_BANNERS } from '../data/mockData';
import { EnquiryModal } from '../shared/EnquiryModal';
import { PromoPopup } from './Promopopup ';

import { ProcessedStore, Product, StoreAdminApiItem } from '../../../types/home';
import { FeaturedStores } from '../../components/FeaturedStores';
import { ProductSection } from '../../components/Productssection';
import { NearbyStoresBanner } from '../../components/NearbyStoresBanner';
import { PromoOffersSlider } from '../../components/PromoOffersSlider';
import { API_BASE_URL } from '../../lib/api';

const STORES_CACHE_KEY = 'aabharan_stores_cache';
const PRODUCTS_CACHE_KEY = 'aabharan_products_cache';
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes cache duration

export function HomePage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [enquiryProduct, setEnquiryProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // API State - Stores
  const [stores, setStores] = useState<ProcessedStore[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(true);

  // API State - Products
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // Fetch and Cache Stores
  useEffect(() => {
    async function fetchStores() {
      console.log('🏬 [STORES] Starting store fetch process...');
      setIsLoadingStores(true);

      try {
        const cachedData = localStorage.getItem(STORES_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const ageInMs = Date.now() - timestamp;
          const isFresh = ageInMs < CACHE_EXPIRY_MS;

          if (isFresh && Array.isArray(data) && data.length > 0) {
            setStores(data);
            setIsLoadingStores(false);
            return;
          }
        }
      } catch (err) {
        console.warn('⚠️ [STORES] Failed to parse cached stores:', err);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/store/all`);
        const json = await response.json();

        if (json.success && Array.isArray(json.storeAdmins)) {
          const formattedStores: ProcessedStore[] = json.storeAdmins
            .filter((admin: StoreAdminApiItem) => admin.store !== null)
            .map((admin: StoreAdminApiItem) => {
              const store = admin.store!;
              const mainBranchCity = store.branches?.[0]?.city;

              return {
                id: store.id,
                name: store.name,
                logo: store.logo,
                coverBanner: store.coverBanner,
                about: store.about,
                branches: store.branches || [],
                city: mainBranchCity
                  ? mainBranchCity.charAt(0).toUpperCase() + mainBranchCity.slice(1)
                  : 'Main Branch',
              };
            });

          setStores(formattedStores);
          localStorage.setItem(
            STORES_CACHE_KEY,
            JSON.stringify({ data: formattedStores, timestamp: Date.now() })
          );
        } else {
          setStores([]);
        }
      } catch (error) {
        console.error('❌ [STORES] Error fetching store details:', error);
        setStores([]);
      } finally {
        setIsLoadingStores(false);
      }
    }

    fetchStores();
  }, []);

  // Fetch and Cache Products
  useEffect(() => {
    async function fetchProducts() {
      console.log('💎 [PRODUCTS] Starting product fetch process...');
      setIsLoadingProducts(true);

      try {
        const cachedData = localStorage.getItem(PRODUCTS_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const ageInMs = Date.now() - timestamp;
          const isFresh = ageInMs < CACHE_EXPIRY_MS;

          if (isFresh && Array.isArray(data) && data.length > 0) {
            setProducts(data);
            setIsLoadingProducts(false);
            return;
          }
        }
      } catch (err) {
        console.warn('⚠️ [PRODUCTS] Failed to parse cached products:', err);
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/customer/products/all`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const json = await response.json();
        if (json.success && Array.isArray(json.products)) {
          setProducts(json.products);
          localStorage.setItem(
            PRODUCTS_CACHE_KEY,
            JSON.stringify({ data: json.products, timestamp: Date.now() })
          );
        } else if (Array.isArray(json)) {
          setProducts(json);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('❌ [PRODUCTS] Fetch failed with error:', error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    }

    fetchProducts();
  }, []);

  // Slideshow Timers
  useEffect(() => {
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setBannerIndex((i) => (i + 1) % PROMOTIONAL_BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-[#f9f7ee] min-h-screen" style={{ fontFamily: 'var(--font-family-sans)' }}>
      {/* Promotional Popup */}
      <PromoPopup
        imageUrl="/images/gift-box.jpg"
        eyebrow="FREE"
        title="GIFT BOX"
        subtitle="Shop For ₹1200+ and Get"
        highlightedText="FREE Gift Box"
        note="Worth ₹299"
        ctaText="Shop Now"
        ctaLink="/products"
      />

      {/* Top Banner Carousel */}
      <div className="relative overflow-hidden h-14 bg-[#04091e] shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={bannerIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center gap-lg px-xl"
          >
            <span className="text-label-sm text-white font-medium tracking-wide">
              {PROMOTIONAL_BANNERS[bannerIndex].title}
            </span>
            <span className="text-video-title text-white/70">·</span>
            <span className="text-label-sm text-white/90">
              {PROMOTIONAL_BANNERS[bannerIndex].subtitle}
            </span>
            <button className="ml-md text-video-title text-white font-medium underline hover:text-gray-300 transition-colors cursor-pointer">
              {PROMOTIONAL_BANNERS[bannerIndex].cta}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Hero Slider */}
      <div className="relative overflow-hidden group bg-[#04091E]" style={{ height: '560px' }}>
        <AnimatePresence>
          <motion.div
            key={heroIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <img
              src={HERO_SLIDES[heroIndex].image}
              alt={HERO_SLIDES[heroIndex].title}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, rgba(4,9,30,0.8) 0%, rgba(4,9,30,0.4) 50%, transparent 100%)',
              }}
            />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-12 md:px-2xl w-full">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="max-w-lg flex flex-col gap-lg"
                >
                  <h1
                    className="text-title font-bold text-white tracking-tight"
                    style={{ fontSize: '44px', lineHeight: '1.2' }}
                  >
                    {HERO_SLIDES[heroIndex].title}
                  </h1>
                  <p className="text-label text-white/90 text-lg">
                    {HERO_SLIDES[heroIndex].subtitle}
                  </p>
                  <div className="flex gap-md mt-2">
                    <Link
                      to="/stores"
                      className="flex items-center gap-2 px-6 py-3 bg-white text-[#04091e] font-bold rounded-lg shadow-lg hover:shadow-xl hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      {HERO_SLIDES[heroIndex].cta} <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/stores"
                      className="inline-flex items-center justify-center px-6 py-3 bg-white/10 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/20 backdrop-blur-sm transition-all cursor-pointer"
                    >
                      Browse Stores
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={() =>
            setHeroIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
          }
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 border border-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all text-white cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={() => setHeroIndex((i) => (i + 1) % HERO_SLIDES.length)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 border border-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all text-white cursor-pointer"
        >
          <ChevronRight size={24} />
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3 p-3 rounded-full bg-black/30 backdrop-blur-sm">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`transition-all rounded-full cursor-pointer ${i === heroIndex
                  ? 'w-8 h-2.5 bg-white'
                  : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Featured Stores Component */}
      <FeaturedStores stores={stores} isLoading={isLoadingStores} />

      {/* Promotional Stores Offer Slider */}
      <PromoOffersSlider />

      {/* Products Component */}
      <ProductSection
        products={products}
        isLoading={isLoadingProducts}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onEnquire={(prod) => setEnquiryProduct(prod)}
      />

      {/* Nearby Stores Component */}
      <NearbyStoresBanner />

      {/* Enquiry Modal */}
      <EnquiryModal
        product={enquiryProduct}
        isOpen={enquiryProduct !== null}
        onClose={() => setEnquiryProduct(null)}
      />
    </div>
  );
}