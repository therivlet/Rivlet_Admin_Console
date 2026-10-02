'use client';

import React, { useMemo, useState } from 'react';
import {
  Wallet,
  Plus,
  X,
  Save,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  IndianRupee,
  Receipt,
  ArrowDownRight,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  ArrowUpDown
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { BudgetItem, CashInflowEntry, BudgetSpendEntry } from '@/lib/types';
import ModalPortal from '@/components/ui/ModalPortal';
import { useConfirm } from '@/lib/confirmContext';
import BudgetAnalyticsGraph from '@/components/budget/BudgetAnalyticsGraph';

function emptyItem(): Omit<BudgetItem, 'createdAt' | 'updatedAt'> {
  return { id: `bud-${Date.now()}`, category: '', plannedAmount: 0, actualAmount: 0, spendLog: [], currency: '₹' };
}

function formatINR(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export default function BudgetPage() {
  const confirm = useConfirm();
  const {
    budgetItems,
    budgetSettings,
    cashInflows,
    saveBudgetItem,
    deleteBudgetItem,
    saveBudgetSettings,
    saveCashInflow,
    deleteCashInflow,
    logBudgetSpend,
    updateBudgetSpend,
    deleteBudgetSpend,
  } = useAdminStore();

  const [modalItem, setModalItem] = useState<BudgetItem | Omit<BudgetItem, 'createdAt' | 'updatedAt'> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  // Category Spend Logging Modal state
  const [spendTarget, setSpendTarget] = useState<BudgetItem | null>(null);
  const [spendAmount, setSpendAmount] = useState('');
  const [spendDate, setSpendDate] = useState(new Date().toISOString().slice(0, 10));
  const [spendNote, setSpendNote] = useState('');
  const [spendError, setSpendError] = useState<string | null>(null);

  // Spend Edit Modal state
  const [editingSpend, setEditingSpend] = useState<{ categoryId: string; spend: BudgetSpendEntry; categoryName: string } | null>(null);
  const [editSpendAmount, setEditSpendAmount] = useState('');
  const [editSpendDate, setEditSpendDate] = useState('');
  const [editSpendNote, setEditSpendNote] = useState('');
  const [editSpendError, setEditSpendError] = useState<string | null>(null);

  // Capital Inflow / Injection Modal state
  const [isInflowModalOpen, setIsInflowModalOpen] = useState(false);
  const [inflowAmount, setInflowAmount] = useState('');
  const [inflowDate, setInflowDate] = useState(new Date().toISOString().slice(0, 10));
  const [inflowSource, setInflowSource] = useState('Founder Investment');
  const [inflowNote, setInflowNote] = useState('');
  const [inflowError, setInflowError] = useState<string | null>(null);

  // Capital Inflow list expand limit (view more / view fewer)
  const [showAllInflows, setShowAllInflows] = useState(false);

  // Total Planned Ceiling Editor
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [totalInput, setTotalInput] = useState('');

  const sumPlanned = useMemo(() => budgetItems.reduce((sum, b) => sum + b.plannedAmount, 0), [budgetItems]);
  const totals = useMemo(() => {
    const planned = budgetSettings.totalPlannedOverride ?? sumPlanned;
    const actual = budgetItems.reduce((sum, b) => sum + b.actualAmount, 0);
    return { planned, actual, remaining: planned - actual };
  }, [budgetItems, budgetSettings, sumPlanned]);

  const toggleExpand = (id: string) => setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // Handlers for Category
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

  const handleOpenEditSpend = (categoryId: string, categoryName: string, entry: BudgetSpendEntry) => {
    setEditingSpend({ categoryId, categoryName, spend: entry });
    setEditSpendAmount(String(entry.amount));
    setEditSpendDate(entry.date || new Date().toISOString().slice(0, 10));
    setEditSpendNote(entry.note || '');
    setEditSpendError(null);
  };

  const handleSaveEditSpend = async () => {
    if (!editingSpend) return;
    const amount = Number(editSpendAmount);
    if (!amount || amount <= 0) {
      setEditSpendError('Enter a valid spend amount greater than zero.');
      return;
    }
    setEditSpendError(null);
    await updateBudgetSpend(
      editingSpend.categoryId,
      editingSpend.spend.id,
      amount,
      editSpendDate || new Date().toISOString().slice(0, 10),
      editSpendNote.trim() || undefined
    );
    setEditingSpend(null);
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

  // Handlers for Cash Inflow
  const handleSaveInflow = async () => {
    const amount = Number(inflowAmount);
    if (!amount || amount <= 0) {
      setInflowError('Enter a valid capital injection amount greater than zero.');
      return;
    }
    setInflowError(null);
    const newEntry: CashInflowEntry = {
      id: `inf-${Date.now()}`,
      amount,
      date: inflowDate || new Date().toISOString().slice(0, 10),
      source: inflowSource.trim() || 'Founder Investment',
      note: inflowNote.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await saveCashInflow(newEntry);
    setIsInflowModalOpen(false);
    setInflowAmount('');
    setInflowNote('');
  };

  const handleDeleteInflow = async (inflow: CashInflowEntry) => {
    const ok = await confirm({
      title: 'Remove Capital Injection',
      message: `Remove capital inflow of ${formatINR(inflow.amount)} from ${inflow.source}? This will adjust your tracked available cash balance.`,
      confirmLabel: 'Remove Inflow',
      danger: true,
    });
    if (!ok) return;
    await deleteCashInflow(inflow.id);
  };

  const todayStr = new Date().toISOString().slice(0, 10);

  // Sort inflows: newest dates first (scheduled future, then newest past)
  const sortedInflows = useMemo(() => {
    return [...cashInflows].sort((a, b) => b.date.localeCompare(a.date));
  }, [cashInflows]);

  const displayedInflows = showAllInflows ? sortedInflows : sortedInflows.slice(0, 3);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header — Clean & uncluttered without duplicate buttons */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] uppercase tracking-wider font-mono">
            Rivlet Financials
          </span>
          <span className="text-xs text-[#94a3b8] font-medium">• Drop 1 Launch</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <Wallet className="w-6 h-6 text-[#cda052]" />
          Launch Budget & Cashflow Tracker
        </h1>
        <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">
          Planned budget ceiling vs. staged capital injections vs. actual production spend.
        </p>
      </div>

      {/* Modern Multi-Lined & Multi-Colored Analytics Graph at the Top */}
      <BudgetAnalyticsGraph
        budgetItems={budgetItems}
        totalPlanned={totals.planned}
        cashInflows={cashInflows}
      />

      {/* Capital Inflows & Cashflow Staging Section — With Single Consolidated Action Button & Compact View Limit */}
      <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#182032]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Capital Injections & Cashflow Staging
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 font-mono">
                  {cashInflows.length} Record{cashInflows.length === 1 ? '' : 's'}
                </span>
              </h2>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">
                Staged founder injections (e.g. initial tranche now, subsequent tranche in 5 days).
              </p>
            </div>
          </div>

          {/* SINGLE DEDICATED "+ Record Capital Inflow" BUTTON */}
          <button
            onClick={() => {
              setIsInflowModalOpen(true);
              setInflowAmount('');
              setInflowDate(todayStr);
              setInflowSource('Founder Investment');
              setInflowNote('');
              setInflowError(null);
            }}
            title="Record capital investment or schedule future tranche"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-sm transition-all self-start sm:self-auto flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Record Capital Inflow</span>
          </button>
        </div>

        {/* Compact List of Inflows: Recent at top, older scroll/view more */}
        <div className="mt-3">
          {cashInflows.length === 0 ? (
            <p className="text-xs text-[#7c869d] text-center py-4">
              No capital injections logged yet. Click &quot;Record Capital Inflow&quot; to add initial capital or schedule upcoming tranches.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {displayedInflows.map((inf) => {
                  const isFuture = inf.date > todayStr;
                  return (
                    <div
                      key={inf.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        isFuture
                          ? 'bg-[#0a1017] border-purple-900/40'
                          : 'bg-[#080b12] border-[#1c2438]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-mono">
                              {formatINR(inf.amount)}
                            </span>
                            {isFuture ? (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950/80 text-purple-300 border border-purple-800 font-mono font-semibold flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> Scheduled
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Injected
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#cda052] font-medium mt-0.5">{inf.source}</p>
                        </div>

                        <button
                          onClick={() => handleDeleteInflow(inf)}
                          title="Delete inflow entry"
                          aria-label="Delete inflow entry"
                          className="text-[#7c869d] hover:text-rose-400 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="pt-2 border-t border-[#141b2a] flex items-center justify-between text-[11px] text-[#94a3b8]">
                        <span className="font-mono text-[#cbd5e1]">
                          {new Date(inf.date + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {inf.note && <span className="truncate max-w-[130px] text-[#7c869d]">{inf.note}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View More / View Fewer Toggle Button if more than 3 records */}
              {sortedInflows.length > 3 && (
                <div className="pt-2 flex items-center justify-between text-xs text-[#94a3b8]">
                  <span>Showing {displayedInflows.length} of {sortedInflows.length} staged capital entries</span>
                  <button
                    onClick={() => setShowAllInflows((v) => !v)}
                    className="flex items-center gap-1 text-xs text-[#cda052] hover:underline font-semibold"
                  >
                    <span>{showAllInflows ? 'Show Fewer (Top 3)' : `View All (${sortedInflows.length}) Inflows`}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllInflows ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Category Spending Header with ADD CATEGORY BUTTON MOVED RIGHT HERE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#cda052]" />
            Budget Categories & Expenditure Ledger
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Granular phase allocations, spend logs, and remaining capacity.
          </p>
        </div>

        {/* Action Row: ADD CATEGORY BUTTON MOVED HERE + Planned Cap Editor */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Add Category Button positioned directly with category section */}
          <button
            onClick={() => {
              setModalItem(emptyItem());
              setError(null);
            }}
            title="Add a new budget category"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs font-bold hover:shadow-glow transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Category</span>
          </button>

          {/* Total Planned inline editor */}
          <div className="flex items-center gap-2 bg-[#0e121b] border border-[#1e2638] px-3 py-1.5 rounded-xl text-xs">
            <span className="text-[#94a3b8]">Planned Cap:</span>
            {isEditingTotal ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={totalInput}
                  onChange={(e) => setTotalInput(e.target.value)}
                  placeholder={String(sumPlanned)}
                  autoFocus
                  className="w-28 px-2 py-0.5 rounded bg-[#07090e] border border-[#2b3752] text-xs text-white font-mono"
                />
                <button onClick={handleSaveTotal} className="px-2 py-0.5 rounded bg-[#cda052] text-black font-semibold text-[10px]">
                  Save
                </button>
                <button onClick={() => setIsEditingTotal(false)} className="text-[10px] text-[#94a3b8] hover:text-white">
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                <span>{formatINR(totals.planned)}</span>
                <button
                  onClick={() => {
                    setIsEditingTotal(true);
                    setTotalInput(budgetSettings.totalPlannedOverride !== undefined ? String(budgetSettings.totalPlannedOverride) : '');
                  }}
                  title="Edit total planned ceiling"
                  className="text-[#94a3b8] hover:text-[#cda052] p-0.5"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE SCREEN ALIGNED CATEGORY CARDS (< sm)                     */}
      {/* ============================================================== */}
      <div className="block sm:hidden space-y-3">
        {budgetItems.map((b) => {
          const pct = b.plannedAmount > 0 ? Math.round((b.actualAmount / b.plannedAmount) * 100) : 0;
          const isOver = pct > 100;
          const isExpanded = expandedRows[b.id];
          const remaining = (b.plannedAmount || 0) - (b.actualAmount || 0);

          return (
            <div
              key={b.id}
              className="bg-[#0e121b] border border-[#1e2638] rounded-xl p-4 shadow-md space-y-3 transition-all"
            >
              {/* Category Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 pr-1">
                  <h3 className="text-sm font-semibold text-white leading-snug break-words">
                    {b.category}
                  </h3>
                  {b.phase && (
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[#131a29] text-[#94a3b8] font-mono mt-1 border border-[#1c2438]">
                      {b.phase}
                    </span>
                  )}
                </div>

                {/* Mobile Action Buttons: Spent, Edit, Delete */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setSpendTarget(b);
                      setSpendAmount('');
                      setSpendDate(todayStr);
                      setSpendNote('');
                      setSpendError(null);
                    }}
                    title="Log a spend against this category"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141b2a] border border-[#2b3752] text-[#e6c875] hover:text-white text-[11px] font-semibold active:scale-95 transition-all shadow-sm"
                  >
                    <Receipt className="w-3 h-3" /> Spent
                  </button>
                  <button
                    onClick={() => {
                      setModalItem(b);
                      setError(null);
                    }}
                    title="Edit category"
                    aria-label={`Edit ${b.category}`}
                    className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#cda052] bg-[#080b12] border border-[#1c2438]"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id, b.category)}
                    title="Delete category"
                    aria-label={`Delete ${b.category}`}
                    className="p-1.5 rounded-lg text-[#94a3b8] hover:text-rose-400 bg-[#080b12] border border-[#1c2438]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3-Column Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 bg-[#080b12] border border-[#182032] p-2.5 rounded-lg text-center">
                <div>
                  <div className="text-[10px] text-[#7c869d] uppercase tracking-wider font-semibold">Planned</div>
                  <div className="font-mono font-bold text-white text-xs mt-0.5">{formatINR(b.plannedAmount)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#7c869d] uppercase tracking-wider font-semibold">Spent</div>
                  <div className={`font-mono font-bold text-xs mt-0.5 ${isOver ? 'text-rose-400' : 'text-[#cbd5e1]'}`}>
                    {formatINR(b.actualAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[#7c869d] uppercase tracking-wider font-semibold">Balance</div>
                  <div className={`font-mono font-bold text-xs mt-0.5 ${remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatINR(Math.abs(remaining))}
                  </div>
                </div>
              </div>

              {/* Progress Bar & Status Pill */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#7c869d]">Budget Utilization</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isOver
                        ? 'bg-rose-950/70 text-rose-300'
                        : pct > 80
                        ? 'bg-amber-950/70 text-amber-300'
                        : 'bg-emerald-950/70 text-emerald-300'
                    }`}
                  >
                    {pct}% Used
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#182032] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : 'bg-[#cda052]'
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>

              {/* Spend Log Drawer with EDIT AND DELETE OPTIONS */}
              {b.spendLog && b.spendLog.length > 0 && (
                <div className="pt-2 border-t border-[#182032]">
                  <button
                    onClick={() => toggleExpand(b.id)}
                    className="w-full flex items-center justify-between py-1 text-xs text-[#94a3b8] hover:text-white"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <Receipt className="w-3 h-3 text-[#cda052]" />
                      Spend History ({b.spendLog.length} record{b.spendLog.length === 1 ? '' : 's'})
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="space-y-1.5 mt-2">
                      {[...b.spendLog]
                        .sort((x, y) => y.date.localeCompare(x.date))
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-[#080b12] border border-[#1c2438] rounded-lg p-2.5 flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-white font-bold">{formatINR(entry.amount)}</span>
                                <span className="text-[#7c869d] font-mono text-[10px]">
                                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              {entry.note && <div className="text-[11px] text-[#94a3b8] truncate mt-0.5">{entry.note}</div>}
                            </div>

                            {/* Edit & Delete Actions for Spend */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => handleOpenEditSpend(b.id, b.category, entry)}
                                className="text-[#7c869d] hover:text-[#cda052] p-1.5 rounded transition-colors"
                                title="Edit spend entry"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSpend(b.id, entry.id, entry.amount, entry.note)}
                                className="text-[#7c869d] hover:text-rose-400 p-1.5 rounded transition-colors"
                                title="Delete spend entry"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {budgetItems.length === 0 && (
          <div className="p-8 text-center bg-[#0e121b] border border-[#1e2638] rounded-xl text-xs text-[#94a3b8]">
            No budget categories yet. Tap &quot;Add Category&quot; to begin.
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* DESKTOP TABLE VIEW (sm:block)                                   */}
      {/* ============================================================== */}
      <div className="hidden sm:block rounded-2xl border border-[#1a1f2c] bg-[#0e121b] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1f2c] text-[11px] text-[#94a3b8] uppercase tracking-wide bg-[#0a0d14]">
                <th className="text-left px-4 py-3 font-semibold w-8"></th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Phase</th>
                <th className="text-right px-4 py-3 font-semibold">Planned</th>
                <th className="text-right px-4 py-3 font-semibold">Spent</th>
                <th className="text-right px-4 py-3 font-semibold">Remaining</th>
                <th className="text-right px-4 py-3 font-semibold">% Used</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {budgetItems.map((b) => {
                const pct = b.plannedAmount > 0 ? Math.round((b.actualAmount / b.plannedAmount) * 100) : 0;
                const isExpanded = expandedRows[b.id];
                const remaining = (b.plannedAmount || 0) - (b.actualAmount || 0);

                return (
                  <React.Fragment key={b.id}>
                    <tr className="border-b border-[#161a26] group hover:bg-[#0a0c12]/60 transition-colors">
                      <td className="px-4 py-3">
                        {b.spendLog.length > 0 && (
                          <button
                            onClick={() => toggleExpand(b.id)}
                            title="Show spend history"
                            className="text-[#7c869d] hover:text-white"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{b.category}</td>
                      <td className="px-4 py-3 text-[#94a3b8] font-mono text-xs">{b.phase || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#cbd5e1] whitespace-nowrap">{formatINR(b.plannedAmount)}</td>
                      <td className="px-4 py-3 text-right font-mono text-[#cbd5e1] whitespace-nowrap">{formatINR(b.actualAmount)}</td>
                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        <span className={remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatINR(Math.abs(remaining))}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className={`font-mono text-xs font-semibold ${pct > 100 ? 'text-rose-400' : pct > 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {pct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setSpendTarget(b);
                              setSpendAmount('');
                              setSpendDate(todayStr);
                              setSpendNote('');
                              setSpendError(null);
                            }}
                            title="Log a spend against this category"
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141724] border border-[#263148] text-[#e6c875] hover:text-white text-[11px] font-semibold transition-colors"
                          >
                            <Receipt className="w-3 h-3" /> Spent
                          </button>
                          <button
                            onClick={() => {
                              setModalItem(b);
                              setError(null);
                            }}
                            title="Edit category"
                            aria-label={`Edit ${b.category}`}
                            className="p-1.5 rounded text-[#94a3b8] hover:text-[#cda052] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(b.id, b.category)}
                            title="Delete"
                            aria-label={`Delete ${b.category}`}
                            className="p-1.5 rounded text-[#94a3b8] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Spend Log Expanded Row with EDIT PENCIL */}
                    {isExpanded && b.spendLog.length > 0 && (
                      <tr className="bg-[#07090e] border-b border-[#161a26]">
                        <td></td>
                        <td colSpan={7} className="px-4 py-3">
                          <div className="space-y-1.5">
                            {[...b.spendLog]
                              .sort((x, y) => y.date.localeCompare(x.date))
                              .map((entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center justify-between text-xs bg-[#0e121b] border border-[#1c2438] rounded-lg px-3 py-2"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-[#7c869d] font-mono flex-shrink-0">
                                      {new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                      })}
                                    </span>
                                    <span className="font-mono text-white font-bold flex-shrink-0">
                                      {formatINR(entry.amount)}
                                    </span>
                                    {entry.note && <span className="text-[#94a3b8] truncate">{entry.note}</span>}
                                  </div>

                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => handleOpenEditSpend(b.id, b.category, entry)}
                                      title="Edit spend entry"
                                      aria-label="Edit spend entry"
                                      className="text-[#7c869d] hover:text-[#cda052] p-1 transition-colors"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSpend(b.id, entry.id, entry.amount, entry.note)}
                                      title="Remove this spend entry"
                                      aria-label="Remove spend entry"
                                      className="text-[#7c869d] hover:text-rose-400 p-1 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
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
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#94a3b8] text-sm">
                    No budget categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      <ModalPortal isOpen={!!modalItem}>
        {modalItem && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setModalItem(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Budget category details"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">
                  {(modalItem as BudgetItem).createdAt ? 'Edit Category' : 'Add Category'}
                </h2>
                <button
                  onClick={() => setModalItem(null)}
                  aria-label="Close"
                  title="Close"
                  className="text-[#94a3b8] hover:text-white"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {error && (
                <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Category *</label>
                  <input
                    value={modalItem.category}
                    onChange={(e) => setModalItem({ ...modalItem, category: e.target.value })}
                    placeholder="e.g. First Production (1,580 pieces)"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Planned Amount (₹)</label>
                  <input
                    type="number"
                    value={modalItem.plannedAmount}
                    onChange={(e) => setModalItem({ ...modalItem, plannedAmount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white font-mono focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>
                <div className="px-3 py-2 rounded-lg bg-[#07090e] border border-[#1c2438] text-xs text-[#7c869d]">
                  Spent amount is tracked from logged entries — use the{' '}
                  <strong className="text-[#e6c875]">Spent</strong> button on the category row to record spend.
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Phase</label>
                  <input
                    value={modalItem.phase || ''}
                    onChange={(e) => setModalItem({ ...modalItem, phase: e.target.value })}
                    placeholder="e.g. Phase 3: Manufacturing"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Notes</label>
                  <textarea
                    value={modalItem.notes || ''}
                    onChange={(e) => setModalItem({ ...modalItem, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setModalItem(null)}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  title="Save category"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold disabled:opacity-60"
                >
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
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setSpendTarget(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Log a spend entry"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#cda052]" /> Log Spend
                </h2>
                <button
                  onClick={() => setSpendTarget(null)}
                  aria-label="Close"
                  title="Close"
                  className="text-[#94a3b8] hover:text-white"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
              <p className="text-xs text-[#94a3b8] mb-3">
                Against <strong className="text-white">{spendTarget.category}</strong>
              </p>

              {spendError && (
                <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">
                  {spendError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Amount (₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7c869d]" />
                    <input
                      type="number"
                      value={spendAmount}
                      onChange={(e) => setSpendAmount(e.target.value)}
                      autoFocus
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white font-mono focus:outline-none focus:border-[#cda052]/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Date</label>
                  <input
                    type="date"
                    value={spendDate}
                    onChange={(e) => setSpendDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Note</label>
                  <input
                    value={spendNote}
                    onChange={(e) => setSpendNote(e.target.value)}
                    placeholder="e.g. Advance payment to Techno Sportswear"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setSpendTarget(null)}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogSpend}
                  title="Log this spend"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold"
                >
                  <Save className="w-3.5 h-3.5" /> Log Spend
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Edit Existing Spend Modal */}
      <ModalPortal isOpen={!!editingSpend}>
        {editingSpend && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setEditingSpend(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-[#2b3752] bg-[#0a0c12] p-5 sm:p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Edit spend entry"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-[#cda052]" /> Edit Spend Entry
                </h2>
                <button
                  onClick={() => setEditingSpend(null)}
                  aria-label="Close"
                  title="Close"
                  className="text-[#94a3b8] hover:text-white"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <p className="text-xs text-[#94a3b8] mb-3">
                In category <strong className="text-white">{editingSpend.categoryName}</strong>
              </p>

              {editSpendError && (
                <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">
                  {editSpendError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Correct Amount (₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7c869d]" />
                    <input
                      type="number"
                      value={editSpendAmount}
                      onChange={(e) => setEditSpendAmount(e.target.value)}
                      autoFocus
                      placeholder="0"
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white font-mono focus:outline-none focus:border-[#cda052]/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Date</label>
                  <input
                    type="date"
                    value={editSpendDate}
                    onChange={(e) => setEditSpendDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Note</label>
                  <input
                    value={editSpendNote}
                    onChange={(e) => setEditSpendNote(e.target.value)}
                    placeholder="e.g. Courier or sample deposit note"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setEditingSpend(null)}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditSpend}
                  title="Save changes"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Capital Inflow Modal */}
      <ModalPortal isOpen={isInflowModalOpen}>
        {isInflowModalOpen && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setIsInflowModalOpen(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-emerald-800/50 bg-[#0a0d14] p-5 sm:p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Add Capital Injection"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <ArrowDownRight className="w-4 h-4 text-emerald-400" /> Record Capital Inflow
                </h2>
                <button
                  onClick={() => setIsInflowModalOpen(false)}
                  aria-label="Close"
                  title="Close"
                  className="text-[#94a3b8] hover:text-white"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <p className="text-xs text-[#94a3b8] mb-3">
                Deposit cash into the launch fund now or schedule future capital additions.
              </p>

              {inflowError && (
                <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">
                  {inflowError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Inflow Amount (₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7c869d]" />
                    <input
                      type="number"
                      value={inflowAmount}
                      onChange={(e) => setInflowAmount(e.target.value)}
                      autoFocus
                      placeholder="e.g. 250000"
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Deposit / Scheduled Date</label>
                  <input
                    type="date"
                    value={inflowDate}
                    onChange={(e) => setInflowDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  {inflowDate > todayStr && (
                    <p className="text-[10px] text-purple-400 mt-1 font-mono">
                      📅 Scheduled future injection (in {Math.ceil((new Date(inflowDate).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24))} days)
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Source / Contributor</label>
                  <select
                    value={inflowSource}
                    onChange={(e) => setInflowSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-emerald-500/50 mb-1.5"
                  >
                    <option value="Founder Investment">Founder Investment / Self-Funded</option>
                    <option value="Founder Investment (Tranche 2)">Founder Investment (Tranche 2)</option>
                    <option value="Co-Founder Capital">Co-Founder Capital</option>
                    <option value="Angel Partner">Angel Partner / Investor</option>
                    <option value="Working Capital / Bank">Working Capital / Bank Credit</option>
                    <option value="Custom">Custom Source</option>
                  </select>
                  {inflowSource === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Specify contributor..."
                      onChange={(e) => setInflowSource(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0e121b] border border-[#1f2638] text-xs text-white"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Notes / Allocation Intent</label>
                  <input
                    value={inflowNote}
                    onChange={(e) => setInflowNote(e.target.value)}
                    placeholder="e.g. Sampling advances & initial tech pack tranche"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setIsInflowModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveInflow}
                  title="Record Inflow"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-semibold hover:brightness-110 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" /> Save Inflow
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
