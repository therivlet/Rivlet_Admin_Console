'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Eye,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { BudgetItem, CashInflowEntry } from '@/lib/types';

interface BudgetAnalyticsGraphProps {
  budgetItems: BudgetItem[];
  totalPlanned: number;
  cashInflows: CashInflowEntry[];
  currency?: string;
  onOpenInflowModal?: () => void;
}

function formatINR(n: number) {
  if (Math.abs(n) >= 10000000) {
    return `₹${(n / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(n) >= 100000) {
    return `₹${(n / 100000).toFixed(2)} L`;
  }
  if (Math.abs(n) >= 1000) {
    return `₹${(n / 1000).toFixed(1)}k`;
  }
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function formatFullINR(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

// Curated vibrant modern color palette for categories
const CATEGORY_COLORS = [
  { stroke: '#818cf8', fill: 'rgba(129, 140, 248, 0.25)', text: 'text-indigo-400', border: 'border-indigo-500/40' },
  { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.25)', text: 'text-cyan-400', border: 'border-cyan-500/40' },
  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.25)', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)', text: 'text-amber-400', border: 'border-amber-500/40' },
  { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.25)', text: 'text-pink-400', border: 'border-pink-500/40' },
  { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.25)', text: 'text-sky-400', border: 'border-sky-500/40' },
  { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.25)', text: 'text-rose-400', border: 'border-rose-500/40' },
  { stroke: '#a855f7', fill: 'rgba(168, 85, 247, 0.25)', text: 'text-purple-400', border: 'border-purple-500/40' },
  { stroke: '#14b8a6', fill: 'rgba(20, 184, 166, 0.25)', text: 'text-teal-400', border: 'border-teal-500/40' },
  { stroke: '#eab308', fill: 'rgba(234, 179, 8, 0.25)', text: 'text-yellow-400', border: 'border-yellow-500/40' },
];

export default function BudgetAnalyticsGraph({
  budgetItems,
  totalPlanned,
  cashInflows,
  currency = '₹',
  onOpenInflowModal,
}: BudgetAnalyticsGraphProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'categories' | 'combined'>('combined');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [visibleLines, setVisibleLines] = useState({
    budgetCeiling: true,
    cashInflow: true,
    actualSpend: true,
    cashBalance: true,
  });

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Calculate Aggregates
  const totalActualSpend = useMemo(
    () => budgetItems.reduce((acc, b) => acc + (b.actualAmount || 0), 0),
    [budgetItems]
  );

  const totalInflowToDate = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return cashInflows
      .filter((inf) => inf.date <= todayStr)
      .reduce((acc, inf) => acc + inf.amount, 0);
  }, [cashInflows]);

  const totalAllInflows = useMemo(
    () => cashInflows.reduce((acc, inf) => acc + inf.amount, 0),
    [cashInflows]
  );

  const currentLiquidCash = Math.max(0, totalInflowToDate - totalActualSpend);
  const inflowCoveragePct = totalPlanned > 0 ? Math.round((totalAllInflows / totalPlanned) * 100) : 0;
  const spendOfInflowPct = totalInflowToDate > 0 ? Math.round((totalActualSpend / totalInflowToDate) * 100) : 0;

  // 2. Build Chronological Cashflow & Burn Timeline Points
  const timelineData = useMemo(() => {
    interface TimelineEvent {
      date: string;
      inflowDelta: number;
      spendDelta: number;
      notes: string[];
      isFuture: boolean;
    }

    const eventsByDate = new Map<string, TimelineEvent>();
    const todayStr = new Date().toISOString().slice(0, 10);

    // Add Inflows
    cashInflows.forEach((inf) => {
      const d = inf.date || todayStr;
      const current = eventsByDate.get(d) || {
        date: d,
        inflowDelta: 0,
        spendDelta: 0,
        notes: [],
        isFuture: d > todayStr,
      };
      current.inflowDelta += inf.amount;
      current.notes.push(`+${formatINR(inf.amount)} (${inf.source || 'Capital Inflow'})`);
      eventsByDate.set(d, current);
    });

    // Add Spends
    budgetItems.forEach((b) => {
      (b.spendLog || []).forEach((s) => {
        const d = s.date || todayStr;
        const current = eventsByDate.get(d) || {
          date: d,
          inflowDelta: 0,
          spendDelta: 0,
          notes: [],
          isFuture: d > todayStr,
        };
        current.spendDelta += s.amount;
        current.notes.push(`-${formatINR(s.amount)} (${b.category}${s.note ? `: ${s.note}` : ''})`);
        eventsByDate.set(d, current);
      });
    });

    // Ensure we always have today in the timeline
    if (!eventsByDate.has(todayStr)) {
      eventsByDate.set(todayStr, {
        date: todayStr,
        inflowDelta: 0,
        spendDelta: 0,
        notes: ['Today (Current Position)'],
        isFuture: false,
      });
    }

    // Sort chronologically
    const sortedDates = Array.from(eventsByDate.keys()).sort((a, b) => a.localeCompare(b));

    // Calculate cumulative running values
    let cumInflow = 0;
    let cumSpend = 0;

    return sortedDates.map((d, index) => {
      const item = eventsByDate.get(d)!;
      cumInflow += item.inflowDelta;
      cumSpend += item.spendDelta;
      const balance = Math.max(0, cumInflow - cumSpend);

      return {
        index,
        date: d,
        displayDate: new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        inflowDelta: item.inflowDelta,
        spendDelta: item.spendDelta,
        cumInflow,
        cumSpend,
        balance,
        budgetCeiling: totalPlanned,
        notes: item.notes,
        isFuture: item.isFuture,
      };
    });
  }, [cashInflows, budgetItems, totalPlanned]);

  // 3. SVG Coordinates Calculation for Multi-Line Graph
  const svgWidth = 800;
  const svgHeight = 280;
  const padding = { top: 30, right: 35, bottom: 40, left: 60 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const maxVal = useMemo(() => {
    let max = Math.max(totalPlanned, totalAllInflows, totalActualSpend, 100000);
    timelineData.forEach((p) => {
      max = Math.max(max, p.cumInflow, p.cumSpend, p.balance, p.budgetCeiling);
    });
    return Math.ceil(max * 1.15); // 15% headroom
  }, [totalPlanned, totalAllInflows, totalActualSpend, timelineData]);

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(val, maxVal));
    return padding.top + graphHeight - (clamped / maxVal) * graphHeight;
  };

  const getX = (index: number) => {
    if (timelineData.length <= 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (timelineData.length - 1)) * graphWidth;
  };

  // Generate SVG Path definitions
  const budgetLineY = getY(totalPlanned);

  const inflowPath = useMemo(() => {
    if (timelineData.length === 0) return '';
    return timelineData.reduce(
      (path, pt, i) => `${path} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.cumInflow)}`,
      ''
    );
  }, [timelineData, maxVal]);

  const inflowAreaPath = useMemo(() => {
    if (timelineData.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(timelineData.length - 1);
    const bottomY = padding.top + graphHeight;
    return `${inflowPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [inflowPath, timelineData]);

  const spendPath = useMemo(() => {
    if (timelineData.length === 0) return '';
    return timelineData.reduce(
      (path, pt, i) => `${path} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.cumSpend)}`,
      ''
    );
  }, [timelineData, maxVal]);

  const balancePath = useMemo(() => {
    if (timelineData.length === 0) return '';
    return timelineData.reduce(
      (path, pt, i) => `${path} ${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(pt.balance)}`,
      ''
    );
  }, [timelineData, maxVal]);

  // Active hover point
  const activePoint = hoveredPointIndex !== null ? timelineData[hoveredPointIndex] : null;

  return (
    <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-4 sm:p-6 shadow-xl mb-6 relative overflow-hidden transition-all">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-48 bg-[#cda052]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#182032] relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.12)] text-[#cda052] font-mono font-semibold border border-[rgba(205,160,82,0.25)] uppercase tracking-wider">
              Launch Capital Telemetry
            </span>
            <span className="text-xs text-[#94a3b8] font-medium">• Multi-Stream Financial HUD</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Launch Financial Engine & Cashflow Trajectory
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Planned Budget Ceiling vs. Capital Injected (Inflows) vs. Cumulative Spend with live Runway on hand.
          </p>
        </div>

        {/* View Mode Switcher & Quick Action */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center p-1 rounded-xl bg-[#080b12] border border-[#1c2438]">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-[#182032] text-white shadow-sm font-semibold'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cashflow Curve</span>
            </button>
            <button
              onClick={() => setViewMode('categories')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'categories'
                  ? 'bg-[#182032] text-white shadow-sm font-semibold'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Category Share</span>
            </button>
            <button
              onClick={() => setViewMode('combined')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'combined'
                  ? 'bg-gradient-to-r from-[rgba(205,160,82,0.25)] to-[rgba(16,185,129,0.2)] text-white shadow-sm font-semibold border border-[rgba(205,160,82,0.4)]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Combined HUD</span>
            </button>
          </div>

          {onOpenInflowModal && (
            <button
              onClick={onOpenInflowModal}
              title="Add capital injection / cash inflow"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm hover:shadow-glow/20 transition-all flex-shrink-0"
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>+ Add Inflow</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Multi-colored Live Telemetry Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4 relative z-10">
        {/* Metric 1: Planned Budget Goal */}
        <div className="bg-[#080b12] border border-[#1a2336] p-3 sm:p-3.5 rounded-xl relative group">
          <div className="flex items-center justify-between text-[11px] text-[#94a3b8] uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#cda052] inline-block shadow-sm" />
              Planned Cap
            </span>
            <span className="text-[10px] text-[#7c869d] font-mono">100% Target</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono mt-1">
            {formatFullINR(totalPlanned)}
          </div>
          <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center justify-between">
            <span>Approved ceiling</span>
            <span className="text-[#cda052] font-mono font-medium">{budgetItems.length} categories</span>
          </div>
        </div>

        {/* Metric 2: Capital Injected (Inflow) */}
        <div className="bg-[#080b12] border border-emerald-900/40 p-3 sm:p-3.5 rounded-xl relative group">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_#10b981]" />
              Inflows Injected
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
              {inflowCoveragePct}% Funded
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-300 font-mono mt-1">
            {formatFullINR(totalAllInflows)}
          </div>
          <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center justify-between">
            <span>{cashInflows.length} Tranche{cashInflows.length === 1 ? '' : 's'}</span>
            <span className="text-emerald-400 font-mono">
              {totalAllInflows >= totalPlanned ? 'Fully Funded' : `${formatINR(totalPlanned - totalAllInflows)} to inject`}
            </span>
          </div>
        </div>

        {/* Metric 3: Total Spent */}
        <div className="bg-[#080b12] border border-rose-900/40 p-3 sm:p-3.5 rounded-xl relative group">
          <div className="flex items-center justify-between text-[11px] text-rose-400 uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400 inline-block shadow-[0_0_8px_#f43f5e]" />
              Actual Spent
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40">
              {spendOfInflowPct}% of Inflow
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-rose-300 font-mono mt-1">
            {formatFullINR(totalActualSpend)}
          </div>
          <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center justify-between">
            <span>Outflow to date</span>
            <span className="text-rose-400 font-mono">{totalPlanned > 0 ? Math.round((totalActualSpend / totalPlanned) * 100) : 0}% of Cap</span>
          </div>
        </div>

        {/* Metric 4: Available Liquid Cash */}
        <div className="bg-[#080b12] border border-cyan-900/40 p-3 sm:p-3.5 rounded-xl relative group">
          <div className="flex items-center justify-between text-[11px] text-cyan-400 uppercase tracking-wide">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-[0_0_8px_#06b6d4]" />
              Liquid Cash in Bank
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
              Runway Ready
            </span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-cyan-300 font-mono mt-1">
            {formatFullINR(currentLiquidCash)}
          </div>
          <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center justify-between">
            <span>Inflows − Spent</span>
            <span className="text-cyan-400 font-mono">₹ on Hand</span>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas */}
      {(viewMode === 'timeline' || viewMode === 'combined') && (
        <div className="bg-[#080b12] border border-[#182032] rounded-xl p-3 sm:p-4 my-2 relative">
          {/* Interactive Legend Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2 pb-2 border-b border-[#141a28] text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => toggleLine('budgetCeiling')}
                className={`flex items-center gap-1.5 transition-opacity ${
                  visibleLines.budgetCeiling ? 'opacity-100' : 'opacity-40 line-through'
                }`}
              >
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#cda052] inline-block" />
                <span className="text-[#cda052] font-semibold text-[11px]">Budget Ceiling ({formatINR(totalPlanned)})</span>
              </button>

              <button
                onClick={() => toggleLine('cashInflow')}
                className={`flex items-center gap-1.5 transition-opacity ${
                  visibleLines.cashInflow ? 'opacity-100' : 'opacity-40 line-through'
                }`}
              >
                <span className="w-3.5 h-1 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#10b981]" />
                <span className="text-emerald-300 font-semibold text-[11px]">Cumulative Inflow ({formatINR(totalAllInflows)})</span>
              </button>

              <button
                onClick={() => toggleLine('actualSpend')}
                className={`flex items-center gap-1.5 transition-opacity ${
                  visibleLines.actualSpend ? 'opacity-100' : 'opacity-40 line-through'
                }`}
              >
                <span className="w-3.5 h-1 rounded-full bg-rose-400 inline-block shadow-[0_0_6px_#f43f5e]" />
                <span className="text-rose-300 font-semibold text-[11px]">Cumulative Spent ({formatINR(totalActualSpend)})</span>
              </button>

              <button
                onClick={() => toggleLine('cashBalance')}
                className={`flex items-center gap-1.5 transition-opacity ${
                  visibleLines.cashBalance ? 'opacity-100' : 'opacity-40 line-through'
                }`}
              >
                <span className="w-3.5 h-1 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_#06b6d4]" />
                <span className="text-cyan-300 font-semibold text-[11px]">Liquid Cash ({formatINR(currentLiquidCash)})</span>
              </button>
            </div>

            <div className="text-[11px] text-[#7c869d] font-mono">
              Hover markers for granular ledger notes
            </div>
          </div>

          {/* SVG Viewport */}
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[550px] overflow-visible select-none"
            >
              <defs>
                {/* Emerald Gradient for Inflow Fill */}
                <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>

                {/* Cyan Gradient for Balance Fill */}
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>

                {/* Rose Gradient for Spend Glow */}
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>

                {/* Shadow filters for glowing points */}
                <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#cda052" floodOpacity="0.8" />
                </filter>
                <filter id="glowEmerald" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.8" />
                </filter>
                <filter id="glowRose" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f43f5e" floodOpacity="0.8" />
                </filter>
                <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Horizontal grid lines & Y-Axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const val = maxVal * pct;
                const y = getY(val);
                return (
                  <g key={i}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke="#1a2336"
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
                      {formatINR(val)}
                    </text>
                  </g>
                );
              })}

              {/* Shaded Area for Inflow */}
              {visibleLines.cashInflow && inflowAreaPath && (
                <path d={inflowAreaPath} fill="url(#inflowGrad)" />
              )}

              {/* Budget Ceiling Reference Line */}
              {visibleLines.budgetCeiling && (
                <g>
                  <line
                    x1={padding.left}
                    y1={budgetLineY}
                    x2={svgWidth - padding.right}
                    y2={budgetLineY}
                    stroke="#cda052"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    opacity={0.85}
                  />
                  <rect
                    x={svgWidth - padding.right - 95}
                    y={budgetLineY - 11}
                    width={90}
                    height={18}
                    rx={4}
                    fill="#18150c"
                    stroke="#cda052"
                    strokeWidth={1}
                  />
                  <text
                    x={svgWidth - padding.right - 50}
                    y={budgetLineY + 1.5}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill="#e8ca78"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    CAP: {formatINR(totalPlanned)}
                  </text>
                </g>
              )}

              {/* Liquid Cash Balance Line */}
              {visibleLines.cashBalance && balancePath && (
                <path
                  d={balancePath}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glowCyan)"
                />
              )}

              {/* Cumulative Spend Line */}
              {visibleLines.actualSpend && spendPath && (
                <path
                  d={spendPath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glowRose)"
                />
              )}

              {/* Cumulative Cash Inflow Line */}
              {visibleLines.cashInflow && inflowPath && (
                <path
                  d={inflowPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glowEmerald)"
                />
              )}

              {/* Data Markers & Interactive Hover Pillars */}
              {timelineData.map((pt, i) => {
                const x = getX(i);
                const isHovered = hoveredPointIndex === i;
                const isScheduledFuture = pt.isFuture;

                return (
                  <g
                    key={pt.date + i}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(i)}
                    onMouseLeave={() => setHoveredPointIndex(null)}
                    onClick={() => setHoveredPointIndex(hoveredPointIndex === i ? null : i)}
                  >
                    {/* Invisible hit column */}
                    <rect
                      x={x - 18}
                      y={padding.top}
                      width={36}
                      height={graphHeight}
                      fill="transparent"
                    />

                    {/* Vertical indicator line on hover */}
                    {isHovered && (
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={padding.top + graphHeight}
                        stroke="#94a3b8"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        opacity={0.8}
                      />
                    )}

                    {/* Inflow Marker */}
                    {visibleLines.cashInflow && (
                      <circle
                        cx={x}
                        cy={getY(pt.cumInflow)}
                        r={isHovered ? 5.5 : pt.inflowDelta > 0 ? 4.5 : 3}
                        fill={isScheduledFuture ? '#092d24' : '#10b981'}
                        stroke="#080b12"
                        strokeWidth={1.5}
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Spend Marker */}
                    {visibleLines.actualSpend && (
                      <circle
                        cx={x}
                        cy={getY(pt.cumSpend)}
                        r={isHovered ? 5.5 : pt.spendDelta > 0 ? 4.5 : 2.5}
                        fill="#f43f5e"
                        stroke="#080b12"
                        strokeWidth={1.5}
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Liquid Balance Marker */}
                    {visibleLines.cashBalance && (
                      <circle
                        cx={x}
                        cy={getY(pt.balance)}
                        r={isHovered ? 4.5 : 2.5}
                        fill="#06b6d4"
                        stroke="#080b12"
                        strokeWidth={1.5}
                        className="transition-all duration-150"
                      />
                    )}

                    {/* X-axis Date Labels */}
                    <text
                      x={x}
                      y={svgHeight - 12}
                      textAnchor="middle"
                      fontSize="9.5"
                      fill={isHovered ? '#ffffff' : isScheduledFuture ? '#a7f3d0' : '#94a3b8'}
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      fontFamily="monospace"
                    >
                      {pt.displayDate}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Dynamic Hover Card */}
          {activePoint && (
            <div className="mt-3 p-3 rounded-xl bg-[#0a0e17] border border-[#232f48] shadow-glass flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[rgba(205,160,82,0.12)] text-[#cda052] font-mono font-bold flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono text-sm">
                      {new Date(activePoint.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {activePoint.isFuture && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono font-semibold">
                        Scheduled Future Injection
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#94a3b8]">
                    {activePoint.notes.map((note, nIdx) => (
                      <span key={nIdx} className="bg-[#141b2b] px-2 py-0.5 rounded text-[#cbd5e1]">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right flex-shrink-0">
                <div>
                  <div className="text-[10px] text-[#94a3b8] uppercase">Inflow to Date</div>
                  <div className="font-bold text-emerald-400 font-mono">{formatFullINR(activePoint.cumInflow)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#94a3b8] uppercase">Spent to Date</div>
                  <div className="font-bold text-rose-400 font-mono">{formatFullINR(activePoint.cumSpend)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#94a3b8] uppercase">Available Cash</div>
                  <div className="font-bold text-cyan-400 font-mono">{formatFullINR(activePoint.balance)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Colored Category Distribution View */}
      {(viewMode === 'categories' || viewMode === 'combined') && (
        <div className="mt-4 pt-4 border-t border-[#182032]">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Colored Category Allocation & Burn Distribution
              </h3>
            </div>
            <span className="text-[11px] text-[#7c869d] font-mono">
              Planned vs. Actual Spend per Category
            </span>
          </div>

          {/* Comparative Multi-Colored Bars */}
          <div className="space-y-2.5">
            {budgetItems.map((item, index) => {
              const theme = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              const planned = item.plannedAmount || 0;
              const actual = item.actualAmount || 0;
              const pct = planned > 0 ? Math.round((actual / planned) * 100) : 0;
              const shareOfBudget = totalPlanned > 0 ? ((planned / totalPlanned) * 100).toFixed(1) : '0';
              const isOver = pct > 100;
              const isHovered = hoveredCategory === item.id;

              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setHoveredCategory(item.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`bg-[#080b12] border transition-all rounded-xl p-3 ${
                    isHovered ? 'border-[#3b4968] bg-[#0c101a]' : 'border-[#171f30]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: theme.stroke }}
                      />
                      <span className="text-xs font-semibold text-white truncate max-w-[240px] sm:max-w-md">
                        {item.category}
                      </span>
                      {item.phase && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#131a29] text-[#94a3b8] font-mono hidden sm:inline-block">
                          {item.phase}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-[#94a3b8]">
                        Spent: <strong className="text-white">{formatINR(actual)}</strong>
                      </span>
                      <span className="text-[#64748b]">/</span>
                      <span className="text-[#94a3b8]">
                        Planned: <strong className="text-white">{formatINR(planned)}</strong>
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isOver
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                            : pct > 80
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                            : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/40'
                        }`}
                      >
                        {pct}% Used ({shareOfBudget}% Share)
                      </span>
                    </div>
                  </div>

                  {/* Dual comparative progress bar */}
                  <div className="w-full h-2 rounded-full bg-[#141b2a] overflow-hidden flex relative">
                    {/* Actual Spend filled bar */}
                    <div
                      className="h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: isOver ? '#f43f5e' : theme.stroke,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
