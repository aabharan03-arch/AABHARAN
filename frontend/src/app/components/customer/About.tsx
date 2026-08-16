import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { ShieldCheck, Compass, MessageCircle, MapPin, Heart, Target, Gem } from 'lucide-react';

// Import your Navbar and Logo
import logo from '../asserts/logo.jpeg'; // Adjust the extension if needed

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-[#f9f7ee] min-h-screen" style={{ fontFamily: 'var(--font-family-sans)' }}>

      {/* 1. Fixed Navbar Wrapper */}


      {/* 2. Added pt-20 (Padding Top) to offset the fixed 80px navbar */}

      {/* Hero Section */}
      <section className="relative bg-[#04091e] py-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-white opacity-5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={logo}
              alt="Aabharan Logo"
              className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-8 rounded-full object-cover border-4 border-white/10 shadow-2xl"
            />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-tight">
              Redefining the Art of <br className="hidden md:block" /> Jewellery Discovery
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Connecting you with India’s most trusted jewellers and exquisite craftsmanship—all in one place.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl p-10 md:p-16 shadow-xl border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-6">
              <span className="p-3 bg-[#f9f7ee] rounded-xl text-[#04091e]">
                <Heart size={28} />
              </span>
              <h2 className="text-3xl font-bold text-[#04091e]">Our Story</h2>
            </div>
            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>
                <strong>Aabharan</strong> (meaning <em>ornament</em> or <em>jewellery</em>) started with a simple observation: India has a rich, unparalleled heritage of jewellery making, but discovering authentic, verified stores often requires endless physical visits and guesswork.
              </p>
              <p>
                Founded with the vision to digitize and simplify this experience, Aabharan was built to bring the finest jewellers directly to your fingertips. We started by partnering with a handful of legacy stores in local markets and have quickly grown into a nationwide platform.
              </p>
              <p>
                Today, we proudly host thousands of curated designs from verified sellers, ensuring that every piece you discover meets the highest standards of purity, design, and trust.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-[#04091e] rounded-3xl p-10 md:p-14 shadow-lg text-white"
          >
            <Target size={40} className="text-white/80 mb-6" />
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-gray-300 leading-relaxed text-lg">
              To empower customers with transparent, effortless, and secure access to verified jewellery stores, while giving traditional artisans and local brands a digital stage to showcase their art.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-10 md:p-14 shadow-lg border border-gray-100"
          >
            <Gem size={40} className="text-[#04091e] mb-6" />
            <h3 className="text-2xl font-bold text-[#04091e] mb-4">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              To become India’s most trusted and comprehensive digital destination for jewellery discovery, celebrating craftsmanship in every form and making luxury accessible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#04091e]">Why Choose Aabharan?</h2>
            <p className="text-lg text-gray-600 mt-4">The core values that drive our platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, title: 'Verified Authenticity', desc: 'Every store goes through a strict verification process to ensure genuine, hallmark-certified jewellery.' },
              { icon: Compass, title: 'Endless Discovery', desc: 'From 22K temple jewellery to minimalist 18K diamonds, browse a massive catalog spanning top brands.' },
              { icon: MessageCircle, title: 'Direct Connection', desc: 'Enquire directly with the jewellers, ensuring you get the best pricing and personalized service.' },
              { icon: MapPin, title: 'Local & National', desc: 'Support a legacy jeweller right in your city or order from a renowned brand across the country.' },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 bg-[#f9f7ee] rounded-xl flex items-center justify-center text-[#04091e] mb-6">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#04091e] mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-[#04091e] text-white px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          {[
            { number: '500+', label: 'Verified Stores' },
            { number: '10k+', label: 'Exquisite Products' },
            { number: '50+', label: 'Cities Covered' },
            { number: '100%', label: 'Hallmark Assured' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <h4 className="text-4xl md:text-5xl font-extrabold mb-2">{stat.number}</h4>
              <p className="text-gray-400 font-medium tracking-wide uppercase text-sm">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold text-[#04091e] mb-6">Your Next Heirloom Awaits.</h2>
          <p className="text-xl text-gray-600 mb-10">
            Join thousands of happy customers who have found their perfect sparkle through Aabharan.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => navigate('/stores')}
              className="px-8 py-4 bg-[#04091e] text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-[#04091e]/90 transition-all"
            >
              Explore Collections
            </button>
            <button
              onClick={() => navigate('/stores?nearby=true')}
              className="px-8 py-4 bg-white border border-gray-300 text-[#04091e] text-lg font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-all"
            >
              Find Nearby Stores
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}