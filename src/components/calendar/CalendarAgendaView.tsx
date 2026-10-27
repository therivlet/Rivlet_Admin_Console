'use client';

import React, { useState } from 'react';
import {
  CalendarEventItem,
  CalendarEventCategory,
  CalendarEventStatus,
} from '@/lib/types';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Search,
  ExternalLink,
  Repeat,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

interface CalendarAgendaViewProps {
  events: CalendarEventItem[];
  selectedCategories: Set<CalendarEventCategory>;
  onSelectEvent: (event: CalendarEventItem) => void;
  onUpdateEventStatus: (id: string, status: CalendarEventStatus) => void;
}

export default function CalendarAgendaView({
  events,
  selectedCategories,
  onSelectEvent,
  onUpdateEventStatus,
}: CalendarAgendaViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewGrouping, setViewGrouping] = useState<'chronological' | 'grouped'>('grouped');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Sort chronologically
  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const filtered = sorted.filter((evt) => {
    if (!selectedCategories.has(evt.category)) return false;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.recurrenceRule || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Separate recurring vs non-recurring
  const recurringEvents = filtered.filter(
    (e) => (e.recurrence && e.recurrence !== 'none') || e.groupId || e.id.includes('-rec-')
  );
  const oneOffEvents = filtered.filter(
    (e) => (!e.recurrence || e.recurrence === 'none') && !e.groupId && !e.id.includes('-rec-')
  );

  // Group recurring events by their root series title or groupId
  const recurringGroups: { [groupKey: string]: { title: string; recurrenceText: string; category: CalendarEventCategory; items: CalendarEventItem[] } } = {};

  recurringEvents.forEach((evt) => {
    const key = evt.groupId || evt.title;
    if (!recurringGroups[key]) {
      const recurrenceText =
        evt.recurrenceRule ||
        (evt.recurrence === 'monthly'
          ? 'Every Month'
          : evt.recurrence === 'yearly'
          ? 'Every Year'
          : evt.recurrence === 'weekly'
          ? 'Every Week'
          : 'Recurring Schedule');

      recurringGroups[key] = {
        title: evt.title,
        recurrenceText,
        category: evt.category,
        items: [],
      };
    }
    recurringGroups[key].items.push(evt);
  });

  const toggleGroupCollapse = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30">
            High
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/15 text-sky-800 dark:text-sky-400 border border-sky-500/30">
            Normal
          </span>
        );
    }
  };

  const getCategoryStyles = (category: CalendarEventCategory) => {
    switch (category) {
      case 'gst':
        return 'text-[#7c5b1b] dark:text-[#f7d88c] bg-[rgba(205,160,82,0.15)] border-[#cda052]/40';
      case 'customs':
        return 'text-sky-800 dark:text-sky-300 bg-sky-500/15 border-sky-500/40';
      case 'itr':
        return 'text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/40';
      case 'dsc':
        return 'text-purple-800 dark:text-purple-300 bg-purple-500/15 border-purple-500/40';
      case 'sprint':
        return 'text-indigo-800 dark:text-indigo-300 bg-indigo-500/15 border-indigo-500/40';
      default:
        return 'text-slate-900 dark:text-white bg-black/5 dark:bg-white/10 border-black/10 dark:border-white/20';
    }
  };

  const renderEventRow = (evt: CalendarEventItem, isSubItem: boolean = false) => {
    const startDate = new Date(evt.startTime);
    const isCompleted = evt.status === 'completed';
    const hasRecurrence = (evt.recurrence && evt.recurrence !== 'none') || evt.groupId;

    return (
      <tr
        key={evt.id}
        onClick={() => onSelectEvent(evt)}
        className={`hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group ${
          isSubItem ? 'bg-amber-500/[0.02] dark:bg-[rgba(205,160,82,0.02)]' : ''
        }`}
      >
        {/* Date */}
        <td className="py-2.5 px-3 whitespace-nowrap">
          <div className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            {isSubItem && <span className="text-slate-300 dark:text-slate-600">↳</span>}
            <span>
              {startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            <span>
              {evt.allDay
                ? 'All Day'
                : startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </td>

        {/* Category */}
        <td className="py-2.5 px-3 whitespace-nowrap">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getCategoryStyles(
              evt.category
            )}`}
          >
            {evt.category.toUpperCase()}
          </span>
        </td>

        {/* Title & Desc */}
        <td className="py-2.5 px-3 max-w-[340px]">
          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-[#cda052] transition-colors flex items-center gap-1.5">
            <span>{evt.title}</span>
            {hasRecurrence && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-[#f7d88c] border border-amber-500/20 font-mono font-medium flex items-center gap-0.5">
                <Repeat className="w-2.5 h-2.5" />
                <span>{evt.recurrence || 'Recurring'}</span>
              </span>
            )}
          </div>
          {(evt.description || evt.recurrenceRule) && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {evt.recurrenceRule ? `Cadence: ${evt.recurrenceRule} • ` : ''}
              {evt.description || ''}
            </div>
          )}
        </td>

        {/* Priority */}
        <td className="py-2.5 px-3 whitespace-nowrap">
          {getPriorityBadge(evt.priority)}
        </td>

        {/* Status */}
        <td className="py-2.5 px-3 whitespace-nowrap">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              Done
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          )}
        </td>

        {/* Actions */}
        <td className="py-2.5 px-3 text-right whitespace-nowrap">
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() =>
                onUpdateEventStatus(evt.id, isCompleted ? 'pending' : 'completed')
              }
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                isCompleted
                  ? 'bg-slate-100 dark:bg-black/40 text-slate-600 dark:text-[#8a96ae] border-slate-200 dark:border-white/10 hover:text-slate-900'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
              }`}
            >
              {isCompleted ? 'Reopen' : 'Complete'}
            </button>
            {evt.relatedLink && (
              <Link
                href={evt.relatedLink}
                className="p-1.5 rounded-lg text-slate-400 dark:text-[#8a96ae] hover:text-[#cda052] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Jump to Module"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-sm space-y-4">
      {/* Search & Mode Toggle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1e2638]">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#cda052]" />
            <span>Operational Master Agenda</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#8a96ae]">
            Statutory filing cutoffs, customs duty gates, and automated recurring event groups
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle View Mode */}
          <div className="flex items-center bg-slate-100 dark:bg-black/40 p-1 rounded-xl border border-slate-200 dark:border-[#1e2638]">
            <button
              onClick={() => setViewGrouping('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewGrouping === 'grouped'
                  ? 'bg-white dark:bg-[#1a2233] text-[#cda052] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>Group Recurring ({Object.keys(recurringGroups).length})</span>
            </button>
            <button
              onClick={() => setViewGrouping('chronological')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                viewGrouping === 'chronological'
                  ? 'bg-white dark:bg-[#1a2233] text-[#cda052] shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chronological List ({filtered.length})</span>
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8a96ae]" />
            <input
              type="text"
              placeholder="Search agenda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-black/40 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1e2638]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-[#080b12] text-slate-600 dark:text-[#8a96ae] uppercase text-[10px] border-b border-slate-200 dark:border-[#1e2638]">
              <th className="py-2.5 px-3 font-semibold">Scheduled Date & Time</th>
              <th className="py-2.5 px-3 font-semibold">Category</th>
              <th className="py-2.5 px-3 font-semibold">Event Title & Scope</th>
              <th className="py-2.5 px-3 font-semibold">Priority</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-[#8a96ae]">
                  No upcoming agenda items match your filter.
                </td>
              </tr>
            ) : viewGrouping === 'grouped' ? (
              <>
                {/* 1. Recurring Series Groups */}
                {Object.entries(recurringGroups).map(([groupKey, group]) => {
                  const isCollapsed = collapsedGroups.has(groupKey);
                  return (
                    <React.Fragment key={groupKey}>
                      <tr
                        onClick={() => toggleGroupCollapse(groupKey)}
                        className="bg-amber-500/10 dark:bg-[rgba(205,160,82,0.12)] border-y border-amber-500/20 dark:border-[#cda052]/30 cursor-pointer hover:bg-amber-500/15 transition-colors"
                      >
                        <td colSpan={6} className="py-2 px-3">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-[#f7d88c]">
                            <div className="flex items-center gap-2">
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4 text-[#cda052]" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[#cda052]" />
                              )}
                              <Repeat className="w-4 h-4 text-[#cda052]" />
                              <span>Recurring Group: {group.title}</span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 dark:bg-[#cda052]/20 border border-amber-500/30 text-amber-800 dark:text-[#f7d88c]">
                                {group.recurrenceText}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                              {group.items.length} schedule {group.items.length === 1 ? 'instance' : 'instances'} (Click to {isCollapsed ? 'expand' : 'collapse'})
                            </span>
                          </div>
                        </td>
                      </tr>
                      {!isCollapsed &&
                        group.items.map((evt) => renderEventRow(evt, true))}
                    </React.Fragment>
                  );
                })}

                {/* 2. One-Off Events Section Header */}
                {oneOffEvents.length > 0 && (
                  <tr className="bg-slate-50 dark:bg-[#0c1018] border-y border-slate-200 dark:border-[#1e2638]">
                    <td colSpan={6} className="py-2 px-3 font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>One-Off / Statutory Milestones ({oneOffEvents.length})</span>
                    </td>
                  </tr>
                )}
                {oneOffEvents.map((evt) => renderEventRow(evt, false))}
              </>
            ) : (
              /* Chronological view */
              filtered.map((evt) => renderEventRow(evt, false))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
