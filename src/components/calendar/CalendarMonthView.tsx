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
        return 'bg-[rgba(205,160,82,0.2)] text-[#f7d88c] border-[#cda052]/40 hover:bg-[rgba(205,160,82,0.3)]';
      case 'customs':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30';
      case 'itr':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30';
      case 'dsc':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30';
      case 'sprint':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30';
      default:
        return 'bg-white/10 text-white border-white/20 hover:bg-white/20';
    }
  };

  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-[#18100b] dark:bg-[#090c14] rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] overflow-hidden shadow-sm">
      {/* Day of Week Header */}
      <div className="grid grid-cols-7 bg-black/40 border-b border-white/10 text-center text-xs font-semibold uppercase tracking-wider text-[#a99a8b] py-2.5">
        {dayHeaders.map((name, idx) => (
          <div key={idx} className={idx === 0 || idx === 6 ? 'text-[#8895ad]' : 'text-white'}>
            {name}
          </div>
        ))}
      </div>

      {/* Grid of Calendar Days */}
      <div className="grid grid-cols-7 divide-x divide-y divide-white/5 bg-[#140d09] dark:bg-[#07090e]">
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
                  ? 'hover:bg-white/[0.03]'
                  : 'bg-black/40 text-[#8895ad] opacity-60 hover:opacity-90'
              } ${cell.isToday ? 'bg-[rgba(205,160,82,0.06)] ring-1 ring-[#cda052]/50' : ''}`}
            >
              {/* Day Header Row */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-bold ${
                    cell.isToday
                      ? 'w-6 h-6 rounded-full bg-[#cda052] text-black flex items-center justify-center font-semibold shadow-sm'
                      : cell.isCurrentMonth
                      ? 'text-white group-hover:text-[#f7d88c]'
                      : 'text-[#8895ad]'
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {cellEvents.length > 0 && (
                  <span className="text-[10px] font-mono text-[#a99a8b]">
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
                    className={`px-1.5 py-0.5 rounded text-[11px] font-medium border truncate cursor-pointer transition-all ${getCategoryStyles(
                      evt.category
                    )}`}
                    title={`${evt.title} (${evt.category.toUpperCase()})`}
                  >
                    {evt.title}
                  </div>
                ))}
                {cellEvents.length > 3 && (
                  <div className="text-[10px] font-semibold text-[#cda052] px-1">
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
