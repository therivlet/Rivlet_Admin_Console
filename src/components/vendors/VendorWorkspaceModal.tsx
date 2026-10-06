'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  CalendarClock,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  FileText,
  FileCheck,
  CreditCard,
  Truck,
  Package,
  Sparkles,
  Scale,
  Cpu,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Star,
  DollarSign,
  AlertCircle,
  Pencil,
  Check,
  Shirt,
  ListTodo
} from 'lucide-react';
import Link from 'next/link';
import ModalPortal from '@/components/ui/ModalPortal';
import { VendorItem, VendorContact, VendorCommunicationEntry, VendorDocumentLink } from '@/lib/types';
import { getCategoryConfig, getVendorCategory, getStageProgress, getNextStage } from '@/lib/vendorWorkflows';
import { useAdminStore } from '@/lib/store';

interface VendorWorkspaceModalProps {
  vendor: VendorItem | null;
  onClose: () => void;
  onSave: (updated: VendorItem) => Promise<void>;
  onEditBase: (vendor: VendorItem) => void;
}

export default function VendorWorkspaceModal({
  vendor,
  onClose,
  onSave,
  onEditBase,
}: VendorWorkspaceModalProps) {
  const { pipelineItems, documents, workItems } = useAdminStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow' | 'commercials' | 'journal' | 'documents' | 'ecosystem'>('overview');

  // Contact form state
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<VendorContact>>({ name: '', role: '', email: '', phone: '', isPrimary: false });

  // Communication Log form state
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [newLog, setNewLog] = useState<Partial<VendorCommunicationEntry>>({
    channel: 'WhatsApp',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    outcome: '',
    nextFollowUpDate: '',
    loggedBy: 'Hari',
  });

  // Document form state
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<VendorDocumentLink>>({
    title: '',
    type: 'Contract / NDA',
    urlOrVaultId: '',
    validUntil: '',
  });

  if (!vendor) return null;

  const category = getVendorCategory(vendor);
  const config = getCategoryConfig(category);
  const CategoryIcon = config.icon;
  const progressPercent = getStageProgress(vendor);
  const nextStage = getNextStage(vendor);

  const linkedStyles = pipelineItems.filter((p) => p.vendorId === vendor.id);
  const linkedDocs = documents.filter((d) => d.vendorId === vendor.id);
  const linkedTasks = workItems.filter((w) => w.linkedVendorId === vendor.id);

  // Handlers for updating vendor sub-entities
  const handleUpdateStage = async (newStageName: string) => {
    const updated: VendorItem = {
      ...vendor,
      stage: newStageName,
      lastContactedAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };
    await onSave(updated);
  };

  const handleAdvanceStep = async () => {
    if (nextStage) {
      await handleUpdateStage(nextStage.name);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.email) return;
    const contactToAdd: VendorContact = {
      id: `cnt-${Date.now()}`,
      name: newContact.name,
      role: newContact.role || 'Partner Representative',
      email: newContact.email,
      phone: newContact.phone || '',
      isPrimary: newContact.isPrimary || false,
    };
    const currentContacts = vendor.contacts ? [...vendor.contacts] : [];
    if (contactToAdd.isPrimary) {
      currentContacts.forEach((c) => (c.isPrimary = false));
    }
    const updatedContacts = [...currentContacts, contactToAdd];
    await onSave({
      ...vendor,
      contacts: updatedContacts,
      contactName: contactToAdd.isPrimary ? contactToAdd.name : vendor.contactName || contactToAdd.name,
      contactEmail: contactToAdd.isPrimary ? contactToAdd.email : vendor.contactEmail || contactToAdd.email,
      contactPhone: contactToAdd.isPrimary ? contactToAdd.phone : vendor.contactPhone || contactToAdd.phone,
      updatedAt: new Date().toISOString(),
    });
    setNewContact({ name: '', role: '', email: '', phone: '', isPrimary: false });
    setIsAddingContact(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    const updatedContacts = (vendor.contacts || []).filter((c) => c.id !== contactId);
    await onSave({
      ...vendor,
      contacts: updatedContacts,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddLog = async () => {
    if (!newLog.summary) return;
    const entry: VendorCommunicationEntry = {
      id: `log-${Date.now()}`,
      date: newLog.date || new Date().toISOString().split('T')[0],
      channel: newLog.channel as any || 'WhatsApp',
      summary: newLog.summary,
      outcome: newLog.outcome || undefined,
      nextFollowUpDate: newLog.nextFollowUpDate || undefined,
      loggedBy: newLog.loggedBy || 'Hari',
    };
    const currentLogs = vendor.communicationLogs ? [entry, ...vendor.communicationLogs] : [entry];
    await onSave({
      ...vendor,
      communicationLogs: currentLogs,
      lastContactedAt: entry.date,
      nextFollowUpAt: entry.nextFollowUpDate || vendor.nextFollowUpAt,
      updatedAt: new Date().toISOString(),
    });
    setNewLog({
      channel: 'WhatsApp',
      date: new Date().toISOString().split('T')[0],
      summary: '',
      outcome: '',
      nextFollowUpDate: '',
      loggedBy: 'Hari',
    });
    setIsAddingLog(false);
  };

  const handleAddDoc = async () => {
    if (!newDoc.title) return;
    const entry: VendorDocumentLink = {
      id: `doc-${Date.now()}`,
      title: newDoc.title,
      type: newDoc.type as any || 'Contract / NDA',
      urlOrVaultId: newDoc.urlOrVaultId || '',
      validUntil: newDoc.validUntil || undefined,
    };
    const currentDocs = vendor.documents ? [...vendor.documents, entry] : [entry];
    await onSave({
      ...vendor,
      documents: currentDocs,
      updatedAt: new Date().toISOString(),
    });
    setNewDoc({ title: '', type: 'Contract / NDA', urlOrVaultId: '', validUntil: '' });
    setIsAddingDoc(false);
  };

  const handleDeleteDoc = async (docId: string) => {
    const updatedDocs = (vendor.documents || []).filter((d) => d.id !== docId);
    await onSave({
      ...vendor,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    });
  };

  const primaryContact: VendorContact = vendor.contacts?.find((c) => c.isPrimary) || vendor.contacts?.[0] || {
    id: 'c-primary',
    name: vendor.contactName || 'No contact listed',
    role: 'Primary Contact',
    email: vendor.contactEmail || '',
    phone: vendor.contactPhone || '',
    isPrimary: true,
  };

  return (
    <ModalPortal isOpen={!!vendor}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md" onClick={onClose}>
        <div
          className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#232d42] bg-[#090c13] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={`${vendor.name} workspace`}
        >
          {/* Top Header Bar */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-[#111726] to-[#0c101c] border-b border-[#1f283d] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/[0.05] border border-white/[0.08] text-[#cda052] flex-shrink-0">
                <CategoryIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">{vendor.name}</h2>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}>
                    {config.label}
                  </span>
                  {vendor.healthStatus && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      vendor.healthStatus === 'Excellent' ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50' :
                      vendor.healthStatus === 'Good' ? 'bg-sky-950/50 text-sky-300 border-sky-800/50' :
                      vendor.healthStatus === 'At Risk' ? 'bg-rose-950/50 text-rose-300 border-rose-800/50' :
                      'bg-amber-950/50 text-amber-300 border-amber-800/50'
                    }`}>
                      ● {vendor.healthStatus}
                    </span>
                  )}
                  {vendor.rating && (
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                      {Array.from({ length: vendor.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-[#8a96ae] mt-1.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#6c7892]" />
                    {vendor.location || 'Location not specified'}
                  </span>
                  {vendor.subcategory && (
                    <>
                      <span>•</span>
                      <span className="text-[#cbd5e1]">{vendor.subcategory}</span>
                    </>
                  )}
                  {vendor.website && (
                    <>
                      <span>•</span>
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#cda052] hover:underline"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Visit Site</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => onEditBase(vendor)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1a2337] border border-[#232d42] text-xs font-semibold text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                title="Edit basic vendor details"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Info</span>
              </button>
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#8a96ae] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Workflow Stepper Banner */}
          <div className="px-4 sm:px-6 py-3 bg-[#0c101b] border-b border-[#1b2336] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8a96ae]">
                Current Lifecycle Stage:
              </div>
              <span className="text-xs px-2.5 py-1 rounded-md font-bold bg-[#151c2e] border border-[#283552] text-[#e6c875]">
                {vendor.stage}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#8a96ae]">
                <div className="w-24 h-2 rounded-full bg-[#172033] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#cda052] to-[#e6c875] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] text-white font-semibold">{progressPercent}%</span>
              </div>
            </div>

            {nextStage && (
              <button
                onClick={handleAdvanceStep}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b0883d] text-black text-xs font-bold hover:shadow-glow transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
                title={`Advance to next lifecycle stage: ${nextStage.name}`}
              >
                <span>Advance to: {nextStage.shortLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-[#1a2336] bg-[#070a11] overflow-x-auto scrollbar-none">
            {[
              { id: 'overview', label: 'Overview & Profile', icon: Building2 },
              { id: 'workflow', label: 'Workflow & Progress', icon: CheckCircle2 },
              { id: 'commercials', label: 'Commercials & SLA', icon: CreditCard },
              { id: 'journal', label: `Communication Journal (${vendor.communicationLogs?.length || 0})`, icon: MessageSquare },
              { id: 'documents', label: `Contracts & Vault (${vendor.documents?.length || 0})`, icon: FileText },
              { id: 'ecosystem', label: `Connected Work (${linkedStyles.length + linkedTasks.length + linkedDocs.length})`, icon: Shirt },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-[#cda052] text-[#f5d58d] font-semibold bg-white/[0.02]'
                      : 'border-transparent text-[#8a96ae] hover:text-white hover:bg-white/[0.01]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#cda052]' : 'text-[#6c7892]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Body Contents */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-[#cbd5e1] space-y-6">
            {/* TAB 1: OVERVIEW & PROFILE */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Highlight Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#0e1320] border border-[#1d263b] space-y-1">
                    <span className="text-[10px] text-[#8a96ae] uppercase font-semibold">Primary Contact</span>
                    <div className="font-semibold text-white truncate">{primaryContact.name}</div>
                    <div className="text-[11px] text-[#93a1bd] truncate">{primaryContact.role}</div>
                    <div className="flex items-center gap-2 pt-1">
                      {primaryContact.phone && (
                        <a
                          href={`https://wa.me/${primaryContact.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp direct chat"
                          className="p-1 rounded bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {primaryContact.phone && (
                        <a
                          href={`tel:${primaryContact.phone}`}
                          title="Call phone"
                          className="p-1 rounded bg-sky-950/60 text-sky-400 hover:bg-sky-900/60 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {primaryContact.email && (
                        <a
                          href={`mailto:${primaryContact.email}`}
                          title="Send Email"
                          className="p-1 rounded bg-indigo-950/60 text-indigo-400 hover:bg-indigo-900/60 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0e1320] border border-[#1d263b] space-y-1">
                    <span className="text-[10px] text-[#8a96ae] uppercase font-semibold">Payment & Rates Terms</span>
                    <div className="font-semibold text-white truncate">
                      {vendor.commercials?.paymentTerms || vendor.paymentTermsTarget || 'Not specified'}
                    </div>
                    <div className="text-[11px] text-[#93a1bd] truncate">
                      {vendor.commercials?.ratesSummary || (vendor.moqTarget ? `MOQ Target: ${vendor.moqTarget} pcs` : 'Standard catalog')}
                    </div>
                    {vendor.commercials?.slaCommitment && (
                      <div className="text-[10px] text-amber-300 font-medium truncate pt-1">
                        SLA: {vendor.commercials.slaCommitment}
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0e1320] border border-[#1d263b] space-y-1">
                    <span className="text-[10px] text-[#8a96ae] uppercase font-semibold">Activity & Schedule</span>
                    <div className="flex items-center gap-1.5 text-white font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#6c7892]" />
                      <span>Last Touch: {vendor.lastContactedAt ? new Date(vendor.lastContactedAt).toLocaleDateString() : 'None recorded'}</span>
                    </div>
                    {vendor.nextFollowUpAt ? (
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold pt-1">
                        <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Follow-up: {new Date(vendor.nextFollowUpAt).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#717d96] pt-1">No follow-up date scheduled</div>
                    )}
                  </div>
                </div>

                {/* Category-Specific Specifications Details */}
                <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1d263a] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1b2336] pb-2">
                    <div className="font-semibold text-white uppercase text-[11px] tracking-wider flex items-center gap-2">
                      <CategoryIcon className="w-4 h-4 text-[#cda052]" />
                      <span>{config.label} Specialized Profile</span>
                    </div>
                    <span className="text-[11px] text-[#8a96ae]">Category: {config.shortLabel}</span>
                  </div>

                  {/* Manufacturer specific attributes */}
                  {category === 'Manufacturer' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Vertical Integration</span>
                        <div className="flex items-center gap-1.5 mt-0.5 font-medium">
                          {vendor.isVerticallyIntegrated === true ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> Fully Integrated (Yarn to Stitch)
                            </span>
                          ) : vendor.isVerticallyIntegrated === false ? (
                            <span className="text-rose-400 flex items-center gap-1">
                              <ShieldAlert className="w-3.5 h-3.5" /> Partial / Outsourced Steps
                            </span>
                          ) : (
                            <span className="text-[#8a96ae] flex items-center gap-1">
                              <ShieldQuestion className="w-3.5 h-3.5" /> Unconfirmed / Audit Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Target MOQ vs Offered</span>
                        <div className="font-mono font-medium text-white mt-0.5">
                          {vendor.moqTarget ? `${vendor.moqTarget} pcs` : 'No target'}
                          {vendor.moqOffered ? ` (Offered: ${vendor.moqOffered} pcs)` : ''}
                        </div>
                      </div>

                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Sampling Fee</span>
                        <div className="font-mono font-medium text-white mt-0.5">
                          {vendor.samplingFee ? `₹${vendor.samplingFee.toLocaleString()}` : 'Standard / Waived'}
                        </div>
                      </div>

                      {vendor.specialty && (
                        <div className="sm:col-span-3 pt-1">
                          <span className="text-[#8a96ae] block text-[10px]">Fabric & Manufacturing Specialty</span>
                          <p className="text-white mt-0.5 text-xs">{vendor.specialty}</p>
                        </div>
                      )}

                      {vendor.certifications && vendor.certifications.length > 0 && (
                        <div className="sm:col-span-3 pt-1">
                          <span className="text-[#8a96ae] block text-[10px] mb-1">Audits & Certifications</span>
                          <div className="flex flex-wrap gap-1.5">
                            {vendor.certifications.map((cert) => (
                              <span key={cert} className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-[10px] font-medium">
                                ✓ {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Gateway specific */}
                  {category === 'PaymentGateway' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">TDR / Fee Rates</span>
                        <div className="font-medium text-white mt-0.5">
                          {vendor.commercials?.ratesSummary || 'Custom negotiated'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Settlement Period</span>
                        <div className="font-medium text-white mt-0.5">
                          {vendor.commercials?.paymentTerms || 'T+2 Rolling'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Uptime SLA</span>
                        <div className="font-medium text-emerald-300 mt-0.5">
                          {vendor.commercials?.slaCommitment || '99.98% Gateway API'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Logistics specific */}
                  {category === 'Logistics' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Air & Surface Rates</span>
                        <div className="font-medium text-white mt-0.5">
                          {vendor.commercials?.ratesSummary || 'Standard Tariff'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Billing & Remittance</span>
                        <div className="font-medium text-white mt-0.5">
                          {vendor.commercials?.paymentTerms || 'Net 15 / T+2 COD'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Transit SLA</span>
                        <div className="font-medium text-sky-300 mt-0.5">
                          {vendor.commercials?.slaCommitment || '24-48h Metro Priority'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Packaging specific */}
                  {category === 'Packaging' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Unit Pricing & Minimums</span>
                        <div className="font-medium text-white mt-0.5">
                          {vendor.commercials?.ratesSummary || 'Quote pending'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Payment Terms</span>
                        <div className="font-medium text-white mt-0.5">
                          {vendor.commercials?.paymentTerms || '50% Adv / 50% Dispatch'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Production SLA</span>
                        <div className="font-medium text-purple-300 mt-0.5">
                          {vendor.commercials?.slaCommitment || '14 days post proof'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Collaboration specific */}
                  {category === 'Collaboration' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Deliverables & Scope</span>
                        <div className="font-medium text-white mt-0.5">
                          {vendor.commercials?.ratesSummary || 'Capsule Campaign'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Payment Milestones</span>
                        <div className="font-medium text-white mt-0.5">
                          {vendor.commercials?.paymentTerms || 'Deposit + Delivery'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Turnaround SLA</span>
                        <div className="font-medium text-pink-300 mt-0.5">
                          {vendor.commercials?.slaCommitment || '48h selects / 7d masters'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Financial / Legal specific */}
                  {category === 'FinancialLegal' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Retainer / Project Fee</span>
                        <div className="font-medium text-white mt-0.5">
                          {vendor.commercials?.ratesSummary || 'Standard Retainer'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Billing Cycle</span>
                        <div className="font-medium text-white mt-0.5">
                          {vendor.commercials?.paymentTerms || 'Monthly Retainer'}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#8a96ae] block text-[10px]">Regulatory Compliance SLA</span>
                        <div className="font-medium text-cyan-300 mt-0.5">
                          {vendor.commercials?.slaCommitment || 'Filings 3d prior to deadline'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Multiple Contacts Directory */}
                <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1d263a] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#1b2336] pb-2">
                    <div className="font-semibold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <span>Key Contacts & Representatives</span>
                      <span className="text-[#8a96ae]">({vendor.contacts?.length || 0})</span>
                    </div>
                    <button
                      onClick={() => setIsAddingContact(true)}
                      className="flex items-center gap-1 text-[11px] text-[#cda052] hover:text-[#f3d994] font-semibold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Contact</span>
                    </button>
                  </div>

                  {/* Add Contact Inline Form */}
                  {isAddingContact && (
                    <div className="p-3 rounded-lg bg-[#111726] border border-[#283552] space-y-2.5">
                      <div className="text-[11px] font-semibold text-white">Add New Contact</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Full Name *"
                          value={newContact.name}
                          onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#232f48] text-xs text-white outline-none focus:border-[#cda052]"
                        />
                        <input
                          type="text"
                          placeholder="Role (e.g. Account Director, Sampling Lead)"
                          value={newContact.role}
                          onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#232f48] text-xs text-white outline-none focus:border-[#cda052]"
                        />
                        <input
                          type="email"
                          placeholder="Email Address *"
                          value={newContact.email}
                          onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#232f48] text-xs text-white outline-none focus:border-[#cda052]"
                        />
                        <input
                          type="tel"
                          placeholder="Phone / WhatsApp (+91 ...)"
                          value={newContact.phone}
                          onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                          className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#232f48] text-xs text-white outline-none focus:border-[#cda052]"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 text-[11px] text-[#cbd5e1] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newContact.isPrimary || false}
                            onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                            className="rounded bg-[#07090e] border-[#232f48] text-[#cda052]"
                          />
                          <span>Set as Primary Contact</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setIsAddingContact(false)}
                            className="px-2.5 py-1 rounded text-xs text-[#8a96ae] hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddContact}
                            className="px-3 py-1 rounded bg-[#cda052] text-black font-semibold text-xs hover:bg-[#deb46b]"
                          >
                            Save Contact
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contacts List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(vendor.contacts && vendor.contacts.length > 0 ? vendor.contacts : [primaryContact]).map((c, idx) => (
                      <div
                        key={c.id || idx}
                        className="p-3 rounded-lg bg-[#0e1322] border border-[#1a2336] flex items-start justify-between gap-2"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white truncate">{c.name}</span>
                            {c.isPrimary && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 font-semibold">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#8a96ae] truncate">{c.role}</div>
                          <div className="flex flex-col gap-0.5 text-[11px] text-[#cbd5e1] pt-1">
                            {c.email && (
                              <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-[#8a96ae] hover:text-[#cda052] truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{c.email}</span>
                              </a>
                            )}
                            {c.phone && (
                              <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-[#8a96ae] hover:text-sky-300 truncate">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span>{c.phone}</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {c.phone && (
                            <a
                              href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Chat on WhatsApp"
                              className="p-1 rounded bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/50"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {c.id && vendor.contacts && vendor.contacts.length > 1 && (
                            <button
                              onClick={() => handleDeleteContact(c.id)}
                              title="Remove contact"
                              className="p-1 rounded text-[#717d96] hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes box */}
                {vendor.notes && (
                  <div className="p-3.5 rounded-xl bg-[#0b0f19] border border-[#1d263a] space-y-1">
                    <span className="text-[10px] text-[#8a96ae] uppercase font-semibold">General Background & Notes</span>
                    <p className="text-white text-xs leading-relaxed whitespace-pre-wrap">{vendor.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: WORKFLOW & PROGRESS */}
            {activeTab === 'workflow' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1d263a] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1b2336] pb-3">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {config.label} Lifecycle Pipeline
                      </h4>
                      <p className="text-[#8a96ae] text-[11px] mt-0.5">
                        {config.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8a96ae]">Jump to stage:</span>
                      <select
                        value={vendor.stage}
                        onChange={(e) => handleUpdateStage(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#242f47] text-xs text-white outline-none focus:border-[#cda052]"
                      >
                        {config.stages.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.progressPercent}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step by step interactive path */}
                  <div className="space-y-3 pt-1">
                    {config.stages.map((stageItem, idx) => {
                      const isCurrent = vendor.stage.toLowerCase() === stageItem.name.toLowerCase() || vendor.stage.toLowerCase() === stageItem.id.toLowerCase();
                      const isCompleted = progressPercent > stageItem.progressPercent && !stageItem.isTerminalFailure;

                      return (
                        <div
                          key={stageItem.id}
                          className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            isCurrent
                              ? 'bg-[rgba(205,160,82,0.12)] border-[#cda052] shadow-sm ring-1 ring-[#cda052]/40'
                              : isCompleted
                              ? 'bg-emerald-950/20 border-emerald-800/30'
                              : stageItem.isTerminalFailure
                              ? 'bg-rose-950/20 border-rose-800/30'
                              : 'bg-[#0e1320] border-[#1d263b] opacity-80'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs mt-0.5 flex-shrink-0 ${
                              isCurrent
                                ? 'bg-[#cda052] text-black font-extrabold shadow-glow'
                                : isCompleted
                                ? 'bg-emerald-900/60 text-emerald-300'
                                : stageItem.isTerminalFailure
                                ? 'bg-rose-900/60 text-rose-300'
                                : 'bg-[#151c2d] text-[#8a96ae]'
                            }`}>
                              {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-xs ${isCurrent ? 'text-[#f5d58d]' : isCompleted ? 'text-emerald-300' : 'text-white'}`}>
                                  {stageItem.name}
                                </span>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#cda052] text-black">
                                    Active Stage
                                  </span>
                                )}
                                {stageItem.isTerminalSuccess && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                                    Target Milestone
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#8a96ae] mt-1 leading-relaxed">
                                {stageItem.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!isCurrent && (
                              <button
                                onClick={() => handleUpdateStage(stageItem.name)}
                                className="px-2.5 py-1 rounded bg-[#172033] hover:bg-[#202c46] border border-[#263554] text-[11px] text-[#cbd5e1] hover:text-white transition-colors cursor-pointer"
                              >
                                Mark as Current
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Next Follow-up & Touchpoint scheduler */}
                <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1d263a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h5 className="font-semibold text-white text-xs flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-[#cda052]" />
                      <span>Next Scheduled Outreach / Action Date</span>
                    </h5>
                    <p className="text-[11px] text-[#8a96ae] mt-0.5">
                      Triggers calendar reminders and highlights in the KPI strip.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={vendor.nextFollowUpAt || ''}
                      onChange={(e) => {
                        onSave({
                          ...vendor,
                          nextFollowUpAt: e.target.value,
                          updatedAt: new Date().toISOString(),
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#07090e] border border-[#242f47] text-xs text-white outline-none focus:border-[#cda052]"
                    />
                    {vendor.nextFollowUpAt && (
                      <button
                        onClick={() => {
                          onSave({
                            ...vendor,
                            nextFollowUpAt: undefined,
                            updatedAt: new Date().toISOString(),
                          });
                        }}
                        className="text-[11px] text-[#8a96ae] hover:text-rose-400"
                        title="Clear date"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COMMERCIALS & SLA */}
            {activeTab === 'commercials' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1d263a] space-y-4">
                  <div className="border-b border-[#1b2336] pb-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#cda052]" />
                      <span>Commercial Structure & Payment Terms</span>
                    </h4>
                    <p className="text-[#8a96ae] text-[11px] mt-0.5">
                      Agreed financial terms, rate card schedules, credit limits, and banking coordinates.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-[#0e1320] border border-[#1e2639] space-y-1">
                      <span className="text-[10px] text-[#8a96ae] uppercase font-semibold">Payment Terms & Schedule</span>
                      <div className="text-white font-medium">
                        {vendor.commercials?.paymentTerms || vendor.paymentTermsTarget || 'Not specified'}
                      </div>
                      <p className="text-[10px] text-[#717d96]">Advance percentage, credit window, or rolling settlement.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0e1320] border border-[#1e2639] space-y-1">
                      <span className="text-[10px] text-[#8a96ae] uppercase font-semibold">Rate Card & Pricing Matrix</span>
                      <div className="text-white font-medium">
                        {vendor.commercials?.ratesSummary || 'Standard negotiated rates'}
                      </div>
                      <p className="text-[10px] text-[#717d96]">Unit CMT, per-500g courier, or transaction TDR %.</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0e1320] border border-[#1e2639] space-y-1">
                      <span className="text-[10px] text-[#8a96ae] uppercase font-semibold">Tax Identification / GSTIN / PAN</span>
                      <div className="font-mono text-white font-medium">
                        {vendor.commercials?.taxId || 'Pending registration copy'}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#0e1320] border border-[#1e2639] space-y-1">
                      <span className="text-[10px] text-[#8a96ae] uppercase font-semibold">Guaranteed SLA & Metrics</span>
                      <div className="text-amber-300 font-medium">
                        {vendor.commercials?.slaCommitment || 'Standard terms'}
                      </div>
                      <p className="text-[10px] text-[#717d96]">Quality AQL, on-time dispatch %, or uptime percentage.</p>
                    </div>

                    {vendor.commercials?.creditLimit && (
                      <div className="p-3 rounded-lg bg-[#0e1320] border border-[#1e2639] space-y-1">
                        <span className="text-[10px] text-[#8a96ae] uppercase font-semibold">Pre-approved Credit Limit</span>
                        <div className="font-mono text-emerald-400 font-medium">
                          {vendor.commercials.currency || '₹'}{vendor.commercials.creditLimit.toLocaleString()}
                        </div>
                      </div>
                    )}

                    {vendor.commercials?.creditDays && (
                      <div className="p-3 rounded-lg bg-[#0e1320] border border-[#1e2639] space-y-1">
                        <span className="text-[10px] text-[#8a96ae] uppercase font-semibold">Credit Window (Days)</span>
                        <div className="font-mono text-white font-medium">
                          {vendor.commercials.creditDays} days
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: COMMUNICATION JOURNAL */}
            {activeTab === 'journal' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#cda052]" />
                      <span>Communication History & Touchpoint Logs</span>
                    </h4>
                    <p className="text-[#8a96ae] text-[11px] mt-0.5">
                      Chronological log of WhatsApp chats, phone calls, in-person meetings, and negotiations.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingLog(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b0883d] text-black text-xs font-semibold hover:shadow-glow transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Touchpoint</span>
                  </button>
                </div>

                {/* Add Log Modal/Box */}
                {isAddingLog && (
                  <div className="p-4 rounded-xl bg-[#0f1524] border border-[#293652] space-y-3">
                    <h5 className="font-semibold text-white text-xs">Record New Interaction</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] text-[#8a96ae] block mb-1">Channel / Medium</label>
                        <select
                          value={newLog.channel}
                          onChange={(e) => setNewLog({ ...newLog, channel: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-xs text-white outline-none focus:border-[#cda052]"
                        >
                          {['WhatsApp', 'Phone Call', 'Email', 'In-Person Meeting', 'Portal', 'Note'].map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8a96ae] block mb-1">Date</label>
                        <input
                          type="date"
                          value={newLog.date}
                          onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-xs text-white outline-none focus:border-[#cda052]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-[#8a96ae] block mb-1">Scheduled Next Follow-Up (Optional)</label>
                        <input
                          type="date"
                          value={newLog.nextFollowUpDate || ''}
                          onChange={(e) => setNewLog({ ...newLog, nextFollowUpDate: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-xs text-white outline-none focus:border-[#cda052]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8a96ae] block mb-1">Summary of Conversation & Discussion Points *</label>
                      <textarea
                        rows={2}
                        value={newLog.summary}
                        onChange={(e) => setNewLog({ ...newLog, summary: e.target.value })}
                        placeholder="Discussed sample fit comments, reviewed revised rate card, agreed on MOQ..."
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-xs text-white placeholder-[#5a6680] outline-none focus:border-[#cda052] resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#8a96ae] block mb-1">Agreed Next Steps / Outcome</label>
                      <input
                        type="text"
                        value={newLog.outcome || ''}
                        onChange={(e) => setNewLog({ ...newLog, outcome: e.target.value })}
                        placeholder="e.g. Swatch dispatch scheduled for Tuesday; PO to be released"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-xs text-white placeholder-[#5a6680] outline-none focus:border-[#cda052]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setIsAddingLog(false)}
                        className="px-3 py-1.5 rounded text-xs text-[#8a96ae] hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddLog}
                        className="px-4 py-1.5 rounded bg-[#cda052] text-black font-semibold text-xs hover:bg-[#deb46b]"
                      >
                        Save Entry
                      </button>
                    </div>
                  </div>
                )}

                {/* Chronological Logs List */}
                {(!vendor.communicationLogs || vendor.communicationLogs.length === 0) ? (
                  <div className="p-8 text-center rounded-xl bg-[#0a0d16] border border-dashed border-[#1f283c]">
                    <MessageSquare className="w-8 h-8 text-[#4a556d] mx-auto mb-2" />
                    <div className="text-white font-semibold text-xs">No communications recorded yet</div>
                    <p className="text-[#8a96ae] text-[11px] mt-1 max-w-sm mx-auto">
                      Log WhatsApp chats, phone calls, meetings, or email updates to track complete partner relationship history.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {vendor.communicationLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-xl bg-[#0e1320] border border-[#1e2639] space-y-1.5 hover:border-[#2a3650] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#172033] border border-[#253450] text-[#cbd5e1]">
                              {log.channel}
                            </span>
                            <span className="font-semibold text-white">{log.date}</span>
                          </div>
                          <span className="text-[10px] text-[#8a96ae]">Logged by {log.loggedBy}</span>
                        </div>

                        <p className="text-xs text-[#e2e8f0] leading-relaxed whitespace-pre-wrap">{log.summary}</p>

                        {(log.outcome || log.nextFollowUpDate) && (
                          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] border-t border-white/[0.04]">
                            {log.outcome && (
                              <span className="text-emerald-300 font-medium">
                                Outcome: {log.outcome}
                              </span>
                            )}
                            {log.nextFollowUpDate && (
                              <span className="text-amber-300 font-medium flex items-center gap-1">
                                <CalendarClock className="w-3 h-3" />
                                Next: {log.nextFollowUpDate}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: CONTRACTS & VAULT */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#cda052]" />
                      <span>Agreements, Rate Cards & Certifications</span>
                    </h4>
                    <p className="text-[#8a96ae] text-[11px] mt-0.5">
                      NDAs, Master Service Agreements, compliance certificates, and technical spec sheets.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingDoc(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b0883d] text-black text-xs font-semibold hover:shadow-glow transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Attach Document</span>
                  </button>
                </div>

                {/* Add Document Inline Form */}
                {isAddingDoc && (
                  <div className="p-3.5 rounded-xl bg-[#0f1524] border border-[#293652] space-y-2.5">
                    <h5 className="font-semibold text-white text-xs">Attach Document / Agreement Link</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Document Title (e.g. Master NDA 2026) *"
                        value={newDoc.title}
                        onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-xs text-white outline-none focus:border-[#cda052]"
                      />
                      <select
                        value={newDoc.type}
                        onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value as any })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-xs text-white outline-none focus:border-[#cda052]"
                      >
                        {['Contract / NDA', 'Rate Card', 'SLA', 'Invoice', 'Compliance / Cert', 'Spec Sheet', 'Other'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        type="date"
                        placeholder="Valid Until Date"
                        value={newDoc.validUntil || ''}
                        onChange={(e) => setNewDoc({ ...newDoc, validUntil: e.target.value })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-xs text-white outline-none focus:border-[#cda052]"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setIsAddingDoc(false)}
                        className="px-3 py-1 rounded text-xs text-[#8a96ae] hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddDoc}
                        className="px-4 py-1 rounded bg-[#cda052] text-black font-semibold text-xs hover:bg-[#deb46b]"
                      >
                        Save Attachment
                      </button>
                    </div>
                  </div>
                )}

                {/* Documents List */}
                {(!vendor.documents || vendor.documents.length === 0) ? (
                  <div className="p-8 text-center rounded-xl bg-[#0a0d16] border border-dashed border-[#1f283c]">
                    <FileCheck className="w-8 h-8 text-[#4a556d] mx-auto mb-2" />
                    <div className="text-white font-semibold text-xs">No documents attached yet</div>
                    <p className="text-[#8a96ae] text-[11px] mt-1 max-w-sm mx-auto">
                      Attach copies of signed agreements, rate cards, and OEKO-TEX / compliance certifications.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {vendor.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3.5 rounded-xl bg-[#0e1320] border border-[#1e2639] flex items-center justify-between gap-3 hover:border-[#2a3650] transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-[#172033] text-[#cda052] border border-[#263450]">
                            {doc.type}
                          </span>
                          <div className="font-semibold text-white truncate text-xs">{doc.title}</div>
                          {doc.validUntil && (
                            <div className="text-[10px] text-[#8a96ae]">
                              Valid until: {new Date(doc.validUntil).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleDeleteDoc(doc.id)}
                            title="Remove document link"
                            className="p-1 rounded text-[#717d96] hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: CONNECTED ECOSYSTEM */}
            {activeTab === 'ecosystem' && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Shirt className="w-4 h-4 text-[#cda052]" />
                    <span>Cross-Module Connected Work</span>
                  </h4>
                  <p className="text-[#8a96ae] text-[11px] mt-0.5">
                    Production styles, task tracking items, and vault documentation linked to {vendor.name}.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Linked Styles */}
                  <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1d263a] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1b2336] pb-2">
                      <span className="font-semibold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                        <Shirt className="w-3.5 h-3.5 text-sky-400" />
                        <span>Sampling Pipeline</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-sky-400">{linkedStyles.length}</span>
                    </div>

                    {linkedStyles.length === 0 ? (
                      <p className="text-[#717d96] text-[11px]">No styles assigned to this vendor yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {linkedStyles.map((style) => (
                          <Link
                            key={style.id}
                            href="/pipeline"
                            className="p-2.5 rounded-lg bg-[#0e1320] border border-[#1b2336] hover:border-sky-500/40 block transition-colors group"
                          >
                            <div className="font-semibold text-white text-xs group-hover:text-sky-300 flex items-center justify-between gap-1">
                              <span>{style.styleName}</span>
                              {style.accessionCode && (
                                <span className="font-mono text-[9px] text-[#cda052] bg-[rgba(205,160,82,0.12)] border border-[rgba(205,160,82,0.25)] px-1 py-0.2 rounded font-normal">
                                  {style.accessionCode}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#8a96ae] mt-1">
                              <span>{style.drop}</span>
                              <span className="px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800/40">
                                {style.stage}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Linked Tasks */}
                  <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1d263a] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1b2336] pb-2">
                      <span className="font-semibold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                        <ListTodo className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Work Tasks / Sprints</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-400">{linkedTasks.length}</span>
                    </div>

                    {linkedTasks.length === 0 ? (
                      <p className="text-[#717d96] text-[11px]">No sprint tasks connected.</p>
                    ) : (
                      <div className="space-y-2">
                        {linkedTasks.map((task) => (
                          <Link
                            key={task.id}
                            href="/work"
                            className="p-2.5 rounded-lg bg-[#0e1320] border border-[#1b2336] hover:border-indigo-500/40 block transition-colors group"
                          >
                            <div className="font-semibold text-white text-xs group-hover:text-indigo-300">
                              {task.title}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#8a96ae] mt-1">
                              <span>{task.priority}</span>
                              <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                                {task.state}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Linked Documents */}
                  <div className="p-4 rounded-xl bg-[#0b0f19] border border-[#1d263a] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1b2336] pb-2">
                      <span className="font-semibold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Vault Documents</span>
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-400">{linkedDocs.length}</span>
                    </div>

                    {linkedDocs.length === 0 ? (
                      <p className="text-[#717d96] text-[11px]">No vault documents linked.</p>
                    ) : (
                      <div className="space-y-2">
                        {linkedDocs.map((doc) => (
                          <Link
                            key={doc.id}
                            href="/documents"
                            className="p-2.5 rounded-lg bg-[#0e1320] border border-[#1b2336] hover:border-emerald-500/40 block transition-colors group"
                          >
                            <div className="font-semibold text-white text-xs group-hover:text-emerald-300">
                              {doc.title}
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#8a96ae] mt-1">
                              <span>{doc.documentType}</span>
                              <span className="text-[10px] text-emerald-400">View In Vault →</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
