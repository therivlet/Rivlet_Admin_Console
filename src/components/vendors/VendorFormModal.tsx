'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Building2,
  Factory,
  Truck,
  CreditCard,
  Package,
  Sparkles,
  Scale,
  Cpu,
  Globe,
  MapPin,
  Phone,
  Mail,
  User,
  Star,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import ModalPortal from '@/components/ui/ModalPortal';
import { VendorItem, VendorCategory, VendorHealthStatus } from '@/lib/types';
import {
  VENDOR_CATEGORIES,
  ALL_VENDOR_CATEGORIES,
  getCategoryConfig,
  getVendorCategory,
} from '@/lib/vendorWorkflows';

interface VendorFormModalProps {
  vendor: Partial<VendorItem> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendor: VendorItem) => Promise<void>;
}

export default function VendorFormModal({
  vendor,
  isOpen,
  onClose,
  onSave,
}: VendorFormModalProps) {
  const [formData, setFormData] = useState<Partial<VendorItem>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (vendor) {
      const cat = getVendorCategory(vendor);
      const config = getCategoryConfig(cat);
      setFormData({
        ...vendor,
        category: cat,
        stage: vendor.stage || config.stages[0]?.name || 'Prospect',
        healthStatus: vendor.healthStatus || 'Good',
        rating: vendor.rating || 5,
        location: vendor.location || '',
        commercials: vendor.commercials || {},
        contacts: vendor.contacts || (vendor.contactName ? [
          {
            id: 'c-primary',
            name: vendor.contactName,
            email: vendor.contactEmail || '',
            phone: vendor.contactPhone || '',
            role: 'Primary Contact',
            isPrimary: true,
          }
        ] : []),
      });
    }
  }, [vendor]);

  if (!isOpen || !vendor) return null;

  const currentCategory: VendorCategory = formData.category || 'Manufacturer';
  const categoryConfig = getCategoryConfig(currentCategory);

  const handleCategoryChange = (newCat: VendorCategory) => {
    const newConfig = getCategoryConfig(newCat);
    setFormData((prev) => ({
      ...prev,
      category: newCat,
      stage: newConfig.stages[0]?.name || 'Prospect',
    }));
  };

  const handleSave = async () => {
    if (!formData.name || formData.name.trim().length < 2) {
      setError('Partner / Vendor name is required (at least 2 characters).');
      return;
    }
    setError(null);
    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      // Ensure primary contact sync
      const contacts = formData.contacts || [];
      const primary = contacts.find((c) => c.isPrimary) || contacts[0];

      const fullVendor: VendorItem = {
        id: formData.id || `ven-${Date.now()}`,
        name: formData.name.trim(),
        category: currentCategory,
        subcategory: formData.subcategory?.trim() || undefined,
        location: formData.location?.trim() || 'Facility',
        website: formData.website?.trim() || undefined,
        healthStatus: (formData.healthStatus as VendorHealthStatus) || 'Good',
        rating: formData.rating || 5,
        stage: formData.stage || categoryConfig.stages[0]?.name || 'Prospect',
        stageProgressPercent: formData.stageProgressPercent,

        contactName: primary?.name || formData.contactName,
        contactEmail: primary?.email || formData.contactEmail,
        contactPhone: primary?.phone || formData.contactPhone,
        contacts: contacts,

        // Specifications
        specialty: formData.specialty?.trim() || undefined,
        isVerticallyIntegrated: formData.isVerticallyIntegrated,
        moqTarget: formData.moqTarget,
        moqOffered: formData.moqOffered,
        samplingFee: formData.samplingFee,
        paymentTermsTarget: formData.paymentTermsTarget,
        certifications: formData.certifications || [],

        commercials: {
          currency: formData.commercials?.currency || '₹',
          paymentTerms: formData.commercials?.paymentTerms || formData.paymentTermsTarget || undefined,
          ratesSummary: formData.commercials?.ratesSummary || undefined,
          slaCommitment: formData.commercials?.slaCommitment || undefined,
          taxId: formData.commercials?.taxId || undefined,
          creditDays: formData.commercials?.creditDays,
        },

        communicationLogs: formData.communicationLogs || [],
        documents: formData.documents || [],

        notes: formData.notes?.trim() || undefined,
        nextFollowUpAt: formData.nextFollowUpAt || undefined,
        lastContactedAt: formData.lastContactedAt || undefined,
        createdAt: formData.createdAt || now,
        updatedAt: now,
      };

      await onSave(fullVendor);
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save vendor');
      setIsSaving(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md" onClick={onClose}>
        <div
          className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#232f48] bg-[#090c13] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={formData.id ? 'Edit Partner Details' : 'Add New Partner'}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-[#0e1322] border-b border-[#1c263c] flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#cda052]" />
                <span>{formData.createdAt ? 'Edit Partner Profile' : 'Add New Vendor or Manufacturer'}</span>
              </h2>
              <p className="text-xs text-[#8a96ae] mt-0.5">
                Configure partner classification, category workflow, commercials, and key contacts.
              </p>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-[#8a96ae] hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mx-5 mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-xs text-[#cbd5e1] space-y-5">
            {/* 1. Category Selector Pills */}
            <div>
              <label className="text-[11px] font-semibold text-[#8a96ae] uppercase tracking-wider block mb-2">
                Select Partner Domain & Category *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALL_VENDOR_CATEGORIES.map((catKey) => {
                  const cfg = VENDOR_CATEGORIES[catKey];
                  const Icon = cfg.icon;
                  const isSelected = currentCategory === catKey;

                  return (
                    <button
                      type="button"
                      key={catKey}
                      onClick={() => handleCategoryChange(catKey)}
                      className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[rgba(205,160,82,0.18)] border-[#cda052] ring-1 ring-[#cda052]/50 text-white'
                          : 'bg-[#0f1422] border-[#1d273a] text-[#8a96ae] hover:text-white hover:border-[#2a3854]'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${isSelected ? 'bg-[#cda052] text-black font-bold' : 'bg-[#182033] text-[#cda052]'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs truncate">{cfg.shortLabel}</div>
                        <div className="text-[10px] text-[#717d96] truncate">{cfg.pluralLabel}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Basic Identification */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#8a96ae] block mb-1">Partner / Company Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Layo Group, Razorpay, Blue Dart"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e1320] border border-[#202c44] text-white text-xs outline-none focus:border-[#cda052]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#8a96ae] block mb-1">Subcategory / Specialization</label>
                  <input
                    type="text"
                    value={formData.subcategory || ''}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g. Cut & Sew Activewear, Air Express 3PL, UPI Gateway"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e1320] border border-[#202c44] text-white text-xs outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#8a96ae] block mb-1">Location / HQ / Facility</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Tirupur, Tamil Nadu or Bengaluru"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e1320] border border-[#202c44] text-white text-xs outline-none focus:border-[#cda052]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#8a96ae] block mb-1">Official Website</label>
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg bg-[#0e1320] border border-[#202c44] text-white text-xs outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[#8a96ae] block mb-1">Current Lifecycle Stage</label>
                  <select
                    value={formData.stage || categoryConfig.stages[0]?.name}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#0e1320] border border-[#202c44] text-white text-xs outline-none focus:border-[#cda052]"
                  >
                    {categoryConfig.stages.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.progressPercent}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#8a96ae] block mb-1">Partnership Health</label>
                  <select
                    value={formData.healthStatus || 'Good'}
                    onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#0e1320] border border-[#202c44] text-white text-xs outline-none focus:border-[#cda052]"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Under Review">Under Review</option>
                    <option value="At Risk">At Risk</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#8a96ae] block mb-1">Partner Rating</label>
                  <select
                    value={formData.rating || 5}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-lg bg-[#0e1320] border border-[#202c44] text-white text-xs outline-none focus:border-[#cda052]"
                  >
                    <option value="5">★★★★★ (5 Stars)</option>
                    <option value="4">★★★★☆ (4 Stars)</option>
                    <option value="3">★★★☆☆ (3 Stars)</option>
                    <option value="2">★★☆☆☆ (2 Stars)</option>
                    <option value="1">★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Dynamic Category-Specific Fields */}
            <div className="p-4 rounded-xl bg-[#0f1423] border border-[#1e273d] space-y-3">
              <div className="font-semibold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5 border-b border-[#1b2336] pb-2">
                <span>Domain Specific Parameters: {categoryConfig.label}</span>
              </div>

              {/* Manufacturer Fields */}
              {currentCategory === 'Manufacturer' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-[#8a96ae] block mb-1">MOQ Target (Rivlet Ask)</label>
                      <input
                        type="number"
                        value={formData.moqTarget ?? ''}
                        onChange={(e) => setFormData({ ...formData, moqTarget: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="e.g. 175 pcs"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#8a96ae] block mb-1">MOQ Offered (Factory)</label>
                      <input
                        type="number"
                        value={formData.moqOffered ?? ''}
                        onChange={(e) => setFormData({ ...formData, moqOffered: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="e.g. 250 pcs"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#8a96ae] block mb-1">Sampling Fee (₹)</label>
                      <input
                        type="number"
                        value={formData.samplingFee ?? ''}
                        onChange={(e) => setFormData({ ...formData, samplingFee: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="e.g. 15000"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Fabric & Machinery Specialty</label>
                    <input
                      type="text"
                      value={formData.specialty || ''}
                      onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                      placeholder="e.g. 78/22 Nylon-Lycra compression knits, flatlock bonded seams"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Vertically Integrated Factory? (yarn → knit → dye → stitch)</label>
                    <select
                      value={formData.isVerticallyIntegrated === null || formData.isVerticallyIntegrated === undefined ? 'unknown' : String(formData.isVerticallyIntegrated)}
                      onChange={(e) => setFormData({ ...formData, isVerticallyIntegrated: e.target.value === 'unknown' ? null : e.target.value === 'true' })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    >
                      <option value="unknown">Audit Pending / Unconfirmed</option>
                      <option value="true">Yes — Fully Vertically Integrated</option>
                      <option value="false">No — Partial / Outsources dye or knitting</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Logistics Fields */}
              {currentCategory === 'Logistics' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Air & Surface Rate Card Summary</label>
                    <input
                      type="text"
                      value={formData.commercials?.ratesSummary || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, ratesSummary: e.target.value } })}
                      placeholder="e.g. ₹55/500g Air Metro, ₹42/500g Surface"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Guaranteed Transit SLA</label>
                    <input
                      type="text"
                      value={formData.commercials?.slaCommitment || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, slaCommitment: e.target.value } })}
                      placeholder="e.g. 24-48h metro delivery; 98.5% on-time"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                </div>
              )}

              {/* Payment Gateway Fields */}
              {currentCategory === 'PaymentGateway' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">TDR / Transaction Fee Rates</label>
                    <input
                      type="text"
                      value={formData.commercials?.ratesSummary || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, ratesSummary: e.target.value } })}
                      placeholder="e.g. UPI 0%, Domestic Cards 1.85% + GST"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Gateway Uptime SLA Commitment</label>
                    <input
                      type="text"
                      value={formData.commercials?.slaCommitment || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, slaCommitment: e.target.value } })}
                      placeholder="e.g. 99.98% Gateway API Uptime"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                </div>
              )}

              {/* Packaging Fields */}
              {currentCategory === 'Packaging' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Packaging Specs & Unit Pricing</label>
                    <input
                      type="text"
                      value={formData.commercials?.ratesSummary || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, ratesSummary: e.target.value } })}
                      placeholder="e.g. ₹68 / rigid magnetic box; ₹4.20 / custom polybag"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Production Turnaround SLA</label>
                    <input
                      type="text"
                      value={formData.commercials?.slaCommitment || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, slaCommitment: e.target.value } })}
                      placeholder="e.g. 14 days post physical proof approval"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                </div>
              )}

              {/* Collaboration Fields */}
              {currentCategory === 'Collaboration' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Deliverables Package & Rates</label>
                    <input
                      type="text"
                      value={formData.commercials?.ratesSummary || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, ratesSummary: e.target.value } })}
                      placeholder="e.g. ₹1,25,000 for lookbook + 6 hero styling Reels"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Delivery SLA</label>
                    <input
                      type="text"
                      value={formData.commercials?.slaCommitment || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, slaCommitment: e.target.value } })}
                      placeholder="e.g. Raw selects in 48h; final retouched in 7 days"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                </div>
              )}

              {/* Financial / Legal Fields */}
              {currentCategory === 'FinancialLegal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Retainer / Legal Fees</label>
                    <input
                      type="text"
                      value={formData.commercials?.ratesSummary || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, ratesSummary: e.target.value } })}
                      placeholder="e.g. ₹22,000 / month retainer"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Statutory Compliance SLA</label>
                    <input
                      type="text"
                      value={formData.commercials?.slaCommitment || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, slaCommitment: e.target.value } })}
                      placeholder="e.g. All GSTR filings 3 days prior to due dates"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                </div>
              )}

              {/* Software / Tech Fields */}
              {currentCategory === 'SoftwareTech' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Subscription / Platform Fee</label>
                    <input
                      type="text"
                      value={formData.commercials?.ratesSummary || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, ratesSummary: e.target.value } })}
                      placeholder="e.g. $2,000 / year base platform"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8a96ae] block mb-1">Uptime & Support SLA</label>
                    <input
                      type="text"
                      value={formData.commercials?.slaCommitment || ''}
                      onChange={(e) => setFormData({ ...formData, commercials: { ...formData.commercials, slaCommitment: e.target.value } })}
                      placeholder="e.g. 99.99% Cloud Uptime SLA"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Commercials & Billing Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-[#8a96ae] block mb-1">Payment Terms & Milestones</label>
                <input
                  type="text"
                  value={formData.commercials?.paymentTerms || formData.paymentTermsTarget || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    paymentTermsTarget: e.target.value,
                    commercials: { ...formData.commercials, paymentTerms: e.target.value },
                  })}
                  placeholder="e.g. Net 30, T+2 Settlement, 30% Adv / 70% Pre-dispatch"
                  className="w-full px-3 py-2 rounded-lg bg-[#0e1320] border border-[#202c44] text-white text-xs outline-none focus:border-[#cda052]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8a96ae] block mb-1">Tax ID / GSTIN / PAN</label>
                <input
                  type="text"
                  value={formData.commercials?.taxId || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    commercials: { ...formData.commercials, taxId: e.target.value },
                  })}
                  placeholder="e.g. 33AABCL1290K1ZX"
                  className="w-full px-3 py-2 rounded-lg bg-[#0e1320] border border-[#202c44] text-white text-xs outline-none focus:border-[#cda052]"
                />
              </div>
            </div>

            {/* 5. Primary Contact Person */}
            <div className="p-4 rounded-xl bg-[#0f1423] border border-[#1e273d] space-y-3">
              <div className="font-semibold text-white uppercase text-[11px] tracking-wider flex items-center gap-1.5 border-b border-[#1b2336] pb-2">
                <User className="w-3.5 h-3.5 text-[#cda052]" />
                <span>Primary Partner Contact</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#8a96ae] block mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contactName || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      const contacts = formData.contacts ? [...formData.contacts] : [];
                      if (contacts.length === 0) {
                        contacts.push({ id: 'c-1', name, email: formData.contactEmail || '', phone: formData.contactPhone || '', role: 'Primary Contact', isPrimary: true });
                      } else {
                        contacts[0].name = name;
                      }
                      setFormData({ ...formData, contactName: name, contacts });
                    }}
                    placeholder="e.g. R. Rajesh Kumar"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8a96ae] block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail || ''}
                    onChange={(e) => {
                      const email = e.target.value;
                      const contacts = formData.contacts ? [...formData.contacts] : [];
                      if (contacts.length === 0) {
                        contacts.push({ id: 'c-1', name: formData.contactName || '', email, phone: formData.contactPhone || '', role: 'Primary Contact', isPrimary: true });
                      } else {
                        contacts[0].email = email;
                      }
                      setFormData({ ...formData, contactEmail: email, contacts });
                    }}
                    placeholder="rajesh@partner.com"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#8a96ae] block mb-1">Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.contactPhone || ''}
                    onChange={(e) => {
                      const phone = e.target.value;
                      const contacts = formData.contacts ? [...formData.contacts] : [];
                      if (contacts.length === 0) {
                        contacts.push({ id: 'c-1', name: formData.contactName || '', email: formData.contactEmail || '', phone, role: 'Primary Contact', isPrimary: true });
                      } else {
                        contacts[0].phone = phone;
                      }
                      setFormData({ ...formData, contactPhone: phone, contacts });
                    }}
                    placeholder="+91 98422 11029"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#222d44] text-white text-xs outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>
            </div>

            {/* 6. General Notes */}
            <div>
              <label className="text-[11px] font-semibold text-[#8a96ae] block mb-1">Internal Notes & Context</label>
              <textarea
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Log internal notes, negotiation takeaways, key strengths..."
                className="w-full px-3 py-2 rounded-lg bg-[#0e1320] border border-[#202c44] text-white text-xs placeholder-[#5a6680] outline-none focus:border-[#cda052] resize-none"
              />
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 sm:p-5 bg-[#0e1322] border-t border-[#1c263c] flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[#8a96ae] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b0883d] text-black text-xs font-bold hover:shadow-glow transition-all disabled:opacity-60 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : formData.createdAt ? 'Update Partner' : 'Save Partner'}</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
