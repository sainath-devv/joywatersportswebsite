import React, { useEffect, useRef, useState } from 'react';

/**
 * HeroVectorVideo Component
 * 
 * Renders the hero background video `herovid.mp4` from the `/public` folder
 * with robust mobile autoplay compliance and fallback support.
 */
const HERO_FALLBACK = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

export default function HeroVectorVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const triedFallbackRef = useRef(false);
  const [videoSrc, setVideoSrc] = useState("/herovid.mp4");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;

    // Explicitly set DOM properties required for mobile Safari & Android Chrome autoplay
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    const playVideo = () => {
      if (!video) return;
      video.muted = true;
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    };

    // Attempt play immediately
    playVideo();

    // Use IntersectionObserver to play video when visible on mobile screens
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          playVideo();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(video);

    // Also trigger play on initial user touch/interaction if mobile browser blocked unmuted autoplay
    const handleTouchStart = () => {
      playVideo();
      window.removeEventListener('touchstart', handleTouchStart);
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [videoSrc, hasError]);

  const handleVideoError = () => {
    if (!triedFallbackRef.current) {
      triedFallbackRef.current = true;
      setVideoSrc(HERO_FALLBACK);
    } else {
      setHasError(true);
    }
  };

  const baseName = videoSrc.substring(0, videoSrc.lastIndexOf('.')) || videoSrc;

  return (
    <div className="relative w-full h-full overflow-hidden select-none pointer-events-none bg-slate-900">
      {!hasError ? (
        <video
          key={videoSrc}
          ref={videoRef}
          className="w-full h-full object-cover pointer-events-none"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onError={handleVideoError}
          style={{ transform: 'translateZ(0)' }}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={`${baseName}.webm`} type="video/webm" />
          <source src={`${baseName}.mov`} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-[#004E98] to-sky-950" />
      )}
    </div>
  );
}


