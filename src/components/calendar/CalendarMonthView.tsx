'use client';

import React from 'react';
import { CalendarEventItem, CalendarEventCategory } from '@/lib/types';

interface CalendarMonthViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  selectedCategories: Set<CalendarEventCategory>;
  onSelectEvent: (event: CalendarEventItem) => void;
  onSelectDate: (date: Date) => void;
}

export default function CalendarMonthView({
  currentDate,
  events,
  selectedCategories,
  onSelectEvent,
  onSelectDate,
}: CalendarMonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 is Sunday

  // Days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Build grid days
  const gridCells: {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  const now = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // 1. Prev month filler
  for (let i = startingDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(year, month - 1, day);
    gridCells.push({
      date,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: isSameDay(date, now),
    });
  }

  // 2. Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    gridCells.push({
      date,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: isSameDay(date, now),
    });
  }

  // 3. Next month filler (complete to multiple of 7)
  const remaining = 7 - (gridCells.length % 7);
  if (remaining < 7) {
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day);
      gridCells.push({
        date,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: isSameDay(date, now),
      });
    }
  }

  const getCategoryStyles = (category: CalendarEventCategory) => {
    switch (category) {
      case 'gst':
        return 'bg-[rgba(205,160,82,0.18)] text-[#7c5b1b] dark:text-[#f7d88c] border-[#cda052]/40 hover:bg-[rgba(205,160,82,0.28)]';
      case 'customs':
        return 'bg-sky-500/18 text-sky-800 dark:text-sky-300 border-sky-500/40 hover:bg-sky-500/28';
      case 'itr':
        return 'bg-emerald-500/18 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/28';
      case 'dsc':
        return 'bg-purple-500/18 text-purple-800 dark:text-purple-300 border-purple-500/40 hover:bg-purple-500/28';
      case 'sprint':
        return 'bg-indigo-500/18 text-indigo-800 dark:text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/28';
      default:
        return 'bg-black/5 dark:bg-white/10 text-slate-900 dark:text-white border-black/10 dark:border-white/20';
    }
  };

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-[#1e2638] overflow-hidden shadow-sm">
      {/* Day of Week Header */}
      <div className="grid grid-cols-7 bg-slate-50 dark:bg-black/40 border-b border-slate-200 dark:border-white/10 text-center text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#a99a8b] py-2.5">
        {dayHeaders.map((name, idx) => (
          <div key={idx} className={idx === 0 || idx === 6 ? 'text-slate-400 dark:text-[#8895ad]' : 'text-slate-900 dark:text-white'}>
            {name}
          </div>
        ))}
      </div>

      {/* Grid of Calendar Days */}
      <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 dark:divide-white/5 bg-white dark:bg-[#080b12]">
        {gridCells.map((cell, idx) => {
          // Find matching events for this cell date
          const cellEvents = events.filter((evt) => {
            if (!selectedCategories.has(evt.category)) return false;
            const evtDate = new Date(evt.startTime);
            return isSameDay(evtDate, cell.date);
          });

          return (
            <div
              key={idx}
              onClick={() => onSelectDate(cell.date)}
              className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition-colors cursor-pointer group ${
                cell.isCurrentMonth
                  ? 'bg-white dark:bg-[#080b12] hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                  : 'bg-slate-50/60 dark:bg-black/40 text-slate-400 dark:text-[#8895ad] opacity-70 hover:opacity-100'
              } ${cell.isToday ? 'bg-amber-500/10 ring-1 ring-[#cda052]' : ''}`}
            >
              {/* Day Header Row */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-bold ${
                    cell.isToday
                      ? 'w-6 h-6 rounded-full bg-[#cda052] text-slate-950 flex items-center justify-center font-bold shadow-sm'
                      : cell.isCurrentMonth
                      ? 'text-slate-900 dark:text-white group-hover:text-[#cda052] dark:group-hover:text-[#f7d88c]'
                      : 'text-slate-400 dark:text-[#8895ad]'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {cellEvents.length > 0 && (
                  <span className="text-[10px] font-mono text-slate-500 dark:text-[#a99a8b]">
                    {cellEvents.length} {cellEvents.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>

              {/* Event Pills List */}
              <div className="mt-1.5 space-y-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                {cellEvents.slice(0, 3).map((evt) => (
                  <div
                    key={evt.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(evt);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border truncate cursor-pointer transition-all ${getCategoryStyles(
                      evt.category
                    )}`}
                    title={`${evt.title} (${evt.category.toUpperCase()})`}
                  >
                    {evt.title}
                  </div>
                ))}
                {cellEvents.length > 3 && (
                  <div className="text-[10px] font-bold text-[#cda052] px-1">
                    +{cellEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
