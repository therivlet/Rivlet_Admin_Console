'use client';

import React, { useEffect } from 'react';
import { 
  Users, 
  ArrowUpRight, 
  ExternalLink, 
  Flame, 
  Building2, 
  Contact, 
  Check,
  Copy,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const CRM_BASE_URL = 'https://rivlet-crm.vercel.app';

const CRM_PIPELINES = [
  {
    id: 'athletes',
    title: 'Athletes & Seeding',
    url: 'https://rivlet-crm.vercel.app/',
    description: 'Creator gifting pipeline, athlete ambassadors, fit profiles, and sizing logs',
    icon: Flame,
    badge: 'Core Pipeline'
  },
  {
    id: 'wholesale',
    title: 'Wholesale Studios',
    url: 'https://rivlet-crm.vercel.app/wholesale',
    description: 'Pilates studios, luxury gyms, premium stockists, and B2B wholesale orders',
    icon: Building2,
    badge: 'Commercial B2B'
  },
  {
    id: 'contacts',
    title: 'VIP & Press List',
    url: 'https://rivlet-crm.vercel.app/contacts',
    description: 'Fashion editors, Tier-1 stylists, brand angels, and press contact registry',
    icon: Contact,
    badge: 'Editorial & PR'
  }
];

export default function CrmPage() {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    // Automatically launch CRM in a new tab when visiting /crm directly
    const timer = setTimeout(() => {
      window.open(CRM_BASE_URL, '_blank', 'noopener,noreferrer');
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(CRM_BASE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Hero Redirect Card */}
      <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center sm:text-left">
        <div className="absolute top-0 right-0 w-96 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>External Companion Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-3">
              <Users className="w-7 h-7 text-[#cda052]" />
              <span>Rivlet CRM Application</span>
            </h1>
            <p className="text-sm text-[#94a3b8] mt-2 max-w-xl">
              Rivlet CRM runs as an independent high-performance growth application for creator gifting, athlete ambassadors, and wholesale B2B accounts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center sm:justify-end">
            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#141a27] border border-[#242f45] text-xs font-medium text-slate-300 hover:text-white hover:border-[#cda052]/50 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy Link'}</span>
            </button>
            <a
              href={CRM_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-bold text-xs shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Open Rivlet CRM (New Tab)</span>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </a>
          </div>
        </div>
      </div>

      {/* Direct Module Launchers */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Direct Pipeline Launchers (Opens in New Tab)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CRM_PIPELINES.map((pipeline) => {
            const Icon = pipeline.icon;
            return (
              <a
                key={pipeline.id}
                href={pipeline.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0e121b] border border-[#1e2638] hover:border-emerald-500/40 rounded-xl p-4 transition-all hover:bg-[#121622] group text-left block"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {pipeline.title}
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {pipeline.description}
                </p>
                <div className="mt-3 pt-2.5 border-t border-[#1e2638] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{pipeline.badge}</span>
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    Launch <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Notice info */}
      <div className="bg-[#0e121b]/60 border border-[#1e2638] rounded-xl p-4 flex items-center gap-3 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>
          Rivlet Admin and Rivlet CRM operate seamlessly across browser sessions with cloud persistence.
        </span>
      </div>
    </div>
  );
}
