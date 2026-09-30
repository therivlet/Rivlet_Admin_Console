'use client';

import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import ModalPortal from './ModalPortal';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean; // red styling for destructive actions (default true)
}

interface ConfirmDialogProps extends ConfirmOptions {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <ModalPortal isOpen={true}>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      >
        <div
          className="w-full max-w-sm rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex items-start gap-3 mb-5">
            <div
              className={`p-2 rounded-xl flex-shrink-0 border ${
                danger
                  ? 'bg-rose-950/50 text-rose-400 border-rose-800/50'
                  : 'bg-amber-950/50 text-amber-400 border-amber-800/50'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 className="text-sm font-semibold text-white">{title}</h2>
              <p className="text-xs text-[#94a3b8] mt-1.5 leading-relaxed">{message}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                danger
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:brightness-110'
                  : 'bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black hover:brightness-110'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
