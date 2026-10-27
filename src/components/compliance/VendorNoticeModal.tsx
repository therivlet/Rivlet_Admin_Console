'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, MessageSquare, Copy, Check, X, AlertTriangle, Loader2 } from 'lucide-react';

export interface VendorInvoiceItem {
  id: string;
  supplierName: string;
  gstin: string;
  invoiceNumber: string;
  invoiceDate: string;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  matchStatus?: string;
  itcEligibility?: string;
}

interface VendorNoticeModalProps {
  invoice: VendorInvoiceItem | null;
  onClose: () => void;
}

export default function VendorNoticeModal({ invoice, onClose }: VendorNoticeModalProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('email');
  const [copied, setCopied] = useState(false);
  const [noticeData, setNoticeData] = useState<{
    emailSubject: string;
    emailBody: string;
    whatsappText: string;
    statutoryWarning: string;
  } | null>(null);

  useEffect(() => {
    if (!invoice) return;

    let isMounted = true;
    setLoading(true);

    fetch('/api/ai/compliance/vendor-notice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supplierName: invoice.supplierName,
        gstin: invoice.gstin,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        taxableValue: invoice.taxableValue,
        igst: invoice.igst,
        cgst: invoice.cgst,
        sgst: invoice.sgst,
        discrepancyType: invoice.matchStatus === 'mismatch' ? 'Amount mismatch in GSTR-2B vs Books' : 'Invoice not yet uploaded in GSTR-1 by vendor',
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setNoticeData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load vendor notice:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [invoice]);

  if (!invoice) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalTaxAtRisk = (invoice.igst || 0) + (invoice.cgst || 0) + (invoice.sgst || 0);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0e121b] w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1e2638] flex items-start justify-between bg-slate-50 dark:bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#cda052]/10 border border-[#cda052]/20 text-[#cda052]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI GSTR-2B Vendor Notice Generator
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#8a96ae]">
                Auto-draft statutory communication under Section 16(2)(aa) to unblock ITC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Invoice Summary Pill */}
        <div className="p-3 mx-4 sm:mx-5 mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="font-bold text-amber-900 dark:text-amber-300">{invoice.supplierName}</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono ml-2">({invoice.gstin})</span>
          </div>
          <div className="font-mono">
            <span className="text-slate-500 dark:text-slate-400">Inv: </span>
            <strong className="text-slate-900 dark:text-white">{invoice.invoiceNumber}</strong>
            <span className="text-slate-500 dark:text-slate-400 ml-2">ITC at Risk: </span>
            <strong className="text-rose-600 dark:text-rose-400 font-bold">₹{totalTaxAtRisk.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="px-4 sm:px-5 pt-3 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              activeTab === 'email'
                ? 'bg-[#cda052]/10 border-[#cda052]/30 text-[#cda052]'
                : 'bg-slate-100 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Formal Email Notice</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              activeTab === 'whatsapp'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-black/30 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Quick Message</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-7 h-7 text-[#cda052] animate-spin" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Drafting statutory notice citing CGST Section 16(2)(aa)...
              </p>
            </div>
          ) : noticeData ? (
            activeTab === 'email' ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-semibold">Subject Line:</label>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-[#1e2638] font-medium text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{noticeData.emailSubject}</span>
                    <button
                      onClick={() => handleCopy(noticeData.emailSubject)}
                      className="text-slate-400 hover:text-[#cda052] p-1"
                      title="Copy Subject"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-semibold">Email Body:</label>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-[#1e2638] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-sans max-h-56 overflow-y-auto">
                    {noticeData.emailBody}
                  </div>
                </div>

                {noticeData.statutoryWarning && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 flex items-start gap-2 text-[11px]">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{noticeData.statutoryWarning}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 font-semibold">Instant WhatsApp Message:</label>
                  <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {noticeData.whatsappText}
                  </div>
                </div>
              </div>
            )
          ) : (
            <p className="text-xs text-rose-500 text-center py-6">Could not generate notice.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-[#1e2638] flex items-center justify-between bg-slate-50 dark:bg-black/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white"
          >
            Close
          </button>
          {noticeData && (
            <button
              onClick={() => handleCopy(activeTab === 'email' ? `${noticeData.emailSubject}\n\n${noticeData.emailBody}` : noticeData.whatsappText)}
              className="px-4 py-2 rounded-xl bg-[#cda052] text-slate-900 font-bold text-xs flex items-center gap-1.5 hover:bg-[#dfb56c] transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : activeTab === 'email' ? 'Copy Full Email' : 'Copy Message'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
