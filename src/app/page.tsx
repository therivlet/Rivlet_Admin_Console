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
  DollarSign,
  Factory,
  GitBranch,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';

export default function DashboardOverviewPage() {
  const { artifacts, costingSheets, documents, kbArticles, vendors, pipelineItems, budgetItems } = useAdminStore();

  const promotedTools = artifacts.filter((a) => a.isPromoted);
  const activeCerts = documents.filter((d) => d.status === 'Active');
  const expiringDocs = documents.filter((d) => d.status === 'Expiring Soon' || d.status === 'Expired');

  // Compute average margin across sheets
  const avgGrossMargin = costingSheets.length > 0
    ? (costingSheets.reduce((sum, s) => sum + (s.expectedMargin || 0), 0) / costingSheets.length).toFixed(1)
    : '0';

  const approvedVendors = vendors.filter((v) => v.stage === 'Approved Partner').length;
  const inProductionCount = pipelineItems.filter((p) => ['PO Issued', 'In Production', 'QC Inspection'].includes(p.stage)).length;
  const budgetPlanned = budgetItems.reduce((sum, b) => sum + b.plannedAmount, 0);
  const budgetActual = budgetItems.reduce((sum, b) => sum + b.actualAmount, 0);
  const budgetPct = budgetPlanned > 0 ? Math.round((budgetActual / budgetPlanned) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Proactive certificate expiry banner — surfaces what was previously only a passive badge */}
      {expiringDocs.length > 0 && (
        <Link
          href="/documents"
          className="flex items-center gap-3 rounded-xl border border-amber-800/50 bg-amber-950/20 px-4 py-3 hover:bg-amber-950/30 transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-200">
            <span className="font-semibold">{expiringDocs.length} document{expiringDocs.length > 1 ? 's' : ''}</span> expiring soon or already expired — review the vault.
          </p>
          <ChevronRight className="w-3.5 h-3.5 text-amber-400 ml-auto flex-shrink-0" />
        </Link>
      )}
      {/* Top Welcome & Executive Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1c2233] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] uppercase tracking-wider font-mono">
              Rivlet Operations
            </span>
            <span className="text-xs text-[#94a3b8] font-medium">• Season FW26 / SS27</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-serif">
            Executive Admin Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#cbd5e1] mt-1.5 leading-relaxed max-w-3xl">
            Centralized operations console for Claude interactive artifacts, apparel costing BOMs, compliance certifications, and confidential mill SOPs.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            title="Search platform (⌘K / Ctrl+K)"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121623] border border-[#232d42] text-xs font-medium text-[#cbd5e1] hover:text-white hover:border-[#cda052]/60 transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-[#cda052]" />
            <span>Search Platform</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-[#1a2234] border border-[#2b3752] rounded text-[#cbd5e1] font-mono">⌘K</kbd>
          </button>

          <Link
            href="/artifacts?action=new"
            title="Create or import Claude Artifact"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
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
          className="bg-[#0e121b] border border-[#1e2638] hover:border-[#cda052]/50 p-5 rounded-xl transition-all duration-150 group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
              Claude Artifacts
            </span>
            <div className="p-2 rounded-lg bg-[rgba(205,160,82,0.12)] text-[#cda052] group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono tabular-nums">{artifacts.length}</div>
          <div className="flex items-center justify-between text-xs mt-2.5 text-[#94a3b8]">
            <span className="text-[#e8ca78] font-semibold">{promotedTools.length} Live Pages</span>
            <span>{artifacts.length - promotedTools.length} in Staging</span>
          </div>
        </Link>

        {/* Metric 2: Costing Sheets */}
        <Link 
          href="/calculator" 
          className="bg-[#0e121b] border border-[#1e2638] hover:border-emerald-600/50 p-5 rounded-xl transition-all duration-150 group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
              Costing Sheets
            </span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 group-hover:scale-110 transition-transform">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono tabular-nums">{costingSheets.length}</div>
          <div className="flex items-center justify-between text-xs mt-2.5 text-[#94a3b8]">
            <span className="text-emerald-400 font-semibold">{avgGrossMargin}% Avg D2C Margin</span>
            <span>Production Ready</span>
          </div>
        </Link>

        {/* Metric 3: Document Vault */}
        <Link 
          href="/documents" 
          className="bg-[#0e121b] border border-[#1e2638] hover:border-cyan-600/50 p-5 rounded-xl transition-all duration-150 group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
              Document Vault
            </span>
            <div className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono tabular-nums">{documents.length}</div>
          <div className="flex items-center justify-between text-xs mt-2.5 text-[#94a3b8]">
            <span className="text-cyan-400 font-semibold">{activeCerts.length} Verified Active</span>
            <span>GOTS / OEKO-TEX</span>
          </div>
        </Link>

        {/* Metric 4: Confidential SOPs */}
        <Link 
          href="/knowledge-base" 
          className="bg-[#0e121b] border border-[#1e2638] hover:border-purple-600/50 p-5 rounded-xl transition-all duration-150 group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
              Brand Knowledge Base
            </span>
            <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono tabular-nums">{kbArticles.length}</div>
          <div className="flex items-center justify-between text-xs mt-2.5 text-[#94a3b8]">
            <span className="text-purple-300 font-semibold">Tirupur Sourcing Wiki</span>
            <span>AQL 2.5 Standards</span>
          </div>
        </Link>
      </div>

      {/* Business Workflow Widgets: Vendors, Pipeline, Budget */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/vendors"
          className="bg-[#0e121b] border border-[#1e2638] hover:border-amber-600/50 p-5 rounded-xl transition-all duration-150 group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Manufacturer Outreach</span>
            <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 group-hover:scale-110 transition-transform">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono tabular-nums">{vendors.length}</div>
          <div className="flex items-center justify-between text-xs mt-2.5 text-[#94a3b8]">
            <span className="text-amber-300 font-semibold">{approvedVendors} Approved</span>
            <span>Tirupur outreach pipeline</span>
          </div>
        </Link>

        <Link
          href="/pipeline"
          className="bg-[#0e121b] border border-[#1e2638] hover:border-sky-600/50 p-5 rounded-xl transition-all duration-150 group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Sampling & Production</span>
            <div className="p-2 rounded-lg bg-sky-950/60 text-sky-400 group-hover:scale-110 transition-transform">
              <GitBranch className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono tabular-nums">{pipelineItems.length}</div>
          <div className="flex items-center justify-between text-xs mt-2.5 text-[#94a3b8]">
            <span className="text-sky-300 font-semibold">{inProductionCount} In Production</span>
            <span>Drop 1 styles</span>
          </div>
        </Link>

        <Link
          href="/budget"
          className="bg-[#0e121b] border border-[#1e2638] hover:border-emerald-600/50 p-5 rounded-xl transition-all duration-150 group shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Launch Budget</span>
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white font-mono tabular-nums">{budgetPct}%</div>
          <div className="flex items-center justify-between text-xs mt-2.5 text-[#94a3b8]">
            <span className="text-emerald-300 font-semibold">₹{budgetActual.toLocaleString('en-IN')} spent</span>
            <span>of ₹{budgetPlanned.toLocaleString('en-IN')}</span>
          </div>
        </Link>
      </div>

      {/* Promoted Claude Tools Quick Launcher */}
      <div className="bg-[#0e121b] border border-[#1e2638] rounded-xl p-5 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[rgba(205,160,82,0.15)] text-[#cda052]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Promoted Claude Tools (Active Portal Pages)
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
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
              className="bg-[#080b12] border border-[#1c2438] hover:border-[#cda052]/60 p-4 rounded-xl transition-all group flex flex-col justify-between shadow-sm hover:shadow-glow/10"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.12)] text-[#cda052] font-semibold border border-[rgba(205,160,82,0.25)] font-mono">
                    {tool.category}
                  </span>
                  <span className="text-[11px] text-[#94a3b8] font-mono">v{tool.version}</span>
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-[#cda052] transition-colors mb-1.5">
                  {tool.title}
                </h3>
                <p className="text-xs text-[#94a3b8] line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="pt-3.5 mt-3.5 border-t border-[#182032] flex items-center justify-between text-xs text-[#94a3b8]">
                <span className="text-[11px] font-mono text-[#64748b]">/tools/{tool.routeSlug || tool.id}</span>
                <span className="flex items-center gap-1 text-[#cda052] font-semibold group-hover:translate-x-1 transition-transform">
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
        <div className="lg:col-span-7 bg-[#0e121b] border border-[#1e2638] rounded-xl p-5 sm:p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Active Garment Costing Sheets
              </h3>
              <Link href="/calculator" className="text-xs text-[#cda052] hover:underline font-semibold">
                Open Studio →
              </Link>
            </div>

            <div className="space-y-3">
              {costingSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="bg-[#080b12] border border-[#1c2438] hover:border-[#2b3854] p-3.5 rounded-lg flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#cda052] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.12)] border border-[rgba(205,160,82,0.25)]">
                        {sheet.sku}
                      </span>
                      <span className="text-xs text-[#94a3b8] font-medium">{sheet.season}</span>
                    </div>
                    <div className="text-sm font-semibold text-white truncate">{sheet.styleName}</div>
                  </div>

                  <div className="flex items-center gap-5 text-right flex-shrink-0 text-xs">
                    <div>
                      <div className="text-[10px] text-[#94a3b8] uppercase font-semibold">Factory</div>
                      <div className="font-semibold text-white font-mono tabular-nums">{sheet.currency}{sheet.inputs?.factory || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#94a3b8] uppercase font-semibold">Units</div>
                      <div className="font-semibold text-amber-300 font-mono tabular-nums">{sheet.inputs?.units?.mid?.toLocaleString() || '1,000'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#94a3b8] uppercase font-semibold">Listed MRP</div>
                      <div className="font-bold text-emerald-400 font-mono tabular-nums">{sheet.currency}{sheet.mrp}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-[#182032] flex items-center justify-between text-xs text-[#94a3b8]">
            <span>Automated pricing based on fabric yield, trims, and keystoning</span>
            <Link href="/calculator" className="text-[#cda052] hover:underline font-semibold">
              Calculate New SKU +
            </Link>
          </div>
        </div>

        {/* Right Column: Compliance & SOP Directory (5 cols) */}
        <div className="lg:col-span-5 bg-[#0e121b] border border-[#1e2638] rounded-xl p-5 sm:p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Compliance & SOP Highlights
              </h3>
              <Link href="/documents" className="text-xs text-[#cda052] hover:underline font-semibold">
                Vault →
              </Link>
            </div>

            <div className="space-y-3">
              {documents.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className="bg-[#080b12] border border-[#1c2438] hover:border-[#2b3854] p-3 rounded-lg flex items-center justify-between text-xs transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-white font-medium text-xs truncate mb-0.5">{doc.title}</div>
                    <div className="text-[11px] text-[#94a3b8]">
                      {doc.associatedVendor || 'Internal Record'} • <span className="uppercase font-mono text-[#cbd5e1]">{doc.fileFormat}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/40 flex-shrink-0 font-medium font-mono">
                    {doc.status}
                  </span>
                </div>
              ))}

              {kbArticles.slice(0, 2).map((art) => (
                <div
                  key={art.id}
                  className="bg-[#080b12] border border-[#1c2438] hover:border-[#2b3854] p-3 rounded-lg flex items-center justify-between text-xs transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-white font-medium text-xs truncate mb-0.5">{art.title}</div>
                    <div className="text-[11px] text-[#cda052]">
                      {art.category} {art.isConfidential && '• [Confidential SOP]'}
                    </div>
                  </div>
                  <Link href={`/knowledge-base?id=${art.id}`} className="text-[#94a3b8] hover:text-white flex-shrink-0 p-1">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-[#182032] flex items-center justify-between text-xs text-[#94a3b8]">
            <span>All records encrypted & confidential</span>
            <Link href="/knowledge-base" className="text-[#cda052] hover:underline font-semibold">
              Browse Wiki →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
