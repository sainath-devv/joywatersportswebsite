import React, { useEffect, useRef, useState } from 'react';

/**
 * HeroVectorVideo Component
 * 
 * Renders the hero background video `herovid.mp4` from the `/public` folder.
 */
const HERO_FALLBACK = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

export default function HeroVectorVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState("/herovid.mp4");
  const [triedFallback, setTriedFallback] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    video.muted = true;
    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    };
    playVideo();
  }, [videoSrc, hasError]);

  const handleVideoError = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      setVideoSrc(HERO_FALLBACK);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none pointer-events-none bg-slate-900">
      {!hasError ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={handleVideoError}
          style={{ transform: 'translateZ(0)' }}
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-[#004E98] to-sky-950" />
      )}
      {/* Video container */}
    </div>
  );
}

