'use client';

import React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Filter,
} from 'lucide-react';
import { CalendarEventCategory } from '@/lib/types';

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  selectedCategories: Set<CalendarEventCategory>;
  onToggleCategory: (cat: CalendarEventCategory) => void;
  onOpenCreateModal: () => void;
  onExportIcs: () => void;
}

export default function CalendarHeader({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  selectedCategories,
  onToggleCategory,
  onOpenCreateModal,
  onExportIcs,
}: CalendarHeaderProps) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    onDateChange(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    onDateChange(next);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const formattedMonthYear = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const categories: { key: CalendarEventCategory; label: string; color: string }[] = [
    { key: 'gst', label: 'GST (10th/20th)', color: 'text-[#f7d88c] bg-[rgba(205,160,82,0.15)] border-[#cda052]/30' },
    { key: 'customs', label: 'ICEGATE Customs', color: 'text-sky-300 bg-sky-500/15 border-sky-500/30' },
    { key: 'itr', label: 'ITR & Direct Tax', color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' },
    { key: 'dsc', label: 'DSC Expiry', color: 'text-purple-300 bg-purple-500/15 border-purple-500/30' },
    { key: 'sprint', label: 'Sprint Gates', color: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30' },
  ];

  return (
    <div className="space-y-3">
      {/* Top Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#1e140e] dark:bg-[#0c101a] p-4 rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] shadow-md">
        {/* Title, Month/Year & Navigation */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[rgba(205,160,82,0.15)] text-[#f7d88c] border border-[rgba(205,160,82,0.3)]">
              <CalendarIcon className="w-5 h-5 text-[#cda052]" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {formattedMonthYear}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={handlePrev}
              aria-label="Previous period"
              className="p-1.5 rounded-xl bg-black/40 hover:bg-white/10 text-[#a99a8b] hover:text-white border border-white/10 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl bg-black/40 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              aria-label="Next period"
              className="p-1.5 rounded-xl bg-black/40 hover:bg-white/10 text-[#a99a8b] hover:text-white border border-white/10 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Tabs */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
            {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  viewMode === mode
                    ? 'bg-[#cda052] text-black shadow-sm'
                    : 'text-[#a99a8b] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Export to ICS button */}
          <button
            onClick={onExportIcs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-colors"
            title="Download .ICS file to sync with Google Calendar, Teams, or Apple Calendar"
          >
            <Download className="w-3.5 h-3.5 text-[#cda052]" />
            <span className="hidden sm:inline">Export .ICS</span>
          </button>

          {/* Add Event Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-[11px] text-[#8895ad] uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-[#cda052]" />
          Filters:
        </span>
        {categories.map((cat) => {
          const isSelected = selectedCategories.has(cat.key);
          return (
            <button
              key={cat.key}
              onClick={() => onToggleCategory(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                isSelected
                  ? cat.color
                  : 'bg-black/20 text-[#8895ad] border-white/5 line-through opacity-50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
