'use client';

import React, { useState } from 'react';
import {
  Lock,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Check,
  KeyRound,
  ExternalLink,
  ShieldAlert,
  Building,
  Calendar,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { CredentialVaultItem, VaultServiceType } from '@/lib/types';
import { saveLocalCredentialVault } from '@/lib/complianceStorage';

interface CredentialVaultViewProps {
  vaultItems: CredentialVaultItem[];
  onUpdateVault: (updated: CredentialVaultItem[]) => void;
}

export default function CredentialVaultView({
  vaultItems,
  onUpdateVault,
}: CredentialVaultViewProps) {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State (Add & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState<VaultServiceType>('gst');
  const [identifier, setIdentifier] = useState('');
  const [secret, setSecret] = useState('');
  const [portalUrl, setPortalUrl] = useState('');
  const [notes, setNotes] = useState('');

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setTitle('');
    setServiceType('gst');
    setIdentifier('');
    setSecret('');
    setPortalUrl('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CredentialVaultItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setServiceType(item.serviceType);
    setIdentifier(item.identifier);
    setSecret(item.secret);
    setPortalUrl(item.portalUrl || '');
    setNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !identifier || !secret) return;

    if (editingId) {
      const updated = vaultItems.map((item) =>
        item.id === editingId
          ? {
              ...item,
              title: title.trim(),
              serviceType,
              identifier: identifier.trim(),
              secret: secret.trim(),
              portalUrl: portalUrl.trim() || undefined,
              notes: notes.trim() || undefined,
              lastVerifiedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : item
      );
      onUpdateVault(updated);
      saveLocalCredentialVault(updated);
    } else {
      const newItem: CredentialVaultItem = {
        id: `vault-${Date.now()}`,
        title: title.trim(),
        serviceType,
        identifier: identifier.trim(),
        secret: secret.trim(),
        portalUrl: portalUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        lastVerifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newItem, ...vaultItems];
      onUpdateVault(updated);
      saveLocalCredentialVault(updated);
    }

    setIsModalOpen(false);
  };

  const handleDeleteCredential = (id: string, itemTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete credential for "${itemTitle}"? This cannot be undone.`)) {
      return;
    }
    const updated = vaultItems.filter((v) => v.id !== id);
    onUpdateVault(updated);
    saveLocalCredentialVault(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0e121b] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#cda052]" />
            <span>Statutory Credentials & Portal Password Vault</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#8a96ae] mt-0.5">
            Secure encrypted repository for PAN, TAN, GST portal credentials, ICEGATE logins, and DGFT AD Codes
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black text-xs font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Credential</span>
        </button>
      </div>

      {/* Grid of Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vaultItems.map((item) => {
          const isRevealed = revealedIds.has(item.id);
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white dark:bg-[#0e121b] p-5 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-[#f7d88c] border border-amber-500/20">
                      {item.serviceType.toUpperCase()}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">{item.title}</h4>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.portalUrl && (
                      <a
                        href={item.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Launch Portal"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
                  {/* Identifier (Username / PAN / GSTIN) */}
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-[#8a96ae] block mb-0.5">User ID / PAN / GSTIN:</span>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
                      <span className="font-mono text-slate-900 dark:text-white font-semibold">{item.identifier}</span>
                      <button
                        onClick={() => handleCopy(`${item.id}-id`, item.identifier)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                        title="Copy Identifier"
                      >
                        {copiedId === `${item.id}-id` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Secret / Password */}
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-[#8a96ae] block mb-0.5">Password / Portal PIN:</span>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638]">
                      <span className="font-mono text-amber-700 dark:text-[#f7d88c] font-semibold tracking-wider">
                        {isRevealed ? item.secret : '••••••••••••••••'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleReveal(item.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                          title={isRevealed ? 'Hide Password' : 'Reveal Password'}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleCopy(item.id, item.secret)}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                          title="Copy Password"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-[#8a96ae] italic">{item.notes}</p>
                  )}
                </div>
              </div>

              {/* Action row */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Edit Credential"
                  aria-label={`Edit ${item.title}`}
                >
                  <Pencil className="w-3.5 h-3.5 text-[#cda052]" />
                </button>
                <button
                  onClick={() => handleDeleteCredential(item.id, item.title)}
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                  title="Delete Credential"
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add / Edit Credential */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#cda052]" />
                <span>{editingId ? 'Edit Portal Credential' : 'Store Portal Credential in Vault'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCredential} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Service / Portal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST Portal Primary / ICEGATE Customs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Service Category</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as VaultServiceType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                >
                  <option value="gst">GST Portal (GSTN)</option>
                  <option value="icegate">ICEGATE Customs Gateway</option>
                  <option value="dgft">DGFT (Directorate General of Foreign Trade)</option>
                  <option value="incometax">Income Tax E-Filing Portal</option>
                  <option value="traces">TRACES TDS Portal</option>
                  <option value="bank_ad">Authorized Dealer (AD) Code / Banking</option>
                  <option value="other">Other Statutory Portal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Identifier / Username / PAN / GSTIN *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 33AABCR1234F1Z8 or RIVLET_ICEGATE"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Password / Portal PIN *</label>
                <input
                  type="text"
                  required
                  placeholder="Secret password or PIN"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Portal URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://services.gst.gov.in"
                  value={portalUrl}
                  onChange={(e) => setPortalUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-medium">Notes & Authority (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bound with Director DSC USB Token"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] outline-none focus:border-[#cda052]"
                />
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
                  {editingId ? 'Update Credential' : 'Save Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
