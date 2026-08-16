import React from 'react';
import { Link } from 'react-router';
import {  ArrowRight, Compass } from 'lucide-react';
export function NearbyStoresBanner() {
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-[#04091e] text-white p-8 sm:p-10 lg:p-12 shadow-2xl">
          
          {/* Subtle Ambient Background Elements */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Subtle Grid Accent Pattern */}
          <div 
            className="absolute inset-0 opacity-5 pointer-events-none" 
            style={{ 
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, 
              backgroundSize: '24px 24px' 
            }} 
          />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            {/* Left Content Area */}
            <div className="max-w-2xl space-y-4">
              {/* Badge Indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-medium tracking-wide border border-white/10 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Store Locator
              </div>

              {/* Heading */}
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Experience our craft in person.
              </h3>

              {/* Subheading */}
              <p className="text-base text-gray-300 font-normal leading-relaxed max-w-xl">
                Discover bespoke collections and exclusive showroom designs near you. Enable location access for instant directions.
              </p>
            </div>

            {/* Right Action Area */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              <Link
                to="/nearby-stores"
                className="group relative inline-flex items-center justify-center gap-3 bg-white text-[#04091e] font-semibold text-sm px-7 py-4 rounded-2xl shadow-lg hover:bg-amber-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Compass className="w-5 h-5 text-[#04091e] transition-transform duration-300 group-hover:rotate-45" />
                <span>Find Nearest Store</span>
                <ArrowRight className="w-4 h-4 text-[#04091e] transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}