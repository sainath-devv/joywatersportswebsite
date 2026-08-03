import React, { useRef, useEffect, useState } from 'react';
import { Film, Volume2, VolumeX } from 'lucide-react';

interface VideoCardProps {
  videoSrc: string;
  fallbackSrc?: string;
  title?: string;
  fileName?: string;
}

export default function VideoCard({ videoSrc, fallbackSrc, title, fileName }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrc, setCurrentSrc] = useState(videoSrc);
  const [triedFallback, setTriedFallback] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    setCurrentSrc(videoSrc);
    setTriedFallback(false);
    setHasError(false);
  }, [videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;
    
    // Explicitly set muted on DOM element for browser autoplay compliance
    video.muted = isMuted;

    const playVideo = () => {
      const promise = video.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // If autoplay failed, force muted and retry
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        });
      }
    };

    // Attempt play immediately on mount
    playVideo();

    const observer = new IntersectionObserver(([entry]) => { 
      if (entry.isIntersecting) { 
        playVideo();
      } else { 
        video.pause(); 
      } 
    }, { 
      threshold: 0.1 
    });

    observer.observe(video);
    
    return () => {
      observer.disconnect();
    };
  }, [currentSrc, hasError, isMuted]);

  const handleVideoError = () => {
    if (fallbackSrc && !triedFallback) {
      setTriedFallback(true);
      setCurrentSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuted = !isMuted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const baseName = videoSrc.substring(0, videoSrc.lastIndexOf('.')) || videoSrc;

  return (
    <div 
      className="w-[85vw] sm:w-[320px] md:w-full shrink-0 aspect-[4/5] relative overflow-hidden group rounded-2xl shadow-xl border border-gray-100/50 bg-gray-900 animate-fade-in select-none" 
      style={{ transform: 'translateZ(0)' }}
      onClick={(e) => {
        // Prevent click events from triggering scrollIntoView or snap jumps on mobile browsers
        e.preventDefault();
      }}
    >
      {!hasError ? (
        <>
          <video 
            ref={videoRef} 
            src={currentSrc}
            className="w-full h-full object-cover pointer-events-none" 
            muted 
            loop 
            autoPlay
            playsInline 
            preload="auto"
            onError={handleVideoError}
            style={{ transform: 'translateZ(0)' }}
          >
            <source src={currentSrc} type="video/mp4" />
            <source src={`${baseName}.webm`} type="video/webm" />
            <source src={`${baseName}.mov`} type="video/quicktime" />
            Your browser does not support the video tag.
          </video>

          {/* Sound Mute/Unmute Toggle Button */}
          <button
            type="button"
            tabIndex={-1}
            onClick={toggleMute}
            className="absolute top-3 right-3 z-10 p-2.5 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition-all cursor-pointer border border-white/20 shadow-md pointer-events-auto"
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-300 gap-3">
          <div className="p-4 rounded-full bg-slate-800/80 text-sky-400 border border-slate-700">
            <Film size={32} />
          </div>
          <p className="font-semibold text-white text-sm">{title || "Video Reel"}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
    </div>
  );
}

