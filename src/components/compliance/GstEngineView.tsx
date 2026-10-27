'use client';

import React, { useState, useMemo } from 'react';
import {
  BadgePercent,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Settings as SettingsIcon,
  BellRing,
  Download,
  FileSpreadsheet,
  Check,
  Building,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  GstSettings,
  GstTaxCalculation,
  GstReconciliationInvoice,
  ComplianceWorkflowItem,
} from '@/lib/types';
import {
  calculateStatutoryGst,
  saveLocalGstSettings,
  saveLocalReconInvoices,
} from '@/lib/complianceStorage';
import { addDurableNotification } from '@/lib/notificationStorage';

interface GstEngineViewProps {
  settings: GstSettings;
  onUpdateSettings: (updated: GstSettings) => void;
  reconInvoices: GstReconciliationInvoice[];
  onUpdateReconInvoices: (updated: GstReconciliationInvoice[]) => void;
  workflows: ComplianceWorkflowItem[];
  onUpdateWorkflows: (updated: ComplianceWorkflowItem[]) => void;
}

export default function GstEngineView({
  settings,
  onUpdateSettings,
  reconInvoices,
  onUpdateReconInvoices,
  workflows,
  onUpdateWorkflows,
}: GstEngineViewProps) {
  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly'>(settings.filingFrequency);
  const [gstr1Day, setGstr1Day] = useState(settings.gstr1DueDay);
  const [gstr3bDay, setGstr3bDay] = useState(settings.gstr3bDueDay);

  // Statutory Tax Calculator State
  const [taxPeriod, setTaxPeriod] = useState('October 2026');
  const [outputIgst, setOutputIgst] = useState(420000); // Inter-state wholesale garment orders
  const [outputCgst, setOutputCgst] = useState(180000); // Domestic showroom & e-com sales
  const [outputSgst, setOutputSgst] = useState(180000); // Domestic showroom & e-com sales

  const [inputIgst, setInputIgst] = useState(380000); // Imported yarns & interstate trims
  const [inputCgst, setInputCgst] = useState(140000); // Local spinning & dye houses
  const [inputSgst, setInputSgst] = useState(140000); // Local spinning & dye houses
  const [ineligibleItc, setIneligibleItc] = useState(9000); // Section 17(5) blocked credit (cabs/hospitality)

  // Calculate live Rule 88A settlement
  const taxCalculation: GstTaxCalculation = useMemo(() => {
    return calculateStatutoryGst(
      taxPeriod,
      outputIgst,
      outputCgst,
      outputSgst,
      inputIgst,
      inputCgst,
      inputSgst,
      ineligibleItc
    );
  }, [taxPeriod, outputIgst, outputCgst, outputSgst, inputIgst, inputCgst, inputSgst, ineligibleItc]);

  // Reconciliation Filter
  const [reconFilter, setReconFilter] = useState<'all' | 'matched' | 'missing_in_2b' | 'ineligible_17_5'>('all');

  const filteredInvoices = reconInvoices.filter((inv) => {
    if (reconFilter === 'all') return true;
    if (reconFilter === 'matched') return inv.matchStatus === 'matched';
    if (reconFilter === 'missing_in_2b') return inv.matchStatus === 'missing_in_2b';
    if (reconFilter === 'ineligible_17_5') return inv.itcEligibility === 'ineligible_17_5';
    return true;
  });

  const totalReconValue = reconInvoices.reduce((a, c) => a + c.taxAmount, 0);
  const matchedValue = reconInvoices
    .filter((c) => c.matchStatus === 'matched' && c.itcEligibility === 'eligible')
    .reduce((a, c) => a + c.taxAmount, 0);
  const pendingValue = reconInvoices
    .filter((c) => c.matchStatus === 'missing_in_2b')
    .reduce((a, c) => a + c.taxAmount, 0);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: GstSettings = {
      ...settings,
      filingFrequency: frequency,
      gstr1DueDay: Number(gstr1Day),
      gstr3bDueDay: Number(gstr3bDay),
    };
    onUpdateSettings(updated);
    saveLocalGstSettings(updated);
    setIsSettingsOpen(false);
  };

  const handleExportReconciliation = () => {
    const rows = reconInvoices.map((inv) => ({
      'Vendor Name': inv.vendorName,
      'Vendor GSTIN': inv.vendorGstin,
      'Invoice No': inv.invoiceNumber,
      'Invoice Date': inv.invoiceDate,
      'Taxable Value (INR)': inv.taxableValue,
      'GST Tax Amount (INR)': inv.taxAmount,
      'Found in Books': inv.inBooks ? 'Yes' : 'No',
      'Found in GSTR-2B': inv.inGstr2b ? 'Yes' : 'No',
      'Reconciliation Status': inv.matchStatus.toUpperCase(),
      'ITC Eligibility': inv.itcEligibility.toUpperCase(),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GSTR-2B ITC Reconciliation');
    XLSX.writeFile(wb, `Rivlet_GST_ITC_Reconciliation_${taxPeriod.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleTriggerReminder = async (type: 'GSTR-1' | 'GSTR-3B', dueDay: number) => {
    try {
      await addDurableNotification({
        title: `GST Statutory Due Date Alert: ${type}`,
        message: `${type} for ${taxPeriod} is due within the ${dueDay}th of this month. Please finalize registers and file.`,
        link: '/compliance?tab=gst',
        type: 'reminder',
        priority: 'urgent',
        module: 'compliance',
      });
      alert(`Statutory notification dispatched for ${type} (Due on the ${dueDay}th)!`);
    } catch (err) {
      console.error('Error triggering notification:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Statutory Due Date Cards (GSTR-1 on the 10th & GSTR-3B on the 20th) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GSTR-1 Return Card */}
        <div className="bg-white dark:bg-[#090c14] p-5 rounded-2xl border border-[#e8ded3] dark:border-[#1a2233] shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[rgba(205,160,82,0.15)] text-[#8c5d19] dark:text-[#f7d88c] border border-[rgba(205,160,82,0.3)]">
                  Outward Supplies
                </span>
                <span className="text-[11px] text-[#6b584a] dark:text-[#a99a8b] uppercase font-semibold">
                  {settings.filingFrequency} Cadence
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#241812] dark:text-white mt-1.5 flex items-center gap-2">
                GSTR-1 Filing
              </h3>
              <p className="text-xs text-[#6b584a] dark:text-[#a99a8b] mt-0.5">
                Statutory Due Date: <span className="text-[#8c5d19] dark:text-[#f7d88c] font-semibold font-mono">{settings.gstr1DueDay}th of Every Month</span>
              </p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-lg text-[#6b584a] dark:text-[#a99a8b] hover:text-[#cda052] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Configure GST Schedule & Reminders"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e8ded3] dark:border-white/5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#6b584a] dark:text-[#8895ad] block text-[11px]">Gross Outward Turnover</span>
              <span className="text-base font-bold text-[#241812] dark:text-white font-mono">₹43.33L</span>
            </div>
            <div>
              <span className="text-[#6b584a] dark:text-[#8895ad] block text-[11px]">Output Tax Declared</span>
              <span className="text-base font-bold text-[#8c5d19] dark:text-[#f7d88c] font-mono">
                ₹{((outputIgst + outputCgst + outputSgst) / 1000).toFixed(1)}k
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => handleTriggerReminder('GSTR-1', settings.gstr1DueDay)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-black/40 dark:hover:bg-white/10 text-xs font-semibold text-[#241812] dark:text-[#cbd5e1] border border-[#d8c8b8] dark:border-white/10 transition-colors"
            >
              <BellRing className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Send Reminder</span>
            </button>
            <a
              href="https://services.gst.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black text-xs font-semibold transition-colors"
            >
              <span>Upload to GSTN</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* GSTR-3B Return Card */}
        <div className="bg-white dark:bg-[#090c14] p-5 rounded-2xl border border-[#e8ded3] dark:border-[#1a2233] shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Tax Settlement & ITC
                </span>
                <span className="text-[11px] text-[#6b584a] dark:text-[#a99a8b] uppercase font-semibold">
                  Rule 88A Compliant
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#241812] dark:text-white mt-1.5 flex items-center gap-2">
                GSTR-3B Summary Return
              </h3>
              <p className="text-xs text-[#6b584a] dark:text-[#a99a8b] mt-0.5">
                Statutory Due Date: <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono">{settings.gstr3bDueDay}th of Every Month</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <Check className="w-3 h-3" />
              ITC Offset Ready
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-[#e8ded3] dark:border-white/5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#6b584a] dark:text-[#8895ad] block text-[11px]">Eligible ITC Credit</span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                ₹{(taxCalculation.eligibleItc / 1000).toFixed(1)}k
              </span>
            </div>
            <div>
              <span className="text-[#6b584a] dark:text-[#8895ad] block text-[11px]">Net Cash Payable (PMT-06)</span>
              <span className="text-base font-bold text-[#241812] dark:text-white font-mono">
                ₹{(taxCalculation.netTotalPayable / 1000).toFixed(1)}k
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => handleTriggerReminder('GSTR-3B', settings.gstr3bDueDay)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-black/40 dark:hover:bg-white/10 text-xs font-semibold text-[#241812] dark:text-[#cbd5e1] border border-[#d8c8b8] dark:border-white/10 transition-colors"
            >
              <BellRing className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Send Reminder</span>
            </button>
            <a
              href="https://services.gst.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-black text-xs font-semibold transition-colors"
            >
              <span>Pay & File Return</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Statutory Rule 88A Tax Calculation & Set-off Simulator */}
      <div className="bg-white dark:bg-[#0c101a] p-5 rounded-2xl border border-[#e8ded3] dark:border-[#1a2233] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#e8ded3] dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-[#241812] dark:text-white flex items-center gap-2">
              <BadgePercent className="w-4 h-4 text-[#cda052]" />
              <span>Statutory Rule 88A GST Calculation & Set-off Simulator</span>
            </h3>
            <p className="text-xs text-[#6b584a] dark:text-[#a99a8b]">
              Calculates net cash tax payable after sequential Input Tax Credit (ITC) utilization
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b584a] dark:text-[#a99a8b]">Tax Period:</span>
            <input
              type="text"
              value={taxPeriod}
              onChange={(e) => setTaxPeriod(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-black/40 text-xs text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 font-medium focus:border-[#cda052] outline-none"
            />
          </div>
        </div>

        {/* Two-Column Inputs: Outward Tax vs Inward ITC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Outward Liability */}
          <div className="space-y-3 bg-[#fcfaf7] dark:bg-black/30 p-4 rounded-xl border border-[#e8ded3] dark:border-white/5">
            <h4 className="text-xs font-bold text-[#8c5d19] dark:text-[#f7d88c] uppercase tracking-wider">
              1. Outward Tax Liability (Sales)
            </h4>
            <div>
              <label className="flex justify-between text-xs text-[#4a3b32] dark:text-[#cbd5e1] mb-1">
                <span>Output IGST (Inter-state garment sales):</span>
                <span className="font-mono text-[#241812] dark:text-white font-semibold">₹{outputIgst.toLocaleString('en-IN')}</span>
              </label>
              <input
                type="number"
                value={outputIgst}
                onChange={(e) => setOutputIgst(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-black/50 text-xs text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#4a3b32] dark:text-[#cbd5e1] mb-1">Output CGST (Local sales):</label>
                <input
                  type="number"
                  value={outputCgst}
                  onChange={(e) => setOutputCgst(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-black/50 text-xs text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#4a3b32] dark:text-[#cbd5e1] mb-1">Output SGST (Local sales):</label>
                <input
                  type="number"
                  value={outputSgst}
                  onChange={(e) => setOutputSgst(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-black/50 text-xs text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[#e8ded3] dark:border-white/5 flex justify-between text-xs font-semibold">
              <span className="text-[#6b584a] dark:text-[#a99a8b]">Total Outward Tax:</span>
              <span className="text-[#241812] dark:text-white font-mono font-bold">
                ₹{(outputIgst + outputCgst + outputSgst).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Inward ITC Available */}
          <div className="space-y-3 bg-[#fcfaf7] dark:bg-black/30 p-4 rounded-xl border border-[#e8ded3] dark:border-white/5">
            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              2. Inward Input Tax Credit (ITC from 2B)
            </h4>
            <div>
              <label className="flex justify-between text-xs text-[#4a3b32] dark:text-[#cbd5e1] mb-1">
                <span>Input IGST (Fabric imports & interstate trims):</span>
                <span className="font-mono text-[#241812] dark:text-white font-semibold">₹{inputIgst.toLocaleString('en-IN')}</span>
              </label>
              <input
                type="number"
                value={inputIgst}
                onChange={(e) => setInputIgst(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-black/50 text-xs text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#4a3b32] dark:text-[#cbd5e1] mb-1">Input CGST (Local mills):</label>
                <input
                  type="number"
                  value={inputCgst}
                  onChange={(e) => setInputCgst(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-black/50 text-xs text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#4a3b32] dark:text-[#cbd5e1] mb-1">Input SGST (Local mills):</label>
                <input
                  type="number"
                  value={inputSgst}
                  onChange={(e) => setInputSgst(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-black/50 text-xs text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-rose-600 dark:text-rose-400 mb-1 font-medium">Ineligible ITC u/s 17(5) (Reversal):</label>
              <input
                type="number"
                value={ineligibleItc}
                onChange={(e) => setIneligibleItc(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-black/50 text-xs text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-mono"
              />
            </div>

            <div className="pt-2 border-t border-[#e8ded3] dark:border-white/5 flex justify-between text-xs font-semibold">
              <span className="text-[#6b584a] dark:text-[#a99a8b]">Net Eligible ITC:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                ₹{taxCalculation.eligibleItc.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Rule 88A Settlement Results Table */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-gradient-to-r dark:from-black/60 dark:to-black/30 border border-[#e8ded3] dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-[#241812] dark:text-white uppercase tracking-wider">
              Settlement Breakdown (Cash Payable via PMT-06 Challan)
            </span>
            <span className="text-xs text-[#6b584a] dark:text-[#a99a8b]">
              Rule 88A Order: IGST credit used first against IGST, then CGST & SGST
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white dark:bg-black/40 border border-[#e8ded3] dark:border-white/5 shadow-sm">
              <span className="text-[#6b584a] dark:text-[#8895ad] block text-[11px]">Net Cash IGST</span>
              <span className="text-base font-bold text-[#241812] dark:text-white font-mono">
                ₹{taxCalculation.netPayableIgst.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-black/40 border border-[#e8ded3] dark:border-white/5 shadow-sm">
              <span className="text-[#6b584a] dark:text-[#8895ad] block text-[11px]">Net Cash CGST</span>
              <span className="text-base font-bold text-[#241812] dark:text-white font-mono">
                ₹{taxCalculation.netPayableCgst.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-white dark:bg-black/40 border border-[#e8ded3] dark:border-white/5 shadow-sm">
              <span className="text-[#6b584a] dark:text-[#8895ad] block text-[11px]">Net Cash SGST</span>
              <span className="text-base font-bold text-[#241812] dark:text-white font-mono">
                ₹{taxCalculation.netPayableSgst.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-semibold">Total Net Cash Tax</span>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                ₹{taxCalculation.netTotalPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GSTR-2B vs Books Purchase Reconciliation Engine */}
      <div className="bg-white dark:bg-[#090c14] rounded-2xl border border-[#e8ded3] dark:border-[#1a2233] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e8ded3] dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-[#241812] dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#cda052]" />
              <span>GSTR-2B vs. Purchase Register Reconciliation (ITC Tracker)</span>
            </h3>
            <p className="text-xs text-[#6b584a] dark:text-[#a99a8b]">
              Tracks vendor invoice compliance, identifies missing credits, and protects against ineligible claims
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReconciliation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-black/40 dark:hover:bg-white/10 text-xs font-semibold text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Reconciliation Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
          <div className="p-3 rounded-xl bg-[#fcfaf7] dark:bg-black/30 border border-[#e8ded3] dark:border-white/5">
            <span className="text-[#6b584a] dark:text-[#8895ad] block text-[11px]">Total Supplier Invoices</span>
            <span className="text-base font-bold text-[#241812] dark:text-white font-mono">
              ₹{(totalReconValue / 1000).toFixed(1)}k Tax Amount
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-medium">Matched & 100% Eligible</span>
            <span className="text-base font-bold text-emerald-800 dark:text-emerald-300 font-mono">
              ₹{(matchedValue / 1000).toFixed(1)}k Ready to Claim
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-700 dark:text-amber-400 block text-[11px] font-medium">Pending Vendor 2B Upload</span>
            <span className="text-base font-bold text-amber-800 dark:text-amber-300 font-mono">
              ₹{(pendingValue / 1000).toFixed(1)}k Follow-up Needed
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setReconFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              reconFilter === 'all'
                ? 'bg-[#cda052] text-black font-semibold'
                : 'bg-slate-100 dark:bg-black/40 text-[#6b584a] dark:text-[#a99a8b] hover:text-[#241812] dark:hover:text-white'
            }`}
          >
            All Invoices ({reconInvoices.length})
          </button>
          <button
            onClick={() => setReconFilter('matched')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              reconFilter === 'matched'
                ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black font-semibold'
                : 'bg-slate-100 dark:bg-black/40 text-[#6b584a] dark:text-[#a99a8b] hover:text-[#241812] dark:hover:text-white'
            }`}
          >
            Matched ({reconInvoices.filter((i) => i.matchStatus === 'matched').length})
          </button>
          <button
            onClick={() => setReconFilter('missing_in_2b')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              reconFilter === 'missing_in_2b'
                ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-black font-semibold'
                : 'bg-slate-100 dark:bg-black/40 text-[#6b584a] dark:text-[#a99a8b] hover:text-[#241812] dark:hover:text-white'
            }`}
          >
            Missing in 2B ({reconInvoices.filter((i) => i.matchStatus === 'missing_in_2b').length})
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#e8ded3] dark:border-white/5">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#f7f3ee] dark:bg-black/40 text-[#6b584a] dark:text-[#8895ad] uppercase text-[10px] border-b border-[#e8ded3] dark:border-white/5">
                <th className="py-2.5 px-3 font-semibold">Vendor & GSTIN</th>
                <th className="py-2.5 px-3 font-semibold">Invoice No & Date</th>
                <th className="py-2.5 px-3 font-semibold">Taxable Amount</th>
                <th className="py-2.5 px-3 font-semibold">GST Amount</th>
                <th className="py-2.5 px-3 font-semibold">2B Match</th>
                <th className="py-2.5 px-3 font-semibold">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e8df] dark:divide-white/5">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#fcfaf7] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-[#241812] dark:text-white">{inv.vendorName}</div>
                    <div className="text-[10px] text-[#6b584a] dark:text-[#8895ad] font-mono">{inv.vendorGstin}</div>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-mono text-[#241812] dark:text-white">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-[#6b584a] dark:text-[#8895ad]">{inv.invoiceDate}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#241812] dark:text-white whitespace-nowrap font-semibold">
                    ₹{inv.taxableValue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#8c5d19] dark:text-[#f7d88c] whitespace-nowrap">
                    ₹{inv.taxAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {inv.matchStatus === 'matched' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                        <Check className="w-3 h-3" />
                        Matched
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        <Clock className="w-3 h-3" />
                        Missing in 2B
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {inv.itcEligibility === 'eligible' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Eligible ITC
                      </span>
                    )}
                    {inv.itcEligibility === 'pending' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        Follow-up Pending
                      </span>
                    )}
                    {inv.itcEligibility === 'ineligible_17_5' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                        Blocked u/s 17(5)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0c101a] w-full max-w-md rounded-2xl border border-[#e8ded3] dark:border-[#1a2233] p-5 shadow-2xl">
            <h3 className="text-base font-bold text-[#241812] dark:text-white mb-2 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-[#cda052]" />
              <span>GST Compliance & Cadence Settings</span>
            </h3>
            <p className="text-xs text-[#6b584a] dark:text-[#a99a8b] mb-4">
              Configure statutory return schedules and automated reminder rules
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#4a3b32] dark:text-[#a99a8b] mb-1 font-medium">Filing Cadence Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequency('monthly')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      frequency === 'monthly'
                        ? 'bg-[#cda052] text-black border-[#cda052]'
                        : 'bg-slate-100 dark:bg-black/40 text-[#6b584a] dark:text-[#a99a8b] border-[#d8c8b8] dark:border-white/10'
                    }`}
                  >
                    Monthly (Active)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFrequency('quarterly')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      frequency === 'quarterly'
                        ? 'bg-[#cda052] text-black border-[#cda052]'
                        : 'bg-slate-100 dark:bg-black/40 text-[#6b584a] dark:text-[#a99a8b] border-[#d8c8b8] dark:border-white/10'
                    }`}
                  >
                    Quarterly (QRMP)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#4a3b32] dark:text-[#a99a8b] mb-1 font-medium">GSTR-1 Due Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={gstr1Day}
                    onChange={(e) => setGstr1Day(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 text-[#241812] dark:text-white font-mono border border-[#d8c8b8] dark:border-white/10 outline-none"
                  />
                  <span className="text-[10px] text-[#6b584a] dark:text-[#8895ad] mt-0.5 block">Default: 10th (Buffer)</span>
                </div>
                <div>
                  <label className="block text-[#4a3b32] dark:text-[#a99a8b] mb-1 font-medium">GSTR-3B Due Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={gstr3bDay}
                    onChange={(e) => setGstr3bDay(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 text-[#241812] dark:text-white font-mono border border-[#d8c8b8] dark:border-white/10 outline-none"
                  />
                  <span className="text-[10px] text-[#6b584a] dark:text-[#8895ad] mt-0.5 block">Default: 20th</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e8ded3] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-black/40 text-[#6b584a] dark:text-[#a99a8b] hover:text-[#241812] dark:hover:text-white border border-[#d8c8b8] dark:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
