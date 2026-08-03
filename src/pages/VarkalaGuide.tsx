import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Sun, Clock, Waves, Shield, MapPin, ChevronRight, Anchor } from 'lucide-react';
import Footer from '../components/common/Footer';
import SEOHead, { joyWaterSportsBusinessSchema } from '../components/common/SEOHead';

export default function VarkalaGuide() {
  const blogArticleSchema = {
    '@type': 'BlogPosting',
    headline: 'Best Time to Visit Varkala for Water Sports & Beach Adventures',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200',
    author: {
      '@type': 'Organization',
      name: 'Joy Water Sports Varkala'
    },
    publisher: joyWaterSportsBusinessSchema,
    datePublished: '2026-08-01',
    description: 'Complete guide on weather, ocean conditions, and best months for Parasailing, Jet Skiing, and water sports in Varkala, Kerala.'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <SEOHead
        title="Best Time to Visit Varkala for Water Sports | Complete Guide"
        description="Planning a trip to Varkala? Learn about the best months, sea conditions, pricing, and top water sports activities on Papanasam Beach, Kerala."
        canonicalUrl="https://joywatersports.com/best-time-to-visit-varkala"
        keywords="best time to visit Varkala for water sports, Varkala weather water sports, Papanasam beach water sports season, Kerala beach holiday itinerary, Parasailing season Varkala"
        schema={[joyWaterSportsBusinessSchema, blogArticleSchema]}
      />

      {/* Header Banner */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx"
              alt="Joy Water Sports Logo"
              className="w-9 h-9 object-contain"
            />
            <span className="font-extrabold text-lg text-white tracking-wide group-hover:text-[#00a6ff] transition-colors">
              JOY WATER SPORTS
            </span>
          </Link>
          <Link
            to="/"
            className="bg-[#00a6ff] hover:bg-blue-600 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20"
          >
            Book Activities Now
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        
        {/* Article Title Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-bold px-3 py-1 rounded-full">
            <Calendar size={13} />
            <span>SEASONAL TRAVEL & SAFETY GUIDE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Best Time to Visit Varkala for <span className="text-[#00a6ff]">Water Sports & Beach Adventures</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Published by Joy Water Sports Team • Updated for 2026 Season
          </p>
        </div>

        {/* Featured Image */}
        <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl aspect-[16/9]">
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200"
            alt="Varkala Papanasam Beach Coastline"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Section */}
        <article className="prose prose-invert max-w-none space-y-6 text-slate-300 leading-relaxed text-sm sm:text-base">
          <h2 className="text-2xl font-bold text-white">Peak Water Sports Season: October to April</h2>
          <p>
            The ideal time to experience water sports in Varkala is during the winter and early summer months from <strong>October through April</strong>. During this period, the Arabian Sea is calm, wind speeds are steady for Parasailing, and underwater visibility is at its clearest.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 not-prose">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
              <Sun className="text-amber-400" size={24} />
              <h3 className="font-bold text-white text-sm">Oct – Feb (Peak Season)</h3>
              <p className="text-xs text-slate-400">Pleasant temperatures (24°C - 31°C), gentle ocean breeze, ideal for Parasailing & Jet Skiing.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
              <Clock className="text-[#00a6ff]" size={24} />
              <h3 className="font-bold text-white text-sm">Mar – May (Shoulder Season)</h3>
              <p className="text-xs text-slate-400">Warm sunshine, lower crowds, great for group banana rides & crazy sofa towing.</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
              <Waves className="text-sky-400" size={24} />
              <h3 className="font-bold text-white text-sm">Jun – Sep (Monsoon)</h3>
              <p className="text-xs text-slate-400">Heavy monsoon rainfall; high swells. Water sports operations remain paused for safety.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white">Top Recommended Activities for First-Timers</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Parasailing:</strong> Soar up to 300+ feet for panoramic views of Varkala’s iconic red cliffs.</li>
            <li><strong>Jet Skiing:</strong> High-speed Yamaha Waverunners supervised by certified lifeguards.</li>
            <li><strong>Flying Fish & Banana Boat:</strong> Fun group rides perfect for families and friends.</li>
          </ul>

          <div className="bg-slate-900 border border-sky-500/30 p-6 rounded-2xl space-y-4 my-8 not-prose">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="text-[#00a6ff]" size={20} />
              Safety Assurance for Non-Swimmers
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every single guest at Joy Water Sports receives a high-buoyancy life vest, a safety briefing from experienced mariners, and constant shore/boat supervision. No swimming skills are required to enjoy 100% of our ocean activities.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#00a6ff] hover:bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              <span>Explore All Rides & Book Online</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </article>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
