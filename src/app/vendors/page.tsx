'use client';

import React, { useMemo, useState } from 'react';
import {
  Building2,
  Factory,
  Truck,
  CreditCard,
  Package,
  Sparkles,
  Scale,
  Cpu,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Globe,
  Trash2,
  Pencil,
  X,
  Save,
  CalendarClock,
  FileText,
  Shirt,
  KanbanSquare,
  List,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  PhoneCall,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Users,
  Calendar,
  Star,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Filter,
  Check,
  Sparkle
} from 'lucide-react';
import Link from 'next/link';
import { useAdminStore } from '@/lib/store';
import { VendorItem, VendorCategory, VendorHealthStatus } from '@/lib/types';
import { useConfirm } from '@/lib/confirmContext';
import {
  VENDOR_CATEGORIES,
  ALL_VENDOR_CATEGORIES,
  getCategoryConfig,
  getVendorCategory,
  getStageProgress,
  getNextStage,
} from '@/lib/vendorWorkflows';
import VendorWorkspaceModal from '@/components/vendors/VendorWorkspaceModal';
import VendorFormModal from '@/components/vendors/VendorFormModal';

export default function VendorsPage() {
  const confirm = useConfirm();
  const { vendors, saveVendor, deleteVendor, documents, pipelineItems, workItems } = useAdminStore();

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | VendorCategory>('All');
  const [healthFilter, setHealthFilter] = useState<'All' | VendorHealthStatus>('All');
  const [viewMode, setViewMode] = useState<'rows' | 'board'>('rows');

  // Modals & Drawer States
  const [workspaceVendor, setWorkspaceVendor] = useState<VendorItem | null>(null);
  const [formVendor, setFormVendor] = useState<Partial<VendorItem> | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [inlineNotes, setInlineNotes] = useState<Record<string, string>>({});

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: vendors.length };
    ALL_VENDOR_CATEGORIES.forEach((cat) => {
      counts[cat] = vendors.filter((v) => getVendorCategory(v) === cat).length;
    });
    return counts;
  }, [vendors]);

  // Filtered vendors list
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const cat = getVendorCategory(v);

      if (selectedCategory !== 'All' && cat !== selectedCategory) {
        return false;
      }

      if (healthFilter !== 'All' && v.healthStatus !== healthFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(q);
        const matchesSub = (v.subcategory || '').toLowerCase().includes(q);
        const matchesSpec = (v.specialty || '').toLowerCase().includes(q);
        const matchesLoc = (v.location || '').toLowerCase().includes(q);
        const matchesContact = (v.contactName || '').toLowerCase().includes(q) ||
          (v.contacts || []).some((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));

        if (!matchesName && !matchesSub && !matchesSpec && !matchesLoc && !matchesContact) {
          return false;
        }
      }

      return true;
    });
  }, [vendors, selectedCategory, healthFilter, searchQuery]);

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    const total = vendors.length;
    const inWorkflow = vendors.filter((v) => {
      const p = getStageProgress(v);
      return p > 0 && p < 100;
    }).length;
    const scheduledTouches = vendors.filter((v) => Boolean(v.nextFollowUpAt)).length;
    const livePartners = vendors.filter((v) => {
      const p = getStageProgress(v);
      return p >= 95 || v.stage.toLowerCase().includes('approved') || v.stage.toLowerCase().includes('live');
    }).length;

    return { total, inWorkflow, scheduledTouches, livePartners };
  }, [vendors]);

  // 1-Click Stage Update Handler
  const handleUpdateStage = async (vendor: VendorItem, newStage: string) => {
    const now = new Date().toISOString();
    const category = getVendorCategory(vendor);
    const config = getCategoryConfig(category);
    const stageObj = config.stages.find(
      (s) => s.name.toLowerCase() === newStage.toLowerCase() || s.id.toLowerCase() === newStage.toLowerCase()
    );
    const newProgress = stageObj ? stageObj.progressPercent : getStageProgress({ ...vendor, stage: newStage });

    const updated: VendorItem = {
      ...vendor,
      stage: stageObj ? stageObj.name : newStage,
      stageProgressPercent: newProgress,
      lastContactedAt: now.split('T')[0],
      updatedAt: now,
    };
    await saveVendor(updated);
    if (workspaceVendor?.id === vendor.id) {
      setWorkspaceVendor(updated);
    }
  };

  const handleAdvanceStep = async (vendor: VendorItem) => {
    const next = getNextStage(vendor);
    if (next) {
      await handleUpdateStage(vendor, next.name);
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

  const handleDelete = async (id: string, name: string) => {
    const linkedStyles = pipelineItems.filter((p) => p.vendorId === id);
    const linkedDocs = documents.filter((d) => d.vendorId === id);
    const linkedTasks = workItems.filter((w) => w.linkedVendorId === id);
    const sideEffects: string[] = [];
    if (linkedStyles.length > 0) sideEffects.push(`${linkedStyles.length} sampling pipeline style${linkedStyles.length === 1 ? '' : 's'}`);
    if (linkedDocs.length > 0) sideEffects.push(`${linkedDocs.length} linked document${linkedDocs.length === 1 ? '' : 's'}`);
    if (linkedTasks.length > 0) sideEffects.push(`${linkedTasks.length} linked work task${linkedTasks.length === 1 ? '' : 's'}`);

    const ok = await confirm({
      title: 'Remove Partner',
      message: `Remove "${name}" from the vendor & manufacturer ecosystem?${
        sideEffects.length > 0
          ? ` Warning: Active references on ${sideEffects.join(', ')} will be unlinked.`
          : ' This action cannot be undone.'
      }`,
      confirmLabel: 'Remove Partner',
      danger: true,
    });
    if (!ok) return;
    await deleteVendor(id);
    if (workspaceVendor?.id === id) setWorkspaceVendor(null);
  };

  // Open Add Vendor modal
  const handleOpenAddModal = (defaultCategory?: VendorCategory) => {
    const cat = defaultCategory || (selectedCategory !== 'All' ? selectedCategory : 'Manufacturer');
    const cfg = getCategoryConfig(cat);
    setFormVendor({
      id: `ven-${Date.now()}`,
      category: cat,
      stage: cfg.stages[0]?.name || 'Prospect',
      healthStatus: 'Good',
      rating: 5,
      location: '',
      certifications: [],
    });
    setIsFormOpen(true);
  };

  // Active Category Stages for Board View
  const activeBoardStages = useMemo(() => {
    if (selectedCategory === 'All') {
      // General stages overview
      return [
        { id: 'discovery', name: 'Prospect / Discovery', shortLabel: 'Discovery' },
        { id: 'eval', name: 'Evaluation / Review', shortLabel: 'Evaluation' },
        { id: 'terms', name: 'Terms & Negotiation', shortLabel: 'Terms' },
        { id: 'integration', name: 'Sampling / Integration', shortLabel: 'Active Setup' },
        { id: 'live', name: 'Live / Approved', shortLabel: 'Approved' },
        { id: 'stalled', name: 'On Hold', shortLabel: 'Hold' },
      ];
    }
    return getCategoryConfig(selectedCategory).stages;
  }, [selectedCategory]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Primary CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#cda052]" />
            Vendors & Manufacturers
          </h1>
          <p className="text-xs sm:text-sm text-[#8a96ae] mt-1">
            End-to-end partner ecosystem across garment factories, logistics & 3PL, payment gateways, packaging, collaborations, and finance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-[#0e121b] border border-[#1e263a] rounded-xl text-xs">
            <button
              onClick={() => setViewMode('rows')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'rows'
                  ? 'bg-[rgba(205,160,82,0.18)] text-[#f5d58d] font-semibold border border-[#cda052]/40 shadow-sm'
                  : 'text-[#8a96ae] hover:text-white'
              }`}
              title="Detailed High-Density Row View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Rows</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-[rgba(205,160,82,0.18)] text-[#f5d58d] font-semibold border border-[#cda052]/40 shadow-sm'
                  : 'text-[#8a96ae] hover:text-white'
              }`}
              title="Workflow Pipeline Board View"
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenAddModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b0883d] text-black text-xs font-bold hover:shadow-glow transition-all whitespace-nowrap cursor-pointer"
            title="Onboard a new vendor, mill, courier, or partner"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner</span>
          </button>
        </div>
      </div>

      {/* 2. Executive Multi-Category KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0e1320] border border-[#1c2438] flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#8a96ae] font-medium">Total Ecosystem Partners</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{metrics.total}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] text-[#cda052]">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1320] border border-[#1c2438] flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#8a96ae] font-medium">In Active Lifecycle</div>
            <div className="text-xl font-bold text-sky-400 font-mono mt-0.5">{metrics.inWorkflow}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-950/40 text-sky-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1320] border border-[#1c2438] flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#8a96ae] font-medium">Follow-Ups Scheduled</div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">{metrics.scheduledTouches}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-950/40 text-amber-400">
            <CalendarClock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0e1320] border border-[#1c2438] flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#8a96ae] font-medium">Live / Approved Partners</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{metrics.livePartners}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-950/40 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Category Filter Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-[#cda052] text-black font-bold shadow-glow'
              : 'bg-[#0e1320] border border-[#1d263b] text-[#8a96ae] hover:text-white hover:border-[#2a3754]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>All Partners</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedCategory === 'All' ? 'bg-black/20 text-black font-bold' : 'bg-white/[0.08] text-[#cbd5e1]'}`}>
            {categoryCounts.All}
          </span>
        </button>

        {ALL_VENDOR_CATEGORIES.map((catKey) => {
          const cfg = VENDOR_CATEGORIES[catKey];
          const Icon = cfg.icon;
          const isSelected = selectedCategory === catKey;
          const count = categoryCounts[catKey] || 0;

          return (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-[rgba(205,160,82,0.22)] border border-[#cda052] text-[#f5d58d] font-bold ring-1 ring-[#cda052]/40 shadow-sm'
                  : 'bg-[#0e1320] border border-[#1d263b] text-[#8a96ae] hover:text-white hover:border-[#2a3754]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-[#cda052]" />
              <span>{cfg.shortLabel}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-[#cda052]/30 text-[#f5d58d]' : 'bg-white/[0.06] text-[#cbd5e1]'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0e1320] p-3 rounded-xl border border-[#1c2438]">
        <div className="flex-1 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#717d96]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by company name, contact, specialty, location..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#07090e] border border-[#202b40] text-xs text-white placeholder-[#717d96] outline-none focus:border-[#cda052] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8a96ae] flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Health:</span>
          </span>
          <select
            value={healthFilter}
            onChange={(e) => setHealthFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#202b40] text-xs text-white outline-none focus:border-[#cda052]"
          >
            <option value="All">All Health Statuses</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Under Review">Under Review</option>
            <option value="At Risk">At Risk</option>
          </select>
        </div>
      </div>

      {/* 5. Main Content: Row View vs Board View */}
      {filteredVendors.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#1f283c] rounded-2xl bg-[#080b12]">
          <Building2 className="w-10 h-10 text-[#424e65] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No partners found</h3>
          <p className="text-xs text-[#8a96ae] max-w-sm mx-auto mb-4">
            No vendors or manufacturers match your current category or search filters.
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 rounded-xl bg-[#141a29] border border-[#263552] text-xs font-semibold text-[#cda052] hover:bg-[#1a2337] transition-colors cursor-pointer"
          >
            Add New Partner
          </button>
        </div>
      ) : viewMode === 'rows' ? (
        /* ROW VIEW */
        <div className="space-y-3">
          {filteredVendors.map((vendor) => {
            const isExpanded = expandedVendorId === vendor.id;
            const cat = getVendorCategory(vendor);
            const cfg = getCategoryConfig(cat);
            const CategoryIcon = cfg.icon;
            const progress = getStageProgress(vendor);
            const next = getNextStage(vendor);

            const primaryContact = vendor.contacts?.find((c) => c.isPrimary) || vendor.contacts?.[0] || {
              name: vendor.contactName || 'No contact listed',
              role: 'Primary Contact',
              email: vendor.contactEmail,
              phone: vendor.contactPhone,
            };

            const linkedStyles = pipelineItems.filter((p) => p.vendorId === vendor.id);
            const linkedDocs = documents.filter((d) => d.vendorId === vendor.id);
            const linkedTasks = workItems.filter((w) => w.linkedVendorId === vendor.id);

            return (
              <div
                key={vendor.id}
                className="bg-[#0e1320] border border-[#1b2336] hover:border-[#2a3854] rounded-2xl transition-all shadow-md overflow-hidden"
              >
                {/* Main Row Content */}
                <div className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  {/* Left Column: Category Badge, Name, Subcategory, Location */}
                  <div className="xl:w-[280px] flex-shrink-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#cda052] flex-shrink-0">
                        <CategoryIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3
                            onClick={() => setWorkspaceVendor(vendor)}
                            className="text-sm font-bold text-white hover:text-[#cda052] transition-colors cursor-pointer truncate"
                          >
                            {vendor.name}
                          </h3>
                          {vendor.rating && (
                            <div className="flex items-center text-amber-400">
                              <Star className="w-2.5 h-2.5 fill-amber-400" />
                              <span className="text-[10px] ml-0.5 font-semibold">{vendor.rating}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8a96ae] truncate">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                            {cfg.shortLabel}
                          </span>
                          {vendor.subcategory && <span className="truncate">{vendor.subcategory}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[#8a96ae] pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#64748b] flex-shrink-0" />
                        <span className="truncate max-w-[130px]">{vendor.location || 'Location pending'}</span>
                      </span>

                      {vendor.website && (
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[#cda052] hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          <span>Site</span>
                        </a>
                      )}

                      {vendor.healthStatus && (
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-medium ${
                          vendor.healthStatus === 'Excellent' ? 'text-emerald-400 bg-emerald-950/40' :
                          vendor.healthStatus === 'Good' ? 'text-sky-400 bg-sky-950/40' :
                          'text-amber-400 bg-amber-950/40'
                        }`}>
                          ● {vendor.healthStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Refined Workflow Stage Controls & Progress */}
                  <div className="flex-1 min-w-0 bg-[#090d16]/90 p-3 sm:p-3.5 rounded-xl border border-white/[0.05] space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a96ae] flex-shrink-0">
                          {cfg.shortLabel} Lifecycle:
                        </span>
                        {/* Interactive Stage Dropdown */}
                        <div className="relative inline-flex items-center">
                          <select
                            value={vendor.stage}
                            onChange={(e) => handleUpdateStage(vendor, e.target.value)}
                            aria-label={`Update stage for ${vendor.name}`}
                            className="appearance-none pl-2.5 pr-7 py-1 rounded-lg bg-[#141b2c] hover:bg-[#1a2338] border border-[#27344e] hover:border-[#cda052]/60 text-xs font-semibold text-[#f5d58d] cursor-pointer outline-none transition-all shadow-sm focus:ring-1 focus:ring-[#cda052]"
                          >
                            {cfg.stages.map((stg) => (
                              <option key={stg.id} value={stg.name} className="bg-[#0e121b] text-white py-1">
                                {stg.shortLabel} — {stg.name} ({stg.progressPercent}%)
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-[#cda052] absolute right-2 pointer-events-none" />
                        </div>
                      </div>

                      {next ? (
                        <button
                          onClick={() => handleAdvanceStep(vendor)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[rgba(205,160,82,0.14)] hover:bg-[rgba(205,160,82,0.25)] text-[#f5d58d] hover:text-white border border-[#cda052]/40 text-xs font-semibold transition-all cursor-pointer shadow-sm group flex-shrink-0"
                          title={`Advance to ${next.name}`}
                        >
                          <span>Advance: {next.shortLabel}</span>
                          <ArrowRight className="w-3 h-3 text-[#cda052] group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Workflow Complete</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Track & Milestones Indicator */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#8a96ae] truncate max-w-[280px]">
                          {cfg.stages.find((s) => s.name.toLowerCase() === vendor.stage.toLowerCase() || s.id.toLowerCase() === vendor.stage.toLowerCase())?.description || vendor.stage}
                        </span>
                        <span className="font-mono font-semibold text-[#f5d58d] flex-shrink-0">
                          {progress}%
                        </span>
                      </div>

                      <div className="h-1.5 w-full bg-[#141b2a] rounded-full overflow-hidden border border-white/[0.05]">
                        <div
                          className="h-full bg-gradient-to-r from-[#9d7328] via-[#cda052] to-[#f7dda0] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(205,160,82,0.35)]"
                          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Commercials & Contact Column */}
                  <div className="xl:w-[220px] flex-shrink-0 flex flex-col justify-between text-[11px] space-y-1.5">
                    <div className="space-y-0.5">
                      <div className="text-white font-semibold truncate flex items-center justify-between">
                        <span className="truncate">{primaryContact.name}</span>
                        {primaryContact.phone && (
                          <a
                            href={`https://wa.me/${primaryContact.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Chat on WhatsApp"
                            className="p-1 rounded bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-[#8a96ae] truncate">
                        {primaryContact.role || 'Partner Representative'}
                      </div>
                      <div className="text-[11px] text-[#cbd5e1] truncate pt-0.5">
                        {vendor.commercials?.ratesSummary || vendor.commercials?.paymentTerms || (vendor.moqTarget ? `MOQ Target: ${vendor.moqTarget} pcs` : 'Standard catalog')}
                      </div>
                    </div>

                    {vendor.nextFollowUpAt ? (
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold pt-0.5">
                        <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Follow-up: {new Date(vendor.nextFollowUpAt).toLocaleDateString()}</span>
                      </div>
                    ) : vendor.lastContactedAt ? (
                      <div className="flex items-center gap-1.5 text-[#8a96ae] text-[10px]">
                        <Clock className="w-3 h-3" />
                        <span>Last touch: {new Date(vendor.lastContactedAt).toLocaleDateString()}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Actions Column */}
                  <div className="flex xl:flex-col items-center xl:items-end justify-between xl:justify-center gap-2 pt-2 xl:pt-0 border-t xl:border-t-0 border-white/[0.06]">
                    <button
                      onClick={() => setWorkspaceVendor(vendor)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#172033] to-[#121927] hover:bg-[#1f2b45] border border-[#263552] text-xs font-semibold text-[#f5d58d] hover:text-white transition-colors cursor-pointer"
                      title="Open full partner workspace drawer"
                    >
                      <span>Workspace</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setExpandedVendorId(isExpanded ? null : vendor.id)}
                        className="p-1.5 rounded-lg text-[#8a96ae] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
                        title={isExpanded ? 'Collapse notes & ecosystem' : 'Expand notes & ecosystem'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setFormVendor(vendor); setIsFormOpen(true); }}
                        className="p-1.5 rounded-lg text-[#8a96ae] hover:text-[#cda052] hover:bg-white/[0.04] transition-colors cursor-pointer"
                        title="Edit partner information"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(vendor.id, vendor.name)}
                        className="p-1.5 rounded-lg text-[#8a96ae] hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Remove partner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible Inline Quick Drawer */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 py-4 bg-[#080a11] border-t border-[#1a2336] text-xs space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Follow-up scheduler */}
                      <div className="space-y-2 bg-[#0e1320] p-3.5 rounded-xl border border-[#1e2638]">
                        <div className="font-semibold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#cda052]" />
                          <span>Schedule Follow-Up</span>
                        </div>
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
                        <p className="text-[10px] text-[#717d96]">
                          Keep outreach on schedule with calendar tracking.
                        </p>
                      </div>

                      {/* Quick notes */}
                      <div className="space-y-2 bg-[#0e1320] p-3.5 rounded-xl border border-[#1e2638]">
                        <div className="font-semibold text-white text-[11px] uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#cda052]" />
                            <span>Quick Negotiation Note</span>
                          </span>
                          <button
                            onClick={() => handleSaveInlineNotes(vendor)}
                            className="text-[10px] text-[#cda052] hover:underline font-semibold cursor-pointer"
                          >
                            Save Note
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={inlineNotes[vendor.id] !== undefined ? inlineNotes[vendor.id] : (vendor.notes || '')}
                          onChange={(e) => setInlineNotes({ ...inlineNotes, [vendor.id]: e.target.value })}
                          placeholder="Log discussion takeaways or quote revisions..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222b3e] text-xs text-white placeholder-[#5a657c] outline-none focus:border-[#cda052] resize-none"
                        />
                      </div>

                      {/* Connected Ecosystem */}
                      <div className="space-y-2 bg-[#0e1320] p-3.5 rounded-xl border border-[#1e2638]">
                        <div className="font-semibold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Shirt className="w-3.5 h-3.5 text-[#cda052]" />
                          <span>Connected Ecosystem</span>
                        </div>
                        <div className="space-y-1.5 pt-0.5 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="text-[#8a96ae]">Sampling Styles:</span>
                            {linkedStyles.length > 0 ? (
                              <Link href="/pipeline" className="text-sky-400 hover:underline font-semibold">
                                {linkedStyles.length} style{linkedStyles.length === 1 ? '' : 's'} assigned
                              </Link>
                            ) : (
                              <span className="text-[#64748b]">None</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8a96ae]">Vault Documents:</span>
                            {linkedDocs.length > 0 ? (
                              <Link href="/documents" className="text-emerald-400 hover:underline font-semibold">
                                {linkedDocs.length} certificate/doc{linkedDocs.length === 1 ? '' : 's'}
                              </Link>
                            ) : (
                              <span className="text-[#64748b]">None</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8a96ae]">Work Tasks:</span>
                            {linkedTasks.length > 0 ? (
                              <Link href="/work" className="text-indigo-400 hover:underline font-semibold">
                                {linkedTasks.length} task{linkedTasks.length === 1 ? '' : 's'}
                              </Link>
                            ) : (
                              <span className="text-[#64748b]">None</span>
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
      ) : (
        /* WORKFLOW PIPELINE BOARD VIEW */
        <div className="overflow-x-auto pb-4 scrollbar-none">
          <div className="flex items-start gap-4 min-w-[1100px]">
            {activeBoardStages.map((stageItem) => {
              const stageVendors = filteredVendors.filter(
                (v) => v.stage.toLowerCase() === stageItem.name.toLowerCase() || v.stage.toLowerCase() === stageItem.id.toLowerCase()
              );

              return (
                <div
                  key={stageItem.id}
                  className="w-72 flex-shrink-0 bg-[#0c101b] border border-[#1b2336] rounded-2xl p-3 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-[#182030] pb-2">
                    <div className="font-bold text-xs text-white truncate">
                      {stageItem.name}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-white/[0.06] text-[#cda052] font-semibold">
                      {stageVendors.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {stageVendors.length === 0 ? (
                      <div className="py-6 text-center text-[#64748b] text-[11px] border border-dashed border-[#1a2336] rounded-xl">
                        No partners in this stage
                      </div>
                    ) : (
                      stageVendors.map((vendor) => {
                        const cat = getVendorCategory(vendor);
                        const cfg = getCategoryConfig(cat);
                        const CategoryIcon = cfg.icon;
                        const next = getNextStage(vendor);

                        return (
                          <div
                            key={vendor.id}
                            className="p-3 rounded-xl bg-[#0f1422] border border-[#1e273d] hover:border-[#2a3854] space-y-2 transition-all shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeBorder}`}>
                                  {cfg.shortLabel}
                                </span>
                                <h4
                                  onClick={() => setWorkspaceVendor(vendor)}
                                  className="font-bold text-white text-xs hover:text-[#cda052] transition-colors cursor-pointer truncate mt-1"
                                >
                                  {vendor.name}
                                </h4>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => { setFormVendor(vendor); setIsFormOpen(true); }}
                                  className="p-1 rounded text-[#8a96ae] hover:text-[#cda052]"
                                  title="Edit"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] text-[#cbd5e1] truncate">
                              {vendor.commercials?.ratesSummary || vendor.specialty || 'General Partner'}
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-[#8a96ae] pt-1 border-t border-white/[0.04]">
                              <span className="truncate">{vendor.location || 'Location'}</span>
                              {next && (
                                <button
                                  onClick={() => handleAdvanceStep(vendor)}
                                  className="flex items-center gap-0.5 text-[#cda052] hover:underline font-semibold cursor-pointer"
                                  title={`Advance to ${next.name}`}
                                >
                                  <span>Advance</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Modals */}
      {/* Comprehensive Partner Workspace Slide-Over Drawer */}
      <VendorWorkspaceModal
        vendor={workspaceVendor}
        onClose={() => setWorkspaceVendor(null)}
        onSave={async (updated) => {
          await saveVendor(updated);
          setWorkspaceVendor(updated);
        }}
        onEditBase={(v) => {
          setFormVendor(v);
          setIsFormOpen(true);
        }}
      />

      {/* Dynamic Add / Edit Partner Modal */}
      <VendorFormModal
        vendor={formVendor}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setFormVendor(null);
        }}
        onSave={async (updated) => {
          await saveVendor(updated);
          if (workspaceVendor?.id === updated.id) {
            setWorkspaceVendor(updated);
          }
        }}
      />
    </div>
  );
}
