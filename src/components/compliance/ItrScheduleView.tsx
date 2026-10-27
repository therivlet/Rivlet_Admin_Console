'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  BellRing,
  ExternalLink,
  ShieldCheck,
  Building,
  Plus,
  Pencil,
  Trash2,
  X,
  DollarSign,
} from 'lucide-react';
import { AdvanceTaxRecord, TdsReturnRecord } from '@/lib/types';
import {
  getLocalAdvanceTaxRecords,
  saveLocalAdvanceTaxRecords,
  getLocalTdsRecords,
  saveLocalTdsRecords,
} from '@/lib/complianceStorage';
import { addDurableNotification } from '@/lib/notificationStorage';

export default function ItrScheduleView() {
  const [advanceTaxList, setAdvanceTaxList] = useState<AdvanceTaxRecord[]>([]);
  const [tdsList, setTdsList] = useState<TdsReturnRecord[]>([]);

  // Advance Tax Modal State
  const [isAdvModalOpen, setIsAdvModalOpen] = useState(false);
  const [editingAdvId, setEditingAdvId] = useState<string | null>(null);
  const [advQuarter, setAdvQuarter] = useState('');
  const [advDueDate, setAdvDueDate] = useState('');
  const [advStatutoryDate, setAdvStatutoryDate] = useState('');
  const [advAmount, setAdvAmount] = useState<number>(0);
  const [advStatus, setAdvStatus] = useState<AdvanceTaxRecord['status']>('upcoming');
  const [advChallanNo, setAdvChallanNo] = useState('');
  const [advNotes, setAdvNotes] = useState('');

  // TDS Return Modal State
  const [isTdsModalOpen, setIsTdsModalOpen] = useState(false);
  const [editingTdsId, setEditingTdsId] = useState<string | null>(null);
  const [tdsForm, setTdsForm] = useState('');
  const [tdsPeriod, setTdsPeriod] = useState('');
  const [tdsDueDate, setTdsDueDate] = useState('');
  const [tdsStatus, setTdsStatus] = useState<TdsReturnRecord['status']>('upcoming');
  const [tdsLead, setTdsLead] = useState('');
  const [tdsAmount, setTdsAmount] = useState<number>(0);
  const [tdsToken, setTdsToken] = useState('');

  useEffect(() => {
    setAdvanceTaxList(getLocalAdvanceTaxRecords());
    setTdsList(getLocalTdsRecords());
  }, []);

  const handleTriggerReminder = async (title: string, date: string, desc: string) => {
    try {
      await addDurableNotification({
        title: `Direct Tax Alert: ${title}`,
        message: `${desc} Statutory deadline: ${date}. Settle via Challan 280 on Income Tax portal.`,
        link: '/compliance?tab=itr',
        type: 'reminder',
        priority: 'high',
        module: 'compliance',
      });
      alert(`Reminder dispatched for ${title}!`);
    } catch (err) {
      console.error(err);
    }
  };

  // --- Advance Tax Handlers ---
  const handleOpenAddAdv = () => {
    setEditingAdvId(null);
    setAdvQuarter('Installment 3 (75% Cumulative)');
    setAdvDueDate('15 December');
    setAdvStatutoryDate('2026-12-15');
    setAdvAmount(750000);
    setAdvStatus('upcoming');
    setAdvChallanNo('Pending Challan 280');
    setAdvNotes('');
    setIsAdvModalOpen(true);
  };

  const handleOpenEditAdv = (item: AdvanceTaxRecord) => {
    setEditingAdvId(item.id);
    setAdvQuarter(item.quarter);
    setAdvDueDate(item.dueDate);
    setAdvStatutoryDate(item.statutoryDate);
    setAdvAmount(item.estimatedAmount);
    setAdvStatus(item.status);
    setAdvChallanNo(item.challanNo);
    setAdvNotes(item.notes || '');
    setIsAdvModalOpen(true);
  };

  const handleSaveAdv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advQuarter) return;

    if (editingAdvId) {
      const updated = advanceTaxList.map((t) =>
        t.id === editingAdvId
          ? {
              ...t,
              quarter: advQuarter.trim(),
              dueDate: advDueDate.trim(),
              statutoryDate: advStatutoryDate || '2026-12-15',
              estimatedAmount: Number(advAmount) || 0,
              status: advStatus,
              challanNo: advChallanNo.trim() || 'Pending Challan 280',
              notes: advNotes.trim() || undefined,
            }
          : t
      );
      setAdvanceTaxList(updated);
      saveLocalAdvanceTaxRecords(updated);
    } else {
      const newItem: AdvanceTaxRecord = {
        id: `adv-tax-${Date.now()}`,
        quarter: advQuarter.trim(),
        dueDate: advDueDate.trim() || '15th',
        statutoryDate: advStatutoryDate || new Date().toISOString().split('T')[0],
        estimatedAmount: Number(advAmount) || 0,
        status: advStatus,
        challanNo: advChallanNo.trim() || 'Pending Challan 280',
        notes: advNotes.trim() || undefined,
      };
      const updated = [...advanceTaxList, newItem];
      setAdvanceTaxList(updated);
      saveLocalAdvanceTaxRecords(updated);
    }
    setIsAdvModalOpen(false);
  };

  const handleDeleteAdv = (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    const updated = advanceTaxList.filter((t) => t.id !== id);
    setAdvanceTaxList(updated);
    saveLocalAdvanceTaxRecords(updated);
  };

  // --- TDS Handlers ---
  const handleOpenAddTds = () => {
    setEditingTdsId(null);
    setTdsForm('Form 26Q (Vendor / Job-work TDS)');
    setTdsPeriod('Q3 (Oct - Dec)');
    setTdsDueDate('2027-01-31');
    setTdsStatus('upcoming');
    setTdsLead('Tax Consultant');
    setTdsAmount(150000);
    setTdsToken('');
    setIsTdsModalOpen(true);
  };

  const handleOpenEditTds = (item: TdsReturnRecord) => {
    setEditingTdsId(item.id);
    setTdsForm(item.form);
    setTdsPeriod(item.period);
    setTdsDueDate(item.dueDate);
    setTdsStatus(item.status);
    setTdsLead(item.lead);
    setTdsAmount(item.deductionAmount || 0);
    setTdsToken(item.tokenNumber || '');
    setIsTdsModalOpen(true);
  };

  const handleSaveTds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tdsForm || !tdsPeriod) return;

    if (editingTdsId) {
      const updated = tdsList.map((item) =>
        item.id === editingTdsId
          ? {
              ...item,
              form: tdsForm.trim(),
              period: tdsPeriod.trim(),
              dueDate: tdsDueDate,
              status: tdsStatus,
              lead: tdsLead.trim() || 'Finance Lead',
              deductionAmount: Number(tdsAmount) || 0,
              tokenNumber: tdsToken.trim() || undefined,
            }
          : item
      );
      setTdsList(updated);
      saveLocalTdsRecords(updated);
    } else {
      const newItem: TdsReturnRecord = {
        id: `tds-${Date.now()}`,
        form: tdsForm.trim(),
        period: tdsPeriod.trim(),
        dueDate: tdsDueDate || '2026-10-31',
        status: tdsStatus,
        lead: tdsLead.trim() || 'Finance Lead',
        deductionAmount: Number(tdsAmount) || 0,
        tokenNumber: tdsToken.trim() || undefined,
      };
      const updated = [...tdsList, newItem];
      setTdsList(updated);
      saveLocalTdsRecords(updated);
    }
    setIsTdsModalOpen(false);
  };

  const handleDeleteTds = (id: string, form: string) => {
    if (!window.confirm(`Are you sure you want to delete ${form}?`)) return;
    const updated = tdsList.filter((t) => t.id !== id);
    setTdsList(updated);
    saveLocalTdsRecords(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#0e121b] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#cda052]" />
              <span>Direct Tax, Advance Tax & Corporate ITR Schedule</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5">
              PAN: <span className="text-amber-700 dark:text-[#f7d88c] font-mono font-semibold">AABCR1234F</span> • Section 208/211 Advance Tax & TDS Compliance
            </p>
          </div>
          <a
            href="https://www.incometax.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <span>Income Tax Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#cda052]" />
          </a>
        </div>
      </div>

      {/* Advance Tax 4-Tranche Tracker */}
      <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#cda052]" />
              <span>Advance Tax Statutory Schedule (Section 208 / 211)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5">
              Corporate entities must pay 100% of assessed income tax liability across four statutory quarters
            </p>
          </div>
          <button
            onClick={handleOpenAddAdv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Installment</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {advanceTaxList.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-xl border relative overflow-hidden transition-all flex flex-col justify-between ${
                t.status === 'filed'
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-slate-50 dark:bg-[#080b12] border-slate-200 dark:border-[#1e2638]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-900 dark:text-white">{t.dueDate}</span>
                  {t.status === 'filed' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-[#f7d88c] font-semibold">
                      <Clock className="w-3 h-3" />
                      Upcoming
                    </span>
                  )}
                </div>

                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{t.quarter}</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-1">
                  ₹{Number(t.estimatedAmount).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#8a96ae] font-mono mt-0.5 truncate">{t.challanNo}</div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditAdv(t)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700"
                    title="Edit Installment"
                  >
                    <Pencil className="w-3 h-3 text-[#cda052]" />
                  </button>
                  <button
                    onClick={() => handleDeleteAdv(t.id, t.quarter)}
                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                    title="Delete Installment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {t.status !== 'filed' && (
                  <button
                    onClick={() =>
                      handleTriggerReminder(
                        `Advance Tax ${t.quarter}`,
                        t.statutoryDate,
                        `Advance tax installment of ₹${Number(t.estimatedAmount).toLocaleString('en-IN')} due`
                      )
                    }
                    className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-amber-700 dark:text-[#f7d88c] border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <BellRing className="w-3 h-3" />
                    <span>Remind</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TDS Quarterly Returns Matrix */}
      <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#cda052]" />
              <span>Quarterly TDS Returns & Annual Tax Audit (Form 24Q, 26Q, ITR-6)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5">
              Tracks withholding taxes on fabric mill contractors, job-workers, and annual statutory audit
            </p>
          </div>
          <button
            onClick={handleOpenAddTds}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black text-xs font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add TDS Return</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1e2638]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#080b12] text-slate-600 dark:text-[#8a96ae] uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <th className="py-2.5 px-3 font-semibold">Form / Statutory Return</th>
                <th className="py-2.5 px-3 font-semibold">Tax Period</th>
                <th className="py-2.5 px-3 font-semibold">Statutory Due Date</th>
                <th className="py-2.5 px-3 font-semibold">Deduction (₹)</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Lead Signatory</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tdsList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{item.form}</td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{item.period}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-amber-600 dark:text-[#f7d88c]">{item.dueDate}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-900 dark:text-white font-medium">
                    {item.deductionAmount ? `₹${item.deductionAmount.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{item.lead}</td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() =>
                          handleTriggerReminder(
                            item.form,
                            item.dueDate,
                            `Quarterly TDS return filing for ${item.period}`
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        Remind
                      </button>
                      <button
                        onClick={() => handleOpenEditTds(item)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                        title="Edit TDS return"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#cda052]" />
                      </button>
                      <button
                        onClick={() => handleDeleteTds(item.id, item.form)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                        title="Delete TDS return"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add / Edit Advance Tax Installment */}
      {isAdvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#cda052]" />
                <span>{editingAdvId ? 'Edit Advance Tax Installment' : 'Add Advance Tax Installment'}</span>
              </h3>
              <button
                onClick={() => setIsAdvModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdv} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Installment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Installment 3 (75% Cumulative)"
                  value={advQuarter}
                  onChange={(e) => setAdvQuarter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Due Date Label</label>
                  <input
                    type="text"
                    placeholder="15 December"
                    value={advDueDate}
                    onChange={(e) => setAdvDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Statutory Date</label>
                  <input
                    type="date"
                    value={advStatutoryDate}
                    onChange={(e) => setAdvStatutoryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Tax Amount (₹)</label>
                  <input
                    type="number"
                    value={advAmount}
                    onChange={(e) => setAdvAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Filing Status</label>
                  <select
                    value={advStatus}
                    onChange={(e) => setAdvStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="filed">Filed / Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Challan / BSR Reference</label>
                <input
                  type="text"
                  placeholder="e.g. BSR-0099412-280 or Pending Challan 280"
                  value={advChallanNo}
                  onChange={(e) => setAdvChallanNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdvModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                >
                  {editingAdvId ? 'Update Installment' : 'Save Installment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit TDS Return */}
      {isTdsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#cda052]" />
                <span>{editingTdsId ? 'Edit TDS Statutory Return' : 'Add TDS Statutory Return'}</span>
              </h3>
              <button
                onClick={() => setIsTdsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTds} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Return Form *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Form 26Q (Vendor / Job-work TDS)"
                  value={tdsForm}
                  onChange={(e) => setTdsForm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Tax Period *</label>
                  <input
                    type="text"
                    required
                    placeholder="Q3 (Oct - Dec)"
                    value={tdsPeriod}
                    onChange={(e) => setTdsPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    value={tdsDueDate}
                    onChange={(e) => setTdsDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Deduction Amount (₹)</label>
                  <input
                    type="number"
                    value={tdsAmount}
                    onChange={(e) => setTdsAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Status</label>
                  <select
                    value={tdsStatus}
                    onChange={(e) => setTdsStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="in_progress">In Progress</option>
                    <option value="filed">Filed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Lead Signatory</label>
                  <input
                    type="text"
                    placeholder="Tax Consultant / Finance Lead"
                    value={tdsLead}
                    onChange={(e) => setTdsLead(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Token / Ack Number</label>
                  <input
                    type="text"
                    placeholder="ACK-26Q-OCT26-89"
                    value={tdsToken}
                    onChange={(e) => setTdsToken(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTdsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                >
                  {editingTdsId ? 'Update Return' : 'Save Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
