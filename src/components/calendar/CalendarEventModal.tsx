'use client';

import React from 'react';
import {
  CalendarEventItem,
  CalendarEventStatus,
} from '@/lib/types';
import {
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  Trash2,
  Download,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { downloadIcsFile } from '@/lib/calendarStorage';

interface CalendarEventModalProps {
  event: CalendarEventItem | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: CalendarEventStatus) => void;
  onDeleteEvent: (id: string) => void;
}

export default function CalendarEventModal({
  event,
  onClose,
  onUpdateStatus,
  onDeleteEvent,
}: CalendarEventModalProps) {
  if (!event) return null;

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const isCompleted = event.status === 'completed';

  const handleDownloadSingleIcs = () => {
    downloadIcsFile([event], `Rivlet_Event_${event.id}.ics`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1e140e] w-full max-w-lg rounded-2xl border border-[#e8ded3] dark:border-[#3d2b20] p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#e8ded3] dark:border-white/10 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#7c5b1b] dark:text-[#f7d88c] border border-[rgba(205,160,82,0.3)]">
              {event.category.toUpperCase()}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#241812] dark:text-white mt-1.5">
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7d6b5d] dark:text-[#a99a8b] hover:text-[#241812] dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Content */}
        <div className="space-y-3.5 text-xs">
          {/* Time & Date */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#fcfaf7] dark:bg-black/40 border border-[#e8ded3] dark:border-white/5">
            <Calendar className="w-4 h-4 text-[#cda052] flex-shrink-0" />
            <div className="text-[#241812] dark:text-white">
              <span className="font-semibold">
                {startDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <div className="text-[#7d6b5d] dark:text-[#a99a8b] text-[11px] flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                <span>
                  {event.allDay
                    ? 'All Day Statutory Cutoff'
                    : `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <span className="text-[#604f41] dark:text-[#8895ad] font-semibold block mb-1">Details & Statutory Notes:</span>
              <p className="text-[#4a3b30] dark:text-[#cbd5e1] leading-relaxed p-3 rounded-xl bg-[#fcfaf7] dark:bg-black/20 border border-[#e8ded3] dark:border-white/5">
                {event.description}
              </p>
            </div>
          )}

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-xl bg-[#fcfaf7] dark:bg-black/40 border border-[#e8ded3] dark:border-white/5">
              <span className="text-[#7d6b5d] dark:text-[#8895ad] text-[11px] block">Status</span>
              <span className="font-semibold text-[#241812] dark:text-white capitalize mt-0.5 block">
                {event.status}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#fcfaf7] dark:bg-black/40 border border-[#e8ded3] dark:border-white/5">
              <span className="text-[#7d6b5d] dark:text-[#8895ad] text-[11px] block">Priority</span>
              <span className="font-semibold text-[#8c6b2d] dark:text-[#f7d88c] uppercase mt-0.5 block">
                {event.priority}
              </span>
            </div>
          </div>

          {/* Related link */}
          {event.relatedLink && (
            <div className="pt-2">
              <Link
                href={event.relatedLink}
                onClick={onClose}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[rgba(205,160,82,0.12)] hover:bg-[rgba(205,160,82,0.2)] text-xs font-semibold text-[#7c5b1b] dark:text-[#f7d88c] border border-[#cda052]/30 transition-colors"
              >
                <span>Navigate to Linked Module / Filing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-[#e8ded3] dark:border-white/10">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadSingleIcs}
              className="p-2 rounded-xl bg-[#f5efe6] dark:bg-black/40 hover:bg-[#ebdccb] dark:hover:bg-white/10 text-[#604f41] dark:text-[#a99a8b] hover:text-[#241812] dark:hover:text-white border border-[#d8c8b8] dark:border-white/10 transition-colors"
              title="Export to .ICS"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                onDeleteEvent(event.id);
                onClose();
              }}
              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/20 transition-colors"
              title="Delete Event"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => {
              onUpdateStatus(event.id, isCompleted ? 'pending' : 'completed');
              onClose();
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs transition-colors ${
              isCompleted
                ? 'bg-[#f5efe6] dark:bg-black/60 text-[#604f41] dark:text-[#a99a8b] border border-[#d8c8b8] dark:border-white/10'
                : 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black hover:bg-emerald-500'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isCompleted ? 'Mark Pending' : 'Mark Completed'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
