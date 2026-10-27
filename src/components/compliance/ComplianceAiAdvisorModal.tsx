'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Send,
  Loader2,
  X,
  FileText,
  Anchor,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

interface ComplianceAiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: any;
}

export default function ComplianceAiAdvisorModal({
  isOpen,
  onClose,
  context = {},
}: ComplianceAiAdvisorModalProps) {
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [auditData, setAuditData] = useState<{
    complianceHealthScore: number;
    statusBadge: string;
    executiveSummary: string;
    keyActionItems: string[];
    gstInsight: string;
    customsInsight: string;
    calendarInsight: string;
  } | null>(null);

  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<Array<{ q: string; a: string }>>([]);

  const fetchAudit = (userQuestion?: string) => {
    if (userQuestion) {
      setIsAsking(true);
    } else {
      setLoading(true);
    }

    fetch('/api/ai/compliance/advisor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: userQuestion || '',
        context: {
          activeTab: context.activeTab || 'overview',
          outwardTax: context.outwardTax,
          inputTaxCredit: context.inputTaxCredit,
          netCashPayable: context.netCashPayable,
          invoicesSummary: context.invoicesSummary,
          mismatchedVendors: context.mismatchedVendors,
          consignmentsSummary: context.consignmentsSummary,
          advanceTaxSummary: context.advanceTaxSummary,
          dscTokensSummary: context.dscTokensSummary,
          upcomingDeadlines: context.upcomingDeadlines,
        },
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (userQuestion) {
          setQaHistory(prev => [
            ...prev,
            { q: userQuestion, a: data.executiveSummary || data.gstInsight || 'Analysis completed.' },
          ]);
          setIsAsking(false);
          setQuestion('');
        } else {
          setAuditData(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Error fetching compliance audit:', err);
        setLoading(false);
        setIsAsking(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      fetchAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySummary = () => {
    if (!auditData) return;
    const text = `RIVLET STATUTORY COMPLIANCE PULSE\nStatus: ${auditData.statusBadge} (${auditData.complianceHealthScore}% Health)\n\n${auditData.executiveSummary}\n\nKey Actions:\n${auditData.keyActionItems.map(a => `• ${a}`).join('\n')}\n\nGST: ${auditData.gstInsight}\nCustoms: ${auditData.customsInsight}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickPrompts = [
    'How does Rule 88A prioritize IGST credit?',
    'What are the penalties under Section 234C for advance tax?',
    'How do we prevent port demurrage on inbound fabric?',
  ];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#0e121b] w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#1e2638] flex items-center justify-between bg-slate-50 dark:bg-[#080b12] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#cda052]/10 border border-[#cda052]/20 text-[#cda052]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Statutory AI Compliance & Tax Co-Pilot
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#cda052]/10 text-[#cda052] border border-[#cda052]/20">
                  Google Gemini
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#8a96ae]">
                Real-time regulatory intelligence across GST Rule 88A, ICEGATE Customs & Advance Tax
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAudit()}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              title="Refresh Audit"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-[#cda052] animate-spin" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Analyzing Statutory Telemetry & Set-Off Registers...
              </p>
              <p className="text-xs text-slate-500 dark:text-[#8a96ae]">
                Auditing GSTR-2B mismatches, port clearance gates, and advance tax schedules
              </p>
            </div>
          ) : auditData ? (
            <>
              {/* Executive Pulse Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-[#1e2638] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-[#8a96ae] uppercase tracking-wider">
                      Current Posture
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {auditData.statusBadge}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                    {auditData.executiveSummary}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-[#1e2638] min-w-[120px] text-center shadow-sm">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-[#8a96ae] font-semibold">
                    Health Score
                  </span>
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-[#cda052] mt-0.5">
                    {auditData.complianceHealthScore}%
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    Audit Certified
                  </span>
                </div>
              </div>

              {/* Action Items */}
              {auditData.keyActionItems && auditData.keyActionItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#8a96ae] block">
                    Immediate Statutory Directives
                  </span>
                  <div className="space-y-2">
                    {auditData.keyActionItems.map((action, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white dark:bg-[#080b12] border border-slate-200 dark:border-[#1e2638] flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-200 shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#cda052] flex-shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Module Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* GST Pillar */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#1e2638] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <FileText className="w-3.5 h-3.5 text-[#cda052]" />
                    <span>GST & ITC Strategy</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {auditData.gstInsight}
                  </p>
                </div>

                {/* Customs Pillar */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#1e2638] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Anchor className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>ICEGATE Customs Clearance</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {auditData.customsInsight}
                  </p>
                </div>

                {/* Calendar Pillar */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-[#1e2638] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Statutory Deadlines</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {auditData.calendarInsight}
                  </p>
                </div>
              </div>

              {/* Interactive Q&A Assistant Section */}
              <div className="pt-2 border-t border-slate-200 dark:border-[#1e2638] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#8a96ae] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#cda052]" />
                    <span>Ask Statutory Compliance Co-Pilot</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Context-Aware AI</span>
                </div>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => fetchAudit(p)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200 dark:border-white/10 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Q&A Stream History */}
                {qaHistory.length > 0 && (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {qaHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-[#1e2638] space-y-1"
                      >
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#cda052]/20 text-[#cda052]">Q</span>
                          <span>{item.q}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 pl-5 leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input Field */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (question.trim()) fetchAudit(question.trim());
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask any statutory question (e.g. Can we claim ITC on fabric sample losses?)..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !question.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#cda052] text-slate-900 font-bold text-xs flex items-center gap-1.5 hover:bg-[#dfb56c] disabled:opacity-50 transition-colors flex-shrink-0"
                  >
                    {isAsking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Ask</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <p className="text-center py-10 text-slate-500">Could not generate statutory audit.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-[#1e2638] flex items-center justify-between bg-slate-50 dark:bg-black/20 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white"
          >
            Close
          </button>
          {auditData && (
            <button
              onClick={handleCopySummary}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-black/40 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white font-semibold text-xs border border-slate-200 dark:border-white/10 flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Audit Copied!' : 'Copy Executive Audit'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
