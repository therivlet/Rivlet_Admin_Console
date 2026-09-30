'use client';

import React, { useMemo, useState } from 'react';
import { CalendarRange, Plus, X, Save, Trash2, Pencil, ArrowRight } from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { Sprint } from '@/lib/types';
import ModalPortal from '@/components/ui/ModalPortal';
import { useConfirm } from '@/lib/confirmContext';

function emptyItem(defaultDays: number): Omit<Sprint, 'createdAt' | 'updatedAt'> {
  const today = new Date();
  const end = new Date(today.getTime() + defaultDays * 24 * 60 * 60 * 1000);
  return { id: `spr-${Date.now()}`, name: '', startDate: today.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

const LENGTH_PRESETS = [
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '3 Weeks', days: 21 },
  { label: '4 Weeks', days: 28 },
];

function sprintStatus(s: Sprint): 'future' | 'current' | 'past' {
  const today = new Date().toISOString().slice(0, 10);
  if (s.startDate > today) return 'future';
  if (s.endDate < today) return 'past';
  return 'current';
}

const STATUS_COLOR = {
  current: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  future: 'bg-sky-950/60 text-sky-300 border-sky-800/50',
  past: 'bg-[#182030] text-[#94a3b8] border-[#263148]',
};

interface SprintsViewProps {
  onOpenBoard?: (sprintId: string) => void;
}

export default function SprintsView({ onOpenBoard }: SprintsViewProps) {
  const confirm = useConfirm();
  const { sprints, workItems, workSettings, saveSprint, deleteSprint } = useAdminStore();
  const [modalItem, setModalItem] = useState<Sprint | Omit<Sprint, 'createdAt' | 'updatedAt'> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(() => [...sprints].sort((a, b) => a.startDate.localeCompare(b.startDate)), [sprints]);

  const statsFor = (sprintId: string) => {
    const items = workItems.filter((w) => w.sprintId === sprintId);
    const total = items.length;
    const done = items.filter((w) => w.state === 'Closed' || w.state === 'Resolved').length;
    const points = items.reduce((s, w) => s + (w.storyPoints || 0), 0);
    const donePoints = items.filter((w) => w.state === 'Closed' || w.state === 'Resolved').reduce((s, w) => s + (w.storyPoints || 0), 0);
    return { total, done, points, donePoints };
  };

  const handleSave = async () => {
    if (!modalItem) return;
    if (!modalItem.name || modalItem.name.trim().length < 2) { setError('Sprint name is required.'); return; }
    if (modalItem.endDate < modalItem.startDate) { setError('End date must be after the start date.'); return; }
    setError(null);
    setIsSaving(true);
    const now = new Date().toISOString();
    await saveSprint({ ...(modalItem as Sprint), name: modalItem.name.trim(), createdAt: (modalItem as Sprint).createdAt || now, updatedAt: now });
    setIsSaving(false);
    setModalItem(null);
  };

  const handleDelete = async (id: string, name: string) => {
    const assignedCount = workItems.filter((w) => w.sprintId === id).length;
    const ok = await confirm({
      title: 'Delete Sprint',
      message: `Delete sprint "${name}"?${
        assignedCount > 0
          ? ` ${assignedCount} work item${assignedCount === 1 ? '' : 's'} scheduled in this sprint will move back to the unassigned backlog.`
          : ' This action cannot be undone.'
      }`,
      confirmLabel: 'Delete Sprint',
      danger: true,
    });
    if (!ok) return;
    await deleteSprint(id);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <p className="text-sm text-[#94a3b8]">Plan work in fixed windows and track burn-down toward each sprint goal.</p>
        <button onClick={() => { setModalItem(emptyItem(workSettings.defaultSprintLengthDays)); setError(null); }} title="Create a new sprint"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold hover:shadow-glow transition-all flex-shrink-0">
          <Plus className="w-4 h-4" /> New Sprint
        </button>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#1f2638] rounded-2xl">
            <p className="text-sm text-[#94a3b8]">No sprints yet. Create your first one.</p>
          </div>
        ) : (
          sorted.map((s) => {
            const status = sprintStatus(s);
            const stats = statsFor(s.id);
            const pct = stats.points > 0 ? Math.round((stats.donePoints / stats.points) * 100) : 0;
            return (
              <div key={s.id} className="rounded-2xl border border-[#1a1f2c] bg-[#0e121b] p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">{s.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_COLOR[status]}`}>{status}</span>
                    </div>
                    {s.goal && <p className="text-xs text-[#94a3b8]">{s.goal}</p>}
                    <p className="text-[11px] text-[#7c869d] mt-1">{new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => { setModalItem(s); setError(null); }} title="Edit sprint" aria-label={`Edit ${s.name}`} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#cda052] hover:bg-[#141724]">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(s.id, s.name)} title="Delete sprint" aria-label={`Delete ${s.name}`} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-rose-400 hover:bg-rose-950/30">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-1.5 rounded-full bg-[#1a1f2c] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#cda052] to-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-[#94a3b8] flex-shrink-0">{stats.done}/{stats.total} items · {stats.donePoints}/{stats.points} pts</span>
                  <button onClick={() => onOpenBoard?.(s.id)} className="text-[11px] text-[#cda052] hover:underline flex items-center gap-0.5 flex-shrink-0">
                    Board <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ModalPortal isOpen={!!modalItem}>
        {modalItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setModalItem(null)}>
            <div className="w-full max-w-md rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sprint details">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">{(modalItem as Sprint).createdAt ? 'Edit Sprint' : 'New Sprint'}</h2>
                <button onClick={() => setModalItem(null)} aria-label="Close" title="Close" className="text-[#94a3b8] hover:text-white"><X className="w-4.5 h-4.5" /></button>
              </div>
              {error && <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">{error}</div>}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Sprint Name *</label>
                  <input value={modalItem.name} onChange={(e) => setModalItem({ ...modalItem, name: e.target.value })} placeholder="e.g. Sprint 3 — Pre-Production Samples"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Sprint Goal</label>
                  <textarea value={modalItem.goal || ''} onChange={(e) => setModalItem({ ...modalItem, goal: e.target.value })} rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50 resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Start Date</label>
                    <input type="date" value={modalItem.startDate} onChange={(e) => setModalItem({ ...modalItem, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">End Date</label>
                    <input type="date" value={modalItem.endDate} onChange={(e) => setModalItem({ ...modalItem, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Quick Length (recalculates end date from start date)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {LENGTH_PRESETS.map((p) => (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => {
                          const start = new Date(modalItem.startDate);
                          const end = new Date(start.getTime() + p.days * 24 * 60 * 60 * 1000);
                          setModalItem({ ...modalItem, endDate: end.toISOString().slice(0, 10) });
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0e121b] border border-[#1f2638] text-[#cbd5e1] hover:border-[#cda052]/50 hover:text-white transition-colors"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setModalItem(null)} className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} title="Save sprint" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save Sprint'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
