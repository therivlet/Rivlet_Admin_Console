'use client';

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Plus,
  ArrowRight,
  TrendingUp,
  Percent,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  DollarSign,
  Tag,
  BarChart3,
  Shirt,
  HelpCircle,
  Clock,
  ArrowUpRight,
  Building2,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { CostingSheet } from '@/lib/types';
import { calculateScenario, formatMoney, formatPercent } from '@/lib/pricingEngine';

interface CalculatorOverviewDashboardProps {
  costingSheets: CostingSheet[];
  onStartNewWithInputs: (inputs: {
    productName: string;
    productCode: string;
    mrp: number;
    targetMargin: number;
  }) => void;
  onOpenSheet: (sheet: CostingSheet) => void;
  onNavigateToTab: (tab: 'overview' | 'studio' | 'styles' | 'guide') => void;
}

export default function CalculatorOverviewDashboard({
  costingSheets,
  onStartNewWithInputs,
  onOpenSheet,
  onNavigateToTab,
}: CalculatorOverviewDashboardProps) {
  // Quick-start New Calculator State
  const [quickName, setQuickName] = useState('');
  const [quickCode, setQuickCode] = useState('RIV-');
  const [quickMrp, setQuickMrp] = useState<number | ''>(3499);
  const [quickMargin, setQuickMargin] = useState<number | ''>(25);
  const [formError, setFormError] = useState<string | null>(null);

  // Compute unit economics for all active styles on the Expected (Mid) scenario
  const stylesCalculations = useMemo(() => {
    return costingSheets.map((sheet) => {
      const calc = calculateScenario(sheet.inputs, 'mid');
      const mrp = sheet.mrp || sheet.inputs.mrp || 0;
      const factoryFob = sheet.inputs.factory || 0;
      const factoryMultiplier = factoryFob > 0 ? (mrp / factoryFob) : 0;
      const grossMarginPct = calc.grossMargin * 100;
      const contributionMarginPct = calc.contributionMargin * 100;
      const variableOrderCost = calc.fixedOrder + calc.salesRateCost;
      const netSalesRetention = calc.customerPrice > 0 ? (calc.netSales / calc.customerPrice) * 100 : 0;
      const overheadAbsorptionRatio = calc.netSales > 0 ? (calc.overheadPerUnit / calc.netSales) * 100 : 0;

      return {
        sheet,
        calc,
        mrp,
        customerPrice: calc.customerPrice,
        outputRate: calc.outputRate,
        outputGst: calc.outputGst,
        netSales: calc.netSales,
        landedCost: calc.baseProductCost,
        grossProfit: calc.grossProfit,
        grossMarginPct,
        overheadPerUnit: calc.overheadPerUnit,
        variableOrderCost,
        contributionProfit: calc.contributionProfit,
        contributionMarginPct,
        targetMargin: sheet.inputs.targetMargin,
        factoryFob,
        factoryMultiplier,
        netSalesRetention,
        overheadAbsorptionRatio,
        status: calc.status,
      };
    });
  }, [costingSheets]);

  // Aggregate Portfolio Financial Summary
  const portfolioStats = useMemo(() => {
    const total = stylesCalculations.length;
    if (total === 0) {
      return {
        count: 0,
        avgMrp: 0,
        avgCustomerPrice: 0,
        avgMargin: 0,
        avgLandedCost: 0,
        avgMultiplier: 0,
        totalAnnualRev: 0,
        totalAnnualProfit: 0,
      };
    }

    const sumMrp = stylesCalculations.reduce((acc, s) => acc + s.mrp, 0);
    const sumCust = stylesCalculations.reduce((acc, s) => acc + s.customerPrice, 0);
    const sumMargin = stylesCalculations.reduce((acc, s) => acc + s.contributionMarginPct, 0);
    const sumLanded = stylesCalculations.reduce((acc, s) => acc + s.landedCost, 0);
    const sumMultiplier = stylesCalculations.reduce((acc, s) => acc + s.factoryMultiplier, 0);
    const sumAnnualRev = stylesCalculations.reduce((acc, s) => acc + (s.calc.annualRevenue || 0), 0);
    const sumAnnualProfit = stylesCalculations.reduce((acc, s) => acc + (s.calc.annualContribution || 0), 0);

    return {
      count: total,
      avgMrp: sumMrp / total,
      avgCustomerPrice: sumCust / total,
      avgMargin: sumMargin / total,
      avgLandedCost: sumLanded / total,
      avgMultiplier: sumMultiplier / total,
      totalAnnualRev: sumAnnualRev,
      totalAnnualProfit: sumAnnualProfit,
    };
  }, [stylesCalculations]);

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      setFormError('Please enter a product / style name');
      return;
    }
    if (!quickCode.trim() || quickCode === 'RIV-') {
      setFormError('Please provide a valid SKU / style code');
      return;
    }
    const mrpNum = Number(quickMrp);
    if (!mrpNum || mrpNum <= 0) {
      setFormError('Listed MRP tag must be greater than 0');
      return;
    }
    const marginNum = Number(quickMargin) || 25;

    setFormError(null);
    onStartNewWithInputs({
      productName: quickName.trim(),
      productCode: quickCode.trim(),
      mrp: mrpNum,
      targetMargin: marginNum,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Executive Portfolio Hero Banner */}
      <div className="rounded-2xl border border-[#1d253a] bg-gradient-to-r from-[#0c101a] via-[#0f1424] to-[#0c101a] p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-[#cda052]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#cda052]/10 border border-[#cda052]/25 text-[#e6c875] text-xs font-semibold font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Garment Financial Studio • Portfolio Overview</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-serif">
              Catalog Profitability & Unit Economics Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed">
              Consolidated financial intelligence across all active styles: landed manufacturing costs, output GST absorption, variable selling charges, and net contribution margins.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
            <button
              onClick={() => onNavigateToTab('guide')}
              className="px-3.5 py-2 rounded-xl bg-[#141926] border border-[#232d44] text-[#cbd5e1] hover:text-[#e6c875] hover:border-[#cda052]/50 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="View comprehensive calculation methodology, formulas, Indian GST rules & unit economics guide"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Calculation Guide</span>
            </button>
            <button
              onClick={() => onNavigateToTab('styles')}
              className="px-3.5 py-2 rounded-xl bg-[#141926] border border-[#232d44] text-[#cbd5e1] hover:text-white hover:border-[#cda052]/50 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Shirt className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Active Styles ({costingSheets.length})</span>
            </button>
            <button
              onClick={() => onNavigateToTab('studio')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Full Pricing Studio</span>
            </button>
          </div>
        </div>

        {/* Portfolio KPI Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-5 mt-5 border-t border-[#1a2236]">
          <div className="p-3 bg-[#080b12]/90 rounded-xl border border-[#1b2234]">
            <span className="text-[10px] text-[#717a90] uppercase font-mono tracking-wider block">Active Styles</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-white font-mono">{portfolioStats.count}</span>
              <span className="text-xs text-[#94a3b8]">catalog SKUs</span>
            </div>
          </div>

          <div className="p-3 bg-[#080b12]/90 rounded-xl border border-[#1b2234]">
            <span className="text-[10px] text-[#cda052] uppercase font-mono tracking-wider block">Avg Listed MRP Tag</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-[#e6c875] font-mono">
                {formatMoney(portfolioStats.avgMrp)}
              </span>
              <span className="text-[10px] text-[#717a90]">tag price</span>
            </div>
          </div>

          <div className="p-3 bg-[#080b12]/90 rounded-xl border border-[#1b2234]">
            <span className="text-[10px] text-emerald-400 uppercase font-mono tracking-wider block">Avg Contribution Margin</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {portfolioStats.avgMargin.toFixed(1)}%
              </span>
              <span className="text-[10px] text-emerald-500/80">net profit</span>
            </div>
          </div>

          <div className="p-3 bg-[#080b12]/90 rounded-xl border border-[#1b2234]">
            <span className="text-[10px] text-[#717a90] uppercase font-mono tracking-wider block">Avg Landed Cost</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-white font-mono">
                {formatMoney(portfolioStats.avgLandedCost)}
              </span>
              <span className="text-[10px] text-[#717a90]">per garment</span>
            </div>
          </div>

          <div className="p-3 bg-[#080b12]/90 rounded-xl border border-[#1b2234] col-span-2 sm:col-span-1">
            <span className="text-[10px] text-[#cda052] uppercase font-mono tracking-wider block">Avg Factory Multiplier</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-white font-mono">
                {portfolioStats.avgMultiplier.toFixed(2)}x
              </span>
              <span className="text-[10px] text-[#717a90]">MRP / FOB</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Comparative Dashboards: Cost Composition & Financial Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Graph 1: Cost Composition Stack (Landed + Overhead + Variable Sales + Profit) */}
        <div className="lg:col-span-2 bg-[#0c101a] border border-[#1d253a] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#182032] pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#cda052]" />
                <span>Unit Economics & Cost Composition Breakdown</span>
              </h3>
              <p className="text-[11px] text-[#717a90]">
                Shows how customer revenue divides into landed cost, fixed overhead fair share, variable sales commissions, and profit.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] flex-wrap">
              <span className="flex items-center gap-1.5 text-blue-300">
                <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Landed FOB + Duty
              </span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Overheads / Unit
              </span>
              <span className="flex items-center gap-1.5 text-purple-300">
                <span className="w-2.5 h-2.5 rounded bg-purple-500" /> Variable Sales Cost
              </span>
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Contribution Profit
              </span>
            </div>
          </div>

          {stylesCalculations.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#717a90]">
              No active styles yet. Create your first style below to visualize composition.
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {stylesCalculations.map((item) => {
                const total = Math.max(1, item.customerPrice);
                const landedPct = Math.min(100, Math.max(0, (item.landedCost / total) * 100));
                const overheadPct = Math.min(100, Math.max(0, (item.overheadPerUnit / total) * 100));
                const variablePct = Math.min(100, Math.max(0, (item.variableOrderCost / total) * 100));
                const profitPct = Math.max(0, item.contributionMarginPct);

                return (
                  <div key={item.sheet.id} className="p-3 bg-[#080b12] rounded-xl border border-[#1a2336] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#cda052] px-2 py-0.5 rounded bg-[#cda052]/10 border border-[#cda052]/20 text-[11px]">
                          {item.sheet.sku}
                        </span>
                        <span className="font-semibold text-white">{item.sheet.styleName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-[#94a3b8]">Customer Price: <strong className="text-white">{formatMoney(item.customerPrice)}</strong></span>
                        <span className="text-[#64748b]">•</span>
                        <span className="text-emerald-400 font-bold">Margin: {item.contributionMarginPct.toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Segmented Stacked Bar */}
                    <div className="w-full h-3 rounded-full bg-[#141a28] flex overflow-hidden shadow-inner">
                      <div
                        style={{ width: `${landedPct}%` }}
                        className="bg-blue-500 hover:brightness-110 transition-all"
                        title={`Landed Cost: ${formatMoney(item.landedCost)} (${landedPct.toFixed(1)}%)`}
                      />
                      <div
                        style={{ width: `${overheadPct}%` }}
                        className="bg-amber-500 hover:brightness-110 transition-all"
                        title={`Overheads / Unit: ${formatMoney(item.overheadPerUnit)} (${overheadPct.toFixed(1)}%)`}
                      />
                      <div
                        style={{ width: `${variablePct}%` }}
                        className="bg-purple-500 hover:brightness-110 transition-all"
                        title={`Variable Sales Cost: ${formatMoney(item.variableOrderCost)} (${variablePct.toFixed(1)}%)`}
                      />
                      <div
                        style={{ width: `${profitPct}%` }}
                        className="bg-emerald-500 hover:brightness-110 transition-all"
                        title={`Contribution Profit: ${formatMoney(item.contributionProfit)} (${profitPct.toFixed(1)}%)`}
                      />
                    </div>

                    {/* Numeric details row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-[#717a90] pt-1">
                      <div>
                        Landed: <strong className="text-blue-300 font-mono">{formatMoney(item.landedCost)}</strong>
                      </div>
                      <div>
                        Overhead: <strong className="text-amber-300 font-mono">{formatMoney(item.overheadPerUnit)}</strong>
                      </div>
                      <div>
                        Variable Sales: <strong className="text-purple-300 font-mono">{formatMoney(item.variableOrderCost)}</strong>
                      </div>
                      <div className="text-right sm:text-left">
                        Profit/Garment: <strong className="text-emerald-400 font-mono font-bold">{formatMoney(item.contributionProfit)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Graph 2: Modern Garment Financial Ratios */}
        <div className="bg-[#0c101a] border border-[#1d253a] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="border-b border-[#182032] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#cda052]" />
              <span>Modern Luxury Ratios</span>
            </h3>
            <p className="text-[11px] text-[#717a90]">
              Key commercial benchmarks for garment margin health and operating leverage.
            </p>
          </div>

          <div className="space-y-3">
            {/* Factory Multiplier */}
            <div className="p-3 bg-[#080b12] rounded-xl border border-[#1b2234] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Factory Multiplier</span>
                <span className="font-mono font-bold text-[#cda052]">{portfolioStats.avgMultiplier.toFixed(2)}x</span>
              </div>
              <p className="text-[10px] text-[#717a90]">
                Formula: Listed MRP ÷ Factory FOB. Luxury benchmark is 3.5x–5.0x for healthy retail markup.
              </p>
              <div className="w-full h-1.5 rounded-full bg-[#141a28] overflow-hidden mt-1">
                <div
                  className="h-full bg-[#cda052] rounded-full"
                  style={{ width: `${Math.min(100, (portfolioStats.avgMultiplier / 5.0) * 100)}%` }}
                />
              </div>
            </div>

            {/* Gross Margin Realization */}
            <div className="p-3 bg-[#080b12] rounded-xl border border-[#1b2234] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Gross Margin Realization</span>
                <span className="font-mono font-bold text-emerald-400">
                  {stylesCalculations.length > 0
                    ? `${(stylesCalculations.reduce((a, b) => a + b.grossMarginPct, 0) / stylesCalculations.length).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <p className="text-[10px] text-[#717a90]">
                (Net Sales − Landed Cost) ÷ Net Sales. Retains margin buffer before marketing & overheads.
              </p>
              <div className="w-full h-1.5 rounded-full bg-[#141a28] overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{
                    width: `${Math.min(100, stylesCalculations.length > 0 ? (stylesCalculations.reduce((a, b) => a + b.grossMarginPct, 0) / stylesCalculations.length) : 0)}%`
                  }}
                />
              </div>
            </div>

            {/* Indian Output GST Realization */}
            <div className="p-3 bg-[#080b12] rounded-xl border border-[#1b2234] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Net Sales Retention (Ex-GST)</span>
                <span className="font-mono font-bold text-sky-400">
                  {stylesCalculations.length > 0
                    ? `${(stylesCalculations.reduce((a, b) => a + b.netSalesRetention, 0) / stylesCalculations.length).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <p className="text-[10px] text-[#717a90]">
                Percentage of customer checkout price retained as revenue after 5% / 18% step GST.
              </p>
            </div>

            {/* Overhead Absorption Ratio */}
            <div className="p-3 bg-[#080b12] rounded-xl border border-[#1b2234] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">Overhead Absorption Rate</span>
                <span className="font-mono font-bold text-amber-300">
                  {stylesCalculations.length > 0
                    ? `${(stylesCalculations.reduce((a, b) => a + b.overheadAbsorptionRatio, 0) / stylesCalculations.length).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <p className="text-[10px] text-[#717a90]">
                Brand overhead per unit as % of net sales. Healthy operating leverage is &lt; 5%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Consolidated Pricing & Unit Economy Comparison Table */}
      <div className="bg-[#0c101a] border border-[#1d253a] rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#cda052]" />
              <span>Active Styles Pricing & Unit Economy Matrix</span>
            </h3>
            <p className="text-[11px] text-[#717a90]">
              Full comparative matrix across all catalog products: MRP tags, discounted customer prices, GST rates, landed costs, gross and contribution margins.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('styles')}
            className="text-xs text-[#cda052] hover:underline flex items-center gap-1 self-start sm:self-auto font-medium"
          >
            <span>Manage Active Styles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stylesCalculations.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#717a90] border border-dashed border-[#1f2638] rounded-xl">
            No active styles currently saved in the pricing catalog.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#1a2336] custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#080b12] text-[#64748b] text-[10px] uppercase font-mono tracking-wider border-b border-[#1b2234]">
                <tr>
                  <th className="py-3 px-3">Style / SKU</th>
                  <th className="py-3 px-3 text-right">MRP Tag (MSP)</th>
                  <th className="py-3 px-3 text-right text-white">Customer Price</th>
                  <th className="py-3 px-3 text-right">Output GST</th>
                  <th className="py-3 px-3 text-right">Net Sales</th>
                  <th className="py-3 px-3 text-right">Landed Cost</th>
                  <th className="py-3 px-3 text-right">Gross Margin</th>
                  <th className="py-3 px-3 text-right">Overhead/Unit</th>
                  <th className="py-3 px-3 text-right">Variable Orders</th>
                  <th className="py-3 px-3 text-right text-emerald-400">Contribution Margin</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151c2c] bg-[#090d16]">
                {stylesCalculations.map((item) => (
                  <tr key={item.sheet.id} className="hover:bg-[#0f1422] transition-colors">
                    {/* Style / SKU */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white text-xs">{item.sheet.styleName}</span>
                        <span className="font-mono text-[11px] text-[#cda052]">{item.sheet.sku}</span>
                      </div>
                    </td>

                    {/* MRP Tag */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {formatMoney(item.mrp)}
                    </td>

                    {/* Customer Price */}
                    <td className="py-3 px-3 text-right font-mono text-white font-semibold">
                      {formatMoney(item.customerPrice)}
                    </td>

                    {/* Output GST */}
                    <td className="py-3 px-3 text-right font-mono">
                      <span className="text-[#94a3b8]">{item.outputRate}%</span>
                      <span className="text-[10px] text-[#64748b] block">({formatMoney(item.outputGst)})</span>
                    </td>

                    {/* Net Sales */}
                    <td className="py-3 px-3 text-right font-mono text-[#cbd5e1]">
                      {formatMoney(item.netSales)}
                    </td>

                    {/* Landed Cost */}
                    <td className="py-3 px-3 text-right font-mono text-blue-300">
                      {formatMoney(item.landedCost)}
                    </td>

                    {/* Gross Margin */}
                    <td className="py-3 px-3 text-right font-mono">
                      <span className="text-white font-medium">{item.grossMarginPct.toFixed(1)}%</span>
                      <span className="text-[10px] text-[#717a90] block">{formatMoney(item.grossProfit)}</span>
                    </td>

                    {/* Overhead / Unit */}
                    <td className="py-3 px-3 text-right font-mono text-amber-300">
                      {formatMoney(item.overheadPerUnit)}
                    </td>

                    {/* Variable Order Cost */}
                    <td className="py-3 px-3 text-right font-mono text-purple-300">
                      {formatMoney(item.variableOrderCost)}
                    </td>

                    {/* Contribution Margin */}
                    <td className="py-3 px-3 text-right font-mono">
                      <span className="font-bold text-emerald-400 text-xs">{item.contributionMarginPct.toFixed(1)}%</span>
                      <span className="text-[10px] text-emerald-500 block font-semibold">
                        +{formatMoney(item.contributionProfit)}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onOpenSheet(item.sheet)}
                        title={`Open ${item.sheet.sku} in Pricing Studio`}
                        className="px-2.5 py-1 rounded-lg bg-[#141a28] hover:bg-[#cda052] text-[#cda052] hover:text-black border border-[#232e48] text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Quick-Start "New Calculator" Box (Directly below dashboard) */}
      <div className="rounded-2xl border border-[#cda052]/40 bg-gradient-to-br from-[#0e1320] via-[#111728] to-[#0e1320] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1f283e] pb-4 mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#cda052] animate-pulse" />
              <h3 className="text-base font-bold text-white tracking-wide">
                Quick Launch: New Garment Style Calculation
              </h3>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Input key style parameters below and click <strong className="text-[#e6c875]">Proceed</strong> to open the complete Pricing & Unit Economy studio with BOM, factory invoice, Indian GST step taxes, and 3-scenario forecasts.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#717a90]">
            <span className="px-2.5 py-1 rounded-lg bg-[#161d2d] border border-[#232e47] text-[#cda052] font-mono">
              Step 1 of 6
            </span>
          </div>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-medium animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleProceed} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Style / Product Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white block">
                Product Style Name <span className="text-[#cda052]">*</span>
              </label>
              <input
                type="text"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="e.g. Heavyweight Loopback Crewneck"
                className="w-full px-3 py-2 rounded-xl bg-[#080b12] border border-[#232d44] text-white text-xs placeholder:text-[#64748b] focus:border-[#cda052] focus:outline-none transition-all"
              />
            </div>

            {/* SKU / Style Code */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white block">
                SKU / Style Code <span className="text-[#cda052]">*</span>
              </label>
              <input
                type="text"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                placeholder="e.g. RIV-SS26-CREW-01"
                className="w-full px-3 py-2 rounded-xl bg-[#080b12] border border-[#232d44] text-white font-mono text-xs placeholder:text-[#64748b] focus:border-[#cda052] focus:outline-none transition-all uppercase"
              />
            </div>

            {/* Listed MRP Tag */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white block">
                Listed MRP Tag (MSP) <span className="text-[#cda052]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] font-mono text-xs">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quickMrp}
                  onChange={(e) => setQuickMrp(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="3499"
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-[#080b12] border border-[#232d44] text-white font-mono text-xs placeholder:text-[#64748b] focus:border-[#cda052] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Targeted Margin % */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-white block">
                Target Margin Goal <span className="text-[#cda052]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="90"
                  step="0.5"
                  value={quickMargin}
                  onChange={(e) => setQuickMargin(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="25"
                  className="w-full pl-3 pr-7 py-2 rounded-xl bg-[#080b12] border border-[#232d44] text-white font-mono text-xs placeholder:text-[#64748b] focus:border-[#cda052] focus:outline-none transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] font-mono text-xs">%</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-[#717a90] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Standard brand defaults (overhead allocation, taxes, inbound surcharges) will be pre-filled automatically.</span>
            </p>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
            >
              <span>Proceed to Pricing & Unit Economy</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
