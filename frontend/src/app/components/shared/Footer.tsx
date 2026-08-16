import { Link } from 'react-router';
import { Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface-dark text-on-reverse" style={{ fontFamily: 'var(--font-family-sans)' }}>
      <div className="max-w-7xl mx-auto px-xl py-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2xl">
          {/* Brand */}
          <div className="flex flex-col gap-lg">
            <div className="flex items-center gap-sm">
              <div className="w-8 h-8 rounded-md bg-[var(--brand-primary)] flex items-center justify-center">
                <span className="text-white font-semibold" style={{ fontSize: '13px' }}>A</span>
              </div>
              <span className="text-label font-semibold text-white">Aabharan</span>
            </div>
            <p className="text-label-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Discover India's finest jewellery stores and explore exquisite collections for every occasion.
            </p>
            <div className="flex gap-md">
              <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <Instagram size={14} className="text-white" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <Facebook size={14} className="text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-lg">
            <h4 className="text-label font-semibold text-white">Explore</h4>
            <div className="flex flex-col gap-sm">
              {['All Jewellery Stores', 'Rings', 'Necklaces', 'Bangles', 'Diamond Jewellery', 'Bridal Collections'].map(link => (
                <Link key={link} to="/stores" className="text-label-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.6)' }}>{link}</Link>
              ))}
            </div>
          </div>

          {/* For Stores */}
          <div className="flex flex-col gap-lg">
            <h4 className="text-label font-semibold text-white">For Jewellery Stores</h4>
            <div className="flex flex-col gap-sm">
              {['Store Portal Login', 'List Your Store', 'Manage Products', 'View Enquiries', 'Gallery Management'].map(link => (
                <Link key={link} to="/portal/login" className="text-label-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.6)' }}>{link}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-lg">
            <h4 className="text-label font-semibold text-white">Contact Us</h4>
            <div className="flex flex-col gap-md">
              <div className="flex items-start gap-sm">
                <Mail size={14} className="mt-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span className="text-label-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>hello@aabharan.in</span>
              </div>
              <div className="flex items-start gap-sm">
                <Phone size={14} className="mt-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span className="text-label-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>+91 98765 43210</span>
              </div>
              <div className="flex items-start gap-sm">
                <MapPin size={14} className="mt-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }} />
                <span className="text-label-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>Mumbai, Maharashtra, India</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2xl pt-xl border-t flex flex-col md:flex-row items-center justify-between gap-md" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <p className="text-video-title" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © 2026 Aabharan. All rights reserved.
          </p>
          <div className="flex items-center gap-xl">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(item => (
              <a key={item} href="#" className="text-video-title transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
