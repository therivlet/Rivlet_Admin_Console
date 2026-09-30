'use client';

import React, { useMemo, useState } from 'react';
import { Wallet, Plus, X, Save, Trash2, Pencil, TrendingUp, TrendingDown, ChevronDown, ChevronRight, IndianRupee, Receipt } from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { BudgetItem } from '@/lib/types';
import ModalPortal from '@/components/ui/ModalPortal';
import { useConfirm } from '@/lib/confirmContext';

function emptyItem(): Omit<BudgetItem, 'createdAt' | 'updatedAt'> {
  return { id: `bud-${Date.now()}`, category: '', plannedAmount: 0, actualAmount: 0, spendLog: [], currency: '₹' };
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function BudgetPage() {
  const confirm = useConfirm();
  const { budgetItems, budgetSettings, saveBudgetItem, deleteBudgetItem, saveBudgetSettings, logBudgetSpend, deleteBudgetSpend } = useAdminStore();
  const [modalItem, setModalItem] = useState<BudgetItem | Omit<BudgetItem, 'createdAt' | 'updatedAt'> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [spendTarget, setSpendTarget] = useState<BudgetItem | null>(null);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendDate, setSpendDate] = useState(new Date().toISOString().slice(0, 10));
  const [spendNote, setSpendNote] = useState('');
  const [spendError, setSpendError] = useState<string | null>(null);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState('');

  const sumPlanned = useMemo(() => budgetItems.reduce((sum, b) => sum + b.plannedAmount, 0), [budgetItems]);
  const totals = useMemo(() => {
    const planned = budgetSettings.totalPlannedOverride ?? sumPlanned;
    const actual = budgetItems.reduce((sum, b) => sum + b.actualAmount, 0);
    return { planned, actual, remaining: planned - actual };
  }, [budgetItems, budgetSettings, sumPlanned]);

  const toggleExpand = (id: string) => setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleSave = async () => {
    if (!modalItem) return;
    if (!modalItem.category || modalItem.category.trim().length < 2) {
      setError('Category name is required.');
      return;
    }
    setError(null);
    setIsSaving(true);
    const now = new Date().toISOString();
    const full: BudgetItem = {
      ...(modalItem as BudgetItem),
      category: modalItem.category.trim(),
      spendLog: (modalItem as BudgetItem).spendLog || [],
      createdAt: (modalItem as BudgetItem).createdAt || now,
      updatedAt: now,
    };
    await saveBudgetItem(full);
    setIsSaving(false);
    setModalItem(null);
  };

  const handleDelete = async (id: string, category: string) => {
    const target = budgetItems.find((b) => b.id === id);
    const spendCount = target?.spendLog?.length || 0;
    const ok = await confirm({
      title: 'Remove Budget Category',
      message: `Are you sure you want to remove "${category}"? Its entire spend history (${spendCount} logged transaction${spendCount === 1 ? '' : 's'}) will be permanently deleted.`,
      confirmLabel: 'Remove Category',
      danger: true,
    });
    if (!ok) return;
    await deleteBudgetItem(id);
  };

  const handleDeleteSpend = async (budgetItemId: string, spendId: string, amount: number, note?: string) => {
    const ok = await confirm({
      title: 'Remove Spend Entry',
      message: `Remove logged expenditure of ${formatINR(amount)}${note ? ` ("${note}")` : ''}? This will decrease actual spend for this category.`,
      confirmLabel: 'Remove Entry',
      danger: true,
    });
    if (!ok) return;
    await deleteBudgetSpend(budgetItemId, spendId);
  };

  const handleLogSpend = async () => {
    if (!spendTarget) return;
    const amount = Number(spendAmount);
    if (!amount || amount <= 0) {
      setSpendError('Enter a spend amount greater than zero.');
      return;
    }
    setSpendError(null);
    await logBudgetSpend(spendTarget.id, amount, spendDate, spendNote.trim() || undefined);
    setSpendTarget(null);
    setSpendAmount('');
    setSpendNote('');
  };

  const handleSaveTotal = async () => {
    const value = totalInput.trim() === '' ? undefined : Number(totalInput);
    await saveBudgetSettings({ totalPlannedOverride: value });
    setIsEditingTotal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-[#cda052]" />
            Launch Budget Tracker
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">Planned vs. actual spend against your fixed launch budget.</p>
        </div>
        <button
          onClick={() => { setModalItem(emptyItem()); setError(null); }}
          title="Add a new budget category"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold hover:shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Totals summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-[#1a1f2c] bg-[#0e121b] p-4 relative group">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide">Total Planned</p>
            {!isEditingTotal && (
              <button
                onClick={() => { setIsEditingTotal(true); setTotalInput(budgetSettings.totalPlannedOverride !== undefined ? String(budgetSettings.totalPlannedOverride) : ''); }}
                title="Fix the total planned budget to a specific figure"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#94a3b8] hover:text-[#cda052]"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {isEditingTotal ? (
            <div className="mt-2 space-y-2">
              <input
                type="number"
                value={totalInput}
                onChange={(e) => setTotalInput(e.target.value)}
                placeholder={`Sum of categories: ${sumPlanned}`}
                autoFocus
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#1f2638] text-sm text-white font-mono focus:outline-none focus:border-[#cda052]/50"
              />
              <div className="flex items-center gap-2">
                <button onClick={handleSaveTotal} className="px-2.5 py-1 rounded-lg bg-[#cda052] text-black text-xs font-semibold">Save</button>
                <button onClick={() => setIsEditingTotal(false)} className="px-2.5 py-1 rounded-lg text-xs text-[#94a3b8] hover:text-white">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-white mt-1 font-mono">{formatINR(totals.planned)}</p>
              {budgetSettings.totalPlannedOverride !== undefined && Math.round(sumPlanned) !== Math.round(budgetSettings.totalPlannedOverride) && (
                <p className="text-[10px] text-[#7c869d] mt-1">Categories sum to {formatINR(sumPlanned)} — {sumPlanned > totals.planned ? 'over-allocated' : 'still room to add more'}</p>
              )}
            </>
          )}
        </div>
        <div className="rounded-2xl border border-[#1a1f2c] bg-[#0e121b] p-4">
          <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide">Total Spent</p>
          <p className="text-xl font-bold text-white mt-1 font-mono">{formatINR(totals.actual)}</p>
        </div>
        <div className={`rounded-2xl border p-4 ${totals.remaining >= 0 ? 'border-emerald-800/50 bg-emerald-950/20' : 'border-rose-800/50 bg-rose-950/20'}`}>
          <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide flex items-center gap-1">
            {totals.remaining >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-rose-400" />}
            {totals.remaining >= 0 ? 'Remaining' : 'Over Budget'}
          </p>
          <p className={`text-xl font-bold mt-1 font-mono ${totals.remaining >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{formatINR(Math.abs(totals.remaining))}</p>
        </div>
      </div>

      {/* Line items table */}
      <div className="rounded-2xl border border-[#1a1f2c] bg-[#0e121b] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a1f2c] text-[11px] text-[#94a3b8] uppercase tracking-wide">
              <th className="text-left px-4 py-3 font-semibold w-8"></th>
              <th className="text-left px-4 py-3 font-semibold">Category</th>
              <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Phase</th>
              <th className="text-right px-4 py-3 font-semibold">Planned</th>
              <th className="text-right px-4 py-3 font-semibold">Spent</th>
              <th className="text-right px-4 py-3 font-semibold">% Used</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.map((b) => {
              const pct = b.plannedAmount > 0 ? Math.round((b.actualAmount / b.plannedAmount) * 100) : 0;
              const isExpanded = expandedRows[b.id];
              return (
                <React.Fragment key={b.id}>
                  <tr className="border-b border-[#161a26] group hover:bg-[#0a0c12]/60">
                    <td className="px-4 py-3">
                      {b.spendLog.length > 0 && (
                        <button onClick={() => toggleExpand(b.id)} title="Show spend history" className="text-[#7c869d] hover:text-white">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white">{b.category}</td>
                    <td className="px-4 py-3 text-[#94a3b8] hidden sm:table-cell">{b.phase || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#cbd5e1]">{formatINR(b.plannedAmount)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#cbd5e1]">{formatINR(b.actualAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-xs ${pct > 100 ? 'text-rose-400' : pct > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>{pct}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setSpendTarget(b); setSpendAmount(''); setSpendDate(new Date().toISOString().slice(0, 10)); setSpendNote(''); setSpendError(null); }}
                          title="Log a spend against this category"
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#141724] border border-[#263148] text-[#e6c875] hover:text-white text-[11px] font-medium"
                        >
                          <Receipt className="w-3 h-3" /> Spent
                        </button>
                        <button onClick={() => { setModalItem(b); setError(null); }} title="Edit category" aria-label={`Edit ${b.category}`} className="p-1.5 rounded text-[#94a3b8] hover:text-[#cda052] opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(b.id, b.category)} title="Delete" aria-label={`Delete ${b.category}`} className="p-1.5 rounded text-[#94a3b8] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && b.spendLog.length > 0 && (
                    <tr className="bg-[#07090e] border-b border-[#161a26]">
                      <td></td>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="space-y-1.5">
                          {[...b.spendLog].sort((x, y) => y.date.localeCompare(x.date)).map((entry) => (
                            <div key={entry.id} className="flex items-center justify-between text-xs bg-[#0e121b] border border-[#1c2438] rounded-lg px-3 py-2">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-[#7c869d] font-mono flex-shrink-0">{new Date(entry.date).toLocaleDateString()}</span>
                                <span className="font-mono text-white flex-shrink-0">{formatINR(entry.amount)}</span>
                                {entry.note && <span className="text-[#94a3b8] truncate">{entry.note}</span>}
                              </div>
                              <button onClick={() => handleDeleteSpend(b.id, entry.id, entry.amount, entry.note)} title="Remove this spend entry" aria-label="Remove spend entry" className="text-[#7c869d] hover:text-rose-400 flex-shrink-0">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {budgetItems.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-[#94a3b8] text-sm">No budget categories yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Category Modal */}
      <ModalPortal isOpen={!!modalItem}>
        {modalItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setModalItem(null)}>
            <div
              className="w-full max-w-md rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Budget category details"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">{(modalItem as BudgetItem).createdAt ? 'Edit Category' : 'Add Category'}</h2>
                <button onClick={() => setModalItem(null)} aria-label="Close" title="Close" className="text-[#94a3b8] hover:text-white">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {error && <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">{error}</div>}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Category *</label>
                  <input value={modalItem.category} onChange={(e) => setModalItem({ ...modalItem, category: e.target.value })} placeholder="e.g. First Production (1,580 pieces)"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Planned Amount</label>
                  <input type="number" value={modalItem.plannedAmount} onChange={(e) => setModalItem({ ...modalItem, plannedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
                <div className="px-3 py-2 rounded-lg bg-[#07090e] border border-[#1c2438] text-xs text-[#7c869d]">
                  Spent amount is tracked from logged entries — use the <strong className="text-[#e6c875]">Spent</strong> button on the category row to record spend instead of editing it here.
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Phase</label>
                  <input value={modalItem.phase || ''} onChange={(e) => setModalItem({ ...modalItem, phase: e.target.value })} placeholder="e.g. Phase 3"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Notes</label>
                  <textarea value={modalItem.notes || ''} onChange={(e) => setModalItem({ ...modalItem, notes: e.target.value })} rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50 resize-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setModalItem(null)} className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} title="Save category" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Log Spend Modal */}
      <ModalPortal isOpen={!!spendTarget}>
        {spendTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setSpendTarget(null)}>
            <div
              className="w-full max-w-sm rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Log a spend entry"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2"><Receipt className="w-4 h-4 text-[#cda052]" /> Log Spend</h2>
                <button onClick={() => setSpendTarget(null)} aria-label="Close" title="Close" className="text-[#94a3b8] hover:text-white">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              <p className="text-xs text-[#94a3b8] mb-3">Against <strong className="text-white">{spendTarget.category}</strong></p>

              {spendError && <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">{spendError}</div>}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Amount *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7c869d]" />
                    <input type="number" value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)} autoFocus placeholder="0"
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Date</label>
                  <input type="date" value={spendDate} onChange={(e) => setSpendDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Note</label>
                  <input value={spendNote} onChange={(e) => setSpendNote(e.target.value)} placeholder="e.g. Advance payment to Techno Sportswear"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setSpendTarget(null)} className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white">Cancel</button>
                <button onClick={handleLogSpend} title="Log this spend" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold">
                  <Save className="w-3.5 h-3.5" /> Log Spend
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
