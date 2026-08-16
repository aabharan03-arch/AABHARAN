import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Star, Heart, Eye, Sparkles, ChevronDown, Check } from 'lucide-react';

export interface Product {
  id: string | number;
  name: string;
  category: string;
  description?: string;
  metalType?: string;
  storeName?: string;
  images?: string[];
  featured?: boolean;
  rating?: number;
  reviewsCount?: number;
  price?: number;
  originalPrice?: number;
  discountPercentage?: number;
}

interface ProductSectionProps {
  products: Product[];
  isLoading: boolean;
  selectedCategory: string;
  selectedMetal?: string;
  onCategoryChange: (category: string) => void;
  onMetalChange?: (metal: string) => void;
  onEnquire: (product: Product) => void;
}

const CATEGORIES_LIST = ['All', 'Rings', 'Necklaces', 'Earrings', 'Bracelets', 'Bangles'];
const METALS_LIST = ['All Metals', 'Gold', 'Silver', 'Diamond'];

export function ProductSection({
  products = [],
  isLoading = false,
  selectedCategory = 'All',
  selectedMetal: externalMetal,
  onCategoryChange,
  onMetalChange,
  onEnquire,
}: ProductSectionProps) {
  const [internalMetal, setInternalMetal] = useState('All Metals');
  const activeMetal = externalMetal !== undefined ? externalMetal : internalMetal;

  // Dropdown Open States
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isMetalOpen, setIsMetalOpen] = useState(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const metalRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (metalRef.current && !metalRef.current.contains(event.target as Node)) {
        setIsMetalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMetalSelect = (metal: string) => {
    if (onMetalChange) {
      onMetalChange(metal);
    } else {
      setInternalMetal(metal);
    }
    setIsMetalOpen(false);
  };

  const handleCategorySelect = (category: string) => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    setIsCategoryOpen(false);
  };

  // Combined Category + Metal Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesMetal =
        activeMetal === 'All Metals' ||
        (p.metalType && p.metalType.toLowerCase() === activeMetal.toLowerCase());

      return matchesCategory && matchesMetal;
    });
  }, [products, selectedCategory, activeMetal]);

  const handleResetFilters = () => {
    if (onCategoryChange) onCategoryChange('All');
    handleMetalSelect('All Metals');
  };

  return (
    <section className="py-16 bg-[#f9f7ee]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header & Clean Dropdown Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-black/5 pb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-900/60 mb-1 block">
              Exclusive Collection
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#04091e] tracking-tight">
              Explore Crafted Jewels
            </h2>
          </div>

          {/* Filter Dropdowns Container */}
          <div className="flex items-center gap-3">
            
            {/* Category Dropdown */}
            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryOpen(!isCategoryOpen);
                  setIsMetalOpen(false);
                }}
                className="flex items-center gap-3 bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 text-xs font-bold text-[#04091e] hover:border-gray-400 transition-all cursor-pointer min-w-[150px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-amber-800" />
                  <span>{selectedCategory === 'All' ? 'All Categories' : selectedCategory}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isCategoryOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30"
                  >
                    {CATEGORIES_LIST.map((cat) => {
                      const isSelected = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleCategorySelect(cat)}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-amber-50/60 transition-colors ${
                            isSelected ? 'text-amber-900 font-bold bg-amber-50/40' : 'text-gray-700'
                          }`}
                        >
                          <span>{cat === 'All' ? 'All Categories' : cat}</span>
                          {isSelected && <Check size={14} className="text-amber-800" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Metal Filter Dropdown */}
            <div className="relative" ref={metalRef}>
              <button
                type="button"
                onClick={() => {
                  setIsMetalOpen(!isMetalOpen);
                  setIsCategoryOpen(false);
                }}
                className="flex items-center gap-3 bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 text-xs font-bold text-[#04091e] hover:border-gray-400 transition-all cursor-pointer min-w-[140px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>{activeMetal}</span>
                </div>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${isMetalOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isMetalOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-30"
                  >
                    {METALS_LIST.map((metal) => {
                      const isSelected = activeMetal === metal;
                      return (
                        <button
                          key={metal}
                          type="button"
                          onClick={() => handleMetalSelect(metal)}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between hover:bg-amber-50/60 transition-colors ${
                            isSelected ? 'text-amber-900 font-bold bg-amber-50/40' : 'text-gray-700'
                          }`}
                        >
                          <span>{metal}</span>
                          {isSelected && <Check size={14} className="text-amber-800" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductSkeletonCard key={index} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8"
          >
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEnquire={() => onEnquire && onEnquire(product)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-white/50 rounded-3xl backdrop-blur-sm">
            <div className="w-16 h-16 bg-amber-100/50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-900">
              <Filter size={24} />
            </div>
            <h3 className="text-xl font-extrabold text-[#04091e]">No items found</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              We couldn't find any {activeMetal !== 'All Metals' ? activeMetal : ''} items matching "{selectedCategory}".
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-6 px-6 py-2.5 bg-[#04091e] text-white text-xs font-bold rounded-full uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  onEnquire,
}: {
  product: Product;
  onEnquire: () => void;
}) {
  const [isLiked, setIsLiked] = useState(false);
  const productUrl = `/products/${product.id}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col"
    >
      {/* Seamless Image Wrapper */}
      <div className="relative aspect-[4/5] bg-gray-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
        <a href={productUrl} className="block w-full h-full">
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/400x500?text=Jewellery'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://via.placeholder.com/400x500?text=Jewellery';
            }}
          />
        </a>

        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.featured && (
            <span className="px-3 py-1 bg-amber-400 text-[#04091e] text-[9px] font-black uppercase rounded-full tracking-wider shadow-sm">
              Featured
            </span>
          )}
          {product.discountPercentage && (
            <span className="px-3 py-1 bg-rose-600 text-white text-[9px] font-bold rounded-full tracking-wider shadow-sm">
              {product.discountPercentage}% OFF
            </span>
          )}
        </div>

        {/* Floating Wishlist Button */}
        <button
          type="button"
          aria-label="Save to wishlist"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className="absolute top-3 right-3 p-2.5 bg-white/80 backdrop-blur-md rounded-full text-gray-700 hover:text-rose-500 hover:bg-white shadow-md transition-all duration-300 z-10 cursor-pointer"
        >
          <Heart size={16} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
        </button>

        {/* Quick View Overlay Bar on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hidden sm:block transform translate-y-2 group-hover:translate-y-0">
          <a
            href={productUrl}
            className="w-full py-2.5 bg-[#04091e]/95 backdrop-blur-md text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-[#04091e] transition-colors"
          >
            <Eye size={14} /> Quick View
          </a>
        </div>
      </div>

      {/* Clean Typography Content Stack */}
      <div className="pt-4 flex flex-col flex-1 gap-1.5 px-1">

        {/* Store Name */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-amber-900/70">
            {product.storeName || 'Jewellery Partner'}
          </span>
        </div>

        {/* Product Title linked to URL */}
        <a href={productUrl} className="group-hover:text-amber-800 transition-colors">
          <h3 className="text-base font-bold text-[#04091e] leading-snug line-clamp-1">
            {product.name}
          </h3>
        </a>

        {/* Material & Category Tags */}
        <div className="flex items-center gap-2 my-1">
          <span className="text-[11px] font-medium text-gray-500 bg-white/80 px-2.5 py-0.5 rounded-full border border-black/5">
            {product.category}
          </span>
          {product.metalType && (
            <span className="text-[11px] font-semibold text-amber-900/80 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
              {product.metalType}
            </span>
          )}
        </div>

      </div>
    </motion.div>
  );
}

function ProductSkeletonCard() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="aspect-[4/5] bg-gray-200/70 rounded-2xl" />
      <div className="pt-4 flex flex-col gap-2 px-1">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-200/70 rounded w-1/3" />
          <div className="h-3 bg-gray-200/70 rounded w-1/4" />
        </div>
        <div className="h-5 bg-gray-200/70 rounded w-3/4" />
        <div className="h-4 bg-gray-200/70 rounded w-1/2" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-gray-200/70 rounded w-1/3" />
          <div className="h-8 bg-gray-200/70 rounded-xl w-8" />
        </div>
      </div>
    </div>
  );
}