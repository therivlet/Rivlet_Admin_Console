'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
  Layers,
  Calculator,
  FileText,
  BookOpen,
  ChevronDown,
  LogOut,
  Settings,
  Factory,
  GitBranch,
  Wallet,
  ListTree,
  KanbanSquare,
  CalendarRange,
  Sparkles,
  Users,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  UserCheck,
  X
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import RivletLogo, { RivletWaveIcon, RivletBrandCombo } from '@/components/brand/RivletLogo';

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

  // Collapsible sidebar state for desktop
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [docsExpanded, setDocsExpanded] = useState(
    pathname === '/documents' || pathname === '/knowledge-base' || pathname === '/artifacts'
  );
  const [calculatorExpanded, setCalculatorExpanded] = useState(pathname.startsWith('/calculator'));

  // Load collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rivlet_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore SSR or storage exceptions
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rivlet_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isCalcPath = pathname === '/calculator';
  const calcTab = searchParams.get('tab');
  const calcAction = searchParams.get('action');

  const isOverviewActive = isCalcPath && (calcTab === 'overview' || !calcTab) && calcAction !== 'new';
  const isStudioActive = isCalcPath && calcTab === 'studio' && calcAction !== 'new';
  const isStylesActive = isCalcPath && (calcTab === 'styles' || calcTab === 'saved');
  const isGuideActive = isCalcPath && (calcTab === 'guide' || calcTab === 'help');

  const isDocsActive = pathname === '/documents' || pathname === '/knowledge-base' || pathname === '/artifacts';

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const workSubmenuItems = [
    { label: 'Backlogs', href: '/work?tab=backlog', tab: 'backlog', icon: ListTree },
    { label: 'Sprint Board', href: '/work?tab=board', tab: 'board', icon: KanbanSquare },
    { label: 'Sprints', href: '/work?tab=sprints', tab: 'sprints', icon: CalendarRange },
    { label: 'Sprint Bulk Creation', href: '/work?tab=bulk', tab: 'bulk', icon: Sparkles },
    { label: 'Teams', href: '/work?tab=settings', tab: 'settings', icon: Users },
  ];

  const docsSubmenuItems = [
    { label: 'Document Vault', href: '/documents', icon: FileText },
    { label: 'Confidential Brand KB', href: '/knowledge-base', icon: BookOpen },
    { label: 'Artifact Hub Review', href: '/artifacts', icon: Layers, badge: artifacts.length },
  ];

  const renderNavContent = (collapsed: boolean) => (
    <aside
      className={`relative flex flex-col h-full bg-[#0a0c12]/95 backdrop-blur-xl select-none z-40 transition-all duration-300 ease-in-out shadow-[6px_0_30px_rgba(0,0,0,0.45)] border-r border-[#1a2233] ${
        collapsed ? 'w-[68px]' : 'w-72 lg:w-64'
      }`}
    >
      {/* Modern Edge Seam Collapse / Expand Toggle Arrow right on the dividing line */}
      <button
        type="button"
        onClick={toggleCollapsed}
        title={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        className="hidden lg:flex absolute -right-3 top-7 z-[70] w-6 h-6 rounded-full bg-[#182030] hover:bg-[#222d42] border border-[#2e3b52] hover:border-[#cda052] text-[#94a3b8] hover:text-[#cda052] shadow-xl items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer group"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        )}
      </button>

      {/* Brand Header: Expanded shows Wordmark + Logo together; Collapsed shows Logo alone */}
      <div className="p-4 sm:p-5 flex items-center justify-between min-h-[64px]">
        {!collapsed ? (
          <Link
            href="/"
            onClick={handleLinkClick}
            title="Rivlet Executive Command Center"
            className="flex items-center gap-2.5 group overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1b2234] to-[#0e121b] border border-[#2b3852] flex items-center justify-center shadow-glow flex-shrink-0 group-hover:border-[#cda052]/60 transition-colors">
              <RivletWaveIcon variant="gold" size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <RivletLogo variant="gold" size="xs" />
              <span className="text-[8px] uppercase tracking-[0.18em] text-[#94a3b8] font-mono mt-0.5 leading-none">
                Admin Console
              </span>
            </div>
          </Link>
        ) : (
          <Link
            href="/"
            onClick={handleLinkClick}
            title="Rivlet Executive Command Center"
            className="mx-auto flex items-center justify-center p-1 rounded-xl hover:bg-white/[0.04] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1b2234] to-[#0e121b] border border-[#2b3852] flex items-center justify-center shadow-glow group-hover:border-[#cda052]/60 transition-colors">
              <RivletWaveIcon variant="gold" size={22} className="group-hover:scale-110" />
            </div>
          </Link>
        )}

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

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2 space-y-4 scrollbar-thin">
        {/* 1. HOME BUTTON */}
        <div className="relative group">
          <Link
            href="/"
            onClick={handleLinkClick}
            title="Home"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
              collapsed ? 'justify-center' : ''
            } ${
              pathname === '/'
                ? 'bg-gradient-to-r from-[rgba(205,160,82,0.22)] via-[rgba(205,160,82,0.08)] to-transparent text-[#e6c875] font-semibold shadow-inner'
                : 'text-[#cbd5e1] hover:text-white hover:bg-[#131622]'
            }`}
          >
            <Home className={`w-4 h-4 flex-shrink-0 ${pathname === '/' ? 'text-[#cda052]' : 'text-[#8895ad] group-hover:text-white'}`} />
            {!collapsed && <span>Home</span>}
          </Link>

          {/* Hover Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0d101a] border border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[70]">
              Home
            </div>
          )}
        </div>

        {/* 2. WORK TRACKING (Always expanded, clean header without submenu text) */}
        <div>
          {!collapsed ? (
            <div className="px-2 mb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-wider text-[#94a3b8] uppercase">
              <span className="flex items-center gap-1.5">
                <ListTree className="w-3.5 h-3.5 text-[#cda052]" />
                Work Tracking
              </span>
            </div>
          ) : (
            <div className="my-2 border-t border-white/[0.06]" />
          )}

          {/* Submenu Items visible outside with clear indented structure */}
          <div className={collapsed ? 'space-y-1' : 'ml-2 pl-2.5 border-l-2 border-[#1c2336] space-y-1 my-1'}>
            {workSubmenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkTab === item.tab;
              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    title={`Work Tracking → ${item.label}`}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      isActive
                        ? 'bg-[rgba(205,160,82,0.18)] text-[#e6c875] font-semibold'
                        : 'text-[#cbd5e1] hover:text-white hover:bg-[#131622]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#cda052]' : 'text-[#8895ad] group-hover:text-white'}`} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0d101a] border border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[70]">
                      <span className="text-[#8895ad] text-[10px] block">Work Tracking</span>
                      <span className="font-semibold text-[#e6c875]">{item.label}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. BUSINESS & OPERATIONS MODULES */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="px-2 pt-2 mb-1.5 text-[11px] font-semibold tracking-wider text-[#94a3b8] uppercase">
              Operations & Planning
            </div>
          )}

          {/* Business Calculations (with expandable tabs and hover flyout when collapsed) */}
          <div className="relative group">
            <div
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                collapsed ? 'justify-center' : ''
              } ${
                isCalcPath
                  ? 'bg-gradient-to-r from-[rgba(205,160,82,0.22)] via-[rgba(205,160,82,0.08)] to-transparent text-[#e6c875] font-semibold'
                  : 'text-[#cbd5e1] hover:text-white hover:bg-[#131622]'
              }`}
            >
              <Link
                href="/calculator"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 flex-1 truncate ${collapsed ? 'justify-center' : ''}`}
                title="Business Calculations"
              >
                <Calculator className={`w-4 h-4 flex-shrink-0 ${isCalcPath ? 'text-[#cda052]' : 'text-[#8895ad] group-hover:text-white'}`} />
                {!collapsed && <span className="truncate">Business Calculations</span>}
              </Link>
              {!collapsed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCalculatorExpanded((v) => !v);
                  }}
                  className="p-1 rounded hover:bg-[#1a2233] text-[#7c869d] hover:text-[#cda052] transition-colors flex-shrink-0 cursor-pointer"
                  title="Toggle calculation sub-modules"
                  aria-label="Toggle calculation sub-modules"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${calculatorExpanded ? '' : '-rotate-90'}`} />
                </button>
              )}
            </div>

            {/* Submodules in expanded view */}
            {!collapsed && calculatorExpanded && (
              <div className="ml-5 pl-3 py-1 space-y-0.5 border-l border-[#1f2638] text-[11px] animate-fade-in">
                <Link
                  href="/calculator?tab=overview"
                  onClick={handleLinkClick}
                  className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                    isOverviewActive
                      ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.12)]'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#141724]'
                  }`}
                >
                  • Overview Dashboard
                </Link>
                <Link
                  href="/calculator?tab=studio"
                  onClick={handleLinkClick}
                  className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                    isStudioActive
                      ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.12)]'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#141724]'
                  }`}
                >
                  • Pricing & Unit Economy
                </Link>
                <Link
                  href="/calculator?tab=styles"
                  onClick={handleLinkClick}
                  className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                    isStylesActive
                      ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.12)]'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#141724]'
                  }`}
                >
                  • Active Styles
                </Link>
                <Link
                  href="/calculator?tab=guide"
                  onClick={handleLinkClick}
                  className={`block px-2.5 py-1.5 rounded-md transition-colors ${
                    isGuideActive
                      ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.12)]'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#141724]'
                  }`}
                >
                  • Calculation Guide
                </Link>
              </div>
            )}

            {/* Hover Floating Dropdown Flyout when collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-2 top-0 p-3 bg-[#0d101a] border border-[#22293e] rounded-2xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-[70] min-w-[210px]">
                <div className="flex items-center gap-2 font-bold text-[#e6c875] pb-2 mb-2 border-b border-white/[0.08]">
                  <Calculator className="w-3.5 h-3.5 text-[#cda052]" />
                  <span>Business Calculations</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <Link
                    href="/calculator?tab=overview"
                    onClick={handleLinkClick}
                    className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                      isOverviewActive
                        ? 'bg-[rgba(205,160,82,0.18)] text-[#e6c875] font-semibold'
                        : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    • Overview Dashboard
                  </Link>
                  <Link
                    href="/calculator?tab=studio"
                    onClick={handleLinkClick}
                    className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                      isStudioActive
                        ? 'bg-[rgba(205,160,82,0.18)] text-[#e6c875] font-semibold'
                        : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    • Pricing & Unit Economy
                  </Link>
                  <Link
                    href="/calculator?tab=styles"
                    onClick={handleLinkClick}
                    className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                      isStylesActive
                        ? 'bg-[rgba(205,160,82,0.18)] text-[#e6c875] font-semibold'
                        : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    • Active Styles
                  </Link>
                  <Link
                    href="/calculator?tab=guide"
                    onClick={handleLinkClick}
                    className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                      isGuideActive
                        ? 'bg-[rgba(205,160,82,0.18)] text-[#e6c875] font-semibold'
                        : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    • Calculation Guide
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Vendors */}
          <div className="relative group">
            <Link
              href="/vendors"
              onClick={handleLinkClick}
              title="Vendors"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                collapsed ? 'justify-center' : ''
              } ${
                pathname === '/vendors'
                  ? 'bg-gradient-to-r from-[rgba(205,160,82,0.22)] via-[rgba(205,160,82,0.08)] to-transparent text-[#e6c875] font-semibold'
                  : 'text-[#cbd5e1] hover:text-white hover:bg-[#131622]'
              }`}
            >
              <Factory className={`w-4 h-4 flex-shrink-0 ${pathname === '/vendors' ? 'text-[#cda052]' : 'text-[#8895ad] group-hover:text-white'}`} />
              {!collapsed && <span>Vendors</span>}
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0d101a] border border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[70]">
                Vendors
              </div>
            )}
          </div>

          {/* Pipeline */}
          <div className="relative group">
            <Link
              href="/pipeline"
              onClick={handleLinkClick}
              title="Pipeline"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                collapsed ? 'justify-center' : ''
              } ${
                pathname === '/pipeline'
                  ? 'bg-gradient-to-r from-[rgba(205,160,82,0.22)] via-[rgba(205,160,82,0.08)] to-transparent text-[#e6c875] font-semibold'
                  : 'text-[#cbd5e1] hover:text-white hover:bg-[#131622]'
              }`}
            >
              <GitBranch className={`w-4 h-4 flex-shrink-0 ${pathname === '/pipeline' ? 'text-[#cda052]' : 'text-[#8895ad] group-hover:text-white'}`} />
              {!collapsed && <span>Pipeline</span>}
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0d101a] border border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[70]">
                Pipeline
              </div>
            )}
          </div>

          {/* Budget Tracker */}
          <div className="relative group">
            <Link
              href="/budget"
              onClick={handleLinkClick}
              title="Budget Tracker"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                collapsed ? 'justify-center' : ''
              } ${
                pathname === '/budget'
                  ? 'bg-gradient-to-r from-[rgba(205,160,82,0.22)] via-[rgba(205,160,82,0.08)] to-transparent text-[#e6c875] font-semibold'
                  : 'text-[#cbd5e1] hover:text-white hover:bg-[#131622]'
              }`}
            >
              <Wallet className={`w-4 h-4 flex-shrink-0 ${pathname === '/budget' ? 'text-[#cda052]' : 'text-[#8895ad] group-hover:text-white'}`} />
              {!collapsed && <span>Budget Tracker</span>}
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0d101a] border border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[70]">
                Budget Tracker
              </div>
            )}
          </div>
        </div>

        {/* 4. CONSOLIDATED DOCUMENTATION & VAULT MENU */}
        <div className="space-y-1">
          {!collapsed ? (
            <div className="px-2 pt-2 mb-1.5 text-[11px] font-semibold tracking-wider text-[#94a3b8] uppercase">
              Knowledge & Assets
            </div>
          ) : (
            <div className="my-2 border-t border-white/[0.06]" />
          )}

          {!collapsed ? (
            <div className="relative group">
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                  isDocsActive
                    ? 'bg-gradient-to-r from-[rgba(205,160,82,0.22)] via-[rgba(205,160,82,0.08)] to-transparent text-[#e6c875] font-semibold'
                    : 'text-[#cbd5e1] hover:text-white hover:bg-[#131622]'
                }`}
              >
                <Link
                  href="/documents"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 flex-1 truncate"
                  title="Documentation & Vault"
                >
                  <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isDocsActive ? 'text-[#cda052]' : 'text-[#8895ad] group-hover:text-white'}`} />
                  <span className="truncate">Documentation & Vault</span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDocsExpanded((v) => !v);
                  }}
                  className="p-1 rounded hover:bg-[#1a2233] text-[#7c869d] hover:text-[#cda052] transition-colors flex-shrink-0 cursor-pointer"
                  title="Toggle documentation sub-items"
                  aria-label="Toggle documentation sub-items"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${docsExpanded ? '' : '-rotate-90'}`} />
                </button>
              </div>

              {/* Subnavigations when expanded */}
              {docsExpanded && (
                <div className="ml-5 pl-3 py-1 space-y-0.5 border-l border-[#1f2638] text-[11px] animate-fade-in">
                  {docsSubmenuItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={handleLinkClick}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                          isSubActive
                            ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.12)]'
                            : 'text-[#94a3b8] hover:text-white hover:bg-[#141724]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-[#cda052]' : 'text-[#7c869d]'}`} />
                          <span className="truncate">{sub.label}</span>
                        </div>
                        {sub.badge !== undefined && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#182030] text-[#94a3b8] border border-[#263148] font-mono">
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* COLLAPSED MODE: Show all 3 icons (FileText, BookOpen, Layers) in navigation rail + hover flyout */
            <div className="space-y-1">
              {docsSubmenuItems.map((sub) => {
                const SubIcon = sub.icon;
                const isSubActive = pathname === sub.href;

                return (
                  <div key={sub.href} className="relative group">
                    <Link
                      href={sub.href}
                      onClick={handleLinkClick}
                      title={sub.label}
                      className={`flex items-center justify-center px-3 py-2 rounded-xl text-xs transition-all ${
                        isSubActive
                          ? 'bg-[rgba(205,160,82,0.22)] text-[#e6c875] font-semibold ring-1 ring-[#cda052]/50'
                          : 'text-[#cbd5e1] hover:text-white hover:bg-[#131622]'
                      }`}
                    >
                      <SubIcon className={`w-4 h-4 flex-shrink-0 ${isSubActive ? 'text-[#cda052]' : 'text-[#8895ad] group-hover:text-white'}`} />
                    </Link>

                    {/* Floating Dropdown / Tooltip when hovering any of the 3 docs icons */}
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 p-3 bg-[#0d101a] border border-[#22293e] rounded-2xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-[70] min-w-[210px]">
                      <div className="flex items-center gap-2 font-bold text-[#e6c875] pb-2 mb-2 border-b border-white/[0.08]">
                        <FolderOpen className="w-3.5 h-3.5 text-[#cda052]" />
                        <span>Documentation & Vault</span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        {docsSubmenuItems.map((item) => {
                          const ItemIcon = item.icon;
                          const isItemActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={handleLinkClick}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                                isItemActive
                                  ? 'bg-[rgba(205,160,82,0.18)] text-[#e6c875] font-semibold'
                                  : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <ItemIcon className={`w-3.5 h-3.5 ${isItemActive ? 'text-[#cda052]' : 'text-[#7c869d]'}`} />
                                <span>{item.label}</span>
                              </div>
                              {item.badge !== undefined && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black text-[#94a3b8] font-mono">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. ACCOUNTS & USER FOOTER */}
      <div className={`p-3 bg-[#07080d]/80 text-[11px] ${collapsed ? 'text-center' : ''}`}>
        {!collapsed ? (
          <div>
            <div className="px-2 mb-2 text-[10px] font-semibold tracking-wider text-[#94a3b8] uppercase flex items-center justify-between">
              <span>Account</span>
              <UserCheck className="w-3 h-3 text-[#cda052]" />
            </div>

            <div className="space-y-1">
              <Link
                href="/profile"
                onClick={handleLinkClick}
                title="Profile & Brand Settings"
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                  pathname === '/profile'
                    ? 'bg-[rgba(205,160,82,0.18)] text-[#e6c875] font-semibold'
                    : 'text-[#cbd5e1] hover:text-white hover:bg-[#141724]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Settings className="w-4 h-4 text-[#cda052]" />
                  <span className="truncate">Profile & Brand Settings</span>
                </div>
              </Link>

              <div className="pt-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] text-black flex items-center justify-center text-xs font-bold shadow-glow flex-shrink-0">
                    {user?.name?.[0]?.toUpperCase() || 'R'}
                  </div>
                  <div className="truncate text-left">
                    <span className="text-xs text-[#f1f5f9] truncate font-semibold block">
                      {user?.name || 'Rivlet Admin'}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] block -mt-0.5 truncate">
                      {user?.email || 'admin@therivlet.com'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-[#94a3b8] hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/30 transition-colors flex-shrink-0 cursor-pointer"
                  title="Sign Out of Rivlet console"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 relative group">
            <Link
              href="/profile"
              onClick={handleLinkClick}
              title="Profile & Brand Settings"
              className="p-2 rounded-xl hover:bg-white/[0.04] text-[#cbd5e1] hover:text-[#cda052] transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              onClick={() => signOut()}
              className="p-2 rounded-xl text-[#94a3b8] hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Account Tooltip when collapsed */}
            <div className="absolute left-full ml-3 bottom-0 p-2.5 bg-[#0d101a] border border-[#22293e] rounded-xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[70]">
              <div className="font-semibold text-white">{user?.name || 'Rivlet Admin'}</div>
              <div className="text-[10px] text-[#94a3b8]">{user?.email || 'admin@therivlet.com'}</div>
              <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center justify-between gap-4">
                <Link href="/profile" className="text-[11px] text-[#cda052] hover:underline">Settings</Link>
                <button onClick={() => signOut()} className="text-[11px] text-rose-400 hover:underline">Sign Out</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Respects isCollapsed state, elevated z-index) */}
      <div className="hidden lg:flex flex-shrink-0 h-full relative z-40">
        {renderNavContent(isCollapsed)}
      </div>

      {/* Mobile Backdrop & Drawer (Always expanded for usability, z-[100]) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden animate-fade-in flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          {/* Sliding Drawer */}
          <div className="relative z-10 animate-fade-in">
            {renderNavContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
