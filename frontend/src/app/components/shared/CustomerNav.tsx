import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Menu, X, User, LogOut } from 'lucide-react';
import { PRODUCTS, STORES, CATEGORIES } from '../data/mockData';

// Import your logo from the assets folder. 
import logo from '../asserts/logo.jpeg';

interface SearchResult {
  type: 'product' | 'store' | 'category';
  id: string;
  name: string;
  subtitle?: string;
  image?: string;
}

interface AuthUser {
  userId: string;
  email: string;
  name?: string;
  username?: string;
}

export function CustomerNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // --- Auth & Modal State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Fallback display name if `name` isn't set on the account
  const displayName = user?.name || user?.username || user?.email;

  // --- CHECK AUTHENTICATION ON MOUNT ---
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoggedIn(false);
        setAuthLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/customer/me', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(true);
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (err) {
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }; 
    checkAuth();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [
      ...PRODUCTS.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 3).map(p => ({ type: 'product' as const, id: p.id, name: p.name, subtitle: p.category + ' · ' + p.storeName, image: p.images[0] })),
      ...STORES.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)).slice(0, 2).map(s => ({ type: 'store' as const, id: s.id, name: s.name, subtitle: s.city, image: s.logo })),
      ...CATEGORIES.filter(c => c !== 'All' && c.toLowerCase().includes(q)).slice(0, 2).map(c => ({ type: 'category' as const, id: c, name: c, subtitle: 'Browse category' })),
    ];
    setSearchResults(results);
  }, [searchQuery]);

  function handleSearchSelect(r: SearchResult) {
    setSearchOpen(false);
    setSearchQuery('');
    if (r.type === 'product') navigate(`/products/${r.id}`);
    else if (r.type === 'store') navigate(`/stores/${r.id}`);
    else navigate(`/stores?category=${encodeURIComponent(r.id)}`);
  }

  // --- LOGOUT ---
  const handleLogoutConfirm = async () => {
    try {
      const token = localStorage.getItem('token');

      if (token) {
        await fetch('/api/customer/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setUser(null);
      setShowLogoutModal(false);
      setMenuOpen(false);
      navigate('/');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#04091E] border-b border-white/10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8 h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0 transition-opacity hover:opacity-80">
              <img
                src={logo}
                alt="Aabharan Logo"
                className="h-15 w-15 rounded-full object-cover"
              />
            </Link>

            {/* Search bar — desktop */}
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-2xl relative ml-4">
              <div className="relative w-full group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors" />
                <input
                  type="text"
                  placeholder="Search jewellery, stores, categories..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-full text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300 shadow-inner"
                  style={{ fontFamily: 'var(--font-family-sans)' }}
                />
              </div>

              {/* Search Results Popover */}
              {searchOpen && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-[#0c122b] rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden backdrop-blur-xl">
                  {searchResults.map(r => (
                    <button
                      key={r.type + r.id}
                      onClick={() => handleSearchSelect(r)}
                      className="w-full flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                    >
                      {r.image ? (
                        <img src={r.image} alt={r.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 border border-white/10">
                          <Search size={16} className="text-white/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate" style={{ fontFamily: 'var(--font-family-sans)' }}>{r.name}</p>
                        {r.subtitle && <p className="text-xs text-white/50 truncate mt-0.5" style={{ fontFamily: 'var(--font-family-sans)' }}>{r.subtitle}</p>}
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium px-2 py-1 bg-white/5 rounded-full flex-shrink-0">{r.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { label: 'Home', to: '/' },
                { label: 'Stores', to: '/stores' },
                { label: 'About', to: '/about' },
                { label: 'Contact', to: '/contact' },
              ].map(item => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all rounded-full"
                  style={{ fontFamily: 'var(--font-family-sans)' }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* --- AUTH BUTTONS (DESKTOP) --- */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0 ml-auto">
              {authLoading ? (
                <div className="w-[160px] h-9" aria-hidden="true" />
              ) : isLoggedIn ? (
                <>
                  {/* Updated Link passing user state */}
                  <Link
                    to="/profile"
                    state={{ user }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    title="Profile"
                  >
                    <User size={20} />
                    {displayName && (
                      <span
                        className="text-sm font-medium text-white/90 max-w-[120px] truncate"
                        style={{ fontFamily: 'var(--font-family-sans)' }}
                      >
                        {displayName}
                      </span>
                    )}
                  </Link>
                  <div className="w-px h-6 bg-white/10 mx-1 hidden lg:block"></div>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="px-6 py-2 bg-red-600/20 border border-red-500/40 text-red-400 text-sm font-medium rounded-full hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-family-sans)' }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="px-6 py-2 bg-white text-[#04091E] text-sm font-semibold rounded-full hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    style={{ fontFamily: 'var(--font-family-sans)' }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth?tab=signup"
                    className="px-6 py-2 border border-white/20 text-white text-sm font-medium rounded-full hover:bg-white/5 hover:border-white/40 transition-all"
                    style={{ fontFamily: 'var(--font-family-sans)' }}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden ml-auto p-2 rounded-full text-white hover:bg-white/10 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#04091E] absolute w-full shadow-2xl z-50">
            <div className="p-6 flex flex-col gap-6">
              <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/10"
                  style={{ fontFamily: 'var(--font-family-sans)' }}
                />
              </div>
              <nav className="flex flex-col gap-2">
                {[
                  { label: 'Home', to: '/' },
                  { label: 'Stores', to: '/stores' },
                  { label: 'About', to: '/about' },
                  { label: 'Contact', to: '/contact' },
                ].map(item => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="text-base font-medium text-white/80 py-3 px-4 rounded-xl hover:text-white hover:bg-white/5 transition-colors"
                    style={{ fontFamily: 'var(--font-family-sans)' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* --- AUTH BUTTONS (MOBILE) --- */}
              <div className="flex gap-4 pt-4 border-t border-white/10 mt-2">
                {authLoading ? (
                  <div className="flex-1 h-12" aria-hidden="true" />
                ) : isLoggedIn ? (
                  <>
                    <Link
                      to="/profile"
                      state={{ user }}
                      className="flex-1 flex items-center gap-2 p-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User size={20} />
                      {displayName && (
                        <span
                          className="text-sm font-medium truncate"
                          style={{ fontFamily: 'var(--font-family-sans)' }}
                        >
                          {displayName}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={() => setShowLogoutModal(true)}
                      className="flex-1 py-3 text-center bg-red-600/90 text-white font-semibold text-sm rounded-xl transition-colors hover:bg-red-700 flex items-center justify-center gap-2"
                      style={{ fontFamily: 'var(--font-family-sans)' }}
                    >
                      <LogOut size={18} />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" className="flex-1 py-3 text-center bg-white text-[#04091E] font-semibold text-sm rounded-xl transition-colors hover:bg-gray-200" style={{ fontFamily: 'var(--font-family-sans)' }} onClick={() => setMenuOpen(false)}>Login</Link>
                    <Link to="/auth?tab=signup" className="flex-1 py-3 text-center border border-white/20 text-white font-medium text-sm rounded-xl transition-colors hover:bg-white/5" style={{ fontFamily: 'var(--font-family-sans)' }} onClick={() => setMenuOpen(false)}>Sign Up</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0c122b] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-family-sans)' }}>
              Confirm Logout
            </h3>
            <p className="text-sm text-white/60 mb-6" style={{ fontFamily: 'var(--font-family-sans)' }}>
              Are you sure you want to log out? You will need to sign in again to access your account.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 border border-white/20 text-white hover:bg-white/10 text-sm font-medium rounded-xl transition-colors"
                style={{ fontFamily: 'var(--font-family-sans)' }}
              >
                No, Stay
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
                style={{ fontFamily: 'var(--font-family-sans)' }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}