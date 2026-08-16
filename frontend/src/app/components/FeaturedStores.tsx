import React, { useRef } from 'react';
import { Link } from 'react-router';
import { ProcessedStore } from '../../types/home';

interface FeaturedStoresProps {
  stores: ProcessedStore[];
  isLoading: boolean;
}

export function FeaturedStores({ stores, isLoading }: FeaturedStoresProps) {
  const storeCarouselRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-2xl">
      <div className="max-w-7xl mx-auto px-xl">
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h2 className="text-3xl font-bold text-[#04091e]">Featured Stores</h2>
          </div>
        </div>

        <div
          ref={storeCarouselRef}
          className="flex gap-xl overflow-x-auto pb-sm px-2 py-4 -mx-2 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <StoreSkeletonCard key={index} />
            ))
          ) : stores.length > 0 ? (
            stores.map((store) => (
              <StoreItem key={store.id} store={store} />
            ))
          ) : (
            <div className="w-full py-8 text-center text-gray-500">
              No stores available at the moment.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StoreItem({ store }: { store: ProcessedStore }) {
  return (
    <Link
      to={`/stores/${store.id}`}
      state={{ storeData: store }}
      className="flex-shrink-0 group cursor-pointer flex flex-col items-center w-28 text-center"
    >
      <div className="w-24 h-24 rounded-full p-1 border-2 border-transparent group-hover:border-gray-400 focus:border-gray-400 group-active:border-gray-400 transition-all duration-200 flex items-center justify-center bg-white shadow-sm">
        <img
          src={store.logo}
          alt={store.name}
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/150?text=Store';
          }}
        />
      </div>

      <div className="mt-2 w-full">
        <p className="text-sm font-semibold text-[#04091e] truncate group-hover:text-gray-600 transition-colors">
          {store.name}
        </p>
        {store.city && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{store.city}</p>
        )}
      </div>
    </Link>
  );
}

function StoreSkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[240px] bg-[#04091e] rounded-2xl p-xl flex flex-col items-center gap-lg shadow-md animate-pulse">
      <div className="w-20 h-20 rounded-full bg-gray-700 border-2 border-gray-600" />
      <div className="text-center w-full flex flex-col items-center gap-2">
        <div className="h-5 w-28 bg-gray-700 rounded-md" />
        <div className="h-3.5 w-16 bg-gray-800 rounded-md mt-1" />
      </div>
    </div>
  );
}