import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { MapPin, Phone, Navigation, Search, Store, ArrowLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API_BASE_URL } from '../../lib/api';

// ---------------------------------------------------------------------------
// Types — matches the /api/store-admins response shape (public, no auth
// required — this is what actually powers the storefront/locator).
// ---------------------------------------------------------------------------
interface ApiBranch {
  id: string;
  name: string;
  managerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  mapUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiStore {
  id: string;
  name: string;
  about: string;
  logo: string;
  coverBanner: string;
  contactNumber: string;
  whatsapp: string;
  email: string;
  website: string;
  branches: ApiBranch[];
}

interface ApiStoreAdmin {
  id: string;
  name: string;
  email: string;
  status: string;
  store: ApiStore | null;
}

interface ApiResponse {
  success: boolean;
  count: number;
  storeAdmins: ApiStoreAdmin[];
}

// Flattened row used for filtering / rendering — one entry per branch,
// carrying its parent store's identity along with it.
interface StoreLocation {
  branchId: string;
  storeId: string;
  storeName: string;
  logo: string;
  about: string;
  branchName: string;
  managerName: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  country: string; // API doesn't return this — defaulted, kept as a filter dimension for the future
  pincode: string;
  lat: number;
  lng: number;
  mapUrl: string;
}

function flattenStores(storeAdmins: ApiStoreAdmin[]): StoreLocation[] {
  return storeAdmins
    .filter((sa) => sa.store !== null)
    .flatMap((sa) => {
      const store = sa.store as ApiStore;
      return (store.branches || [])
        .filter((b) => typeof b.lat === 'number' && typeof b.lng === 'number' && !(b.lat === 0 && b.lng === 0))
        .map((branch) => ({
          branchId: branch.id,
          storeId: store.id,
          storeName: store.name,
          logo: store.logo,
          about: store.about,
          branchName: branch.name,
          managerName: branch.managerName,
          phone: branch.phone || store.contactNumber,
          whatsapp: branch.whatsapp || store.whatsapp,
          address: branch.address,
          city: branch.city,
          state: branch.state,
          country: 'India',
          pincode: branch.pincode,
          lat: branch.lat,
          lng: branch.lng,
          mapUrl: branch.mapUrl,
        }));
    });
}

// ---------------------------------------------------------------------------
// Local cache — avoids re-hitting /api/store-admins on every visit/remount.
// Stores the already-flattened branch list plus a timestamp; a fresh network
// fetch only happens once the cache is missing or older than CACHE_TTL_MS.
// ---------------------------------------------------------------------------
const CACHE_KEY = 'nearby-stores:v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function readStoreCache(): StoreLocation[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; locations: StoreLocation[] };
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.locations;
  } catch {
    return null;
  }
}

function writeStoreCache(locations: StoreLocation[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), locations }));
  } catch {
    // ignore quota / private-mode errors — cache is a best-effort optimization
  }
}

// Component to dynamically re-center the map when a user clicks a store
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// Create custom premium map markers using your theme colors
const createCustomMarker = (isActive: boolean) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="
    background-color: ${isActive ? '#04091e' : '#ffffff'}; 
    color: ${isActive ? '#ffffff' : '#04091e'}; 
    border: 2px solid ${isActive ? '#ffffff' : '#d1d5db'}; 
    border-radius: 50%; 
    width: 36px; height: 36px; 
    display: flex; align-items: center; justify-content: center; 
    box-shadow: 0 4px 10px rgba(0,0,0,0.2); 
    transition: all 0.3s ease;
    transform: ${isActive ? 'scale(1.15)' : 'scale(1)'};
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
  </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India, used only until real data/location arrives

// ---------------------------------------------------------------------------
// Skeleton loading placeholders — shown only on a cold load (no cache hit).
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="p-5 rounded-[24px] border border-gray-200 bg-white shadow-sm flex gap-4 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-gray-200 flex-shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
          <div className="h-3 w-4/5 bg-gray-100 rounded" />
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-50">
          <div className="h-5 w-14 bg-gray-100 rounded-lg" />
          <div className="h-5 w-20 bg-gray-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function SkeletonFilterBar() {
  return (
    <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-200 flex flex-col gap-4 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="h-12 w-full lg:max-w-md bg-gray-100 rounded-xl" />
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-100 rounded-full" />
          ))}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-11 flex-1 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function SkeletonPage() {
  return (
    <>
      <SkeletonFilterBar />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden flex flex-col relative min-h-[500px]">
          <div className="flex-1 bg-gray-100 animate-pulse" />
          <div className="bg-white p-5 md:p-6 border-t border-gray-100 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-200" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-56 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-12 w-12 bg-gray-100 rounded-xl" />
              <div className="h-12 w-32 bg-gray-100 rounded-xl" />
              <div className="h-12 w-32 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function NearbyStoresPage() {
  const navigate = useNavigate();

  const [allLocations, setAllLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState(1000000); // effectively "no limit" until we have real user coords
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ---- Fetch real store/branch data — served from a local cache when ----
  // available so we don't hit the API on every mount/navigation. A fresh
  // network call only happens on a cache miss/expiry, and it silently
  // revalidates the cache in the background otherwise.
  useEffect(() => {
    const controller = new AbortController();

    const cached = readStoreCache();
    if (cached) {
      setAllLocations(cached);
      setSelectedBranchId(cached[0]?.branchId ?? null);
      setLoading(false);
    }

    async function loadStores() {
      if (!cached) setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/store/all`, { signal: controller.signal });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json: ApiResponse = await res.json();
        if (!json.success) throw new Error('API returned an error');
        const locations = flattenStores(json.storeAdmins || []);
        setAllLocations(locations);
        setSelectedBranchId((prev) => prev ?? locations[0]?.branchId ?? null);
        writeStoreCache(locations);
      } catch (err) {
        if ((err as Error).name !== 'AbortError' && !cached) {
          setError('Could not load stores. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadStores();
    return () => controller.abort();
  }, []);

  // ---- Real user location (falls back gracefully if denied) -----------
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserCoords(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // ---- Filter option lists, derived from the real data -----------------
  const countryOptions = useMemo(
    () => ['All', ...Array.from(new Set(allLocations.map((l) => l.country))).sort()],
    [allLocations]
  );
  const stateOptions = useMemo(() => {
    const pool = selectedCountry === 'All' ? allLocations : allLocations.filter((l) => l.country === selectedCountry);
    return ['All', ...Array.from(new Set(pool.map((l) => l.state).filter(Boolean))).sort()];
  }, [allLocations, selectedCountry]);
  const cityOptions = useMemo(() => {
    let pool = selectedCountry === 'All' ? allLocations : allLocations.filter((l) => l.country === selectedCountry);
    pool = selectedState === 'All' ? pool : pool.filter((l) => l.state === selectedState);
    return ['All', ...Array.from(new Set(pool.map((l) => l.city).filter(Boolean))).sort()];
  }, [allLocations, selectedCountry, selectedState]);
  const storeNameOptions = useMemo(
    () => Array.from(new Set(allLocations.map((l) => l.storeName))).sort(),
    [allLocations]
  );

  // Reset dependent filters when a parent filter changes
  useEffect(() => {
    setSelectedState('All');
    setSelectedCity('All');
  }, [selectedCountry]);
  useEffect(() => {
    setSelectedCity('All');
  }, [selectedState]);

  // ---- Apply filters + distance + search --------------------------------
  // Memoized so filtering/sorting only re-runs when the inputs that affect
  // it change, rather than on every render (e.g. map pan/zoom state).
  const dynamicStores = useMemo(
    () =>
      allLocations
        .filter((loc) => selectedCountry === 'All' || loc.country === selectedCountry)
        .filter((loc) => selectedState === 'All' || loc.state === selectedState)
        .filter((loc) => selectedCity === 'All' || loc.city === selectedCity)
        .map((loc) => {
          const distance = userCoords ? calculateDistance(userCoords.lat, userCoords.lng, loc.lat, loc.lng) : 0;
          return { ...loc, calculatedDistance: parseFloat(distance.toFixed(1)) };
        })
        .filter((loc) => {
          const q = searchQuery.toLowerCase();
          const matchesSearch =
            !q ||
            loc.storeName.toLowerCase().includes(q) ||
            loc.city.toLowerCase().includes(q) ||
            loc.state.toLowerCase().includes(q) ||
            loc.branchName.toLowerCase().includes(q);
          const withinRadius = !userCoords || loc.calculatedDistance <= maxDistance;
          return matchesSearch && withinRadius;
        })
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance),
    [allLocations, selectedCountry, selectedState, selectedCity, searchQuery, maxDistance, userCoords]
  );

  const activeStore = dynamicStores.find((s) => s.branchId === selectedBranchId) || dynamicStores[0];

  const mapCenter: [number, number] = activeStore
    ? [activeStore.lat, activeStore.lng]
    : userCoords
    ? [userCoords.lat, userCoords.lng]
    : DEFAULT_CENTER;

  return (
    <div className="bg-[#f9f7ee] min-h-screen flex flex-col" style={{ fontFamily: 'var(--font-family-sans)' }}>
      {/* Header Zone */}
      <div className="bg-[#04091e] text-white px-6 py-6 relative shadow-lg z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors border border-white/10"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Discover Nearby Showrooms</h1>
              <p className="text-gray-400 text-sm mt-1">Find premium jeweler stores close to your destination</p>
            </div>
          </div>

          <div className="flex gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-sm self-start md:self-auto">
            <div className="px-4 border-r border-white/10">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Stores Found</p>
              <p className="text-xl font-black text-white mt-0.5">{dynamicStores.length}</p>
            </div>
            <div className="px-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                {userCoords ? 'Search Range' : 'Location'}
              </p>
              <p className="text-xl font-black text-white mt-0.5">
                {userCoords ? `${maxDistance} km` : 'Not shared'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-6 py-6 flex-1 flex flex-col gap-6 relative z-10">
        {loading && <SkeletonPage />}

        {!loading && (
        <>
        {/* Filter Bar */}
        <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-200 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by store, branch, city or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#f9f7ee] border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] focus:outline-none focus:border-[#04091e] transition-colors"
              />
            </div>

            {userCoords && (
              <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto scrollbar-hide py-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap mr-2">
                  Distance:
                </span>
                {[5, 15, 25, 50].map((dist) => (
                  <button
                    key={dist}
                    onClick={() => setMaxDistance(dist)}
                    className={`px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all whitespace-nowrap border ${
                      maxDistance === dist
                        ? 'bg-[#04091e] text-white border-[#04091e] shadow-md'
                        : 'bg-[#f9f7ee] text-[#04091e] border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    Within {dist} km
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Country / State / District (city) / Store filters — populated from real API data */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#f9f7ee] border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] focus:outline-none focus:border-[#04091e]"
            >
              {countryOptions.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Countries' : c}
                </option>
              ))}
            </select>

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#f9f7ee] border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] focus:outline-none focus:border-[#04091e]"
            >
              {stateOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All States' : s}
                </option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#f9f7ee] border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] focus:outline-none focus:border-[#04091e]"
            >
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Districts / Cities' : c}
                </option>
              ))}
            </select>

            <select
              value={activeStore?.storeName ? '' : ''}
              onChange={(e) => setSearchQuery(e.target.value === 'All' ? '' : e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#f9f7ee] border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] focus:outline-none focus:border-[#04091e]"
            >
              <option value="All">All Stores</option>
              {storeNameOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-white rounded-[24px] p-12 flex flex-col items-center justify-center gap-3 border border-gray-200 shadow-sm">
            <AlertCircle className="text-red-500" size={28} />
            <p className="text-sm font-bold text-gray-500">{error}</p>
          </div>
        )}

        {/* Workspace Layout */}
        {!error && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
            {/* Sidebar Feed */}
            <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin">
              {dynamicStores.length === 0 ? (
                <div className="bg-white rounded-[24px] p-8 text-center border border-gray-200 shadow-sm flex flex-col items-center justify-center my-auto">
                  <Store size={40} className="text-gray-300 mb-3" />
                  <p className="text-sm font-bold text-gray-500">No stores match these filters.</p>
                </div>
              ) : (
                dynamicStores.map((loc) => {
                  const isSelected = loc.branchId === selectedBranchId;
                  return (
                    <motion.div
                      key={loc.branchId}
                      onClick={() => setSelectedBranchId(loc.branchId)}
                      whileHover={{ x: 4 }}
                      className={`p-5 rounded-[24px] border transition-all cursor-pointer flex gap-4 ${
                        isSelected
                          ? 'bg-white border-[#04091e] shadow-md ring-1 ring-[#04091e]'
                          : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0">
                        <img src={loc.logo} alt={loc.storeName} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-extrabold text-base text-[#04091e] truncate">{loc.storeName}</h3>
                          <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {loc.branchName}, {loc.city}, {loc.state}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                          <span className="px-2 py-1 bg-[#f9f7ee] text-[#04091e] text-[11px] font-bold rounded-lg border border-gray-200">
                            {loc.pincode}
                          </span>
                          {userCoords && (
                            <span className="px-2 py-1 bg-[#f9f7ee] text-[#04091e] text-[11px] font-bold rounded-lg border border-gray-200">
                              {loc.calculatedDistance} km away
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* REAL MAP WIDGET LAYER */}
            <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden flex flex-col relative min-h-[500px] z-0">
              <div className="flex-1 relative w-full h-full">
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }} zoomControl={false}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
                  />

                  <MapController center={mapCenter} zoom={13} />

                  {dynamicStores.map((loc) => (
                    <Marker
                      key={loc.branchId}
                      position={[loc.lat, loc.lng]}
                      icon={createCustomMarker(loc.branchId === selectedBranchId)}
                      eventHandlers={{ click: () => setSelectedBranchId(loc.branchId) }}
                    >
                      <Popup className="custom-popup rounded-2xl">
                        <div className="text-center font-sans p-1">
                          <h4 className="font-extrabold text-[#04091e] text-base m-0">{loc.storeName}</h4>
                          <p className="text-gray-500 text-xs mt-1 mb-2">
                            {loc.branchName}
                            {userCoords ? ` · ${loc.calculatedDistance} km away` : ''}
                          </p>
                          <button
                            onClick={() => navigate(`/stores/${loc.storeId}`)}
                            className="w-full bg-[#04091e] text-white text-xs font-bold py-2 rounded-lg"
                          >
                            View Store
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {userCoords && (
                    <Marker
                      position={[userCoords.lat, userCoords.lng]}
                      icon={L.divIcon({
                        className: 'user-marker',
                        html: `<div style="width:16px;height:16px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 0 10px rgba(0,0,0,0.5);"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8],
                      })}
                    />
                  )}
                </MapContainer>
              </div>

              {/* Quick-Action Selected Active Store Footer Details Drawer */}
              {activeStore && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  key={activeStore.branchId}
                  className="bg-white p-5 md:p-6 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] relative"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0">
                      <img src={activeStore.logo} alt={activeStore.storeName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xl text-[#04091e]">{activeStore.storeName}</h4>
                      <p className="text-gray-500 text-sm mt-1 font-medium flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" /> {activeStore.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`tel:${activeStore.phone}`}
                      className="h-12 px-4 bg-[#f9f7ee] text-[#04091e] font-bold text-xs uppercase tracking-wider rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                      <Phone size={16} />
                    </a>
                    <button
                      onClick={() => navigate(`/stores/${activeStore.storeId}`)}
                      className="h-12 px-5 bg-white border-2 border-gray-200 text-[#04091e] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                    >
                      Store Details <ChevronRight size={16} />
                    </button>
                    <a
                      href={
                        activeStore.mapUrl ||
                        `https://www.google.com/maps/search/?api=1&query=${activeStore.lat},${activeStore.lng}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="h-12 px-6 bg-[#04091e] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-[#04091e]/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Navigation size={16} /> Navigate
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}