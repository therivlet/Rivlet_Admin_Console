'use client';

import React, { useState } from 'react';
import { 
  Calculator, 
  FileSpreadsheet, 
  Sparkles, 
  Plus, 
  Check, 
  ExternalLink,
  Code,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { CostingSheet } from '@/lib/types';
import CostingCalculator from '@/components/calculator/CostingCalculator';
import { useConfirm } from '@/lib/confirmContext';

export default function CalculatorPage() {
  const confirm = useConfirm();
  const { costingSheets, deleteCostingSheet, addArtifact } = useAdminStore();
  const [activeTab, setActiveTab] = useState<'studio' | 'saved' | 'raw-html'>('studio');
  const [selectedSheet, setSelectedSheet] = useState<CostingSheet | null>(costingSheets[0] || null);

  const handleDeleteSheet = async (sheet: CostingSheet) => {
    const ok = await confirm({
      title: 'Delete Costing Sheet',
      message: `Delete saved costing sheet for ${sheet.sku} (${sheet.styleName})? This will permanently remove its manufacturing financial model.`,
      confirmLabel: 'Delete Sheet',
      danger: true,
    });
    if (!ok) return;
    deleteCostingSheet(sheet.id);
  };

  const [rawCode, setRawCode] = useState('');
  const [rawTitle, setRawTitle] = useState('Custom Pricing Planner');
  const [rawSaved, setRawSaved] = useState(false);

  const handleImportRawCode = () => {
    if (!rawCode.trim()) return;

    addArtifact({
      title: rawTitle || 'Custom Pricing Planner',
      description: 'Imported pricing and unit economics tool',
      category: 'Calculators',
      tags: ['Pricing', 'Planner', 'GST', 'Custom'],
      htmlContent: rawCode,
      source: 'Claude HTML Artifact',
      version: '2.0',
      isPromoted: true,
      routeSlug: 'custom-pricing-planner',
      status: 'promoted',
    });

    setRawSaved(true);
    setTimeout(() => setRawSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2233] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-white tracking-wide font-serif">
              Rivlet Pricing & Unit Economics Suite
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold">
              Commercial Engine v2.0
            </span>
          </div>
          <p className="text-xs text-[#7c859c]">
            Real sales price, automatic step-function output GST, factory ITC, annual overhead allocation, and 3-scenario range forecast.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tab Navigation */}
          <div className="flex items-center bg-[#111420] p-1 rounded-xl border border-[#20273a] overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('studio')}
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
              onClick={() => setActiveTab('saved')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'saved'
                  ? 'bg-[#1e2538] text-white font-semibold'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Saved Products ({costingSheets.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('raw-html')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'raw-html'
                  ? 'bg-[#1e2538] text-[#cda052] font-semibold'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Import Raw HTML</span>
            </button>
          </div>

          {/* Quick New Product Action */}
          <button
            onClick={() => {
              setSelectedSheet(null);
              setActiveTab('studio');
            }}
            title="Start fresh calculation for a brand new product style"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#182032] border border-[#2c3a56] text-[#cda052] hover:text-white hover:border-[#cda052] font-semibold text-xs transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>＋ New Calculation</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Studio */}
      {activeTab === 'studio' && (
        <CostingCalculator
          initialSheet={selectedSheet || undefined}
          onSaveSuccess={() => {}}
        />
      )}

      {/* Tab 2: Saved Products */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
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
                      <div className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">Factory</div>
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
                    onClick={() => {
                      setSelectedSheet(sheet);
                      setActiveTab('studio');
                    }}
                    className="text-xs text-[#cda052] hover:text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    Open in Studio <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSheet(sheet)}
                    className="text-xs text-[#94a3b8] hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-950/30 transition-colors"
                    title={`Delete calculation for ${sheet.sku}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Raw HTML Importer */}
      {activeTab === 'raw-html' && (
        <div className="bg-[#10131d] border border-[#1e2436] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(205,160,82,0.15)] text-[#cda052]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Import or Run Raw Claude HTML Artifact</h2>
              <p className="text-xs text-[#7d879d]">
                Paste any raw HTML pricing calculator code directly. It will be sandboxed and pinned to your sidebar as a dedicated interactive page.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-[#8b94aa] block mb-1">Tool Title</label>
              <input
                type="text"
                value={rawTitle}
                onChange={(e) => setRawTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#090b12] border border-[#22283a] text-xs text-white outline-none focus:border-[#cda052]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8b94aa] block mb-1">HTML / CSS / JavaScript Code</label>
              <textarea
                value={rawCode}
                onChange={(e) => setRawCode(e.target.value)}
                rows={12}
                placeholder="<!doctype html><html>... Paste raw HTML artifact code here ...</html>"
                className="w-full bg-[#080a10] border border-[#22283a] text-[#cfd5e4] font-mono text-xs p-4 rounded-lg outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#636c80]">
                Executes safely in sandboxed iframe with no conflicts.
              </span>
              <button
                onClick={handleImportRawCode}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Save to Artifacts & Pin to Sidebar</span>
              </button>
            </div>

            {rawSaved && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Artifact saved and pinned to navigation under <strong>Promoted Claude Tools</strong>!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
