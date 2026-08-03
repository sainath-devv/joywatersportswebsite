import React from 'react';
import { Instagram, Youtube, MapPin, Phone, Mail, ArrowRight, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="footer" className="bg-deep-blue text-foam-white pt-10 sm:pt-16 pb-8 sm:pb-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-ocean-blue/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-16 mb-8 sm:mb-16 border-b border-white/10 pb-8 sm:pb-16">
          {/* Brand Column */}
          <div className="lg:col-span-4 sm:col-span-2 lg:col-span-4">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <img src="https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx" alt="Logo" loading="lazy" decoding="async" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              <span className="text-xl sm:text-2xl font-display tracking-widest text-white">Joy Water Sports</span>
            </div>
            <p className="text-white/60 text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-sm">
              We help travelers find accommodations, plan relaxing vacations and embark on exciting water sports adventures in paradise.
            </p>
            <div className="flex items-center gap-4">
              <a href="#footer" onClick={(e) => e.preventDefault()} className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-full flex items-center justify-center text-white/80 hover:bg-sky-blue hover:text-white hover:scale-110 transition-all border border-white/10">
                <Instagram size={16} />
              </a>
              <a href="#footer" onClick={(e) => e.preventDefault()} className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-full flex items-center justify-center text-white/80 hover:bg-sky-blue hover:text-white hover:scale-110 transition-all border border-white/10">
                <Linkedin size={16} />
              </a>
              <a href="#footer" onClick={(e) => e.preventDefault()} className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-full flex items-center justify-center text-white/80 hover:bg-sky-blue hover:text-white hover:scale-110 transition-all border border-white/10">
                <Youtube size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links & Activities Group */}
          <div className="sm:col-span-2 lg:col-span-4 lg:col-start-6 grid grid-cols-2 gap-8">
            {/* Quick Links */}
            <div>
              <h4 className="text-base sm:text-lg font-heading font-medium mb-3 sm:mb-6 text-white tracking-wide">Quick Links</h4>
              <ul className="space-y-2 sm:space-y-4">
                <li><a href="#booking-section" className="text-white/60 hover:text-sky-blue text-xs sm:text-sm transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Home</a></li>
                <li><a href="#activities-section" className="text-white/60 hover:text-sky-blue text-xs sm:text-sm transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Activities</a></li>
                <li><a href="#pricing-section" className="text-white/60 hover:text-sky-blue text-xs sm:text-sm transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Packages</a></li>
                <li><a href="#reviews-section" className="text-white/60 hover:text-sky-blue text-xs sm:text-sm transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Reviews</a></li>
                <li><a href="#booking-section" className="text-white/60 hover:text-sky-blue text-xs sm:text-sm transition-colors flex items-center gap-2 group"><ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /> Contact</a></li>
              </ul>
            </div>

            {/* Activities */}
            <div>
              <h4 className="text-base sm:text-lg font-heading font-medium mb-3 sm:mb-6 text-white tracking-wide">Top Activities</h4>
              <ul className="space-y-2 sm:space-y-4">
                <li><a href="#activities-section" className="text-white/60 hover:text-sky-blue text-xs sm:text-sm transition-colors">Parasailing</a></li>
                <li><a href="#activities-section" className="text-white/60 hover:text-sky-blue text-xs sm:text-sm transition-colors">Jet Ski</a></li>
                <li><a href="#activities-section" className="text-white/60 hover:text-sky-blue text-xs sm:text-sm transition-colors">Flying Fish</a></li>
                <li><a href="#activities-section" className="text-white/60 hover:text-sky-blue text-xs sm:text-sm transition-colors">Speed Boat</a></li>
                <li><a href="#activities-section" className="text-white/60 hover:text-sky-blue text-xs sm:text-sm transition-colors">Banana Boat & Crazy Sofa</a></li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3 sm:col-span-2 lg:col-span-3">
            <h4 className="text-base sm:text-lg font-heading font-medium mb-4 sm:mb-6 text-white tracking-wide">Contact Us</h4>
            <ul className="space-y-4 sm:space-y-5">
              <li className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/10">
                  <MapPin className="text-ocean-blue" size={16} />
                </div>
                <div>
                  <p className="text-white/90 text-[11px] sm:text-[13px] font-bold mb-0.5 sm:mb-1 uppercase tracking-wider">Location</p>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed">PPJ4+W9 Varkala Beach, Varkala, Kerala 695141</p>
                </div>
              </li>
              <li className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/10">
                  <Phone className="text-ocean-blue" size={16} />
                </div>
                <div>
                  <p className="text-white/90 text-[11px] sm:text-[13px] font-bold mb-0.5 sm:mb-1 uppercase tracking-wider">Phone / WhatsApp</p>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed">+91 98402 06102</p>
                </div>
              </li>
              <li className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/10">
                  <Mail className="text-ocean-blue" size={16} />
                </div>
                <div>
                  <p className="text-white/90 text-[11px] sm:text-[13px] font-bold mb-0.5 sm:mb-1 uppercase tracking-wider">Email</p>
                  <p className="text-white/60 text-xs sm:text-sm leading-relaxed">hello@joywatersports.com</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs sm:text-[13px] text-center sm:text-left">&copy; {new Date().getFullYear()} Joy Water Sports. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <a href="#footer" onClick={(e) => e.preventDefault()} className="text-white/40 hover:text-white text-xs sm:text-[13px] transition-colors">Privacy Policy</a>
            <a href="#footer" onClick={(e) => e.preventDefault()} className="text-white/40 hover:text-white text-xs sm:text-[13px] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
