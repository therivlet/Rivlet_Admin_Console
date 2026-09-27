'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Layers, 
  Calculator, 
  FileText, 
  BookOpen, 
  ArrowUpRight, 
  TrendingUp, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Percent,
  DollarSign
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import CommandPalette from '@/components/layout/CommandPalette';

export default function DashboardOverviewPage() {
  const { artifacts, costingSheets, documents, kbArticles } = useAdminStore();
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  const promotedTools = artifacts.filter((a) => a.isPromoted);
  const activeCerts = documents.filter((d) => d.status === 'Active');

  // Compute average margin across sheets
  const avgGrossMargin = costingSheets.length > 0
    ? (costingSheets.reduce((sum, s) => sum + (s.expectedMargin || 0), 0) / costingSheets.length).toFixed(1)
    : '0';

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Top Welcome & Executive Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2233] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] uppercase tracking-wider">
              Rivlet Operations
            </span>
            <span className="text-xs text-[#636c82]">• Season FW26 / SS27</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide font-serif">
            Executive Admin Command Center
          </h1>
          <p className="text-xs text-[#7e879f] mt-1">
            Centralized hub for Claude interactive artifacts, apparel costing BOMs, compliance documents, and brand SOPs.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={() => setIsCmdOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141824] border border-[#232a3d] text-xs text-[#8f98af] hover:text-white hover:border-[#cda052]/50 transition-colors shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-[#cda052]" />
            <span>Search Platform</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-[#1d2232] rounded text-[#a5adbe] font-mono">⌘K</kbd>
          </button>

          <Link
            href="/artifacts?action=new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Artifact</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Claude Artifacts */}
        <Link 
          href="/artifacts" 
          className="bg-[#111420] border border-[#1e2436] hover:border-[#cda052]/50 p-5 rounded-xl transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#7c859d] uppercase tracking-wider">
              Claude Artifacts
            </span>
            <div className="p-2 rounded-lg bg-[rgba(205,160,82,0.12)] text-[#cda052] group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{artifacts.length}</div>
          <div className="flex items-center justify-between text-[11px] mt-2 text-[#636c82]">
            <span className="text-[#e8ca78] font-medium">{promotedTools.length} Promoted Pages</span>
            <span>{artifacts.length - promotedTools.length} in Staging</span>
          </div>
        </Link>

        {/* Metric 2: Costing Sheets */}
        <Link 
          href="/calculator" 
          className="bg-[#111420] border border-[#1e2436] hover:border-emerald-600/50 p-5 rounded-xl transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#7c859d] uppercase tracking-wider">
              Costing Sheets
            </span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 group-hover:scale-110 transition-transform">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{costingSheets.length}</div>
          <div className="flex items-center justify-between text-[11px] mt-2 text-[#636c82]">
            <span className="text-emerald-400 font-medium">{avgGrossMargin}% Avg D2C Margin</span>
            <span>Ready for Bulk</span>
          </div>
        </Link>

        {/* Metric 3: Document Vault */}
        <Link 
          href="/documents" 
          className="bg-[#111420] border border-[#1e2436] hover:border-cyan-600/50 p-5 rounded-xl transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#7c859d] uppercase tracking-wider">
              Document Vault
            </span>
            <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{documents.length}</div>
          <div className="flex items-center justify-between text-[11px] mt-2 text-[#636c82]">
            <span className="text-cyan-400 font-medium">{activeCerts.length} Active Records</span>
            <span>GOTS / OEKO-TEX</span>
          </div>
        </Link>

        {/* Metric 4: Confidential SOPs */}
        <Link 
          href="/knowledge-base" 
          className="bg-[#111420] border border-[#1e2436] hover:border-purple-600/50 p-5 rounded-xl transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#7c859d] uppercase tracking-wider">
              Brand Knowledge Base
            </span>
            <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">{kbArticles.length}</div>
          <div className="flex items-center justify-between text-[11px] mt-2 text-[#636c82]">
            <span className="text-purple-400 font-medium">Internal Sourcing</span>
            <span>AQL 2.5 Standards</span>
          </div>
        </Link>
      </div>

      {/* Promoted Claude Tools Quick Launcher */}
      <div className="bg-[#111420] border border-[#1e2436] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[rgba(205,160,82,0.15)] text-[#cda052]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Promoted Claude Tools (Active Portal Pages)
              </h2>
              <p className="text-xs text-[#717a90]">
                Interactive HTML tools created by Claude, curated and pinned as first-class application pages.
              </p>
            </div>
          </div>

          <Link
            href="/artifacts"
            className="text-xs text-[#cda052] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Manage All in Staging Vault</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotedTools.map((tool) => (
            <Link
              key={tool.id}
              href={`/tools/${tool.routeSlug || tool.id}`}
              className="bg-[#090b12] border border-[#1c2234] hover:border-[#cda052]/60 p-4 rounded-xl transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.1)] text-[#cda052] font-semibold border border-[rgba(205,160,82,0.2)]">
                    {tool.category}
                  </span>
                  <span className="text-[10px] text-[#555d72] font-mono">v{tool.version}</span>
                </div>
                <h3 className="text-xs font-semibold text-white group-hover:text-[#cda052] transition-colors mb-1">
                  {tool.title}
                </h3>
                <p className="text-[11px] text-[#717a90] line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-[#181d2c] flex items-center justify-between text-xs text-[#8e97af]">
                <span className="text-[10px] text-[#555d72]">Dedicated Route: /tools/{tool.routeSlug || tool.id}</span>
                <span className="flex items-center gap-1 text-[#cda052] font-medium group-hover:translate-x-1 transition-transform">
                  Launch <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Costing Sheets + Document Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Garment Costing Sheets (7 cols) */}
        <div className="lg:col-span-7 bg-[#111420] border border-[#1e2436] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Active Garment Costing Sheets
              </h3>
              <Link href="/calculator" className="text-xs text-[#cda052] hover:underline font-medium">
                Open Studio →
              </Link>
            </div>

            <div className="space-y-3">
              {costingSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="bg-[#090b12] border border-[#1c2234] p-3.5 rounded-lg flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#cda052] px-1.5 py-0.5 rounded bg-[rgba(205,160,82,0.1)]">
                        {sheet.sku}
                      </span>
                      <span className="text-[10px] text-[#636c82]">{sheet.season}</span>
                    </div>
                    <div className="text-xs font-semibold text-white truncate">{sheet.styleName}</div>
                  </div>

                  <div className="flex items-center gap-4 text-right flex-shrink-0 text-xs">
                    <div>
                      <div className="text-[10px] text-[#555d72] uppercase">Factory</div>
                      <div className="font-medium text-white">{sheet.currency}{sheet.inputs?.factory || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#555d72] uppercase">Units</div>
                      <div className="font-medium text-amber-400">{sheet.inputs?.units?.mid?.toLocaleString() || '1,000'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#555d72] uppercase">Listed MRP</div>
                      <div className="font-bold text-emerald-400">{sheet.currency}{sheet.mrp}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#181d2c] flex items-center justify-between text-xs text-[#636c82]">
            <span>Automated pricing based on fabric yield, trims, and keystoning</span>
            <Link href="/calculator" className="text-[#cda052] hover:underline">
              Calculate New SKU +
            </Link>
          </div>
        </div>

        {/* Right Column: Compliance & SOP Directory (5 cols) */}
        <div className="lg:col-span-5 bg-[#111420] border border-[#1e2436] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Compliance & SOP Highlights
              </h3>
              <Link href="/documents" className="text-xs text-[#cda052] hover:underline font-medium">
                Vault →
              </Link>
            </div>

            <div className="space-y-3">
              {documents.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="bg-[#090b12] border border-[#1c2234] p-3 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-white font-medium truncate mb-0.5">{doc.title}</div>
                    <div className="text-[10px] text-[#636c82]">
                      {doc.associatedVendor || 'Internal Record'} • {doc.fileFormat.toUpperCase()}
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 flex-shrink-0">
                    {doc.status}
                  </span>
                </div>
              ))}

              {kbArticles.slice(0, 2).map((art) => (
                <div
                  key={art.id}
                  className="bg-[#090b12] border border-[#1c2234] p-3 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-white font-medium truncate mb-0.5">{art.title}</div>
                    <div className="text-[10px] text-[#cda052]">
                      {art.category} {art.isConfidential && '• [Confidential SOP]'}
                    </div>
                  </div>
                  <Link href={`/knowledge-base?id=${art.id}`} className="text-[#555d72] hover:text-white flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#181d2c] flex items-center justify-between text-xs text-[#636c82]">
            <span>All records encrypted & confidential</span>
            <Link href="/knowledge-base" className="text-[#cda052] hover:underline">
              Browse Wiki →
            </Link>
          </div>
        </div>
      </div>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />
    </div>
  );
}
