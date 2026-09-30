'use client';

import React from 'react';
import RivletLogo, { RivletWatermark } from '@/components/brand/RivletLogo';

interface RivletLoaderProps {
  fullscreen?: boolean;
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function RivletLoader({
  fullscreen = true,
  message = 'Authenticating & Initializing Brand Console...',
  subMessage = 'Rivlet • Tirupur Sourcing Network',
  size = 'lg',
}: RivletLoaderProps) {
  const containerClasses = fullscreen
    ? 'fixed inset-0 min-h-screen min-h-[100dvh] w-full bg-[#07090e] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none z-50 animate-fade-in'
    : 'w-full py-16 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none animate-fade-in';

  return (
    <div className={containerClasses}>
      {/* Background Luxury Ambient Glows */}
      <div 
        aria-hidden="true" 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[450px] h-80 sm:h-[450px] bg-[rgba(205,160,82,0.12)] rounded-full blur-[130px] pointer-events-none" 
      />
      <div 
        aria-hidden="true" 
        className="absolute bottom-6 right-6 w-72 h-72 bg-[rgba(16,185,129,0.04)] rounded-full blur-[120px] pointer-events-none" 
      />

      {fullscreen && <RivletWatermark />}

      {/* Centerpiece Content */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm px-4">
        {/* Orbital Halo with Logo */}
        <div className="relative flex items-center justify-center">
          {/* Outer Spinning Orbit */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border border-[rgba(205,160,82,0.18)] border-t-[#cda052] border-r-[rgba(205,160,82,0.6)] animate-spin-slow absolute pointer-events-none" />

          {/* Inner Pulsing Halo */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#121624] via-[#0d101a] to-[#07090e] border border-[#263147] shadow-2xl flex items-center justify-center p-3">
            <RivletLogo 
              variant="gold" 
              size={size === 'sm' ? 'md' : 'lg'} 
              className="animate-luxury-pulse" 
            />
          </div>
        </div>

        {/* Brand Typography */}
        <div className="space-y-1.5">
          <div className="text-xs sm:text-sm font-bold text-white tracking-[0.28em] font-serif uppercase">
            R I V L E T
          </div>
          <div className="text-xs text-[#cbd5e1] font-medium tracking-wide">
            Executive Admin Console
          </div>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-48 sm:w-56 h-1 bg-[#141824] rounded-full overflow-hidden relative border border-[#263147]/60">
          <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#cda052] to-transparent animate-shimmer-slide rounded-full shadow-glow" />
        </div>

        {/* Status Message */}
        <div className="space-y-1">
          <p className="text-xs text-[#94a3b8] font-medium tracking-wide animate-pulse">
            {message}
          </p>
          {subMessage && (
            <p className="text-[10px] text-[#cda052]/80 font-mono tracking-wider uppercase">
              {subMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
