import { useState, useEffect } from 'react';
import { X, Gift, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---- CONFIG ----
const POPUP_STORAGE_KEY = 'promo_popup_last_shown';
const POPUP_COOLDOWN_MS = 24 * 60 * 60 * 1000; // show again after 24h; set to Infinity to show only once ever

interface PromoPopupProps {
  imageUrl: string;
  eyebrow?: string;
  title?: string;
  highlightedText?: string;
  subtitle?: string;
  note?: string;
  ctaText?: string;
  ctaLink?: string;
  badgeLeftText?: string;
  badgeRightText?: string;
}

export function PromoPopup({
  imageUrl,
  eyebrow = 'FREE',
  title = 'GIFT BOX',
  highlightedText = 'FREE Gift Box',
  subtitle = 'Shop For ₹1200+ and Get',
  note = 'Worth ₹299',
  ctaText,
  ctaLink,
  badgeLeftText = 'Premium Quality',
  badgeRightText = 'Limited Time Offer',
}: PromoPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const lastShown = localStorage.getItem(POPUP_STORAGE_KEY);
      const shouldShow =
        !lastShown || Date.now() - parseInt(lastShown, 10) > POPUP_COOLDOWN_MS;

      if (shouldShow) {
        // small delay so it doesn't flash before the page settles
        const timer = setTimeout(() => setIsOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.warn('Could not read popup state from localStorage:', err);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      localStorage.setItem(POPUP_STORAGE_KEY, Date.now().toString());
    } catch (err) {
      console.warn('Could not save popup state to localStorage:', err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[680px] bg-[#fdf9f2] rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Close popup"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} className="text-gray-800" />
            </button>

            <div className="flex flex-col sm:flex-row">
              {/* Text side */}
              <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center gap-4">
                <div>
                  <h2 className="text-5xl font-black text-[#7a1f2b] leading-none tracking-tight">
                    {eyebrow}
                  </h2>
                  <h2 className="text-5xl font-black text-[#7a1f2b] leading-tight tracking-tight">
                    {title}
                  </h2>
                </div>

                <div className="w-24 h-px bg-[#7a1f2b]/40 my-1" />

                <p className="text-lg text-gray-800 leading-snug">
                  {subtitle}{' '}
                  <span className="font-bold text-[#7a1f2b]">{highlightedText}</span>
                  <br />
                  {note}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <div className="w-11 h-11 rounded-full bg-[#7a1f2b]/10 flex items-center justify-center flex-shrink-0">
                    <Gift size={20} className="text-[#7a1f2b]" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Perfect for you or your loved ones!
                  </p>
                </div>

                {ctaText && ctaLink && (
                  <a
                    href={ctaLink}
                    className="mt-4 inline-flex items-center justify-center px-6 py-3 bg-[#7a1f2b] text-white font-bold rounded-lg shadow-md hover:bg-[#601622] transition-colors w-fit cursor-pointer"
                  >
                    {ctaText}
                  </a>
                )}
              </div>

              {/* Image side */}
              <div className="flex-1 relative min-h-[280px] sm:min-h-0">
                <img
                  src={imageUrl}
                  alt="Promotional offer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Bottom badge bar */}
            <div className="flex items-center justify-center gap-8 bg-[#7a1f2b] py-3 px-4">
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <ShieldCheck size={16} />
                {badgeLeftText}
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                <Gift size={16} />
                {badgeRightText}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}