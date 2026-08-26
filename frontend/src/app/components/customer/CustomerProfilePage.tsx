import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  User,
  Heart,
  LogOut,
  ChevronRight,
  Package,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { PRODUCTS } from '../data/mockData';
import { API_BASE_URL } from '../../lib/api';

type Tab = 'profile' | 'Liked-products';

interface AuthUser {
  userId?: string;
  id?: string;
  email: string;
  name?: string;
  username?: string;
}

export function CustomerProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Get user from React Router navigation state (passed from navbar)
  // 2. Fallback to localStorage for page refresh scenarios
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (location.state?.user) {
      localStorage.setItem('user', JSON.stringify(location.state.user));
      return location.state.user;
    }
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 3. Fetch fresh user data on mount if no user data exists
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/api/customer/me`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/auth');
        }
      } catch (err) {
        console.error('Failed to fetch user context:', err);
        navigate('/auth');
      }
    };

    // Only fetch if we don't have user data
    if (!user) {
      fetchUserData();
    }
  }, [user, navigate]);

  // --- Derived User Info ---
  const displayName = user?.name || user?.username || 'Customer';
  const displayEmail = user?.email || 'No email provided';

  // Extract initials (e.g. "Priya Sharma" -> "PS")
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'profile', label: 'My Profile', icon: <User size={18} /> },
    { key: 'Liked-products', label: 'Liked Products', icon: <Heart size={18} /> },
  ];

  return (
    <div className="bg-[#f9f7ee] min-h-screen py-12 md:py-20" style={{ fontFamily: 'var(--font-family-sans)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#04091e] tracking-tight">My Account</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage your profile, saved items, and settings</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Sidebar Menu */}
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-200 flex flex-col gap-8 sticky top-24">

              {/* User Identity Card */}
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#04091e] text-white flex items-center justify-center text-xl font-bold shadow-md flex-shrink-0">
                    {getInitials(displayName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-extrabold text-[#04091e] truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 font-medium truncate mt-0.5">{displayEmail}</p>
                  </div>
                </div>
              ) : (
                <div className="animate-pulse flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <nav className="flex flex-col gap-2">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-4 px-5 py-3.5 rounded-xl text-left transition-all duration-300 font-bold ${
                      activeTab === tab.key
                        ? 'bg-[#f9f7ee] text-[#04091e] shadow-sm border border-gray-100'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-[#04091e] border border-transparent'
                    }`}
                  >
                    <span className={activeTab === tab.key ? 'text-[#04091e]' : 'text-gray-400'}>
                      {tab.icon}
                    </span>
                    <span className="text-sm">{tab.label}</span>
                    {activeTab === tab.key && <ChevronRight size={16} className="ml-auto opacity-50" />}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 w-full">
            <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-gray-200 min-h-[500px]">
              {activeTab === 'profile' && user && <ProfileTab user={user} setUser={setUser} />}
              {activeTab === 'Liked-products' && <SavedProductsTab />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* TAB COMPONENTS                                                             */
/* -------------------------------------------------------------------------- */

interface ProfileTabProps {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

function ProfileTab({ user, setUser }: ProfileTabProps) {
  const [form, setForm] = useState({
    name: user?.name || user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Pre-fill name field when user changes
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || user.username || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!form.currentPassword.trim()) {
      setError('Current password is required to authorize changes.');
      return;
    }

    if (form.newPassword || form.confirmPassword) {
      if (form.newPassword !== form.confirmPassword) {
        setError('New password and Confirm password do not match.');
        return;
      }
      if (form.newPassword.length < 6) {
        setError('New password must be at least 6 characters long.');
        return;
      }
    }

    if (!form.name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Session expired. Please log in again.');
        return;
      }

      const payload: Record<string, string> = {
        currentPassword: form.currentPassword,
        name: form.name.trim(),
      };

      if (form.newPassword) {
        payload.newPassword = form.newPassword;
      }

      const response = await fetch(`${API_BASE_URL}/api/customer/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');

      // Update state with new user data
      const updatedUser = {
        ...user,
        name: form.name.trim(),
      } as AuthUser;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Clear password fields
      setForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      setError(err.message || 'Something went wrong while updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-[#04091e]" size={40} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-extrabold text-[#04091e]">Personal Information</h2>
        <p className="text-gray-500 text-sm mt-2">Update your profile details or security settings.</p>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-xl">
          <AlertCircle size={18} className="flex-shrink-0 text-red-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl">
          <CheckCircle2 size={18} className="flex-shrink-0 text-green-500 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="flex flex-col gap-6 max-w-2xl">
        {/* Full Name / Username */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
            Full Name / Username <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Enter your name"
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] focus:outline-none focus:ring-2 focus:ring-[#04091e]/20 focus:border-[#04091e] transition-all"
          />
        </div>

        {/* Email Address (Pre-filled & Non-editable) */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Email Address</label>
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded border border-gray-200">
              READ-ONLY
            </span>
          </div>
          <input
            type="email"
            value={form.email}
            disabled
            placeholder="Loading email..."
            className="w-full px-4 py-3.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Email address cannot be changed. Contact support for assistance.</p>
        </div>

        <hr className="border-gray-100 my-2" />

        {/* Current Password Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">
            Current Password <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-gray-400 mb-2">Required to authorize any changes to your profile.</p>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={e => setForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Enter your current password"
              className="w-full px-4 py-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] focus:outline-none focus:ring-2 focus:ring-[#04091e]/20 focus:border-[#04091e] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#04091e] transition-colors p-1"
              aria-label="Toggle password visibility"
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* New Password Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">New Password (Optional)</label>
          <p className="text-xs text-gray-400 mb-2">Leave blank to keep your current password.</p>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="Enter new password (min. 6 characters)"
              className="w-full px-4 py-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] focus:outline-none focus:ring-2 focus:ring-[#04091e]/20 focus:border-[#04091e] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#04091e] transition-colors p-1"
              aria-label="Toggle password visibility"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm New Password Field */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Re-enter new password"
              className="w-full px-4 py-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] focus:outline-none focus:ring-2 focus:ring-[#04091e]/20 focus:border-[#04091e] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#04091e] transition-colors p-1"
              aria-label="Toggle password visibility"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-100 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#04091e] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-[#04091e]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

function SavedProductsTab() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-extrabold text-[#04091e]">Liked Products</h2>
        <p className="text-gray-500 text-sm mt-2">Your curated collection of favorite jewellery pieces.</p>
      </div>

      {PRODUCTS.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.slice(0, 6).map(product => (
            <div key={product.id} className="group cursor-pointer">
              <div className="rounded-[24px] overflow-hidden border border-gray-200 bg-white hover:shadow-xl hover:border-gray-300 transition-all flex flex-col h-full">
                <div className="relative aspect-square overflow-hidden bg-[#f9f7ee]">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full p-2 shadow-md">
                    <Heart size={20} className="text-red-500 fill-red-500" />
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <p className="text-gray-400 text-[10px] font-bold mb-2 uppercase tracking-widest">{product.storeName}</p>
                  <p className="text-base font-extrabold text-[#04091e] leading-snug line-clamp-2">{product.name}</p>
                  <p className="text-sm font-bold text-[#04091e] mt-auto pt-3">
                    ₹{product.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <Heart size={48} className="text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No liked products yet</p>
          <p className="text-sm text-gray-400 mt-1">Start liking jewellery pieces to save them here</p>
        </div>
      )}
    </div>
  );
}