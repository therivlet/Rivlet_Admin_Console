'use client';

import React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Filter,
  Sparkles,
} from 'lucide-react';
import { CalendarEventCategory, CalendarEventItem } from '@/lib/types';
import CalendarAiAdvisorModal from './CalendarAiAdvisorModal';

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
  events?: CalendarEventItem[];
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
  events = [],
}: CalendarHeaderProps) {
  const [isAiModalOpen, setIsAiModalOpen] = React.useState(false);
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
    { key: 'gst', label: 'GST (10th/20th)', color: 'text-[#8c6b2d] dark:text-[#f7d88c] bg-[rgba(205,160,82,0.12)] border-[#cda052]/40' },
    { key: 'customs', label: 'ICEGATE Customs', color: 'text-sky-800 dark:text-sky-300 bg-sky-500/15 border-sky-500/40' },
    { key: 'itr', label: 'ITR & Direct Tax', color: 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/40' },
    { key: 'dsc', label: 'DSC Expiry', color: 'text-purple-800 dark:text-purple-300 bg-purple-500/15 border-purple-500/40' },
    { key: 'sprint', label: 'Sprint Gates', color: 'text-indigo-800 dark:text-indigo-300 bg-indigo-500/15 border-indigo-500/40' },
  ];

  return (
    <div className="space-y-3">
      {/* Top Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#0e121b] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
        {/* Left Column: Fixed Date Navigation (Buttons stay anchored directly under the month & year) */}
        <div className="flex flex-col justify-center min-w-[220px]">
          {/* 1. Month & Year Title */}
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-xl bg-amber-500/10 text-[#cda052] border border-amber-500/20 flex-shrink-0">
              <CalendarIcon className="w-4 h-4 text-[#cda052]" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formattedMonthYear}
            </h1>
          </div>

          {/* 2. Anchor Fixed Controls Directly Below Month & Year */}
          <div className="flex items-center gap-1.5 mt-2 ml-0.5">
            <button
              onClick={handlePrev}
              aria-label="Previous period"
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#a99a8b] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors"
              title="Previous Period"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              aria-label="Next period"
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-[#a99a8b] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors"
              title="Next Period"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Section: View Switcher & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200 dark:border-white/10">
            {(['month', 'week', 'day', 'agenda'] as CalendarViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  viewMode === mode
                    ? 'bg-[#cda052] text-slate-950 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-[#a99a8b] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* AI Cadence Scanner button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#cda052]/10 hover:bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/30 text-xs font-bold transition-colors shadow-sm"
            title="Scan monthly schedule for statutory collisions and pressure peaks"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Scanner</span>
          </button>

          {/* Export to ICS button */}
          <button
            onClick={onExportIcs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 transition-colors"
            title="Download .ICS file to sync with Google Calendar, Teams, or Apple Calendar"
          >
            <Download className="w-3.5 h-3.5 text-[#cda052]" />
            <span className="hidden sm:inline">Export .ICS</span>
          </button>

          {/* Add Event Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-slate-950 font-semibold text-xs transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* AI Schedule Cadence Modal */}
      <CalendarAiAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        events={events}
        currentDate={currentDate}
      />

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-[11px] text-slate-500 dark:text-[#8895ad] uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-[#cda052]" />
          Filters:
        </span>
        {categories.map((cat) => {
          const isSelected = selectedCategories.has(cat.key);
          return (
            <button
              key={cat.key}
              onClick={() => onToggleCategory(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                isSelected
                  ? cat.color
                  : 'bg-slate-100 dark:bg-black/20 text-slate-400 dark:text-[#8895ad] border-slate-200 dark:border-white/5 line-through opacity-50'
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
