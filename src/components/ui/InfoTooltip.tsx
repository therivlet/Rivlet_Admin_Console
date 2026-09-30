'use client';

import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  title?: string;
  text: string;
  className?: string;
  side?: 'top' | 'bottom';
}

/**
 * A small circled-info icon that reveals an explanatory tooltip on hover/focus.
 * Keyboard accessible: the icon is a real <button> so Tab + focus shows the
 * same tooltip a mouse hover would.
 */
export default function InfoTooltip({ title, text, className = '', side = 'top' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        aria-label={title ? `More info: ${title}` : 'More info'}
        className="text-[#7c869d] hover:text-[#cda052] transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          role="tooltip"
          className={`absolute z-50 w-64 p-3 rounded-lg bg-[#141724] border border-[#2a3346] shadow-2xl text-left ${
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 -translate-x-1/2`}
        >
          {title && <p className="text-xs font-semibold text-[#e6c875] mb-1">{title}</p>}
          <p className="text-[11px] text-[#cbd5e1] leading-relaxed">{text}</p>
        </div>
      )}
    </span>
  );
}
