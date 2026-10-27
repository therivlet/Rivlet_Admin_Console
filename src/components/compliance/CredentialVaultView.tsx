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

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleAddCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !identifier || !secret) return;

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
    setIsModalOpen(false);

    // Reset Form
    setTitle('');
    setIdentifier('');
    setSecret('');
    setPortalUrl('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1e140e] dark:bg-[#0c101a] p-4 sm:p-5 rounded-2xl border border-[#3d2b20] dark:border-[#1a2233]">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#cda052]" />
            <span>Statutory Credentials & Portal Password Vault</span>
          </h3>
          <p className="text-xs text-[#a99a8b]">
            Secure encrypted repository for PAN, TAN, GST portal credentials, ICEGATE logins, and DGFT AD Codes
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
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
              className="bg-[#18100b] dark:bg-[#090c14] p-5 rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#f7d88c] border border-[rgba(205,160,82,0.25)]">
                    {item.serviceType.toUpperCase()}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1.5">{item.title}</h4>
                </div>

                {item.portalUrl && (
                  <a
                    href={item.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-lg text-[#a99a8b] hover:text-[#cda052] hover:bg-white/5 transition-colors"
                    title="Launch Portal"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 space-y-3 text-xs">
                {/* Identifier (Username / PAN / GSTIN) */}
                <div>
                  <span className="text-[11px] text-[#8895ad] block mb-0.5">User ID / PAN / GSTIN:</span>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="font-mono text-white font-semibold">{item.identifier}</span>
                    <button
                      onClick={() => handleCopy(`${item.id}-id`, item.identifier)}
                      className="p-1 text-[#a99a8b] hover:text-white transition-colors"
                      title="Copy Identifier"
                    >
                      {copiedId === `${item.id}-id` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Secret / Password */}
                <div>
                  <span className="text-[11px] text-[#8895ad] block mb-0.5">Password / Portal PIN:</span>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5">
                    <span className="font-mono text-[#f7d88c] font-semibold tracking-wider">
                      {isRevealed ? item.secret : '••••••••••••••••'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleReveal(item.id)}
                        className="p-1 text-[#a99a8b] hover:text-white transition-colors"
                        title={isRevealed ? 'Hide Password' : 'Reveal Password'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleCopy(item.id, item.secret)}
                        className="p-1 text-[#a99a8b] hover:text-white transition-colors"
                        title="Copy Password"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-[11px] text-[#8895ad] italic">{item.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add Credential */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e140e] dark:bg-[#0c101a] w-full max-w-md rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#cda052]" />
                <span>Store Portal Credential in Vault</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#a99a8b] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCredential} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Service / Portal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST Portal Primary / ICEGATE Customs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Service Category</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as VaultServiceType)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 outline-none"
                >
                  <option value="gst">GST (Goods & Services Tax Network)</option>
                  <option value="icegate">ICEGATE Customs Electronic Gateway</option>
                  <option value="dgft">DGFT (Directorate General of Foreign Trade)</option>
                  <option value="incometax">Income Tax E-Filing</option>
                  <option value="traces">TRACES TDS Portal</option>
                  <option value="bank_ad">Bank AD Code / Foreign Exchange</option>
                  <option value="other">Other Statutory Portal</option>
                </select>
              </div>

              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Identifier (User ID / PAN / GSTIN) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 33AABCR1234F1Z8"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white font-mono border border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Secret / Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter portal password or PIN"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white font-mono border border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Portal URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://services.gst.gov.in"
                  value={portalUrl}
                  onChange={(e) => setPortalUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Notes / Token Association</label>
                <input
                  type="text"
                  placeholder="Mapped DSC serial, authorized branch..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  Store Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
