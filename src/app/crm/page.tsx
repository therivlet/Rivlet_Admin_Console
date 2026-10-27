'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  ExternalLink, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Copy, 
  Check, 
  Sparkles, 
  Building2, 
  Contact, 
  Flame, 
  Globe, 
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';

const CRM_BASE_URL = 'https://rivlet-crm.vercel.app';

interface CrmTab {
  id: string;
  label: string;
  subpath: string;
  description: string;
  icon: React.ElementType;
  badge: string;
}

const CRM_TABS: CrmTab[] = [
  {
    id: 'athletes',
    label: 'Athletes & Seeding',
    subpath: '/',
    description: 'Creator gifting pipeline, athlete ambassadors, fit profiles, and sizing logs',
    icon: Flame,
    badge: 'Core Pipeline'
  },
  {
    id: 'wholesale',
    label: 'Wholesale Studios',
    subpath: '/wholesale',
    description: 'Pilates studios, luxury gyms, premium stockists, and B2B wholesale orders',
    icon: Building2,
    badge: 'Commercial B2B'
  },
  {
    id: 'contacts',
    label: 'VIP & Press List',
    subpath: '/contacts',
    description: 'Fashion editors, Tier-1 stylists, brand angels, and press contact registry',
    icon: Contact,
    badge: 'Editorial & PR'
  }
];

export default function CrmPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('athletes');
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const selectedTab = CRM_TABS.find(t => t.id === activeTab) || CRM_TABS[0];
  const currentUrl = `${CRM_BASE_URL}${selectedTab.subpath}`;

  const handleTabChange = (tabId: string) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      setIsLoading(true);
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(k => k + 1);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`p-3 sm:p-6 space-y-4 max-w-[1600px] mx-auto animate-fade-in ${isExpanded ? 'fixed inset-0 z-50 bg-[#07090e] p-2 sm:p-4 overflow-y-auto max-w-none' : ''}`}>
      {/* Top Header Card */}
      <div className="bg-[#0e121b] border border-[#1e2638] rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle decorative gold glow */}
        <div className="absolute top-0 right-0 w-96 h-48 bg-[#cda052]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Linked Application
              </span>
              <span className="text-xs font-mono text-[#94a3b8] px-2 py-0.5 rounded bg-black/40 border border-white/5">
                rivlet-crm.vercel.app
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#cda052]" />
              Rivlet CRM — Activewear Operations & Growth
            </h1>
            <p className="text-xs sm:text-sm text-[#94a3b8] mt-1 max-w-3xl">
              Connected commercial platform for creator gifting, athlete ambassador rosters, wholesale fitness studio stockists, and VIP editorial press contacts.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyLink}
              title="Copy CRM link"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a27] border border-[#242f45] text-xs font-medium text-[#cbd5e1] hover:text-white hover:border-[#cda052]/50 transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />}
              <span>{isCopied ? 'Link Copied' : 'Copy URL'}</span>
            </button>

            <button
              onClick={handleReload}
              title="Refresh CRM frame"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a27] border border-[#242f45] text-xs font-medium text-[#cbd5e1] hover:text-white hover:border-[#cda052]/50 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span>Reload</span>
            </button>

            <button
              onClick={() => setIsExpanded(prev => !prev)}
              title={isExpanded ? 'Exit expanded view' : 'Expand full canvas'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a27] border border-[#242f45] text-xs font-medium text-[#cbd5e1] hover:text-white hover:border-[#cda052]/50 transition-colors"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-[#cda052]" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#cda052]" />
                  <span>Maximize</span>
                </>
              )}
            </button>

            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 shadow-glow transition-all"
            >
              <span>Launch New Tab</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </a>
          </div>
        </div>

        {/* 3 Quick Navigation Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-4 border-t border-[#1e2638]">
          {CRM_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'bg-[rgba(205,160,82,0.12)] border-[#cda052] shadow-sm'
                    : 'bg-[#080b12] border-[#1e2638] hover:border-slate-600 hover:bg-[#121622]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-[#cda052] text-black' : 'bg-[#182030] text-[#94a3b8] group-hover:text-white'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-[#f7d88c]' : 'text-white'}`}>
                      {tab.label}
                    </span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#94a3b8] font-mono border border-white/5">
                    {tab.badge}
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8] line-clamp-1">
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Frame Control Strip */}
      <div className="flex items-center justify-between text-xs px-2 text-[#94a3b8]">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-[#cda052]" />
          <span className="font-mono text-[11px] text-[#cbd5e1]">{currentUrl}</span>
          {isLoading && (
            <span className="text-[10px] text-amber-400 animate-pulse flex items-center gap-1">
              • Loading CRM...
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded ${deviceMode === 'desktop' ? 'bg-[#1e2638] text-white' : 'text-[#64748b] hover:text-white'}`}
            title="Desktop view"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded ${deviceMode === 'mobile' ? 'bg-[#1e2638] text-white' : 'text-[#64748b] hover:text-white'}`}
            title="Mobile device simulator"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Live CRM Viewport */}
      <div className={`w-full flex justify-center transition-all ${isExpanded ? 'h-[calc(100vh-180px)]' : 'h-[750px]'}`}>
        <div className={`h-full bg-[#0a0d14] border border-[#1e2638] rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300 ${deviceMode === 'mobile' ? 'w-[420px] ring-8 ring-[#141a27]' : 'w-full'}`}>
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0d14] z-20 space-y-3">
              <div className="w-8 h-8 border-2 border-[#cda052] border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-[#94a3b8] font-medium">Connecting to Rivlet CRM...</div>
              <div className="text-[11px] font-mono text-[#64748b]">{currentUrl}</div>
            </div>
          )}

          <iframe
            key={`${currentUrl}-${iframeKey}`}
            ref={iframeRef}
            src={currentUrl}
            title="Rivlet CRM"
            onLoad={() => setIsLoading(false)}
            className="w-full h-full border-none bg-white dark:bg-[#07090e]"
            allow="clipboard-write; clipboard-read"
          />
        </div>
      </div>

      {/* Bottom Ecosystem Card */}
      <div className="bg-[#0e121b]/80 border border-[#1e2638] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#94a3b8]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            Rivlet Admin Console & Rivlet CRM share unified brand telemetry and operational sourcing profiles.
          </span>
        </div>
        <a
          href="https://rivlet-crm.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#cda052] hover:text-[#f7d88c] font-medium flex items-center gap-1 group whitespace-nowrap"
        >
          <span>Open rivlet-crm.vercel.app directly</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
