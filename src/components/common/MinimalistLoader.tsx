import React from 'react';
import JoyPreloader from './JoyPreloader';
import { Waves, Compass, Sparkles } from 'lucide-react';

interface MinimalistLoaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export default function MinimalistLoader({ 
  message = "Loading", 
  subMessage = "Preparing Your Ocean Adventure...",
  fullScreen = true 
}: MinimalistLoaderProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 select-none font-sans">
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
            <span className="text-sm sm:text-base font-semibold text-slate-800 tracking-wider">{message}</span>
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

  return (
    <div className="w-full py-16 bg-slate-900/90 rounded-3xl border border-sky-900/30 text-white flex flex-col items-center justify-center relative overflow-hidden select-none my-6">
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00C2D1] to-[#004E98] p-0.5 shadow-lg shadow-[#00C2D1]/30">
          <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-[14px] flex items-center justify-center">
            <Waves className="w-7 h-7 text-[#00C2D1] animate-bounce" />
          </div>
        </div>
      </div>

      <div className="space-y-1 text-center max-w-sm px-4">
        <div className="flex items-center justify-center gap-2">
          <Compass className="w-4 h-4 text-[#00C2D1] animate-spin" style={{ animationDuration: '8s' }} />
          <h3 className="text-xs font-black tracking-[0.25em] bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-transparent uppercase">
            {message}
          </h3>
          <Sparkles className="w-3.5 h-3.5 text-[#FF6B4A] animate-pulse" />
        </div>
        
        <p className="text-[11px] text-slate-300/80 font-medium tracking-wide">
          {subMessage}
        </p>
      </div>

      <div className="w-40 h-1 bg-slate-800/80 rounded-full overflow-hidden relative border border-sky-900/30 mt-4">
        <div className="absolute inset-y-0 bg-gradient-to-r from-[#00C2D1] via-cyan-300 to-[#FF6B4A] w-16 rounded-full animate-[waveSlide_1.6s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes waveSlide {
          0% { left: -40%; }
          50% { left: 100%; }
          100% { left: -40%; }
        }
      `}</style>
    </div>
  );
}
