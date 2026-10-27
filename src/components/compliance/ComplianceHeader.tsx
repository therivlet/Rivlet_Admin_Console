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
  Pencil,
  Building2,
  X,
  Save,
} from 'lucide-react';
import { ComplianceWorkflowItem, DscRegistryItem, CustomsDeclaration, GstSettings } from '@/lib/types';
import ComplianceAiAdvisorModal from './ComplianceAiAdvisorModal';

interface ComplianceHeaderProps {
  workflows: ComplianceWorkflowItem[];
  dscItems: DscRegistryItem[];
  customsDeclarations: CustomsDeclaration[];
  activeTab: string;
  onTabSelect: (tab: string) => void;
  settings?: GstSettings;
  onUpdateSettings?: (settings: GstSettings) => void;
}

export default function ComplianceHeader({
  workflows,
  dscItems,
  customsDeclarations,
  activeTab,
  onTabSelect,
  settings,
  onUpdateSettings,
}: ComplianceHeaderProps) {
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Profile modal state
  const [editLegalName, setEditLegalName] = useState(settings?.legalName || '');
  const [editTradeName, setEditTradeName] = useState(settings?.tradeName || '');
  const [editGstin, setEditGstin] = useState(settings?.gstin || '');
  const [editPan, setEditPan] = useState(settings?.pan || '');
  const [editIec, setEditIec] = useState(settings?.iec || '');
  const [editStateCode, setEditStateCode] = useState(settings?.stateCode || '33');

  const openProfileModal = () => {
    setEditLegalName(settings?.legalName || '');
    setEditTradeName(settings?.tradeName || '');
    setEditGstin(settings?.gstin || '');
    setEditPan(settings?.pan || (settings?.gstin && settings.gstin.length >= 12 ? settings.gstin.slice(2, 12) : ''));
    setEditIec(settings?.iec || '');
    setEditStateCode(settings?.stateCode || '33');
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !onUpdateSettings) return;

    const gstinFormatted = editGstin.trim().toUpperCase();
    const panFormatted = editPan.trim().toUpperCase() || (gstinFormatted.length >= 12 ? gstinFormatted.slice(2, 12) : '');

    const updated: GstSettings = {
      ...settings,
      legalName: editLegalName.trim() || 'My Enterprise',
      tradeName: editTradeName.trim() || undefined,
      gstin: gstinFormatted,
      pan: panFormatted,
      iec: editIec.trim().toUpperCase() || undefined,
      stateCode: editStateCode.trim() || '33',
    };

    onUpdateSettings(updated);
    setIsProfileModalOpen(false);
  };

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

  const displayPan = settings?.pan || (settings?.gstin && settings.gstin.length >= 12 ? settings.gstin.slice(2, 12) : '');

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
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Statutory Compliance & Customs Hub
                </h1>
                <button
                  onClick={openProfileModal}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#cda052] border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                  title="Update entity name, PAN & GSTIN"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {settings?.legalName || 'My Enterprise'}
                </span>
                <span>•</span>
                <span>GSTIN: <span className="font-mono text-amber-600 dark:text-[#f7d88c] font-semibold">{settings?.gstin || 'Not set'}</span></span>
                <span>•</span>
                <span>PAN: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{displayPan || 'Not set'}</span></span>
                {settings?.iec && (
                  <>
                    <span>•</span>
                    <span>IEC: <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">{settings.iec}</span></span>
                  </>
                )}
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

      {/* Edit Enterprise & Tax Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1e2638] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#cda052]/10 text-[#cda052] border border-[#cda052]/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Enterprise & Tax Profile
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#8a96ae]">
                    Update your permanent PAN, GSTIN, and legal company credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  Legal Entity Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Apparel Enterprise Pvt Ltd"
                  value={editLegalName}
                  onChange={(e) => setEditLegalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  Trade / Brand Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rivlet Studios"
                  value={editTradeName}
                  onChange={(e) => setEditTradeName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                    GSTIN (15 Digits)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="33AAAAA0000A1Z5"
                    value={editGstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setEditGstin(val);
                      if (val.length >= 12 && !editPan) {
                        setEditPan(val.slice(2, 12));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono uppercase border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">Goods & Services Tax ID</span>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                    PAN (10 Digits) *
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="AAAAA0000A"
                    value={editPan}
                    onChange={(e) => setEditPan(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono uppercase border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">Income Tax Entity PAN</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                    IEC Code (Import Export Code)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0420088912"
                    value={editIec}
                    onChange={(e) => setEditIec(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                    State / Jurisdiction Code
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="33"
                    value={editStateCode}
                    onChange={(e) => setEditStateCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">e.g. 33 (TN), 27 (MH), 29 (KA)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c] transition-all shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save to Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
