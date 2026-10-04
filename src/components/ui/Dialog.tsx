'use client';

import React, { useEffect, useId, useRef } from 'react';
import ModalPortal from '@/components/ui/ModalPortal';
import { cn } from '@/lib/cn';

export default function Dialog({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previous = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previous.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable?.[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute('disabled'));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ModalPortal isOpen>
      <div className="fixed inset-0 z-[150] flex items-end justify-center bg-[var(--overlay)] p-0 sm:items-center sm:p-4" onClick={onClose}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn('max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-line bg-card p-5 shadow-card sm:max-w-lg sm:rounded-2xl', className)}
          onClick={(event) => event.stopPropagation()}
        >
          <h2 id={titleId} className="text-base font-semibold text-ink">{title}</h2>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
}
