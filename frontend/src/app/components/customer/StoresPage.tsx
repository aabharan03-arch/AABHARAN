import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { MapPin, Search, ArrowRight, Phone, Store } from 'lucide-react';
import { STORES } from '../data/mockData';

export function StoresPage() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const nearbyMode = searchParams.get('nearby') === 'true';

  const cities = ['All', ...Array.from(new Set(STORES.map(s => s.city)))];

  const filtered = STORES.filter(s => {
    const matchesQuery = !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.city.toLowerCase().includes(query.toLowerCase());
    const matchesCity = cityFilter === 'All' || s.city === cityFilter;
    return matchesQuery && matchesCity;
  }).sort((a, b) => nearbyMode ? (a.distance ?? 99) - (b.distance ?? 99) : 0);

  return (
    <div className="bg-[#f9f7ee] min-h-screen" style={{ fontFamily: 'var(--font-family-sans)' }}>
      
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 py-12 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[#04091e]">
            {nearbyMode ? 'Nearby Jewellery Stores' : 'All Jewellery Stores'}
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            {nearbyMode ? 'Stores sorted by distance from your location' : `Discover ${STORES.length} verified jewellery stores across India`}
          </p>

          <div className="mt-8 flex flex-col md:flex-row gap-6">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#04091e] transition-colors" />
              <input
                type="text"
                placeholder="Search by store name or city..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-[#f9f7ee] border border-gray-200 rounded-xl text-sm font-medium text-[#04091e] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#04091e]/20 focus:border-[#04091e] transition-all"
                style={{ fontFamily: 'var(--font-family-sans)' }}
              />
            </div>

            {/* City Filters */}
            <div className="flex gap-3 flex-wrap items-center">
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => setCityFilter(city)}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border shadow-sm ${
                    cityFilter === city
                      ? 'bg-[#04091E] text-white border-transparent'
                      : 'bg-white text-[#04091e] border-gray-200 hover:border-[#04091e]/40 hover:bg-[#f9f7ee]'
                  }`}
                  style={{ fontFamily: 'var(--font-family-sans)' }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Store Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-sm font-bold text-gray-500 mb-8 tracking-wide uppercase">
          {filtered.length} store{filtered.length !== 1 ? 's' : ''} found
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((store, i) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/stores/${store.id}`}>
                <div className="bg-white rounded-[24px] overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
                  
                  {/* Cover Banner */}
                  <div className="relative h-44 overflow-hidden bg-[#f9f7ee]">
                    <img 
                      src={store.coverBanner} 
                      alt={store.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                    />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 30%, rgba(4,9,30,0.8) 100%)' }} />
                    
                    {store.featured && (
                      <div className="absolute top-4 right-4">
                        <span className="px-3.5 py-1.5 bg-[#04091e] text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-md border border-white/20">
                          Featured
                        </span>
                      </div>
                    )}
                    
                    {nearbyMode && store.distance && (
                      <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white shadow-md rounded-full px-3 py-1.5">
                        <MapPin size={14} className="text-[#04091e]" />
                        <span className="text-xs font-bold text-[#04091e]">{store.distance} km away</span>
                      </div>
                    )}
                  </div>

                  {/* Content Layout */}
                  <div className="p-6 flex flex-col flex-1">
                    {/* Logo & Title */}
                    <div className="flex items-end gap-4 -mt-12 relative mb-4">
                      <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden flex-shrink-0 bg-white p-0.5">
                        <img src={store.logo} alt={store.name} className="w-full h-full object-cover rounded-full" />
                      </div>
                      <div className="mb-1">
                        <h3 className="text-xl font-extrabold text-[#04091e] leading-tight" style={{ fontFamily: 'var(--font-family-sans)' }}>{store.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin size={14} className="text-gray-500" />
                          <span className="text-sm font-bold text-gray-500">{store.city}</span>
                        </div>
                      </div>
                    </div>

                    {/* About */}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed flex-1">
                      {store.about}
                    </p>

                    {/* Footer / Action */}
                    <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Store size={16} />
                        <span className="text-sm font-bold">{store.branches.length} branch{store.branches.length !== 1 ? 'es' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-[#f9f7ee] text-[#04091e] px-4 py-2 rounded-xl font-bold text-sm group-hover:bg-[#04091e] group-hover:text-white transition-colors">
                        View Store <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[24px] border border-gray-200 mt-8">
            <Search size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-[#04091e]">No stores found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or selecting a different city.</p>
          </div>
        )}
      </div>
    </div>
  );
}