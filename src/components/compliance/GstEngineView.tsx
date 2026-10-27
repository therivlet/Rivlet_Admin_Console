'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  CreditCard,
  FileText,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import VendorNoticeModal from './VendorNoticeModal';
import ComplianceAiAdvisorModal from './ComplianceAiAdvisorModal';
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
  getLocalGstTaxInputs,
  saveLocalGstTaxInputs,
  GstTaxInputs,
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

  // Statutory Tax Calculator State (loaded from storage)
  const [taxPeriod, setTaxPeriod] = useState('October 2026');
  const [outputIgst, setOutputIgst] = useState(420000);
  const [outputCgst, setOutputCgst] = useState(180000);
  const [outputSgst, setOutputSgst] = useState(180000);
  const [inputIgst, setInputIgst] = useState(380000);
  const [inputCgst, setInputCgst] = useState(140000);
  const [inputSgst, setInputSgst] = useState(140000);
  const [ineligibleItc, setIneligibleItc] = useState(9000);
  const [hasUnsavedTaxChanges, setHasUnsavedTaxChanges] = useState(false);
  const [taxSavedBanner, setTaxSavedBanner] = useState(false);

  // AI Modal States
  const [isAiAuditOpen, setIsAiAuditOpen] = useState(false);
  const [vendorNoticeInvoice, setVendorNoticeInvoice] = useState<any>(null);

  useEffect(() => {
    const saved = getLocalGstTaxInputs();
    setTaxPeriod(saved.taxPeriod);
    setOutputIgst(saved.outputIgst);
    setOutputCgst(saved.outputCgst);
    setOutputSgst(saved.outputSgst);
    setInputIgst(saved.inputIgst);
    setInputCgst(saved.inputCgst);
    setInputSgst(saved.inputSgst);
    setIneligibleItc(saved.ineligibleItc);
  }, []);

  const handleSaveTaxFigures = () => {
    const payload: GstTaxInputs = {
      taxPeriod,
      outputIgst,
      outputCgst,
      outputSgst,
      inputIgst,
      inputCgst,
      inputSgst,
      ineligibleItc,
    };
    saveLocalGstTaxInputs(payload);
    setHasUnsavedTaxChanges(false);
    setTaxSavedBanner(true);
    setTimeout(() => setTaxSavedBanner(false), 2500);
  };

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

  // Invoice Modal State (Add & Edit)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<GstReconciliationInvoice | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [taxableValue, setTaxableValue] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [inBooks, setInBooks] = useState(true);
  const [inGstr2b, setInGstr2b] = useState(true);
  const [matchStatus, setMatchStatus] = useState<GstReconciliationInvoice['matchStatus']>('matched');
  const [itcEligibility, setItcEligibility] = useState<GstReconciliationInvoice['itcEligibility']>('eligible');

  const handleOpenAddInvoice = () => {
    setEditingInvoice(null);
    setVendorName('');
    setVendorGstin('');
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setTaxableValue(0);
    setTaxAmount(0);
    setInBooks(true);
    setInGstr2b(true);
    setMatchStatus('matched');
    setItcEligibility('eligible');
    setIsInvoiceModalOpen(true);
  };

  const handleOpenEditInvoice = (inv: GstReconciliationInvoice) => {
    setEditingInvoice(inv);
    setVendorName(inv.vendorName);
    setVendorGstin(inv.vendorGstin);
    setInvoiceNumber(inv.invoiceNumber);
    setInvoiceDate(inv.invoiceDate);
    setTaxableValue(inv.taxableValue);
    setTaxAmount(inv.taxAmount);
    setInBooks(inv.inBooks);
    setInGstr2b(inv.inGstr2b);
    setMatchStatus(inv.matchStatus);
    setItcEligibility(inv.itcEligibility);
    setIsInvoiceModalOpen(true);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !invoiceNumber) return;

    if (editingInvoice) {
      const updated = reconInvoices.map((inv) =>
        inv.id === editingInvoice.id
          ? {
              ...inv,
              vendorName: vendorName.trim(),
              vendorGstin: vendorGstin.trim().toUpperCase(),
              invoiceNumber: invoiceNumber.trim(),
              invoiceDate,
              taxableValue: Number(taxableValue) || 0,
              taxAmount: Number(taxAmount) || 0,
              invoiceValue: (Number(taxableValue) || 0) + (Number(taxAmount) || 0),
              inBooks,
              inGstr2b,
              matchStatus,
              itcEligibility,
            }
          : inv
      );
      onUpdateReconInvoices(updated);
      saveLocalReconInvoices(updated);
    } else {
      const newInv: GstReconciliationInvoice = {
        id: `inv-recon-${Date.now()}`,
        vendorName: vendorName.trim(),
        vendorGstin: vendorGstin.trim().toUpperCase() || '33AABCR0000A1Z1',
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
        taxableValue: Number(taxableValue) || 0,
        taxAmount: Number(taxAmount) || 0,
        invoiceValue: (Number(taxableValue) || 0) + (Number(taxAmount) || 0),
        inBooks,
        inGstr2b,
        matchStatus,
        itcEligibility,
      };
      const updated = [newInv, ...reconInvoices];
      onUpdateReconInvoices(updated);
      saveLocalReconInvoices(updated);
    }

    setIsInvoiceModalOpen(false);
  };

  const handleDeleteInvoice = (id: string, invNo: string) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invNo}? This action cannot be undone.`)) {
      return;
    }
    const updated = reconInvoices.filter((i) => i.id !== id);
    onUpdateReconInvoices(updated);
    saveLocalReconInvoices(updated);
  };

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
        <div className="bg-white dark:bg-[#0e121b] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  Outward Supplies
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  {settings.filingFrequency} Cadence
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                GSTR-1 Filing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statutory Due Date: <span className="text-amber-700 dark:text-[#f7d88c] font-semibold font-mono">{settings.gstr1DueDay}th of Every Month</span>
              </p>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Configure GST Schedule & Reminders"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px]">Gross Outward Turnover</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">₹43.33L</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px]">Output Tax Declared</span>
              <span className="text-base font-bold text-amber-600 dark:text-[#f7d88c] font-mono">
                ₹{((outputIgst + outputCgst + outputSgst) / 1000).toFixed(1)}k
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => handleTriggerReminder('GSTR-1', settings.gstr1DueDay)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
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
        <div className="bg-white dark:bg-[#0e121b] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Tax Settlement & ITC
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Rule 88A Compliant
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                GSTR-3B Summary Return
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statutory Due Date: <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">{settings.gstr3bDueDay}th of Every Month</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <Check className="w-3 h-3" />
              ITC Offset Ready
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px]">Eligible ITC Credit</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{(taxCalculation.eligibleItc / 1000).toFixed(1)}k
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px]">Net Cash Payable (PMT-06)</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                ₹{(taxCalculation.netTotalPayable / 1000).toFixed(1)}k
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={() => handleTriggerReminder('GSTR-3B', settings.gstr3bDueDay)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <BellRing className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Send Reminder</span>
            </button>
            <a
              href="https://services.gst.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <span>Pay & File Return</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Statutory Rule 88A Tax Calculation & Set-off Simulator */}
      <div className="bg-white dark:bg-[#0e121b] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BadgePercent className="w-4 h-4 text-[#cda052]" />
              <span>Statutory Rule 88A GST Calculation & Set-off Simulator</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5">
              Edit outward liability & ITC figures. Automatically computes sequential Input Tax Credit (ITC) utilization.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-[#8a96ae]">Tax Period:</span>
              <input
                type="text"
                value={taxPeriod}
                onChange={(e) => {
                  setTaxPeriod(e.target.value);
                  setHasUnsavedTaxChanges(true);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#080b12] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] font-medium focus:border-[#cda052] outline-none"
              />
            </div>
            <button
              onClick={handleSaveTaxFigures}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                hasUnsavedTaxChanges
                  ? 'bg-[#cda052] text-black shadow-md hover:bg-[#dfb56c]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#cda052]'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{hasUnsavedTaxChanges ? 'Save Changes' : 'Saved'}</span>
            </button>
          </div>
        </div>

        {taxSavedBanner && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Statutory GST liability & ITC figures successfully saved to compliance profile!</span>
          </div>
        )}

        {/* Two-Column Inputs: Outward Tax vs Inward ITC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
          {/* Outward Liability */}
          <div className="space-y-3 bg-slate-50 dark:bg-[#080b12] p-4 rounded-xl border border-slate-200 dark:border-[#1e2638]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-700 dark:text-[#f7d88c] uppercase tracking-wider">
                1. Outward Tax Liability (Sales)
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Editable</span>
            </div>
            <div>
              <label className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1">
                <span>Output IGST (Inter-state garment sales):</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">₹{outputIgst.toLocaleString('en-IN')}</span>
              </label>
              <input
                type="number"
                value={outputIgst}
                onChange={(e) => {
                  setOutputIgst(Number(e.target.value) || 0);
                  setHasUnsavedTaxChanges(true);
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0e121b] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] font-mono focus:border-[#cda052] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-700 dark:text-slate-300 mb-1">Output CGST (Local sales):</label>
                <input
                  type="number"
                  value={outputCgst}
                  onChange={(e) => {
                    setOutputCgst(Number(e.target.value) || 0);
                    setHasUnsavedTaxChanges(true);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0e121b] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] font-mono focus:border-[#cda052] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-700 dark:text-slate-300 mb-1">Output SGST (Local sales):</label>
                <input
                  type="number"
                  value={outputSgst}
                  onChange={(e) => {
                    setOutputSgst(Number(e.target.value) || 0);
                    setHasUnsavedTaxChanges(true);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0e121b] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] font-mono focus:border-[#cda052] outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs font-semibold">
              <span className="text-slate-500 dark:text-[#8a96ae]">Total Outward Tax:</span>
              <span className="text-slate-900 dark:text-white font-mono font-bold">
                ₹{(outputIgst + outputCgst + outputSgst).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Inward ITC Available */}
          <div className="space-y-3 bg-slate-50 dark:bg-[#080b12] p-4 rounded-xl border border-slate-200 dark:border-[#1e2638]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                2. Inward Input Tax Credit (ITC from 2B)
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Editable</span>
            </div>
            <div>
              <label className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1">
                <span>Input IGST (Fabric imports & interstate trims):</span>
                <span className="font-mono text-slate-900 dark:text-white font-semibold">₹{inputIgst.toLocaleString('en-IN')}</span>
              </label>
              <input
                type="number"
                value={inputIgst}
                onChange={(e) => {
                  setInputIgst(Number(e.target.value) || 0);
                  setHasUnsavedTaxChanges(true);
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0e121b] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] font-mono focus:border-[#cda052] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-700 dark:text-slate-300 mb-1">Input CGST (Local mills):</label>
                <input
                  type="number"
                  value={inputCgst}
                  onChange={(e) => {
                    setInputCgst(Number(e.target.value) || 0);
                    setHasUnsavedTaxChanges(true);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0e121b] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] font-mono focus:border-[#cda052] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-700 dark:text-slate-300 mb-1">Input SGST (Local mills):</label>
                <input
                  type="number"
                  value={inputSgst}
                  onChange={(e) => {
                    setInputSgst(Number(e.target.value) || 0);
                    setHasUnsavedTaxChanges(true);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0e121b] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] font-mono focus:border-[#cda052] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-rose-600 dark:text-rose-400 mb-1 font-medium">Ineligible ITC u/s 17(5) (Reversal):</label>
              <input
                type="number"
                value={ineligibleItc}
                onChange={(e) => {
                  setIneligibleItc(Number(e.target.value) || 0);
                  setHasUnsavedTaxChanges(true);
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#0e121b] text-xs text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 font-mono focus:border-rose-500 outline-none"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs font-semibold">
              <span className="text-slate-500 dark:text-[#8a96ae]">Net Eligible ITC:</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">
                ₹{taxCalculation.eligibleItc.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------
            REDESIGNED PMT-06 SETTLEMENT BREAKDOWN (Clean, Sleek Slate Cards)
            ------------------------------------------------------------- */}
        <div className="mt-5 p-5 rounded-2xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                  Settlement Breakdown (Cash Payable via PMT-06 Challan)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#8a96ae]">
                  Statutory Rule 88A Sequence: IGST credit offset first against IGST liability, then CGST & SGST
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
              Challan PMT-06 Generator
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-[#1e2638] shadow-sm">
              <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px] font-medium">Net Cash IGST</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₹{taxCalculation.netPayableIgst.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Inter-state balance</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-[#1e2638] shadow-sm">
              <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px] font-medium">Net Cash CGST</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₹{taxCalculation.netPayableCgst.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Central tax challan</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-[#1e2638] shadow-sm">
              <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px] font-medium">Net Cash SGST</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
                ₹{taxCalculation.netPayableSgst.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">State tax challan</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-bold uppercase tracking-wider">
                Total PMT-06 Challan
              </span>
              <span className="text-xl font-bold text-emerald-900 dark:text-emerald-300 font-mono mt-0.5 block">
                ₹{taxCalculation.netTotalPayable.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
                Net liability payable
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GSTR-2B vs Books Purchase Reconciliation Engine */}
      <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#cda052]" />
              <span>GSTR-2B vs. Purchase Register Reconciliation (ITC Tracker)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5">
              Tracks vendor invoice compliance, identifies missing credits, and allows adding, editing, or removing invoices
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiAuditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#cda052]/10 hover:bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/30 text-xs font-bold transition-colors shadow-sm"
              title="Run AI GSTR-2B Mismatch & Tax Liability Audit"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 2B Audit</span>
            </button>
            <button
              onClick={handleOpenAddInvoice}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Invoice</span>
            </button>
            <button
              onClick={handleExportReconciliation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Reconciliation Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
            <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px]">Total Supplier Invoices</span>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono mt-0.5 block">
              ₹{(totalReconValue / 1000).toFixed(1)}k Tax Amount ({reconInvoices.length} Invoices)
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
            <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-medium">Matched & 100% Eligible</span>
            <span className="text-base font-bold text-emerald-800 dark:text-emerald-300 font-mono mt-0.5 block">
              ₹{(matchedValue / 1000).toFixed(1)}k Ready to Claim
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
            <span className="text-amber-700 dark:text-amber-400 block text-[11px] font-medium">Pending Vendor 2B Upload</span>
            <span className="text-base font-bold text-amber-800 dark:text-amber-300 font-mono mt-0.5 block">
              ₹{(pendingValue / 1000).toFixed(1)}k Follow-up Needed
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          <button
            onClick={() => setReconFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              reconFilter === 'all'
                ? 'bg-[#cda052] text-black font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Invoices ({reconInvoices.length})
          </button>
          <button
            onClick={() => setReconFilter('matched')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              reconFilter === 'matched'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Matched ({reconInvoices.filter((i) => i.matchStatus === 'matched').length})
          </button>
          <button
            onClick={() => setReconFilter('missing_in_2b')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              reconFilter === 'missing_in_2b'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Missing in 2B ({reconInvoices.filter((i) => i.matchStatus === 'missing_in_2b').length})
          </button>
          <button
            onClick={() => setReconFilter('ineligible_17_5')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              reconFilter === 'ineligible_17_5'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ineligible u/s 17(5) ({reconInvoices.filter((i) => i.itcEligibility === 'ineligible_17_5').length})
          </button>
        </div>

        {/* Table with Edit & Delete Options */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1e2638]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#080b12] text-slate-600 dark:text-[#8a96ae] uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 font-semibold">Vendor & GSTIN</th>
                <th className="py-2.5 px-3 font-semibold">Invoice No & Date</th>
                <th className="py-2.5 px-3 font-semibold">Taxable Amount</th>
                <th className="py-2.5 px-3 font-semibold">GST Amount</th>
                <th className="py-2.5 px-3 font-semibold">2B Match</th>
                <th className="py-2.5 px-3 font-semibold">Eligibility</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No reconciliation invoices found for this filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{inv.vendorName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-[#8a96ae] font-mono">{inv.vendorGstin}</div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono text-slate-900 dark:text-white font-medium">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-500 dark:text-[#8a96ae]">{inv.invoiceDate}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white whitespace-nowrap font-semibold">
                      ₹{inv.taxableValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-amber-600 dark:text-[#f7d88c] whitespace-nowrap">
                      ₹{inv.taxAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {inv.matchStatus === 'matched' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <Check className="w-3 h-3" />
                          Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
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
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setVendorNoticeInvoice({
                            id: inv.id,
                            supplierName: inv.vendorName,
                            gstin: inv.vendorGstin,
                            invoiceNumber: inv.invoiceNumber,
                            invoiceDate: inv.invoiceDate,
                            taxableValue: inv.taxableValue,
                            igst: inv.taxAmount,
                            cgst: 0,
                            sgst: 0,
                            matchStatus: inv.matchStatus as any,
                            itcEligibility: inv.itcEligibility as any,
                          })}
                          className="p-1.5 rounded-lg bg-[#cda052]/10 hover:bg-[#cda052]/20 text-[#cda052] transition-colors"
                          title="Draft AI Vendor Notice (Section 16(2)(aa))"
                          aria-label={`Draft AI Vendor Notice for ${inv.invoiceNumber}`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditInvoice(inv)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                          title="Edit Invoice"
                          aria-label={`Edit invoice ${inv.invoiceNumber}`}
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#cda052]" />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete Invoice"
                          aria-label={`Delete invoice ${inv.invoiceNumber}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Edit/Add Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#cda052]" />
                <span>{editingInvoice ? 'Edit Reconciliation Invoice' : 'Add Reconciliation Invoice'}</span>
              </h3>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coimbatore Heritage Spinners"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Vendor GSTIN</label>
                  <input
                    type="text"
                    placeholder="33AAACH1094J1Z2"
                    value={vendorGstin}
                    onChange={(e) => setVendorGstin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Invoice Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="CHS-26-8819"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Taxable Value (₹)</label>
                  <input
                    type="number"
                    value={taxableValue}
                    onChange={(e) => setTaxableValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">GST Tax Amount (₹)</label>
                  <input
                    type="number"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Reconciliation Match</label>
                  <select
                    value={matchStatus}
                    onChange={(e) => setMatchStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  >
                    <option value="matched">Matched in 2B</option>
                    <option value="missing_in_2b">Missing in 2B</option>
                    <option value="missing_in_books">Missing in Books</option>
                    <option value="value_mismatch">Value Mismatch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">ITC Eligibility</label>
                  <select
                    value={itcEligibility}
                    onChange={(e) => setItcEligibility(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  >
                    <option value="eligible">Eligible ITC</option>
                    <option value="ineligible_17_5">Blocked u/s 17(5)</option>
                    <option value="pending">Pending Follow-up</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={inBooks}
                    onChange={(e) => setInBooks(e.target.checked)}
                    className="rounded border-slate-300 text-[#cda052] focus:ring-[#cda052]"
                  />
                  <span>Recorded in ERP Books</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={inGstr2b}
                    onChange={(e) => setInGstr2b(e.target.checked)}
                    className="rounded border-slate-300 text-[#cda052] focus:ring-[#cda052]"
                  />
                  <span>Reported in GSTR-2B</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                >
                  {editingInvoice ? 'Update Invoice' : 'Add Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-[#cda052]" />
              <span>GST Compliance & Cadence Settings</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mb-4">
              Configure statutory return schedules and automated reminder rules
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Filing Cadence Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFrequency('monthly')}
                    className={`py-2 px-3 rounded-xl border text-center font-semibold transition-all ${
                      frequency === 'monthly'
                        ? 'bg-[#cda052] text-black border-[#cda052]'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
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
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Quarterly (QRMP)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">GSTR-1 Due Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={gstr1Day}
                    onChange={(e) => setGstr1Day(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">Default: 10th (Buffer)</span>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">GSTR-3B Due Day</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={gstr3bDay}
                    onChange={(e) => setGstr3bDay(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">Default: 20th</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
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

      {/* AI Vendor Notice Modal */}
      <VendorNoticeModal
        invoice={vendorNoticeInvoice}
        onClose={() => setVendorNoticeInvoice(null)}
      />

      {/* AI Compliance Advisor Modal */}
      <ComplianceAiAdvisorModal
        isOpen={isAiAuditOpen}
        onClose={() => setIsAiAuditOpen(false)}
        context={{
          activeTab: 'gst',
          outwardTax: { igst: outputIgst, cgst: outputCgst, sgst: outputSgst },
          inputTaxCredit: { igst: inputIgst, cgst: inputCgst, sgst: inputSgst },
          netCashPayable: taxCalculation.netTotalPayable,
          invoicesSummary: {
            total: reconInvoices.length,
            matched: reconInvoices.filter(i => i.matchStatus === 'matched').length,
            mismatched: reconInvoices.filter(i => i.matchStatus === 'value_mismatch').length,
            pending: reconInvoices.filter(i => i.matchStatus === 'missing_in_2b').length,
          },
          mismatchedVendors: reconInvoices.filter(i => i.matchStatus !== 'matched').map(i => ({
            vendor: i.vendorName,
            gstin: i.vendorGstin,
            inv: i.invoiceNumber,
            taxAmount: i.taxAmount,
            status: i.matchStatus,
          })),
        }}
      />
    </div>
  );
}
