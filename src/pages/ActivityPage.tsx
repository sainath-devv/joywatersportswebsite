import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight, 
  AlertCircle,
  Check,
  Sparkles,
  Info,
  ChevronLeft,
  ChevronRight,
  Camera,
  Maximize2,
  X
} from 'lucide-react';
import { EXPERIENCES } from '../utils/constants';
import Footer from '../components/common/Footer';
import SEOHead, { joyWaterSportsBusinessSchema } from '../components/common/SEOHead';

interface DetailCategory {
  title: string;
  icon: React.ElementType;
  tagline?: string;
  points: string[];
}

interface ActivitySpec {
  operatingWindow: string;
  description: string;
  tagline: string;
  heroImage?: string;
  gallery?: string[];
  highlights: string[];
  safetyRules: string[];
  riderGuidelines: string[];
  inclusions: string[];
  dressCode: string[];
}

const ACTIVITY_SPECS: Record<string, ActivitySpec> = {
  parasailing: {
    operatingWindow: "01:30 PM – 05:30 PM",
    description: "Fly high above the blue seas of Varkala and feel the ultimate thrill and panoramic coastal views. Our trained shoreline team handles each aspect of launch, steering/flying mechanics, and soft touch-downs.",
    tagline: "Buckle up for sky-high thrills and breathtaking aerial views as you fly high above Varkala's cliffs attached to a parachute tow line!",
    heroImage: "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/parasailingactivity.png",
    gallery: [
      "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/parasailingactivity.png"
    ],
    highlights: [
      "Soar up to 300+ feet in the air towed by a high-speed winch boat",
      "Panoramic 360° bird's-eye view of Varkala cliff and Arabian Sea",
      "Couple & tandem flights available",
      "Dipping available (dip is touch on the water)",
      "Certified master and hydraulic winch operator for maximum safety"
    ],
    safetyRules: [
      "ISO certified high-buoyancy marine life jackets mandatory for all riders",
      "Hydraulic winch-boat system operated by certified marine captains",
      "Continuous radio communication with shoreline wave marshals"
    ],
    riderGuidelines: [
      "Minimum age limit: 10 years and above",
      "Weight range: 35 kg minimum to 110 kg maximum per harness",
      "No prior swimming experience required for flight"
    ],
    inclusions: [
      "Certified Flight Master & Sea Captain guidance",
      "Complimentary secure beach lockers for personal belongings",
      "Optional HD GoPro action video recording"
    ],
    dressCode: [
      "Wear lightweight swimwear, board shorts, or quick-dry athletic wear",
      "Remove loose jewelry, watches, and non-waterproof items before flight"
    ]
  },
  jetski: {
    operatingWindow: "09:00 AM – 05:30 PM",
    description: "Speed across the ocean waves on a powerful Yamaha Waverunner personal watercraft with full marshal safety supervision.",
    tagline: "Feel the rush of pure adrenaline as you slice through ocean swells and carve high-speed wake turns on a high-powered personal watercraft!",
    gallery: [
      "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/jetski.png"
    ],
    highlights: [
      "High-speed wave carving on modern twin-cylinder Yamaha Waverunners",
      "Instant throttle response for thrill-seekers looking for speed",
      "Supervised by professional wave marshals in designated safety zones",
      "Tandem seating option to ride solo, with a friend, or with an instructor",
      "Automatic lanyard kill-switch system for complete rider safety"
    ],
    safetyRules: [
      "Automatic wrist lanyard engine kill-switch attached to rider",
      "Impact-absorbent neoprene life vests fitted prior to launch",
      "Designated shoreline safety perimeter & clear wave zone"
    ],
    riderGuidelines: [
      "Minimum rider age: 8 years and above (with instructor or guardian)",
      "Good physical health and readiness for ocean water sprays",
      "Swimming knowledge not required; guided escorts available"
    ],
    inclusions: [
      "Professional wave marshal escort & pre-launch brief",
      "Free dry locker storage at beach command desk",
      "Fuel & marine equipment usage included"
    ],
    dressCode: [
      "Comfortable beach shorts or swimwear recommended",
      "Apply waterproof sunscreen; leave dry footwear in lockers"
    ]
  },
  flyingfish: {
    operatingWindow: "10:00 AM – 04:30 PM",
    description: "Hang on tight as wind catches under this winged inflatable raft, lifting you airborne over ocean waves in a gravity-defying group experience.",
    tagline: "Prepare to catch air and hover over breaking ocean swells on a winged inflatable raft that takes flight as it speeds over waves!",
    gallery: [
      "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/flyingfish.png"
    ],
    highlights: [
      "Hover airborne as wind lifts the winged inflatable structure",
      "Exhilarating hydro-planing skips over breaking ocean waves",
      "High-energy group adrenaline rush for friends & thrill lovers",
      "Padded helmets and high-buoyancy life vests for every rider"
    ],
    safetyRules: [
      "Padded impact helmets & high-buoyancy vests provided",
      "Reinforced multi-point soft cord grab handles for secure grip",
      "Tension-calibrated speed boat towline with observer crew"
    ],
    riderGuidelines: [
      "Minimum age limit: 12 years and above",
      "Upper body grip strength recommended to hold handles firmly",
      "Not suitable for guests with recent back or neck injuries"
    ],
    inclusions: [
      "Professional towboat team & dedicated spotter observer",
      "Free ground locker storage for shoes & mobile phones",
      "Group photo sessions available at beach desk"
    ],
    dressCode: [
      "Fitted swimwear or rash guards recommended",
      "Barefoot ride; footwear kept at shoreline lockers"
    ]
  },
  speedboat: {
    operatingWindow: "09:00 AM – 05:30 PM",
    description: "A fast and roaring group boat ride around the Varkala coastline, perfect for families and friends who want ocean cruising paired with cliff views.",
    tagline: "Experience the ultimate ocean cruise with roaring wave skips, fast banking turns, and picturesque views of Varkala's famous red cliffs!",
    gallery: [
      "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/speedboat.png"
    ],
    highlights: [
      "Exhilarating high-speed banking turns along cliff shoreline",
      "Deep-V outboard marine engine with smooth wave piercing",
      "Spacious cushioned seating suitable for family group photos",
      "Steered by licensed sea captains with full safety protocols"
    ],
    safetyRules: [
      "High-visibility marine life jackets fitted for every passenger",
      "Licensed Offshore Sea Captain & certified navigator on board",
      "Adherence to Coast Guard maritime safety guidelines"
    ],
    riderGuidelines: [
      "Suitable for all age groups (children, adults, and seniors)",
      "Ideal choice for non-swimmers and family groups",
      "Must remain seated during high-speed ocean cruising"
    ],
    inclusions: [
      "Licensed captain & sea navigation guide",
      "Safety gear for infants, kids, and adults",
      "Complimentary beach locker storage"
    ],
    dressCode: [
      "Casual beach wear or quick-dry clothing",
      "Waterproof phone pouches recommended for photography"
    ]
  },
  bananaboat: {
    operatingWindow: "09:30 AM – 05:00 PM",
    description: "A hilarious and splash-filled ride on a banana-shaped inflatable pulled by a speed boat, perfect for families and groups looking for fun and laughter.",
    tagline: "Gather your group for a laughter-packed adventure as you bounce over boat wakes and balance together on a yellow banana tube!",
    gallery: [
      "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/Bananaboat.png"
    ],
    highlights: [
      "Classic splashy fun with coordinated group weight shifts",
      "Bouncing over boat wakes with refreshing ocean splashes",
      "Optional gentle water drop-off into calm shoreline waters",
      "Safe, buoyancy-supported fun suitable for non-swimmers"
    ],
    safetyRules: [
      "High-buoyancy life jackets secured on all participants",
      "Multi-chamber heavy duty inflatable with quick-release tow",
      "Trained safety boat captain keeping watch throughout the ride"
    ],
    riderGuidelines: [
      "Capacity: 4 to 8 riders per group trip",
      "Minimum age limit: 6 years and above",
      "No swimming required; complete buoyancy support provided"
    ],
    inclusions: [
      "Dedicated towboat pilot & observer crew",
      "Free locker usage for dry clothes and valuables",
      "Group memory photos at shoreline"
    ],
    dressCode: [
      "Tight swimwear or shorts; avoid loose slippers",
      "Remove glasses or secure with floating straps"
    ]
  },
  crazysofa: {
    operatingWindow: "10:00 AM – 05:00 PM",
    description: "Sit tight, hold on, and bounce over ocean waves with our crazy inflatable sofa pulled at high speed across the sea.",
    tagline: "Relax in sofa-style comfort while getting whipped across ocean waves at high speed for a thrilling lounge-on-water experience!",
    gallery: [
      "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/crazysofa.png"
    ],
    highlights: [
      "Ultra-comfortable couch seating with soft padded back support",
      "High stability with exciting lateral centrifugal slides",
      "Bouncing over ocean swells with refreshing sea sprays",
      "Fun for non-swimmers, couples, and family members"
    ],
    safetyRules: [
      "Three-chamber heavy cushion hover-sofa for safety redundancy",
      "ISO certified life vests fitted for all riders",
      "Lifesaver observer escorting every excursion"
    ],
    riderGuidelines: [
      "Minimum age limit: 8 years and above",
      "Suitable for riders seeking stable yet exciting thrills",
      "Hold both side strap handles firmly during turns"
    ],
    inclusions: [
      "Certified tow captain & sea observer",
      "Secure shoreline lockers for dry items",
      "Action photo add-on option available"
    ],
    dressCode: [
      "Swimwear or casual beach shorts",
      "Sunscreen recommended for open water exposure"
    ]
  },
  doughnutboat: {
    operatingWindow: "10:00 AM – 05:00 PM",
    description: "A spinning, circular tube ride on the waves that will leave you laughing and covered in ocean spray over ocean swells.",
    tagline: "Hold on tight for 360-degree rotational spins and splashy turns on a circular tube towed across breaking boat wakes!",
    gallery: [
      "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/Dougnutboat.png"
    ],
    highlights: [
      "360-degree rotational spinning turns over ocean swells",
      "Centrifugal force skips over boat wake for maximum excitement",
      "High-energy duo and group thrill for friends & families",
      "High-buoyancy life vests and soft grip handles for safety"
    ],
    safetyRules: [
      "Double-chamber reinforced circular tubing structure",
      "ISO high-buoyancy safety vests fitted on all riders",
      "Emergency quick-release marine tow harness"
    ],
    riderGuidelines: [
      "Capacity: 2 to 4 riders per tube",
      "Minimum age limit: 10 years and above",
      "Tuck knees inward and hold center handles firmly"
    ],
    inclusions: [
      "Professional boat operator & spotter crew",
      "Free ground locker storage at beach hub",
      "GoPro video recording optional"
    ],
    dressCode: [
      "Quick-dry beach wear or athletic shorts",
      "No metal accessories or loose jewelry"
    ]
  },
  atv: {
    operatingWindow: "06:30 AM – 07:00 PM",
    description: "Ride an All-Terrain Vehicle on the soft sandy shores of Varkala for a fun beach quad adventure with thumb-throttle controls.",
    tagline: "Conquer soft sandbanks and beach tracks on a powerful 250cc 4-stroke All-Terrain Quad Bike with panoramic coastline views!",
    gallery: [
      "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/atv.png"
    ],
    highlights: [
      "Ride a 250cc automatic quad bike across shoreline sand tracks",
      "Easy thumb-throttle controls suitable for first-time riders",
      "Stunning morning and sunset coastline track views",
      "Safety helmets, goggles, and pacing marshals provided"
    ],
    safetyRules: [
      "Approved impact-absorbent helmet, shield & goggles provided",
      "Designated shoreline track boundaries with pacing marshals",
      "Speed limits strictly enforced for guest safety"
    ],
    riderGuidelines: [
      "Minimum driver age: 15 years and above",
      "Follow marshal track guidelines at all times",
      "Single and tandem rider configurations available"
    ],
    inclusions: [
      "250cc Quad bike fuel & safety helmet kit",
      "Marshal guidance & track orientation",
      "Locker storage for shoes and bags"
    ],
    dressCode: [
      "Sturdy sandals or closed-toe shoes recommended",
      "Comfortable outdoor pants or long shorts"
    ]
  }
};

export default function ActivityPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const experience = EXPERIENCES.find(e => e.id === id);

  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveImageIndex(0);
    if (experience) {
      document.title = `${experience.title} | Joy Water Sports`;
    }
  }, [id, experience]);

  if (!experience) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6">
        <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center text-[#004E98] mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-2xl font-bold text-[#0B1E3C] mb-2">Activity Not Found</h1>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
          The water sports experience you are looking for does not exist or has been moved.
        </p>
        <button 
          type="button" 
          onClick={() => navigate("/")} 
          className="bg-[#004E98] hover:bg-[#003B73] text-white px-6 py-3 font-semibold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Return to All Activities</span>
        </button>
      </div>
    );
  }

  const spec = (id && ACTIVITY_SPECS[id]) ? ACTIVITY_SPECS[id] : {
    operatingWindow: "09:00 AM – 05:30 PM",
    description: experience.description,
    tagline: "Experience high-adrenaline water sports along Varkala's stunning coastline with expert safety supervision!",
    highlights: [
      "High-adrenaline marine water sports adventure",
      "Panoramic ocean coastline views of Varkala",
      "Supervised by Coast Guard trained instructors",
      "Modern watercraft & premium safety equipment"
    ],
    safetyRules: [
      "ISO 12402 certified high-buoyancy life jackets provided",
      "Trained wave marshals escort every ride",
      "Daily marine safety inspections on all gear"
    ],
    riderGuidelines: [
      "Minimum age: 8 years and above",
      "No advanced swimming knowledge required",
      "Good general physical health"
    ],
    inclusions: [
      "Professional instructor & captain guidance",
      "Complimentary dry locker storage at beach desk",
      "HD photo & video add-on options available"
    ],
    dressCode: [
      "Comfortable quick-dry beachwear or swimwear",
      "Leave valuables in complimentary lockers"
    ]
  };

  const galleryImages = spec.gallery && spec.gallery.length > 0 
    ? spec.gallery 
    : [experience.image, ...(experience.images || [])];

  const categories: DetailCategory[] = [
    {
      title: "Ride Highlights",
      icon: Sparkles,
      tagline: spec.tagline,
      points: spec.highlights
    }
  ];

  const handleBookNow = () => {
    navigate(`/?book=${encodeURIComponent(experience.title.toUpperCase())}#booking-section`);
  };

  const coverImage = galleryImages[0] || experience.image;

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 font-sans antialiased">
      <SEOHead
        title={`${experience.title} in Varkala | Joy Water Sports Papanasam Beach`}
        description={`Book ${experience.title} in Varkala at Papanasam Beach for ₹${experience.price}. ${spec.tagline.slice(0, 110)} Fast booking with certified safety.`}
        canonicalUrl={`https://joywatersports.com/activity/${id}`}
        ogImage={coverImage}
        keywords={`${experience.title} Varkala, ${experience.title} Papanasam beach, water sports Varkala, Varkala water sports booking, ${experience.title} price Varkala`}
        schema={[
          joyWaterSportsBusinessSchema,
          {
            '@type': 'Product',
            name: `${experience.title} in Varkala`,
            image: coverImage,
            description: spec.description,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: experience.price,
              availability: 'https://schema.org/InStock',
              url: `https://joywatersports.com/activity/${id}`
            },
            provider: {
              '@type': 'LocalBusiness',
              name: 'Joy Water Sports Varkala'
            }
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://joywatersports.com' },
              { '@type': 'ListItem', position: 2, name: 'Activities', item: 'https://joywatersports.com/#activities' },
              { '@type': 'ListItem', position: 3, name: experience.title, item: `https://joywatersports.com/activity/${id}` }
            ]
          }
        ]}
      />
      {/* Top Breadcrumb Navigation Bar */}
      <div className="bg-[#080d1a] text-slate-400 py-3.5 px-6 sm:px-12 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs font-medium">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1 text-[#00a6ff]" />
            <span>Back to All Water Sports</span>
          </Link>
          <div className="flex items-center gap-3 text-slate-400 text-xs hidden sm:flex">
            <img 
              src="https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx" 
              alt="Joy Water Sports Logo" 
              className="w-5 h-5 object-contain"
            />
            <span className="font-semibold text-white">Joy Water Sports</span>
            <span>/</span>
            <span>Varkala Excursions</span>
            <span>/</span>
            <span className="text-[#00a6ff] font-semibold">{experience.title}</span>
          </div>
        </div>
      </div>

      {/* Dark Hero Header Banner with Background Image */}
      <div className="relative text-white py-24 sm:py-36 lg:py-44 px-6 sm:px-12 overflow-hidden bg-[#080d1a] min-h-[360px] sm:min-h-[440px] flex items-center">
        <img 
          src={spec?.heroImage || (id === 'parasailing' ? "https://ubitbdocjzffvfkketyr.supabase.co/storage/v1/object/public/JWS/JWS-WEBSITE/parasailingactivity.png" : experience.image)} 
          alt={`${experience.title} background`}
          className="absolute inset-0 w-full h-full object-cover opacity-95"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080d1a]/50 via-[#080d1a]/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080d1a]/40 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto w-full relative z-10">
          <span className="text-xs sm:text-sm font-extrabold text-[#00a6ff] tracking-[0.25em] uppercase block mb-3 drop-shadow-md">
            VARKALA EXCURSION
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-wider text-white leading-none drop-shadow-xl">
            {experience.title}
          </h1>
          <div className="w-16 h-1.5 bg-[#00a6ff] mt-5 rounded-full shadow-sm"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 space-y-12">
        
        {/* Top Section: Ride Highlights & Details (Left) + Booking Card (Right) with Equal Height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* Left Column: Ride Highlights & Experience Description */}
          <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
            {/* The Adventure Experience Description */}
            <div className="space-y-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                The Adventure <span className="text-[#00a6ff]">Experience</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                {spec.description}
              </p>
            </div>

            {/* Ride Highlights */}
            <div className="flex-1 flex flex-col justify-between space-y-4 pt-4 border-t border-slate-100">
              {categories.map((cat, catIdx) => (
                <div key={catIdx} className="bg-[#f8fafc] rounded-2xl p-5 border border-slate-100 space-y-3 shadow-2xs flex-1 flex flex-col justify-center">
                  {cat.tagline && (
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed italic bg-white/70 p-3 rounded-xl border border-slate-200/60">
                      "{cat.tagline}"
                    </p>
                  )}
                  <ul className="space-y-2.5 pl-1 pt-1">
                    {cat.points.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                        <div className="w-4 h-4 rounded-full bg-[#00a6ff] text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check size={11} strokeWidth={3} />
                        </div>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Equal Height Booking Card */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col justify-end h-full space-y-6">
              
              {/* Header Rate Label */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold tracking-widest text-[#00a6ff] uppercase block">
                    STANDARD EXCURSION RATE
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                      ₹{experience.price}/–
                    </span>
                    <span className="text-xs text-slate-400 font-medium">person</span>
                  </div>
                </div>

                {/* Metadata Key-Value List */}
                <div className="space-y-3.5 pt-4 border-t border-slate-100/80 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-normal text-slate-400">Optimal Operating Window</span>
                    <span className="font-bold text-slate-900">{spec.operatingWindow}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-normal text-slate-400">Primary Guidance</span>
                    <span className="font-bold text-slate-900">Certified Instructor</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-normal text-slate-400">Operator Status</span>
                    <span className="font-bold text-emerald-500">Active Slots</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-normal text-slate-400">Safety Gear</span>
                    <span className="font-bold text-emerald-600">100% Included</span>
                  </div>
                </div>
              </div>

              {/* Bottom CTA & Note */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleBookNow}
                  className="w-full py-4 bg-[#0099ff] hover:bg-[#0088e6] text-white font-bold text-sm rounded-xl shadow-md shadow-sky-200/60 transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  <span>BOOK THIS RIDE</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>

                <p className="text-[11px] text-slate-400 leading-relaxed text-center font-normal px-2">
                  Receive prompt booking tickets via WhatsApp. Coordinate with on-field captains directly at the beach when you arrive.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Center Positioned Image Carousel Section */}
        <div className="max-w-4xl mx-auto space-y-6 pt-4">
          <div className="text-center space-y-2">
            <h3 className="text-xs font-black tracking-widest text-[#00a6ff] uppercase inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-100">
              <Camera size={14} className="text-[#00a6ff]" />
              ACTION GALLERY
            </h3>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Glimpse of the <span className="text-[#00a6ff]">Thrill</span>
            </h2>
          </div>

          {/* Main Featured Slide Box */}
          <div className="relative group rounded-3xl overflow-hidden bg-slate-950 aspect-[16/10] sm:aspect-[16/9] shadow-2xl border border-slate-100 max-w-3xl mx-auto">
            <img 
              src={galleryImages[activeImageIndex]} 
              alt={`${experience.title} action shot ${activeImageIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />

            {/* Left Navigation Arrow */}
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/70 hover:bg-[#00a6ff] text-white backdrop-blur-md flex items-center justify-center transition-all opacity-90 hover:opacity-100 cursor-pointer border border-white/20 shadow-lg"
                aria-label="Previous image"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Right Navigation Arrow */}
            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-900/70 hover:bg-[#00a6ff] text-white backdrop-blur-md flex items-center justify-center transition-all opacity-90 hover:opacity-100 cursor-pointer border border-white/20 shadow-lg"
                aria-label="Next image"
              >
                <ChevronRight size={22} />
              </button>
            )}

            {/* Counter pill */}
            <div className="absolute left-4 bottom-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full font-semibold border border-white/10">
              {activeImageIndex + 1} / {galleryImages.length}
            </div>

            {/* Lightbox Trigger Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute right-4 bottom-4 bg-slate-900/80 hover:bg-[#00a6ff] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer shadow-md"
            >
              <Maximize2 size={13} />
              <span>Fullscreen</span>
            </button>
          </div>

          {/* Carousel Thumbnail Bar (Centered) */}
          {galleryImages.length > 1 && (
            <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none max-w-3xl mx-auto">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activeImageIndex === idx 
                      ? 'border-[#00a6ff] ring-2 ring-[#00a6ff]/30 scale-105 shadow-md' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer border border-white/20 transition-all z-10"
          >
            <X size={22} />
          </button>

          <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center">
            <img
              src={galleryImages[activeImageIndex]}
              alt={`${experience.title} fullscreen`}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-[#00a6ff] text-white flex items-center justify-center cursor-pointer border border-white/20 transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-[#00a6ff] text-white flex items-center justify-center cursor-pointer border border-white/20 transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
