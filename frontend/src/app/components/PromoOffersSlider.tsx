import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles, Tag, ArrowRight, Clock } from 'lucide-react';

export interface OfferSlide {
  id: string;
  storeName: string;
  storeLogo?: string;
  title: string;
  highlightText: string;
  description: string;
  badge: string;
  validity: string;
  bgGradient: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export const PROMO_OFFERS: OfferSlide[] = [
  {
    id: '1',
    storeName: 'Tanishq Jewellery',
    title: 'Silver Elegance Fest',
    highlightText: 'FLAT 50% OFF',
    description: 'On making charges of handcrafted silver bangles & authentic silverware.',
    badge: 'Limited Time Deal',
    validity: 'Ends in 2 Days',
    bgGradient: 'from-[#0f172a] via-[#1e293b] to-[#04091e]',
    image: 'https://images.unsplash.com/photo-1611591475143-4f8a77a83d34?q=80&w=1200&auto=format&fit=crop',
    ctaText: 'Claim Offer',
    ctaLink: '/stores',
  },
  {
    id: '2',
    storeName: 'Kalyan Jewellers',
    title: 'Royal Bridal Collection',
    highlightText: 'UP TO 30% OFF',
    description: 'Exclusive gold necklace sets and zero making charges on diamond solitaires.',
    badge: 'Festive Special',
    validity: 'Valid Till Month End',
    bgGradient: 'from-[#2a0813] via-[#4a0e22] to-[#04091e]',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop',
    ctaText: 'Explore Collection',
    ctaLink: '/stores',
  },
  {
    id: '3',
    storeName: 'Malabar Gold & Diamonds',
    title: 'Diamond Sparkle Days',
    highlightText: 'BUY 1 GET 1',
    description: 'Get a free diamond pendant on select diamond ring purchases.',
    badge: 'Trending Now',
    validity: 'Limited Stock',
    bgGradient: 'from-[#1a1400] via-[#382d00] to-[#04091e]',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop',
    ctaText: 'View Diamonds',
    ctaLink: '/stores',
  },
  {
    id: '4',
    storeName: 'CaratLane',
    title: 'Everyday Fine Jewellery',
    highlightText: 'FLAT 25% OFF',
    description: 'Modern 14kt gold bracelets, sleek chains, and daily-wear diamond studs.',
    badge: 'Online & In-Store',
    validity: 'Ends Sunday',
    bgGradient: 'from-[#002626] via-[#004d40] to-[#04091e]',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=1200&auto=format&fit=crop',
    ctaText: 'Shop Dailywear',
    ctaLink: '/stores',
  },
  {
    id: '5',
    storeName: 'PC Chandra Jewellers',
    title: 'Heritage Craftsmanship',
    highlightText: '0% MAKING CHARGES',
    description: 'On traditional gold bangles and antique handcrafted bridal chokers.',
    badge: 'Exclusive Outlet Deal',
    validity: '4 Days Left',
    bgGradient: 'from-[#1c0a27] via-[#341549] to-[#04091e]',
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop',
    ctaText: 'Locate Showroom',
    ctaLink: '/nearby-stores',
  },
  {
    id: '6',
    storeName: 'Bhima Jewels',
    title: 'Pure Platinum Carnival',
    highlightText: 'SAVE RS. 5000',
    description: 'Instant discount per 10g on certified platinum couple bands.',
    badge: 'Couple Special',
    validity: 'Valid This Week',
    bgGradient: 'from-[#0b1329] via-[#1c2a4f] to-[#04091e]',
    image: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=1200&auto=format&fit=crop',
    ctaText: 'Grab Discount',
    ctaLink: '/stores',
  },
];

export function PromoOffersSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMO_OFFERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const currentOffer = PROMO_OFFERS[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + PROMO_OFFERS.length) % PROMO_OFFERS.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % PROMO_OFFERS.length);
  };

  return (
    <section className="py-12 bg-[#f9f7ee]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header (Arrows removed from here) */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#04091e] tracking-tight">
            Exclusive Store Offers
          </h2>
        </div>

        {/* Carousel Card with 'group' class for hover targeting */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl min-h-[420px] lg:min-h-[380px] group">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentOffer.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`absolute inset-0 bg-gradient-to-r ${currentOffer.bgGradient} p-8 sm:p-10 lg:p-12 flex flex-col justify-between text-white`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full relative z-10">
                
                {/* Text Content */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Store Name Tag & Badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-amber-400 text-[#04091e] text-xs font-black uppercase tracking-wider rounded-full shadow-sm">
                      {currentOffer.storeName}
                    </span>
                    <span className="px-3 py-1 bg-white/10 border border-white/20 text-white text-xs font-semibold rounded-full backdrop-blur-md flex items-center gap-1.5">
                      <Tag size={12} className="text-amber-300" />
                      {currentOffer.badge}
                    </span>
                    <span className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-medium rounded-full border border-rose-500/30 flex items-center gap-1">
                      <Clock size={12} />
                      {currentOffer.validity}
                    </span>
                  </div>

                  {/* Offer Heading */}
                  <div>
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-amber-300 tracking-tight leading-tight">
                      {currentOffer.highlightText}
                    </h3>
                    <h4 className="text-xl sm:text-2xl font-bold text-white mt-1">
                      {currentOffer.title}
                    </h4>
                  </div>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed">
                    {currentOffer.description}
                  </p>

                  {/* Action CTA */}
                  <div className="pt-2">
                    <a
                      href={currentOffer.ctaLink}
                      className="inline-flex items-center gap-3 bg-white text-[#04091e] font-bold text-sm px-7 py-3.5 rounded-2xl shadow-lg hover:bg-amber-100 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>{currentOffer.ctaText}</span>
                      <ArrowRight size={16} />
                    </a>
                  </div>
                </div>

                {/* Right Image Banner Accent */}
                <div className="lg:col-span-5 relative h-48 lg:h-full min-h-[220px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 hidden sm:block">
                  <img
                    src={currentOffer.image}
                    alt={currentOffer.title}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows (Fade in on Hover) */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md shadow-lg opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:scale-110 transition-all duration-300 cursor-pointer hidden sm:flex items-center justify-center"
            aria-label="Previous Offer"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md shadow-lg opacity-0 group-hover:opacity-100 hover:bg-white/20 hover:scale-110 transition-all duration-300 cursor-pointer hidden sm:flex items-center justify-center"
            aria-label="Next Offer"
          >
            <ChevronRight size={24} />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-4 left-8 lg:left-12 z-20 flex items-center gap-2">
            {PROMO_OFFERS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  idx === currentIndex
                    ? 'w-7 h-2 bg-amber-400'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}