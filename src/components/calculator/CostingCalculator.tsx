'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Calculator, 
  Sparkles, 
  Save, 
  Printer, 
  Download, 
  RotateCcw, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  ShieldCheck, 
  Layers,
  ChevronDown,
  ChevronUp,
  Scissors,
  Plus,
  Settings,
  Lock,
  Unlock,
  Copy
} from 'lucide-react';
import { PricingInputs, CalculationResult, ScenarioKey, CostingSheet, GarmentBOM, CalculatorDefaults } from '@/lib/types';
import { 
  defaultPricingInputs, 
  calculateScenario, 
  formatMoney, 
  formatPercent, 
  getStoredCalculatorDefaults, 
  mergeDefaultsIntoInputs, 
  validatePricingInputs,
  importMath
} from '@/lib/pricingEngine';
import { getDifferencesFromDefaults } from '@/lib/defaultsDiff';
import DefaultsDiffModal, { DiffItem } from './DefaultsDiffModal';
import { useAdminStore } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import CostingExportModal from './CostingExportModal';
import BOMSpecifierModal from './BOMSpecifierModal';
import CalculatorSettingsModal from './CalculatorSettingsModal';
import ScenarioHelpModal from './ScenarioHelpModal';
import InfoTooltip from '@/components/ui/InfoTooltip';

interface CostingCalculatorProps {
  initialSheet?: CostingSheet;
  onSaveSuccess?: () => void;
  onNewCalculation?: () => void;
  onSelectSavedProduct?: (sheet: CostingSheet) => void;
}

function makeBlankProduct(overrides: Partial<Pick<PricingInputs, 'productName' | 'productCode' | 'mrp' | 'targetMargin'>> = {}) {
  return {
    productName: '',
    productCode: 'RIV-',
    mrp: 2999,
    ...overrides,
  };
}

export default function CostingCalculator({ initialSheet, onSaveSuccess, onNewCalculation, onSelectSavedProduct }: CostingCalculatorProps) {
  const { costingSheets, saveCostingSheet } = useAdminStore();
  const { user } = useAuth();

  // Active calculator defaults (synced via Supabase or localStorage)
  const [activeDefaults, setActiveDefaults] = useState<CalculatorDefaults>(() => {
    return user?.metadata?.calculator_defaults || getStoredCalculatorDefaults();
  });

  const [currentSheetId, setCurrentSheetId] = useState<string | null>(initialSheet?.id || null);
  const [inputs, setInputs] = useState<PricingInputs>(() => {
    if (initialSheet?.inputs) return initialSheet.inputs;
    return mergeDefaultsIntoInputs(makeBlankProduct(), user?.metadata?.calculator_defaults || getStoredCalculatorDefaults());
  });

  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('mid');
  const [savedSuccessAlert, setSavedSuccessAlert] = useState(false);
  const [newCalcAlert, setNewCalcAlert] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [diffItems, setDiffItems] = useState<DiffItem[]>([]);
  const [diffNotification, setDiffNotification] = useState<string | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [showNewCalcWindow, setShowNewCalcWindow] = useState(() => !initialSheet);

  // Sync defaults whenever user metadata loads
  useEffect(() => {
    if (user?.metadata?.calculator_defaults) {
      setActiveDefaults(user.metadata.calculator_defaults);
    }
  }, [user]);

  // Read the latest activeDefaults without making it a dependency below —
  // applying newly-saved brand defaults to the CURRENT sheet is already
  // handled non-destructively by onApplyDefaultsToCurrent (Settings modal).
  // This effect must only reset the form on a genuine initialSheet change,
  // not every time activeDefaults changes, or opening Settings mid-edit and
  // saving would silently wipe the product name/code/MRP the user just typed.
  const activeDefaultsRef = useRef(activeDefaults);
  useEffect(() => { activeDefaultsRef.current = activeDefaults; }, [activeDefaults]);

  // Sync inputs when initialSheet prop changes from parent
  useEffect(() => {
    if (initialSheet) {
      setInputs(initialSheet.inputs);
      setCurrentSheetId(initialSheet.id);
      setShowNewCalcWindow(false);
    } else {
      setInputs(mergeDefaultsIntoInputs(makeBlankProduct(), activeDefaultsRef.current));
      setCurrentSheetId(null);
      setShowNewCalcWindow(true);
    }
  }, [initialSheet]);

  const handleStartNewCalculation = () => {
    setCurrentSheetId(null);
    setValidationAttempted(false);
    setInputs(mergeDefaultsIntoInputs(
      makeBlankProduct({ targetMargin: activeDefaults.targetMargin ?? 25 }),
      activeDefaults
    ));
    setActiveScenario('mid');
    setShowNewCalcWindow(true);
    setNewCalcAlert(true);
    setTimeout(() => setNewCalcAlert(false), 3500);
    if (onNewCalculation) onNewCalculation();
  };

  const handleDuplicateCalculation = () => {
    setCurrentSheetId(null);
    setValidationAttempted(false);
    setInputs(prev => ({
      ...prev,
      productName: prev.productName ? `${prev.productName} (Copy)` : '',
      productCode: prev.productCode ? (prev.productCode.endsWith('-COPY') ? prev.productCode : `${prev.productCode}-COPY`) : 'RIV-',
    }));
    setNewCalcAlert(true);
    setTimeout(() => setNewCalcAlert(false), 3500);
  };

  const handleCheckDefaultsDiff = () => {
    const diffs = getDifferencesFromDefaults(inputs, activeDefaults);
    if (diffs.length === 0) {
      setDiffNotification('Product already matches all standard brand defaults!');
      setTimeout(() => setDiffNotification(null), 3500);
      return;
    }
    setDiffItems(diffs);
    setIsDiffModalOpen(true);
  };

  const handleConfirmApplyDefaults = () => {
    setInputs(prev => ({
      ...mergeDefaultsIntoInputs(
        {
          productName: prev.productName,
          productCode: prev.productCode,
          mrp: prev.mrp,
          factory: prev.factory,
          bom: prev.bom,
        },
        activeDefaults
      ),
    }));
    setIsDiffModalOpen(false);
    setDiffNotification('Brand defaults applied successfully to this product!');
    setTimeout(() => setDiffNotification(null), 3500);
  };

  // Accordion section states
  const [showFormula, setShowFormula] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [showScenarios, setShowScenarios] = useState(true);

  // Currency
  const curr = inputs.currency || '₹';

  // Live Validation
  const validation = useMemo(() => validatePricingInputs(inputs), [inputs]);

  // Calculations for all three scenarios — memoized so a keystroke in one field
  // doesn't re-run the full BOM/GST/forecast pipeline three extra times per render.
  const allResults = useMemo(() => ({
    low: calculateScenario(inputs, 'low'),
    mid: calculateScenario(inputs, 'mid'),
    high: calculateScenario(inputs, 'high'),
  }), [inputs]);
  const currentResult: CalculationResult = allResults[activeScenario];
  const { low: lowResult, mid: midResult, high: highResult } = allResults;

  // Generic updater
  const updateField = <K extends keyof PricingInputs>(key: K, value: PricingInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  // BOM handler
  const handleApplyBOM = (bom: GarmentBOM, rollup: {
    factoryCost: number;
    brandingCost: number;
    packagingCost: number;
    tagsCost: number;
  }) => {
    setInputs(prev => ({
      ...prev,
      factory: rollup.factoryCost,
      branding: rollup.brandingCost,
      packaging: rollup.packagingCost,
      tags: rollup.tagsCost,
      bom,
    }));
  };

  const updateRange = (
    key: 'units' | 'discount' | 'cac' | 'returnProvision' | 'shippingSubsidy' | 'salary' | 'office' | 'saas' | 'professional' | 'finance' | 'brandAmort',
    scenario: ScenarioKey,
    value: number
  ) => {
    setInputs(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [scenario]: Number(value) || 0
      }
    }));
  };

  // Status badge style helper
  const getStatusBadge = (status: CalculationResult['status']) => {
    switch (status) {
      case 'On / above target':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-700/50';
      case 'Profitable but below target':
        return 'bg-amber-950/80 text-amber-400 border-amber-700/50';
      case 'Below break-even':
      default:
        return 'bg-rose-950/80 text-rose-400 border-rose-700/50';
    }
  };

  // Save handler with validation enforcement
  const handleSave = () => {
    setValidationAttempted(true);
    const valResult = validatePricingInputs(inputs);
    if (!valResult.isValid) {
      // Abort save if data integrity rules are violated
      return;
    }

    const sheetId = currentSheetId || `cost-${Date.now()}`;
    const sheetData: CostingSheet = {
      id: sheetId,
      sku: inputs.productCode.trim(),
      styleName: inputs.productName.trim(),
      currency: curr,
      mrp: inputs.mrp,
      expectedMargin: midResult.contributionMargin * 100,
      inputs,
      notes: `Target Margin: ${inputs.targetMargin}%, Mid Contribution Profit: ${formatMoney(midResult.contributionProfit, curr)}`,
      createdAt: initialSheet && currentSheetId === initialSheet.id ? initialSheet.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveCostingSheet(sheetData);
    setCurrentSheetId(sheetId);
    setSavedSuccessAlert(true);
    setTimeout(() => setSavedSuccessAlert(false), 3500);
    if (onSaveSuccess) onSaveSuccess();
  };


  // CSV Export
  const handleExportCsv = () => {
    const rows = [
      ['Rivlet Pricing & Unit Economics Cost Breakdown'],
      ['Product Name', inputs.productName],
      ['Product Code / SKU', inputs.productCode],
      ['Active Scenario', activeScenario.toUpperCase()],
      ['Listed MRP', `${curr}${inputs.mrp}`],
      ['Actual Customer Price', `${curr}${currentResult.customerPrice.toFixed(2)}`],
      ['Output GST Rate', `${currentResult.outputRate}%`],
      ['Output GST Amount', `${curr}${currentResult.outputGst.toFixed(2)}`],
      ['Net Sales Before GST', `${curr}${currentResult.netSales.toFixed(2)}`],
      ['Landed Product Cost', `${curr}${currentResult.baseProductCost.toFixed(2)}`],
      ['Gross Profit', `${curr}${currentResult.grossProfit.toFixed(2)}`],
      ['Gross Margin %', `${(currentResult.grossMargin * 100).toFixed(1)}%`],
      ['Annual Overhead / Unit', `${curr}${currentResult.overheadPerUnit.toFixed(2)}`],
      ['Variable Order Cost', `${curr}${(currentResult.fixedOrder + currentResult.salesRateCost).toFixed(2)}`],
      ['Contribution Profit', `${curr}${currentResult.contributionProfit.toFixed(2)}`],
      ['Contribution Margin %', `${(currentResult.contributionMargin * 100).toFixed(1)}%`],
      ['Break-Even MRP', Number.isFinite(currentResult.breakEvenMrp) ? `${curr}${currentResult.breakEvenMrp.toFixed(2)}` : 'Not Achievable'],
      ['Required MRP at Target', Number.isFinite(currentResult.targetMrp) ? `${curr}${currentResult.targetMrp.toFixed(2)}` : 'Not Achievable'],
      ['Maximum Factory Cost', `${curr}${currentResult.maximumFactoryCost.toFixed(2)}`],
      ['Annual Revenue (GST incl)', `${curr}${currentResult.annualRevenue.toFixed(0)}`],
      ['Annual Contribution Profit', `${curr}${currentResult.annualContribution.toFixed(0)}`],
      ['Viability Status', currentResult.status],
    ];

    const csvContent = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${inputs.productCode || 'Rivlet'}_pricing_breakdown_${activeScenario}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-8 animate-fade-in text-white">
      {/* Top Banner & Control Actions */}
      <div className="bg-[#10131d] border border-[#1e2436] p-5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)]">
              Rivlet Pricing & Unit Economics Engine
            </span>
            {currentSheetId ? (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 flex items-center gap-1">
                📁 Saved Product: {inputs.productCode}
              </span>
            ) : (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-950/90 to-yellow-950/90 text-[#f6d896] border border-[#cda052]/50 flex items-center gap-1 shadow-sm">
                ✨ New Calculator Mode
              </span>
            )}
            <span className="text-xs text-[#94a3b8]">• Live Indian GST & Forecast Suite</span>
          </div>
          <h2 className="text-xl font-bold text-white font-serif tracking-wide flex items-center gap-2">
            {inputs.productName || (currentSheetId ? 'Saved Garment Style' : 'New Product Calculation')}
          </h2>
          <p className="text-xs text-[#cbd5e1] mt-0.5">
            Real customer selling price, automatic step-function output GST (5% ≤ ₹2,500, 18% &gt; ₹2,500), factory ITC, and 3-scenario forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Currency Toggle */}
          <div className="flex items-center bg-[#171b28] p-1 rounded-lg border border-[#252c40]" role="tablist" aria-label="Pricing currency">
            <button
              role="tab"
              aria-selected={curr === '₹'}
              onClick={() => updateField('currency', '₹')}
              title="Set active pricing currency to Indian Rupee (₹)"
              className={`px-2.5 py-1 text-xs rounded font-semibold transition-colors ${
                curr === '₹' ? 'bg-[#cda052] text-black' : 'text-[#848d9f] hover:text-white'
              }`}
            >
              ₹ INR
            </button>
            <button
              role="tab"
              aria-selected={curr === '$'}
              onClick={() => {
                // The ₹2,500 Indian retail GST bracket is meaningless against a USD
                // price, and export sales are typically zero-rated — force manual
                // mode (defaulting to 0%) so the displayed rule and the actual
                // computed GST rate never contradict each other.
                setInputs(prev => ({
                  ...prev,
                  currency: '$',
                  autoOutputTax: false,
                  manualOutputGst: prev.autoOutputTax ? 0 : prev.manualOutputGst,
                }));
              }}
              title="Set active pricing currency to US Dollar ($)"
              className={`px-2.5 py-1 text-xs rounded font-semibold transition-colors ${
                curr === '$' ? 'bg-[#cda052] text-black' : 'text-[#848d9f] hover:text-white'
              }`}
            >
              $ USD
            </button>
          </div>

          {/* Saved Products Selector Dropdown */}
          {costingSheets.length > 0 && (
            <div className="relative">
              <select
                value={currentSheetId || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) {
                    handleStartNewCalculation();
                    return;
                  }
                  const found = costingSheets.find(s => s.id === id);
                  if (found) {
                    setInputs(found.inputs);
                    setCurrentSheetId(found.id);
                    setShowNewCalcWindow(false);
                    if (onSelectSavedProduct) onSelectSavedProduct(found);
                  }
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#121624] border border-[#263147] text-white text-xs font-medium focus:border-[#cda052] outline-none max-w-[170px] truncate"
                title="Select a saved product to load into Pricing Studio"
              >
                <option value="">{currentSheetId ? 'Switch Product...' : 'Load Saved Product...'}</option>
                {costingSheets.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.sku} — {s.styleName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Unified Export / Print Suite */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-lg bg-[#161a26] border border-[#263147] text-[#8e97ae] hover:text-[#cda052] hover:border-[#cda052]/50 text-xs flex items-center gap-1.5 transition-all shadow-sm"
            title="Export Suite, Print Spec Sheet & Multi-Scenario CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#cda052]" />
            <span className="hidden sm:inline">Export / Print</span>
          </button>

          {/* Scenario Planning Help */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            title="How to fill Conservative, Expected & Upside values"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161a26] border border-[#263147] text-[#94a3b8] hover:text-[#cda052] hover:border-[#cda052]/50 font-semibold text-xs transition-all shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scenario Guide</span>
          </button>

          {/* Calculator Brand Settings Button */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            title="Configure Brand Defaults, Fixed Overheads & Locks (Syncs across tab & laptop)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161a26] border border-[#263147] text-[#cda052] hover:text-white hover:border-[#cda052] font-semibold text-xs transition-all shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

          {/* Apply Brand Defaults with Diff Pop-up */}
          <button
            onClick={handleCheckDefaultsDiff}
            title="Compare and apply brand default values to this style"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#161a26] border border-[#263147] text-[#94a3b8] hover:text-[#cda052] hover:border-[#cda052]/50 font-semibold text-xs transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#cda052]" />
            <span className="hidden sm:inline">Apply Defaults</span>
          </button>

          {/* Duplicate current calculation */}
          <button
            onClick={handleDuplicateCalculation}
            title="Duplicate this calculation to try a cost variant (e.g. different fabric or GSM)"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#161a26] border border-[#263147] text-[#8e97ae] hover:text-white hover:border-[#cda052]/50 font-semibold text-xs transition-all shadow-sm"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            onClick={handleSave}
            title="Save active SKU calculation to archive & database"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Product Calculation</span>
          </button>
        </div>
      </div>

      {/* Prominent Welcome & Setup Window: "You can start with your new calculator" */}
      {(!currentSheetId || showNewCalcWindow) && (
        <div className="rounded-2xl border-2 border-[#cda052]/70 bg-gradient-to-br from-[#161c2b] via-[#101420] to-[#0c0f18] p-5 sm:p-6 shadow-2xl space-y-4 animate-fade-in relative overflow-hidden">
          {/* Subtle background glow effect */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#cda052]/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#252f48] pb-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#cda052] to-[#8d6a26] text-black flex items-center justify-center font-bold shadow-glow flex-shrink-0">
                <Calculator className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/40">
                    Fresh Calculation Active
                  </span>
                  <span className="text-xs text-[#94a3b8] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#cda052]" /> Brand defaults & Indian retail GST rules pre-loaded
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-serif tracking-wide">
                  You can start with your new calculator
                </h2>
                <p className="text-xs text-[#cbd5e1] mt-0.5 max-w-2xl leading-relaxed">
                  Enter your product style name and code below. Standard manufacturing, sales, and overhead defaults are pre-populated so you can immediately analyze gross margins and GST cash outlay.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {currentSheetId && (
                <button
                  type="button"
                  onClick={() => setShowNewCalcWindow(false)}
                  className="px-3.5 py-2 rounded-xl bg-[#1f273b] hover:bg-[#2a3550] text-[#94a3b8] hover:text-white text-xs transition-colors"
                >
                  Dismiss Window
                </button>
              )}
            </div>
          </div>

          {/* Quick Setup Fields inside the Big Window */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
            {/* 1. Product Name */}
            <div className="bg-[#0b0e16] p-3.5 rounded-xl border border-[#20293d] focus-within:border-[#cda052]/80 transition-all shadow-sm">
              <label className="text-[11px] font-bold text-[#cda052] uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span>1. Product Style Name</span>
                <span className="text-[10px] text-[#94a3b8] font-normal">Required</span>
              </label>
              <input
                type="text"
                value={inputs.productName}
                onChange={(e) => updateField('productName', e.target.value)}
                placeholder="e.g. Heavyweight Boxy Tee"
                className="w-full bg-[#121724] border border-[#26334d] rounded-lg px-3 py-2 text-sm text-white font-medium placeholder:text-[#556480] focus:outline-none focus:border-[#cda052]"
              />
            </div>

            {/* 2. Product Code */}
            <div className="bg-[#0b0e16] p-3.5 rounded-xl border border-[#20293d] focus-within:border-[#cda052]/80 transition-all shadow-sm">
              <label className="text-[11px] font-bold text-[#cbd5e1] uppercase tracking-wider block mb-1.5">
                2. Style SKU / Code
              </label>
              <input
                type="text"
                value={inputs.productCode}
                onChange={(e) => updateField('productCode', e.target.value)}
                placeholder="RIV-"
                className="w-full bg-[#121724] border border-[#26334d] rounded-lg px-3 py-2 text-sm font-mono text-[#cda052] font-bold focus:outline-none focus:border-[#cda052]"
              />
            </div>

            {/* 3. Listed MRP */}
            <div className="bg-[#0b0e16] p-3.5 rounded-xl border border-[#20293d] focus-within:border-[#cda052]/80 transition-all shadow-sm">
              <label className="text-[11px] font-bold text-[#cbd5e1] uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span>3. Customer MRP</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  inputs.mrp > 2500 ? 'bg-amber-950/80 text-amber-300' : 'bg-emerald-950/80 text-emerald-300'
                }`}>
                  {inputs.mrp > 2500 ? '18% GST' : '5% GST'}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm font-bold text-[#71809a]">{curr}</span>
                <input
                  type="number"
                  min="1"
                  value={inputs.mrp}
                  onChange={(e) => updateField('mrp', Number(e.target.value) || 0)}
                  className="w-full bg-[#121724] border border-[#26334d] rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-white font-bold focus:outline-none focus:border-[#cda052]"
                />
              </div>
            </div>

            {/* 4. Target Margin */}
            <div className="bg-[#0b0e16] p-3.5 rounded-xl border border-[#20293d] focus-within:border-[#cda052]/80 transition-all shadow-sm">
              <label className="text-[11px] font-bold text-[#cbd5e1] uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                <span>4. Target Margin</span>
                <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                  {currentResult.contributionMargin >= inputs.targetMargin / 100 ? '✓ Viable' : 'Below Target'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={inputs.targetMargin}
                  onChange={(e) => updateField('targetMargin', Number(e.target.value) || 0)}
                  className="w-full bg-[#121724] border border-[#26334d] rounded-lg px-3 pr-7 py-2 text-sm font-mono text-white font-bold focus:outline-none focus:border-[#cda052]"
                />
                <span className="absolute right-3 top-2 text-sm font-bold text-[#71809a]">%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {diffNotification && (
        <div className="p-3.5 bg-[rgba(205,160,82,0.15)] border border-[rgba(205,160,82,0.35)] rounded-lg text-[#e6c875] text-xs flex items-center gap-2 animate-fade-in shadow-md">
          <Sparkles className="w-4 h-4 text-[#cda052] flex-shrink-0" />
          <span>{diffNotification}</span>
        </div>
      )}

      {newCalcAlert && (
        <div className="p-3.5 bg-blue-950/80 border border-blue-700/60 rounded-lg text-blue-200 text-xs flex items-center gap-2 animate-fade-in shadow-md">
          <Sparkles className="w-4 h-4 text-[#cda052] flex-shrink-0" />
          <span>New product calculation started with custom brand defaults! Customize your parameters below and click <strong>Save Product Calculation</strong>.</span>
        </div>
      )}

      {savedSuccessAlert && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Product calculation for <strong>{inputs.productCode}</strong> ({inputs.productName}) saved to your Rivlet database!</span>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationAttempted && !validation.isValid && (
        <div className="p-4 bg-rose-950/80 border border-rose-700/70 rounded-xl text-rose-200 text-xs flex items-start gap-3 animate-fade-in shadow-xl">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <strong className="text-white text-xs font-semibold">Data Validation Failed: Please correct the following fields to proceed:</strong>
              <span className="text-[10px] text-rose-300 font-mono bg-rose-900/60 px-2 py-0.5 rounded border border-rose-700/50">
                {Object.keys(validation.errors).length} {Object.keys(validation.errors).length === 1 ? 'Error' : 'Errors'} Found
              </span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[11px] text-rose-300 font-medium">
              {Object.entries(validation.errors).map(([key, msg]) => (
                <li key={key} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"></span>
                  <span>{msg}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}


      {/* Scenario Selector & Status Summary Bar */}
      <div className="bg-[#111420] border border-[#1e2436] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8e97af] font-medium mr-1">Active Scenario:</span>
          <InfoTooltip
            title="Conservative / Expected / Upside"
            text="Three forecasts, not one guess. Conservative is your worst-realistic case, Expected is your genuine best estimate, Upside is a strong-but-plausible outcome. Click Scenario Guide above for field-by-field guidance."
          />
          <div className="flex items-center bg-[#090b12] p-1 rounded-lg border border-[#20273a]" role="tablist" aria-label="Active scenario">
            {(['low', 'mid', 'high'] as ScenarioKey[]).map(sc => (
              <button
                key={sc}
                role="tab"
                aria-selected={activeScenario === sc}
                onClick={() => setActiveScenario(sc)}
                title={sc === 'low' ? 'Conservative Scenario (Low volume, higher CAC)' : sc === 'mid' ? 'Expected Baseline Scenario' : 'Upside Scenario (High volume, optimized scale)'}
                className={`px-3 py-1.5 text-xs rounded font-semibold transition-all ${
                  activeScenario === sc
                    ? 'bg-gradient-to-r from-[#cda052] to-[#b38536] text-black shadow-glow'
                    : 'text-[#848d9f] hover:text-white'
                }`}
              >
                {sc === 'low' ? 'Conservative' : sc === 'mid' ? 'Expected' : 'Upside'}
              </button>
            ))}
          </div>
        </div>

        {/* Viability Status Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-[#717a90] uppercase font-semibold">Commercial Viability</div>
            <div className="text-xs font-bold text-white mt-0.5">
              Contribution Margin: <span className="text-[#cda052] font-mono">{formatPercent(currentResult.contributionMargin * 100)}</span> (Target: {inputs.targetMargin}%)
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${getStatusBadge(currentResult.status)}`}>
            {currentResult.status}
          </span>
        </div>
      </div>

      {/* Main KPI Grid (12 Key Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* KPI 1: Actual Customer Price */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Customer Price</div>
          <div className="text-lg font-bold text-white mt-1 font-mono tabular-nums">{formatMoney(currentResult.customerPrice, curr)}</div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">After {formatPercent(currentResult.discount * 100)} discount</div>
        </div>

        {/* KPI 2: Output GST */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Output GST Rate</div>
          <div className="text-lg font-bold text-[#cda052] mt-1 font-mono tabular-nums">{currentResult.outputRate}%</div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">Amount: {formatMoney(currentResult.outputGst, curr)}</div>
        </div>

        {/* KPI 3: Net Sales */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Net Sales (ex GST)</div>
          <div className="text-lg font-bold text-white mt-1 font-mono tabular-nums">{formatMoney(currentResult.netSales, curr)}</div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">Revenue to cover costs</div>
        </div>

        {/* KPI 4: Landed Product Cost */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Landed Cost / Unit</div>
          <div className="text-lg font-bold text-amber-300 mt-1 font-mono tabular-nums">{formatMoney(currentResult.baseProductCost, curr)}</div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">Mfg, logistics & QC</div>
        </div>

        {/* KPI 5: Gross Margin */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Gross Margin</div>
          <div className="text-lg font-bold text-emerald-400 mt-1 font-mono tabular-nums">{formatPercent(currentResult.grossMargin * 100)}</div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">{formatMoney(currentResult.grossProfit, curr)} / piece</div>
        </div>

        {/* KPI 6: Overhead Allocation */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Overhead / Unit</div>
          <div className="text-lg font-bold text-white mt-1 font-mono tabular-nums">{formatMoney(currentResult.overheadPerUnit, curr)}</div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">On {currentResult.units.toLocaleString()} annual units</div>
        </div>

        {/* KPI 7: Variable Order Cost */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Variable Order Cost</div>
          <div className="text-lg font-bold text-white mt-1 font-mono tabular-nums">{formatMoney(currentResult.fixedOrder + currentResult.salesRateCost, curr)}</div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">CAC, returns & shipping</div>
        </div>

        {/* KPI 8: Contribution Profit (Major Highlight) */}
        <div className="bg-gradient-to-br from-[#1c1810] to-[#121624] border border-[#cda052]/60 p-3.5 rounded-xl shadow-glow">
          <div className="text-[11px] text-[#cda052] uppercase font-bold tracking-wider">Contribution Profit</div>
          <div className="text-xl font-bold text-white mt-1 font-mono tabular-nums">{formatMoney(currentResult.contributionProfit, curr)}</div>
          <div className="text-[11px] text-emerald-300 mt-0.5 font-semibold">Margin: {formatPercent(currentResult.contributionMargin * 100)}</div>
        </div>

        {/* KPI 9: Break-Even MRP */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Break-Even MRP</div>
          <div className="text-lg font-bold text-white mt-1 font-mono tabular-nums">
            {Number.isFinite(currentResult.breakEvenMrp) ? formatMoney(currentResult.breakEvenMrp, curr) : 'Unachievable'}
          </div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">At 0% margin</div>
        </div>

        {/* KPI 10: Target MRP */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Target MRP ({inputs.targetMargin}%)</div>
          <div className="text-lg font-bold text-[#cda052] mt-1 font-mono tabular-nums">
            {Number.isFinite(currentResult.targetMrp) ? formatMoney(currentResult.targetMrp, curr) : 'Unachievable'}
          </div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">For {inputs.targetMargin}% target margin</div>
        </div>

        {/* KPI 11: Max Factory Cost */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Max Factory Cost</div>
          <div className="text-lg font-bold text-white mt-1 font-mono tabular-nums">{formatMoney(currentResult.maximumFactoryCost, curr)}</div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">Ceiling at current MRP</div>
        </div>

        {/* KPI 12: Annual Contribution */}
        <div className="bg-[#0e121b] border border-[#1e2638] hover:border-[#2a364f] p-3.5 rounded-xl transition-colors shadow-sm">
          <div className="text-[11px] text-[#94a3b8] uppercase font-semibold tracking-wider">Annual Contribution</div>
          <div className="text-lg font-bold text-emerald-400 mt-1 font-mono tabular-nums">{formatMoney(currentResult.annualContribution, curr)}</div>
          <div className="text-[11px] text-[#cbd5e1] mt-0.5">Total brand profit pool</div>
        </div>
      </div>

      {/* Section 1 & 2: Product & 3-Scenario Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Product, Price & GST Configuration */}
        <div className="bg-[#11141e] border border-[#1e2436] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1b2132] pb-3">
            <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#cda052]"></span>
              1. Product, Listed MRP & GST Selection
            </h3>
            <span className="text-[10px] text-[#717a90]">Step 1</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block">
                  Product Name <span className="text-rose-400">*</span>
                </label>
                {validationAttempted && validation.errors.productName && (
                  <span className="text-[10px] text-rose-400 font-medium">Required</span>
                )}
              </div>
              <input
                type="text"
                value={inputs.productName}
                placeholder="e.g. Oversized French Terry Hoodie"
                onChange={(e) => updateField('productName', e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded bg-[#090b12] border text-white transition-colors outline-none ${
                  validationAttempted && validation.errors.productName
                    ? 'border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-[#22283b] focus:border-[#cda052]'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block">
                  Product Code / SKU <span className="text-rose-400">*</span>
                </label>
                {validationAttempted && validation.errors.productCode && (
                  <span className="text-[10px] text-rose-400 font-medium">Required</span>
                )}
              </div>
              <input
                type="text"
                value={inputs.productCode}
                placeholder="e.g. RIV-FW26-HOOD-01"
                onChange={(e) => updateField('productCode', e.target.value)}
                className={`w-full px-2.5 py-1.5 rounded bg-[#090b12] border text-white font-mono transition-colors outline-none ${
                  validationAttempted && validation.errors.productCode
                    ? 'border-rose-500 ring-1 ring-rose-500/50'
                    : 'border-[#22283b] focus:border-[#cda052]'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block">
                  Listed MRP (GST Included) <span className="text-rose-400">*</span>
                </label>
                {validationAttempted && validation.errors.mrp && (
                  <span className="text-[10px] text-rose-400 font-medium">&gt; 0</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="1"
                  value={inputs.mrp}
                  onChange={(e) => updateField('mrp', Number(e.target.value))}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border text-white font-bold transition-colors outline-none ${
                    validationAttempted && validation.errors.mrp
                      ? 'border-rose-500 ring-1 ring-rose-500/50'
                      : 'border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block">
                  Target Contribution Margin %
                </label>
                {validationAttempted && validation.errors.targetMargin && (
                  <span className="text-[10px] text-rose-400 font-medium">0-95%</span>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="95"
                  value={inputs.targetMargin}
                  onChange={(e) => updateField('targetMargin', Number(e.target.value))}
                  className={`w-full pr-7 px-2.5 py-1.5 rounded bg-[#090b12] border text-white font-bold transition-colors outline-none ${
                    validationAttempted && validation.errors.targetMargin
                      ? 'border-rose-500 ring-1 ring-rose-500/50'
                      : 'border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
                <span className="absolute right-2.5 top-1.5 text-[#6c758a] font-bold">%</span>
              </div>
            </div>
          </div>


          {/* GST Mode Toggle */}
          <div className="p-3 bg-[#090b12] border border-[#1b2132] rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae] font-semibold">Output GST Rule:</span>
              {curr === '$' ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/50 font-semibold">
                  Manual only — USD pricing
                </span>
              ) : (
                <div className="flex items-center bg-[#171b28] p-0.5 rounded border border-[#252c40]" role="tablist" aria-label="Output GST rule mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={inputs.autoOutputTax}
                    onClick={() => updateField('autoOutputTax', true)}
                    title="Automatically apply 5% GST if price ≤ ₹2,500, or 18% if > ₹2,500 under Indian tax code"
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      inputs.autoOutputTax ? 'bg-[#cda052] text-black font-bold' : 'text-[#848d9f]'
                    }`}
                  >
                    Automatic (Indian Rule)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!inputs.autoOutputTax}
                    onClick={() => updateField('autoOutputTax', false)}
                    title="Override automatic tax bracket with custom GST percentage"
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                      !inputs.autoOutputTax ? 'bg-[#cda052] text-black font-bold' : 'text-[#848d9f]'
                    }`}
                  >
                    Manual %
                  </button>
                </div>
              )}
            </div>

            {(curr === '$' || !inputs.autoOutputTax) && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-[#717a90]">Manual GST Rate:</span>
                <input
                  type="number"
                  value={inputs.manualOutputGst}
                  onChange={(e) => updateField('manualOutputGst', Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded bg-[#10131d] border border-[#22283b] text-white text-xs"
                />
                <span className="text-xs text-[#717a90]">%</span>
              </div>
            )}

            <div className="text-[11px] text-[#636c82] leading-relaxed">
              {curr === '$' ? (
                <span>
                  Export invoices in USD are typically <strong>zero-rated under GST</strong> — the ₹2,500 Indian retail
                  threshold doesn't apply here. Set a manual rate only if a specific duty/tax applies to this shipment.
                </span>
              ) : inputs.autoOutputTax ? (
                <span>
                  Automatic rule: customer price ≤ ₹2,500 = <strong>5% GST</strong>; above ₹2,500 = <strong>18% GST</strong>. Active rate: <strong>{currentResult.outputRate}%</strong>.
                </span>
              ) : (
                <span>Manual rate override enabled at {inputs.manualOutputGst}%.</span>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: 3-Scenario Forecast Range */}
        <div className="bg-[#11141e] border border-[#1e2436] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1b2132] pb-3">
            <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              2. Forecast Range (Low / Expected / High)
              <InfoTooltip title="How to set these" text="Conservative = worst-realistic case. Expected = your genuine best estimate. Upside = strong-but-plausible. See the Scenario Guide button above for guidance per field." />
            </h3>
            <span className="text-[10px] text-[#717a90]">Step 2</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#646d82] border-b border-[#1b2030] text-[10px] uppercase">
                  <th className="pb-2">Assumption</th>
                  <th className="pb-2 w-24">Conservative</th>
                  <th className="pb-2 w-24 text-[#cda052]">Expected</th>
                  <th className="pb-2 w-24">Upside</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181d2c]">
                <tr>
                  <td className="py-2 pr-2">
                    <span className="font-semibold text-white block">Annual Units Sold</span>
                    <span className="text-[10px] text-[#636c82]">Volume sold in 1 year</span>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={inputs.units.low}
                      onChange={(e) => updateRange('units', 'low', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={inputs.units.mid}
                      onChange={(e) => updateRange('units', 'mid', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#cda052]/50 text-[#cda052] font-bold"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={inputs.units.high}
                      onChange={(e) => updateRange('units', 'high', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="py-2 pr-2">
                    <span className="font-semibold text-white block">Average Discount %</span>
                    <span className="text-[10px] text-[#636c82]">Blended discount on MRP</span>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={inputs.discount.low}
                      onChange={(e) => updateRange('discount', 'low', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={inputs.discount.mid}
                      onChange={(e) => updateRange('discount', 'mid', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#cda052]/50 text-[#cda052] font-bold"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={inputs.discount.high}
                      onChange={(e) => updateRange('discount', 'high', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="py-2 pr-2">
                    <span className="font-semibold text-white block">CAC ({curr})</span>
                    <span className="text-[10px] text-[#636c82]">Customer acquisition cost</span>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={inputs.cac.low}
                      onChange={(e) => updateRange('cac', 'low', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={inputs.cac.mid}
                      onChange={(e) => updateRange('cac', 'mid', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#cda052]/50 text-[#cda052] font-bold"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={inputs.cac.high}
                      onChange={(e) => updateRange('cac', 'high', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="py-2 pr-2">
                    <span className="font-semibold text-white block">Return / RTO Provision</span>
                    <span className="text-[10px] text-[#636c82]">Blended reverse risk cost</span>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={inputs.returnProvision.low}
                      onChange={(e) => updateRange('returnProvision', 'low', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={inputs.returnProvision.mid}
                      onChange={(e) => updateRange('returnProvision', 'mid', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#cda052]/50 text-[#cda052] font-bold"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={inputs.returnProvision.high}
                      onChange={(e) => updateRange('returnProvision', 'high', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="py-2 pr-2">
                    <span className="font-semibold text-white block">Outbound Shipping Subsidy</span>
                    <span className="text-[10px] text-[#636c82]">Courier subsidy per order</span>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={inputs.shippingSubsidy.low}
                      onChange={(e) => updateRange('shippingSubsidy', 'low', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={inputs.shippingSubsidy.mid}
                      onChange={(e) => updateRange('shippingSubsidy', 'mid', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#cda052]/50 text-[#cda052] font-bold"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={inputs.shippingSubsidy.high}
                      onChange={(e) => updateRange('shippingSubsidy', 'high', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3 & 4: Costs, Import Customs & Sales Commissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section 3: Product Costs (10 Core Lines) */}
        <div className="lg:col-span-2 bg-[#11141e] border border-[#1e2436] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1b2132] pb-3">
            <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              3. Product, Factory & Inbound Supply Costs
            </h3>
            <div className="flex items-center gap-2">
              {activeDefaults.lockedInbound && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.12)] text-[#e6c875] border border-[rgba(205,160,82,0.3)] font-mono flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Fixed Rates
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="text-[11px] text-[#cda052] hover:underline flex items-center gap-1 font-medium bg-[#141824] px-2 py-1 rounded-lg border border-[#252f44]"
                title="Configure standard packaging and inbound rates"
              >
                <Settings className="w-3 h-3" />
                <span>{activeDefaults.lockedInbound ? 'Unlock' : 'Settings'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBOMModalOpen(true)}
                title="Open Technical BOM & Fabric Specifier to calculate exact yarn, GSM, and CMT costs"
                className="px-2.5 py-1 rounded-lg bg-[rgba(205,160,82,0.15)] hover:bg-[rgba(205,160,82,0.25)] border border-[rgba(205,160,82,0.35)] text-xs text-[#cda052] font-semibold flex items-center gap-1.5 transition-colors shadow-glow"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>BOM Specifier</span>
              </button>
              <span className="text-[10px] text-[#717a90]">Step 3</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider">
                  Factory Invoice Cost
                </label>
                <button
                  type="button"
                  onClick={() => setIsBOMModalOpen(true)}
                  title="Itemize factory cost via Technical BOM"
                  className="text-[10px] text-[#cda052] hover:underline flex items-center gap-0.5"
                >
                  <Scissors className="w-2.5 h-2.5" />
                  <span>Itemize</span>
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="0"
                  value={inputs.factory}
                  onChange={(e) => updateField('factory', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white font-bold outline-none focus:border-[#cda052]"
                />
              </div>
              {inputs.bom && (
                <span className="text-[10px] text-emerald-400 block mt-1 font-mono truncate" title={inputs.bom.garmentType}>
                  ✓ {inputs.bom.garmentType.split('(')[0].trim()} BOM Active
                </span>
              )}
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Dev & Sampling Allocation
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="0"
                  readOnly={Boolean(activeDefaults.lockedInbound)}
                  value={inputs.development}
                  onChange={(e) => updateField('development', Number(e.target.value))}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded border text-white outline-none ${
                    activeDefaults.lockedInbound
                      ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                      : 'bg-[#090b12] border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Domestic Inbound Logistics
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="0"
                  readOnly={Boolean(activeDefaults.lockedInbound)}
                  value={inputs.inbound}
                  onChange={(e) => updateField('inbound', Number(e.target.value))}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded border text-white outline-none ${
                    activeDefaults.lockedInbound
                      ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                      : 'bg-[#090b12] border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Quality Control (QC)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="0"
                  readOnly={Boolean(activeDefaults.lockedInbound)}
                  value={inputs.qc}
                  onChange={(e) => updateField('qc', Number(e.target.value))}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded border text-white outline-none ${
                    activeDefaults.lockedInbound
                      ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                      : 'bg-[#090b12] border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Packaging (Polybag, Mailer)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="0"
                  readOnly={Boolean(activeDefaults.lockedInbound)}
                  value={inputs.packaging}
                  onChange={(e) => updateField('packaging', Number(e.target.value))}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded border text-white outline-none ${
                    activeDefaults.lockedInbound
                      ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                      : 'bg-[#090b12] border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Tags, Labels & Barcodes
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="0"
                  readOnly={Boolean(activeDefaults.lockedInbound)}
                  value={inputs.tags}
                  onChange={(e) => updateField('tags', Number(e.target.value))}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded border text-white outline-none ${
                    activeDefaults.lockedInbound
                      ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                      : 'bg-[#090b12] border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Brand / Creative Allocation
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="0"
                  readOnly={Boolean(activeDefaults.lockedInbound)}
                  value={inputs.branding}
                  onChange={(e) => updateField('branding', Number(e.target.value))}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded border text-white outline-none ${
                    activeDefaults.lockedInbound
                      ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                      : 'bg-[#090b12] border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Warehouse Receiving
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="0"
                  readOnly={Boolean(activeDefaults.lockedInbound)}
                  value={inputs.receiving}
                  onChange={(e) => updateField('receiving', Number(e.target.value))}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded border text-white outline-none ${
                    activeDefaults.lockedInbound
                      ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                      : 'bg-[#090b12] border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Pick & Pack (3PL)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="0"
                  readOnly={Boolean(activeDefaults.lockedInbound)}
                  value={inputs.pickpack}
                  onChange={(e) => updateField('pickpack', Number(e.target.value))}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded border text-white outline-none ${
                    activeDefaults.lockedInbound
                      ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                      : 'bg-[#090b12] border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Inventory Loss / Damage
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  min="0"
                  readOnly={Boolean(activeDefaults.lockedInbound)}
                  value={inputs.inventory}
                  onChange={(e) => updateField('inventory', Number(e.target.value))}
                  className={`w-full pl-7 pr-2.5 py-1.5 rounded border text-white outline-none ${
                    activeDefaults.lockedInbound
                      ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                      : 'bg-[#090b12] border-[#22283b] focus:border-[#cda052]'
                  }`}
                />
              </div>
            </div>

          </div>

          {/* Factory GST & Input Credit Config */}
          <div className="p-3.5 bg-[#090b12] border border-[#1b2132] rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Factory GST & Input Credit:</span>
              <span className="text-[11px] text-[#cda052] font-mono">
                Factory GST: {currentResult.factoryRate}% ({formatMoney(currentResult.factoryGst, curr)})
              </span>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[#8e97ae]">
                <input
                  type="checkbox"
                  checked={inputs.factoryGstRecoverable}
                  onChange={(e) => updateField('factoryGstRecoverable', e.target.checked)}
                  className="rounded text-[#cda052] bg-[#111420] border-[#22283b]"
                />
                <span>Claim Factory GST as Input Tax Credit (ITC)</span>
              </label>
            </div>
          </div>

          {/* Supply Origin & Import to India (Customs & Logistics Engine) */}
          <div className="p-4 bg-[#090b12] border border-[#1b2132] rounded-xl space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#181e2e] pb-3">
              <div>
                <span className="text-white font-bold text-xs block">Supply Origin & Import Customs</span>
                <span className="text-[11px] text-[#717d95]">Specify whether this garment is sourced domestically or imported into India.</span>
              </div>
              <div className="flex items-center bg-[#131722] p-1 rounded-lg border border-[#21293c]">
                <button
                  type="button"
                  onClick={() => updateField('importMode', 'domestic')}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                    inputs.importMode === 'domestic'
                      ? 'bg-gradient-to-r from-[#cda052] to-[#b38536] text-black shadow-glow'
                      : 'text-[#828d9f] hover:text-white'
                  }`}
                >
                  Domestic Supply
                </button>
                <button
                  type="button"
                  onClick={() => updateField('importMode', 'imported')}
                  className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
                    inputs.importMode === 'imported'
                      ? 'bg-gradient-to-r from-[#cda052] to-[#b38536] text-black shadow-glow'
                      : 'text-[#828d9f] hover:text-white'
                  }`}
                >
                  Imported into India
                </button>
              </div>
            </div>

            {inputs.importMode === 'imported' ? (
              <div className="space-y-4 pt-1">
                {/* 1. FOB Garment Supply Base */}
                <div className="p-3 bg-[#0d101a] border border-[#1c2438] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-white text-xs block">1. Garment FOB Price (Factory Invoice)</span>
                    <span className="text-[11px] text-[#78849e]">Base cut, make, fabric, trims & factory supply per unit</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#cda052]">{curr}{inputs.factory.toFixed(2)}</span>
                    <span className="text-[10px] text-[#6d7890] block">from Factory Cost</span>
                  </div>
                </div>

                {/* 2. Freight & Insurance (Percentage of FOB or Fixed) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* International Freight */}
                  <div className="p-3.5 bg-[#0d101a] border border-[#1e263a] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-white uppercase tracking-wider">
                        2. International Freight
                      </label>
                      <div className="flex items-center bg-[#151a28] rounded p-0.5 border border-[#273248] text-[10px]">
                        <button
                          type="button"
                          onClick={() => updateField('freightType', 'percent')}
                          className={`px-2 py-0.5 rounded font-semibold ${
                            (inputs.freightType || 'percent') === 'percent'
                              ? 'bg-[#cda052] text-black'
                              : 'text-[#8a96ae]'
                          }`}
                        >
                          % of FOB
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('freightType', 'fixed')}
                          className={`px-2 py-0.5 rounded font-semibold ${
                            inputs.freightType === 'fixed'
                              ? 'bg-[#cda052] text-black'
                              : 'text-[#8a96ae]'
                          }`}
                        >
                          Fixed {curr}/unit
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      {(inputs.freightType === 'fixed') && (
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7f8ba1] font-mono">{curr}</span>
                      )}
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={inputs.freightValue !== undefined ? inputs.freightValue : (inputs.intlFreight || 1.5)}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          updateField('freightValue', val);
                          updateField('intlFreight', val);
                        }}
                        className={`w-full py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white font-mono text-xs focus:border-[#cda052] outline-none ${
                          inputs.freightType === 'fixed' ? 'pl-7 pr-3' : 'px-3 pr-7'
                        }`}
                      />
                      {(inputs.freightType || 'percent') === 'percent' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f8ba1] font-mono">%</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#78849e] flex items-center justify-between">
                      <span>Calculated Freight:</span>
                      <strong className="text-white font-mono">
                        {curr}{((inputs.freightType || 'percent') === 'percent'
                          ? (inputs.factory * (inputs.freightValue ?? 1.5)) / 100
                          : (inputs.freightValue ?? 0)).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Transit Marine Insurance */}
                  <div className="p-3.5 bg-[#0d101a] border border-[#1e263a] rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-white uppercase tracking-wider">
                        3. Transit Insurance
                      </label>
                      <div className="flex items-center bg-[#151a28] rounded p-0.5 border border-[#273248] text-[10px]">
                        <button
                          type="button"
                          onClick={() => updateField('insuranceType', 'percent')}
                          className={`px-2 py-0.5 rounded font-semibold ${
                            (inputs.insuranceType || 'percent') === 'percent'
                              ? 'bg-[#cda052] text-black'
                              : 'text-[#8a96ae]'
                          }`}
                        >
                          % of FOB
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('insuranceType', 'fixed')}
                          className={`px-2 py-0.5 rounded font-semibold ${
                            inputs.insuranceType === 'fixed'
                              ? 'bg-[#cda052] text-black'
                              : 'text-[#8a96ae]'
                          }`}
                        >
                          Fixed {curr}/unit
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      {(inputs.insuranceType === 'fixed') && (
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7f8ba1] font-mono">{curr}</span>
                      )}
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={inputs.insuranceValue !== undefined ? inputs.insuranceValue : (inputs.insurance || 0.5)}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          updateField('insuranceValue', val);
                          updateField('insurance', val);
                        }}
                        className={`w-full py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white font-mono text-xs focus:border-[#cda052] outline-none ${
                          inputs.insuranceType === 'fixed' ? 'pl-7 pr-3' : 'px-3 pr-7'
                        }`}
                      />
                      {(inputs.insuranceType || 'percent') === 'percent' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f8ba1] font-mono">%</span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#78849e] flex items-center justify-between">
                      <span>Calculated Insurance:</span>
                      <strong className="text-white font-mono">
                        {curr}{((inputs.insuranceType || 'percent') === 'percent'
                          ? (inputs.factory * (inputs.insuranceValue ?? 0.5)) / 100
                          : (inputs.insuranceValue ?? 0)).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3. Assessable CIF Value Callout Banner */}
                {(() => {
                  const freightAmt = (inputs.freightType || 'percent') === 'percent'
                    ? (inputs.factory * (inputs.freightValue ?? 1.5)) / 100
                    : (inputs.freightValue ?? 0);
                  const insAmt = (inputs.insuranceType || 'percent') === 'percent'
                    ? (inputs.factory * (inputs.insuranceValue ?? 0.5)) / 100
                    : (inputs.insuranceValue ?? 0);
                  const cif = inputs.factory + freightAmt + insAmt;
                  const bcdVal = (cif * (inputs.bcd ?? 20)) / 100;
                  const swsVal = ((cif + bcdVal) * (inputs.sws ?? 6)) / 100;
                  const igstBase = cif + bcdVal + swsVal;
                  const igstVal = (igstBase * (inputs.importIgst ?? 5)) / 100;

                  return (
                    <div className="space-y-3">
                      <div className="p-3 bg-[rgba(205,160,82,0.08)] border border-[rgba(205,160,82,0.25)] rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-[#cda052] bg-[rgba(205,160,82,0.15)] px-2 py-0.5 rounded border border-[#cda052]/30">
                            Assessable CIF
                          </span>
                          <span className="text-xs text-[#cbd5e1]">
                            FOB ({curr}{inputs.factory.toFixed(0)}) + Freight ({curr}{freightAmt.toFixed(1)}) + Ins ({curr}{insAmt.toFixed(1)})
                          </span>
                        </div>
                        <span className="font-mono text-sm font-bold text-[#e6c875]">
                          {curr}{cif.toFixed(2)}
                        </span>
                      </div>

                      {/* 4. Customs Duty, SWS, IGST, Port Clearance */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {/* BCD */}
                        <div className="p-2.5 bg-[#0d101a] border border-[#1e263a] rounded-lg">
                          <label className="text-[10px] text-[#8e98ad] uppercase font-bold block mb-1">
                            BCD ({inputs.bcd ?? 20}%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={inputs.bcd ?? 20}
                              onChange={(e) => updateField('bcd', Number(e.target.value) || 0)}
                              className="w-full px-2 py-1 pr-5 rounded bg-[#07090e] border border-[#252f44] text-white font-mono text-xs focus:border-[#cda052] outline-none"
                            />
                            <span className="absolute right-2 top-1 text-[11px] text-[#6d7890] font-mono">%</span>
                          </div>
                          <span className="text-[10px] text-[#8e98ad] block mt-1">
                            Amount: <strong className="text-white font-mono">{curr}{bcdVal.toFixed(2)}</strong>
                          </span>
                        </div>

                        {/* SWS */}
                        <div className="p-2.5 bg-[#0d101a] border border-[#1e263a] rounded-lg">
                          <label className="text-[10px] text-[#8e98ad] uppercase font-bold block mb-1">
                            SWS ({inputs.sws ?? 6}%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={inputs.sws ?? 6}
                              onChange={(e) => updateField('sws', Number(e.target.value) || 0)}
                              className="w-full px-2 py-1 pr-5 rounded bg-[#07090e] border border-[#252f44] text-white font-mono text-xs focus:border-[#cda052] outline-none"
                            />
                            <span className="absolute right-2 top-1 text-[11px] text-[#6d7890] font-mono">%</span>
                          </div>
                          <span className="text-[10px] text-[#8e98ad] block mt-1">
                            Amount: <strong className="text-white font-mono">{curr}{swsVal.toFixed(2)}</strong>
                          </span>
                        </div>

                        {/* Import IGST */}
                        <div className="p-2.5 bg-[#0d101a] border border-[#1e263a] rounded-lg">
                          <label className="text-[10px] text-[#8e98ad] uppercase font-bold block mb-1">
                            Import IGST ({inputs.importIgst ?? 5}%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={inputs.importIgst ?? 5}
                              onChange={(e) => updateField('importIgst', Number(e.target.value) || 0)}
                              className="w-full px-2 py-1 pr-5 rounded bg-[#07090e] border border-[#252f44] text-white font-mono text-xs focus:border-[#cda052] outline-none"
                            />
                            <span className="absolute right-2 top-1 text-[11px] text-[#6d7890] font-mono">%</span>
                          </div>
                          <span className="text-[10px] text-[#8e98ad] block mt-1">
                            IGST: <strong className="text-white font-mono">{curr}{igstVal.toFixed(2)}</strong>
                          </span>
                        </div>

                        {/* Port / CHA Clearance */}
                        <div className="p-2.5 bg-[#0d101a] border border-[#1e263a] rounded-lg">
                          <label className="text-[10px] text-[#8e98ad] uppercase font-bold block mb-1">
                            CHA / Port Clearance
                          </label>
                          <div className="relative">
                            <span className="absolute left-2 top-1 text-[11px] text-[#6d7890] font-mono">{curr}</span>
                            <input
                              type="number"
                              min="0"
                              value={inputs.clearance || 0}
                              onChange={(e) => updateField('clearance', Number(e.target.value) || 0)}
                              className="w-full pl-6 pr-2 py-1 rounded bg-[#07090e] border border-[#252f44] text-white font-mono text-xs focus:border-[#cda052] outline-none"
                            />
                          </div>
                          <span className="text-[10px] text-[#8e98ad] block mt-1">
                            Fixed handling / unit
                          </span>
                        </div>
                      </div>

                      {/* 5. Recoverable ITC Checkbox for Import IGST */}
                      <div className="p-3 bg-[#0a0d16] border border-[#1b2234] rounded-lg flex items-center justify-between">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={inputs.importIgstRecoverable ?? true}
                            onChange={(e) => updateField('importIgstRecoverable', e.target.checked)}
                            className="w-4 h-4 rounded accent-[#cda052] cursor-pointer"
                          />
                          <span className="text-white text-xs font-medium">
                            Claim Import IGST ({curr}{igstVal.toFixed(2)}) as Input Tax Credit (ITC)
                          </span>
                        </label>
                        <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                          (inputs.importIgstRecoverable ?? true)
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                        }`}>
                          {(inputs.importIgstRecoverable ?? true)
                            ? '✓ Excluded from Landed Cost (ITC Asset)'
                            : '+ Added to Unit Landed Cost'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Duty & Logistics Summary Callout */}
                <div className="text-[11px] text-[#717d95] bg-[#070910] p-2.5 rounded-lg border border-[#192032] leading-relaxed">
                  {currentResult.customsNote}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-[#0d101a] border border-[#1c2438] rounded-xl text-[11px] text-[#7e8b9f]">
                Domestic supply selected: Garment is sourced within India. International ocean/air freight, Basic Customs Duty (BCD), and Social Welfare Surcharge (SWS) are excluded.
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Sales Commissions & Charges */}
        <div className="bg-[#11141e] border border-[#1e2436] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1b2132] pb-3">
            <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              4. Sales Charges (% of Net Sales)
            </h3>
            <span className="text-[10px] text-[#717a90]">Step 4</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae]">Payment Gateway (%)</span>
              <input
                type="number"
                step="0.1"
                value={inputs.gateway}
                min="0"
                max="100"
                onChange={(e) => updateField('gateway', Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae]">Platform / Shopify Fee (%)</span>
              <input
                type="number"
                step="0.1"
                value={inputs.shopifyFee}
                min="0"
                max="100"
                onChange={(e) => updateField('shopifyFee', Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae]">Influencer / Affiliate (%)</span>
              <input
                type="number"
                step="0.5"
                value={inputs.affiliate}
                min="0"
                max="100"
                onChange={(e) => updateField('affiliate', Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae]">Marketplace Commission (%)</span>
              <input
                type="number"
                step="0.5"
                value={inputs.marketplace}
                min="0"
                max="100"
                onChange={(e) => updateField('marketplace', Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae]">Marketplace Ads (%)</span>
              <input
                type="number"
                step="0.5"
                value={inputs.marketAds}
                min="0"
                max="100"
                onChange={(e) => updateField('marketAds', Math.max(0, Math.min(100, Number(e.target.value))))}
                className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
              />
            </div>

            <div className="pt-2 border-t border-[#1b2132] space-y-2">
              <div className="text-[10px] text-[#636c82] uppercase font-semibold">Fixed Charges / Sale</div>
              <div className="flex items-center justify-between">
                <span className="text-[#8e97ae]">COD Handling ({curr})</span>
                <input
                  type="number"
                  value={inputs.cod}
                  onChange={(e) => updateField('cod', Number(e.target.value))}
                  className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#8e97ae]">Exchange Handling ({curr})</span>
                <input
                  type="number"
                  value={inputs.exchange}
                  onChange={(e) => updateField('exchange', Number(e.target.value))}
                  className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#1b2132] flex justify-between text-xs text-[#cda052] font-semibold">
              <span>Total Sales Rate:</span>
              <span>{(currentResult.salesRates * 100).toFixed(1)}% ({formatMoney(currentResult.salesRateCost, curr)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Annual Business Overhead Allocation */}
      <div className="bg-[#11141e] border border-[#1e2436] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1b2132] pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                5. Annual Business Overhead & Dynamic Allocation
                <InfoTooltip title="How to set these" text="Conservative = highest plausible cost (e.g. hiring sooner than planned). Expected = your current run-rate budget. Upside = leanest realistic operation." />
              </h3>
              {activeDefaults.lockedOverheads && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.12)] text-[#e6c875] border border-[rgba(205,160,82,0.3)] font-mono flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Fixed Brand Standard
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#717a90] mt-0.5">
              Enter annual company expenses. The planner divides annual total by planned annual units automatically: {curr}{Math.round(currentResult.overheadPerUnit)}/unit ({formatMoney(currentResult.overheadAnnual, curr)} ÷ {currentResult.units.toLocaleString()} units).
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-[11px] text-[#cda052] hover:underline flex items-center gap-1 font-medium bg-[#141824] px-2.5 py-1 rounded-lg border border-[#252f44]"
              title="Configure Brand Fixed Overheads"
            >
              <Settings className="w-3 h-3" />
              <span>{activeDefaults.lockedOverheads ? 'Unlock in Settings' : 'Brand Settings'}</span>
            </button>
            <span className="text-[10px] text-[#717a90]">Step 5</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#646d82] border-b border-[#1b2030] text-[10px] uppercase">
                <th className="pb-2">Annual Expense Category</th>
                <th className="pb-2 w-32">Conservative</th>
                <th className="pb-2 w-32 text-[#cda052]">Expected</th>
                <th className="pb-2 w-32">Upside</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#181d2c]">
              {[
                { key: 'salary', label: 'Team Salaries', sub: 'Payroll not in fulfilment' },
                { key: 'office', label: 'Office & Admin', sub: 'Rent, utilities, legal' },
                { key: 'saas', label: 'SaaS & E-commerce', sub: 'Shopify, apps, ERP, CRM' },
                { key: 'professional', label: 'Professional & Compliance', sub: 'Audit, legal, GST' },
                { key: 'finance', label: 'Finance & Interest', sub: 'Working capital interest' },
                { key: 'brandAmort', label: 'Brand & Launch Amortisation', sub: 'Setup & creative amortised' },
              ].map(({ key, label, sub }) => (
                <tr key={key}>
                  <td className="py-2 pr-2">
                    <span className="font-semibold text-white block">{label}</span>
                    <span className="text-[10px] text-[#636c82]">{sub}</span>
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      readOnly={Boolean(activeDefaults.lockedOverheads)}
                      value={(inputs as any)[key].low}
                      onChange={(e) => updateRange(key as any, 'low', Number(e.target.value))}
                      className={`w-full px-2 py-1 rounded border outline-none ${
                        activeDefaults.lockedOverheads
                          ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                          : 'bg-[#0a0c13] border-[#202638] text-white focus:border-[#cda052]'
                      }`}
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      readOnly={Boolean(activeDefaults.lockedOverheads)}
                      value={(inputs as any)[key].mid}
                      onChange={(e) => updateRange(key as any, 'mid', Number(e.target.value))}
                      className={`w-full px-2 py-1 rounded border outline-none ${
                        activeDefaults.lockedOverheads
                          ? 'bg-[#07090e] border-[#2f2716] text-[#cda052]/80 cursor-not-allowed opacity-90'
                          : 'bg-[#0a0c13] border-[#cda052]/50 text-[#cda052] font-bold focus:border-[#cda052]'
                      }`}
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      readOnly={Boolean(activeDefaults.lockedOverheads)}
                      value={(inputs as any)[key].high}
                      onChange={(e) => updateRange(key as any, 'high', Number(e.target.value))}
                      className={`w-full px-2 py-1 rounded border outline-none ${
                        activeDefaults.lockedOverheads
                          ? 'bg-[#07090e] border-[#1d2334] text-[#94a3b8] cursor-not-allowed opacity-90'
                          : 'bg-[#0a0c13] border-[#202638] text-white focus:border-[#cda052]'
                      }`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Deep-Dive Tables: Scenarios & Cost Breakdown */}
      <div className="space-y-4">
        {/* 1. Three-Scenario Comparison Table */}
        <div className="bg-[#111420] border border-[#1e2436] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowScenarios(!showScenarios)}
            title="Expand or collapse three-scenario comparison table"
            className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-white hover:bg-[#141824] transition-colors"
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#cda052]" />
              Three-Scenario Financial Comparison (Conservative vs Expected vs Upside)
            </span>
            {showScenarios ? <ChevronUp className="w-4 h-4 text-[#717a90]" /> : <ChevronDown className="w-4 h-4 text-[#717a90]" />}
          </button>

          {showScenarios && (
            <div className="p-5 border-t border-[#1b2132] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#646d82] border-b border-[#1b2030] text-[10px] uppercase">
                    <th className="pb-2">Metric / Measure</th>
                    <th className="pb-2 text-right">Conservative (Low)</th>
                    <th className="pb-2 text-right text-[#cda052]">Expected (Mid)</th>
                    <th className="pb-2 text-right text-emerald-400">Upside (High)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181d2c]">
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Annual Volume Plan</td>
                    <td className="py-2.5 text-right font-mono">{lowResult.units.toLocaleString()} units</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#cda052]">{midResult.units.toLocaleString()} units</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400">{highResult.units.toLocaleString()} units</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Actual Customer Price</td>
                    <td className="py-2.5 text-right font-mono">{formatMoney(lowResult.customerPrice, curr)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#cda052]">{formatMoney(midResult.customerPrice, curr)}</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400">{formatMoney(highResult.customerPrice, curr)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Output GST Rate</td>
                    <td className="py-2.5 text-right font-mono">{lowResult.outputRate}%</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#cda052]">{midResult.outputRate}%</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400">{highResult.outputRate}%</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Net Sales Before GST</td>
                    <td className="py-2.5 text-right font-mono">{formatMoney(lowResult.netSales, curr)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#cda052]">{formatMoney(midResult.netSales, curr)}</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400">{formatMoney(highResult.netSales, curr)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Landed Product Cost</td>
                    <td className="py-2.5 text-right font-mono">{formatMoney(lowResult.baseProductCost, curr)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#cda052]">{formatMoney(midResult.baseProductCost, curr)}</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400">{formatMoney(highResult.baseProductCost, curr)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Overhead per Unit</td>
                    <td className="py-2.5 text-right font-mono">{formatMoney(lowResult.overheadPerUnit, curr)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#cda052]">{formatMoney(midResult.overheadPerUnit, curr)}</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400">{formatMoney(highResult.overheadPerUnit, curr)}</td>
                  </tr>
                  <tr className="bg-[rgba(205,160,82,0.06)]">
                    <td className="py-2.5 font-bold text-[#cda052]">Contribution Profit / Unit</td>
                    <td className="py-2.5 text-right font-mono font-bold">{formatMoney(lowResult.contributionProfit, curr)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#cda052]">{formatMoney(midResult.contributionProfit, curr)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-400">{formatMoney(highResult.contributionProfit, curr)}</td>
                  </tr>
                  <tr className="bg-[rgba(205,160,82,0.06)]">
                    <td className="py-2.5 font-bold text-[#cda052]">Contribution Margin %</td>
                    <td className="py-2.5 text-right font-mono font-bold">{formatPercent(lowResult.contributionMargin * 100)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#cda052]">{formatPercent(midResult.contributionMargin * 100)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-400">{formatPercent(highResult.contributionMargin * 100)}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Required MRP at Target</td>
                    <td className="py-2.5 text-right font-mono">{Number.isFinite(lowResult.targetMrp) ? formatMoney(lowResult.targetMrp, curr) : 'Unachievable'}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#cda052]">{Number.isFinite(midResult.targetMrp) ? formatMoney(midResult.targetMrp, curr) : 'Unachievable'}</td>
                    <td className="py-2.5 text-right font-mono text-emerald-400">{Number.isFinite(highResult.targetMrp) ? formatMoney(highResult.targetMrp, curr) : 'Unachievable'}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Annual Contribution Profit</td>
                    <td className="py-2.5 text-right font-mono font-bold">{formatMoney(lowResult.annualContribution, curr)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-[#cda052]">{formatMoney(midResult.annualContribution, curr)}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-400">{formatMoney(highResult.annualContribution, curr)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 2. Full Cost Deduction Waterfall Breakdown */}
        <div className="bg-[#111420] border border-[#1e2436] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            title="Expand or collapse complete unit cost deduction waterfall"
            className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-white hover:bg-[#141824] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Full Cost Deduction Breakdown (Active Scenario: {activeScenario.toUpperCase()})
            </span>
            {showBreakdown ? <ChevronUp className="w-4 h-4 text-[#717a90]" /> : <ChevronDown className="w-4 h-4 text-[#717a90]" />}
          </button>

          {showBreakdown && (
            <div className="p-5 border-t border-[#1b2132] overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#646d82] border-b border-[#1b2030] text-[10px] uppercase">
                    <th className="pb-2">Component</th>
                    <th className="pb-2">Calculation Basis</th>
                    <th className="pb-2 text-right">Amount / Sale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#181d2c]">
                  <tr className="bg-[#0b0e16] font-bold text-white">
                    <td className="py-2.5">Net Sales Before GST</td>
                    <td className="py-2.5 text-[#717a90]">Actual customer price − Output GST</td>
                    <td className="py-2.5 text-right text-emerald-400 font-mono">{formatMoney(currentResult.netSales, curr)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Manufacturing / Factory Invoice</td>
                    <td className="py-2 text-[#717a90]">Direct quote per piece</td>
                    <td className="py-2 text-right font-mono text-white">−{formatMoney(inputs.factory, curr)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Dev, Logistics & QC</td>
                    <td className="py-2 text-[#717a90]">Sampling + Domestic Inbound + QC</td>
                    <td className="py-2 text-right font-mono text-white">−{formatMoney(inputs.development + inputs.inbound + inputs.qc, curr)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Packaging, Tags & Barcodes</td>
                    <td className="py-2 text-[#717a90]">Polybag, mailer, hangtags, size pips</td>
                    <td className="py-2 text-right font-mono text-white">−{formatMoney(inputs.packaging + inputs.tags, curr)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Fulfillment & Shrinkage</td>
                    <td className="py-2 text-[#717a90]">Receiving + Pick & Pack + Shrinkage</td>
                    <td className="py-2 text-right font-mono text-white">−{formatMoney(inputs.receiving + inputs.pickpack + inputs.inventory, curr)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Annual Business Overhead Allocation</td>
                    <td className="py-2 text-[#717a90]">{formatMoney(currentResult.overheadAnnual, curr)} ÷ {currentResult.units.toLocaleString()} units</td>
                    <td className="py-2 text-right font-mono text-white">−{formatMoney(currentResult.overheadPerUnit, curr)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Order Variable Marketing & Shipping</td>
                    <td className="py-2 text-[#717a90]">CAC + Return/RTO + Shipping Subsidy</td>
                    <td className="py-2 text-right font-mono text-white">−{formatMoney(currentResult.fixedOrder, curr)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Payment Gateway & Platform Rates</td>
                    <td className="py-2 text-[#717a90]">{(currentResult.salesRates * 100).toFixed(1)}% of net sales</td>
                    <td className="py-2 text-right font-mono text-white">−{formatMoney(currentResult.salesRateCost, curr)}</td>
                  </tr>
                  <tr className="bg-[rgba(205,160,82,0.1)] font-bold text-sm">
                    <td className="py-3 text-[#cda052]">Final Unit Contribution Profit</td>
                    <td className="py-3 text-[#cda052]/80">Net Sales minus all commercial costs</td>
                    <td className="py-3 text-right text-[#cda052] font-mono">{formatMoney(currentResult.contributionProfit, curr)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. Mathematical Formula Narrative */}
        <div className="bg-[#111420] border border-[#1e2436] rounded-xl overflow-hidden">
          <button
            onClick={() => setShowFormula(!showFormula)}
            title="Expand or collapse mathematical formula audit trail"
            className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-white hover:bg-[#141824] transition-colors"
          >
            <span className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Formula Audit Trail & How the Active Calculation Was Built
            </span>
            {showFormula ? <ChevronUp className="w-4 h-4 text-[#717a90]" /> : <ChevronDown className="w-4 h-4 text-[#717a90]" />}
          </button>

          {showFormula && (
            <div className="p-5 border-t border-[#1b2132] space-y-3 text-xs text-[#cbd5e1] leading-relaxed">
              <div className="p-3 bg-[#0a0c13] rounded-lg border border-[#1e2436] border-l-4 border-l-[#cda052]">
                <strong className="text-white block mb-0.5">1. Revenue & Output GST:</strong>
                {curr}{inputs.mrp.toLocaleString()} Listed MRP × (1 − {formatPercent(currentResult.discount * 100)} discount) = <strong>{formatMoney(currentResult.customerPrice, curr)}</strong> actual customer price. Output GST at {currentResult.outputRate}% is {formatMoney(currentResult.outputGst, curr)}, leaving <strong>{formatMoney(currentResult.netSales, curr)}</strong> net sales before GST.
              </div>

              <div className="p-3 bg-[#0a0c13] rounded-lg border border-[#1e2436] border-l-4 border-l-amber-400">
                <strong className="text-white block mb-0.5">2. Total Costs per Sale:</strong>
                {formatMoney(currentResult.baseProductCost, curr)} landed product + {formatMoney(currentResult.overheadPerUnit, curr)} annual overhead allocation + {formatMoney(currentResult.fixedOrder, curr)} fixed order costs + {formatMoney(currentResult.salesRateCost, curr)} sales-rate commission = <strong>{formatMoney(currentResult.totalCosts + currentResult.salesRateCost, curr)}</strong> total cost per unit sold.
              </div>

              <div className="p-3 bg-[#0a0c13] rounded-lg border border-[#1e2436] border-l-4 border-l-emerald-400">
                <strong className="text-white block mb-0.5">3. Final Contribution Profit:</strong>
                {formatMoney(currentResult.netSales, curr)} net sales − {formatMoney(currentResult.totalCosts + currentResult.salesRateCost, curr)} total cost = <strong className="text-emerald-400">{formatMoney(currentResult.contributionProfit, curr)}</strong>, delivering a <strong>{formatPercent(currentResult.contributionMargin * 100)}</strong> contribution margin.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export & Spec Sheet Modal */}
      <CostingExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        inputs={inputs}
        activeScenario={activeScenario}
        allScenarios={allResults}
      />

      {/* BOM Specifier Modal */}
      <BOMSpecifierModal
        isOpen={isBOMModalOpen}
        onClose={() => setIsBOMModalOpen(false)}
        currency={curr}
        initialBOM={inputs.bom}
        onApplyBOM={handleApplyBOM}
      />

      {/* Brand Defaults & Fixed Overheads Settings Modal */}
      <CalculatorSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentInputs={inputs}
        onApplyDefaultsToCurrent={(newDefs) => {
          setActiveDefaults(newDefs);
          setInputs(prev => mergeDefaultsIntoInputs(prev, newDefs));
        }}
      />

      {/* Brand Defaults Diff Confirmation Pop-up Modal */}
      <DefaultsDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        onConfirm={handleConfirmApplyDefaults}
        diffItems={diffItems}
        productName={inputs.productName}
        productCode={inputs.productCode}
      />

      {/* Conservative / Expected / Upside Scenario Planning Guide */}
      <ScenarioHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>

  );
}
