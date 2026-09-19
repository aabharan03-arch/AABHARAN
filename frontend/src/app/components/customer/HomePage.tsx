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

const COVER_PHOTOS_API = `${API_BASE_URL}/api/admin/store-imgs?type=COVER_PHOTO`;

interface CoverPhotoApiItem {
  id: string;
  img: string;
  type: 'COVER_PHOTO';
  expiryDate?: string | null;
  storeAdminId?: string | null;
  storeId?: string | null;
  displayOrder?: number | null;
  isActive?: boolean;
}

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  storeId: string | null;
  fromApi: boolean;
}

const getDummyHeroSlides = (): HeroSlide[] =>
  HERO_SLIDES.map((slide, index) => ({
    id: `dummy-${index}`,
    image: slide.image,
    title: slide.title,
    subtitle: slide.subtitle,
    cta: slide.cta,
    storeId: null,
    fromApi: false,
  }));

function isUsableCoverPhoto(
  item: CoverPhotoApiItem
): item is CoverPhotoApiItem & { img: string } {
  if (!item || typeof item.img !== 'string' || !item.img.trim()) {
    return false;
  }

  if (item.isActive === false) {
    return false;
  }

  if (item.expiryDate) {
    const expiryTime = new Date(item.expiryDate).getTime();

    if (!Number.isNaN(expiryTime) && expiryTime < Date.now()) {
      return false;
    }
  }

  return true;
}

export function HomePage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(getDummyHeroSlides());
  const [isLoadingCoverPhotos, setIsLoadingCoverPhotos] = useState(true);

  const [bannerIndex, setBannerIndex] = useState(0);
  const [enquiryProduct, setEnquiryProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // API State - Stores
  const [stores, setStores] = useState<ProcessedStore[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState<boolean>(true);

  // API State - Products
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // Fetch COVER_PHOTO images for the home hero.
  //
  // Rules:
  // 1. API returns 0 usable images -> use the existing 3 HERO_SLIDES.
  // 2. API returns at least 1 usable image -> use ONLY API images.
  // 3. API images link to their respective store using storeId.
  useEffect(() => {
    let cancelled = false;

    async function fetchCoverPhotos() {
      setIsLoadingCoverPhotos(true);

      try {
        const response = await fetch(COVER_PHOTOS_API, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error(`Cover photo API returned ${response.status}`);
        }

        const json = await response.json();

        const rawImages: CoverPhotoApiItem[] =
          json?.success && Array.isArray(json?.images) ? json.images : [];

        const apiImages = rawImages
          .filter(isUsableCoverPhoto)
          .sort((a, b) => {
            const aOrder =
              typeof a.displayOrder === 'number'
                ? a.displayOrder
                : Number.MAX_SAFE_INTEGER;

            const bOrder =
              typeof b.displayOrder === 'number'
                ? b.displayOrder
                : Number.MAX_SAFE_INTEGER;

            return aOrder - bOrder;
          });

        if (cancelled) return;

        if (apiImages.length === 0) {
          console.log('🖼️ [COVER_PHOTOS] No cover photos found. Using 3 dummy hero slides.');
          setHeroSlides(getDummyHeroSlides());
          setHeroIndex(0);
          return;
        }

        const apiHeroSlides: HeroSlide[] = apiImages.map((image) => ({
          id: image.id,
          image: image.img.trim(),
          title: '',
          subtitle: '',
          cta: '',
          storeId: image.storeId ?? null,
          fromApi: true,
        }));

        console.log(
          `🖼️ [COVER_PHOTOS] Loaded ${apiHeroSlides.length} API cover photo(s).`
        );

        setHeroSlides(apiHeroSlides);
        setHeroIndex(0);
      } catch (error) {
        console.error('❌ [COVER_PHOTOS] Failed to fetch cover photos:', error);

        if (!cancelled) {
          // Safe fallback: keep the 3 existing dummy images when the API fails.
          setHeroSlides(getDummyHeroSlides());
          setHeroIndex(0);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCoverPhotos(false);
        }
      }
    }

    fetchCoverPhotos();

    return () => {
      cancelled = true;
    };
  }, []);

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
    // No reason to run the timer when only one API cover photo exists.
    if (heroSlides.length <= 1) return;

    const t = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(t);
  }, [heroSlides.length]);

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
      <div
        className="
          relative
          overflow-hidden
          group
          bg-[#04091E]
          h-[230px]
          xs:h-[260px]
          sm:h-[330px]
          md:h-[430px]
          lg:h-[520px]
          xl:h-[560px]
        "
      >
        {!isLoadingCoverPhotos && heroSlides.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={heroSlides[heroIndex]?.id ?? heroIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              {heroSlides[heroIndex]?.fromApi ? (
                heroSlides[heroIndex]?.storeId ? (
                  <Link
                    to={`/stores/${heroSlides[heroIndex].storeId}`}
                    className="absolute inset-0 block cursor-pointer"
                    aria-label="Open store"
                  >
                    <img
                      src={heroSlides[heroIndex].image}
                      alt="Store cover"
                      className="
                        block
                        w-full
                        h-full
                        object-cover
                        object-center
                        select-none
                      "
                      loading={heroIndex === 0 ? 'eager' : 'lazy'}
                      draggable={false}
                    />
                  </Link>
                ) : (
                  <img
                    src={heroSlides[heroIndex].image}
                    alt="Store cover"
                    className="
                      block
                      w-full
                      h-full
                      object-cover
                      object-center
                      select-none
                    "
                    loading={heroIndex === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                  />
                )
              ) : (
                <>
                  {/* Existing dummy hero slide */}
                  <img
                    src={heroSlides[heroIndex].image}
                    alt={heroSlides[heroIndex].title}
                    className="w-full h-full object-cover object-center"
                    loading="eager"
                    draggable={false}
                  />

                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to right, rgba(4,9,30,0.82) 0%, rgba(4,9,30,0.48) 45%, rgba(4,9,30,0.10) 78%, transparent 100%)',
                    }}
                  />

                  <div className="absolute inset-0 flex items-center">
                    <div
                      className="
                        w-full
                        max-w-7xl
                        mx-auto
                        px-5
                        sm:px-8
                        md:px-12
                        lg:px-16
                      "
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.16, duration: 0.55 }}
                        className="
                          max-w-[82%]
                          sm:max-w-md
                          md:max-w-lg
                          flex
                          flex-col
                          gap-2
                          sm:gap-3
                          md:gap-4
                        "
                      >
                        <h1
                          className="
                            font-bold
                            text-white
                            tracking-tight
                            text-2xl
                            sm:text-3xl
                            md:text-4xl
                            lg:text-[44px]
                            leading-[1.12]
                            sm:leading-[1.15]
                          "
                        >
                          {heroSlides[heroIndex].title}
                        </h1>

                        <p
                          className="
                            text-white/90
                            text-xs
                            sm:text-sm
                            md:text-base
                            lg:text-lg
                            line-clamp-2
                          "
                        >
                          {heroSlides[heroIndex].subtitle}
                        </p>

                        <div
                          className="
                            flex
                            flex-wrap
                            gap-2
                            sm:gap-3
                            mt-1
                            sm:mt-2
                          "
                        >
                          <Link
                            to="/stores"
                            className="
                              inline-flex
                              items-center
                              justify-center
                              gap-1.5
                              sm:gap-2
                              px-3.5
                              py-2
                              sm:px-5
                              sm:py-2.5
                              md:px-6
                              md:py-3
                              bg-white
                              text-[#04091e]
                              text-xs
                              sm:text-sm
                              md:text-base
                              font-bold
                              rounded-md
                              sm:rounded-lg
                              shadow-lg
                              hover:shadow-xl
                              hover:bg-gray-100
                              transition-all
                              cursor-pointer
                            "
                          >
                            {heroSlides[heroIndex].cta}
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Link>

                          <Link
                            to="/stores"
                            className="
                              inline-flex
                              items-center
                              justify-center
                              px-3.5
                              py-2
                              sm:px-5
                              sm:py-2.5
                              md:px-6
                              md:py-3
                              bg-white/10
                              border
                              border-white/30
                              text-white
                              text-xs
                              sm:text-sm
                              md:text-base
                              font-semibold
                              rounded-md
                              sm:rounded-lg
                              hover:bg-white/20
                              backdrop-blur-sm
                              transition-all
                              cursor-pointer
                            "
                          >
                            Browse Stores
                          </Link>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Small loading placeholder while checking COVER_PHOTO API */}
        {isLoadingCoverPhotos && (
          <div className="absolute inset-0 bg-[#04091E] animate-pulse" />
        )}

        {/* Navigation is useful only when there is more than one slide */}
        {!isLoadingCoverPhotos && heroSlides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() =>
                setHeroIndex(
                  (i) => (i - 1 + heroSlides.length) % heroSlides.length
                )
              }
              aria-label="Previous cover"
              className="
                absolute
                left-2
                sm:left-4
                md:left-8
                top-1/2
                -translate-y-1/2
                z-20
                w-8
                h-8
                sm:w-10
                sm:h-10
                md:w-12
                md:h-12
                rounded-full
                bg-black/35
                border
                border-white/20
                backdrop-blur-md
                flex
                items-center
                justify-center
                hover:bg-black/55
                sm:hover:scale-105
                transition-all
                text-white
                cursor-pointer
              "
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>

            <button
              type="button"
              onClick={() =>
                setHeroIndex((i) => (i + 1) % heroSlides.length)
              }
              aria-label="Next cover"
              className="
                absolute
                right-2
                sm:right-4
                md:right-8
                top-1/2
                -translate-y-1/2
                z-20
                w-8
                h-8
                sm:w-10
                sm:h-10
                md:w-12
                md:h-12
                rounded-full
                bg-black/35
                border
                border-white/20
                backdrop-blur-md
                flex
                items-center
                justify-center
                hover:bg-black/55
                sm:hover:scale-105
                transition-all
                text-white
                cursor-pointer
              "
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </button>

            <div
              className="
                absolute
                bottom-2.5
                sm:bottom-4
                md:bottom-6
                left-1/2
                -translate-x-1/2
                z-20
                flex
                items-center
                gap-1.5
                sm:gap-2
                px-2.5
                py-2
                sm:px-3
                rounded-full
                bg-black/30
                backdrop-blur-sm
              "
            >
              {heroSlides.map((slide, i) => (
                <button
                  type="button"
                  key={slide.id}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`Show cover ${i + 1}`}
                  className={`rounded-full transition-all cursor-pointer ${
                    i === heroIndex
                      ? 'w-5 sm:w-7 h-2 bg-white'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
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