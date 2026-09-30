'use client';

import React, { useMemo, useState } from 'react';
import { Wallet, Plus, X, Save, Trash2, Pencil, TrendingUp, TrendingDown } from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { BudgetItem } from '@/lib/types';
import ModalPortal from '@/components/ui/ModalPortal';

function emptyItem(): Omit<BudgetItem, 'createdAt' | 'updatedAt'> {
  return { id: `bud-${Date.now()}`, category: '', plannedAmount: 0, actualAmount: 0, currency: '₹' };
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function BudgetPage() {
  const { budgetItems, saveBudgetItem, deleteBudgetItem } = useAdminStore();
  const [modalItem, setModalItem] = useState<BudgetItem | Omit<BudgetItem, 'createdAt' | 'updatedAt'> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    const planned = budgetItems.reduce((sum, b) => sum + b.plannedAmount, 0);
    const actual = budgetItems.reduce((sum, b) => sum + b.actualAmount, 0);
    return { planned, actual, remaining: planned - actual };
  }, [budgetItems]);

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
      createdAt: (modalItem as BudgetItem).createdAt || now,
      updatedAt: now,
    };
    await saveBudgetItem(full);
    setIsSaving(false);
    setModalItem(null);
  };

  const handleDelete = async (id: string, category: string) => {
    if (!confirm(`Remove budget line "${category}"?`)) return;
    await deleteBudgetItem(id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-[#cda052]" />
            Launch Budget Tracker
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">Planned vs. actual spend against the ₹15L launch budget.</p>
        </div>
        <button
          onClick={() => { setModalItem(emptyItem()); setError(null); }}
          title="Add a new budget line item"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold hover:shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" /> Add Line Item
        </button>
      </div>

      {/* Totals summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-[#1a1f2c] bg-[#0e121b] p-4">
          <p className="text-[11px] text-[#94a3b8] uppercase tracking-wide">Total Planned</p>
          <p className="text-xl font-bold text-white mt-1 font-mono">{formatINR(totals.planned)}</p>
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
              <th className="text-left px-4 py-3 font-semibold">Category</th>
              <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Phase</th>
              <th className="text-right px-4 py-3 font-semibold">Planned</th>
              <th className="text-right px-4 py-3 font-semibold">Actual</th>
              <th className="text-right px-4 py-3 font-semibold">% Used</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.map((b) => {
              const pct = b.plannedAmount > 0 ? Math.round((b.actualAmount / b.plannedAmount) * 100) : 0;
              return (
                <tr key={b.id} className="border-b border-[#161a26] group hover:bg-[#0a0c12]/60">
                  <td className="px-4 py-3 text-white">{b.category}</td>
                  <td className="px-4 py-3 text-[#94a3b8] hidden sm:table-cell">{b.phase || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#cbd5e1]">{formatINR(b.plannedAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#cbd5e1]">{formatINR(b.actualAmount)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono text-xs ${pct > 100 ? 'text-rose-400' : pct > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>{pct}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setModalItem(b); setError(null); }} title="Edit" aria-label={`Edit ${b.category}`} className="p-1.5 rounded text-[#94a3b8] hover:text-[#cda052]">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(b.id, b.category)} title="Delete" aria-label={`Delete ${b.category}`} className="p-1.5 rounded text-[#94a3b8] hover:text-rose-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {budgetItems.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[#94a3b8] text-sm">No budget line items yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <ModalPortal isOpen={!!modalItem}>
        {modalItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setModalItem(null)}>
            <div
              className="w-full max-w-md rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Budget line item details"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">{(modalItem as BudgetItem).createdAt ? 'Edit Line Item' : 'Add Line Item'}</h2>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Planned Amount</label>
                    <input type="number" value={modalItem.plannedAmount} onChange={(e) => setModalItem({ ...modalItem, plannedAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Actual Amount</label>
                    <input type="number" value={modalItem.actualAmount} onChange={(e) => setModalItem({ ...modalItem, actualAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
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
                <button onClick={handleSave} disabled={isSaving} title="Save line item" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
