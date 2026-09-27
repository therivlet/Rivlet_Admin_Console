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
  User,
  X,
  Settings
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import RivletLogo from '@/components/brand/RivletLogo';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
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
    { label: 'Profile & Brand Settings', href: '/profile', icon: Settings },
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <aside className="w-72 lg:w-64 flex-shrink-0 bg-[#0a0c12] border-r border-[#1a1f2c] flex flex-col h-screen select-none z-50">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-[#1a1f2c] flex items-center justify-between">
        <Link href="/" onClick={handleLinkClick} className="flex items-center gap-3 group">
          <RivletLogo variant="gold" size="sm" />
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#7c869d] hover:text-white hover:bg-[#161a26] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
                  onClick={handleLinkClick}
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
              {promotedTools.length} Live
            </span>
          </div>

          <div className="space-y-1">
            {promotedTools.length === 0 ? (
              <div className="px-3 py-3 rounded-lg border border-dashed border-[#1f2638] text-center">
                <p className="text-[11px] text-[#616a7f]">No tools promoted yet.</p>
                <Link
                  href="/artifacts"
                  onClick={handleLinkClick}
                  className="text-[10px] text-[#cda052] hover:underline mt-1 inline-block font-medium"
                >
                  Review inbox →
                </Link>
              </div>
            ) : (
              promotedTools.map((tool) => {
                const slug = tool.routeSlug || tool.id;
                const toolHref = `/tools/${slug}`;
                const isActive = pathname === toolHref;

                return (
                  <Link
                    key={tool.id}
                    href={toolHref}
                    onClick={handleLinkClick}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors group ${
                      isActive
                        ? 'bg-[rgba(205,160,82,0.12)] text-[#e6c875] border-l-2 border-[#cda052] font-medium'
                        : 'text-[#8c94a8] hover:text-white hover:bg-[#121622]'
                    }`}
                  >
                    <span className="truncate max-w-[170px]">{tool.title}</span>
                    <ChevronRight className="w-3 h-3 text-[#495166] group-hover:text-[#cda052] transition-colors flex-shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer Info / Backend Status */}
      <div className="p-3.5 border-t border-[#1a1f2c] bg-[#07080d] text-[11px]">
        <div className="flex items-center justify-between text-[#858d9f] mb-1.5">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#cda052]" />
            Backend Sync
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            {isSupabaseConfigured ? 'Supabase Live' : 'Local / Offline'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[#5f677a] text-[10px]">
          <span>Security Level: High</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Protected
          </span>
        </div>

        {/* User Session Profile Link */}
        <div className="pt-2 mt-2 border-t border-[#171b26] flex items-center justify-between">
          <Link
            href="/profile"
            onClick={handleLinkClick}
            className="flex items-center gap-2 truncate group hover:opacity-85 transition-opacity"
            title="Open Profile & Settings"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] text-black flex items-center justify-center text-[10px] font-bold shadow-glow">
              {user?.name?.[0]?.toUpperCase() || 'R'}
            </div>
            <div className="truncate text-left">
              <span className="text-[11px] text-[#cfd5e4] group-hover:text-[#cda052] truncate font-medium block">
                {user?.name || 'Rivlet Admin'}
              </span>
              <span className="text-[9px] text-[#6b7489] block -mt-0.5">
                Profile & Settings
              </span>
            </div>
          </Link>
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

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          {/* Sliding Drawer */}
          <div className="relative z-10 animate-fade-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
