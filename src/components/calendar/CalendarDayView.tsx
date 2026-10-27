'use client';

import React from 'react';
import { CalendarEventItem, CalendarEventCategory } from '@/lib/types';
import { Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface CalendarDayViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  selectedCategories: Set<CalendarEventCategory>;
  onSelectEvent: (event: CalendarEventItem) => void;
  onSelectDate: (date: Date) => void;
}

export default function CalendarDayView({
  currentDate,
  events,
  selectedCategories,
  onSelectEvent,
}: CalendarDayViewProps) {
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  const dayEvents = events.filter((evt) => {
    if (!selectedCategories.has(evt.category)) return false;
    const evtDate = new Date(evt.startTime);
    return isSameDay(evtDate, currentDate);
  });

  const formattedDay = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const getCategoryStyles = (category: CalendarEventCategory) => {
    switch (category) {
      case 'gst':
        return 'bg-[rgba(205,160,82,0.15)] text-[#7c5b1b] dark:text-[#f7d88c] border-[#cda052]/40';
      case 'customs':
        return 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30';
      case 'itr':
        return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
      case 'dsc':
        return 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30';
      case 'sprint':
        return 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white border-black/10 dark:border-white/20';
    }
  };

  return (
    <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-[#1e2638] overflow-hidden shadow-sm">
      {/* Day Header Banner */}
      <div className="p-4 bg-slate-50 dark:bg-black/40 border-b border-slate-200 dark:border-[#1e2638] flex items-center justify-between">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8a96ae]">
            Single Day Timeline
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{formattedDay}</h2>
        </div>
        <span className="text-xs text-[#cda052] font-semibold bg-[#cda052]/10 px-3 py-1 rounded-full border border-[#cda052]/20">
          {dayEvents.length} {dayEvents.length === 1 ? 'Scheduled Item' : 'Scheduled Items'}
        </span>
      </div>

      {/* Hourly Schedule */}
      <div className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-[#080b12] max-h-[650px] overflow-y-auto">
        {hours.map((hour) => {
          const matchingEvents = dayEvents.filter((evt) => {
            const evtDate = new Date(evt.startTime);
            return evtDate.getHours() === hour;
          });

          return (
            <div key={hour} className="flex items-start min-h-[70px] hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
              <div className="w-20 p-3 text-right text-xs font-mono text-slate-400 dark:text-slate-500 select-none border-r border-slate-100 dark:border-white/5">
                {hour.toString().padStart(2, '0')}:00
              </div>

              <div className="flex-1 p-2 space-y-2">
                {matchingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className={`p-3 rounded-xl border transition-all hover:scale-[1.01] cursor-pointer ${getCategoryStyles(
                      evt.category
                    )}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{evt.title}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/5 dark:bg-black/40 border border-black/10 dark:border-white/10">
                        {evt.category.toUpperCase()}
                      </span>
                    </div>

                    {evt.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        {evt.description}
                      </p>
                    )}

                    <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#cda052]" />
                        {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {evt.relatedLink && (
                        <span className="text-[#cda052] hover:underline flex items-center gap-1 font-medium">
                          <span>View Associated Module</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
