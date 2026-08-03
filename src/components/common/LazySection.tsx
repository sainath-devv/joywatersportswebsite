import React, { useState, useEffect, useRef } from 'react';
import { Waves } from 'lucide-react';

interface LazySectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  id?: string;
}

export default function LazySection({
  children,
  fallback,
  threshold = 0.05,
  rootMargin = '150px',
  className = '',
  id,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If IntersectionObserver is not supported, show immediately
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      { threshold, rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={containerRef} id={id} className={`transition-opacity duration-500 ${className}`}>
      {isVisible ? (
        children
      ) : (
        fallback || (
          <div className="w-full py-16 px-6 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl animate-pulse my-6 border border-sky-900/30 min-h-[220px] shadow-lg text-white">
            <div className="w-12 h-12 rounded-2xl bg-sky-900/40 border border-sky-500/30 mb-4 flex items-center justify-center relative">
              <Waves className="w-6 h-6 text-sky-400 animate-bounce" />
            </div>
            <div className="w-48 h-3.5 bg-slate-800 rounded-full mb-3"></div>
            <div className="w-72 h-2.5 bg-slate-800/60 rounded-full"></div>
            <p className="text-[10px] font-mono text-sky-400/70 tracking-widest uppercase mt-4 flex items-center gap-1">
              Loading Ocean Experience...
            </p>
          </div>
        )
      )}
    </div>
  );
}
