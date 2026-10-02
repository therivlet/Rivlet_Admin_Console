'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  KanbanSquare,
  ChevronRight,
  Flag,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart2,
  Layers,
  ArrowUpRight,
  Flame,
  User,
  Filter,
  Check
} from 'lucide-react';
import { WorkItem, Sprint } from '@/lib/types';

interface TodaysFocusModernProps {
  workItems: WorkItem[];
  sprints: Sprint[];
}

function isOverdue(item: { targetDate?: string; state: string }) {
  if (!item.targetDate || item.state === 'Closed' || item.state === 'Resolved') return false;
  return item.targetDate < new Date().toISOString().slice(0, 10);
}

function isDueToday(item: { targetDate?: string; state: string }) {
  if (!item.targetDate || item.state === 'Closed' || item.state === 'Resolved') return false;
  return item.targetDate === new Date().toISOString().slice(0, 10);
}

export default function TodaysFocusModern({ workItems, sprints }: TodaysFocusModernProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'dueToday' | 'overdue' | 'closed'>('all');
  const [viewMode, setViewMode] = useState<'stream' | 'telemetry'>('stream');

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentSprint = useMemo(
    () => sprints.find((s) => s.startDate <= todayStr && s.endDate >= todayStr),
    [sprints, todayStr]
  );

  // Relevant items for current sprint or unscheduled active items
  const sprintItems = useMemo(() => {
    if (currentSprint) {
      const itemsInSprint = workItems.filter((w) => w.sprintId === currentSprint.id);
      return itemsInSprint.length > 0 ? itemsInSprint : workItems;
    }
    return workItems;
  }, [currentSprint, workItems]);

  const activeItems = useMemo(() => sprintItems.filter((w) => w.state === 'Active'), [sprintItems]);
  const dueTodayItems = useMemo(() => sprintItems.filter(isDueToday), [sprintItems]);
  const overdueItems = useMemo(() => sprintItems.filter(isOverdue), [sprintItems]);
  const closedItems = useMemo(() => sprintItems.filter((w) => w.state === 'Closed' || w.state === 'Resolved'), [sprintItems]);
  const inReviewItems = useMemo(() => sprintItems.filter((w) => w.state === 'In Review'), [sprintItems]);
  const newItems = useMemo(() => sprintItems.filter((w) => w.state === 'New'), [sprintItems]);

  // Sprint Progress & Pacing Metrics
  const totalTasks = sprintItems.length;
  const completedTasks = closedItems.length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const sprintPacing = useMemo(() => {
    if (!currentSprint) return { daysTotal: 14, daysElapsed: 0, daysRemaining: 0, onPace: true };
    const start = new Date(currentSprint.startDate).getTime();
    const end = new Date(currentSprint.endDate).getTime();
    const now = new Date(todayStr).getTime();
    const totalMs = Math.max(1, end - start);
    const elapsedMs = Math.max(0, now - start);
    const daysTotal = Math.ceil(totalMs / (1000 * 3600 * 24));
    const daysElapsed = Math.min(daysTotal, Math.ceil(elapsedMs / (1000 * 3600 * 24)));
    const daysRemaining = Math.max(0, daysTotal - daysElapsed);
    const expectedPct = Math.round((daysElapsed / daysTotal) * 100);
    const onPace = completionPct >= expectedPct - 15; // Within 15% grace

    return { daysTotal, daysElapsed, daysRemaining, expectedPct, onPace };
  }, [currentSprint, todayStr, completionPct]);

  // Priority Breakdown
  const p1Items = useMemo(() => sprintItems.filter((w) => w.priority === 1 && w.state !== 'Closed'), [sprintItems]);
  const p2Items = useMemo(() => sprintItems.filter((w) => w.priority === 2 && w.state !== 'Closed'), [sprintItems]);
  const p3Items = useMemo(() => sprintItems.filter((w) => (w.priority === 3 || w.priority === 4) && w.state !== 'Closed'), [sprintItems]);

  // Filtered displayed focus items
  const displayedItems = useMemo(() => {
    let list: WorkItem[] = [];
    if (activeFilter === 'active') {
      list = activeItems;
    } else if (activeFilter === 'dueToday') {
      list = dueTodayItems;
    } else if (activeFilter === 'overdue') {
      list = overdueItems;
    } else if (activeFilter === 'closed') {
      list = closedItems;
    } else {
      // 'all': prioritize overdue, then due today, then active, then others
      const set = new Set<string>();
      const combined: WorkItem[] = [];
      [...overdueItems, ...dueTodayItems, ...activeItems, ...inReviewItems, ...newItems].forEach((w) => {
        if (!set.has(w.id)) {
          set.add(w.id);
          combined.push(w);
        }
      });
      list = combined;
    }

    // Sort by priority (1 is highest) then targetDate
    return list.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
      return 0;
    });
  }, [activeFilter, activeItems, dueTodayItems, overdueItems, closedItems, inReviewItems, newItems]);

  // SVG Circular Gauge Dimensions
  const circleSize = 88;
  const strokeWidth = 8;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPct / 100) * circumference;

  return (
    <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden transition-all">
      {/* Subtle ambient lighting */}
      <div className="absolute top-0 right-1/4 w-80 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-32 bg-[#cda052]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#182032] relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-900/60 to-purple-900/40 text-indigo-400 border border-indigo-700/30">
            <KanbanSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Today&apos;s Focus & Sprint Radar</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.12)] text-[#cda052] border border-[rgba(205,160,82,0.25)] font-mono font-semibold">
                Live Pulse
              </span>
            </div>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              {currentSprint
                ? `${currentSprint.name} • ${new Date(currentSprint.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(currentSprint.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : 'All Work Backlog & Priority Stream'}
            </p>
          </div>
        </div>

        {/* View Switcher & Link to Board */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-[#080b12] border border-[#1c2438]">
            <button
              onClick={() => setViewMode('stream')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'stream'
                  ? 'bg-[#182032] text-white shadow-sm font-semibold'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Action Stream</span>
            </button>
            <button
              onClick={() => setViewMode('telemetry')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'telemetry'
                  ? 'bg-[#182032] text-white shadow-sm font-semibold'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Telemetry Graphs</span>
            </button>
          </div>

          <Link
            href="/work?tab=board"
            className="flex items-center gap-1 text-xs text-[#cda052] hover:text-[#e8ca78] font-semibold transition-colors px-2.5 py-1.5 rounded-lg hover:bg-[#141b2a]"
          >
            <span>Open Sprint Board</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Visual Telemetry on Left/Top, Focus Stream on Right/Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4 relative z-10">
        {/* Left Column (5 Cols): Modern Visual Graphs & Sprint Radar */}
        <div className="lg:col-span-5 space-y-4">
          {/* Circular Sprint Execution Gauge Card */}
          <div className="bg-[#080b12] border border-[#1a2336] rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Radial Progress SVG */}
              <div className="relative flex-shrink-0" style={{ width: circleSize, height: circleSize }}>
                <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${circleSize} ${circleSize}`}>
                  <circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    stroke="#161f30"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                  />
                  <circle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    stroke="url(#sprintGrad)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                  <defs>
                    <linearGradient id="sprintGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#cda052" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center text in circle */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-base font-bold text-white font-mono leading-none">
                    {completionPct}%
                  </span>
                  <span className="text-[9px] text-[#7c869d] font-mono mt-0.5">Done</span>
                </div>
              </div>

              {/* Sprint Pacing Summary */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-white">Sprint Completion</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                      sprintPacing.onPace
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                        : 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                    }`}
                  >
                    {sprintPacing.onPace ? 'On Track' : 'Behind Pace'}
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] font-mono">
                  {completedTasks} of {totalTasks} tasks resolved
                </p>
                <p className="text-[11px] text-[#7c869d] mt-1">
                  Day {sprintPacing.daysElapsed} of {sprintPacing.daysTotal} •{' '}
                  <span className="text-[#cbd5e1] font-semibold">{sprintPacing.daysRemaining} days left</span>
                </p>
              </div>
            </div>
          </div>

          {/* Multi-Colored State Flow Stream (Proportional Segmented Graph) */}
          <div className="bg-[#080b12] border border-[#1a2336] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#cbd5e1] flex items-center gap-1.5">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
                Workload State Flow Stream
              </span>
              <span className="text-[10px] text-[#7c869d] font-mono">{totalTasks} items mapped</span>
            </div>

            {/* Stacked Proportional Bar Graph */}
            <div className="w-full h-3 rounded-full bg-[#141b2a] overflow-hidden flex gap-0.5 p-0.5">
              {closedItems.length > 0 && (
                <div
                  title={`Closed: ${closedItems.length}`}
                  className="h-full bg-emerald-500 rounded-sm transition-all duration-300"
                  style={{ width: `${(closedItems.length / totalTasks) * 100}%` }}
                />
              )}
              {activeItems.length > 0 && (
                <div
                  title={`Active Now: ${activeItems.length}`}
                  className="h-full bg-sky-400 rounded-sm transition-all duration-300"
                  style={{ width: `${(activeItems.length / totalTasks) * 100}%` }}
                />
              )}
              {inReviewItems.length > 0 && (
                <div
                  title={`In Review: ${inReviewItems.length}`}
                  className="h-full bg-indigo-500 rounded-sm transition-all duration-300"
                  style={{ width: `${(inReviewItems.length / totalTasks) * 100}%` }}
                />
              )}
              {dueTodayItems.length > 0 && (
                <div
                  title={`Due Today: ${dueTodayItems.length}`}
                  className="h-full bg-amber-400 rounded-sm transition-all duration-300"
                  style={{ width: `${(dueTodayItems.length / totalTasks) * 100}%` }}
                />
              )}
              {overdueItems.length > 0 && (
                <div
                  title={`Overdue: ${overdueItems.length}`}
                  className="h-full bg-rose-500 rounded-sm transition-all duration-300"
                  style={{ width: `${(overdueItems.length / totalTasks) * 100}%` }}
                />
              )}
              {newItems.length > 0 && (
                <div
                  title={`New Backlog: ${newItems.length}`}
                  className="h-full bg-[#334155] rounded-sm transition-all duration-300"
                  style={{ width: `${(newItems.length / totalTasks) * 100}%` }}
                />
              )}
            </div>

            {/* Interactive Color Legend Filter Chips */}
            <div className="grid grid-cols-3 gap-1.5 pt-1 text-[11px]">
              <button
                onClick={() => setActiveFilter('active')}
                className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all ${
                  activeFilter === 'active'
                    ? 'bg-sky-950/60 border-sky-600 text-sky-200 font-semibold'
                    : 'bg-[#0a0e17] border-[#182032] text-[#94a3b8] hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span className="truncate">Active ({activeItems.length})</span>
              </button>

              <button
                onClick={() => setActiveFilter('dueToday')}
                className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all ${
                  activeFilter === 'dueToday'
                    ? 'bg-amber-950/60 border-amber-600 text-amber-200 font-semibold'
                    : 'bg-[#0a0e17] border-[#182032] text-[#94a3b8] hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="truncate">Today ({dueTodayItems.length})</span>
              </button>

              <button
                onClick={() => setActiveFilter('overdue')}
                className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all ${
                  activeFilter === 'overdue'
                    ? 'bg-rose-950/60 border-rose-600 text-rose-200 font-semibold'
                    : 'bg-[#0a0e17] border-[#182032] text-[#94a3b8] hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="truncate">Overdue ({overdueItems.length})</span>
              </button>

              <button
                onClick={() => setActiveFilter('closed')}
                className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all ${
                  activeFilter === 'closed'
                    ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200 font-semibold'
                    : 'bg-[#0a0e17] border-[#182032] text-[#94a3b8] hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="truncate">Done ({closedItems.length})</span>
              </button>

              <button
                onClick={() => setActiveFilter('all')}
                className={`col-span-2 flex items-center justify-center gap-1.5 p-1.5 rounded-lg border transition-all ${
                  activeFilter === 'all'
                    ? 'bg-[#182032] border-[#cda052] text-[#cda052] font-semibold'
                    : 'bg-[#0a0e17] border-[#182032] text-[#94a3b8] hover:text-white'
                }`}
              >
                <span>View Full Focus Queue ({totalTasks})</span>
              </button>
            </div>
          </div>

          {/* Urgency & Priority Radar Mini-Graph */}
          <div className="bg-[#080b12] border border-[#1a2336] rounded-xl p-3.5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-[#94a3b8] font-semibold flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" /> Urgency Distribution
              </span>
              <span className="text-[10px] text-[#7c869d] font-mono">Unresolved</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#120a10] border border-rose-900/40 p-2 rounded-lg">
                <div className="text-[10px] text-rose-400 uppercase font-semibold">P1 Critical</div>
                <div className="text-base font-bold text-rose-300 font-mono mt-0.5">{p1Items.length}</div>
              </div>
              <div className="bg-[#141009] border border-amber-900/40 p-2 rounded-lg">
                <div className="text-[10px] text-amber-400 uppercase font-semibold">P2 High</div>
                <div className="text-base font-bold text-amber-300 font-mono mt-0.5">{p2Items.length}</div>
              </div>
              <div className="bg-[#090f14] border border-sky-900/40 p-2 rounded-lg">
                <div className="text-[10px] text-sky-400 uppercase font-semibold">P3 Normal</div>
                <div className="text-base font-bold text-sky-300 font-mono mt-0.5">{p3Items.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): The Modern, Highly Readable Action Focus Stream */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          {/* Action Stream Sub-header */}
          <div className="flex items-center justify-between text-xs pb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                {activeFilter === 'all' && 'All Prioritized Tasks'}
                {activeFilter === 'active' && 'Currently In Progress (Active)'}
                {activeFilter === 'dueToday' && 'Due Today'}
                {activeFilter === 'overdue' && 'Attention Required (Overdue)'}
                {activeFilter === 'closed' && 'Completed This Sprint'}
              </span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#182032] text-[#94a3b8] font-mono">
                {displayedItems.length}
              </span>
            </div>

            <Link
              href="/work?tab=backlog"
              className="text-[11px] text-[#94a3b8] hover:text-[#cda052] transition-colors flex items-center gap-1 font-medium"
            >
              Backlog View <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Scrollable Focus Item Cards */}
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {displayedItems.length === 0 ? (
              <div className="p-8 text-center bg-[#080b12] border border-[#182032] rounded-xl text-xs text-[#7c869d]">
                <CheckCircle2 className="w-6 h-6 text-emerald-400/50 mx-auto mb-2" />
                No tasks match this filter. Everything is clear!
              </div>
            ) : (
              displayedItems.slice(0, 8).map((w) => {
                const isItemOverdue = isOverdue(w);
                const isItemDueToday = isDueToday(w);

                return (
                  <Link
                    key={w.id}
                    href={`/work?tab=board&highlight=${w.id}`}
                    className={`block p-3 rounded-xl border transition-all duration-150 group hover:border-[#cda052]/60 ${
                      isItemOverdue
                        ? 'bg-[#12080c] border-rose-900/50 hover:bg-[#180a10]'
                        : isItemDueToday
                        ? 'bg-[#140e08] border-amber-900/50 hover:bg-[#1a120a]'
                        : w.state === 'Active'
                        ? 'bg-[#080e18] border-sky-900/40 hover:bg-[#0b1322]'
                        : 'bg-[#080b12] border-[#182032] hover:bg-[#0d121d]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {/* Priority Badge */}
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                              w.priority === 1
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                                : w.priority === 2
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                                : 'bg-[#141a28] text-[#94a3b8]'
                            }`}
                          >
                            P{w.priority}
                          </span>

                          {/* Work Item Type */}
                          <span className="text-[10px] text-[#7c869d] font-mono font-medium">
                            {w.type}
                          </span>

                          {/* Operation Category if present */}
                          {w.operationCategory && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#131a29] text-[#94a3b8] font-mono truncate max-w-[140px]">
                              {w.operationCategory}
                            </span>
                          )}

                          {/* State Pill */}
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              w.state === 'Active'
                                ? 'text-sky-300 bg-sky-950/60'
                                : w.state === 'Closed' || w.state === 'Resolved'
                                ? 'text-emerald-300 bg-emerald-950/60'
                                : 'text-[#94a3b8] bg-[#121623]'
                            }`}
                          >
                            {w.state}
                          </span>
                        </div>

                        {/* Title with clean high-contrast readability */}
                        <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#cda052] transition-colors leading-snug truncate">
                          {w.title}
                        </div>
                      </div>

                      {/* Right Side: Due Badge & Assignee */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {isItemOverdue ? (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800/60 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                          </span>
                        ) : isItemDueToday ? (
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Due Today
                          </span>
                        ) : w.targetDate ? (
                          <span className="text-[10px] font-mono text-[#7c869d]">
                            Due {new Date(w.targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        ) : null}

                        {w.assignee && (
                          <span className="text-[10px] text-[#94a3b8] flex items-center gap-1 font-mono">
                            <User className="w-2.5 h-2.5" />
                            {w.assignee}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Quick Footer Link */}
          <div className="pt-2 border-t border-[#182032] flex items-center justify-between text-xs text-[#94a3b8]">
            <span>Click any item to view details & update state in the Sprint Board</span>
            <Link href="/work" className="text-[#cda052] hover:underline font-semibold flex items-center gap-1">
              All Tasks →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
