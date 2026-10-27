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
  AlertTriangle,
  Search,
  ExternalLink,
  ChevronRight,
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

  // Sort chronologically
  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const filtered = sorted.filter((evt) => {
    if (!selectedCategories.has(evt.category)) return false;
    const matchesSearch =
      evt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evt.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
            High
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
            Normal
          </span>
        );
    }
  };

  const getCategoryStyles = (category: CalendarEventCategory) => {
    switch (category) {
      case 'gst':
        return 'text-[#f7d88c] bg-[rgba(205,160,82,0.15)] border-[#cda052]/30';
      case 'customs':
        return 'text-sky-300 bg-sky-500/15 border-sky-500/30';
      case 'itr':
        return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
      case 'dsc':
        return 'text-purple-300 bg-purple-500/15 border-purple-500/30';
      case 'sprint':
        return 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30';
      default:
        return 'text-white bg-white/10 border-white/20';
    }
  };

  return (
    <div className="bg-[#18100b] dark:bg-[#090c14] rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] p-5 shadow-sm space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#cda052]" />
            <span>Operational Deadlines & Agenda List</span>
          </h3>
          <p className="text-xs text-[#a99a8b]">
            Chronological master schedule of statutory filing cutoffs, customs duty gates, and team milestones
          </p>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a99a8b]" />
          <input
            type="text"
            placeholder="Search agenda schedule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 text-xs text-white placeholder-[#8895ad] border border-white/10 focus:border-[#cda052] outline-none"
          />
        </div>
      </div>

      {/* Agenda Table */}
      <div className="overflow-x-auto rounded-xl border border-white/5">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-black/40 text-[#a99a8b] uppercase text-[10px] border-b border-white/5">
              <th className="py-2.5 px-3 font-semibold">Scheduled Date & Time</th>
              <th className="py-2.5 px-3 font-semibold">Category</th>
              <th className="py-2.5 px-3 font-semibold">Event Title & Scope</th>
              <th className="py-2.5 px-3 font-semibold">Priority</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#a99a8b]">
                  No upcoming agenda items match your filter.
                </td>
              </tr>
            ) : (
              filtered.map((evt) => {
                const startDate = new Date(evt.startTime);
                const isCompleted = evt.status === 'completed';

                return (
                  <tr
                    key={evt.id}
                    onClick={() => onSelectEvent(evt)}
                    className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    {/* Date */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-white">
                        {startDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[10px] text-[#8895ad] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>
                          {evt.allDay
                            ? 'All Day'
                            : startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getCategoryStyles(
                          evt.category
                        )}`}
                      >
                        {evt.category.toUpperCase()}
                      </span>
                    </td>

                    {/* Title & Desc */}
                    <td className="py-3 px-3 max-w-[320px]">
                      <div className="font-semibold text-white group-hover:text-[#f7d88c] transition-colors">
                        {evt.title}
                      </div>
                      {evt.description && (
                        <div className="text-[11px] text-[#8895ad] truncate mt-0.5">
                          {evt.description}
                        </div>
                      )}
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getPriorityBadge(evt.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Done
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() =>
                            onUpdateEventStatus(evt.id, isCompleted ? 'pending' : 'completed')
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                            isCompleted
                              ? 'bg-black/40 text-[#a99a8b] border-white/10 hover:text-white'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                          }`}
                        >
                          {isCompleted ? 'Reopen' : 'Complete'}
                        </button>
                        {evt.relatedLink && (
                          <Link
                            href={evt.relatedLink}
                            className="p-1.5 rounded-lg text-[#a99a8b] hover:text-[#cda052] hover:bg-white/5 transition-colors"
                            title="Jump to Module"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
