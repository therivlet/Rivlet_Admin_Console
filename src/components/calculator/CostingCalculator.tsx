'use client';

import React, { useState } from 'react';
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
  Scissors
} from 'lucide-react';
import { PricingInputs, CalculationResult, ScenarioKey, CostingSheet, GarmentBOM } from '@/lib/types';
import { 
  defaultPricingInputs, 
  calculateScenario, 
  formatMoney, 
  formatPercent 
} from '@/lib/pricingEngine';
import { useAdminStore } from '@/lib/store';
import CostingExportModal from './CostingExportModal';
import BOMSpecifierModal from './BOMSpecifierModal';

interface CostingCalculatorProps {
  initialSheet?: CostingSheet;
  onSaveSuccess?: () => void;
}

export default function CostingCalculator({ initialSheet, onSaveSuccess }: CostingCalculatorProps) {
  const { saveCostingSheet } = useAdminStore();
  const [inputs, setInputs] = useState<PricingInputs>(initialSheet?.inputs || defaultPricingInputs);
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('mid');
  const [savedSuccessAlert, setSavedSuccessAlert] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBOMModalOpen, setIsBOMModalOpen] = useState(false);

  // Accordion section states
  const [showFormula, setShowFormula] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [showScenarios, setShowScenarios] = useState(true);

  // Currency
  const curr = inputs.currency || '₹';

  // Calculations for active scenario and all three
  const currentResult: CalculationResult = calculateScenario(inputs, activeScenario);
  const lowResult: CalculationResult = calculateScenario(inputs, 'low');
  const midResult: CalculationResult = calculateScenario(inputs, 'mid');
  const highResult: CalculationResult = calculateScenario(inputs, 'high');
  const allResults = { low: lowResult, mid: midResult, high: highResult };

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

  // Save handler
  const handleSave = () => {
    const sheetData: CostingSheet = {
      id: initialSheet?.id || `cost-${Date.now()}`,
      sku: inputs.productCode || 'RIV-SKU',
      styleName: inputs.productName || 'Unnamed Product',
      currency: curr,
      mrp: inputs.mrp,
      expectedMargin: midResult.contributionMargin * 100,
      inputs,
      notes: `Target Margin: ${inputs.targetMargin}%, Mid Contribution Profit: ${formatMoney(midResult.contributionProfit, curr)}`,
      createdAt: initialSheet?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveCostingSheet(sheetData);
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)]">
              Rivlet Pricing & Unit Economics Engine
            </span>
            <span className="text-xs text-[#717a90]">• Live Indian GST & Forecast Suite</span>
          </div>
          <h2 className="text-lg font-bold text-white font-serif">
            {inputs.productName || 'Garment Pricing Studio'}
          </h2>
          <p className="text-xs text-[#79839c]">
            Real sales price, automatic step-function output GST (5% ≤ ₹2,500, 18% &gt; ₹2,500), factory ITC, and 3-scenario forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Currency Toggle */}
          <div className="flex items-center bg-[#171b28] p-1 rounded-lg border border-[#252c40]">
            <button
              onClick={() => updateField('currency', '₹')}
              className={`px-2.5 py-1 text-xs rounded font-semibold transition-colors ${
                curr === '₹' ? 'bg-[#cda052] text-black' : 'text-[#848d9f] hover:text-white'
              }`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => updateField('currency', '$')}
              className={`px-2.5 py-1 text-xs rounded font-semibold transition-colors ${
                curr === '$' ? 'bg-[#cda052] text-black' : 'text-[#848d9f] hover:text-white'
              }`}
            >
              $ USD
            </button>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="p-2 rounded-lg bg-[#161a26] border border-[#262c3e] text-[#8e97ae] hover:text-[#cda052] text-xs flex items-center gap-1.5 transition-colors"
            title="Print or Save PDF Spec Sheet"
          >
            <Printer className="w-3.5 h-3.5 text-[#cda052]" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="p-2 rounded-lg bg-[#161a26] border border-[#262c3e] text-[#8e97ae] hover:text-[#cda052] text-xs flex items-center gap-1.5 transition-colors"
            title="Open Export Suite & Multi-Scenario CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#cda052]" />
            <span className="hidden sm:inline">Export Suite</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Product Calculation</span>
          </button>
        </div>
      </div>

      {savedSuccessAlert && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Product calculation for <strong>{inputs.productCode}</strong> ({inputs.productName}) saved to your Rivlet database!</span>
        </div>
      )}

      {/* Scenario Selector & Status Summary Bar */}
      <div className="bg-[#111420] border border-[#1e2436] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8e97af] font-medium mr-1">Active Scenario:</span>
          <div className="flex items-center bg-[#090b12] p-1 rounded-lg border border-[#20273a]">
            {(['low', 'mid', 'high'] as ScenarioKey[]).map(sc => (
              <button
                key={sc}
                onClick={() => setActiveScenario(sc)}
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
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={inputs.productName}
                onChange={(e) => updateField('productName', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Product Code / SKU
              </label>
              <input
                type="text"
                value={inputs.productCode}
                onChange={(e) => updateField('productCode', e.target.value)}
                className="w-full px-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Listed MRP (GST Included)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-[#6c758a] font-bold">{curr}</span>
                <input
                  type="number"
                  value={inputs.mrp}
                  onChange={(e) => updateField('mrp', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider block mb-1">
                Target Contribution Margin %
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={inputs.targetMargin}
                  onChange={(e) => updateField('targetMargin', Number(e.target.value))}
                  className="w-full pr-7 px-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white font-bold"
                />
                <span className="absolute right-2.5 top-1.5 text-[#6c758a] font-bold">%</span>
              </div>
            </div>
          </div>

          {/* GST Mode Toggle */}
          <div className="p-3 bg-[#090b12] border border-[#1b2132] rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae] font-semibold">Output GST Rule:</span>
              <div className="flex items-center bg-[#171b28] p-0.5 rounded border border-[#252c40]">
                <button
                  type="button"
                  onClick={() => updateField('autoOutputTax', true)}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    inputs.autoOutputTax ? 'bg-[#cda052] text-black font-bold' : 'text-[#848d9f]'
                  }`}
                >
                  Automatic (Indian Rule)
                </button>
                <button
                  type="button"
                  onClick={() => updateField('autoOutputTax', false)}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    !inputs.autoOutputTax ? 'bg-[#cda052] text-black font-bold' : 'text-[#848d9f]'
                  }`}
                >
                  Manual %
                </button>
              </div>
            </div>

            {!inputs.autoOutputTax && (
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
              {inputs.autoOutputTax ? (
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
              <button
                type="button"
                onClick={() => setIsBOMModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-[rgba(205,160,82,0.15)] hover:bg-[rgba(205,160,82,0.25)] border border-[rgba(205,160,82,0.35)] text-xs text-[#cda052] font-semibold flex items-center gap-1.5 transition-colors shadow-glow"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Technical BOM & Fabric Specifier</span>
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
                  value={inputs.factory}
                  onChange={(e) => updateField('factory', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white font-bold"
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
                  value={inputs.development}
                  onChange={(e) => updateField('development', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white"
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
                  value={inputs.inbound}
                  onChange={(e) => updateField('inbound', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white"
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
                  value={inputs.qc}
                  onChange={(e) => updateField('qc', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white"
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
                  value={inputs.packaging}
                  onChange={(e) => updateField('packaging', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white"
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
                  value={inputs.tags}
                  onChange={(e) => updateField('tags', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white"
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
                  value={inputs.branding}
                  onChange={(e) => updateField('branding', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white"
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
                  value={inputs.receiving}
                  onChange={(e) => updateField('receiving', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white"
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
                  value={inputs.pickpack}
                  onChange={(e) => updateField('pickpack', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white"
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
                  value={inputs.inventory}
                  onChange={(e) => updateField('inventory', Number(e.target.value))}
                  className="w-full pl-7 pr-2.5 py-1.5 rounded bg-[#090b12] border border-[#22283b] text-white"
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

          {/* Import Customs Dropdown / Fields */}
          <div className="p-3.5 bg-[#090b12] border border-[#1b2132] rounded-lg space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Supply Origin:</span>
              <select
                value={inputs.importMode}
                onChange={(e) => updateField('importMode', e.target.value as any)}
                className="px-2.5 py-1 rounded bg-[#161a26] border border-[#262c3e] text-white text-xs"
              >
                <option value="domestic">Domestic Supply (No Import)</option>
                <option value="imported">Imported into India</option>
              </select>
            </div>

            {inputs.importMode === 'imported' && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1b2132]">
                <div>
                  <label className="text-[10px] text-[#636c82] block">Intl Freight</label>
                  <input
                    type="number"
                    value={inputs.intlFreight}
                    onChange={(e) => updateField('intlFreight', Number(e.target.value))}
                    className="w-full bg-[#10131d] px-2 py-1 rounded border border-[#202638] text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#636c82] block">BCD %</label>
                  <input
                    type="number"
                    value={inputs.bcd}
                    onChange={(e) => updateField('bcd', Number(e.target.value))}
                    className="w-full bg-[#10131d] px-2 py-1 rounded border border-[#202638] text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#636c82] block">Clearance</label>
                  <input
                    type="number"
                    value={inputs.clearance}
                    onChange={(e) => updateField('clearance', Number(e.target.value))}
                    className="w-full bg-[#10131d] px-2 py-1 rounded border border-[#202638] text-white text-xs"
                  />
                </div>
              </div>
            )}
            <div className="text-[11px] text-[#636c82]">{currentResult.customsNote}</div>
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
                onChange={(e) => updateField('gateway', Number(e.target.value))}
                className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae]">Platform / Shopify Fee (%)</span>
              <input
                type="number"
                step="0.1"
                value={inputs.shopifyFee}
                onChange={(e) => updateField('shopifyFee', Number(e.target.value))}
                className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae]">Influencer / Affiliate (%)</span>
              <input
                type="number"
                step="0.5"
                value={inputs.affiliate}
                onChange={(e) => updateField('affiliate', Number(e.target.value))}
                className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae]">Marketplace Commission (%)</span>
              <input
                type="number"
                step="0.5"
                value={inputs.marketplace}
                onChange={(e) => updateField('marketplace', Number(e.target.value))}
                className="w-20 bg-[#090b12] px-2.5 py-1.5 rounded border border-[#202638] text-white text-right"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8e97ae]">Marketplace Ads (%)</span>
              <input
                type="number"
                step="0.5"
                value={inputs.marketAds}
                onChange={(e) => updateField('marketAds', Number(e.target.value))}
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
        <div className="flex items-center justify-between border-b border-[#1b2132] pb-3">
          <div>
            <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              5. Annual Business Overhead & Dynamic Allocation
            </h3>
            <p className="text-[11px] text-[#717a90] mt-0.5">
              Enter annual company expenses. The planner divides annual total by planned annual units automatically: {curr}{Math.round(currentResult.overheadPerUnit)}/unit ({formatMoney(currentResult.overheadAnnual, curr)} ÷ {currentResult.units.toLocaleString()} units).
            </p>
          </div>
          <span className="text-[10px] text-[#717a90]">Step 5</span>
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
                      value={(inputs as any)[key].low}
                      onChange={(e) => updateRange(key as any, 'low', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      value={(inputs as any)[key].mid}
                      onChange={(e) => updateRange(key as any, 'mid', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#cda052]/50 text-[#cda052] font-bold"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      value={(inputs as any)[key].high}
                      onChange={(e) => updateRange(key as any, 'high', Number(e.target.value))}
                      className="w-full bg-[#0a0c13] px-2 py-1 rounded border border-[#202638] text-white"
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
    </div>
  );
}
