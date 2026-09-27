'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Layers, 
  Calculator, 
  FileText, 
  BookOpen, 
  Sparkles, 
  ChevronRight,
  Database,
  ExternalLink,
  ShieldCheck,
  LogOut,
  User
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { artifacts } = useAdminStore();
  const { user, signOut } = useAuth();

  const promotedTools = artifacts.filter(a => a.isPromoted && a.status === 'promoted');

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Artifact Hub & Review', href: '/artifacts', icon: Layers, badge: artifacts.length },
    { label: 'Garment Cost Calculator', href: '/calculator', icon: Calculator },
    { label: 'Document Vault', href: '/documents', icon: FileText },
    { label: 'Confidential Brand KB', href: '/knowledge-base', icon: BookOpen },
  ];

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0c0e14] border-r border-[#1a1f2c] flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1a1f2c] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#cda052] to-[#8c672b] flex items-center justify-center shadow-glow font-serif font-bold text-black text-lg tracking-wider transition-transform group-hover:scale-105">
            R
          </div>
          <div>
            <span className="font-serif tracking-[0.2em] text-sm font-bold text-white block uppercase">
              RIVLET
            </span>
            <span className="text-[10px] text-[#8e95a5] uppercase tracking-widest block font-medium">
              Admin & Operations
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-[#636b80] uppercase">
            Core Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[rgba(205,160,82,0.18)] to-transparent text-[#e6c875] border-l-2 border-[#cda052] font-semibold'
                      : 'text-[#9fa6b8] hover:text-white hover:bg-[#141722]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#cda052]' : 'text-[#70788d]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#1b202e] text-[#8e97ae] border border-[#262c3e]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Promoted Claude Artifacts (First-class Custom Pages) */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-wider text-[#636b80] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#cda052]" />
              Promoted Claude Tools
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(205,160,82,0.1)] text-[#cda052] border border-[rgba(205,160,82,0.2)]">
              {promotedTools.length} Pinned
            </span>
          </div>

          <div className="space-y-1">
            {promotedTools.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-[#555d71] italic">
                No tools pinned yet. Promote artifacts from the Artifact Hub.
              </div>
            ) : (
              promotedTools.map((tool) => {
                const toolHref = `/tools/${tool.routeSlug || tool.id}`;
                const isActive = pathname === toolHref;
                return (
                  <Link
                    key={tool.id}
                    href={toolHref}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                      isActive
                        ? 'bg-[#181d2a] text-[#e6c875] border-l-2 border-[#cda052] font-medium'
                        : 'text-[#9fa6b8] hover:text-white hover:bg-[#141722]'
                    }`}
                  >
                    <span className="truncate pr-2">{tool.title}</span>
                    <ChevronRight className="w-3 h-3 text-[#555d71] flex-shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Info / Backend Status */}
      <div className="p-3 border-t border-[#1a1f2c] bg-[#090b10] text-[11px]">
        <div className="flex items-center justify-between text-[#858d9f] mb-1.5">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#cda052]" />
            Backend Sync
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            {isSupabaseConfigured ? 'Supabase' : 'Local / Offline'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[#5f677a] text-[10px]">
          <span>Confidentiality: High</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Protected
          </span>
        </div>

        {/* User Session */}
        <div className="pt-2 mt-2 border-t border-[#1a1f2c] flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-5 h-5 rounded-full bg-[#1b202e] text-[#cda052] flex items-center justify-center text-[10px] font-bold border border-[#2b3346]">
              {user?.name?.[0]?.toUpperCase() || 'R'}
            </div>
            <span className="text-[11px] text-[#cfd5e4] truncate font-medium">
              {user?.name || 'Rivlet Admin'}
            </span>
          </div>
          <button
            onClick={() => signOut()}
            className="text-[#646c80] hover:text-rose-400 p-1 rounded transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
