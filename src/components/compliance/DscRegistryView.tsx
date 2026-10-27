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
  Pencil,
  Trash2,
} from 'lucide-react';
import { DscRegistryItem } from '@/lib/types';
import {
  saveLocalDscRegistry,
  saveMergedDscRegistry,
  deleteMergedDscItem,
} from '@/lib/complianceStorage';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [holder, setHolder] = useState('');
  const [designation, setDesignation] = useState('');
  const [authority, setAuthority] = useState('eMudhra Limited');
  const [serial, setSerial] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<DscRegistryItem['status']>('active');

  const now = new Date();

  const handleOpenAdd = () => {
    setEditingId(null);
    setLabel('');
    setHolder('');
    setDesignation('Managing Director');
    setAuthority('eMudhra Limited');
    setSerial('');
    setIssuedDate(new Date().toISOString().split('T')[0]);
    setExpiryDate('');
    setLocation('Executive Fireproof Safe A-1');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DscRegistryItem) => {
    setEditingId(item.id);
    setLabel(item.tokenLabel);
    setHolder(item.holderName);
    setDesignation(item.designation);
    setAuthority(item.certAuthority);
    setSerial(item.serialNumber);
    setIssuedDate(item.issuedDate);
    setExpiryDate(item.expiryDate);
    setLocation(item.tokenLocation);
    setStatus(item.status);
    setIsModalOpen(true);
  };

  const handleSaveDsc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !holder || !serial || !expiryDate) return;

    if (editingId) {
      const updated = dscItems.map((item) =>
        item.id === editingId
          ? {
              ...item,
              tokenLabel: label.trim(),
              holderName: holder.trim(),
              designation: designation.trim() || 'Director',
              certAuthority: authority,
              serialNumber: serial.trim(),
              issuedDate: issuedDate || item.issuedDate,
              expiryDate,
              tokenLocation: location.trim() || 'Executive Safe',
              status,
            }
          : item
      );
      onUpdateDsc(updated);
      saveMergedDscRegistry(updated);
    } else {
      const newItem: DscRegistryItem = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `dsc-${Date.now()}`,
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
      saveMergedDscRegistry(updated);
    }

    setIsModalOpen(false);
  };

  const handleDeleteDsc = (id: string, tokenName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${tokenName}? This action cannot be undone.`)) {
      return;
    }
    const updated = dscItems.filter((i) => i.id !== id);
    onUpdateDsc(updated);
    deleteMergedDscItem(id);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e121b] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#cda052]" />
            <span>Class 3 Digital Signature Certificate (DSC) Registry</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5">
            Monitors cryptographic USB tokens, validity periods, issuing authorities, and statutory e-Filing mappings
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
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
              className="bg-white dark:bg-[#0e121b] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-[#f7d88c]">
                        <Key className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">{item.tokenLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 mt-1.5">
                      <User className="w-3.5 h-3.5 text-[#cda052]" />
                      <span className="font-medium">{item.holderName}</span>
                      <span className="text-slate-500 dark:text-[#8a96ae]">({item.designation})</span>
                    </div>
                  </div>

                  <div>
                    {isExpired ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                        Expired
                      </span>
                    ) : isExpiringSoon ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        Expires in {diffDays} days
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        Active ({diffDays} days left)
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8a96ae]">Issuing CA:</span>
                    <span className="text-slate-900 dark:text-white font-medium">{item.certAuthority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8a96ae]">Token Serial:</span>
                    <span className="text-amber-600 dark:text-[#f7d88c] font-mono font-medium">{item.serialNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8a96ae]">Validity Window:</span>
                    <span className="text-slate-900 dark:text-white font-mono">
                      {item.issuedDate} → {item.expiryDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8a96ae]">Physical Location:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.tokenLocation}</span>
                  </div>
                </div>

                {/* Bound Portals */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-[#8a96ae] uppercase tracking-wider block mb-1.5 font-semibold">
                    Authorized Portals
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.portalsBound.map((portal) => (
                      <span
                        key={portal}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {portal}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    title="Edit DSC token"
                    aria-label={`Edit ${item.tokenLabel}`}
                  >
                    <Pencil className="w-3.5 h-3.5 text-[#cda052]" />
                  </button>
                  <button
                    onClick={() => handleDeleteDsc(item.id, item.tokenLabel)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                    title="Delete DSC token"
                    aria-label={`Delete ${item.tokenLabel}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleTriggerRenewalAlert(item)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <BellRing className="w-3.5 h-3.5 text-[#cda052]" />
                  <span>Renewal Reminder</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Register / Edit DSC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-[#cda052]" />
                <span>{editingId ? 'Edit Cryptographic DSC Token' : 'Register Cryptographic DSC Token'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDsc} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Token Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Managing Director Primary Statutory DSC"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Holder Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Legal Name"
                    value={holder}
                    onChange={(e) => setHolder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Designation</label>
                  <input
                    type="text"
                    placeholder="Managing Director / CFO"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Certifying Authority</label>
                  <select
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  >
                    <option value="eMudhra Limited">eMudhra Limited</option>
                    <option value="Vsign Technologies">Vsign Technologies</option>
                    <option value="Capricorn CA">Capricorn Identity CA</option>
                    <option value="Sify Technologies">Sify SafeScrypt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Token Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="7B3A-4F91-C820-99E1"
                    value={serial}
                    onChange={(e) => setSerial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Issued Date</label>
                  <input
                    type="date"
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Physical Location</label>
                  <input
                    type="text"
                    placeholder="Locker B-4 / Executive Safe"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Token Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                  >
                    <option value="active">Active</option>
                    <option value="expiring_soon">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="revoked">Revoked</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                >
                  {editingId ? 'Update DSC Token' : 'Register Token'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
