'use client';

import React from 'react';
import { CalendarEventItem, CalendarEventCategory } from '@/lib/types';
import { Clock } from 'lucide-react';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  selectedCategories: Set<CalendarEventCategory>;
  onSelectEvent: (event: CalendarEventItem) => void;
  onSelectDate: (date: Date) => void;
}

export default function CalendarWeekView({
  currentDate,
  events,
  selectedCategories,
  onSelectEvent,
  onSelectDate,
}: CalendarWeekViewProps) {
  // Compute start of week (Sunday)
  const currentDayOfWeek = currentDate.getDay();
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(d);
  }

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  const now = new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCategoryStyles = (category: CalendarEventCategory) => {
    switch (category) {
      case 'gst':
        return 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] border-[#cda052]/50';
      case 'customs':
        return 'bg-sky-500/25 text-sky-200 border-sky-500/40';
      case 'itr':
        return 'bg-emerald-500/25 text-emerald-200 border-emerald-500/40';
      case 'dsc':
        return 'bg-purple-500/25 text-purple-200 border-purple-500/40';
      case 'sprint':
        return 'bg-indigo-500/25 text-indigo-200 border-indigo-500/40';
      default:
        return 'bg-white/10 text-white border-white/20';
    }
  };

  return (
    <div className="bg-[#18100b] dark:bg-[#090c14] rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] overflow-hidden shadow-sm">
      {/* Week Header Row */}
      <div className="grid grid-cols-8 bg-black/40 border-b border-white/10 text-xs py-3">
        <div className="text-center text-[#8895ad] font-mono text-[11px] self-center">
          Time
        </div>
        {weekDays.map((date, idx) => {
          const isToday = isSameDay(date, now);
          return (
            <div key={idx} className="text-center">
              <div className="text-[10px] uppercase font-semibold text-[#8895ad]">
                {dayNames[idx]}
              </div>
              <div
                className={`text-sm font-bold font-mono inline-block px-2 py-0.5 rounded-full mt-0.5 ${
                  isToday
                    ? 'bg-[#cda052] text-black'
                    : 'text-white'
                }`}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hourly Grid Rows */}
      <div className="divide-y divide-white/5 bg-[#140d09] dark:bg-[#07090e] max-h-[650px] overflow-y-auto">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 divide-x divide-white/5 min-h-[60px]">
            {/* Hour Label */}
            <div className="p-2 text-right text-[11px] font-mono text-[#8895ad] select-none">
              {hour.toString().padStart(2, '0')}:00
            </div>

            {/* 7 Days Columns for this hour */}
            {weekDays.map((date, dayIdx) => {
              const cellEvents = events.filter((evt) => {
                if (!selectedCategories.has(evt.category)) return false;
                const evtDate = new Date(evt.startTime);
                if (!isSameDay(evtDate, date)) return false;
                return evtDate.getHours() === hour;
              });

              return (
                <div
                  key={dayIdx}
                  onClick={() => {
                    const selected = new Date(date);
                    selected.setHours(hour);
                    onSelectDate(selected);
                  }}
                  className="p-1 hover:bg-white/[0.02] transition-colors cursor-pointer relative"
                >
                  {cellEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(evt);
                      }}
                      className={`p-1.5 rounded-lg text-xs font-medium border mb-1 truncate shadow-sm transition-transform hover:scale-[1.02] cursor-pointer ${getCategoryStyles(
                        evt.category
                      )}`}
                    >
                      <div className="font-semibold truncate">{evt.title}</div>
                      <div className="text-[10px] opacity-80 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
