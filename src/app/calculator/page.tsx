'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Calculator, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3,
  LayoutDashboard,
  Search,
  Filter,
  Shirt,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Copy,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { CostingSheet, PricingInputs } from '@/lib/types';
import CostingCalculator from '@/components/calculator/CostingCalculator';
import CalculatorOverviewDashboard from '@/components/calculator/CalculatorOverviewDashboard';
import CalculatorMethodologyGuide from '@/components/calculator/CalculatorMethodologyGuide';
import { useConfirm } from '@/lib/confirmContext';
import { calculateScenario, formatMoney } from '@/lib/pricingEngine';

function CalculatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const confirm = useConfirm();
  const { costingSheets, saveCostingSheet, deleteCostingSheet } = useAdminStore();

  const tabParam = searchParams.get('tab');
  const actionParam = searchParams.get('action');

  // Active Tab: 'overview' (default) | 'studio' (Pricing & Unit Economy) | 'styles' (Active Styles) | 'guide' (Calculation Guide)
  const [activeTab, setActiveTab] = useState<'overview' | 'studio' | 'styles' | 'guide'>(() => {
    if (tabParam === 'studio') return 'studio';
    if (tabParam === 'styles' || tabParam === 'saved') return 'styles';
    if (tabParam === 'guide' || tabParam === 'help') return 'guide';
    return 'overview';
  });

  const [selectedSheet, setSelectedSheet] = useState<CostingSheet | null>(null);
  const [quickInputs, setQuickInputs] = useState<Partial<PricingInputs> | null>(null);
  const [calcKey, setCalcKey] = useState(0);

  // Active styles search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('All');

  // Sync state with URL params
  useEffect(() => {
    if (tabParam === 'studio') {
      setActiveTab('studio');
    } else if (tabParam === 'styles' || tabParam === 'saved') {
      setActiveTab('styles');
    } else if (tabParam === 'guide' || tabParam === 'help') {
      setActiveTab('guide');
    } else {
      setActiveTab('overview');
    }

    if (actionParam === 'new') {
      setSelectedSheet(null);
      setQuickInputs(null);
      setCalcKey((k) => k + 1);
      setActiveTab('studio');
    }
  }, [tabParam, actionParam]);

  const handleStartNewCalculator = () => {
    setSelectedSheet(null);
    setQuickInputs(null);
    setCalcKey((k) => k + 1);
    setActiveTab('studio');
    router.replace('/calculator?tab=studio&action=new');
  };

  const handleStartWithQuickInputs = (inputs: {
    productName: string;
    productCode: string;
    mrp: number;
    targetMargin: number;
  }) => {
    setSelectedSheet(null);
    setQuickInputs(inputs);
    setCalcKey((k) => k + 1);
    setActiveTab('studio');
    router.replace('/calculator?tab=studio');
  };

  const handleOpenSheetInStudio = (sheet: CostingSheet) => {
    setSelectedSheet(sheet);
    setQuickInputs(null);
    setActiveTab('studio');
    router.replace('/calculator?tab=studio');
  };

  const handleDuplicateSheet = (sheet: CostingSheet) => {
    const newSku = sheet.sku.endsWith('-COPY') ? `${sheet.sku}-2` : `${sheet.sku}-COPY`;
    const newSheet: CostingSheet = {
      ...sheet,
      id: `cost-${Date.now()}`,
      sku: newSku,
      styleName: `${sheet.styleName} (Copy)`,
      inputs: {
        ...sheet.inputs,
        productName: `${sheet.styleName} (Copy)`,
        productCode: newSku,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveCostingSheet(newSheet);
    setSelectedSheet(newSheet);
    setQuickInputs(null);
    setActiveTab('studio');
    router.replace('/calculator?tab=studio');
  };

  const handleDeleteSheet = async (sheet: CostingSheet) => {
    const ok = await confirm({
      title: 'Delete Active Style',
      message: `Delete active style costing sheet for ${sheet.sku} (${sheet.styleName})? This will permanently remove its manufacturing financial model.`,
      confirmLabel: 'Delete Style',
      danger: true,
    });
    if (!ok) return;
    deleteCostingSheet(sheet.id);
    if (selectedSheet?.id === sheet.id) {
      setSelectedSheet(null);
      setCalcKey((k) => k + 1);
    }
  };

  // Filtered active styles for the styles tab
  const filteredSheets = useMemo(() => {
    return costingSheets.filter((s) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        s.styleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSeason = seasonFilter === 'All' || s.season === seasonFilter;
      return matchesSearch && matchesSeason;
    });
  }, [costingSheets, searchQuery, seasonFilter]);

  const uniqueSeasons = useMemo(() => {
    const set = new Set<string>();
    costingSheets.forEach((s) => {
      if (s.season) set.add(s.season);
    });
    return Array.from(set);
  }, [costingSheets]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner & Submenu Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2233] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl font-bold text-white tracking-wide font-serif">
              Garment Cost Calculator
            </h1>
            <span className="text-[11px] font-mono text-[#cda052] px-2 py-0.5 rounded-full bg-[#cda052]/10 border border-[#cda052]/30">
              Rivlet Pricing Suite
            </span>
          </div>
          <p className="text-xs text-[#8e98ad]">
            Consolidated portfolio analytics, automated Indian step GST, factory ITC, annual overhead allocation, and luxury unit economics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Main 3-Tab Segmented Navigation */}
          <div className="flex items-center bg-[#111420] p-1 rounded-xl border border-[#20273a] overflow-x-auto max-w-full shadow-inner">
            <button
              onClick={() => {
                setActiveTab('overview');
                router.replace('/calculator?tab=overview');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold shadow-glow'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('styles');
                router.replace('/calculator?tab=styles');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'styles'
                  ? 'bg-[#1e2538] text-white font-semibold'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Shirt className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Active Styles ({costingSheets.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('studio');
                router.replace('/calculator?tab=studio');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-[#1e2538] text-white font-semibold'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Pricing & Unit Economy</span>
              {selectedSheet && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#090c14] text-[#cda052] border border-[#cda052]/30 truncate max-w-[100px]">
                  {selectedSheet.sku}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('guide');
                router.replace('/calculator?tab=guide');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'guide'
                  ? 'bg-[#1e2538] text-[#e6c875] font-semibold border border-[#cda052]/30 shadow-sm'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Calculation Guide</span>
            </button>
          </div>

          {/* Quick New Calculator Button */}
          <button
            onClick={handleStartNewCalculator}
            title="Start fresh calculation for a brand new product style"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow transition-all flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Calculator</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & DASHBOARDS (Clean Executive Landing) */}
      {activeTab === 'overview' && (
        <CalculatorOverviewDashboard
          costingSheets={costingSheets}
          onStartNewWithInputs={handleStartWithQuickInputs}
          onOpenSheet={handleOpenSheetInStudio}
          onNavigateToTab={(tab) => {
            setActiveTab(tab);
            router.replace(`/calculator?tab=${tab}`);
          }}
        />
      )}

      {/* TAB 2: PRICING & UNIT ECONOMY (Full Detailed Sheet) */}
      {activeTab === 'studio' && (
        <CostingCalculator
          key={selectedSheet ? selectedSheet.id : quickInputs ? `quick-${calcKey}` : `new-calc-${calcKey}`}
          initialSheet={selectedSheet || undefined}
          initialInputs={quickInputs || undefined}
          onBackToOverview={() => {
            setActiveTab('overview');
            router.replace('/calculator?tab=overview');
          }}
          onOpenGuide={() => {
            setActiveTab('guide');
            router.replace('/calculator?tab=guide');
          }}
          onSaveSuccess={() => {}}
          onSelectSavedProduct={(sheet) => setSelectedSheet(sheet)}
        />
      )}

      {/* TAB 3: ACTIVE STYLES (Renamed from Saved Products) */}
      {activeTab === 'styles' && (
        <div className="space-y-5">
          {/* Active Styles Search & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d101a] border border-[#1e2538] p-3.5 rounded-2xl">
            <div className="flex items-center gap-2.5 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#717a90]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search styles by name, SKU code, or category..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#080a12] border border-[#232c42] text-xs text-white placeholder:text-[#64748b] focus:border-[#cda052] focus:outline-none"
                />
              </div>

              {uniqueSeasons.length > 0 && (
                <select
                  value={seasonFilter}
                  onChange={(e) => setSeasonFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#080a12] border border-[#232c42] text-xs text-white focus:border-[#cda052] outline-none"
                >
                  <option value="All">All Seasons</option>
                  {uniqueSeasons.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
              <span>Showing <strong>{filteredSheets.length}</strong> of <strong>{costingSheets.length}</strong> active styles</span>
            </div>
          </div>

          {filteredSheets.length === 0 ? (
            <div className="bg-[#10131d] border border-[#1e2436] rounded-2xl p-12 text-center space-y-3">
              <Shirt className="w-10 h-10 text-[#cda052]/60 mx-auto" />
              <h3 className="text-base font-bold text-white">No Active Styles Found</h3>
              <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
                {searchQuery
                  ? 'No active styles match your search filter. Clear the query or create a new style calculation.'
                  : 'Start a new calculation or launch one from the Overview page to populate active styles here.'}
              </p>
              <button
                onClick={handleStartNewCalculator}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Start New Calculation</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSheets.map((sheet) => {
                const calc = calculateScenario(sheet.inputs, 'mid');
                const mrp = sheet.mrp || sheet.inputs.mrp || 0;
                const marginPct = calc.contributionMargin * 100;
                const grossMarginPct = calc.grossMargin * 100;

                return (
                  <div
                    key={sheet.id}
                    className="bg-[#0e121b] border border-[#1e2638] rounded-xl p-5 hover:border-[#cda052]/50 transition-all flex flex-col justify-between shadow-lg space-y-4"
                  >
                    <div>
                      {/* SKU Header & Season */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs font-bold text-[#cda052] px-2.5 py-0.5 rounded bg-[rgba(205,160,82,0.1)] border border-[rgba(205,160,82,0.25)]">
                          {sheet.sku}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-[#717a90] font-mono">
                          {sheet.season && (
                            <span className="px-1.5 py-0.5 rounded bg-[#161c2b] text-[#94a3b8] text-[10px]">
                              {sheet.season}
                            </span>
                          )}
                          <span>{new Date(sheet.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-white mb-1.5 line-clamp-1">
                        {sheet.styleName}
                      </h3>

                      {/* Pricing Tag & Realization */}
                      <div className="flex items-center justify-between text-xs text-[#cbd5e1] mb-3 pb-2 border-b border-[#182030]">
                        <div>
                          <span className="text-[10px] text-[#717a90] block">Listed MRP Tag</span>
                          <strong className="text-white font-mono">{sheet.currency}{mrp.toLocaleString()}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-[#717a90] block">Customer Price</span>
                          <span className="text-[#e6c875] font-mono font-semibold">{formatMoney(calc.customerPrice, sheet.currency)}</span>
                        </div>
                      </div>

                      {/* 4-Box Unit Economics Metric Strip */}
                      <div className="grid grid-cols-2 gap-2 bg-[#080b12] p-2.5 rounded-lg border border-[#192234] text-xs mb-3">
                        <div>
                          <div className="text-[10px] text-[#717a90] uppercase tracking-wider font-semibold">Landed Cost</div>
                          <div className="font-bold text-blue-300 font-mono">{formatMoney(calc.baseProductCost, sheet.currency)}</div>
                          <span className="text-[9px] text-[#64748b]">FOB + Duty + Inbound</span>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#717a90] uppercase tracking-wider font-semibold">Gross Margin</div>
                          <div className="font-bold text-white font-mono">{grossMarginPct.toFixed(1)}%</div>
                          <span className="text-[9px] text-[#64748b]">{formatMoney(calc.grossProfit, sheet.currency)}</span>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#717a90] uppercase tracking-wider font-semibold">Overheads / Unit</div>
                          <div className="font-bold text-amber-300 font-mono">{formatMoney(calc.overheadPerUnit, sheet.currency)}</div>
                          <span className="text-[9px] text-[#64748b]">Brand Volume</span>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#717a90] uppercase tracking-wider font-semibold">Contrib Margin</div>
                          <div className="font-bold text-emerald-400 font-mono">{marginPct.toFixed(1)}%</div>
                          <span className="text-[9px] text-emerald-500/80">+{formatMoney(calc.contributionProfit, sheet.currency)}</span>
                        </div>
                      </div>

                      {/* Status pill */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-[#717a90]">Target Goal: {sheet.inputs.targetMargin}%</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          marginPct >= sheet.inputs.targetMargin
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                            : marginPct >= 0
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                            : 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                        }`}>
                          {calc.status}
                        </span>
                      </div>
                    </div>

                    {/* Actions Strip */}
                    <div className="pt-3 border-t border-[#182030] flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenSheetInStudio(sheet)}
                        className="text-xs text-[#cda052] hover:text-white font-semibold flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg bg-[rgba(205,160,82,0.1)] hover:bg-[rgba(205,160,82,0.2)] border border-[rgba(205,160,82,0.25)] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>View / Edit</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicateSheet(sheet)}
                          className="text-xs text-[#94a3b8] hover:text-white px-2 py-1.5 rounded hover:bg-[#161d2d] transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Duplicate SKU ${sheet.sku}`}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Clone</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSheet(sheet)}
                          className="text-xs text-[#94a3b8] hover:text-rose-400 px-2 py-1.5 rounded hover:bg-rose-950/30 transition-colors flex items-center gap-1 cursor-pointer"
                          title={`Delete calculation for ${sheet.sku}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CALCULATION BLUEPRINT & METHODOLOGY GUIDE */}
      {activeTab === 'guide' && (
        <CalculatorMethodologyGuide
          onBackToCalculator={() => {
            setActiveTab('studio');
            router.replace('/calculator?tab=studio');
          }}
          onStartNewCalculation={handleStartNewCalculator}
        />
      )}
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#94a3b8]">Loading Garment Financial Studio...</div>}>
      <CalculatorContent />
    </Suspense>
  );
}
