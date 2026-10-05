'use client';

import React from 'react';
import Image from 'next/image';

interface RivletLogoProps {
  variant?: 'gold' | 'white' | 'dark' | 'adaptive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  isWatermark?: boolean;
}

export default function RivletLogo({
  variant = 'gold',
  size = 'md',
  className = '',
  isWatermark = false,
}: RivletLogoProps) {
  // Size classes
  const sizeMap = {
    xs: 'h-5 w-auto max-w-[100px]',
    sm: 'h-6 w-auto max-w-[120px]',
    md: 'h-8 w-auto max-w-[150px]',
    lg: 'h-10 w-auto max-w-[190px]',
    xl: 'h-14 w-auto max-w-[260px]',
    custom: '',
  };

  // Watermark styling
  if (isWatermark) {
    return (
      <div 
        aria-hidden="true"
        className={`pointer-events-none select-none overflow-hidden ${className}`}
      >
        <img
          src="/brand/rivlet-logo.png"
          alt=""
          className="w-full h-auto object-contain opacity-[0.035] brightness-0 invert"
        />
      </div>
    );
  }

  // Variant color filters
  // Source PNG is black (#000000) on transparent background
  const getFilterStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'white':
        return { filter: 'brightness(0) invert(1)' };
      case 'dark':
        return { filter: 'brightness(0)' };
      case 'gold':
        // High-fidelity Champagne Gold filter
        return {
          filter: 'brightness(0) saturate(100%) invert(73%) sepia(28%) saturate(980%) hue-rotate(5deg) brightness(98%) contrast(92%)',
        };
      case 'adaptive':
      default:
        return {
          filter: 'brightness(0) invert(1)',
        };
    }
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/brand/rivlet-logo.png"
        alt="Rivlet Luxury Apparel"
        style={getFilterStyle()}
        className={`object-contain transition-all duration-200 ${sizeMap[size]}`}
      />
    </div>
  );
}

export function RivletWatermark({ className = '' }: { className?: string }) {
  return (
    <div 
      aria-hidden="true" 
      className={`pointer-events-none select-none fixed right-6 bottom-6 w-72 md:w-96 z-0 opacity-[0.03] overflow-hidden ${className}`}
    >
      <img
        src="/brand/rivlet-logo.png"
        alt=""
        style={{ filter: 'brightness(0) invert(1)' }}
        className="w-full h-auto object-contain"
      />
    </div>
  );
}

export function RivletWaveIcon({
  variant = 'gold',
  size = 24,
  className = '',
}: {
  variant?: 'gold' | 'white' | 'dark' | 'adaptive';
  size?: number;
  className?: string;
}) {
  const getFilterStyle = (): React.CSSProperties => {
    switch (variant) {
      case 'white':
        return { filter: 'brightness(0) invert(1)' };
      case 'dark':
        return { filter: 'brightness(0)' };
      case 'gold':
      default:
        return {
          filter: 'brightness(0) saturate(100%) invert(73%) sepia(28%) saturate(980%) hue-rotate(5deg) brightness(98%) contrast(92%)',
        };
    }
  };

  return (
    <img
      src="/brand/rivlet-wave.png"
      alt="Rivlet Wave Mark"
      style={getFilterStyle()}
      width={size}
      height={size}
      className={`object-contain select-none transition-transform duration-200 ${className}`}
    />
  );
}
