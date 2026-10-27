'use client';

import React, { useState } from 'react';
import {
  Ship,
  Plus,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  FileCheck2,
  ExternalLink,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ComplianceAiAdvisorModal from './ComplianceAiAdvisorModal';
import {
  CustomsDeclaration,
  CustomsDeclarationType,
  CustomsStage,
} from '@/lib/types';
import { saveLocalCustomsDeclarations } from '@/lib/complianceStorage';

interface IcegateCustomsViewProps {
  declarations: CustomsDeclaration[];
  onUpdateDeclarations: (updated: CustomsDeclaration[]) => void;
}

export default function IcegateCustomsView({
  declarations,
  onUpdateDeclarations,
}: IcegateCustomsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'import_boe' | 'export_sb'>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Modal State (Add & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [decType, setDecType] = useState<CustomsDeclarationType>('import_boe');
  const [decNumber, setDecNumber] = useState('');
  const [decDate, setDecDate] = useState('');
  const [portCode, setPortCode] = useState('INMAA1');
  const [portName, setPortName] = useState('Chennai Sea Port');
  const [hsnChapter, setHsnChapter] = useState('52');
  const [goodsDesc, setGoodsDesc] = useState('');
  const [invValue, setInvValue] = useState<number>(0);
  const [dutyValue, setDutyValue] = useState<number>(0);
  const [igstValue, setIgstValue] = useState<number>(0);
  const [drawbackValue, setDrawbackValue] = useState<number>(0);
  const [rodtepValue, setRodtepValue] = useState<number>(0);
  const [chaName, setChaName] = useState('');
  const [currentStage, setCurrentStage] = useState<CustomsStage>('filed');
  const [carrier, setCarrier] = useState('');
  const [containerOrAwb, setContainerOrAwb] = useState('');

  const filtered = declarations.filter((d) => {
    const matchesSearch =
      d.declarationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.goodsDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.chaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.portName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || d.declarationType === typeFilter;
    const matchesStage = stageFilter === 'all' || d.currentStage === stageFilter;
    return matchesSearch && matchesType && matchesStage;
  });

  const totalImports = declarations
    .filter((d) => d.declarationType === 'import_boe')
    .reduce((a, c) => a + c.invoiceValueInr, 0);
  const totalExports = declarations
    .filter((d) => d.declarationType === 'export_sb')
    .reduce((a, c) => a + c.invoiceValueInr, 0);
  const totalDrawback = declarations.reduce((a, c) => a + c.drawbackClaimedInr, 0);
  const totalRodtep = declarations.reduce((a, c) => a + c.rodtepClaimedInr, 0);

  const handleStageChange = (id: string, newStage: CustomsStage) => {
    const updated = declarations.map((d) => {
      if (d.id === id) {
        return {
          ...d,
          currentStage: newStage,
          updatedAt: new Date().toISOString(),
        };
      }
      return d;
    });
    onUpdateDeclarations(updated);
    saveLocalCustomsDeclarations(updated);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setDecType('import_boe');
    setDecNumber('');
    setDecDate(new Date().toISOString().split('T')[0]);
    setPortCode('INMAA1');
    setPortName('Chennai Sea Port');
    setHsnChapter('52');
    setGoodsDesc('');
    setInvValue(0);
    setDutyValue(0);
    setIgstValue(0);
    setDrawbackValue(0);
    setRodtepValue(0);
    setChaName('');
    setCurrentStage('filed');
    setCarrier('');
    setContainerOrAwb('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CustomsDeclaration) => {
    setEditingId(item.id);
    setDecType(item.declarationType);
    setDecNumber(item.declarationNumber);
    setDecDate(item.declarationDate);
    setPortCode(item.portCode);
    setPortName(item.portName);
    setHsnChapter(item.hsnChapter);
    setGoodsDesc(item.goodsDescription);
    setInvValue(item.invoiceValueInr);
    setDutyValue(item.customsDutyInr);
    setIgstValue(item.igstPaidInr);
    setDrawbackValue(item.drawbackClaimedInr);
    setRodtepValue(item.rodtepClaimedInr);
    setChaName(item.chaName);
    setCurrentStage(item.currentStage);
    setCarrier(item.shippingLineOrCarrier || '');
    setContainerOrAwb(item.containerOrAwbNumber || '');
    setIsModalOpen(true);
  };

  const handleSaveDeclaration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decNumber || !goodsDesc) return;

    if (editingId) {
      const updated = declarations.map((d) =>
        d.id === editingId
          ? {
              ...d,
              declarationType: decType,
              declarationNumber: decNumber.trim(),
              declarationDate: decDate || new Date().toISOString().split('T')[0],
              portCode,
              portName,
              hsnChapter,
              goodsDescription: goodsDesc.trim(),
              invoiceValueInr: Number(invValue) || 0,
              customsDutyInr: Number(dutyValue) || 0,
              igstPaidInr: Number(igstValue) || 0,
              drawbackClaimedInr: Number(drawbackValue) || 0,
              rodtepClaimedInr: Number(rodtepValue) || 0,
              chaName: chaName.trim() || 'Direct ICEGATE e-Filing',
              currentStage,
              shippingLineOrCarrier: carrier.trim() || undefined,
              containerOrAwbNumber: containerOrAwb.trim() || undefined,
              updatedAt: new Date().toISOString(),
            }
          : d
      );
      onUpdateDeclarations(updated);
      saveLocalCustomsDeclarations(updated);
    } else {
      const newItem: CustomsDeclaration = {
        id: `cust-${Date.now()}`,
        declarationType: decType,
        declarationNumber: decNumber.trim(),
        declarationDate: decDate || new Date().toISOString().split('T')[0],
        portCode,
        portName,
        hsnChapter,
        goodsDescription: goodsDesc.trim(),
        invoiceValueInr: Number(invValue) || 0,
        customsDutyInr: Number(dutyValue) || 0,
        igstPaidInr: Number(igstValue) || 0,
        drawbackClaimedInr: Number(drawbackValue) || 0,
        rodtepClaimedInr: Number(rodtepValue) || 0,
        chaName: chaName.trim() || 'Direct ICEGATE e-Filing',
        currentStage: 'filed',
        esanchitIrnList: [`IRN-${portCode}-${Date.now().toString().slice(-4)}`],
        shippingLineOrCarrier: carrier.trim() || undefined,
        containerOrAwbNumber: containerOrAwb.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newItem, ...declarations];
      onUpdateDeclarations(updated);
      saveLocalCustomsDeclarations(updated);
    }

    setIsModalOpen(false);
  };

  const handleDeleteDeclaration = (id: string, decNo: string) => {
    if (!window.confirm(`Are you sure you want to delete declaration ${decNo}? This action cannot be undone.`)) {
      return;
    }
    const updated = declarations.filter((d) => d.id !== id);
    onUpdateDeclarations(updated);
    saveLocalCustomsDeclarations(updated);
  };

  const handleExportPlanner = () => {
    const rows = declarations.map((d) => ({
      'Declaration Type': d.declarationType === 'import_boe' ? 'Import (Bill of Entry)' : 'Export (Shipping Bill)',
      'BE/SB Number': d.declarationNumber,
      'Filing Date': d.declarationDate,
      'Port Code': d.portCode,
      'Port Name': d.portName,
      'HSN Chapter': d.hsnChapter,
      'Goods Description': d.goodsDescription,
      'Invoice Value (INR)': d.invoiceValueInr,
      'Customs Duty (INR)': d.customsDutyInr,
      'IGST Paid (INR)': d.igstPaidInr,
      'Drawback Claimed (INR)': d.drawbackClaimedInr,
      'RoDTEP Claimed (INR)': d.rodtepClaimedInr,
      'CHA Partner': d.chaName,
      'Current Customs Stage': d.currentStage.toUpperCase(),
      'e-Sanchit IRNs': d.esanchitIrnList.join(', '),
      'Carrier / Container': `${d.shippingLineOrCarrier || ''} ${d.containerOrAwbNumber || ''}`.trim(),
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customs Consignment Planner');
    XLSX.writeFile(wb, `Rivlet_ICEGATE_Customs_Planner_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStageBadge = (stage: CustomsStage) => {
    switch (stage) {
      case 'cleared_ooc_leo':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Out of Charge / LEO
          </span>
        );
      case 'duty_paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <DollarSign className="w-3 h-3" />
            Duty Settled
          </span>
        );
      case 'rms_assessment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Faceless / RMS
          </span>
        );
      case 'under_examination':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            <FileCheck2 className="w-3 h-3" />
            Customs Exam
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {stage.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-[#0e121b] p-4 rounded-xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8a96ae] mb-1">
            <span>Raw Material Imports (BOE)</span>
            <ArrowDownLeft className="w-4 h-4 text-sky-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            ₹{(totalImports / 100000).toFixed(2)}L
          </span>
          <p className="text-[11px] text-slate-500 dark:text-[#8a96ae] mt-1">Yarns, premium linen & trim imports</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-[#0e121b] p-4 rounded-xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8a96ae] mb-1">
            <span>Finished Garment Exports (SB)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            ₹{(totalExports / 100000).toFixed(2)}L
          </span>
          <p className="text-[11px] text-slate-500 dark:text-[#8a96ae] mt-1">Ready-to-wear seasonal orders</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-[#0e121b] p-4 rounded-xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8a96ae] mb-1">
            <span>Duty Drawback Realized</span>
            <DollarSign className="w-4 h-4 text-amber-600 dark:text-[#f7d88c]" />
          </div>
          <span className="text-2xl font-bold text-amber-600 dark:text-[#f7d88c] font-mono">
            ₹{(totalDrawback / 1000).toFixed(1)}k
          </span>
          <p className="text-[11px] text-slate-500 dark:text-[#8a96ae] mt-1">All Industry Rates (AIR) credited</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-[#0e121b] p-4 rounded-xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8a96ae] mb-1">
            <span>RoDTEP Export Scrips</span>
            <FileCheck2 className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-bold text-purple-700 dark:text-purple-300 font-mono">
            ₹{(totalRodtep / 1000).toFixed(1)}k
          </span>
          <p className="text-[11px] text-slate-500 dark:text-[#8a96ae] mt-1">Transferable electronic duty scrips</p>
        </div>
      </div>

      {/* Consignment Planner Sheet & Actions */}
      <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ship className="w-4 h-4 text-[#cda052]" />
              <span>ICEGATE Customs Clearance Planner Sheet (Apparel & Textiles)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5">
              Tracks cross-border consignments through statutory CBIC RMS, duty payment, and release orders
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#cda052]/10 hover:bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/30 text-xs font-bold transition-colors shadow-sm"
              title="Audit port clearance gates and calculate duty optimization"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Customs Advisor</span>
            </button>
            <button
              onClick={handleExportPlanner}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Export Planner</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Consignment</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 my-4">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search BE/SB No, port, CHA, fabrics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#080b12] text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#080b12] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
          >
            <option value="all">All Declarations</option>
            <option value="import_boe">Imports (Bills of Entry)</option>
            <option value="export_sb">Exports (Shipping Bills)</option>
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#080b12] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
          >
            <option value="all">All Stages</option>
            <option value="filed">Filed on ICEGATE</option>
            <option value="rms_assessment">RMS Assessment</option>
            <option value="duty_paid">Duty Paid</option>
            <option value="under_examination">Customs Examination</option>
            <option value="cleared_ooc_leo">Out of Charge / LEO</option>
          </select>
        </div>

        {/* Consignments Spreadsheet Matrix */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1e2638]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#080b12] text-slate-600 dark:text-[#8a96ae] uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 font-semibold">Type & Number</th>
                <th className="py-2.5 px-3 font-semibold">Port & Filing Date</th>
                <th className="py-2.5 px-3 font-semibold">HSN & Commodity</th>
                <th className="py-2.5 px-3 font-semibold">Invoice Value</th>
                <th className="py-2.5 px-3 font-semibold">Customs Duty & IGST</th>
                <th className="py-2.5 px-3 font-semibold">CHA Broker</th>
                <th className="py-2.5 px-3 font-semibold">Customs Stage</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No customs declarations found matching this criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Type & Number */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {item.declarationType === 'import_boe' ? (
                          <span className="p-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white block">
                            {item.declarationNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-[#8a96ae] uppercase font-semibold">
                            {item.declarationType === 'import_boe' ? 'Import BOE' : 'Export SB'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Port & Filing Date */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.portName}</div>
                      <div className="text-[10px] font-mono text-amber-700 dark:text-[#cda052] font-semibold">
                        {item.portCode} • {item.declarationDate}
                      </div>
                    </td>

                    {/* HSN & Goods */}
                    <td className="py-3 px-3 max-w-[260px]">
                      <div className="font-medium text-slate-900 dark:text-white truncate">{item.goodsDescription}</div>
                      <div className="text-[10px] text-slate-500 dark:text-[#8a96ae]">
                        HSN Chapter: <span className="text-amber-700 dark:text-[#f7d88c] font-mono font-semibold">{item.hsnChapter}</span>
                        {item.esanchitIrnList.length > 0 && ` • ${item.esanchitIrnList.length} e-Sanchit IRNs`}
                      </div>
                    </td>

                    {/* Invoice Value */}
                    <td className="py-3 px-3 font-mono text-slate-900 dark:text-white font-semibold whitespace-nowrap">
                      ₹{item.invoiceValueInr.toLocaleString('en-IN')}
                    </td>

                    {/* Duty / Incentives */}
                    <td className="py-3 px-3 font-mono whitespace-nowrap">
                      {item.declarationType === 'import_boe' ? (
                        <div>
                          <span className="text-rose-600 dark:text-rose-400 block font-semibold">
                            Duty: ₹{item.customsDutyInr.toLocaleString('en-IN')}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 text-[10px] block font-semibold">
                            IGST: ₹{item.igstPaidInr.toLocaleString('en-IN')} (ITC)
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-amber-600 dark:text-[#f7d88c] block font-semibold">
                            Drawback: ₹{item.drawbackClaimedInr.toLocaleString('en-IN')}
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 text-[10px] block font-semibold">
                            RoDTEP: ₹{item.rodtepClaimedInr.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* CHA */}
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {item.chaName}
                    </td>

                    {/* Stage */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {getStageBadge(item.currentStage)}
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <select
                          value={item.currentStage}
                          onChange={(e) => handleStageChange(item.id, e.target.value as CustomsStage)}
                          className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] border border-slate-200 dark:border-slate-700 outline-none"
                          title="Quick update customs stage"
                        >
                          <option value="draft">Draft</option>
                          <option value="filed">Filed</option>
                          <option value="rms_assessment">RMS Assessment</option>
                          <option value="duty_paid">Duty Paid</option>
                          <option value="under_examination">Exam</option>
                          <option value="cleared_ooc_leo">Cleared (OOC/LEO)</option>
                        </select>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
                          title="Edit declaration"
                          aria-label={`Edit declaration ${item.declarationNumber}`}
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#cda052]" />
                        </button>
                        <button
                          onClick={() => handleDeleteDeclaration(item.id, item.declarationNumber)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                          title="Delete declaration"
                          aria-label={`Delete declaration ${item.declarationNumber}`}
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

      {/* Modal: Add / Edit Consignment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ship className="w-4 h-4 text-[#cda052]" />
                <span>{editingId ? 'Edit ICEGATE Customs Declaration' : 'Record New ICEGATE Consignment Declaration'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDeclaration} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Declaration Type</label>
                  <select
                    value={decType}
                    onChange={(e) => setDecType(e.target.value as CustomsDeclarationType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  >
                    <option value="import_boe">Import (Bill of Entry - BOE)</option>
                    <option value="export_sb">Export (Shipping Bill - SB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">BE / SB Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BE-8492019"
                    value={decNumber}
                    onChange={(e) => setDecNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Filing Date</label>
                  <input
                    type="date"
                    value={decDate}
                    onChange={(e) => setDecDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Port Code</label>
                  <input
                    type="text"
                    placeholder="INMAA1"
                    value={portCode}
                    onChange={(e) => setPortCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Port Name</label>
                  <input
                    type="text"
                    placeholder="Chennai Sea Port"
                    value={portName}
                    onChange={(e) => setPortName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Goods Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Egyptian Giza Combed Cotton Yarn (Counts 60s/80s)"
                  value={goodsDesc}
                  onChange={(e) => setGoodsDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">HSN Chapter</label>
                  <input
                    type="text"
                    placeholder="52"
                    value={hsnChapter}
                    onChange={(e) => setHsnChapter(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Invoice Value (₹)</label>
                  <input
                    type="number"
                    value={invValue}
                    onChange={(e) => setInvValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Customs Stage</label>
                  <select
                    value={currentStage}
                    onChange={(e) => setCurrentStage(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  >
                    <option value="draft">Draft</option>
                    <option value="filed">Filed</option>
                    <option value="rms_assessment">RMS Assessment</option>
                    <option value="duty_paid">Duty Paid</option>
                    <option value="under_examination">Customs Exam</option>
                    <option value="cleared_ooc_leo">Cleared (OOC/LEO)</option>
                  </select>
                </div>
              </div>

              {decType === 'import_boe' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Customs Duty (₹)</label>
                    <input
                      type="number"
                      value={dutyValue}
                      onChange={(e) => setDutyValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Import IGST Paid (₹)</label>
                    <input
                      type="number"
                      value={igstValue}
                      onChange={(e) => setIgstValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Duty Drawback Claimed (₹)</label>
                    <input
                      type="number"
                      value={drawbackValue}
                      onChange={(e) => setDrawbackValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">RoDTEP Claimed (₹)</label>
                    <input
                      type="number"
                      value={rodtepValue}
                      onChange={(e) => setRodtepValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Customs Broker (CHA)</label>
                  <input
                    type="text"
                    placeholder="Apex Trans-Maritime Customs Brokers"
                    value={chaName}
                    onChange={(e) => setChaName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Shipping Line / Carrier</label>
                  <input
                    type="text"
                    placeholder="Maersk Line / Emirates SkyCargo"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Container No / AWB No</label>
                <input
                  type="text"
                  placeholder="MSKU-9938471 or AWB-176-8839201"
                  value={containerOrAwb}
                  onChange={(e) => setContainerOrAwb(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                >
                  {editingId ? 'Update Consignment' : 'Save Consignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Customs Advisor Modal */}
      <ComplianceAiAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        context={{
          activeTab: 'customs',
          consignmentsSummary: {
            total: declarations.length,
            pendingCustomsDuty: declarations
              .filter(d => d.currentStage !== 'cleared_ooc_leo' && d.currentStage !== 'rejected')
              .reduce((acc, curr) => acc + (curr.customsDutyInr || 0), 0),
            activePorts: Array.from(new Set(declarations.map(d => `${d.portCode} (${d.portName})`))),
          },
        }}
      />
    </div>
  );
}
