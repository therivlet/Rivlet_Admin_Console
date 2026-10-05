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
  LineChart as LineChartIcon,
  Calendar,
  Grid
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
  const [viewMode, setViewMode] = useState<'timeline' | 'stream' | 'split'>('timeline');
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentSprint = useMemo(
    () => sprints.find((s) => s.startDate <= todayStr && s.endDate >= todayStr),
    [sprints, todayStr]
  );

  // Relevant items for current sprint or all items
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
    if (!currentSprint) return { daysTotal: 14, daysElapsed: 4, daysRemaining: 10, expectedPct: 30, onPace: true };
    const start = new Date(currentSprint.startDate + 'T00:00:00').getTime();
    const end = new Date(currentSprint.endDate + 'T00:00:00').getTime();
    const now = new Date(todayStr + 'T00:00:00').getTime();
    const totalMs = Math.max(1, end - start);
    const elapsedMs = Math.max(0, now - start);
    const daysTotal = Math.ceil(totalMs / (1000 * 3600 * 24)) + 1;
    const daysElapsed = Math.min(daysTotal, Math.ceil(elapsedMs / (1000 * 3600 * 24)) + 1);
    const daysRemaining = Math.max(0, daysTotal - daysElapsed);
    const expectedPct = Math.round((daysElapsed / daysTotal) * 100);
    const onPace = completionPct >= expectedPct - 15;

    return { daysTotal, daysElapsed, daysRemaining, expectedPct, onPace };
  }, [currentSprint, todayStr, completionPct]);

  // Priority Breakdown
  const p1Items = useMemo(() => sprintItems.filter((w) => w.priority === 1 && w.state !== 'Closed'), [sprintItems]);
  const p2Items = useMemo(() => sprintItems.filter((w) => w.priority === 2 && w.state !== 'Closed'), [sprintItems]);
  const p3Items = useMemo(() => sprintItems.filter((w) => (w.priority === 3 || w.priority === 4) && w.state !== 'Closed'), [sprintItems]);

  // 14-Day Sprint Timeline Points Generator
  const sprintTimelineDays = useMemo(() => {
    const start = currentSprint ? new Date(currentSprint.startDate + 'T00:00:00') : new Date(Date.now() - 3 * 86400000);
    const end = currentSprint ? new Date(currentSprint.endDate + 'T00:00:00') : new Date(Date.now() + 10 * 86400000);
    const days: {
      dateStr: string;
      displayDate: string;
      dayNum: number;
      isToday: boolean;
      isPast: boolean;
      dueTasks: WorkItem[];
      targetPaceCount: number;
      actualCompletedCount: number;
    }[] = [];

    const cur = new Date(start);
    let dayNum = 1;
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);

    while (cur <= end) {
      const dateStr = cur.toISOString().slice(0, 10);
      const isToday = dateStr === todayStr;
      const isPast = dateStr <= todayStr;
      const dueTasks = sprintItems.filter((w) => w.targetDate === dateStr);

      // Cumulative tasks resolved up to this day
      const actualCompletedCount = isPast
        ? Math.round((completedTasks / Math.max(1, sprintPacing.daysElapsed)) * Math.min(dayNum, sprintPacing.daysElapsed))
        : 0;

      const targetPaceCount = Math.round((totalTasks / totalDays) * dayNum);

      days.push({
        dateStr,
        displayDate: cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayNum,
        isToday,
        isPast,
        dueTasks,
        targetPaceCount,
        actualCompletedCount,
      });

      cur.setDate(cur.getDate() + 1);
      dayNum++;
    }

    return days;
  }, [currentSprint, sprintItems, todayStr, totalTasks, completedTasks, sprintPacing.daysElapsed]);

  // SVG Coordinates for Timeline Graph
  const svgWidth = 720;
  const svgHeight = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const maxTaskVal = Math.max(totalTasks, 5);

  const getTimelineX = (i: number) => {
    if (sprintTimelineDays.length <= 1) return padding.left + graphWidth / 2;
    return padding.left + (i / (sprintTimelineDays.length - 1)) * graphWidth;
  };

  const getTimelineY = (val: number) => {
    return padding.top + graphHeight - (Math.min(val, maxTaskVal) / maxTaskVal) * graphHeight;
  };

  const targetPacePath = useMemo(() => {
    if (sprintTimelineDays.length === 0) return '';
    return sprintTimelineDays.reduce(
      (path, d, i) => `${path} ${i === 0 ? 'M' : 'L'} ${getTimelineX(i)} ${getTimelineY(d.targetPaceCount)}`,
      ''
    );
  }, [sprintTimelineDays, maxTaskVal]);

  const pastDays = sprintTimelineDays.filter((d) => d.isPast);
  const actualCompletedPath = useMemo(() => {
    if (pastDays.length === 0) return '';
    return pastDays.reduce(
      (path, d, i) => `${path} ${i === 0 ? 'M' : 'L'} ${getTimelineX(i)} ${getTimelineY(d.actualCompletedCount)}`,
      ''
    );
  }, [pastDays, maxTaskVal]);

  const todayIndex = sprintTimelineDays.findIndex((d) => d.isToday);
  const activeDay = hoveredDayIndex !== null ? sprintTimelineDays[hoveredDayIndex] : null;

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

    return list.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      if (a.targetDate && b.targetDate) return a.targetDate.localeCompare(b.targetDate);
      return 0;
    });
  }, [activeFilter, activeItems, dueTodayItems, overdueItems, closedItems, inReviewItems, newItems]);

  // Circular progress ring
  const circleSize = 80;
  const strokeWidth = 7;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPct / 100) * circumference;

  return (
    <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden transition-all">
      {/* Background ambient lighting */}
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

        {/* ACTIVE WORKING VIEW SWITCHER: Timeline Graph vs Action Stream vs Split */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-[#080b12] border border-[#1c2438]">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-[#182032] text-white shadow-sm font-semibold border border-indigo-500/40'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Timeline Graph</span>
            </button>
            <button
              onClick={() => setViewMode('stream')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'stream'
                  ? 'bg-[#182032] text-white shadow-sm font-semibold border border-[#cda052]/40'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Action Stream</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hidden md:flex ${
                viewMode === 'split'
                  ? 'bg-[#182032] text-white shadow-sm font-semibold border border-purple-500/40'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-purple-400" />
              <span>Split View</span>
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

      {/* ============================================================== */}
      {/* 1. TIMELINE GRAPH VIEW (viewMode === 'timeline' or 'split')     */}
      {/* ============================================================== */}
      {(viewMode === 'timeline' || viewMode === 'split') && (
        <div className={`mt-4 space-y-4 ${viewMode === 'split' ? 'lg:col-span-6' : ''}`}>
          {/* Top Sprint Burndown & Velocity Graph Container */}
          <div className="bg-[#080b12] border border-[#1a2336] rounded-xl p-4 sm:p-5 relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[#141a28]">
              <div>
                <div className="flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Daily Sprint Burndown & Velocity Timeline
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/70 text-indigo-300 font-mono">
                    Day {sprintPacing.daysElapsed} of {sprintPacing.daysTotal}
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">
                  Actual completed tasks vs. Target pacing trajectory across the 14-day sprint cycle.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-[11px] text-[#cbd5e1]">
                  <span className="w-3.5 h-0.5 border-t border-dashed border-[#cda052] inline-block" />
                  Target Pace
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="w-3 h-1 rounded-full bg-emerald-400 inline-block" />
                  Completed ({completedTasks})
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-sky-400">
                  <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                  Today (Day {sprintPacing.daysElapsed})
                </span>
              </div>
            </div>

            {/* SVG Interactive Timeline Chart */}
            <div className="relative w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto min-w-[500px] overflow-visible select-none"
              >
                {/* Y-Axis Grid Lines & Labels */}
                {[0, 0.33, 0.66, 1].map((pct, i) => {
                  const val = Math.round(maxTaskVal * pct);
                  const y = getTimelineY(val);
                  return (
                    <g key={i}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={svgWidth - padding.right}
                        y2={y}
                        stroke="#161f30"
                        strokeDasharray={pct === 0 ? 'none' : '3 3'}
                        strokeWidth={1}
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="9"
                        fill="#64748b"
                        fontFamily="monospace"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Target Pace Dashed Line (Gold) */}
                {targetPacePath && (
                  <path
                    d={targetPacePath}
                    fill="none"
                    stroke="#cda052"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    opacity={0.8}
                  />
                )}

                {/* Actual Completed Tasks Line (Emerald Green) */}
                {actualCompletedPath && (
                  <path
                    d={actualCompletedPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Vertical "Today" Line Marker */}
                {todayIndex >= 0 && (
                  <g>
                    <line
                      x1={getTimelineX(todayIndex)}
                      y1={padding.top}
                      x2={getTimelineX(todayIndex)}
                      y2={padding.top + graphHeight}
                      stroke="#38bdf8"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={getTimelineX(todayIndex)}
                      cy={padding.top + 4}
                      r={3.5}
                      fill="#38bdf8"
                    />
                  </g>
                )}

                {/* Days interactive columns & dots */}
                {sprintTimelineDays.map((d, i) => {
                  const x = getTimelineX(i);
                  const isHovered = hoveredDayIndex === i;
                  const hasDueTasks = d.dueTasks.length > 0;

                  return (
                    <g
                      key={d.dateStr}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredDayIndex(i)}
                      onMouseLeave={() => setHoveredDayIndex(null)}
                      onClick={() => setHoveredDayIndex(hoveredDayIndex === i ? null : i)}
                    >
                      <rect
                        x={x - 14}
                        y={padding.top}
                        width={28}
                        height={graphHeight}
                        fill="transparent"
                      />

                      {/* Hover column highlight */}
                      {isHovered && (
                        <rect
                          x={x - 12}
                          y={padding.top}
                          width={24}
                          height={graphHeight}
                          fill="rgba(99, 102, 241, 0.08)"
                          rx={3}
                        />
                      )}

                      {/* Completed Task Point (for past days) */}
                      {d.isPast && (
                        <circle
                          cx={x}
                          cy={getTimelineY(d.actualCompletedCount)}
                          r={isHovered ? 4.5 : 2.5}
                          fill="#10b981"
                          stroke="#080b12"
                          strokeWidth={1}
                        />
                      )}

                      {/* Scheduled Tasks Due on this Day Marker */}
                      {hasDueTasks && (
                        <g>
                          <circle
                            cx={x}
                            cy={padding.top + graphHeight - 4}
                            r={isHovered ? 4.5 : 3}
                            fill="#f59e0b"
                            stroke="#080b12"
                            strokeWidth={1}
                          />
                        </g>
                      )}

                      {/* X-axis date labels */}
                      <text
                        x={x}
                        y={svgHeight - 8}
                        textAnchor="middle"
                        fontSize="8.5"
                        fill={d.isToday ? '#38bdf8' : isHovered ? '#ffffff' : '#64748b'}
                        fontWeight={d.isToday || isHovered ? 'bold' : 'normal'}
                        fontFamily="monospace"
                      >
                        {d.displayDate}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Interactive Day Details Card */}
            {activeDay && (
              <div className="mt-3 p-3 rounded-xl bg-[#0a0e17] border border-[#232f48] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 font-bold font-mono">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">
                        {new Date(activeDay.dateStr + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-[10px] text-[#7c869d] font-mono">
                        Day {activeDay.dayNum} of {sprintPacing.daysTotal}
                      </span>
                      {activeDay.isToday && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-950/80 text-sky-300 font-mono">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">
                      {activeDay.dueTasks.length > 0 ? (
                        <span>
                          <strong className="text-amber-400">{activeDay.dueTasks.length} task(s)</strong> due on this date:{' '}
                          {activeDay.dueTasks.map((t) => t.title).join(', ')}
                        </span>
                      ) : (
                        <span>No specific deadlines scheduled on this day.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right flex-shrink-0 font-mono">
                  <div>
                    <div className="text-[9px] text-[#7c869d] uppercase">Target Pace</div>
                    <div className="text-xs text-[#cda052] font-bold">{activeDay.targetPaceCount} tasks</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-[#7c869d] uppercase">Actual Done</div>
                    <div className="text-xs text-emerald-400 font-bold">
                      {activeDay.isPast ? `${activeDay.actualCompletedCount} tasks` : '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dual Metrics: Sprint Ring + Workload State Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Sprint Completion Gauge (5 Cols) */}
            <div className="md:col-span-5 bg-[#080b12] border border-[#1a2336] rounded-xl p-4 flex items-center gap-4">
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
                    stroke="#10b981"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-bold text-white font-mono leading-none">{completionPct}%</span>
                  <span className="text-[8px] text-[#7c869d] font-mono mt-0.5">Done</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs font-bold text-white">Sprint Execution</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                      sprintPacing.onPace
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                        : 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                    }`}
                  >
                    {sprintPacing.onPace ? 'On Track' : 'Attention Needed'}
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] font-mono">
                  {completedTasks} of {totalTasks} tasks resolved
                </p>
                <p className="text-[11px] text-[#7c869d] mt-0.5">
                  {sprintPacing.daysRemaining} days remaining in cycle
                </p>
              </div>
            </div>

            {/* Workload State Proportional Stream (7 Cols) */}
            <div className="md:col-span-7 bg-[#080b12] border border-[#1a2336] rounded-xl p-4 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#cbd5e1] flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-400" /> State Distribution
                </span>
                <span className="text-[10px] text-[#7c869d] font-mono">{totalTasks} items</span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-[#141b2a] overflow-hidden flex gap-0.5">
                {closedItems.length > 0 && (
                  <div
                    title={`Done: ${closedItems.length}`}
                    className="h-full bg-emerald-500 rounded-sm"
                    style={{ width: `${(closedItems.length / totalTasks) * 100}%` }}
                  />
                )}
                {activeItems.length > 0 && (
                  <div
                    title={`Active: ${activeItems.length}`}
                    className="h-full bg-sky-400 rounded-sm"
                    style={{ width: `${(activeItems.length / totalTasks) * 100}%` }}
                  />
                )}
                {inReviewItems.length > 0 && (
                  <div
                    title={`In Review: ${inReviewItems.length}`}
                    className="h-full bg-indigo-500 rounded-sm"
                    style={{ width: `${(inReviewItems.length / totalTasks) * 100}%` }}
                  />
                )}
                {dueTodayItems.length > 0 && (
                  <div
                    title={`Due Today: ${dueTodayItems.length}`}
                    className="h-full bg-amber-400 rounded-sm"
                    style={{ width: `${(dueTodayItems.length / totalTasks) * 100}%` }}
                  />
                )}
                {overdueItems.length > 0 && (
                  <div
                    title={`Overdue: ${overdueItems.length}`}
                    className="h-full bg-rose-500 rounded-sm"
                    style={{ width: `${(overdueItems.length / totalTasks) * 100}%` }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-[#94a3b8] flex-wrap">
                <span className="text-emerald-400">● Done: {closedItems.length}</span>
                <span className="text-sky-400">● Active: {activeItems.length}</span>
                <span className="text-amber-400">● Due Today: {dueTodayItems.length}</span>
                <span className="text-rose-400">● Overdue: {overdueItems.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. ACTION STREAM VIEW (viewMode === 'stream' or 'split')       */}
      {/* ============================================================== */}
      {(viewMode === 'stream' || viewMode === 'split') && (
        <div className={`mt-4 space-y-3 ${viewMode === 'split' ? 'lg:col-span-6' : ''}`}>
          {/* Action Stream Sub-header & Filter Chips */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#182032]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Prioritized Task Focus Queue</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#182032] text-[#94a3b8] font-mono">
                {displayedItems.length} Tasks
              </span>
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'all'
                    ? 'bg-[#182032] text-[#cda052] font-semibold border border-[#cda052]/40'
                    : 'bg-[#080b12] text-[#94a3b8] hover:text-white border border-[#182032]'
                }`}
              >
                All ({totalTasks})
              </button>
              <button
                onClick={() => setActiveFilter('active')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'active'
                    ? 'bg-sky-950/70 text-sky-200 font-semibold border border-sky-600/50'
                    : 'bg-[#080b12] text-[#94a3b8] hover:text-white border border-[#182032]'
                }`}
              >
                Active ({activeItems.length})
              </button>
              <button
                onClick={() => setActiveFilter('dueToday')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'dueToday'
                    ? 'bg-amber-950/70 text-amber-200 font-semibold border border-amber-600/50'
                    : 'bg-[#080b12] text-[#94a3b8] hover:text-white border border-[#182032]'
                }`}
              >
                Due Today ({dueTodayItems.length})
              </button>
              <button
                onClick={() => setActiveFilter('overdue')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === 'overdue'
                    ? 'bg-rose-950/70 text-rose-200 font-semibold border border-rose-600/50'
                    : 'bg-[#080b12] text-[#94a3b8] hover:text-white border border-[#182032]'
                }`}
              >
                Overdue ({overdueItems.length})
              </button>
            </div>
          </div>

          {/* Task Cards Feed */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {displayedItems.length === 0 ? (
              <div className="p-8 text-center bg-[#080b12] border border-[#182032] rounded-xl text-xs text-[#7c869d]">
                <CheckCircle2 className="w-6 h-6 text-emerald-400/50 mx-auto mb-2" />
                No tasks match this filter. Everything is clear!
              </div>
            ) : (
              displayedItems.map((w) => {
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

                          <span className="text-[10px] text-[#7c869d] font-mono font-medium">
                            {w.type}
                          </span>

                          {w.operationCategory && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#131a29] text-[#94a3b8] font-mono truncate max-w-[140px]">
                              {w.operationCategory}
                            </span>
                          )}

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

                        <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-[#cda052] transition-colors leading-snug truncate">
                          {w.title}
                        </div>
                      </div>

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
        </div>
      )}
    </div>
  );
}
