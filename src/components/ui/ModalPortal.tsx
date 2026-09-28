'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  children: ReactNode;
  isOpen?: boolean;
}

/**
 * ModalPortal mounts its children directly onto document.body using React Portals.
 * This guarantees:
 * 1. The modal is never trapped inside ancestor containers with CSS transform, filter, perspective, or overflow.
 * 2. The modal is always perfectly centered relative to the true browser window viewport, regardless of how far the page was scrolled.
 * 3. Body scroll is automatically locked while the modal is open, preventing background scroll desynchronization.
 */
export default function ModalPortal({ children, isOpen = true }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen || !mounted) return;

    // Lock background scrolling
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    
    // Prevent layout shift from scrollbar disappearing
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isOpen, mounted]);

  if (!mounted || !isOpen) return null;

  return createPortal(children, document.body);
}
