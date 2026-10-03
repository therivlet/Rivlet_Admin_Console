'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Calculator,
  FileText,
  BookOpen,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  LogOut,
  User,
  X,
  Settings,
  Settings2,
  Factory,
  GitBranch,
  Wallet,
  ListTree,
  KanbanSquare,
  CalendarRange
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import RivletLogo from '@/components/brand/RivletLogo';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeWorkTab = pathname === '/work' ? (searchParams.get('tab') || 'backlog') : null;
  const { artifacts } = useAdminStore();
  const { user, signOut } = useAuth();

  const [promotedToolsExpanded, setPromotedToolsExpanded] = useState(true);
  const [calculatorExpanded, setCalculatorExpanded] = useState(pathname.startsWith('/calculator'));

  const promotedTools = artifacts.filter(a => a.isPromoted && a.status === 'promoted');

  const navItems = [
    { label: 'Overview', href: '/', icon: LayoutDashboard },
    { label: 'Garment Cost Calculator', href: '/calculator', icon: Calculator },
    { label: 'Manufacturer & Vendors', href: '/vendors', icon: Factory },
    { label: 'Sampling & Production', href: '/pipeline', icon: GitBranch },
    { label: 'Launch Budget', href: '/budget', icon: Wallet },
    { label: 'Document Vault', href: '/documents', icon: FileText },
    { label: 'Confidential Brand KB', href: '/knowledge-base', icon: BookOpen },
    { label: 'Artifact Hub & Review', href: '/artifacts', icon: Layers, badge: artifacts.length },
    { label: 'Profile & Brand Settings', href: '/profile', icon: Settings },
  ];

  const workNavItems = [
    { label: 'Backlogs', href: '/work?tab=backlog', tab: 'backlog', icon: ListTree },
    { label: 'Sprint Board', href: '/work?tab=board', tab: 'board', icon: KanbanSquare },
    { label: 'Sprints', href: '/work?tab=sprints', tab: 'sprints', icon: CalendarRange },
    { label: 'Sprint Bug Creation', href: '/work?tab=bulk', tab: 'bulk', icon: Sparkles },
    { label: 'Settings', href: '/work?tab=settings', tab: 'settings', icon: Settings2 },
  ];

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <aside className="w-72 lg:w-64 flex-shrink-0 bg-[#0a0c12] border-r border-[#1a1f2c] flex flex-col h-full select-none z-40">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-[#1a1f2c] flex items-center justify-between">
        <Link href="/" onClick={handleLinkClick} title="Rivlet Executive Command Center" className="flex items-center gap-3 group">
          <RivletLogo variant="gold" size="sm" />
        </Link>

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            title="Close navigation drawer"
            aria-label="Close navigation drawer"
            className="lg:hidden p-1.5 rounded-lg text-[#7c869d] hover:text-white hover:bg-[#161a26] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-[#94a3b8] uppercase">
            Work Tracking
          </div>
          <nav className="space-y-1">
            {workNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkTab === item.tab;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  title={`Navigate to ${item.label}`}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[rgba(205,160,82,0.18)] to-transparent text-[#e6c875] border-l-2 border-[#cda052] font-semibold'
                      : 'text-[#cbd5e1] hover:text-white hover:bg-[#141724]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#cda052]' : 'text-[#8895ad]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-[#94a3b8] uppercase">
            Core Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isCalculator = item.href === '/calculator';

              if (isCalculator) {
                return (
                  <div key={item.href} className="space-y-0.5">
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[rgba(205,160,82,0.18)] to-transparent text-[#e6c875] border-l-2 border-[#cda052] font-semibold'
                          : 'text-[#cbd5e1] hover:text-white hover:bg-[#141724]'
                      }`}
                    >
                      <Link
                        href="/calculator"
                        onClick={handleLinkClick}
                        className="flex items-center gap-2.5 flex-1 truncate"
                        title="Navigate to Garment Cost Calculator"
                      >
                        <Calculator className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#cda052]' : 'text-[#8895ad]'}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCalculatorExpanded((v) => !v);
                        }}
                        className="p-1 rounded hover:bg-[#1a2233] text-[#7c869d] hover:text-[#cda052] transition-colors flex-shrink-0"
                        title="Toggle calculator sub-modules"
                        aria-label="Toggle calculator sub-modules"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${calculatorExpanded ? '' : '-rotate-90'}`} />
                      </button>
                    </div>

                    {/* Calculator Submodule Navigation */}
                    {calculatorExpanded && (
                      <div className="pl-6 pr-2 py-1 space-y-0.5 border-l border-[#1f2638] ml-4 text-[11px] animate-fade-in">
                        <Link
                          href="/calculator"
                          onClick={handleLinkClick}
                          className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                            pathname === '/calculator' && !searchParams.get('action')
                              ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.12)]'
                              : 'text-[#94a3b8] hover:text-white hover:bg-[#141724]'
                          }`}
                        >
                          • Pricing & Unit Economics
                        </Link>
                        <Link
                          href="/calculator?action=new"
                          onClick={handleLinkClick}
                          className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                            searchParams.get('action') === 'new'
                              ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.12)]'
                              : 'text-[#94a3b8] hover:text-white hover:bg-[#141724]'
                          }`}
                        >
                          • New SKU Calculation
                        </Link>
                        <Link
                          href="/calculator#saved"
                          onClick={handleLinkClick}
                          className="block px-2.5 py-1.5 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#141724] transition-colors"
                        >
                          • Active Style Sheets
                        </Link>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  title={`Navigate to ${item.label}`}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[rgba(205,160,82,0.18)] to-transparent text-[#e6c875] border-l-2 border-[#cda052] font-semibold'
                      : 'text-[#cbd5e1] hover:text-white hover:bg-[#141724]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#cda052]' : 'text-[#8895ad]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span 
                      title={`${item.badge} active items`}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#182030] text-[#94a3b8] border border-[#263148] font-mono"
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Promoted Claude Artifacts (Expandable Sub-Navigation Section) */}
        <div>
          <button
            type="button"
            onClick={() => setPromotedToolsExpanded(!promotedToolsExpanded)}
            className="w-full px-3 py-1.5 flex items-center justify-between text-left group hover:bg-[#141824] rounded-lg transition-colors cursor-pointer select-none"
            title="Toggle Promoted Claude Tools sub-navigation"
            aria-label="Toggle Promoted Claude Tools sub-navigation"
          >
            <span className="text-[11px] font-semibold tracking-wider text-[#94a3b8] group-hover:text-white uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#cda052]" />
              Promoted Claude Tools
            </span>
            <div className="flex items-center gap-1.5">
              <span 
                title={`${promotedTools.length} promoted Claude tools active as pages`}
                className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(205,160,82,0.12)] text-[#cda052] border border-[rgba(205,160,82,0.25)] font-semibold font-mono"
              >
                {promotedTools.length} Live
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#5f6c85] group-hover:text-[#cda052] transition-transform duration-200 ${promotedToolsExpanded ? '' : '-rotate-90'}`} />
            </div>
          </button>

          {promotedToolsExpanded && (
            <div className="space-y-1 mt-1 animate-fade-in">
              {promotedTools.length === 0 ? (
                <div className="px-3 py-3 rounded-lg border border-dashed border-[#1f2638] text-center">
                  <p className="text-xs text-[#94a3b8]">No tools promoted yet.</p>
                  <Link
                    href="/artifacts"
                    onClick={handleLinkClick}
                    title="Go to Artifact Vault to review or promote Claude tools"
                    className="text-xs text-[#cda052] hover:underline mt-1 inline-block font-semibold"
                  >
                    Review inbox →
                  </Link>
                </div>
              ) : (
                <>
                  {promotedTools.map((tool) => {
                    const slug = tool.routeSlug || tool.id;
                    const toolHref = `/tools/${slug}`;
                    const isActive = pathname === toolHref;

                    return (
                      <Link
                        key={tool.id}
                        href={toolHref}
                        onClick={handleLinkClick}
                        title={`Open ${tool.title}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors group ${
                          isActive
                            ? 'bg-[rgba(205,160,82,0.14)] text-[#e6c875] border-l-2 border-[#cda052] font-semibold'
                            : 'text-[#cbd5e1] hover:text-white hover:bg-[#141724]'
                        }`}
                      >
                        <span className="truncate max-w-[170px]">{tool.title}</span>
                        <ChevronRight className="w-3 h-3 text-[#5f6c85] group-hover:text-[#cda052] transition-colors flex-shrink-0" />
                      </Link>
                    );
                  })}
                  <div className="pt-1 px-1">
                    <Link
                      href="/artifacts"
                      onClick={handleLinkClick}
                      className="text-[11px] text-[#cda052] hover:underline flex items-center gap-1 font-medium px-2 py-1"
                    >
                      <span>Manage all in Staging Hub</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer User Session Link */}
      <div className="p-3.5 border-t border-[#1a1f2c] bg-[#07080d] text-[11px]">
        <div className="flex items-center justify-between">
          <Link
            href="/profile"
            onClick={handleLinkClick}
            className="flex items-center gap-2 truncate group hover:opacity-90 transition-opacity"
            title="Open Profile & Settings"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] text-black flex items-center justify-center text-xs font-bold shadow-glow flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'R'}
            </div>
            <div className="truncate text-left">
              <span className="text-xs text-[#f1f5f9] group-hover:text-[#cda052] truncate font-semibold block">
                {user?.name || 'Rivlet Admin'}
              </span>
              <span className="text-[10px] text-[#94a3b8] block -mt-0.5">
                Profile & Settings
              </span>
            </div>
          </Link>
          <button
            onClick={() => signOut()}
            className="text-[#94a3b8] hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors"
            title="Sign Out of Rivlet console"
            aria-label="Sign Out"
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
      <div className="hidden lg:flex flex-shrink-0 h-full">
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
