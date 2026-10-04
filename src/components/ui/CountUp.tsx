'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/lib/themeContext';
import { cn } from '@/lib/cn';

export default function CountUp({
  value,
  format,
  className,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const { reducedMotion } = useTheme();
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reducedMotion) {
      fromRef.current = value;
      setShown(value);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 180);
      const next = from + (value - from) * t;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reducedMotion]);

  const text = format ? format(shown) : Math.round(shown).toString();
  return <span className={cn('num', className)}>{text}</span>;
}
