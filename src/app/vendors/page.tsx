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
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  PhoneCall,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Users,
  Building2,
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useAdminStore } from '@/lib/store';
import { VendorItem, VendorOutreachStage } from '@/lib/types';
import { useConfirm } from '@/lib/confirmContext';
import ModalPortal from '@/components/ui/ModalPortal';

// The 6 core outreach touchpoints in sequence as requested by user
const OUTREACH_TOUCHPOINTS: { stage: VendorOutreachStage; label: string; shortLabel: string; icon: any }[] = [
  { stage: 'Proposed', label: 'Proposed', shortLabel: '1. Proposed', icon: Building2 },
  { stage: 'Email Sent', label: 'Email Sent', shortLabel: '2. Email', icon: Send },
  { stage: 'WhatsApp Follow-up', label: 'WhatsApp Follow-Up', shortLabel: '3. WhatsApp', icon: MessageSquare },
  { stage: 'Second Email', label: 'Second Email', shortLabel: '4. 2nd Email', icon: Mail },
  { stage: 'Call Attended', label: 'Call Attended', shortLabel: '5. Call Attended', icon: PhoneCall },
  { stage: 'LinkedIn Referral', label: 'LinkedIn Referral', shortLabel: '6. LinkedIn', icon: Users },
];

// All stages for full lifecycle
const ALL_STAGES: VendorOutreachStage[] = [
  'Proposed',
  'Prospect',
  'Email Sent',
  'WhatsApp Follow-up',
  'Second Email',
  'Call Attended',
  'Call Attempted',
  'LinkedIn Referral',
  'Factory Visit Scheduled',
  'Sampling',
  'Negotiating',
  'Approved Partner',
  'Rejected / Stalled',
];

const STAGE_COLOR: Record<VendorOutreachStage, { bg: string; text: string; border: string; badge: string }> = {
  'Proposed': { bg: 'bg-[#141a29]', text: 'text-[#94a3b8]', border: 'border-[#26334d]', badge: 'bg-[#182030] text-[#cbd5e1] border-[#2a3854]' },
  'Prospect': { bg: 'bg-[#141a29]', text: 'text-[#94a3b8]', border: 'border-[#26334d]', badge: 'bg-[#182030] text-[#cbd5e1] border-[#2a3854]' },
  'Email Sent': { bg: 'bg-sky-950/40', text: 'text-sky-300', border: 'border-sky-800/40', badge: 'bg-sky-950/60 text-sky-300 border-sky-800/50' },
  'WhatsApp Follow-up': { bg: 'bg-emerald-950/40', text: 'text-emerald-300', border: 'border-emerald-800/40', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50' },
  'Second Email': { bg: 'bg-indigo-950/40', text: 'text-indigo-300', border: 'border-indigo-800/40', badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50' },
  'Call Attended': { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/40', badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50' },
  'Call Attempted': { bg: 'bg-cyan-950/40', text: 'text-cyan-300', border: 'border-cyan-800/40', badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/50' },
  'LinkedIn Referral': { bg: 'bg-blue-950/40', text: 'text-blue-300', border: 'border-blue-800/40', badge: 'bg-blue-950/60 text-blue-300 border-blue-800/50' },
  'Factory Visit Scheduled': { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/40', badge: 'bg-amber-950/60 text-amber-300 border-amber-800/50' },
  'Sampling': { bg: 'bg-purple-950/40', text: 'text-purple-300', border: 'border-purple-800/40', badge: 'bg-purple-950/60 text-purple-300 border-purple-800/50' },
  'Negotiating': { bg: 'bg-amber-950/40', text: 'text-amber-300', border: 'border-amber-800/40', badge: 'bg-amber-950/60 text-amber-300 border-amber-800/50' },
  'Approved Partner': { bg: 'bg-emerald-950/50', text: 'text-emerald-300', border: 'border-emerald-700/50', badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-600/50' },
  'Rejected / Stalled': { bg: 'bg-rose-950/40', text: 'text-rose-300', border: 'border-rose-800/40', badge: 'bg-rose-950/60 text-rose-300 border-rose-800/50' },
};

function emptyVendor(): Omit<VendorItem, 'createdAt' | 'updatedAt'> {
  return {
    id: `ven-${Date.now()}`,
    name: '',
    location: '',
    isVerticallyIntegrated: null,
    stage: 'Proposed',
    moqTarget: 175,
    paymentTermsTarget: '30% advance / 50% pre-shipment / 20% on delivery',
    certifications: [],
  };
}

export default function VendorsPage() {
  const confirm = useConfirm();
  const { vendors, saveVendor, deleteVendor, documents, pipelineItems, workItems } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Outreach' | 'Sampling' | 'Approved' | 'Stalled'>('All');
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [modalVendor, setModalVendor] = useState<VendorItem | (Omit<VendorItem, 'createdAt' | 'updatedAt'>) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inlineNotes, setInlineNotes] = useState<Record<string, string>>({});

  // Helper to normalize stage comparisons
  const getStageIndex = (stage: VendorOutreachStage) => {
    if (stage === 'Proposed' || stage === 'Prospect') return 0;
    if (stage === 'Email Sent') return 1;
    if (stage === 'WhatsApp Follow-up') return 2;
    if (stage === 'Second Email') return 3;
    if (stage === 'Call Attended' || stage === 'Call Attempted') return 4;
    if (stage === 'LinkedIn Referral') return 5;
    if (stage === 'Factory Visit Scheduled') return 6;
    if (stage === 'Sampling') return 7;
    if (stage === 'Negotiating') return 8;
    if (stage === 'Approved Partner') return 9;
    return -1; // Stalled or other
  };

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        v.name.toLowerCase().includes(q) ||
        (v.specialty || '').toLowerCase().includes(q) ||
        (v.contactName || '').toLowerCase().includes(q) ||
        (v.location || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (categoryFilter === 'All') return true;
      if (categoryFilter === 'Outreach') {
        const idx = getStageIndex(v.stage);
        return idx >= 0 && idx <= 5;
      }
      if (categoryFilter === 'Sampling') {
        return v.stage === 'Sampling' || v.stage === 'Factory Visit Scheduled' || v.stage === 'Negotiating';
      }
      if (categoryFilter === 'Approved') {
        return v.stage === 'Approved Partner';
      }
      if (categoryFilter === 'Stalled') {
        return v.stage === 'Rejected / Stalled';
      }
      return true;
    });
  }, [vendors, searchQuery, categoryFilter]);

  // Quick metrics
  const metrics = useMemo(() => {
    const total = vendors.length;
    const inOutreach = vendors.filter((v) => {
      const idx = getStageIndex(v.stage);
      return idx >= 0 && idx <= 5;
    }).length;
    const inSampling = vendors.filter((v) => v.stage === 'Sampling' || v.stage === 'Negotiating').length;
    const approved = vendors.filter((v) => v.stage === 'Approved Partner').length;
    return { total, inOutreach, inSampling, approved };
  }, [vendors]);

  const handleUpdateStage = async (vendor: VendorItem, newStage: VendorOutreachStage) => {
    const now = new Date().toISOString();
    await saveVendor({
      ...vendor,
      stage: newStage,
      lastContactedAt: now.split('T')[0],
      updatedAt: now,
    });
  };

  const handleAdvanceStep = async (vendor: VendorItem) => {
    const currentIdx = getStageIndex(vendor.stage);
    if (currentIdx >= 0 && currentIdx < OUTREACH_TOUCHPOINTS.length - 1) {
      const nextStage = OUTREACH_TOUCHPOINTS[currentIdx + 1].stage;
      await handleUpdateStage(vendor, nextStage);
    } else if (currentIdx === OUTREACH_TOUCHPOINTS.length - 1) {
      await handleUpdateStage(vendor, 'Factory Visit Scheduled');
    }
  };

  const handleSaveInlineNotes = async (vendor: VendorItem) => {
    const note = inlineNotes[vendor.id];
    if (note !== undefined) {
      await saveVendor({
        ...vendor,
        notes: note,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleSaveModal = async () => {
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Factory className="w-6 h-6 text-[#cda052]" />
            Vendors & Manufacturer Outreach
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            Row-based manufacturer tracking, commercial terms, and per-vendor 6-touch outreach workflow execution.
          </p>
        </div>
        <button
          onClick={() => { setModalVendor(emptyVendor()); setError(null); }}
          title="Add a new vendor or manufacturer to track"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs font-semibold hover:shadow-glow transition-all whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0e121b] border border-[#1c2438] flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#94a3b8] font-medium">Total Vendors</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{metrics.total}</div>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.04] text-[#cda052]">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e121b] border border-[#1c2438] flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#94a3b8] font-medium">In 6-Touch Workflow</div>
            <div className="text-xl font-bold text-sky-400 font-mono mt-0.5">{metrics.inOutreach}</div>
          </div>
          <div className="p-2 rounded-lg bg-sky-950/40 text-sky-400">
            <Send className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e121b] border border-[#1c2438] flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#94a3b8] font-medium">Sampling / Negotiation</div>
            <div className="text-xl font-bold text-purple-400 font-mono mt-0.5">{metrics.inSampling}</div>
          </div>
          <div className="p-2 rounded-lg bg-purple-950/40 text-purple-400">
            <Shirt className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e121b] border border-[#1c2438] flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#94a3b8] font-medium">Approved Partners</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{metrics.approved}</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-950/40 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0e121b] p-3 rounded-xl border border-[#1c2438]">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {(['All', 'Outreach', 'Sampling', 'Approved', 'Stalled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setCategoryFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                categoryFilter === tab
                  ? 'bg-[rgba(205,160,82,0.18)] text-[#e6c875] font-semibold border border-[#cda052]/40'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab === 'All' ? 'All Vendors' : tab === 'Outreach' ? 'Active Outreach (6-Touch)' : tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7c869d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor, specialty, facility, contact..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#080b12] border border-[#222b3e] text-xs text-white placeholder-[#7c869d] outline-none focus:border-[#cda052] transition-colors"
          />
        </div>
      </div>

      {/* Vendors Row-Based List */}
      {filteredVendors.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#1f2638] rounded-2xl bg-[#080b12]">
          <Factory className="w-9 h-9 text-[#434d61] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No vendors found</h3>
          <p className="text-xs text-[#94a3b8] max-w-sm mx-auto mb-4">
            No manufacturers match your current search or category filter. Add your first factory target to initiate the 6-touch workflow.
          </p>
          <button
            onClick={() => { setModalVendor(emptyVendor()); setError(null); }}
            className="px-4 py-2 rounded-xl bg-[#151a28] border border-[#263148] text-xs font-semibold text-[#cda052] hover:bg-[#1a2236] transition-colors cursor-pointer"
          >
            Add New Vendor
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVendors.map((vendor) => {
            const isExpanded = expandedVendorId === vendor.id;
            const currentStageIdx = getStageIndex(vendor.stage);
            const styleConfig = STAGE_COLOR[vendor.stage] || STAGE_COLOR['Proposed'];

            const linkedStyles = pipelineItems.filter((p) => p.vendorId === vendor.id);
            const linkedDocs = documents.filter((d) => d.vendorId === vendor.id);
            const linkedTasks = workItems.filter((w) => w.linkedVendorId === vendor.id);

            return (
              <div
                key={vendor.id}
                className="bg-[#0e121b] border border-[#1b2234] hover:border-[#2a3650] rounded-2xl transition-all shadow-md overflow-hidden"
              >
                {/* Main Row Content */}
                <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  {/* Left Column: Vendor Name, Location & Vertical Integration */}
                  <div className="xl:w-[260px] flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-wide">{vendor.name}</h3>
                      {vendor.isVerticallyIntegrated === true && (
                        <span title="Vertically integrated factory" className="inline-flex items-center text-emerald-400">
                          <ShieldCheck className="w-4 h-4" />
                        </span>
                      )}
                      {vendor.isVerticallyIntegrated === false && (
                        <span title="Partial / outsourced steps" className="inline-flex items-center text-rose-400">
                          <ShieldX className="w-4 h-4" />
                        </span>
                      )}
                      {vendor.isVerticallyIntegrated === null && (
                        <span title="Vertical integration unconfirmed" className="inline-flex items-center text-[#7c869d]">
                          <ShieldQuestion className="w-4 h-4" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] mt-1">
                      <MapPin className="w-3 h-3 text-[#7c869d] flex-shrink-0" />
                      <span className="truncate">{vendor.location || 'Location pending'}</span>
                    </div>

                    {vendor.specialty && (
                      <p className="text-[11px] text-[#cbd5e1] mt-1.5 line-clamp-1" title={vendor.specialty}>
                        {vendor.specialty}
                      </p>
                    )}
                  </div>

                  {/* Middle Column: 6-Touch Workflow Pipeline Tracker (Interactive) */}
                  <div className="flex-1 min-w-0 bg-[#07090f]/70 p-2.5 sm:p-3 rounded-xl border border-white/[0.04]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#828ea6]">
                          Outreach Workflow:
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${styleConfig.badge}`}>
                          {vendor.stage}
                        </span>
                      </div>

                      {/* Advance workflow button */}
                      {currentStageIdx >= 0 && currentStageIdx < OUTREACH_TOUCHPOINTS.length && (
                        <button
                          onClick={() => handleAdvanceStep(vendor)}
                          className="flex items-center gap-1 text-[11px] text-[#cda052] hover:text-[#f3d994] font-medium hover:underline cursor-pointer"
                          title="Advance to next touchpoint"
                        >
                          <span>Advance Step</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Step Nodes Row */}
                    <div className="grid grid-cols-6 gap-1 sm:gap-1.5 relative">
                      {OUTREACH_TOUCHPOINTS.map((tp, idx) => {
                        const Icon = tp.icon;
                        const isDone = currentStageIdx > idx || (currentStageIdx >= 6 && idx <= 5);
                        const isCurrent = currentStageIdx === idx;

                        return (
                          <button
                            key={tp.stage}
                            onClick={() => handleUpdateStage(vendor, tp.stage)}
                            title={`Set workflow stage to: ${tp.label}`}
                            className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer group ${
                              isCurrent
                                ? 'bg-[rgba(205,160,82,0.18)] border-[#cda052] text-white shadow-sm ring-1 ring-[#cda052]/50'
                                : isDone
                                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300 hover:bg-emerald-950/50'
                                : 'bg-[#0f1422] border-[#1d273a] text-[#7c869d] hover:text-[#cbd5e1] hover:border-[#2f3d59]'
                            }`}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              {isDone ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Icon className={`w-3 h-3 ${isCurrent ? 'text-[#cda052]' : 'text-[#7c869d]'}`} />
                              )}
                            </div>
                            <span className="text-[10px] font-medium truncate w-full block">
                              {tp.shortLabel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Commercials & Contact Column */}
                  <div className="xl:w-[220px] flex-shrink-0 flex flex-col justify-between text-[11px] space-y-1.5">
                    <div className="space-y-0.5">
                      <div className="text-[#94a3b8] flex items-center justify-between">
                        <span>MOQ Target:</span>
                        <span className="text-white font-mono font-semibold">
                          {vendor.moqTarget ? `${vendor.moqTarget} pcs` : 'Not set'}
                        </span>
                      </div>
                      {vendor.moqOffered && (
                        <div className="text-[10px] text-[#8e98ad] flex items-center justify-between">
                          <span>Factory Offered:</span>
                          <span className="font-mono">{vendor.moqOffered} pcs</span>
                        </div>
                      )}
                    </div>

                    {vendor.nextFollowUpAt ? (
                      <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                        <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Follow-up: {new Date(vendor.nextFollowUpAt).toLocaleDateString()}</span>
                      </div>
                    ) : vendor.lastContactedAt ? (
                      <div className="flex items-center gap-1.5 text-[#8895ad]">
                        <Clock className="w-3 h-3" />
                        <span>Last touch: {new Date(vendor.lastContactedAt).toLocaleDateString()}</span>
                      </div>
                    ) : null}

                    {/* Quick Direct Actions */}
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-[#94a3b8]">
                      {vendor.contactEmail && (
                        <a
                          href={`mailto:${vendor.contactEmail}`}
                          title={`Email ${vendor.contactEmail}`}
                          className="p-1 rounded hover:bg-white/[0.06] text-[#cbd5e1] hover:text-[#cda052]"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {vendor.contactPhone && (
                        <a
                          href={`https://wa.me/${vendor.contactPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title={`WhatsApp chat ${vendor.contactPhone}`}
                          className="p-1 rounded hover:bg-white/[0.06] text-[#cbd5e1] hover:text-emerald-400"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {vendor.contactPhone && (
                        <a
                          href={`tel:${vendor.contactPhone}`}
                          title={`Call ${vendor.contactPhone}`}
                          className="p-1 rounded hover:bg-white/[0.06] text-[#cbd5e1] hover:text-cyan-400"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex xl:flex-col items-center xl:items-end justify-between xl:justify-center gap-2 pt-2 xl:pt-0 border-t xl:border-t-0 border-white/[0.06]">
                    <button
                      onClick={() => setExpandedVendorId(isExpanded ? null : vendor.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1a2133] border border-[#242e44] text-[11px] text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                      title="Expand detailed workflow, notes, and connected items"
                    >
                      <span>Workflow Details</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setModalVendor(vendor); setError(null); }}
                        title="Edit vendor information"
                        aria-label={`Edit ${vendor.name}`}
                        className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#cda052] hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id, vendor.name)}
                        title="Remove vendor"
                        aria-label={`Remove ${vendor.name}`}
                        className="p-1.5 rounded-lg text-[#94a3b8] hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Per-Vendor Workflow Drawer */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 py-4 bg-[#080a10] border-t border-[#1a2234] text-xs space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 1. Stage & Scheduling Control */}
                      <div className="space-y-3 bg-[#0e121b] p-3.5 rounded-xl border border-[#1e2638]">
                        <div className="font-semibold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#cda052]" />
                          <span>Lifecycle & Next Touch</span>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#94a3b8] block mb-1">Current Outreach / Production Stage:</label>
                          <select
                            value={vendor.stage}
                            onChange={(e) => handleUpdateStage(vendor, e.target.value as VendorOutreachStage)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222b3e] text-xs text-white outline-none focus:border-[#cda052]"
                          >
                            {ALL_STAGES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] text-[#94a3b8] block mb-1">Schedule Next Follow-Up Date:</label>
                          <input
                            type="date"
                            value={vendor.nextFollowUpAt || ''}
                            onChange={(e) => {
                              saveVendor({
                                ...vendor,
                                nextFollowUpAt: e.target.value,
                                updatedAt: new Date().toISOString(),
                              });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222b3e] text-xs text-white outline-none focus:border-[#cda052]"
                          />
                        </div>
                      </div>

                      {/* 2. Communication Notes & Negotiation Log */}
                      <div className="space-y-2 bg-[#0e121b] p-3.5 rounded-xl border border-[#1e2638]">
                        <div className="font-semibold text-white text-[11px] uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#cda052]" />
                            <span>Workflow Notes & Negotiation</span>
                          </span>
                          <button
                            onClick={() => handleSaveInlineNotes(vendor)}
                            className="text-[10px] text-[#cda052] hover:underline font-semibold"
                          >
                            Save Note
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          value={inlineNotes[vendor.id] !== undefined ? inlineNotes[vendor.id] : (vendor.notes || '')}
                          onChange={(e) => setInlineNotes({ ...inlineNotes, [vendor.id]: e.target.value })}
                          placeholder="Log call takeaways, fabric swatch feedback, quotation notes..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222b3e] text-xs text-white placeholder-[#5a657c] outline-none focus:border-[#cda052] resize-none"
                        />
                      </div>

                      {/* 3. Connected Production Ecosystem */}
                      <div className="space-y-2 bg-[#0e121b] p-3.5 rounded-xl border border-[#1e2638]">
                        <div className="font-semibold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-[#cda052]" />
                          <span>Connected Pipeline & Vault Assets</span>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#94a3b8]">Sampling Pipeline:</span>
                            {linkedStyles.length > 0 ? (
                              <Link href="/pipeline" className="text-sky-400 hover:underline font-semibold">
                                {linkedStyles.length} style{linkedStyles.length === 1 ? '' : 's'} assigned
                              </Link>
                            ) : (
                              <span className="text-[#64748b]">No styles linked</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#94a3b8]">Document Vault:</span>
                            {linkedDocs.length > 0 ? (
                              <Link href="/documents" className="text-emerald-400 hover:underline font-semibold">
                                {linkedDocs.length} certificate/doc{linkedDocs.length === 1 ? '' : 's'}
                              </Link>
                            ) : (
                              <span className="text-[#64748b]">No docs filed</span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#94a3b8]">Work Tracking Tasks:</span>
                            {linkedTasks.length > 0 ? (
                              <Link href="/work?tab=backlog" className="text-indigo-400 hover:underline font-semibold">
                                {linkedTasks.length} linked task{linkedTasks.length === 1 ? '' : 's'}
                              </Link>
                            ) : (
                              <span className="text-[#64748b]">No tasks</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Vendor Modal */}
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
                <button onClick={() => setModalVendor(null)} aria-label="Close" title="Close" className="text-[#94a3b8] hover:text-white cursor-pointer">
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {error && <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">{error}</div>}

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Manufacturer / Vendor Name *</label>
                  <input
                    value={modalVendor.name}
                    onChange={(e) => setModalVendor({ ...modalVendor, name: e.target.value })}
                    placeholder="e.g. Layo Group"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Facility Location</label>
                    <input
                      value={modalVendor.location}
                      onChange={(e) => setModalVendor({ ...modalVendor, location: e.target.value })}
                      placeholder="e.g. Primary Manufacturing Facility"
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Outreach Stage</label>
                    <select
                      value={modalVendor.stage}
                      onChange={(e) => setModalVendor({ ...modalVendor, stage: e.target.value as VendorOutreachStage })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    >
                      {ALL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Fabric & Garment Specialty</label>
                  <input
                    value={modalVendor.specialty || ''}
                    onChange={(e) => setModalVendor({ ...modalVendor, specialty: e.target.value })}
                    placeholder="e.g. 78/22 Nylon-Lycra compression knits"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Vertically integrated? (yarn → knit → dye → stitch in-house)</label>
                  <select
                    value={modalVendor.isVerticallyIntegrated === null || modalVendor.isVerticallyIntegrated === undefined ? 'unknown' : String(modalVendor.isVerticallyIntegrated)}
                    onChange={(e) => setModalVendor({ ...modalVendor, isVerticallyIntegrated: e.target.value === 'unknown' ? null : e.target.value === 'true' })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                  >
                    <option value="unknown">Not yet confirmed</option>
                    <option value="true">Yes — fully vertical</option>
                    <option value="false">No — partial / outsourced steps</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">MOQ Target (Rivlet's ask)</label>
                    <input
                      type="number"
                      value={modalVendor.moqTarget ?? ''}
                      onChange={(e) => setModalVendor({ ...modalVendor, moqTarget: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">MOQ Offered (Factory)</label>
                    <input
                      type="number"
                      value={modalVendor.moqOffered ?? ''}
                      onChange={(e) => setModalVendor({ ...modalVendor, moqOffered: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Payment Terms</label>
                  <input
                    value={modalVendor.paymentTermsTarget || ''}
                    onChange={(e) => setModalVendor({ ...modalVendor, paymentTermsTarget: e.target.value })}
                    placeholder="e.g. 30% advance / 50% pre-shipment / 20% on delivery"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Contact Name</label>
                    <input
                      value={modalVendor.contactName || ''}
                      onChange={(e) => setModalVendor({ ...modalVendor, contactName: e.target.value })}
                      placeholder="e.g. Merchandising Director"
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Contact Email</label>
                    <input
                      value={modalVendor.contactEmail || ''}
                      onChange={(e) => setModalVendor({ ...modalVendor, contactEmail: e.target.value })}
                      placeholder="e.g. info@layogroup.com"
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Contact Phone / WhatsApp</label>
                    <input
                      value={modalVendor.contactPhone || ''}
                      onChange={(e) => setModalVendor({ ...modalVendor, contactPhone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94a3b8] block mb-1">Next Follow-Up</label>
                    <input
                      type="date"
                      value={modalVendor.nextFollowUpAt || ''}
                      onChange={(e) => setModalVendor({ ...modalVendor, nextFollowUpAt: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Notes</label>
                  <textarea
                    value={modalVendor.notes || ''}
                    onChange={(e) => setModalVendor({ ...modalVendor, notes: e.target.value })}
                    rows={3}
                    placeholder="Log manufacturer background, machinery, capabilities..."
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setModalVendor(null)} className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white cursor-pointer">Cancel</button>
                <button
                  onClick={handleSaveModal}
                  disabled={isSaving}
                  title="Save vendor"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold disabled:opacity-60 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Vendor'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
