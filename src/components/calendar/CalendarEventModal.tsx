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
  Repeat,
  Edit3,
} from 'lucide-react';
import Link from 'next/link';
import { downloadIcsFile } from '@/lib/calendarStorage';

interface CalendarEventModalProps {
  event: CalendarEventItem | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: CalendarEventStatus) => void;
  onDeleteEvent: (id: string) => void;
  onEditEvent?: (event: CalendarEventItem) => void;
}

export default function CalendarEventModal({
  event,
  onClose,
  onUpdateStatus,
  onDeleteEvent,
  onEditEvent,
}: CalendarEventModalProps) {
  if (!event) return null;

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const isCompleted = event.status === 'completed';

  const handleDownloadSingleIcs = () => {
    downloadIcsFile([event], `Rivlet_Event_${event.id}.ics`);
  };

  const getRecurrenceLabel = () => {
    if (!event.recurrence || event.recurrence === 'none') return null;
    if (event.recurrenceRule) return event.recurrenceRule;
    switch (event.recurrence) {
      case 'monthly':
        return `Every month on the ${startDate.getDate()}`;
      case 'yearly':
        return `Every year on ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'weekly':
        return `Every week on ${startDate.toLocaleDateString('en-US', { weekday: 'long' })}`;
      case 'custom':
        return 'Custom recurrence schedule';
      default:
        return 'Recurring event';
    }
  };

  const recurrenceLabel = getRecurrenceLabel();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0e121b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638] mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#cda052]/10 text-[#cda052] border border-[#cda052]/20">
                {event.category.toUpperCase()}
              </span>
              {recurrenceLabel && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-[#f7d88c] border border-amber-500/20 flex items-center gap-1 font-mono">
                  <Repeat className="w-2.5 h-2.5" />
                  <span>Recurring</span>
                </span>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5">
              {event.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details Content */}
        <div className="space-y-3.5 text-xs">
          {/* Time & Date */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-[#1e2638]">
            <Calendar className="w-4 h-4 text-[#cda052] flex-shrink-0" />
            <div className="text-slate-900 dark:text-white">
              <span className="font-semibold">
                {startDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                <span>
                  {event.allDay
                    ? 'All Day Statutory Cutoff'
                    : `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                </span>
              </div>
            </div>
          </div>

          {/* Recurrence Rule Banner */}
          {recurrenceLabel && (
            <div className="p-3 rounded-xl bg-amber-500/10 dark:bg-[rgba(205,160,82,0.08)] border border-amber-500/30 dark:border-[#cda052]/40 text-amber-800 dark:text-[#f7d88c] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-[#cda052] flex-shrink-0" />
                <div>
                  <span className="font-semibold block text-xs">Recurrence Schedule</span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                    {recurrenceLabel}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <span className="text-slate-600 dark:text-[#8a96ae] font-semibold block mb-1">Details & Statutory Notes:</span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#1e2638]">
                {event.description}
              </p>
            </div>
          )}

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-[#1e2638]">
              <span className="text-slate-500 dark:text-[#8a96ae] text-[11px] block">Status</span>
              <span className="font-semibold text-slate-900 dark:text-white capitalize mt-0.5 block">
                {event.status}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-[#1e2638]">
              <span className="text-slate-500 dark:text-[#8a96ae] text-[11px] block">Priority</span>
              <span className="font-semibold text-[#cda052] uppercase mt-0.5 block">
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
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#cda052]/10 hover:bg-[#cda052]/15 text-xs font-semibold text-[#cda052] border border-[#cda052]/30 transition-colors"
              >
                <span>Navigate to Linked Module / Filing</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-200 dark:border-[#1e2638]">
          <div className="flex items-center gap-1.5">
            {onEditEvent && (
              <button
                onClick={() => {
                  onEditEvent(event);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#cda052]/10 hover:bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/30 text-xs font-semibold transition-colors"
                title="Edit Event"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={handleDownloadSingleIcs}
              className="p-2 rounded-xl bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors"
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
                ? 'bg-slate-100 dark:bg-black/60 text-slate-600 dark:text-[#8a96ae] border border-slate-200 dark:border-white/10'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
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
