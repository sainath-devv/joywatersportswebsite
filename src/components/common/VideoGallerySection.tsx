import React from 'react';
import VideoCard from './VideoCard';

// Using local MP4 assets on /public with working sample video fallbacks
const REEL_1 = "/reel1.mp4";
const REEL_2 = "/reel2.mp4";
const REEL_3 = "/reel3.mp4";

const REEL_1_FALLBACK = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const REEL_2_FALLBACK = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
const REEL_3_FALLBACK = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4";

export default function VideoGallerySection() {
  return (
    <section className="relative w-full flex flex-col items-center py-14 lg:py-24 bg-gray-100 overflow-hidden">
      <div className="w-full max-w-5xl flex flex-col items-center text-center px-4 pb-6 sm:pb-10">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-display text-deep-blue leading-tight font-semibold text-center">
          Comfortable Stay & <span className="text-sky-blue">Amazing Stories</span>
        </h2>
      </div>

      <div 
        className="w-full max-w-6xl flex overflow-x-auto md:grid md:grid-cols-3 gap-3.5 sm:gap-6 mt-2 sm:mt-8 px-4 md:px-0 pb-6 md:pb-0 scrollbar-hide" 
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        <VideoCard videoSrc={REEL_1} fallbackSrc={REEL_1_FALLBACK} title="Reel 1" fileName="reel1.mp4" />
        <VideoCard videoSrc={REEL_2} fallbackSrc={REEL_2_FALLBACK} title="Reel 2" fileName="reel2.mp4" />
        <VideoCard videoSrc={REEL_3} fallbackSrc={REEL_3_FALLBACK} title="Reel 3" fileName="reel3.mp4" />
      </div>
    </section>
  );
}

