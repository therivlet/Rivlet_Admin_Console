'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Building2, 
  ShieldCheck, 
  Key, 
  Lock, 
  Check, 
  Save, 
  LogOut, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  Globe, 
  Smartphone, 
  CreditCard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import RivletLogo from '@/components/brand/RivletLogo';
import Link from 'next/link';

// GST state codes for the leading 2 digits of a GSTIN (covers major states;
// falls back to just showing the numeric code for anything not listed).
const GST_STATE_CODES: Record<string, string> = {
  '06': 'Haryana', '07': 'Delhi', '09': 'Uttar Pradesh', '19': 'West Bengal',
  '21': 'Odisha', '24': 'Gujarat', '27': 'Maharashtra', '29': 'Karnataka',
  '32': 'Kerala', '33': 'Tamil Nadu', '36': 'Telangana', '37': 'Andhra Pradesh',
};

export default function ProfilePage() {
  const { user, signOut, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'brand' | 'security' | 'preferences'>('profile');

  // Personal Profile State — real values or empty, never a fabricated
  // placeholder that could get silently saved to Supabase as if the user
  // had entered it. Empty fields show hint text via the input's placeholder.
  const [fullName, setFullName] = useState(user?.metadata?.full_name || user?.name || '');
  const [email] = useState(user?.email || '');
  const [roleTitle, setRoleTitle] = useState(user?.metadata?.role_title || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.metadata?.phone_number || '');
  const [department, setDepartment] = useState(user?.metadata?.department || '');

  // Brand Entity State
  const [legalEntity, setLegalEntity] = useState(user?.metadata?.legal_entity || 'Rivlet');
  const [gstin, setGstin] = useState(user?.metadata?.gstin || '');
  const [primaryHub, setPrimaryHub] = useState(user?.metadata?.primary_hub || '');
  const [warehouseLocation, setWarehouseLocation] = useState(user?.metadata?.warehouse_location || '');
  const [defaultCurrency, setDefaultCurrency] = useState(user?.metadata?.default_currency || '₹');
  const [defaultTargetMargin, setDefaultTargetMargin] = useState(user?.metadata?.default_target_margin ?? 25);

  // Sync state when user session loads/updates from Supabase
  useEffect(() => {
    if (user?.metadata) {
      if (user.metadata.full_name) setFullName(user.metadata.full_name);
      if (user.metadata.role_title) setRoleTitle(user.metadata.role_title);
      if (user.metadata.phone_number !== undefined) setPhoneNumber(user.metadata.phone_number);
      if (user.metadata.department) setDepartment(user.metadata.department);
      if (user.metadata.legal_entity) setLegalEntity(user.metadata.legal_entity);
      if (user.metadata.gstin !== undefined) setGstin(user.metadata.gstin);
      if (user.metadata.primary_hub) setPrimaryHub(user.metadata.primary_hub);
      if (user.metadata.warehouse_location) setWarehouseLocation(user.metadata.warehouse_location);
      if (user.metadata.default_currency) setDefaultCurrency(user.metadata.default_currency);
      if (user.metadata.default_target_margin !== undefined) setDefaultTargetMargin(user.metadata.default_target_margin);
    }
  }, [user]);

  // Security / Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Cloud Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [savedAlert, setSavedAlert] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Field validation, scoped per tab — each tab has its own Save button, and
  // validating every field across every tab on any single Save previously
  // meant a user editing Profile could be blocked by an error on a Brand
  // field they hadn't even looked at yet.
  const validateProfileFields = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errors.fullName = 'Full legal name must be at least 2 characters.';
    }

    if (!roleTitle.trim() || roleTitle.trim().length < 2) {
      errors.roleTitle = 'Role & title must be at least 2 characters.';
    }

    if (phoneNumber.trim()) {
      const phoneRegex = /^\+?[0-9\s-]{10,16}$/;
      if (!phoneRegex.test(phoneNumber.trim())) {
        errors.phoneNumber = 'Enter a valid phone number (10-15 digits, e.g. +91 98765 43210).';
      }
    }

    return errors;
  };

  const validateBrandFields = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!legalEntity.trim() || legalEntity.trim().length < 2) {
      errors.legalEntity = 'Registered legal entity must be at least 2 characters.';
    }

    if (gstin.trim()) {
      const gstinClean = gstin.trim().toUpperCase();
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(gstinClean)) {
        errors.gstin = 'Invalid GSTIN. Standard Indian format is 15 alphanumeric characters (e.g. 33AAAAA0000A1Z5).';
      }
    }

    // Production hub / warehouse are informational, not required — a
    // pre-revenue or home-based operation may not have either yet.
    if (primaryHub.trim() && primaryHub.trim().length < 2) {
      errors.primaryHub = 'Production hub must be at least 2 characters.';
    }

    if (warehouseLocation.trim() && warehouseLocation.trim().length < 2) {
      errors.warehouseLocation = 'Warehouse location must be at least 2 characters.';
    }

    if (isNaN(defaultTargetMargin) || defaultTargetMargin < 1 || defaultTargetMargin > 90) {
      errors.defaultTargetMargin = 'Target margin must be between 1% and 90%.';
    }

    return errors;
  };

  // Save changes directly to Supabase cloud
  const handleSaveProfile = async (scope: 'profile' | 'brand') => {
    const errors = scope === 'profile' ? validateProfileFields() : validateBrandFields();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);
    const result = await updateProfile({
      full_name: fullName.trim(),
      role_title: roleTitle.trim(),
      phone_number: phoneNumber.trim(),
      department: department,
      legal_entity: legalEntity.trim(),
      gstin: gstin.trim().toUpperCase(),
      primary_hub: primaryHub.trim(),
      warehouse_location: warehouseLocation.trim(),
      default_currency: defaultCurrency,
      default_target_margin: defaultTargetMargin,
    });
    setIsSaving(false);
    if (!result.error) {
      setSavedAlert(true);
      setFormErrors({});
      setTimeout(() => setSavedAlert(false), 3500);
    } else {
      alert('Error syncing to Supabase: ' + result.error);
    }
  };

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordStatusMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatusMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordStatusMsg(null);

    try {
      if (supabase && isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
      }
      setPasswordStatusMsg({ type: 'success', text: 'Password updated successfully across your Rivlet account!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatusMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in text-white">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2638] pb-5">
        <div className="flex items-center gap-3">
          <RivletLogo variant="gold" size="sm" />
          <div className="h-5 w-px bg-[#263147] hidden sm:block"></div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
              User Profile & Brand Administration
            </h1>
            <p className="text-xs sm:text-sm text-[#94a3b8]">
              Manage your administrative profile, security credentials, and company entity specifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={signOut}
            className="px-3.5 py-1.5 rounded-lg bg-[#141824] hover:bg-rose-950/60 text-xs text-[#cbd5e1] hover:text-rose-200 border border-[#263147] hover:border-rose-800/60 flex items-center gap-1.5 transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Monogram */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#cda052] via-[#a87c32] to-[#6e4e1a] p-0.5 shadow-glow flex items-center justify-center">
              <div className="w-full h-full bg-[#07090e] rounded-2xl flex items-center justify-center font-serif text-2xl font-bold text-[#e6c875]">
                {fullName?.[0]?.toUpperCase() || 'R'}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-[#0e121b] shadow" title="Online & Authenticated">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">{fullName}</h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#e6c875] border border-[rgba(205,160,82,0.35)] font-semibold">
                Super Admin
              </span>
              {isSupabaseConfigured ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Supabase Live
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#182030] text-[#94a3b8] border border-[#263148] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Local / Offline
                </span>
              )}
            </div>
            <p className="text-xs text-[#cbd5e1] flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-[#cda052]" />
              <span>{email}</span>
            </p>
            <p className="text-xs text-[#94a3b8]">
              Role: <span className="text-[#e6c875] font-semibold">{roleTitle}</span> • {department}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-[#1e2638] pt-4 md:pt-0 md:pl-6 text-xs">
          <div>
            <span className="text-[10px] text-[#94a3b8] block uppercase font-mono tracking-wider font-semibold">PRIMARY ENTITY</span>
            <span className="font-semibold text-white font-mono text-sm">{legalEntity || 'Not set'}</span>
          </div>
          <div>
            <span className="text-[10px] text-[#94a3b8] block uppercase font-mono tracking-wider font-semibold">GST JURISDICTION</span>
            <span className="font-semibold text-[#e6c875] font-mono text-sm">
              {gstin.trim().length >= 2
                ? `${GST_STATE_CODES[gstin.trim().slice(0, 2)] || 'State'} (${gstin.trim().slice(0, 2)})`
                : 'Not set'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#94a3b8] block uppercase font-mono tracking-wider font-semibold">AUTH SESSION</span>
            <span className="font-semibold text-emerald-400 font-mono text-sm">Active (JWT)</span>
          </div>
        </div>
      </div>

      {savedAlert && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5 animate-fade-in font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Profile and brand configurations saved successfully!</span>
        </div>
      )}

      {Object.keys(formErrors).length > 0 && (
        <div className="p-4 bg-rose-950/80 border border-rose-800/60 rounded-xl text-rose-300 text-xs sm:text-sm space-y-1.5 animate-fade-in font-medium">
          <div className="flex items-center gap-2 font-bold text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Please resolve the following validation issues:</span>
          </div>
          <ul className="list-disc list-inside pl-1 text-xs text-rose-300/90 space-y-0.5">
            {Object.values(formErrors).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1e2638] pb-1 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-[#141824] text-[#e6c875] border border-[#cda052]/50 shadow-sm ring-1 ring-[#cda052]/30'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#111520]'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal Details</span>
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'brand'
              ? 'bg-[#141824] text-[#e6c875] border border-[#cda052]/50 shadow-sm ring-1 ring-[#cda052]/30'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#111520]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Brand & Production Entity</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-[#141824] text-[#e6c875] border border-[#cda052]/50 shadow-sm ring-1 ring-[#cda052]/30'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#111520]'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Authentication</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'bg-[#141824] text-[#e6c875] border border-[#cda052]/50 shadow-sm ring-1 ring-[#cda052]/30'
              : 'text-[#94a3b8] hover:text-white hover:bg-[#111520]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Console Preferences</span>
        </button>
      </div>

      {/* TAB 1: PERSONAL DETAILS */}
      {activeTab === 'profile' && (
        <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg">
          <div>
            <h3 className="text-base font-bold text-white font-serif">Administrative Contact Information</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Update the name and department details displayed across costing sheets, audits, and SOP approvals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Full Legal Name *</label>
              <input
                type="text"
                value={fullName}
                placeholder="e.g. Harichandru"
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (formErrors.fullName) setFormErrors(prev => { const n = {...prev}; delete n.fullName; return n; });
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border text-white outline-none transition-colors ${
                  formErrors.fullName 
                    ? 'border-rose-500/80 ring-1 ring-rose-500/30' 
                    : 'border-[#263147] focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40'
                }`}
              />
              {formErrors.fullName && <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.fullName}</p>}
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Primary Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#05070a] border border-[#1c2233] text-[#94a3b8]/70 cursor-not-allowed outline-none"
              />
              <span className="text-[10px] text-[#94a3b8]/80 mt-1 block">Managed by Supabase Cloud Authentication.</span>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Role & Title *</label>
              <input
                type="text"
                value={roleTitle}
                placeholder="e.g. Founder & Creative Director"
                onChange={(e) => {
                  setRoleTitle(e.target.value);
                  if (formErrors.roleTitle) setFormErrors(prev => { const n = {...prev}; delete n.roleTitle; return n; });
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border text-white outline-none transition-colors ${
                  formErrors.roleTitle 
                    ? 'border-rose-500/80 ring-1 ring-rose-500/30' 
                    : 'border-[#263147] focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40'
                }`}
              />
              {formErrors.roleTitle && <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.roleTitle}</p>}
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border border-[#263147] text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
              >
                <option value="">Select department</option>
                <option value="Executive & Merchandising">Executive & Merchandising</option>
                <option value="Product Design & Development">Product Design & Development</option>
                <option value="Sourcing & Supply Chain">Sourcing & Supply Chain</option>
                <option value="Finance & Commercial Operations">Finance & Commercial Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Phone / WhatsApp for Vendor Alerts</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (formErrors.phoneNumber) setFormErrors(prev => { const n = {...prev}; delete n.phoneNumber; return n; });
                }}
                placeholder="e.g. +91 98765 43210"
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border text-white placeholder-[#5a6478] outline-none transition-colors ${
                  formErrors.phoneNumber 
                    ? 'border-rose-500/80 ring-1 ring-rose-500/30' 
                    : 'border-[#263147] focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40'
                }`}
              />
              {formErrors.phoneNumber && <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.phoneNumber}</p>}
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Operating Timezone</label>
              <input
                type="text"
                disabled
                value="Asia/Kolkata (IST - UTC+5:30)"
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#05070a] border border-[#1c2233] text-[#94a3b8]/70 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e2638] flex justify-end">
            <button
              onClick={() => handleSaveProfile('profile')}
              disabled={isSaving}
              title="Save personal profile details to Supabase Cloud"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Syncing to Supabase...' : 'Save Personal Information'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: BRAND & PRODUCTION ENTITY */}
      {activeTab === 'brand' && (
        <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg">
          <div>
            <h3 className="text-base font-bold text-white font-serif">Brand Architecture & Compliance Specs</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              These brand details automatically populate your PO spec sheets, tax invoices, and vendor contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Registered Legal Entity *</label>
              <input
                type="text"
                value={legalEntity}
                onChange={(e) => {
                  setLegalEntity(e.target.value);
                  if (formErrors.legalEntity) setFormErrors(prev => { const n = {...prev}; delete n.legalEntity; return n; });
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border text-white outline-none transition-colors ${
                  formErrors.legalEntity 
                    ? 'border-rose-500/80 ring-1 ring-rose-500/30' 
                    : 'border-[#263147] focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40'
                }`}
              />
              {formErrors.legalEntity && <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.legalEntity}</p>}
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">GST Identification Number (GSTIN)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => {
                  setGstin(e.target.value.toUpperCase());
                  if (formErrors.gstin) setFormErrors(prev => { const n = {...prev}; delete n.gstin; return n; });
                }}
                placeholder="e.g. 33AAAAA0000A1Z5"
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border text-white font-mono placeholder-[#5a6478] outline-none transition-colors ${
                  formErrors.gstin 
                    ? 'border-rose-500/80 ring-1 ring-rose-500/30' 
                    : 'border-[#263147] focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40'
                }`}
              />
              {formErrors.gstin && <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.gstin}</p>}
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Primary Production Hub / Mill Cluster</label>
              <input
                type="text"
                value={primaryHub}
                placeholder="e.g. Production Facility"
                onChange={(e) => {
                  setPrimaryHub(e.target.value);
                  if (formErrors.primaryHub) setFormErrors(prev => { const n = {...prev}; delete n.primaryHub; return n; });
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border text-white outline-none transition-colors ${
                  formErrors.primaryHub 
                    ? 'border-rose-500/80 ring-1 ring-rose-500/30' 
                    : 'border-[#263147] focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40'
                }`}
              />
              {formErrors.primaryHub && <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.primaryHub}</p>}
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Central Warehouse & Fulfillment Facility</label>
              <input
                type="text"
                value={warehouseLocation}
                placeholder="Not yet active — leave blank until fulfillment starts"
                onChange={(e) => {
                  setWarehouseLocation(e.target.value);
                  if (formErrors.warehouseLocation) setFormErrors(prev => { const n = {...prev}; delete n.warehouseLocation; return n; });
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border text-white outline-none transition-colors ${
                  formErrors.warehouseLocation 
                    ? 'border-rose-500/80 ring-1 ring-rose-500/30' 
                    : 'border-[#263147] focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40'
                }`}
              />
              {formErrors.warehouseLocation && <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.warehouseLocation}</p>}
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Default Base Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border border-[#263147] text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
              >
                <option value="₹">₹ INR (Indian Rupee)</option>
                <option value="$">$ USD (US Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Target Net Margin Benchmark (%) *</label>
              <input
                type="number"
                min="1"
                max="90"
                step="0.5"
                value={defaultTargetMargin}
                onChange={(e) => {
                  setDefaultTargetMargin(Number(e.target.value));
                  if (formErrors.defaultTargetMargin) setFormErrors(prev => { const n = {...prev}; delete n.defaultTargetMargin; return n; });
                }}
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[#07090e] border text-white font-bold outline-none transition-colors ${
                  formErrors.defaultTargetMargin 
                    ? 'border-rose-500/80 ring-1 ring-rose-500/30' 
                    : 'border-[#263147] focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40'
                }`}
              />
              {formErrors.defaultTargetMargin && <p className="text-[11px] text-rose-400 mt-1 font-medium">{formErrors.defaultTargetMargin}</p>}
            </div>
          </div>

          <div className="pt-4 border-t border-[#1e2638] flex justify-end">
            <button
              onClick={() => handleSaveProfile('brand')}
              disabled={isSaving}
              title="Save brand entity specifications to Supabase Cloud"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all active:scale-[0.98] disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Syncing to Supabase...' : 'Save Brand Specifications'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & AUTHENTICATION */}
      {activeTab === 'security' && (
        <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg">
          <div>
            <h3 className="text-base font-bold text-white font-serif">Security & Cloud Authentication</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Update your administrative password and review your Supabase cloud connection security.
            </p>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="p-5 bg-[#07090e] border border-[#1e2638] rounded-xl space-y-4 max-w-lg shadow-inner">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Key className="w-4 h-4 text-[#cda052]" />
              <span>Update Administrative Password</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">New Password (min 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#05070a] border border-[#263147] text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
                />
                {newPassword.length > 0 && (
                  <p className={`text-[10px] mt-1 font-medium ${newPassword.length >= 8 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {newPassword.length >= 8 ? 'Meets minimum length.' : `${8 - newPassword.length} more character${8 - newPassword.length === 1 ? '' : 's'} needed.`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] uppercase font-semibold text-[#94a3b8] tracking-wider mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#05070a] border border-[#263147] text-white outline-none focus:border-[#cda052] focus:ring-1 focus:ring-[#cda052]/40 transition-colors"
                />
              </div>
            </div>

            {passwordStatusMsg && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2.5 ${
                passwordStatusMsg.type === 'success' 
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
              }`}>
                {passwordStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span className="font-medium">{passwordStatusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-2.5 rounded-lg bg-[#141824] hover:bg-[#1a2030] text-xs font-semibold text-white border border-[#263147] hover:border-[#cda052]/50 transition-colors disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          {/* Connection Details */}
          <div className="p-5 bg-[#07090e] border border-[#1e2638] rounded-xl space-y-3.5 text-xs shadow-inner">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Active Supabase Cloud Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#94a3b8] block text-[11px]">Database Host:</span>
                <span className="font-mono text-white text-xs">cmvsdepsshrlcbtmxgzw.supabase.co</span>
              </div>
              <div>
                <span className="text-[#94a3b8] block text-[11px]">Row-Level Security (RLS):</span>
                <span className="font-mono text-emerald-400 font-semibold text-xs">Enabled (Protected)</span>
              </div>
              <div>
                <span className="text-[#94a3b8] block text-[11px]">Cloud Storage Bucket:</span>
                <span className="font-mono text-white text-xs">vault-files</span>
              </div>
              <div>
                <span className="text-[#94a3b8] block text-[11px]">Session Token Expiry:</span>
                <span className="font-mono text-[#e6c875] text-xs">3600 seconds (Auto-refresh)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONSOLE PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-6 sm:p-8 space-y-6 shadow-lg">
          <div>
            <h3 className="text-base font-bold text-white font-serif">Interface & Calculation Preferences</h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Customize the appearance, number formatting, and default behavior of your console.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#07090e] border border-[#1e2638] rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-white block text-sm">Theme Mode</span>
                <span className="text-xs text-[#94a3b8]">Obsidian luxury dark mode with champagne gold accents</span>
              </div>
              <span className="px-3 py-1 rounded-md bg-[#141824] text-[#e6c875] font-semibold border border-[#263147]">
                Obsidian Gold
              </span>
            </div>

            <div className="p-4 bg-[#07090e] border border-[#1e2638] rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-white block text-sm">Automatic Step-Function GST Calculation</span>
                <span className="text-xs text-[#94a3b8]">Automatically apply 5% for price &le; ₹2,500 and 18% for price &gt; ₹2,500</span>
              </div>
              <span className="text-emerald-400 font-semibold font-mono text-xs px-2.5 py-1 bg-emerald-950/40 rounded border border-emerald-800/40">Enabled</span>
            </div>

            <div className="p-4 bg-[#07090e] border border-[#1e2638] rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-white block text-sm">AQL Inspection Standard Preset</span>
                <span className="text-xs text-[#94a3b8]">Standard sampling rule for factory batch audits</span>
              </div>
              <span className="font-mono text-[#e6c875] font-semibold text-xs px-2.5 py-1 bg-[rgba(205,160,82,0.12)] rounded border border-[rgba(205,160,82,0.3)]">AQL 2.5 Major / 4.0 Minor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
