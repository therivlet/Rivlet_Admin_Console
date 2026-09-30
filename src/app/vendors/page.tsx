'use client';

import React, { useMemo, useState } from 'react';
import {
  Factory,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  Trash2,
  Pencil,
  X,
  Save,
  CalendarClock,
  FileText,
  Shirt,
  KanbanSquare,
} from 'lucide-react';
import Link from 'next/link';
import { useAdminStore } from '@/lib/store';
import { VendorItem, VendorOutreachStage } from '@/lib/types';
import { useConfirm } from '@/lib/confirmContext';
import ModalPortal from '@/components/ui/ModalPortal';

const STAGES: VendorOutreachStage[] = [
  'Prospect',
  'Email Sent',
  'WhatsApp Follow-up',
  'Second Email',
  'Call Attempted',
  'LinkedIn Referral',
  'Factory Visit Scheduled',
  'Sampling',
  'Negotiating',
  'Approved Partner',
  'Rejected / Stalled',
];

const STAGE_COLOR: Record<VendorOutreachStage, string> = {
  'Prospect': 'bg-[#182030] text-[#94a3b8] border-[#263148]',
  'Email Sent': 'bg-sky-950/60 text-sky-300 border-sky-800/50',
  'WhatsApp Follow-up': 'bg-sky-950/60 text-sky-300 border-sky-800/50',
  'Second Email': 'bg-sky-950/60 text-sky-300 border-sky-800/50',
  'Call Attempted': 'bg-sky-950/60 text-sky-300 border-sky-800/50',
  'LinkedIn Referral': 'bg-sky-950/60 text-sky-300 border-sky-800/50',
  'Factory Visit Scheduled': 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  'Sampling': 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  'Negotiating': 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  'Approved Partner': 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50',
  'Rejected / Stalled': 'bg-rose-950/60 text-rose-300 border-rose-800/50',
};

function emptyVendor(): Omit<VendorItem, 'createdAt' | 'updatedAt'> {
  return {
    id: `ven-${Date.now()}`,
    name: '',
    location: 'Tirupur, Tamil Nadu',
    isVerticallyIntegrated: null,
    stage: 'Prospect',
    moqTarget: 175,
    paymentTermsTarget: '30% advance / 50% pre-shipment / 20% on delivery',
    certifications: [],
  };
}

export default function VendorsPage() {
  const confirm = useConfirm();
  const { vendors, saveVendor, deleteVendor, documents, pipelineItems, workItems } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'All' | VendorOutreachStage>('All');
  const [modalVendor, setModalVendor] = useState<VendorItem | (Omit<VendorItem, 'createdAt' | 'updatedAt'>) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.specialty || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.contactName || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage = stageFilter === 'All' || v.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [vendors, searchQuery, stageFilter]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of vendors) counts[v.stage] = (counts[v.stage] || 0) + 1;
    return counts;
  }, [vendors]);

  const handleSave = async () => {
    if (!modalVendor) return;
    if (!modalVendor.name || modalVendor.name.trim().length < 2) {
      setError('Vendor / manufacturer name is required.');
      return;
    }
    setError(null);
    setIsSaving(true);
    const now = new Date().toISOString();
    const full: VendorItem = {
      ...(modalVendor as VendorItem),
      name: modalVendor.name.trim(),
      createdAt: (modalVendor as VendorItem).createdAt || now,
      updatedAt: now,
    };
    await saveVendor(full);
    setIsSaving(false);
    setModalVendor(null);
  };

  const handleDelete = async (id: string, name: string) => {
    const linkedStyles = pipelineItems.filter((p) => p.vendorId === id);
    const linkedDocs = documents.filter((d) => d.vendorId === id);
    const sideEffects: string[] = [];
    if (linkedStyles.length > 0) sideEffects.push(`${linkedStyles.length} sampling pipeline style${linkedStyles.length === 1 ? '' : 's'}`);
    if (linkedDocs.length > 0) sideEffects.push(`${linkedDocs.length} linked document${linkedDocs.length === 1 ? '' : 's'}`);

    const ok = await confirm({
      title: 'Remove Vendor',
      message: `Remove "${name}" from the vendor directory?${
        sideEffects.length > 0
          ? ` Warning: Linked manufacturer references on ${sideEffects.join(' and ')} will be unlinked.`
          : ' This action cannot be undone.'
      }`,
      confirmLabel: 'Remove Vendor',
      danger: true,
    });
    if (!ok) return;
    await deleteVendor(id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Factory className="w-6 h-6 text-[#cda052]" />
            Manufacturer & Vendor Outreach
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Track Tirupur factory outreach, negotiation terms, and the 5-touch follow-up sequence.
          </p>
        </div>
        <button
          onClick={() => { setModalVendor(emptyVendor()); setError(null); }}
          title="Add a new vendor or manufacturer to track"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold hover:shadow-glow transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Stage summary strip */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => setStageFilter(stageFilter === s ? 'All' : s)}
            title={`Filter by ${s}`}
            className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-medium transition-all ${STAGE_COLOR[s]} ${stageFilter === s ? 'ring-2 ring-[#cda052]/60' : 'opacity-80 hover:opacity-100'}`}
          >
            {s} <span className="font-mono opacity-70">({stageCounts[s] || 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c869d]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search vendor name, specialty, contact..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white placeholder:text-[#5f6c85] focus:outline-none focus:border-[#cda052]/50"
        />
      </div>

      {/* Vendor cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#1f2638] rounded-2xl">
          <Factory className="w-8 h-8 text-[#3d4658] mx-auto mb-3" />
          <p className="text-sm text-[#94a3b8]">No vendors found. Add your first outreach target.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <div key={v.id} className="rounded-2xl border border-[#1a1f2c] bg-[#0e121b] p-4 flex flex-col gap-3 hover:border-[#2a3346] transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">{v.name}</h3>
                  <p className="text-[11px] text-[#94a3b8] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {v.location}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full border font-medium whitespace-nowrap ${STAGE_COLOR[v.stage]}`}>
                  {v.stage}
                </span>
              </div>

              {v.specialty && <p className="text-xs text-[#cbd5e1]">{v.specialty}</p>}

              <div className="flex items-center gap-1.5 text-[11px]" title="Vertical integration: sources yarn, knits, dyes, and stitches in-house">
                {v.isVerticallyIntegrated === true && <><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-300">Fully vertical</span></>}
                {v.isVerticallyIntegrated === false && <><ShieldX className="w-3.5 h-3.5 text-rose-400" /><span className="text-rose-300">Not vertical</span></>}
                {(v.isVerticallyIntegrated === null || v.isVerticallyIntegrated === undefined) && <><ShieldQuestion className="w-3.5 h-3.5 text-[#7c869d]" /><span className="text-[#7c869d]">Unconfirmed</span></>}
              </div>

              <div className="text-[11px] text-[#94a3b8] space-y-1">
                {v.moqTarget !== undefined && (
                  <div>MOQ ask: <span className="text-white font-mono">{v.moqOffered ? `${v.moqOffered} offered / ` : ''}{v.moqTarget} target</span></div>
                )}
                {v.paymentTermsTarget && <div className="truncate" title={v.paymentTermsTarget}>Terms: {v.paymentTermsOffered || v.paymentTermsTarget}</div>}
                {v.nextFollowUpAt && (
                  <div className="flex items-center gap-1 text-amber-300">
                    <CalendarClock className="w-3 h-3" /> Follow up {new Date(v.nextFollowUpAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {(v.contactEmail || v.contactPhone) && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#7c869d]">
                  {v.contactEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{v.contactEmail}</span>}
                  {v.contactPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.contactPhone}</span>}
                </div>
              )}

              {(() => {
                const linkedStyles = pipelineItems.filter((p) => p.vendorId === v.id);
                const linkedDocs = documents.filter((d) => d.vendorId === v.id);
                const linkedTasks = workItems.filter((w) => w.linkedVendorId === v.id);
                if (linkedStyles.length === 0 && linkedDocs.length === 0 && linkedTasks.length === 0) return null;
                return (
                  <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px]">
                    {linkedStyles.length > 0 && (
                      <Link href="/pipeline" title="View linked styles in the production pipeline" className="flex items-center gap-1 px-2 py-1 rounded-md bg-sky-950/40 text-sky-300 border border-sky-800/40 hover:bg-sky-950/70">
                        <Shirt className="w-3 h-3" /> {linkedStyles.length} style{linkedStyles.length === 1 ? '' : 's'}
                      </Link>
                    )}
                    {linkedDocs.length > 0 && (
                      <Link href="/documents" title="View linked documents in the vault" className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-950/70">
                        <FileText className="w-3 h-3" /> {linkedDocs.length} doc{linkedDocs.length === 1 ? '' : 's'}
                      </Link>
                    )}
                    {linkedTasks.length > 0 && (
                      <Link href="/work?tab=backlog" title="View linked work items" className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 hover:bg-indigo-950/70">
                        <KanbanSquare className="w-3 h-3" /> {linkedTasks.length} task{linkedTasks.length === 1 ? '' : 's'}
                      </Link>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-1 pt-2 mt-auto border-t border-[#161a26]">
                <button onClick={() => { setModalVendor(v); setError(null); }} title="Edit vendor" aria-label={`Edit ${v.name}`} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#cda052] hover:bg-[#141724]">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(v.id, v.name)} title="Remove vendor" aria-label={`Remove ${v.name}`} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-rose-400 hover:bg-rose-950/30">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <ModalPortal isOpen={!!modalVendor}>
        {modalVendor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setModalVendor(null)}>
            <div
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Vendor details"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">{(modalVendor as VendorItem).createdAt ? 'Edit Vendor' : 'Add Vendor'}</h2>
                <button onClick={() => setModalVendor(null)} aria-label="Close" title="Close" className="text-[#94a3b8] hover:text-white">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {error && <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">{error}</div>}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Manufacturer / Vendor Name *</label>
                  <input value={modalVendor.name} onChange={(e) => setModalVendor({ ...modalVendor, name: e.target.value })} placeholder="e.g. Techno Sportswear"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Location</label>
                    <input value={modalVendor.location} onChange={(e) => setModalVendor({ ...modalVendor, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Outreach Stage</label>
                    <select value={modalVendor.stage} onChange={(e) => setModalVendor({ ...modalVendor, stage: e.target.value as VendorOutreachStage })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
                      {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Specialty</label>
                  <input value={modalVendor.specialty || ''} onChange={(e) => setModalVendor({ ...modalVendor, specialty: e.target.value })} placeholder="e.g. 78/22 Nylon-Lycra compression knits"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Vertically integrated? (yarn → knit → dye → stitch, in-house)</label>
                  <select
                    value={modalVendor.isVerticallyIntegrated === null || modalVendor.isVerticallyIntegrated === undefined ? 'unknown' : String(modalVendor.isVerticallyIntegrated)}
                    onChange={(e) => setModalVendor({ ...modalVendor, isVerticallyIntegrated: e.target.value === 'unknown' ? null : e.target.value === 'true' })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
                    <option value="unknown">Not yet confirmed</option>
                    <option value="true">Yes — fully vertical</option>
                    <option value="false">No — partial / outsourced steps</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">MOQ Offered</label>
                    <input type="number" value={modalVendor.moqOffered ?? ''} onChange={(e) => setModalVendor({ ...modalVendor, moqOffered: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">MOQ Target (our ask)</label>
                    <input type="number" value={modalVendor.moqTarget ?? ''} onChange={(e) => setModalVendor({ ...modalVendor, moqTarget: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Payment Terms Offered</label>
                  <input value={modalVendor.paymentTermsOffered || ''} onChange={(e) => setModalVendor({ ...modalVendor, paymentTermsOffered: e.target.value })} placeholder="e.g. 50% advance / 50% on delivery"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Contact Name</label>
                    <input value={modalVendor.contactName || ''} onChange={(e) => setModalVendor({ ...modalVendor, contactName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Contact Email</label>
                    <input value={modalVendor.contactEmail || ''} onChange={(e) => setModalVendor({ ...modalVendor, contactEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Last Contacted</label>
                    <input type="date" value={modalVendor.lastContactedAt || ''} onChange={(e) => setModalVendor({ ...modalVendor, lastContactedAt: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Next Follow-up</label>
                    <input type="date" value={modalVendor.nextFollowUpAt || ''} onChange={(e) => setModalVendor({ ...modalVendor, nextFollowUpAt: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Notes</label>
                  <textarea value={modalVendor.notes || ''} onChange={(e) => setModalVendor({ ...modalVendor, notes: e.target.value })} rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50 resize-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setModalVendor(null)} className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} title="Save vendor" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save Vendor'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
