import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router';

export interface StoreImageAPI {
  id: string;
  img: string;
  type: 'COVER_PHOTO' | 'FIRST_PHOTO' | 'ADVERTISE_PHOTO';
  expiryDate: string | null;
  storeAdminId: string;
  storeId: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function PromoOffersSlider() {
  const [images, setImages] = useState<StoreImageAPI[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAdvertiseImages() {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/admin/store-imgs?type=ADVERTISE_PHOTO');
        const data = await response.json();

        if (data.success && Array.isArray(data.images)) {
          // Filter exclusively for active ADVERTISE_PHOTO items
          const filtered = data.images.filter(
            (item: StoreImageAPI) => item.type === 'ADVERTISE_PHOTO' && item.isActive
          );
          setImages(filtered);
        } else {
          setImages([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch advertisement images:', err);
        setError('Could not load advertisement images.');
      } finally {
        setLoading(false);
      }
    }

    fetchAdvertiseImages();
  }, []);

  // Automatic slide rotation if multiple images exist
  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [images.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  if (loading) {
    return (
      <section className="py-8 bg-[#f9f7ee]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[250px] sm:h-[350px] lg:h-[420px] bg-slate-900/5 rounded-3xl flex items-center justify-center border border-slate-200">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        </div>
      </section>
    );
  }

  if (error || images.length === 0) {
    return null;
  }

  const currentImg = images[currentIndex];

  return (
    <section className="py-8 bg-[#f9f7ee]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Carousel Container */}
        <div className="relative overflow-hidden rounded-3xl shadow-xl h-[250px] sm:h-[350px] lg:h-[420px] w-full group bg-black/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImg.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <Link 
                to={currentImg.storeId ? `/stores/${currentImg.storeId}` : '/stores'} 
                className="block w-full h-full"
              >
                <img
                  src={currentImg.img}
                  alt="Store Advertisement"
                  className="w-full h-full object-cover object-center"
                />
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 border border-white/20 text-white backdrop-blur-md shadow-lg opacity-0 group-hover:opacity-100 hover:bg-black/50 hover:scale-110 transition-all duration-300 cursor-pointer flex items-center justify-center"
                aria-label="Previous Image"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/30 border border-white/20 text-white backdrop-blur-md shadow-lg opacity-0 group-hover:opacity-100 hover:bg-black/50 hover:scale-110 transition-all duration-300 cursor-pointer flex items-center justify-center"
                aria-label="Next Image"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Pagination Indicators */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all rounded-full cursor-pointer ${
                    idx === currentIndex
                      ? 'w-6 h-2 bg-white'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}