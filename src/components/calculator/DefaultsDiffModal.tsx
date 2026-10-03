'use client';

import React from 'react';
import { 
  X, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';

export interface DiffItem {
  key: string;
  label: string;
  category: string;
  currentValue: string;
  defaultValue: string;
}

interface DefaultsDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  diffItems: DiffItem[];
  productName: string;
  productCode: string;
}

export default function DefaultsDiffModal({
  isOpen,
  onClose,
  onConfirm,
  diffItems,
  productName,
  productCode,
}: DefaultsDiffModalProps) {
  if (!isOpen) return null;

  // Group diffs by category
  const categories = Array.from(new Set(diffItems.map(d => d.category)));

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#0b0e17] border border-[#222b40] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="p-5 border-b border-[#1c2438] bg-gradient-to-r from-[#121726] to-[#0e121e] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(205,160,82,0.15)] border border-[rgba(205,160,82,0.3)] text-[#cda052] flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-wide">
                    Apply Brand Default Values
                  </h2>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/50">
                    {diffItems.length} {diffItems.length === 1 ? 'Mismatch' : 'Mismatches'}
                  </span>
                </div>
                <p className="text-xs text-[#8a95ae]">
                  Review parameter changes before updating <strong className="text-white font-mono">{productCode || 'RIV-'}</strong>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#7c869d] hover:text-white hover:bg-[#192236] transition-colors"
              title="Cancel and close dialog"
              aria-label="Cancel and close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Safety Notice Callout */}
          <div className="px-5 pt-4 pb-2">
            <div className="p-3 bg-[rgba(205,160,82,0.08)] border border-[rgba(205,160,82,0.25)] rounded-xl flex items-start gap-2.5 text-xs text-[#d5dcee]">
              <ShieldCheck className="w-4 h-4 text-[#cda052] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#e6c875]">Protected Identity Fields:</strong> Product Style Name, Style SKU Code, Customer MRP, and Base Factory FOB Cost will <strong>remain untouched</strong>. Only the parameters listed below will receive the standard brand defaults.
              </div>
            </div>
          </div>

          {/* Diff Table Body */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 custom-scrollbar text-xs">
            {categories.map((cat) => {
              const items = diffItems.filter(d => d.category === cat);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="text-[10px] font-bold text-[#cda052] uppercase tracking-wider px-1">
                    {cat}
                  </div>
                  <div className="bg-[#0f1320] border border-[#1e263a] rounded-xl overflow-hidden divide-y divide-[#1a2134]">
                    {items.map((item) => (
                      <div key={item.key} className="p-3 flex items-center justify-between gap-3 hover:bg-[#141a2c]/50 transition-colors">
                        <div className="flex-1">
                          <span className="font-semibold text-white block text-xs">{item.label}</span>
                          <span className="text-[10px] text-[#6d7892] font-mono">{item.key}</span>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div className="min-w-[90px]">
                            <span className="text-[10px] uppercase font-mono text-[#8a95ae] block">Current</span>
                            <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 inline-block">
                              {item.currentValue}
                            </span>
                          </div>

                          <ArrowRight className="w-3.5 h-3.5 text-[#52607c] flex-shrink-0" />

                          <div className="min-w-[90px] text-right">
                            <span className="text-[10px] uppercase font-mono text-emerald-400 block">Default Received</span>
                            <span className="font-mono text-xs font-semibold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 inline-block">
                              {item.defaultValue}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#1c2438] bg-[#090c14] flex items-center justify-between gap-3">
            <span className="text-[11px] text-[#76829c]">
              Are you okay to proceed with applying these defaults?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#141a29] hover:bg-[#1a2236] text-[#cbd5e1] hover:text-white font-semibold text-xs border border-[#242f47] transition-colors"
              >
                Cancel / Keep Current
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Apply Defaults</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
