'use client';

import React, { useState, useEffect } from 'react';
import { CalendarEventItem } from '@/lib/types';
import { Sparkles, Calendar, AlertTriangle, CheckCircle2, RefreshCw, X, Loader2 } from 'lucide-react';

interface CalendarAiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEventItem[];
  currentDate: Date;
}

export default function CalendarAiAdvisorModal({
  isOpen,
  onClose,
  events,
  currentDate,
}: CalendarAiAdvisorModalProps) {
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<{
    workloadRating: string;
    scheduleSummary: string;
    riskBottlenecks: string[];
    proactiveRecommendations: string[];
  } | null>(null);

  const fetchAdvice = () => {
    setLoading(true);
    const monthStr = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    fetch('/api/ai/calendar/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events,
        viewMonth: monthStr,
      }),
    })
      .then(res => res.json())
      .then(data => {
        setAdvice(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load calendar AI advice:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdvice();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0e121b] w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1e2638] flex items-center justify-between bg-slate-50 dark:bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#cda052]/10 border border-[#cda052]/20 text-[#cda052]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Schedule Cadence & Conflict Scanner
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8a96ae]">
                Predictive bottleneck detection across statutory cutoffs & milestones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchAdvice}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title="Re-scan"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-7 h-7 text-[#cda052] animate-spin" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Scanning monthly cadence for statutory congestion...
              </p>
            </div>
          ) : advice ? (
            <>
              {/* Rating Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-[#1e2638] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold block">
                    Cadence Pressure
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {advice.workloadRating}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#cda052]/10 text-[#cda052] border border-[#cda052]/20">
                  {events.length} Scheduled Deadlines
                </span>
              </div>

              {/* Summary */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {advice.scheduleSummary}
                </p>
              </div>

              {/* Risk Bottlenecks */}
              {advice.riskBottlenecks && advice.riskBottlenecks.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Identified Risk Bottlenecks</span>
                  </span>
                  <div className="space-y-1.5">
                    {advice.riskBottlenecks.map((risk, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-[11px]"
                      >
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {advice.proactiveRecommendations && advice.proactiveRecommendations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-[#cda052] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Proactive Preparation Buffers</span>
                  </span>
                  <div className="space-y-1.5">
                    {advice.proactiveRecommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-[#1e2638] text-slate-700 dark:text-slate-200 text-[11px] flex items-start gap-2"
                      >
                        <span className="text-[#cda052] font-bold">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-center py-6 text-slate-500">Could not generate schedule scan.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#1e2638] flex justify-end bg-slate-50 dark:bg-black/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-semibold text-xs border border-slate-200 dark:border-white/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
