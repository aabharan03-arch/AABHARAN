import React from 'react';

export function StoreCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[240px] bg-white rounded-2xl p-4 shadow-sm animate-pulse border border-gray-100">
      <div className="w-full h-36 bg-gray-200 rounded-xl mb-4" />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function StoreProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#f9f7ee] py-10 px-4 md:px-8 max-w-7xl mx-auto animate-pulse space-y-8">
      {/* Banner Skeleton */}
      <div className="bg-gray-200 rounded-3xl h-64 w-full" />
      
      {/* Info Section Skeleton */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-28 h-28 bg-gray-300 rounded-full -mt-16 border-4 border-[#f9f7ee]" />
        <div className="flex-1 space-y-3 w-full">
          <div className="h-7 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-12 bg-gray-200 rounded w-full mt-4" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 h-64 flex flex-col justify-between">
            <div className="h-36 bg-gray-200 rounded-xl" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}