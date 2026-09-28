'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Save, 
  RotateCcw, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  CheckCircle2, 
  DollarSign, 
  Percent, 
  Layers, 
  Truck, 
  Building2, 
  Sparkles,
  Info,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { CalculatorDefaults, ScenarioKey, PricingInputs } from '@/lib/types';
import { defaultCalculatorDefaults, formatMoney } from '@/lib/pricingEngine';
import { useAuth } from '@/lib/authContext';
import ModalPortal from '@/components/ui/ModalPortal';

interface CalculatorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInputs: PricingInputs;
  onApplyDefaultsToCurrent: (updatedDefaults: CalculatorDefaults) => void;
}

export default function CalculatorSettingsModal({
  isOpen,
  onClose,
  currentInputs,
  onApplyDefaultsToCurrent,
}: CalculatorSettingsModalProps) {
  const { user, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'overheads' | 'inbound' | 'commercial' | 'locks'>('overheads');
  const [defaults, setDefaults] = useState<CalculatorDefaults>(defaultCalculatorDefaults);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessAlert, setSaveSuccessAlert] = useState(false);
  const [applySuccessAlert, setApplySuccessAlert] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load defaults from user metadata in Supabase or local storage on mount/open
  useEffect(() => {
    if (!isOpen) return;

    let loaded: CalculatorDefaults = defaultCalculatorDefaults;

    // Check user_metadata in Supabase
    if (user?.metadata?.calculator_defaults) {
      try {
        loaded = { ...defaultCalculatorDefaults, ...user.metadata.calculator_defaults };
      } catch (_) {}
    } else {
      // Fallback to local storage
      try {
        const raw = localStorage.getItem('rivlet_calculator_defaults');
        if (raw) {
          loaded = { ...defaultCalculatorDefaults, ...JSON.parse(raw) };
        }
      } catch (_) {}
    }

    setDefaults(loaded);
    setValidationErrors({});
  }, [isOpen, user]);

  if (!isOpen) return null;

  const curr = defaults.currency || '₹';

  // Generic field updater
  const updateField = <K extends keyof CalculatorDefaults>(key: K, value: CalculatorDefaults[K]) => {
    setDefaults(prev => ({ ...prev, [key]: value }));
  };

  // Scenario updater for overheads
  const updateOverhead = (
    category: 'salary' | 'office' | 'saas' | 'professional' | 'finance' | 'brandAmort',
    scenario: ScenarioKey,
    value: number
  ) => {
    setDefaults(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [scenario]: Math.max(0, Number(value) || 0),
      }
    }));
  };

  // Scenario totals
  const totalOverhead = (sc: ScenarioKey) => {
    return (
      (defaults.salary[sc] || 0) +
      (defaults.office[sc] || 0) +
      (defaults.saas[sc] || 0) +
      (defaults.professional[sc] || 0) +
      (defaults.finance[sc] || 0) +
      (defaults.brandAmort[sc] || 0)
    );
  };

  // Inbound & packaging total per unit
  const totalStandardInbound = 
    defaults.development +
    defaults.inbound +
    defaults.qc +
    defaults.packaging +
    defaults.tags +
    defaults.branding +
    defaults.receiving +
    defaults.pickpack +
    defaults.inventory;

  // Validate settings
  const validateSettings = (): boolean => {
    const errs: Record<string, string> = {};

    if (defaults.targetMargin < 1 || defaults.targetMargin > 90) {
      errs.targetMargin = 'Target margin must be between 1% and 90%.';
    }
    if (defaults.gateway < 0 || defaults.gateway > 20) {
      errs.gateway = 'Gateway fee must be between 0% and 20%.';
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save to Supabase and LocalStorage
  const handleSaveDefaults = async () => {
    if (!validateSettings()) return;

    setIsSaving(true);
    try {
      // 1. LocalStorage
      localStorage.setItem('rivlet_calculator_defaults', JSON.stringify(defaults));

      // 2. Supabase Cloud via updateProfile
      await updateProfile({
        calculator_defaults: defaults,
      });

      setSaveSuccessAlert(true);
      setTimeout(() => setSaveSuccessAlert(false), 3000);
    } catch (e) {
      console.error('Error saving calculator defaults:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Apply directly to active calculation
  const handleApplyToActive = () => {
    if (!validateSettings()) return;
    onApplyDefaultsToCurrent(defaults);
    setApplySuccessAlert(true);
    setTimeout(() => {
      setApplySuccessAlert(false);
      onClose();
    }, 1200);
  };

  // Reset to initial standards
  const handleResetToStandard = () => {
    if (window.confirm('Reset all defaults to factory standard Rivlet settings?')) {
      setDefaults(defaultCalculatorDefaults);
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in text-white"
        onClick={onClose}
      >
        <div 
          className="w-full max-w-4xl max-h-[92vh] bg-[#0c0f17] border border-[#22283a] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1e2638] bg-[#0e121b] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[rgba(205,160,82,0.15)] text-[#e6c875] border border-[rgba(205,160,82,0.3)] flex-shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-serif text-white tracking-wide">
                  Calculator Brand Defaults & Fixed Overheads
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Cloud Sync
                </span>
              </div>
              <p className="text-xs text-[#94a3b8]">
                Define permanent fixed values that rarely change. Synced between your tablet & laptop.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1a2133] transition-colors"
            title="Close Settings Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#1e2638] bg-[#090b12] overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('overheads')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'overheads'
                ? 'border-[#cda052] text-[#e6c875] bg-[#141824]'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Fixed Annual Overheads</span>
          </button>

          <button
            onClick={() => setActiveTab('inbound')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'inbound'
                ? 'border-[#cda052] text-[#e6c875] bg-[#141824]'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Fixed Inbound & Packaging ({curr}{totalStandardInbound}/unit)</span>
          </button>

          <button
            onClick={() => setActiveTab('commercial')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'commercial'
                ? 'border-[#cda052] text-[#e6c875] bg-[#141824]'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Commercial & Gateway Policies</span>
          </button>

          <button
            onClick={() => setActiveTab('locks')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
              activeTab === 'locks'
                ? 'border-[#cda052] text-[#e6c875] bg-[#141824]'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock & Protection Rules</span>
          </button>
        </div>

        {/* Alerts */}
        {saveSuccessAlert && (
          <div className="mx-5 mt-4 p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Brand defaults successfully saved to Supabase Cloud and local storage! All new product calculations will now use these values.</span>
          </div>
        )}

        {applySuccessAlert && (
          <div className="mx-5 mt-4 p-3 bg-blue-950/80 border border-blue-700/60 rounded-xl text-blue-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
            <Sparkles className="w-4 h-4 text-[#cda052] flex-shrink-0" />
            <span>Applied custom defaults directly to current active calculation!</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          
          {/* TAB 1: FIXED ANNUAL OVERHEADS */}
          {activeTab === 'overheads' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#111624] border border-[#232c42] rounded-xl flex items-start gap-2.5 text-[#94a3b8]">
                <Info className="w-4 h-4 text-[#cda052] flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">Fixed Annual Overheads</strong> represent your brand&apos;s organizational run-rate (rent, salaries, subscriptions, amortizations). These are allocated per unit based on production volume so every costing accurately reflects full overhead absorption.
                </div>
              </div>

              {/* Scenario Total Summary Header */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-[#080a10] border border-[#1b2234] rounded-xl text-center">
                <div>
                  <span className="text-[10px] text-[#94a3b8] uppercase font-mono block">Conservative Scenario</span>
                  <span className="text-sm font-bold text-white font-mono">{formatMoney(totalOverhead('low'), curr)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#cda052] uppercase font-mono block">Expected Scenario (Base)</span>
                  <span className="text-sm font-bold text-[#e6c875] font-mono">{formatMoney(totalOverhead('mid'), curr)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-mono block">Upside Scenario</span>
                  <span className="text-sm font-bold text-emerald-300 font-mono">{formatMoney(totalOverhead('high'), curr)}</span>
                </div>
              </div>

              {/* Overheads Grid */}
              <div className="space-y-3">
                {[
                  { key: 'salary' as const, label: 'Annual Executive & Merchandising Salaries', desc: 'Payroll allocation across design, sourcing, and commercial leads' },
                  { key: 'office' as const, label: 'Office & Studio Space Lease', desc: 'HQ rent, studio utilities, fitting lab maintenance' },
                  { key: 'saas' as const, label: 'SaaS, ERP & Cloud Software', desc: 'Shopify Plus, Supabase, Adobe Cloud, email, analytics' },
                  { key: 'professional' as const, label: 'Legal, Audit & Compliance', desc: 'Statutory audit, IP trademarks, contract vetting' },
                  { key: 'finance' as const, label: 'Banking & Financing Costs', desc: 'Letter of credit charges, forex spreads, payment buffer' },
                  { key: 'brandAmort' as const, label: 'Brand Capex & Tooling Amortization', desc: 'Custom metal dies, packaging molds, brand assets' },
                ].map((item) => (
                  <div key={item.key} className="p-3.5 bg-[#0e121b] border border-[#1e2638] rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="font-semibold text-white text-xs">{item.label}</span>
                        <p className="text-[11px] text-[#94a3b8]">{item.desc}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] uppercase font-mono text-[#94a3b8] block mb-1">Low (Conservative)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] font-mono">{curr}</span>
                          <input
                            type="number"
                            min="0"
                            value={defaults[item.key].low}
                            onChange={(e) => updateOverhead(item.key, 'low', Number(e.target.value))}
                            className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white font-mono text-xs focus:border-[#cda052] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-mono text-[#cda052] block mb-1">Mid (Expected Baseline)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#cda052] font-mono">{curr}</span>
                          <input
                            type="number"
                            min="0"
                            value={defaults[item.key].mid}
                            onChange={(e) => updateOverhead(item.key, 'mid', Number(e.target.value))}
                            className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#cda052]/40 text-[#e6c875] font-mono text-xs focus:border-[#cda052] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-mono text-emerald-400 block mb-1">High (Upside Scale)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-400 font-mono">{curr}</span>
                          <input
                            type="number"
                            min="0"
                            value={defaults[item.key].high}
                            onChange={(e) => updateOverhead(item.key, 'high', Number(e.target.value))}
                            className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-emerald-300 font-mono text-xs focus:border-[#cda052] outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FIXED INBOUND & PACKAGING */}
          {activeTab === 'inbound' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#111624] border border-[#232c42] rounded-xl flex items-start gap-2.5 text-[#94a3b8]">
                <Truck className="w-4 h-4 text-[#cda052] flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">Fixed Operational Rates (Per Unit)</strong> define the standard non-fabric costs that apply to standard luxury garment production. Total standard surcharge per garment: <strong className="text-[#e6c875]">{curr}{totalStandardInbound}</strong>.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'packaging' as const, label: 'Luxury Garment Box & Polybag', desc: 'Rigid magnetic gift box + biodegradable inner zip polybag' },
                  { key: 'branding' as const, label: 'Branding Hardware & Heavy Hangtags', desc: 'Matte black metal eyelet tag, embossed cord, authenticity seal' },
                  { key: 'tags' as const, label: 'Woven Labels & Care Specs', desc: 'Damask woven neck label + satin QR care instruction set' },
                  { key: 'inbound' as const, label: 'Inbound Freight per Unit', desc: 'Trucking freight from Tirupur factory to central Bangalore warehouse' },
                  { key: 'qc' as const, label: 'Quality Control / AQL 2.5 Inspection', desc: 'End-line inspector charge per finished garment' },
                  { key: 'development' as const, label: 'Pattern & Sample Amortization', desc: 'Master tech pack, grade testing, fit samples per style' },
                  { key: 'receiving' as const, label: 'Warehouse Receiving & Barcoding', desc: 'Intake inspection, RFID tagging, bin placement' },
                  { key: 'pickpack' as const, label: 'Pick, Pack & Despatch Dispatch', desc: 'Fulfillment center boxing, tissue wrap, sticker seal' },
                  { key: 'inventory' as const, label: 'Inventory Holding Reserve', desc: 'Storage slot reserve per month of inventory turn' },
                ].map((item) => (
                  <div key={item.key} className="p-3 bg-[#0e121b] border border-[#1e2638] rounded-xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-white block">{item.label}</span>
                      <p className="text-[11px] text-[#94a3b8]">{item.desc}</p>
                    </div>

                    <div className="relative w-28 flex-shrink-0">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] font-mono">{curr}</span>
                      <input
                        type="number"
                        min="0"
                        value={defaults[item.key]}
                        onChange={(e) => updateField(item.key, Math.max(0, Number(e.target.value) || 0))}
                        className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white font-mono text-xs focus:border-[#cda052] outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COMMERCIAL & SALES CHARGES */}
          {activeTab === 'commercial' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#111624] border border-[#232c42] rounded-xl flex items-start gap-2.5 text-[#94a3b8]">
                <Percent className="w-4 h-4 text-[#cda052] flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">Commercial Rules & Defaults</strong> set your standard currency, baseline hurdle margin, payment gateway fees, and automated Indian GST treatment.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Default Currency */}
                <div className="p-3.5 bg-[#0e121b] border border-[#1e2638] rounded-xl space-y-1.5">
                  <label className="font-semibold text-white block">Default Operating Currency</label>
                  <p className="text-[11px] text-[#94a3b8]">Currency assigned when creating new calculation sheets</p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => updateField('currency', '₹')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                        defaults.currency === '₹' ? 'bg-[#cda052] text-black shadow-glow' : 'bg-[#141824] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      ₹ INR (Indian Rupee)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('currency', '$')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                        defaults.currency === '$' ? 'bg-[#cda052] text-black shadow-glow' : 'bg-[#141824] text-[#94a3b8] hover:text-white'
                      }`}
                    >
                      $ USD (US Dollar)
                    </button>
                  </div>
                </div>

                {/* Default Target Margin */}
                <div className="p-3.5 bg-[#0e121b] border border-[#1e2638] rounded-xl space-y-1.5">
                  <label className="font-semibold text-white block">Baseline Target Contribution Margin</label>
                  <p className="text-[11px] text-[#94a3b8]">Standard margin hurdle percentage for product viability</p>
                  <div className="relative w-full pt-1">
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={defaults.targetMargin}
                      onChange={(e) => updateField('targetMargin', Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white font-mono text-xs focus:border-[#cda052] outline-none"
                    />
                    <span className="absolute right-3 top-[15px] text-[#94a3b8] font-mono">%</span>
                  </div>
                  {validationErrors.targetMargin && (
                    <span className="text-[10px] text-rose-400 block">{validationErrors.targetMargin}</span>
                  )}
                </div>

                {/* Gateway Fee */}
                <div className="p-3.5 bg-[#0e121b] border border-[#1e2638] rounded-xl space-y-1.5">
                  <label className="font-semibold text-white block">Default Payment Gateway Fee</label>
                  <p className="text-[11px] text-[#94a3b8]">Razorpay / Cashfree card, UPI & netbanking charge %</p>
                  <div className="relative w-full pt-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={defaults.gateway}
                      onChange={(e) => updateField('gateway', Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white font-mono text-xs focus:border-[#cda052] outline-none"
                    />
                    <span className="absolute right-3 top-[15px] text-[#94a3b8] font-mono">%</span>
                  </div>
                </div>

                {/* Shopify App Fee */}
                <div className="p-3.5 bg-[#0e121b] border border-[#1e2638] rounded-xl space-y-1.5">
                  <label className="font-semibold text-white block">Shopify Additional Transaction Fee</label>
                  <p className="text-[11px] text-[#94a3b8]">External gateway charge if on Shopify Basic/Advanced (0% if Plus)</p>
                  <div className="relative w-full pt-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={defaults.shopifyFee}
                      onChange={(e) => updateField('shopifyFee', Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white font-mono text-xs focus:border-[#cda052] outline-none"
                    />
                    <span className="absolute right-3 top-[15px] text-[#94a3b8] font-mono">%</span>
                  </div>
                </div>

                {/* COD Fixed Fee */}
                <div className="p-3.5 bg-[#0e121b] border border-[#1e2638] rounded-xl space-y-1.5">
                  <label className="font-semibold text-white block">Cash on Delivery (COD) Handling</label>
                  <p className="text-[11px] text-[#94a3b8]">Courier cash collection charge per COD order</p>
                  <div className="relative w-full pt-1">
                    <span className="absolute left-2.5 top-[15px] text-[#94a3b8] font-mono">{curr}</span>
                    <input
                      type="number"
                      min="0"
                      value={defaults.cod}
                      onChange={(e) => updateField('cod', Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-[#07090e] border border-[#263147] text-white font-mono text-xs focus:border-[#cda052] outline-none"
                    />
                  </div>
                </div>

                {/* GST Treatment Switches */}
                <div className="p-3.5 bg-[#0e121b] border border-[#1e2638] rounded-xl space-y-3">
                  <label className="font-semibold text-white block">Indian GST Automation Rules</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defaults.autoOutputTax}
                      onChange={(e) => updateField('autoOutputTax', e.target.checked)}
                      className="rounded accent-[#cda052] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-white text-xs">Step Output GST (5% ≤ ₹2,500; 18% &gt; ₹2,500)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defaults.autoFactoryTax}
                      onChange={(e) => updateField('autoFactoryTax', e.target.checked)}
                      className="rounded accent-[#cda052] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-white text-xs">Step Factory GST (5% ≤ ₹2,500; 18% &gt; ₹2,500)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={defaults.factoryGstRecoverable}
                      onChange={(e) => updateField('factoryGstRecoverable', e.target.checked)}
                      className="rounded accent-[#cda052] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-white text-xs">Factory GST is Recoverable Input Tax Credit (ITC)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOCK & PROTECTION RULES */}
          {activeTab === 'locks' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#111624] border border-[#232c42] rounded-xl flex items-start gap-2.5 text-[#94a3b8]">
                <Lock className="w-4 h-4 text-[#cda052] flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">Protect Fixed Brand Parameters</strong>. Prevent accidental modifications to fixed company overheads or operational rates while teammates or executives are costing specific garment styles.
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-[#0e121b] border border-[#1e2638] rounded-xl flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">Lock Fixed Annual Overheads</span>
                      {defaults.lockedOverheads && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#e6c875] border border-[rgba(205,160,82,0.3)] font-mono flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Locked in Studio
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                      Salaries, studio lease, SaaS, professional, finance, and brand amortizations will be rendered as read-only with a gold lock badge in the calculation studio.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={Boolean(defaults.lockedOverheads)}
                    onChange={(e) => updateField('lockedOverheads', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded accent-[#cda052] cursor-pointer flex-shrink-0"
                  />
                </div>

                <div className="p-4 bg-[#0e121b] border border-[#1e2638] rounded-xl flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">Lock Standard Packaging & Inbound Rates</span>
                      {defaults.lockedInbound && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#e6c875] border border-[rgba(205,160,82,0.3)] font-mono flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Locked in Studio
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                      Standard luxury packaging ({curr}{defaults.packaging}), care tags ({curr}{defaults.tags}), hardware ({curr}{defaults.branding}), freight ({curr}{defaults.inbound}), and warehousing will be locked from direct inline editing.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={Boolean(defaults.lockedInbound)}
                    onChange={(e) => updateField('lockedInbound', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded accent-[#cda052] cursor-pointer flex-shrink-0"
                  />
                </div>

                <div className="p-4 bg-[#0e121b] border border-[#1e2638] rounded-xl flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">Lock Sales Charges & Payment Gateway %</span>
                      {defaults.lockedSalesRates && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#e6c875] border border-[rgba(205,160,82,0.3)] font-mono flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Locked in Studio
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                      Gateways ({defaults.gateway}%), platform fees, and COD charges will be standardized across all cost sheets.
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={Boolean(defaults.lockedSalesRates)}
                    onChange={(e) => updateField('lockedSalesRates', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded accent-[#cda052] cursor-pointer flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-[#1e2638] bg-[#0e121b] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToStandard}
            className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:text-white hover:bg-[#161a26] border border-transparent hover:border-[#263147] flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            title="Reset settings to Rivlet factory benchmarks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Standards</span>
          </button>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleApplyToActive}
              className="px-3.5 py-2 rounded-lg bg-[#141824] hover:bg-[#1a2236] text-[#cbd5e1] hover:text-white border border-[#263147] text-xs font-semibold transition-all active:scale-[0.98]"
              title="Apply these defaults to currently loaded style calculation immediately"
            >
              Apply to Active Style
            </button>

            <button
              type="button"
              onClick={handleSaveDefaults}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow flex items-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-60"
              title="Save as account defaults synced across devices"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Syncing to Cloud...' : 'Save Defaults & Sync'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
