'use client';

import React, { useMemo, useState } from 'react';
import {
  GitBranch,
  Plus,
  X,
  Save,
  Trash2,
  Pencil,
  Factory,
  Package,
  FileText,
  KanbanSquare,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useAdminStore } from '@/lib/store';
import { PipelineItem, PipelineStage } from '@/lib/types';
import ModalPortal from '@/components/ui/ModalPortal';
import { useConfirm } from '@/lib/confirmContext';

const STAGES: PipelineStage[] = [
  'Design Finalized',
  'Proto Sample',
  'Fit Sample',
  'Pre-Production Sample',
  'Approved',
  'PO Issued',
  'In Production',
  'QC Inspection',
  'Shipped',
  'Delivered',
  'On Hold',
];

const CATEGORIES: PipelineItem['category'][] = ["Women's Activewear", "Men's Activewear", 'Athleisure', 'Easy/Casual Wear'];

function emptyItem(): Omit<PipelineItem, 'createdAt' | 'updatedAt'> {
  return {
    id: `pip-${Date.now()}`,
    styleName: '',
    hsnCode: '',
    category: "Women's Activewear",
    drop: 'Drop 1',
    stage: 'Design Finalized',
  };
}

export default function PipelinePage() {
  const confirm = useConfirm();
  const { pipelineItems, savePipelineItem, deletePipelineItem, vendors, documents, workItems } = useAdminStore();
  const [modalItem, setModalItem] = useState<PipelineItem | Omit<PipelineItem, 'createdAt' | 'updatedAt'> | null>(null);
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDrop = async (stage: PipelineStage) => {
    if (!draggingId) return;
    const target = pipelineItems.find((p) => p.id === draggingId);
    setDraggingId(null);
    if (!target || target.stage === stage) return;
    await savePipelineItem({
      ...target,
      stage,
      actualDate: (stage === 'Shipped' || stage === 'Delivered') ? (target.actualDate || new Date().toISOString().slice(0, 10)) : target.actualDate,
    });
  };

  const byStage = useMemo(() => {
    const q = pipelineSearch.toLowerCase().trim();
    const map: Record<string, PipelineItem[]> = {};
    for (const s of STAGES) map[s] = [];
    for (const item of pipelineItems) {
      if (
        !q ||
        item.styleName.toLowerCase().includes(q) ||
        (item.hsnCode && item.hsnCode.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        (item.colorway && item.colorway.toLowerCase().includes(q))
      ) {
        if (!map[item.stage]) map[item.stage] = [];
        map[item.stage].push(item);
      }
    }
    return map;
  }, [pipelineItems, pipelineSearch]);

  const vendorName = (id?: string) => vendors.find((v) => v.id === id)?.name;

  const handleSave = async () => {
    if (!modalItem) return;
    if (!modalItem.styleName || modalItem.styleName.trim().length < 2) {
      setError('Style name is required.');
      return;
    }
    setError(null);
    setIsSaving(true);
    const now = new Date().toISOString();
    const full: PipelineItem = {
      ...(modalItem as PipelineItem),
      styleName: modalItem.styleName.trim(),
      hsnCode: modalItem.hsnCode?.trim() || undefined,
      createdAt: (modalItem as PipelineItem).createdAt || now,
      updatedAt: now,
    };
    await savePipelineItem(full);
    setIsSaving(false);
    setModalItem(null);
  };

  const handleDelete = async (id: string, name: string) => {
    const linkedDocs = documents.filter((d) => d.pipelineItemId === id);
    const ok = await confirm({
      title: 'Remove Pipeline Style',
      message: `Remove "${name}" from the production pipeline?${
        linkedDocs.length > 0
          ? ` Warning: ${linkedDocs.length} linked document${linkedDocs.length === 1 ? '' : 's'} (e.g. tech packs/specs) will be unlinked from this style.`
          : ' This action cannot be undone.'
      }`,
      confirmLabel: 'Remove Style',
      danger: true,
    });
    if (!ok) return;
    await deletePipelineItem(id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <GitBranch className="w-6 h-6 text-[#cda052]" />
            Sampling & Production Pipeline
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Drop 1 styles from proto sample through delivery, at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7c869d]" />
            <input
              type="text"
              value={pipelineSearch}
              onChange={(e) => setPipelineSearch(e.target.value)}
              placeholder="Search styles, HSN code..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0e121b] border border-[#1f2638] text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-[#cda052]/60"
            />
          </div>
          <button
            onClick={() => { setModalItem(emptyItem()); setError(null); }}
            title="Add a new style to the pipeline"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold hover:shadow-glow transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Style
          </button>
        </div>
      </div>

      {/* Kanban-style stage board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage)}
            className="flex-shrink-0 w-64 rounded-2xl border border-[#1a1f2c] bg-[#0a0c12]"
          >
            <div className="px-3 py-2.5 border-b border-[#1a1f2c] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#cbd5e1] uppercase tracking-wide">{stage}</span>
              <span className="text-[10px] font-mono text-[#7c869d] bg-[#141724] px-1.5 py-0.5 rounded">{byStage[stage]?.length || 0}</span>
            </div>
            <div className="p-2.5 space-y-2.5 min-h-[120px]">
              {(byStage[stage] || []).map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggingId(item.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`rounded-xl border border-[#1f2638] bg-[#0e121b] p-3 group cursor-grab active:cursor-grabbing ${draggingId === item.id ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-white">{item.styleName}</p>
                        {item.hsnCode && (
                          <span className="font-mono text-[9px] font-semibold text-[#cda052] bg-[rgba(205,160,82,0.12)] border border-[rgba(205,160,82,0.28)] px-1.5 py-0.5 rounded tracking-wide">
                            HSN: {item.hsnCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#94a3b8] mt-0.5">{item.category}{item.colorway ? ` · ${item.colorway}` : ''}</p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 flex-shrink-0">
                      <button onClick={() => { setModalItem(item); setError(null); }} title="Edit" aria-label={`Edit ${item.styleName}`} className="p-1 rounded text-[#94a3b8] hover:text-[#cda052]">
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(item.id, item.styleName)} title="Delete" aria-label={`Delete ${item.styleName}`} className="p-1 rounded text-[#94a3b8] hover:text-rose-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {item.targetQuantity !== undefined && (
                    <p className="text-[10px] text-[#7c869d] mt-1.5 flex items-center gap-1"><Package className="w-2.5 h-2.5" /> {item.targetQuantity} pcs target</p>
                  )}
                  {item.vendorId && vendorName(item.vendorId) && (
                    <p className="text-[10px] text-[#7c869d] mt-0.5 flex items-center gap-1"><Factory className="w-2.5 h-2.5" /> {vendorName(item.vendorId)}</p>
                  )}
                  {item.targetDate && (
                    <p className="text-[10px] text-amber-300 mt-0.5">Target: {new Date(item.targetDate).toLocaleDateString()}</p>
                  )}
                  {(() => {
                    const linkedDocs = documents.filter((d) => d.pipelineItemId === item.id);
                    const linkedTasks = workItems.filter((w) => w.linkedPipelineItemId === item.id);
                    if (linkedDocs.length === 0 && linkedTasks.length === 0) return null;
                    return (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {linkedDocs.length > 0 && (
                          <Link href="/documents" onClick={(e) => e.stopPropagation()} title="View linked documents" className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-[9px] hover:bg-emerald-950/70">
                            <FileText className="w-2.5 h-2.5" /> {linkedDocs.length}
                          </Link>
                        )}
                        {linkedTasks.length > 0 && (
                          <Link href="/work?tab=backlog" onClick={(e) => e.stopPropagation()} title="View linked work items" className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 text-[9px] hover:bg-indigo-950/70">
                            <KanbanSquare className="w-2.5 h-2.5" /> {linkedTasks.length}
                          </Link>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <ModalPortal isOpen={!!modalItem}>
        {modalItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setModalItem(null)}>
            <div
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Pipeline item details"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">{(modalItem as PipelineItem).createdAt ? 'Edit Style' : 'Add Style'}</h2>
                <button onClick={() => setModalItem(null)} aria-label="Close" title="Close" className="text-[#94a3b8] hover:text-white">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {error && <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">{error}</div>}

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Style Name *</label>
                    <input value={modalItem.styleName} onChange={(e) => setModalItem({ ...modalItem, styleName: e.target.value })} placeholder="e.g. Leggings"
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">HSN Code</label>
                    <input value={modalItem.hsnCode || ''} onChange={(e) => setModalItem({ ...modalItem, hsnCode: e.target.value })} placeholder="e.g. 6104.62.00"
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white font-mono focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Category</label>
                    <select value={modalItem.category} onChange={(e) => setModalItem({ ...modalItem, category: e.target.value as PipelineItem['category'] })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Stage</label>
                    <select value={modalItem.stage} onChange={(e) => setModalItem({ ...modalItem, stage: e.target.value as PipelineStage })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Colorway</label>
                    <input value={modalItem.colorway || ''} onChange={(e) => setModalItem({ ...modalItem, colorway: e.target.value })} placeholder="Midnight / Cardamom"
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">SKU (links to costing sheet)</label>
                    <input value={modalItem.sku || ''} onChange={(e) => setModalItem({ ...modalItem, sku: e.target.value })} placeholder="RIV-FW26-LEG-01"
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Manufacturer</label>
                  <select value={modalItem.vendorId || ''} onChange={(e) => setModalItem({ ...modalItem, vendorId: e.target.value || undefined })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
                    <option value="">Not yet assigned</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Target Qty</label>
                    <input type="number" value={modalItem.targetQuantity ?? ''} onChange={(e) => setModalItem({ ...modalItem, targetQuantity: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Target Date</label>
                    <input type="date" value={modalItem.targetDate || ''} onChange={(e) => setModalItem({ ...modalItem, targetDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Actual Date</label>
                    <input type="date" value={modalItem.actualDate || ''} onChange={(e) => setModalItem({ ...modalItem, actualDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Notes</label>
                  <textarea value={modalItem.notes || ''} onChange={(e) => setModalItem({ ...modalItem, notes: e.target.value })} rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50 resize-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setModalItem(null)} className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} title="Save style" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save Style'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
