import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';

// Import your logo
import logo from '../asserts/logo.jpeg';

const API_BASE_URL = 'https://aabharan-4g0nax65d-aabharan1.vercel.app'; // ✅ Direct backend URL

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'login' | 'signup'>(searchParams.get('tab') === 'signup' ? 'signup' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  const handleTabChange = (newTab: 'login' | 'signup') => {
    setTab(newTab);
    setError('');
    setSuccessMsg('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (tab === 'login') {
        const response = await fetch(`${API_BASE_URL}/api/customer/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Login failed');

        // ✅ Store token and user info in both localStorage and sessionStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));

        navigate('/');
      } else {
        const response = await fetch(`${API_BASE_URL}/api/customer/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // ✅ Send cookies
          body: JSON.stringify(form),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Signup failed');

        setForm({ name: '', email: '', password: '' });
        setSuccessMsg('Account created successfully! Please sign in.');
        setTab('login');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9f7ee] flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ fontFamily: 'var(--font-family-sans)' }}>

      {/* Header & Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link to="/" className="inline-block transition-transform hover:scale-105">
          <img
            src={logo}
            alt="Aabharan Logo"
            className="mx-auto h-20 w-auto object-contain rounded-full shadow-sm border-2 border-white"
          />
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#04091e] tracking-tight">
          {tab === 'login' ? 'Welcome Back' : 'Create your account'}
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-gray-500">
          {tab === 'login' ? 'Sign in to access your saved jewellery and enquiries' : "Join Aabharan to discover India's finest jewellery"}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-[#04091e]/5 sm:rounded-[32px] sm:px-10 border border-gray-100">

          {/* Modern Pill Tab Bar */}
          <div className="flex p-1 bg-gray-50 border border-gray-100 rounded-2xl mb-6">
            <button
              onClick={() => handleTabChange('login')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${tab === 'login'
                ? 'bg-white text-[#04091e] shadow-sm border border-gray-200'
                : 'text-gray-400 hover:text-[#04091e]'
                }`}
            >
              Login
            </button>
            <button
              onClick={() => handleTabChange('signup')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${tab === 'signup'
                ? 'bg-white text-[#04091e] shadow-sm border border-gray-200'
                : 'text-gray-400 hover:text-[#04091e]'
                }`}
            >
              Sign Up
            </button>
          </div>

          {/* API Status Messages */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-xl text-center">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-600 text-sm font-medium rounded-xl text-center">
              {successMsg}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Full Name Input (Signup Only) */}
                {tab === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#04091e]/20 focus:border-[#04091e] transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#04091e]/20 focus:border-[#04091e] transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#04091e]/20 focus:border-[#04091e] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#04091e] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link (Login Only) */}
                {tab === 'login' && (
                  <div className="flex items-center justify-end mt-2">
                    <a href="#" className="text-xs font-bold text-[#04091e] hover:underline">
                      Forgot your password?
                    </a>
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-[#04091e] hover:bg-[#04091e]/90 hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <>{tab === 'login' ? 'Sign In' : 'Create Account'}</>
                    )}
                  </button>
                </div>
              </form>

              {/* Bottom Switcher */}
              <div className="mt-8 text-center">
                <p className="text-sm font-medium text-gray-500">
                  {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    onClick={() => handleTabChange(tab === 'login' ? 'signup' : 'login')}
                    className="text-[#04091e] font-bold hover:underline ml-1"
                  >
                    {tab === 'login' ? 'Sign Up' : 'Login'}
                  </button>
                </p>
              </div>

              {/* Store Portal Link */}
              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Are you a jewellery store?
                </p>
                <Link
                  to="/portal/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#f9f7ee] text-[#04091e] font-bold text-sm rounded-full border border-gray-200 hover:bg-[#04091e] hover:text-white transition-all group"
                >
                  Store Portal Login <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}