import React, { useState, useEffect, useRef } from 'react';

interface JoyPreloaderProps {
  onComplete?: () => void;
  brandName?: string;
  subText?: string;
  durationMs?: number; // Total loading animation duration (ms)
}

/**
 * Exact NeoLeaf-Style Liquid Wave Fill Preloader for "Joywatersports"
 * 
 * Recreates the exact reference screenshot:
 * - Matte dark charcoal canvas (#161616)
 * - Single bold "Joywatersports" display text
 * - Base unfilled text in dark graphite (#3a3a3c)
 * - Pure white (#ffffff) liquid wave flowing up inside the text from 0% to 100%
 * - SVG `<defs>` and `<use>` for 100% pixel-perfect text alignment (no ghosting or text offset)
 * - Small bottom-right "loading... 49 %" counter
 * - Smooth fade-out reveal upon hitting 100%
 */
export default function JoyPreloader({
  onComplete,
  durationMs = 2000,
}: JoyPreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isUnmounted, setIsUnmounted] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    // Lock body scrolling during preloader overlay
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const linearRatio = Math.min(elapsed / durationMs, 1);
      const easedRatio = easeOutCubic(linearRatio);
      const currentPct = Math.floor(easedRatio * 100);

      setProgress(currentPct);

      if (linearRatio < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setProgress(100);

        setTimeout(() => {
          setIsFading(true);
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';

          if (onComplete) {
            onComplete();
          }

          setTimeout(() => {
            setIsUnmounted(true);
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
          }, 600);
        }, 200);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [durationMs, onComplete]);

  if (isUnmounted) return null;

  return (
    <div
      id="joy-simple-preloader"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#ffffff',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        pointerEvents: isFading ? 'none' : 'auto',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        {/* Circle Container with JWS Logo inside */}
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center">
          {/* Inner Pure White Circle Badge */}
          <div className="relative w-full h-full rounded-full bg-white border border-slate-300 shadow-sm p-1.5 flex items-center justify-center overflow-hidden">
            {/* JWS Logo Image inside the Circle */}
            <img 
              src="https://lh3.googleusercontent.com/d/1lgPHCbInbPso1-uCrJq05TeR5XTZLmEx" 
              alt="JWS Logo" 
              className="w-full h-full object-contain relative z-10 bg-white"
            />
          </div>
        </div>

        {/* Loading... text centered below the circle */}
        <div className="flex items-center justify-center space-x-1 pt-0.5 pl-2.5">
          <span className="text-sm sm:text-base font-semibold text-slate-800 tracking-wider">Loading</span>
          <span className="flex space-x-0.5 text-sm sm:text-base font-bold text-[#00a6ff]">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
