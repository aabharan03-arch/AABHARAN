import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Lock, Store, ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

// Adjust path based on your assets setup
import logo from '../asserts/logo.jpeg'; 

// Set your backend base URL (adjust if running on a custom port/domain)
const API_BASE_URL = 'http://localhost:3000/api/storeadmin';

export function PortalLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.email || !form.password) { 
      setError('Please enter your credentials.'); 
      return; 
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // Save token and user info locally
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('storeadmin_token', data.token);
      storage.setItem('storeadmin_user', JSON.stringify(data.storeAdmin));

      // Direct navigation to portal dashboard
      navigate('/portal');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Quick preset function for demo convenience
  const fillDemoCredentials = () => {
    setForm({ email: 'demo@tanishq.co.in', password: 'demo1234' });
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f9f7ee] flex" style={{ fontFamily: 'var(--font-family-sans)' }}>
      
      {/* Left side — Premium Branding Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden bg-[#04091e]">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white opacity-5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        {/* Logo Area */}
        <div className="flex items-center gap-3 relative z-10">
          <img src={logo} alt="Aabharan Logo" className="w-12 h-12 object-cover rounded-full border-2 border-white/20" />
          <span className="text-xl font-extrabold text-white tracking-wide">Aabharan <span className="font-medium text-white/60">| Partner</span></span>
        </div>

        {/* Value Proposition */}
        <div className="flex flex-col gap-10 max-w-md relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm shadow-2xl">
            <Store size={36} className="text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
              Manage your showroom, effortlessly.
            </h2>
            <p className="text-lg text-white/70 leading-relaxed">
              The all-in-one portal to manage your products, track customer enquiries, update branch details, and showcase your gallery.
            </p>
          </div>
          
          <div className="flex flex-col gap-5">
            {[
              'Upload and manage unlimited products',
              'Track and respond to customer enquiries',
              'Update store & branch locations in real-time',
              'Organize high-quality gallery collections',
            ].map(item => (
              <div key={item} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
                <span className="text-base font-medium text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm font-medium text-white/40 relative z-10">
          © 2026 Aabharan. All rights reserved.
        </p>
      </div>

      {/* Right side — Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md flex flex-col">
          
          <Link to="/" className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#04091e] transition-colors mb-12 self-start group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Customer Website
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="bg-white rounded-[32px] border border-gray-200 shadow-xl shadow-[#04091e]/5 p-8 md:p-10">
              
              <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
                <img src={logo} alt="Aabharan Logo" className="w-12 h-12 object-cover rounded-full border border-gray-200 shadow-sm" />
                <span className="text-xl font-extrabold text-[#04091e] tracking-wide">Aabharan <span className="font-medium text-gray-400">| Partner</span></span>
              </div>

              <div className="mb-8 text-center lg:text-left">
                <h1 className="text-3xl font-extrabold text-[#04091e]">Portal Login</h1>
                <p className="text-sm font-medium text-gray-500 mt-2">Sign in to access your dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="store@email.com"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="block w-full pl-11 pr-4 py-3.5 bg-[#f9f7ee]/50 border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#04091e]/20 focus:border-[#04091e] transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="block w-full pl-11 pr-12 py-3.5 bg-[#f9f7ee]/50 border border-gray-200 rounded-xl text-sm font-bold text-[#04091e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#04091e]/20 focus:border-[#04091e] transition-all"
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

                {/* Error Banner */}
                {error && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-3.5 rounded-lg border border-red-100 animate-fade-in">{error}</p>
                )}

                <div className="flex justify-between items-center mt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#04091e] focus:ring-[#04091e] border-gray-300 cursor-pointer accent-[#04091e]" 
                    />
                    <span className="text-sm font-medium text-gray-500 group-hover:text-[#04091e] transition-colors">Remember me</span>
                  </label>
                  <a href="#" className="text-sm font-bold text-[#04091e] hover:underline">Forgot password?</a>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-[#04091e] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:bg-[#04091e]/90 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </span>
                  ) : (
                    <>Sign In to Portal <ArrowRight size={18} /></>
                  )}
                </button>
              </form>

              {/* Demo Credentials Box */}
              <div className="mt-10 pt-8 border-t border-gray-100">
                <div 
                  onClick={fillDemoCredentials}
                  className="bg-[#f9f7ee] border border-gray-200 rounded-2xl p-5 cursor-pointer hover:border-[#04091e]/40 transition-colors"
                  title="Click to fill credentials"
                >
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                    <span>Demo Credentials</span>
                    <span className="text-[10px] text-[#04091e] font-semibold lowercase bg-white px-2 py-0.5 rounded border border-gray-200">click to fill</span>
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-gray-600"><strong className="text-[#04091e]">Email:</strong> demo@tanishq.co.in</p>
                    <p className="text-sm font-medium text-gray-600"><strong className="text-[#04091e]">Password:</strong> demo1234</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-8 text-center">
              <p className="text-sm font-medium text-gray-500">
                Looking for the customer site?{' '}
                <Link to="/auth" className="text-[#04091e] font-bold hover:underline">
                  Customer Login
                </Link>
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}