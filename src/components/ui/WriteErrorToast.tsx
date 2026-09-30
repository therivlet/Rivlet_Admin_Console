'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useAdminStore } from '@/lib/store';

export default function WriteErrorToast() {
  const { lastWriteError, clearWriteError } = useAdminStore();

  if (!lastWriteError) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] max-w-sm animate-fade-in">
      <div className="flex items-start gap-3 rounded-xl border border-rose-800/50 bg-[#170b0d] p-4 shadow-2xl">
        <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-rose-200 leading-relaxed">{lastWriteError}</p>
        <button
          onClick={clearWriteError}
          aria-label="Dismiss error"
          title="Dismiss"
          className="text-rose-400 hover:text-white flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
