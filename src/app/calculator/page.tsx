'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Calculator, 
  FileSpreadsheet, 
  Plus, 
  ArrowRight,
  Trash2,
  Edit3
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { CostingSheet } from '@/lib/types';
import CostingCalculator from '@/components/calculator/CostingCalculator';
import { useConfirm } from '@/lib/confirmContext';

function CalculatorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const confirm = useConfirm();
  const { costingSheets, deleteCostingSheet } = useAdminStore();

  const tabParam = searchParams.get('tab');
  const actionParam = searchParams.get('action');

  // Determine active tab from URL or state
  const [activeTab, setActiveTab] = useState<'studio' | 'saved'>(() => {
    return tabParam === 'saved' ? 'saved' : 'studio';
  });

  // By default, selectedSheet is NULL (fresh empty calculator with defaults filled)
  // unless explicitly chosen from saved products or passed.
  const [selectedSheet, setSelectedSheet] = useState<CostingSheet | null>(null);
  const [calcKey, setCalcKey] = useState(0);

  // Sync tab and action with URL params
  useEffect(() => {
    if (tabParam === 'saved') {
      setActiveTab('saved');
    } else {
      setActiveTab('studio');
    }

    if (actionParam === 'new') {
      setSelectedSheet(null);
      setCalcKey((k) => k + 1);
      setActiveTab('studio');
    }
  }, [tabParam, actionParam]);

  const handleStartNewCalculator = () => {
    setSelectedSheet(null);
    setCalcKey((k) => k + 1);
    setActiveTab('studio');
    router.replace('/calculator?tab=studio&action=new');
  };

  const handleOpenSheetInStudio = (sheet: CostingSheet) => {
    setSelectedSheet(sheet);
    setActiveTab('studio');
    router.replace('/calculator?tab=studio');
  };

  const handleDeleteSheet = async (sheet: CostingSheet) => {
    const ok = await confirm({
      title: 'Delete Costing Sheet',
      message: `Delete saved costing sheet for ${sheet.sku} (${sheet.styleName})? This will permanently remove its manufacturing financial model.`,
      confirmLabel: 'Delete Sheet',
      danger: true,
    });
    if (!ok) return;
    deleteCostingSheet(sheet.id);
    if (selectedSheet?.id === sheet.id) {
      setSelectedSheet(null);
      setCalcKey((k) => k + 1);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2233] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white tracking-wide font-serif">
              Pricing & Unit Economics
            </h1>
          </div>
          <p className="text-xs text-[#7c859c]">
            Comprehensive real sales pricing, automatic step GST, factory ITC, customs import duties, annual overhead allocation, and 3-scenario range forecast.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Navigation */}
          <div className="flex items-center bg-[#111420] p-1 rounded-xl border border-[#20273a] overflow-x-auto max-w-full">
            <button
              onClick={() => {
                setActiveTab('studio');
                router.replace('/calculator?tab=studio');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'studio'
                  ? 'bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold shadow-glow'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Pricing Studio</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('saved');
                router.replace('/calculator?tab=saved');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-[#1e2538] text-white font-semibold'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Saved Products ({costingSheets.length})</span>
            </button>
          </div>

          {/* Quick New Calculator Action */}
          <button
            onClick={handleStartNewCalculator}
            title="Start fresh calculation for a brand new product style"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Calculator</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Studio */}
      {activeTab === 'studio' && (
        <CostingCalculator
          key={selectedSheet ? selectedSheet.id : `new-calc-${calcKey}`}
          initialSheet={selectedSheet || undefined}
          onSaveSuccess={() => {}}
          onSelectSavedProduct={(sheet) => setSelectedSheet(sheet)}
        />
      )}

      {/* Tab 2: Saved Products */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {costingSheets.length === 0 ? (
            <div className="bg-[#111420] border border-[#1e2436] rounded-2xl p-12 text-center space-y-3">
              <FileSpreadsheet className="w-10 h-10 text-[#cda052]/60 mx-auto" />
              <h3 className="text-base font-bold text-white">No Saved Costing Sheets Yet</h3>
              <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
                Create and save your first garment calculation from the Pricing Studio to see product comparisons and profit models here.
              </p>
              <button
                onClick={handleStartNewCalculator}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-xs hover:brightness-110 shadow-glow"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Start New Calculation</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {costingSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="bg-[#111420] border border-[#1e2436] rounded-xl p-5 hover:border-[#cda052]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-[#cda052] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.1)] border border-[rgba(205,160,82,0.2)]">
                        {sheet.sku}
                      </span>
                      <span className="text-xs text-[#94a3b8] font-mono">{new Date(sheet.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{sheet.styleName}</h3>
                    <div className="text-xs text-[#cbd5e1] mb-3">
                      MRP: <strong className="text-white font-mono">{sheet.currency}{sheet.mrp}</strong> • Target Margin: <span className="text-[#cda052] font-semibold">{sheet.inputs.targetMargin}%</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#090b12] p-2.5 rounded-lg border border-[#1b2132] text-center text-xs mb-3">
                      <div>
                        <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Factory FOB</div>
                        <div className="font-bold text-white font-mono">{sheet.currency}{sheet.inputs.factory}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Units Plan</div>
                        <div className="font-bold text-white font-mono">{sheet.inputs.units.mid.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Margin</div>
                        <div className="font-bold text-emerald-400 font-mono">{sheet.expectedMargin.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#1a1f2e] flex items-center justify-between">
                    <button
                      onClick={() => handleOpenSheetInStudio(sheet)}
                      className="text-xs text-[#cda052] hover:text-white font-semibold flex items-center gap-1 transition-colors px-2.5 py-1.5 rounded-lg bg-[rgba(205,160,82,0.1)] hover:bg-[rgba(205,160,82,0.2)] border border-[rgba(205,160,82,0.25)]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit in Studio</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSheet(sheet)}
                      className="text-xs text-[#94a3b8] hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-950/30 transition-colors flex items-center gap-1"
                      title={`Delete calculation for ${sheet.sku}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#94a3b8]">Loading Pricing Suite...</div>}>
      <CalculatorContent />
    </Suspense>
  );
}
