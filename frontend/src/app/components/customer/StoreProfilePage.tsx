import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, 
  Phone, 
  Globe, 
  Mail, 
  MessageCircle, 
  ArrowLeft, 
  Image as ImageIcon, 
  Store, 
  ExternalLink, 
  Loader2,
  X,
  RotateCcw
} from 'lucide-react';
import { EnquiryModal } from '../shared/EnquiryModal';

export interface Branch {
  id: string;
  name: string;
  managerName?: string;
  phone?: string;
  whatsapp?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  mapUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  metalType: string;
  purity: string;
  weight?: string | null;
  description?: string | null;
  featured: boolean;
  displayOrder?: number;
  images: string[];
  views?: number;
  storeId?: string;
  storeName?: string;
  storeLogo?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreData {
  id: string;
  name: string;
  about?: string | null;
  logo?: string | null;
  coverBanner?: string | null;
  contactNumber?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  createdAt?: string;
  updatedAt?: string;
  branches: Branch[];
  products: Product[];
}

export function StoreProfilePage() {
  // Route can be either /stores/:storeId (internal links) or /s/:slug (QR scans)
  const { storeId, slug } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'products' | 'gallery' | 'branches'>('products');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [metalFilter, setMetalFilter] = useState('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [enquiryProduct, setEnquiryProduct] = useState<Product | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchStoreData() {
      try {
        setLoading(true);
        setError(null);

        // Slug-based (QR / public) vs id-based (internal links) fetch a
        // different endpoint — slug is public and unauthenticated.
        const url = slug
          ? `http://localhost:3000/api/store/public/${slug}`
          : `/api/admin/store/all`; // fallback for existing :storeId internal links

        const res = await fetch(url);
        const data = await res.json();

        if (!isMounted) return;

        if (slug) {
          if (res.ok && data.data) {
            setStore(data.data);
            document.title = `${data.data.name} | Store Profile`;
          } else {
            setError(data.error || 'Store profile not found');
          }
          return;
        }

        // Legacy path: matching against the admin list by storeId
        if (data.success && Array.isArray(data.storeAdmins)) {
          const matchedAdmin = data.storeAdmins.find(
            (sa: any) => sa.id === storeId || sa.store?.id === storeId
          );

          if (matchedAdmin?.store) {
            setStore(matchedAdmin.store);
            document.title = `${matchedAdmin.store.name} | Store Profile`;
          } else {
            setError('Store profile not found');
          }
        } else {
          setError(data.error || 'Failed to retrieve store profile');
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('Error fetching store:', err);
          setError(err.message || 'Unable to connect to the server');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (slug || storeId) {
      fetchStoreData();
    } else {
      setLoading(false);
      setError('Invalid Store Link');
    }

    return () => {
      isMounted = false;
    };
  }, [storeId, slug]);

  if (loading) {
    return (
      <div className="bg-[#f9f7ee] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#04091e]" size={40} />
          <p className="text-[#04091e] font-bold tracking-wide">Loading store profile...</p>
        </div>
      </div>
    );
  }

  if (!store || error) {
    return (
      <div className="bg-[#f9f7ee] min-h-screen flex items-center justify-center px-4" style={{ fontFamily: 'var(--font-family-sans)' }}>
        <div className="text-center bg-white p-8 md:p-12 rounded-[24px] shadow-sm border border-gray-200 max-w-md w-full">
          <Store size={56} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-[#04091e]">{error || 'Store Not Found'}</h2>
          <p className="text-gray-500 text-sm mt-2">The store you are looking for might have been removed or is temporarily unavailable.</p>
          <button 
            className="mt-6 w-full py-3.5 bg-[#04091e] text-white font-bold rounded-xl shadow-md hover:bg-[#04091e]/90 transition-all" 
            onClick={() => navigate('/stores')}
          >
            Back to Stores
          </button>
        </div>
      </div>
    );
  }

  // Raw Data Extraction
  const rawProducts: Product[] = store.products || [];
  const branches: Branch[] = store.branches || [];

  // Filtered Products
  const storeProducts = rawProducts.filter(p => {
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    if (metalFilter !== 'All' && p.metalType !== metalFilter) return false;
    return true;
  });

  // Dynamic Options for Filters
  const storeCategories = ['All', ...Array.from(new Set(rawProducts.map(p => p.category).filter(Boolean)))];
  const storeMetalTypes = ['All', ...Array.from(new Set(rawProducts.map(p => p.metalType).filter(Boolean)))];

  // No dedicated gallery field on Store — derive from product images
  const galleryImages: string[] = Array.from(new Set(rawProducts.flatMap(p => p.images || [])));

  // Branch location fallback
  const cityLocation = branches[0]?.city || 'Location Unavailable';

  const isFiltered = categoryFilter !== 'All' || metalFilter !== 'All';

  return (
    <div className="bg-[#f9f7ee] min-h-screen pb-20" style={{ fontFamily: 'var(--font-family-sans)' }}>
      
      {/* 1. Hero Cover Banner */}
      <div className="relative h-72 md:h-96 overflow-hidden bg-[#04091e]">
        {store.coverBanner ? (
          <img src={store.coverBanner} alt={store.name} className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="w-full h-full bg-[#04091e] flex items-center justify-center text-white/20">
            <Store size={80} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#04091e]/20 via-[#04091e]/40 to-[#04091e]/90" />
        
        <button 
          onClick={() => navigate(-1)} 
          aria-label="Go Back"
          className="absolute top-6 left-6 flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-md rounded-full px-5 py-2.5 hover:bg-white/20 hover:scale-105 transition-all group z-20"
        >
          <ArrowLeft size={18} className="text-white group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold text-white">Back</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* 2. Store Identity Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-6 md:p-10 -mt-24 relative z-10 shadow-xl shadow-[#04091e]/5 border border-gray-100"
        >
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            {/* Logo Overlap */}
            <div className="w-32 h-32 md:w-44 md:h-44 rounded-[32px] border-[8px] border-white shadow-lg overflow-hidden flex-shrink-0 -mt-20 md:-mt-24 bg-gray-50 relative z-20 flex items-center justify-center">
              {store.logo ? (
                <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <Store size={48} className="text-gray-300" />
              )}
            </div>
            
            <div className="flex-1 flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 className="text-3xl md:text-5xl font-extrabold text-[#04091e] tracking-tight">{store.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-[#f9f7ee] text-[#04091e] text-xs font-bold uppercase tracking-wider rounded-md">
                      <MapPin size={14} /> {cityLocation}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-md">
                      <Store size={14} /> {branches.length} Branch{branches.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                </div>

                {/* Quick Action Contact Pills */}
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {store.contactNumber && (
                    <a 
                      href={`tel:${store.contactNumber}`} 
                      className="flex items-center justify-center w-11 h-11 bg-[#f9f7ee] text-[#04091e] rounded-full hover:bg-[#04091e] hover:text-white transition-colors border border-gray-200" 
                      title="Call Store"
                      aria-label="Call Store"
                    >
                      <Phone size={18} />
                    </a>
                  )}
                  {store.whatsapp && (
                    <a 
                      href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center justify-center w-11 h-11 bg-green-50 text-green-600 rounded-full hover:bg-green-500 hover:text-white transition-colors border border-green-200" 
                      title="Contact on WhatsApp"
                      aria-label="Contact on WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </a>
                  )}
                  {store.email && (
                    <a 
                      href={`mailto:${store.email}`} 
                      className="flex items-center justify-center w-11 h-11 bg-[#f9f7ee] text-[#04091e] rounded-full hover:bg-[#04091e] hover:text-white transition-colors border border-gray-200" 
                      title="Email Store"
                      aria-label="Email Store"
                    >
                      <Mail size={18} />
                    </a>
                  )}
                  {store.website && (
                    <a 
                      href={store.website.startsWith('http') ? store.website : `https://${store.website}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 px-5 h-11 bg-[#04091e] text-white text-sm font-bold rounded-full hover:bg-[#04091e]/90 shadow-md transition-colors"
                    >
                      Website <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              </div>
              
              {store.about && (
                <p className="text-gray-600 leading-relaxed text-sm md:text-base max-w-4xl">{store.about}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* 3. Navigation Tabs */}
        <div className="mt-12 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[
            { key: 'products', label: `Store Products (${rawProducts.length})` },
            { key: 'gallery', label: `Photo Gallery (${galleryImages.length})` },
            { key: 'branches', label: `Our Branches (${branches.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                activeTab === tab.key
                  ? 'bg-[#04091e] text-white border-[#04091e] shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4. Tab Content */}
        <div className="mt-8">
          
          {/* --- PRODUCTS TAB --- */}
          {activeTab === 'products' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-8">
              
              {/* Filter Module */}
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-200 flex flex-col xl:flex-row gap-8 xl:gap-16 relative">
                
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Category</p>
                  <div className="flex flex-wrap gap-2.5">
                    {storeCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                          categoryFilter === cat
                            ? 'bg-[#04091e] text-white border-[#04091e] shadow-md'
                            : 'bg-[#f9f7ee] text-[#04091e] border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 xl:max-w-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Metal Type</p>
                    {isFiltered && (
                      <button 
                        onClick={() => { setCategoryFilter('All'); setMetalFilter('All'); }}
                        className="text-xs font-bold text-[#04091e] hover:underline flex items-center gap-1"
                      >
                        <RotateCcw size={12} /> Reset Filters
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {storeMetalTypes.map(metal => (
                      <button
                        key={metal}
                        onClick={() => setMetalFilter(metal)}
                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${
                          metalFilter === metal
                            ? 'bg-[#04091e] text-white border-[#04091e] shadow-md'
                            : 'bg-[#f9f7ee] text-[#04091e] border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {metal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              {storeProducts.length === 0 ? (
                <div className="bg-white rounded-[24px] p-16 text-center border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                  <p className="text-lg font-bold text-gray-500">No products match the selected filters.</p>
                  <button 
                    onClick={() => { setCategoryFilter('All'); setMetalFilter('All'); }} 
                    className="mt-4 px-6 py-2.5 bg-[#04091e] text-white text-sm font-bold rounded-full shadow hover:bg-[#04091e]/90 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                  {storeProducts.map(product => (
                    <StoreProductCard key={product.id} product={product} onEnquire={() => setEnquiryProduct(product)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* --- GALLERY TAB --- */}
          {activeTab === 'gallery' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {galleryImages.length === 0 ? (
                <div className="bg-white rounded-[24px] p-16 text-center border border-gray-200 shadow-sm">
                  <p className="text-lg font-bold text-gray-500">No gallery images available for this store.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {galleryImages.map((img, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02, y: -4 }}
                      onClick={() => setSelectedImage(img)}
                      className="rounded-[24px] overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#04091e]/20 transition-all group bg-white relative w-full aspect-square"
                    >
                      <img src={img} alt={`Gallery Image ${i + 1}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-[#04091e]/0 group-hover:bg-[#04091e]/30 transition-colors flex items-center justify-center">
                        <ImageIcon size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* --- BRANCHES TAB --- */}
          {activeTab === 'branches' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-6">
              {branches.length === 0 ? (
                <div className="bg-white rounded-[24px] p-16 text-center border border-gray-200 shadow-sm">
                  <p className="text-lg font-bold text-gray-500">No branch details registered for this store.</p>
                </div>
              ) : (
                branches.map(branch => (
                  <div key={branch.id} className="bg-white rounded-[24px] p-6 md:p-8 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row gap-8">
                      <div className="flex-1 flex flex-col gap-6">
                        <div>
                          <h3 className="text-2xl font-extrabold text-[#04091e]">{branch.name}</h3>
                          {branch.managerName && (
                            <p className="text-sm font-bold text-gray-500 mt-1 uppercase tracking-wider">Manager: {branch.managerName}</p>
                          )}
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3 sm:col-span-2">
                            <div className="p-2 bg-[#f9f7ee] rounded-lg text-[#04091e] flex-shrink-0 mt-0.5"><MapPin size={18} /></div>
                            <span className="text-base text-gray-700 leading-relaxed font-medium">
                              {branch.address}, {branch.city}, {branch.state} – {branch.pincode}
                            </span>
                          </div>
                          {branch.phone && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#f9f7ee] rounded-lg text-[#04091e] flex-shrink-0"><Phone size={18} /></div>
                              <a href={`tel:${branch.phone}`} className="text-base font-bold text-gray-800 hover:underline">{branch.phone}</a>
                            </div>
                          )}
                          {branch.whatsapp && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-50 rounded-lg text-green-600 flex-shrink-0"><MessageCircle size={18} /></div>
                              <a href={`https://wa.me/${branch.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-base font-bold text-gray-800 hover:underline">{branch.whatsapp}</a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="lg:w-80 h-56 bg-gray-100 rounded-[20px] overflow-hidden border border-gray-200 flex items-center justify-center relative group">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#04091e 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>
                        <div className="absolute inset-0 bg-[#04091e]/5 group-hover:bg-[#04091e]/10 transition-colors" />
                        <div className="text-center flex flex-col items-center gap-4 relative z-10">
                          <div className="w-14 h-14 bg-[#04091e] rounded-full flex items-center justify-center shadow-lg text-white group-hover:scale-110 transition-transform">
                            <MapPin size={24} />
                          </div>
                          <a 
                            href={branch.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(`${branch.address}, ${branch.city}, ${branch.state}`)}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm font-bold text-[#04091e] bg-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all"
                          >
                            Open in Google Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Fullscreen Image Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#04091e]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-12" 
            onClick={() => setSelectedImage(null)}
          >
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage} 
              alt="Gallery Preview" 
              className="max-w-full max-h-full rounded-[24px] object-contain shadow-2xl border-4 border-white/10" 
              onClick={e => e.stopPropagation()} 
            />
            <button 
              className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20"
              onClick={() => setSelectedImage(null)}
              aria-label="Close Preview"
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <EnquiryModal product={enquiryProduct} isOpen={enquiryProduct !== null} onClose={() => setEnquiryProduct(null)} />
    </div>
  );
}

/* Premium Product Card Component */
function StoreProductCard({ product, onEnquire }: { product: Product; onEnquire: () => void }) {
  const navigate = useNavigate();
  const mainImage = product.images?.[0] || '';
  
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white rounded-[24px] overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
    >
      <div className="relative h-[280px] overflow-hidden bg-[#f9f7ee] flex-shrink-0 flex items-center justify-center">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        ) : (
          <ImageIcon size={48} className="text-gray-300" />
        )}
        {product.featured && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3.5 py-1.5 bg-[#04091e] text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-md">
              Featured
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6 flex flex-col flex-1 gap-4">
        <div>
          {product.storeName && (
            <p className="text-gray-400 text-[11px] font-bold mb-1.5 uppercase tracking-widest">{product.storeName}</p>
          )}
          <h3 className="text-xl font-extrabold text-[#04091e] leading-snug line-clamp-1">
            {product.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {product.category && (
            <span className="px-3.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-full">
              {product.category}
            </span>
          )}
          {product.metalType && (
            <span className="px-3.5 py-1 bg-gray-100 text-gray-700 text-[11px] font-semibold rounded-full">
              {product.metalType}
            </span>
          )}
          {product.purity && (
            <span className="px-3.5 py-1 bg-[#f9f7ee] text-[#04091e] text-[11px] font-semibold rounded-full">
              {product.purity}
            </span>
          )}
        </div>
        
        {product.description && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1 mt-1">
            {product.description}
          </p>
        )}
        
        <div className="flex gap-3 pt-3 mt-auto">
          <button
            onClick={() => navigate(`/products/${product.id}`)}
            className="flex-1 py-3.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Details
          </button>
          <button
            onClick={onEnquire}
            className="flex-1 py-3.5 bg-[#04091e] shadow-md rounded-xl text-sm font-bold text-white hover:bg-[#04091e]/90 hover:shadow-lg transition-all"
          >
            Enquire
          </button>
        </div>
      </div>
    </motion.div>
  );
}