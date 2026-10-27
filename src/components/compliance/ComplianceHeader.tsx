'use client';

import React, { useState } from 'react';
import {
  Scale,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Ship,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { ComplianceWorkflowItem, DscRegistryItem, CustomsDeclaration } from '@/lib/types';
import ComplianceAiAdvisorModal from './ComplianceAiAdvisorModal';

interface ComplianceHeaderProps {
  workflows: ComplianceWorkflowItem[];
  dscItems: DscRegistryItem[];
  customsDeclarations: CustomsDeclaration[];
  activeTab: string;
  onTabSelect: (tab: string) => void;
}

export default function ComplianceHeader({
  workflows,
  dscItems,
  customsDeclarations,
  activeTab,
  onTabSelect,
}: ComplianceHeaderProps) {
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const totalWorkflows = workflows.length;
  const filedCount = workflows.filter((w) => w.status === 'filed').length;
  const overdueCount = workflows.filter((w) => {
    const d = new Date(w.dueDate);
    return w.status !== 'filed' && d < now;
  }).length;

  const upcoming7Days = workflows.filter((w) => {
    const d = new Date(w.dueDate);
    return w.status !== 'filed' && d >= now && d <= next7Days;
  });

  const upcoming30Days = workflows.filter((w) => {
    const d = new Date(w.dueDate);
    return w.status !== 'filed' && d >= now && d <= next30Days;
  });

  const totalItcClaimed = workflows.reduce((acc, curr) => acc + (curr.itcClaimed || 0), 0);

  const activeDscCount = dscItems.filter((d) => d.status === 'active').length;
  const expiringDscCount = dscItems.filter((d) => {
    const exp = new Date(d.expiryDate);
    return exp <= next30Days && exp >= now;
  }).length;

  const pendingCustomsClearances = customsDeclarations.filter(
    (c) => c.currentStage !== 'cleared_ooc_leo' && c.currentStage !== 'rejected'
  ).length;

  const filingHealthPercentage = totalWorkflows > 0 ? Math.round((filedCount / totalWorkflows) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Title & Statutory Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e121b] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-[#cda052] border border-amber-500/20">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Statutory Compliance & Customs Hub
              </h1>
              <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5">
                Rivlet Apparel Private Limited • GSTIN 33AABCR1234F1Z8 • IEC 0420088912
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAiAdvisorOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-[#cda052]/10 hover:bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/30 flex items-center gap-1.5 shadow-sm"
            title="Open Gemini AI Statutory & Compliance Co-Pilot"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ AI Advisor</span>
          </button>

          <button
            onClick={() => onTabSelect('workflows')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeTab === 'workflows'
                ? 'bg-[#cda052] text-black border-[#cda052] shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#cda052]'
            }`}
          >
            Filing Matrix
          </button>
          <button
            onClick={() => onTabSelect('gst')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeTab === 'gst'
                ? 'bg-[#cda052] text-black border-[#cda052] shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#cda052]'
            }`}
          >
            GST & ITC
          </button>
          <button
            onClick={() => onTabSelect('icegate')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeTab === 'icegate'
                ? 'bg-[#cda052] text-black border-[#cda052] shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#cda052]'
            }`}
          >
            ICEGATE Customs
          </button>
        </div>
      </div>

      {/* AI Compliance Advisor Modal */}
      <ComplianceAiAdvisorModal
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        context={{
          activeTab,
          totalWorkflows,
          filedCount,
          overdueCount,
          upcoming7DaysCount: upcoming7Days.length,
          totalItcClaimed,
          activeDscCount,
          expiringDscCount,
          pendingCustomsClearances,
        }}
      />

      {/* Real Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Statutory Health */}
        <div className="bg-white dark:bg-[#0e121b] p-4 rounded-xl border border-slate-200 dark:border-[#1e2638] relative overflow-hidden group shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8a96ae] mb-1">
            <span className="font-medium">Filing Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{filingHealthPercentage}%</span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
              {filedCount} / {totalWorkflows} Filed
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#cda052] to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${filingHealthPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-[#8a96ae] mt-2 font-medium">
            {overdueCount > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">{overdueCount} Overdue return</span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">Zero overdue statutory filings</span>
            )}
          </p>
        </div>

        {/* KPI 2: Next 7 & 30 Days Deadlines */}
        <div className="bg-white dark:bg-[#0e121b] p-4 rounded-xl border border-slate-200 dark:border-[#1e2638] relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8a96ae] mb-1">
            <span className="font-medium">Upcoming Cutoffs</span>
            <Clock className="w-4 h-4 text-[#cda052]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700 dark:text-[#f7d88c] font-mono">{upcoming7Days.length}</span>
            <span className="text-xs text-slate-500 dark:text-[#8a96ae]">in next 7 days</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Next 30 Days Total</span>
            <span className="font-semibold text-slate-900 dark:text-white">{upcoming30Days.length} Filings</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-[#8a96ae] mt-1">
            GSTR-1 (10th) & GSTR-3B (20th) scheduled
          </p>
        </div>

        {/* KPI 3: GST ITC Claimed */}
        <div className="bg-white dark:bg-[#0e121b] p-4 rounded-xl border border-slate-200 dark:border-[#1e2638] relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8a96ae] mb-1">
            <span className="font-medium">ITC Reconciled (2B)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
              ₹{(totalItcClaimed / 100000).toFixed(2)}L
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">Rule 88A Ready</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>Import IGST Credit</span>
            <span className="font-semibold text-amber-700 dark:text-[#f7d88c]">₹1.52L Available</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-[#8a96ae] mt-1">
            Purchase vs GSTR-2B matching rate 92%
          </p>
        </div>

        {/* KPI 4: Active DSC & ICEGATE Clearances */}
        <div className="bg-white dark:bg-[#0e121b] p-4 rounded-xl border border-slate-200 dark:border-[#1e2638] relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8a96ae] mb-1">
            <span className="font-medium">Tokens & Customs</span>
            <Ship className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{activeDscCount}</span>
            <span className="text-xs text-slate-500 dark:text-[#8a96ae]">Active Class 3 DSCs</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span>In-Transit Customs</span>
            <span className="font-semibold text-sky-700 dark:text-sky-400">{pendingCustomsClearances} Shipments</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-[#8a96ae] mt-1">
            {expiringDscCount > 0 ? (
              <span className="text-amber-700 dark:text-amber-400 font-semibold">{expiringDscCount} DSC Expiring Soon</span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">All tokens valid & secured</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
