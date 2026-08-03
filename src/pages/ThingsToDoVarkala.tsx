import React from 'react';
import { Link } from 'react-router-dom';
import { Anchor, Compass, Sun, Shield, MapPin, Sparkles, PhoneCall, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import Footer from '../components/common/Footer';
import SEOHead, { joyWaterSportsBusinessSchema } from '../components/common/SEOHead';
import { EXPERIENCES } from '../utils/constants';

export default function ThingsToDoVarkala() {
  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are the top things to do in Varkala and Papanasam Beach?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The top things to do in Varkala include thrilling water sports (Parasailing, Jet Skiing, Flying Fish, Speedboat), relaxing on Papanasam Beach, visiting Janardanaswamy Temple, exploring the North Cliff cafes, and watching stunning sunsets over the Arabian Sea.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need swimming skills to participate in Varkala water sports?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No swimming skills are required! At Joy Water Sports Varkala, all participants wear USCG-approved life jackets and are accompanied by certified rescue personnel.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I book water sports on Papanasam Beach?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can easily book online via Joy Water Sports website or send a direct WhatsApp message to secure your instant digital ticket with date and time slot confirmation.'
        }
      }
    ]
  };

  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://joywatersports.com' },
      { '@type': 'ListItem', position: 2, name: 'Things to Do in Varkala', item: 'https://joywatersports.com/things-to-do-in-varkala' }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <SEOHead
        title="Things to Do in Varkala & Papanasam Beach | Joy Water Sports Kerala"
        description="Discover the top things to do in Varkala! Experience Parasailing, Jet Skiing, Speedboat rides & beach adventures on Papanasam Beach. Book online today."
        canonicalUrl="https://joywatersports.com/things-to-do-in-varkala"
        keywords="things to do in Varkala, Papanasam beach water sports, Varkala water sports booking, Kerala holidays water sports, Varkala cliff activities, Jet ski Varkala"
        schema={[joyWaterSportsBusinessSchema, faqSchema, breadcrumbSchema]}
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
            Explore Activities
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-400/20 text-sky-400 text-xs font-bold px-3.5 py-1.5 rounded-full">
            <Compass size={14} />
            <span>VARKALA TOURISM & HOLIDAY GUIDE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Top Things to Do in <span className="text-[#00a6ff]">Varkala & Papanasam Beach</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            From soaring 300 feet above the Arabian Sea on a Parasail to carving ocean swells on a Yamaha WaveRunner, Varkala offers Kerala’s most thrilling coastal adventures. Here is your definitive guide to the best activities at Papanasam Beach.
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Keyword-Rich Activity Section */}
        <section className="space-y-8">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-[#00a6ff]" size={22} />
              1. High-Adrenaline Water Sports on Papanasam Beach
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Papanasam Beach is famous for its natural red cliffs, calm shorelines, and ideal wave conditions for water sports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {EXPERIENCES.map((exp) => (
              <div
                key={exp.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-[#00a6ff]/40 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="relative h-44 rounded-xl overflow-hidden">
                    <img src={exp.image} alt={`${exp.title} in Varkala`} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3 bg-slate-950/80 text-sky-400 font-bold text-xs px-2.5 py-1 rounded-lg backdrop-blur-md">
                      ₹{exp.price} / person
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{exp.title} in Varkala</h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {exp.description}
                  </p>
                </div>
                <Link
                  to={`/activity/${exp.id}`}
                  className="w-full bg-slate-800 hover:bg-[#00a6ff] text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 group"
                >
                  <span>View Details & Pricing</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Why Visit Varkala Article Content */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6">
          <h2 className="text-2xl font-bold text-white">Why Papanasam Beach is Kerala’s #1 Water Sports Hub</h2>
          <div className="prose prose-invert max-w-none text-slate-300 text-sm sm:text-base leading-relaxed space-y-4">
            <p>
              Located in the Thiruvananthapuram district of Kerala, <strong>Varkala</strong> is world-renowned for its unique geological cliff formations adjacent to the Arabian Sea. Unlike conventional flat beaches, <strong>Papanasam Beach</strong> combines scenic cliffside views with ideal open-water dynamics for high-speed water sports.
            </p>
            <p>
              At <strong>Joy Water Sports</strong>, safety and guest enjoyment come first. All rides are monitored by double-certified shoreline marshals and equipped with top-grade safety buoyancy life jackets. Whether you are traveling as a solo backpacker, couple, or family group, our customized water sports packages ensure maximum excitement at unbeatable rates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <Shield className="text-[#00a6ff]" size={24} />
              <div>
                <h4 className="text-sm font-bold text-white">100% Certified Safety</h4>
                <p className="text-xs text-slate-400">USCG life vests for non-swimmers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="text-[#00a6ff]" size={24} />
              <div>
                <h4 className="text-sm font-bold text-white">Papanasam Shoreline</h4>
                <p className="text-xs text-slate-400">Prime cliff launch location</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-[#00a6ff]" size={24} />
              <div>
                <h4 className="text-sm font-bold text-white">Instant Booking</h4>
                <p className="text-xs text-slate-400">Digital ticket confirmation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="text-[#00a6ff]" size={20} />
              Frequently Asked Questions about Varkala Water Sports
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-white text-sm">What is the best time for water sports in Varkala?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The best season is from October to May when ocean waters are calm, skies are clear, and visibility is highest. Daily operational hours are from 09:00 AM to 06:00 PM.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-white text-sm">Are non-swimmers allowed to do Parasailing and Jet Skiing?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Yes! Non-swimmers are welcome. High-buoyancy certified life jackets and expert instructors accompany every activity.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-white text-sm">Can I book water sports in advance for a group?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Absolutely! We offer custom combo packages (PACK 2500 and OVERALL 4500) for groups and families with priority slot scheduling.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-white text-sm">Where is Joy Water Sports located in Varkala?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We are situated right on Papanasam Beach shoreline below North Cliff, Varkala, Kerala 695141.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
