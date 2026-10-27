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
  UploadCloud,
  FileUp,
  ScanText,
  CheckCheck,
  FileSearch,
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
  saveMergedGstSettings,
  saveLocalReconInvoices,
  saveMergedReconInvoices,
  deleteMergedReconInvoice,
  getLocalGstTaxInputs,
  saveLocalGstTaxInputs,
  loadMergedGstTaxInputs,
  saveMergedGstTaxInputs,
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
  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [legalName, setLegalName] = useState(settings.legalName || 'My Enterprise');
  const [tradeName, setTradeName] = useState(settings.tradeName || '');
  const [gstin, setGstin] = useState(settings.gstin || '');
  const [pan, setPan] = useState(settings.pan || '');
  const [iec, setIec] = useState(settings.iec || '');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly'>(settings.filingFrequency || 'monthly');
  const [gstr1Day, setGstr1Day] = useState(settings.gstr1DueDay || 10);
  const [gstr3bDay, setGstr3bDay] = useState(settings.gstr3bDueDay || 20);

  // Statutory Tax Figures State (defaults to 0 as requested, loads from Supabase)
  const [taxPeriod, setTaxPeriod] = useState('Current Month');
  const [grossOutwardTurnover, setGrossOutwardTurnover] = useState<number>(0);
  const [outputIgst, setOutputIgst] = useState<number>(0);
  const [outputCgst, setOutputCgst] = useState<number>(0);
  const [outputSgst, setOutputSgst] = useState<number>(0);
  const [inputIgst, setInputIgst] = useState<number>(0);
  const [inputCgst, setInputCgst] = useState<number>(0);
  const [inputSgst, setInputSgst] = useState<number>(0);
  const [ineligibleItc, setIneligibleItc] = useState<number>(0);
  const [hasUnsavedTaxChanges, setHasUnsavedTaxChanges] = useState(false);
  const [taxSavedBanner, setTaxSavedBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('Saved to Cloud Database');

  // Turnover Editing Modal State
  const [isTurnoverModalOpen, setIsTurnoverModalOpen] = useState(false);
  const [editingTurnoverVal, setEditingTurnoverVal] = useState<number>(0);

  // Return Ingestion Modal State (GSTR-1, GSTR-3B, GSTR-2B)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isParsingReturn, setIsParsingReturn] = useState(false);
  const [returnParseError, setReturnParseError] = useState<string | null>(null);
  const [extractedReturnData, setExtractedReturnData] = useState<any>(null);

  // AI Modal States
  const [isAiAuditOpen, setIsAiAuditOpen] = useState(false);
  const [vendorNoticeInvoice, setVendorNoticeInvoice] = useState<any>(null);

  // Invoice Modal State (Add & Edit with AI File Upload)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceModalTab, setInvoiceModalTab] = useState<'upload' | 'manual'>('upload');
  const [isParsingInvoice, setIsParsingInvoice] = useState(false);
  const [invoiceParseError, setInvoiceParseError] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);

  const [editingInvoice, setEditingInvoice] = useState<GstReconciliationInvoice | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorGstin, setVendorGstin] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [taxableValue, setTaxableValue] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [igstAmount, setIgstAmount] = useState<number>(0);
  const [cgstAmount, setCgstAmount] = useState<number>(0);
  const [sgstAmount, setSgstAmount] = useState<number>(0);
  const [inBooks, setInBooks] = useState(true);
  const [inGstr2b, setInGstr2b] = useState(true);
  const [matchStatus, setMatchStatus] = useState<GstReconciliationInvoice['matchStatus']>('matched');
  const [itcEligibility, setItcEligibility] = useState<GstReconciliationInvoice['itcEligibility']>('eligible');

  // Load tax figures from Supabase on mount
  useEffect(() => {
    loadMergedGstTaxInputs().then((saved) => {
      setTaxPeriod(saved.taxPeriod || 'Current Month');
      setGrossOutwardTurnover(saved.grossOutwardTurnover || 0);
      setOutputIgst(saved.outputIgst || 0);
      setOutputCgst(saved.outputCgst || 0);
      setOutputSgst(saved.outputSgst || 0);
      setInputIgst(saved.inputIgst || 0);
      setInputCgst(saved.inputCgst || 0);
      setInputSgst(saved.inputSgst || 0);
      setIneligibleItc(saved.ineligibleItc || 0);
    });
  }, []);

  // Sync settings inputs when prop updates
  useEffect(() => {
    setLegalName(settings.legalName || 'My Enterprise');
    setTradeName(settings.tradeName || '');
    setGstin(settings.gstin || '');
    setPan(settings.pan || (settings.gstin && settings.gstin.length >= 12 ? settings.gstin.slice(2, 12) : ''));
    setIec(settings.iec || '');
    setFrequency(settings.filingFrequency || 'monthly');
    setGstr1Day(settings.gstr1DueDay || 10);
    setGstr3bDay(settings.gstr3bDueDay || 20);
  }, [settings]);

  // Save tax figures directly to database
  const handleSaveTaxFigures = async () => {
    const payload: GstTaxInputs = {
      taxPeriod,
      grossOutwardTurnover,
      outputIgst,
      outputCgst,
      outputSgst,
      inputIgst,
      inputCgst,
      inputSgst,
      ineligibleItc,
    };
    await saveMergedGstTaxInputs(payload);
    setHasUnsavedTaxChanges(false);
    setBannerMessage('Tax Calculations & Turnover Saved to Database');
    setTaxSavedBanner(true);
    setTimeout(() => setTaxSavedBanner(false), 2500);
  };

  // Save edited Gross Outward Turnover
  const handleSaveGrossTurnover = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTurnover = Number(editingTurnoverVal) || 0;
    setGrossOutwardTurnover(updatedTurnover);

    const payload: GstTaxInputs = {
      taxPeriod,
      grossOutwardTurnover: updatedTurnover,
      outputIgst,
      outputCgst,
      outputSgst,
      inputIgst,
      inputCgst,
      inputSgst,
      ineligibleItc,
    };
    await saveMergedGstTaxInputs(payload);
    setIsTurnoverModalOpen(false);
    setBannerMessage('Gross Outward Turnover Updated & Saved to Database');
    setTaxSavedBanner(true);
    setTimeout(() => setTaxSavedBanner(false), 2500);
  };

  // Calculate live Rule 88A statutory settlement
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

  // Open Add Invoice modal
  const handleOpenAddInvoice = () => {
    setEditingInvoice(null);
    setVendorName('');
    setVendorGstin('');
    setInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setTaxableValue(0);
    setTaxAmount(0);
    setIgstAmount(0);
    setCgstAmount(0);
    setSgstAmount(0);
    setInBooks(true);
    setInGstr2b(true);
    setMatchStatus('matched');
    setItcEligibility('eligible');
    setAiConfidence(null);
    setInvoiceParseError(null);
    setInvoiceModalTab('upload');
    setIsInvoiceModalOpen(true);
  };

  // Open Edit Invoice modal
  const handleOpenEditInvoice = (inv: GstReconciliationInvoice) => {
    setEditingInvoice(inv);
    setVendorName(inv.vendorName);
    setVendorGstin(inv.vendorGstin);
    setInvoiceNumber(inv.invoiceNumber);
    setInvoiceDate(inv.invoiceDate);
    setTaxableValue(inv.taxableValue);
    setTaxAmount(inv.taxAmount);
    setIgstAmount(inv.igstAmount || 0);
    setCgstAmount(inv.cgstAmount || 0);
    setSgstAmount(inv.sgstAmount || 0);
    setInBooks(inv.inBooks);
    setInGstr2b(inv.inGstr2b);
    setMatchStatus(inv.matchStatus);
    setItcEligibility(inv.itcEligibility);
    setAiConfidence(null);
    setInvoiceParseError(null);
    setInvoiceModalTab('manual');
    setIsInvoiceModalOpen(true);
  };

  // AI Invoice File Upload Handler
  const handleInvoiceFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingInvoice(true);
    setInvoiceParseError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ai/compliance/parse-invoice', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to extract invoice details.');
      }

      const d = json.data;
      setVendorName(d.vendorName || '');
      setVendorGstin(d.vendorGstin || '');
      setInvoiceNumber(d.invoiceNumber || '');
      setInvoiceDate(d.invoiceDate || new Date().toISOString().split('T')[0]);
      setTaxableValue(d.taxableValue || 0);
      setTaxAmount(d.taxAmount || 0);
      setIgstAmount(d.igstAmount || 0);
      setCgstAmount(d.cgstAmount || 0);
      setSgstAmount(d.sgstAmount || 0);
      setMatchStatus(d.matchStatus || 'matched');
      setItcEligibility(d.itcEligibility || 'eligible');
      setAiConfidence(Math.round((d.confidenceScore || 0.95) * 100));
      // Automatically switch to review form so user sees populated values
      setInvoiceModalTab('manual');
    } catch (err: any) {
      setInvoiceParseError(err.message || 'Error processing invoice file with AI');
    } finally {
      setIsParsingInvoice(false);
    }
  };

  // Save invoice (Add or Edit) to Supabase database
  const handleSaveInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !invoiceNumber) return;

    let updatedList: GstReconciliationInvoice[] = [];

    if (editingInvoice) {
      updatedList = reconInvoices.map((inv) =>
        inv.id === editingInvoice.id
          ? {
              ...inv,
              vendorName: vendorName.trim(),
              vendorGstin: vendorGstin.trim().toUpperCase(),
              invoiceNumber: invoiceNumber.trim(),
              invoiceDate,
              taxableValue: Number(taxableValue) || 0,
              taxAmount: Number(taxAmount) || 0,
              igstAmount: Number(igstAmount) || 0,
              cgstAmount: Number(cgstAmount) || 0,
              sgstAmount: Number(sgstAmount) || 0,
              invoiceValue: (Number(taxableValue) || 0) + (Number(taxAmount) || 0),
              inBooks,
              inGstr2b,
              matchStatus,
              itcEligibility,
            }
          : inv
      );
    } else {
      const newInv: GstReconciliationInvoice = {
        id: `inv-recon-${Date.now()}`,
        vendorName: vendorName.trim(),
        vendorGstin: vendorGstin.trim().toUpperCase() || '33AABCR0000A1Z1',
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate: invoiceDate || new Date().toISOString().split('T')[0],
        taxableValue: Number(taxableValue) || 0,
        taxAmount: Number(taxAmount) || 0,
        igstAmount: Number(igstAmount) || 0,
        cgstAmount: Number(cgstAmount) || 0,
        sgstAmount: Number(sgstAmount) || 0,
        invoiceValue: (Number(taxableValue) || 0) + (Number(taxAmount) || 0),
        inBooks,
        inGstr2b,
        matchStatus,
        itcEligibility,
        source: aiConfidence ? 'ai_upload' : 'manual',
      };
      updatedList = [newInv, ...reconInvoices];
    }

    onUpdateReconInvoices(updatedList);
    await saveMergedReconInvoices(updatedList);
    setIsInvoiceModalOpen(false);

    setBannerMessage('Invoice Saved to Cloud Database');
    setTaxSavedBanner(true);
    setTimeout(() => setTaxSavedBanner(false), 2500);
  };

  // Delete invoice from Supabase database
  const handleDeleteInvoice = async (id: string, invNo: string) => {
    if (!window.confirm(`Delete invoice ${invNo}? This will remove it from the database.`)) {
      return;
    }
    const updated = reconInvoices.filter((i) => i.id !== id);
    onUpdateReconInvoices(updated);
    await deleteMergedReconInvoice(id);

    setBannerMessage(`Invoice ${invNo} Removed from Database`);
    setTaxSavedBanner(true);
    setTimeout(() => setTaxSavedBanner(false), 2500);
  };

  // GST Return Statement Upload Handler (GSTR-1, GSTR-3B, GSTR-2B)
  const handleReturnFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingReturn(true);
    setReturnParseError(null);
    setExtractedReturnData(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ai/compliance/parse-gst-return', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Failed to parse GST return statement.');
      }

      setExtractedReturnData(json.data);
    } catch (err: any) {
      setReturnParseError(err.message || 'Error processing GST return file with AI');
    } finally {
      setIsParsingReturn(false);
    }
  };

  // Write Extracted Return Data to Database
  const handleApplyExtractedReturn = async () => {
    if (!extractedReturnData) return;

    const d = extractedReturnData;

    // 1. Update and save statutory tax inputs
    const updatedInputs: GstTaxInputs = {
      taxPeriod: d.taxPeriod || taxPeriod,
      grossOutwardTurnover: d.grossOutwardTurnover !== undefined ? d.grossOutwardTurnover : grossOutwardTurnover,
      outputIgst: d.outputIgst !== undefined ? d.outputIgst : outputIgst,
      outputCgst: d.outputCgst !== undefined ? d.outputCgst : outputCgst,
      outputSgst: d.outputSgst !== undefined ? d.outputSgst : outputSgst,
      inputIgst: d.inputIgst !== undefined ? d.inputIgst : inputIgst,
      inputCgst: d.inputCgst !== undefined ? d.inputCgst : inputCgst,
      inputSgst: d.inputSgst !== undefined ? d.inputSgst : inputSgst,
      ineligibleItc: d.ineligibleItc !== undefined ? d.ineligibleItc : ineligibleItc,
    };

    setGrossOutwardTurnover(updatedInputs.grossOutwardTurnover);
    setOutputIgst(updatedInputs.outputIgst);
    setOutputCgst(updatedInputs.outputCgst);
    setOutputSgst(updatedInputs.outputSgst);
    setInputIgst(updatedInputs.inputIgst);
    setInputCgst(updatedInputs.inputCgst);
    setInputSgst(updatedInputs.inputSgst);
    setIneligibleItc(updatedInputs.ineligibleItc);
    setTaxPeriod(updatedInputs.taxPeriod);

    await saveMergedGstTaxInputs(updatedInputs);

    // 2. If supplier invoices were extracted (e.g. from GSTR-2B), merge and write to database
    if (d.invoices && d.invoices.length > 0) {
      const mergedInvoices = [...d.invoices, ...reconInvoices];
      onUpdateReconInvoices(mergedInvoices);
      await saveMergedReconInvoices(mergedInvoices);
    }

    // 3. If business credentials were found in the return statement
    if (d.gstin || d.legalName) {
      const updatedSettings: GstSettings = {
        ...settings,
        gstin: d.gstin || settings.gstin,
        legalName: d.legalName || settings.legalName,
        pan: d.pan || settings.pan,
      };
      onUpdateSettings(updatedSettings);
      await saveMergedGstSettings(updatedSettings);
    }

    setIsReturnModalOpen(false);
    setExtractedReturnData(null);
    setBannerMessage(`Applied ${d.returnType || 'GST Return'} & Saved to Database`);
    setTaxSavedBanner(true);
    setTimeout(() => setTaxSavedBanner(false), 3000);
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

  // Save Settings Modal
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const gstinFormatted = gstin.trim().toUpperCase();
    const panFormatted = pan.trim().toUpperCase() || (gstinFormatted.length >= 12 ? gstinFormatted.slice(2, 12) : '');

    const updated: GstSettings = {
      ...settings,
      legalName: legalName.trim() || 'My Enterprise',
      tradeName: tradeName.trim() || undefined,
      gstin: gstinFormatted,
      pan: panFormatted,
      iec: iec.trim().toUpperCase() || undefined,
      filingFrequency: frequency,
      gstr1DueDay: Number(gstr1Day) || 10,
      gstr3bDueDay: Number(gstr3bDay) || 20,
    };

    onUpdateSettings(updated);
    await saveMergedGstSettings(updated);
    setIsSettingsOpen(false);

    setBannerMessage('GST Settings & Entity Profile Saved to Database');
    setTaxSavedBanner(true);
    setTimeout(() => setTaxSavedBanner(false), 2500);
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
        message: `${type} for ${taxPeriod} is due on the ${dueDay}th of this month. Please finalize registers and file.`,
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
      {/* Live Cloud Save Toast Banner */}
      {taxSavedBanner && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-xl animate-fade-in border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* 1. Top Action Toolbar: Ingestion & Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e121b] p-4 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsReturnModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black text-xs font-bold transition-all shadow-sm"
            title="Upload GST Portal Downloaded Return (GSTR-3B, GSTR-1, GSTR-2B)"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload GST Return (3B / 1 / 2B)</span>
          </button>

          <button
            onClick={handleOpenAddInvoice}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#cda052]" />
            <span>Add Invoice (AI Scan / Manual)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-[#cda052]" />
            <span>GST Settings & PAN</span>
          </button>
        </div>
      </div>

      {/* 2. Statutory Due Date Cards (GSTR-1 on the 10th & GSTR-3B on the 20th) */}
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
                  {settings.filingFrequency || 'monthly'} Cadence
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                GSTR-1 Filing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Statutory Due Date:{' '}
                <span className="text-amber-700 dark:text-[#f7d88c] font-semibold font-mono">
                  {settings.gstr1DueDay || 10}th of Every Month
                </span>
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
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px]">Gross Outward Turnover</span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTurnoverVal(grossOutwardTurnover);
                    setIsTurnoverModalOpen(true);
                  }}
                  className="text-[10px] text-[#cda052] hover:underline font-semibold flex items-center gap-0.5"
                  title="Edit Gross Outward Turnover"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>Edit</span>
                </button>
              </div>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                ₹{grossOutwardTurnover.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px]">Output Tax Declared</span>
              <span className="text-base font-bold text-amber-600 dark:text-[#f7d88c] font-mono">
                ₹{(outputIgst + outputCgst + outputSgst).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => handleTriggerReminder('GSTR-1', settings.gstr1DueDay || 10)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <BellRing className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Reminder</span>
            </button>

            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20 transition-colors"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload GSTR-1 File</span>
            </button>

            <a
              href="https://services.gst.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition-colors"
            >
              <span>GSTN Portal</span>
              <ExternalLink className="w-3 h-3" />
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
                Statutory Due Date:{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  {settings.gstr3bDueDay || 20}th of Every Month
                </span>
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
              <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px]">Eligible Input Tax Credit (ITC)</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{taxCalculation.eligibleItc.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#8a96ae] block text-[11px]">Net Cash Payable (PMT-06)</span>
              <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                ₹{taxCalculation.netTotalPayable.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => handleTriggerReminder('GSTR-3B', settings.gstr3bDueDay || 20)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <BellRing className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Reminder</span>
            </button>

            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 transition-colors"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload GSTR-3B File</span>
            </button>

            <a
              href="https://services.gst.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold transition-colors"
            >
              <span>Challan Pay</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* 3. Live Rule 88A Tax Calculation Engine & Breakdown */}
      <div className="bg-white dark:bg-[#0e121b] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BadgePercent className="w-4 h-4 text-[#cda052]" />
              <span>Rule 88A GST Tax Offset & Settlement Engine</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5">
              Live calculation of outward liabilities, input credits, and statutory cash settlement for {taxPeriod}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasUnsavedTaxChanges && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
                Unsaved modifications
              </span>
            )}
            <button
              onClick={handleSaveTaxFigures}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black text-xs font-semibold transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Tax Figures to Database</span>
            </button>
          </div>
        </div>

        {/* Tax Inputs Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Output IGST */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
            <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-medium">Output IGST (₹)</label>
            <input
              type="number"
              value={outputIgst}
              onChange={(e) => {
                setOutputIgst(Number(e.target.value));
                setHasUnsavedTaxChanges(true);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121623] text-slate-900 dark:text-white font-mono font-bold border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
            />
          </div>

          {/* Output CGST */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
            <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-medium">Output CGST (₹)</label>
            <input
              type="number"
              value={outputCgst}
              onChange={(e) => {
                setOutputCgst(Number(e.target.value));
                setHasUnsavedTaxChanges(true);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121623] text-slate-900 dark:text-white font-mono font-bold border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
            />
          </div>

          {/* Output SGST */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
            <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-medium">Output SGST (₹)</label>
            <input
              type="number"
              value={outputSgst}
              onChange={(e) => {
                setOutputSgst(Number(e.target.value));
                setHasUnsavedTaxChanges(true);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121623] text-slate-900 dark:text-white font-mono font-bold border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
            />
          </div>

          {/* Input IGST */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
            <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-medium">Input IGST Credit (₹)</label>
            <input
              type="number"
              value={inputIgst}
              onChange={(e) => {
                setInputIgst(Number(e.target.value));
                setHasUnsavedTaxChanges(true);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121623] text-slate-900 dark:text-white font-mono font-bold border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
            />
          </div>

          {/* Input CGST */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
            <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-medium">Input CGST Credit (₹)</label>
            <input
              type="number"
              value={inputCgst}
              onChange={(e) => {
                setInputCgst(Number(e.target.value));
                setHasUnsavedTaxChanges(true);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121623] text-slate-900 dark:text-white font-mono font-bold border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
            />
          </div>

          {/* Input SGST */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
            <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-medium">Input SGST Credit (₹)</label>
            <input
              type="number"
              value={inputSgst}
              onChange={(e) => {
                setInputSgst(Number(e.target.value));
                setHasUnsavedTaxChanges(true);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121623] text-slate-900 dark:text-white font-mono font-bold border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
            />
          </div>

          {/* Ineligible ITC */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
            <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-medium">Ineligible ITC u/s 17(5) (₹)</label>
            <input
              type="number"
              value={ineligibleItc}
              onChange={(e) => {
                setIneligibleItc(Number(e.target.value));
                setHasUnsavedTaxChanges(true);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121623] text-rose-600 dark:text-rose-400 font-mono font-bold border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
            />
          </div>

          {/* Tax Period Selector */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
            <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-medium">Tax Period</label>
            <input
              type="text"
              value={taxPeriod}
              onChange={(e) => {
                setTaxPeriod(e.target.value);
                setHasUnsavedTaxChanges(true);
              }}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#121623] text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
            />
          </div>
        </div>

        {/* Summary Offset Table */}
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1e2638]">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-[#121623] text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-[#1e2638]">
              <tr>
                <th className="py-2.5 px-4">Tax Head</th>
                <th className="py-2.5 px-4">Output Liability</th>
                <th className="py-2.5 px-4">Input Credit Available</th>
                <th className="py-2.5 px-4">Net Cash Payable (Challan)</th>
                <th className="py-2.5 px-4">Remaining Credit Carried Forward</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 dark:text-white">IGST (Inter-State)</td>
                <td className="py-2.5 px-4">₹{outputIgst.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-4">₹{inputIgst.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-4 font-bold text-amber-600 dark:text-[#f7d88c]">
                  ₹{taxCalculation.netPayableIgst.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">
                  ₹{taxCalculation.itcBalanceIgst.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 dark:text-white">CGST (Central)</td>
                <td className="py-2.5 px-4">₹{outputCgst.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-4">₹{inputCgst.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-4 font-bold text-amber-600 dark:text-[#f7d88c]">
                  ₹{taxCalculation.netPayableCgst.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">
                  ₹{taxCalculation.itcBalanceCgst.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 dark:text-white">SGST (State)</td>
                <td className="py-2.5 px-4">₹{outputSgst.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-4">₹{inputSgst.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-4 font-bold text-amber-600 dark:text-[#f7d88c]">
                  ₹{taxCalculation.netPayableSgst.toLocaleString('en-IN')}
                </td>
                <td className="py-2.5 px-4 text-emerald-600 dark:text-emerald-400">
                  ₹{taxCalculation.itcBalanceSgst.toLocaleString('en-IN')}
                </td>
              </tr>
              <tr className="bg-slate-50 dark:bg-[#0c1017] font-bold">
                <td className="py-3 px-4 font-sans text-slate-900 dark:text-white">Total Settlement</td>
                <td className="py-3 px-4 text-slate-900 dark:text-white">
                  ₹{(outputIgst + outputCgst + outputSgst).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">
                  ₹{taxCalculation.eligibleItc.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-amber-600 dark:text-[#f7d88c] text-sm">
                  ₹{taxCalculation.netTotalPayable.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400">
                  ₹{(taxCalculation.itcBalanceIgst + taxCalculation.itcBalanceCgst + taxCalculation.itcBalanceSgst).toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. GSTR-2B vs Books Purchase Reconciliation Engine */}
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

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-[#cda052] border border-[#cda052]/30 text-xs font-semibold transition-colors shadow-sm"
              title="Upload GSTR-2B / GSTR-3B statement from portal"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Import 2B / 3B File</span>
            </button>
            <button
              onClick={() => setIsAiAuditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#cda052]" />
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
              ₹{totalReconValue.toLocaleString('en-IN')} Tax ({reconInvoices.length} Invoices)
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50">
            <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-medium">Matched & 100% Eligible</span>
            <span className="text-base font-bold text-emerald-800 dark:text-emerald-300 font-mono mt-0.5 block">
              ₹{matchedValue.toLocaleString('en-IN')} Ready to Claim
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
            <span className="text-amber-700 dark:text-amber-400 block text-[11px] font-medium">Pending Vendor 2B Upload</span>
            <span className="text-base font-bold text-amber-800 dark:text-amber-300 font-mono mt-0.5 block">
              ₹{pendingValue.toLocaleString('en-IN')} Follow-up Needed
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
            Blocked 17(5) ({reconInvoices.filter((i) => i.itcEligibility === 'ineligible_17_5').length})
          </button>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1e2638]">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-[#121623] text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-[#1e2638]">
              <tr>
                <th className="py-2.5 px-3">Supplier Name & GSTIN</th>
                <th className="py-2.5 px-3">Invoice No & Date</th>
                <th className="py-2.5 px-3">Taxable Value</th>
                <th className="py-2.5 px-3">GST Tax</th>
                <th className="py-2.5 px-3">ERP Books</th>
                <th className="py-2.5 px-3">GSTR-2B</th>
                <th className="py-2.5 px-3">Reconciliation Status</th>
                <th className="py-2.5 px-3">ITC Claim</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-[#121623]/50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[200px]">
                      {inv.vendorName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{inv.vendorGstin || 'No GSTIN'}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">{inv.invoiceNumber}</span>
                    <span className="text-[10px] text-slate-400">{inv.invoiceDate}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">₹{inv.taxableValue.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-amber-600 dark:text-[#f7d88c]">
                    ₹{inv.taxAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 px-3">
                    {inv.inBooks ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Check className="w-3 h-3" /> Yes
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-semibold">No</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    {inv.inGstr2b ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                        <Check className="w-3 h-3" /> Auto-drafted
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Missing</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        inv.matchStatus === 'matched'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {inv.matchStatus.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inv.itcEligibility === 'eligible'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : inv.itcEligibility === 'ineligible_17_5'
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {inv.itcEligibility === 'eligible'
                        ? 'Eligible'
                        : inv.itcEligibility === 'ineligible_17_5'
                        ? 'Blocked 17(5)'
                        : 'Pending'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {inv.matchStatus === 'missing_in_2b' && (
                        <button
                          onClick={() => setVendorNoticeInvoice(inv)}
                          className="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                          title="Generate AI Demand Notice"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenEditInvoice(inv)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        title="Edit Invoice"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                        className="p-1 rounded text-rose-400 hover:text-rose-600"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    No supplier invoices found in this view. Use "Add Invoice" or "Upload GST Return" to populate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Edit Gross Outward Turnover Modal */}
      {isTurnoverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-sm rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Pencil className="w-4 h-4 text-[#cda052]" />
                <span>Edit Gross Outward Turnover</span>
              </h3>
              <button onClick={() => setIsTurnoverModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mb-4">
              Enter your gross outward turnover for {taxPeriod}. Will save directly to the database.
            </p>
            <form onSubmit={handleSaveGrossTurnover} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  Gross Outward Turnover (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  required
                  value={editingTurnoverVal}
                  onChange={(e) => setEditingTurnoverVal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono font-bold text-base border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTurnoverModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add / Edit Invoice Modal (With AI Upload & Manual Form) */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#cda052]" />
                <span>{editingInvoice ? 'Edit Reconciliation Invoice' : 'Add Invoice to Reconciliation'}</span>
              </h3>
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            {!editingInvoice && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setInvoiceModalTab('upload')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    invoiceModalTab === 'upload'
                      ? 'bg-white dark:bg-[#0e121b] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#cda052]" />
                  <span>Upload File (AI Auto-Fill)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceModalTab('manual')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    invoiceModalTab === 'manual'
                      ? 'bg-white dark:bg-[#0e121b] text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-400" />
                  <span>Manual Form Entry</span>
                </button>
              </div>
            )}

            {/* AI Upload Dropzone */}
            {!editingInvoice && invoiceModalTab === 'upload' && (
              <div className="space-y-4 mb-4">
                <div className="border-2 border-dashed border-amber-500/30 hover:border-[#cda052] rounded-2xl p-6 text-center bg-amber-500/5 transition-colors">
                  {isParsingInvoice ? (
                    <div className="py-6 flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-[#cda052] animate-spin" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Gemini AI is reading statutory line items...
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#8a96ae] mt-0.5">
                          Extracting GSTIN, invoice value, tax components, and Rule 88A eligibility
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <FileUp className="w-10 h-10 text-[#cda052] mx-auto mb-2" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Click or drag invoice file here
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-[#8a96ae] block mt-1">
                        Supports PDF invoices, scans (PNG/JPG), and vendor Excel spreadsheets
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv"
                        onChange={handleInvoiceFileUpload}
                        className="hidden"
                      />
                      <span className="inline-block mt-3 px-3.5 py-1.5 rounded-xl bg-[#cda052] text-black text-xs font-semibold">
                        Browse Invoice
                      </span>
                    </label>
                  )}
                </div>

                {invoiceParseError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                    {invoiceParseError}
                  </div>
                )}
              </div>
            )}

            {/* AI Confidence Banner */}
            {aiConfidence && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#cda052]" />
                  <span>Extracted via Gemini AI with {aiConfidence}% confidence</span>
                </div>
                <span className="text-[10px] font-semibold uppercase">Verify & Save</span>
              </div>
            )}

            {/* Invoice Form (Manual or Reviewing AI extraction) */}
            {(invoiceModalTab === 'manual' || editingInvoice) && (
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
                      onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
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
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingInvoice ? 'Update Database' : 'Save & Write to Database'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: GST Portal Return Statement Ingestion (GSTR-1, GSTR-3B, GSTR-2B) */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1e2638] p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#cda052]/10 text-[#cda052]">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Upload GST Portal Return / Statement
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#8a96ae]">
                    Upload GSTR-3B, GSTR-1, or GSTR-2B files downloaded from the GST portal
                  </p>
                </div>
              </div>
              <button onClick={() => setIsReturnModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload Area */}
            {!extractedReturnData && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-amber-500/30 hover:border-[#cda052] rounded-2xl p-8 text-center bg-amber-500/5 transition-colors">
                  {isParsingReturn ? (
                    <div className="py-6 flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 text-[#cda052] animate-spin" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Gemini AI is parsing the statutory return statement...
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#8a96ae] mt-0.5">
                          Reading turnover, Rule 88A offsets, available ITC, and line item invoices
                        </p>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <FileSearch className="w-10 h-10 text-[#cda052] mx-auto mb-2" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Select GST Portal File (.json, .xlsx, .pdf)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-[#8a96ae] block mt-1">
                        Compatible with GSTR-3B JSON/PDF, GSTR-1 Excel/JSON, or GSTR-2B ITC exports
                      </span>
                      <input
                        type="file"
                        accept=".json,.xlsx,.xls,.csv,.pdf"
                        onChange={handleReturnFileUpload}
                        className="hidden"
                      />
                      <span className="inline-block mt-3 px-4 py-2 rounded-xl bg-[#cda052] text-black text-xs font-semibold">
                        Browse Return File
                      </span>
                    </label>
                  )}
                </div>

                {returnParseError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                    {returnParseError}
                  </div>
                )}
              </div>
            )}

            {/* Extracted Return Preview & Confirmation */}
            {extractedReturnData && (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4" />
                    <span>Return Ingestion Ready: {extractedReturnData.returnType}</span>
                  </div>
                  <span className="font-mono">{extractedReturnData.taxPeriod}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Gross Outward Turnover</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      ₹{extractedReturnData.grossOutwardTurnover?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Total Output Tax</span>
                    <span className="text-base font-bold text-amber-600 dark:text-[#f7d88c] font-mono">
                      ₹{(extractedReturnData.outputIgst + extractedReturnData.outputCgst + extractedReturnData.outputSgst).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Eligible ITC (Table 4A)</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{(extractedReturnData.inputIgst + extractedReturnData.inputCgst + extractedReturnData.inputSgst).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Invoices Discovered</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                      {extractedReturnData.invoices?.length || 0} Supplier Invoices
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setExtractedReturnData(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Upload Different File
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyExtractedReturn}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Confirm & Write to Database</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 4: Settings & Business Entity Profile Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-[#cda052]" />
              <span>GST Compliance & Profile Configuration</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mb-4">
              Update legal entity details, PAN, GSTIN, and statutory return frequencies
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Legal Company Name *</label>
                <input
                  type="text"
                  required
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">GSTIN (15 Digits)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setGstin(val);
                      if (val.length >= 12 && !pan) {
                        setPan(val.slice(2, 12));
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono uppercase border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">PAN (10 Digits)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono uppercase border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

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
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save to Database</span>
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
            matched: reconInvoices.filter((i) => i.matchStatus === 'matched').length,
            mismatched: reconInvoices.filter((i) => i.matchStatus === 'value_mismatch').length,
            pending: reconInvoices.filter((i) => i.matchStatus === 'missing_in_2b').length,
          },
          mismatchedVendors: reconInvoices
            .filter((i) => i.matchStatus !== 'matched')
            .map((i) => ({
              vendor: i.vendorName,
              invoiceNo: i.invoiceNumber,
              status: i.matchStatus,
              taxAmount: i.taxAmount,
            })),
          consignmentsSummary: { total: 0, pendingCustomsDuty: 0, activePorts: [] },
          advanceTaxSummary: { currentFiscalYear: 'FY 2026-27', totalPaid: 0, installmentsComplete: 0, totalEstimated: 0 },
          dscTokensSummary: { active: 0, expiringSoon: 0 },
          upcomingDeadlines: [`GSTR-1 (${settings.gstr1DueDay || 10}th)`, `GSTR-3B (${settings.gstr3bDueDay || 20}th)`],
        }}
      />
    </div>
  );
}
