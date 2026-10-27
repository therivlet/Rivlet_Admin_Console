'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Key,
  Building,
  User,
  X,
  BellRing,
} from 'lucide-react';
import { DscRegistryItem } from '@/lib/types';
import { saveLocalDscRegistry } from '@/lib/complianceStorage';
import { addDurableNotification } from '@/lib/notificationStorage';

interface DscRegistryViewProps {
  dscItems: DscRegistryItem[];
  onUpdateDsc: (updated: DscRegistryItem[]) => void;
}

export default function DscRegistryView({
  dscItems,
  onUpdateDsc,
}: DscRegistryViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [holder, setHolder] = useState('');
  const [designation, setDesignation] = useState('');
  const [authority, setAuthority] = useState('eMudhra Limited');
  const [serial, setSerial] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');

  const now = new Date();

  const handleRegisterDsc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !holder || !serial || !expiryDate) return;

    const newItem: DscRegistryItem = {
      id: `dsc-${Date.now()}`,
      tokenLabel: label.trim(),
      holderName: holder.trim(),
      designation: designation.trim() || 'Director',
      certAuthority: authority,
      serialNumber: serial.trim(),
      issuedDate: issuedDate || new Date().toISOString().split('T')[0],
      expiryDate,
      tokenLocation: location.trim() || 'Executive Safe',
      status: 'active',
      portalsBound: ['GSTN', 'ICEGATE', 'Income Tax E-Filing', 'MCA-21 V3'],
    };

    const updated = [newItem, ...dscItems];
    onUpdateDsc(updated);
    saveLocalDscRegistry(updated);
    setIsModalOpen(false);

    // Reset
    setLabel('');
    setHolder('');
    setSerial('');
    setExpiryDate('');
  };

  const handleTriggerRenewalAlert = async (item: DscRegistryItem) => {
    try {
      await addDurableNotification({
        title: `DSC Renewal Notice: ${item.holderName}`,
        message: `${item.tokenLabel} (${item.certAuthority}) expires on ${item.expiryDate}. Physical location: ${item.tokenLocation}.`,
        link: '/compliance?tab=dsc',
        type: 'reminder',
        priority: 'high',
        module: 'compliance',
      });
      alert(`Renewal reminder triggered for ${item.holderName}'s DSC!`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1e140e] dark:bg-[#0c101a] p-4 rounded-2xl border border-[#3d2b20] dark:border-[#1a2233]">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#cda052]" />
            <span>Class 3 Digital Signature Certificate (DSC) Registry</span>
          </h3>
          <p className="text-xs text-[#a99a8b]">
            Monitors cryptographic USB tokens, validity periods, issuing authorities, and statutory e-Filing mappings
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black text-xs font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Register DSC Token</span>
        </button>
      </div>

      {/* DSC Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dscItems.map((item) => {
          const expDate = new Date(item.expiryDate);
          const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isExpiringSoon = diffDays <= 45 && diffDays > 0;
          const isExpired = diffDays <= 0;

          return (
            <div
              key={item.id}
              className="bg-[#18100b] dark:bg-[#090c14] p-5 rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[rgba(205,160,82,0.15)] text-[#f7d88c]">
                      <Key className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold text-white text-sm">{item.tokenLabel}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#cbd5e1] mt-1">
                    <User className="w-3 h-3 text-[#cda052]" />
                    <span>{item.holderName}</span>
                    <span className="text-[#8895ad]">({item.designation})</span>
                  </div>
                </div>

                <div>
                  {isExpired ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      Expired
                    </span>
                  ) : isExpiringSoon ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Expires in {diffDays} days
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active ({diffDays} days left)
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8895ad]">Issuing CA:</span>
                  <span className="text-white font-medium">{item.certAuthority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8895ad]">Token Serial:</span>
                  <span className="text-[#f7d88c] font-mono font-medium">{item.serialNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8895ad]">Validity Window:</span>
                  <span className="text-white font-mono">
                    {item.issuedDate} → {item.expiryDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8895ad]">Physical Location:</span>
                  <span className="text-[#cbd5e1]">{item.tokenLocation}</span>
                </div>
              </div>

              {/* Bound Portals */}
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-[10px] text-[#8895ad] uppercase tracking-wider block mb-1.5 font-semibold">
                  Authorized Portals
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {item.portalsBound.map((portal) => (
                    <span
                      key={portal}
                      className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-semibold text-[#cbd5e1] border border-white/10"
                    >
                      {portal}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-end">
                <button
                  onClick={() => handleTriggerRenewalAlert(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-white/10 text-xs font-semibold text-[#cbd5e1] border border-white/10 transition-colors"
                >
                  <BellRing className="w-3.5 h-3.5 text-[#cda052]" />
                  <span>Renewal Reminder</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register DSC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e140e] dark:bg-[#0c101a] w-full max-w-lg rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-[#cda052]" />
                <span>Register Cryptographic DSC Token</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#a99a8b] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterDsc} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Token Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Managing Director Primary Statutory DSC"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Holder Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Legal Name"
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Designation</label>
                  <input
                    type="text"
                    placeholder="Managing Director / CFO"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Certifying Authority</label>
                  <select
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 outline-none"
                  >
                    <option value="eMudhra Limited">eMudhra Limited</option>
                    <option value="Vsign Technologies">Vsign Technologies</option>
                    <option value="Capricorn CA">Capricorn Identity CA</option>
                    <option value="Sify Technologies">Sify SafeScrypt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Token Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7B3A-4F91-C820"
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white font-mono border border-white/10 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Issued Date</label>
                  <input
                    type="date"
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Physical Location / Safe</label>
                <input
                  type="text"
                  placeholder="e.g. Executive Safe A-1 / USB Token Key 01"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black/40 text-[#a99a8b] hover:text-white border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                >
                  Save DSC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
