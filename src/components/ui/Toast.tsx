'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { cn } from '@/lib/cn';

type Tone = 'info' | 'ok' | 'danger';

interface ToastItem {
  id: string;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { lastWriteError, clearWriteError } = useAdminStore();

  const push = useCallback((message: string, tone: Tone = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  useEffect(() => {
    if (!lastWriteError) return;
    push(lastWriteError, 'danger');
    clearWriteError();
  }, [lastWriteError, clearWriteError, push]);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="phone-tabbar pointer-events-none fixed bottom-24 right-4 z-[180] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2 sm:bottom-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border bg-card p-3 text-sm shadow-card',
              toast.tone === 'danger' ? 'border-danger/40 text-danger' : toast.tone === 'ok' ? 'border-ok/40 text-ok' : 'border-line text-ink',
            )}
          >
            <p className="flex-1 leading-relaxed">{toast.message}</p>
            <button type="button" aria-label="Dismiss" className="text-muted hover:text-ink" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
