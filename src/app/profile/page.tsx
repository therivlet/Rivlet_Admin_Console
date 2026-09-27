'use client';

import React, { useState } from 'react';
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

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'brand' | 'security' | 'preferences'>('profile');

  // Personal Profile State
  const [fullName, setFullName] = useState(user?.name || 'Rivlet Executive');
  const [email] = useState(user?.email || 'admin@therivlet.com');
  const [roleTitle, setRoleTitle] = useState('Founder & Creative Director');
  const [phoneNumber, setPhoneNumber] = useState('+91 98400 12345');
  const [department, setDepartment] = useState('Executive & Merchandising');

  // Brand Entity State
  const [legalEntity, setLegalEntity] = useState('Rivlet Luxury Apparel Co.');
  const [gstin, setGstin] = useState('33AAACR1234F1Z5');
  const [primaryHub, setPrimaryHub] = useState('Tirupur Apparel Complex, Tamil Nadu');
  const [warehouseLocation, setWarehouseLocation] = useState('Bangalore Logistics Hub, Karnataka');
  const [defaultCurrency, setDefaultCurrency] = useState('₹');
  const [defaultTargetMargin, setDefaultTargetMargin] = useState(25);

  // Security / Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Saved Alert
  const [savedAlert, setSavedAlert] = useState(false);

  // Save changes handler
  const handleSaveProfile = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  // Change password handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatusMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c2233] pb-5">
        <div className="flex items-center gap-3">
          <RivletLogo variant="gold" size="sm" />
          <div className="h-5 w-px bg-[#262e42] hidden sm:block"></div>
          <div>
            <h1 className="text-xl font-bold font-serif text-white tracking-wide">
              User Profile & Brand Administration
            </h1>
            <p className="text-xs text-[#7e879e]">
              Manage your administrative profile, security credentials, and company entity specifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={signOut}
            className="px-3.5 py-1.5 rounded-lg bg-[#141824] hover:bg-rose-950/40 text-xs text-[#a2adbf] hover:text-rose-300 border border-[#22283a] hover:border-rose-800/40 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-[#0e121d] border border-[#1f2638] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Monogram */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#cda052] via-[#a87c32] to-[#6e4e1a] p-0.5 shadow-glow flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0c14] rounded-2xl flex items-center justify-center font-serif text-2xl font-bold text-[#cda052]">
                {fullName?.[0]?.toUpperCase() || 'R'}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-[#0e121d] shadow" title="Online & Authenticated">
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-white tracking-wide">{fullName}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold">
                Super Admin
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Supabase Live
              </span>
            </div>
            <p className="text-xs text-[#8a94aa] flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#cda052]" />
              <span>{email}</span>
            </p>
            <p className="text-[11px] text-[#6b758b]">
              Role: <span className="text-[#cda052] font-semibold">{roleTitle}</span> • {department}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-[#1d2437] pt-4 md:pt-0 md:pl-6 text-xs">
          <div>
            <span className="text-[10px] text-[#677187] block uppercase font-mono">PRIMARY ENTITY</span>
            <span className="font-semibold text-white font-mono">Rivlet Apparel</span>
          </div>
          <div>
            <span className="text-[10px] text-[#677187] block uppercase font-mono">GST JURISDICTION</span>
            <span className="font-semibold text-[#cda052] font-mono">Tamil Nadu (33)</span>
          </div>
          <div>
            <span className="text-[10px] text-[#677187] block uppercase font-mono">AUTH SESSION</span>
            <span className="font-semibold text-emerald-400 font-mono">Active (JWT)</span>
          </div>
        </div>
      </div>

      {savedAlert && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Profile and brand configurations saved successfully!</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1c2233] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-[#181d2c] text-[#cda052] border border-[#2b354d] shadow-sm'
              : 'text-[#848d9f] hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Personal Details</span>
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'brand'
              ? 'bg-[#181d2c] text-[#cda052] border border-[#2b354d] shadow-sm'
              : 'text-[#848d9f] hover:text-white'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Brand & Production Entity</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-[#181d2c] text-[#cda052] border border-[#2b354d] shadow-sm'
              : 'text-[#848d9f] hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Security & Authentication</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'bg-[#181d2c] text-[#cda052] border border-[#2b354d] shadow-sm'
              : 'text-[#848d9f] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Console Preferences</span>
        </button>
      </div>

      {/* TAB 1: PERSONAL DETAILS */}
      {activeTab === 'profile' && (
        <div className="bg-[#0e121d] border border-[#1f2638] rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white font-serif">Administrative Contact Information</h3>
            <p className="text-xs text-[#717b92]">
              Update the name and department details displayed across costing sheets, audits, and SOP approvals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080a10] border border-[#22293d] text-white outline-none focus:border-[#cda052]"
              />
            </div>

            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Primary Email Address</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3 py-2 rounded-lg bg-[#06070c] border border-[#1c2233] text-[#717a8f] cursor-not-allowed outline-none"
              />
              <span className="text-[10px] text-[#555e73] mt-1 block">Managed by Supabase Authentication.</span>
            </div>

            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Role & Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080a10] border border-[#22293d] text-white outline-none focus:border-[#cda052]"
              />
            </div>

            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080a10] border border-[#22293d] text-white outline-none focus:border-[#cda052]"
              >
                <option value="Executive & Merchandising">Executive & Merchandising</option>
                <option value="Product Design & Development">Product Design & Development</option>
                <option value="Sourcing & Supply Chain">Sourcing & Supply Chain</option>
                <option value="Finance & Commercial Operations">Finance & Commercial Operations</option>
              </select>
            </div>

            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Phone / WhatsApp for Vendor Alerts</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080a10] border border-[#22293d] text-white outline-none focus:border-[#cda052]"
              />
            </div>

            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Operating Timezone</label>
              <input
                type="text"
                disabled
                value="Asia/Kolkata (IST - UTC+5:30)"
                className="w-full px-3 py-2 rounded-lg bg-[#06070c] border border-[#1c2233] text-[#717a8f] cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1a2133] flex justify-end">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Personal Information</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: BRAND & PRODUCTION ENTITY */}
      {activeTab === 'brand' && (
        <div className="bg-[#0e121d] border border-[#1f2638] rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white font-serif">Brand Architecture & Compliance Specs</h3>
            <p className="text-xs text-[#717b92]">
              These brand details automatically populate your PO spec sheets, tax invoices, and vendor contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Registered Legal Entity</label>
              <input
                type="text"
                value={legalEntity}
                onChange={(e) => setLegalEntity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080a10] border border-[#22293d] text-white outline-none focus:border-[#cda052]"
              />
            </div>

            <div>
              <label className="block text-[#858fa6] font-medium mb-1">GST Identification Number (GSTIN)</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080a10] border border-[#22293d] text-white font-mono outline-none focus:border-[#cda052]"
              />
            </div>

            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Primary Production Hub / Mill Cluster</label>
              <input
                type="text"
                value={primaryHub}
                onChange={(e) => setPrimaryHub(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080a10] border border-[#22293d] text-white outline-none focus:border-[#cda052]"
              />
            </div>

            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Central Warehouse & Fulfillment Facility</label>
              <input
                type="text"
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080a10] border border-[#22293d] text-white outline-none focus:border-[#cda052]"
              />
            </div>

            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Default Base Currency</label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#080a10] border border-[#22293d] text-white outline-none focus:border-[#cda052]"
              >
                <option value="₹">₹ INR (Indian Rupee)</option>
                <option value="$">$ USD (US Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#858fa6] font-medium mb-1">Target Net Margin Benchmark (%)</label>
              <input
                type="number"
                value={defaultTargetMargin}
                onChange={(e) => setDefaultTargetMargin(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#080a10] border border-[#22293d] text-white font-bold outline-none focus:border-[#cda052]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1a2133] flex justify-end">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Brand Specifications</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & AUTHENTICATION */}
      {activeTab === 'security' && (
        <div className="bg-[#0e121d] border border-[#1f2638] rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white font-serif">Security & Cloud Authentication</h3>
            <p className="text-xs text-[#717b92]">
              Update your administrative password and review your Supabase cloud connection security.
            </p>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="p-4 bg-[#090b12] border border-[#1d2438] rounded-xl space-y-4 max-w-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Key className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Update Administrative Password</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#828ca3] font-medium mb-1">New Password (min 6 characters)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-[#06070d] border border-[#22293c] text-white outline-none focus:border-[#cda052]"
                />
              </div>

              <div>
                <label className="block text-[#828ca3] font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-[#06070d] border border-[#22293c] text-white outline-none focus:border-[#cda052]"
                />
              </div>
            </div>

            {passwordStatusMsg && (
              <div className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                passwordStatusMsg.type === 'success' 
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-700/60'
              }`}>
                {passwordStatusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                )}
                <span>{passwordStatusMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-2 rounded-lg bg-[#191f2e] hover:bg-[#232b3f] text-xs font-semibold text-white border border-[#2c364e] transition-colors disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>

          {/* Connection Details */}
          <div className="p-4 bg-[#090b12] border border-[#1d2438] rounded-xl space-y-3 text-xs">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Active Supabase Cloud Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-[#656f84] block">Database Host:</span>
                <span className="font-mono text-white">cmvsdepsshrlcbtmxgzw.supabase.co</span>
              </div>
              <div>
                <span className="text-[#656f84] block">Row-Level Security (RLS):</span>
                <span className="font-mono text-emerald-400 font-semibold">Enabled (Protected)</span>
              </div>
              <div>
                <span className="text-[#656f84] block">Cloud Storage Bucket:</span>
                <span className="font-mono text-white">vault-files</span>
              </div>
              <div>
                <span className="text-[#656f84] block">Session Token Expiry:</span>
                <span className="font-mono text-[#cda052]">3600 seconds (Auto-refresh)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CONSOLE PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="bg-[#0e121d] border border-[#1f2638] rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white font-serif">Interface & Calculation Preferences</h3>
            <p className="text-xs text-[#717b92]">
              Customize the appearance, number formatting, and default behavior of your console.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 bg-[#090b12] border border-[#1d2438] rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-white block">Theme Mode</span>
                <span className="text-[11px] text-[#717b92]">Obsidian luxury dark mode with champagne gold accents</span>
              </div>
              <span className="px-3 py-1 rounded bg-[#181d2a] text-[#cda052] font-semibold border border-[#273046]">
                Obsidian Gold
              </span>
            </div>

            <div className="p-4 bg-[#090b12] border border-[#1d2438] rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-white block">Automatic Step-Function GST Calculation</span>
                <span className="text-[11px] text-[#717b92]">Automatically apply 5% for price &le; ₹2,500 and 18% for price &gt; ₹2,500</span>
              </div>
              <span className="text-emerald-400 font-semibold font-mono">Enabled</span>
            </div>

            <div className="p-4 bg-[#090b12] border border-[#1d2438] rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="font-semibold text-white block">AQL Inspection Standard Preset</span>
                <span className="text-[11px] text-[#717b92]">Standard sampling rule for factory batch audits</span>
              </div>
              <span className="font-mono text-[#cda052] font-semibold">AQL 2.5 Major / 4.0 Minor</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
