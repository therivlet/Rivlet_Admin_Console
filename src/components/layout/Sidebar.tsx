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
import { useTheme } from '@/lib/themeContext';
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
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
      className={`relative flex flex-col h-full bg-[#241812] dark:bg-[#0a0c12]/95 backdrop-blur-xl select-none z-40 transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] shadow-[6px_0_30px_rgba(0,0,0,0.45)] border-r border-[#3d2b20] dark:border-[#1a2233] ${
        collapsed ? 'w-[68px]' : 'w-72 lg:w-64'
      }`}
    >
      {/* Modern Edge Seam Collapse / Expand Toggle Arrow - Soft muted/duller tone in light mode */}
      <button
        type="button"
        onClick={toggleCollapsed}
        title={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        className="hidden lg:flex absolute -right-3 top-[290px] z-[80] w-6 h-6 rounded-full bg-[#ede7dd] dark:bg-[#182030] hover:bg-[#e4dcce] dark:hover:bg-[#222d42] border border-[#d2c7b5] dark:border-[#2e3b52] hover:border-[#cda052] text-[#8a7b6e] dark:text-[#94a3b8] hover:text-[#cda052] shadow-sm items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer group"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
        )}
      </button>

      {/* Brand Header: Expanded shows combined logo+wordmark; Collapsed shows wave logo centered without offset */}
      <div className={`flex items-center ${collapsed ? 'h-14 justify-center w-full px-0' : 'h-14 px-4 justify-between min-h-[56px]'}`}>
        {!collapsed ? (
          <Link
            href="/"
            onClick={handleLinkClick}
            className="brand-logo-link flex items-center group py-0.5 outline-none transition-opacity hover:opacity-90"
          >
            <RivletLogo variant={isLight ? 'white-gold' : 'gold'} size="md" className="h-7 w-auto drop-shadow-sm" />
          </Link>
        ) : (
          <Link
            href="/"
            onClick={handleLinkClick}
            className="brand-logo-link flex items-center justify-center p-0.5 mx-auto group outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-[#34241b] dark:bg-gradient-to-br dark:from-[#1b2234] dark:to-[#0e121b] border border-[#543b2c] dark:border-[#2b3852] flex items-center justify-center shadow-md group-hover:border-[#cda052]/60 transition-colors">
              <RivletWaveIcon
                variant={isLight ? 'white-gold' : 'gold'}
                size={20}
                className="group-hover:scale-110 transition-transform drop-shadow-[0_0_6px_rgba(205,160,82,0.45)]"
              />
            </div>
          </Link>
        )}

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            title="Close navigation drawer"
            aria-label="Close navigation drawer"
            className="lg:hidden p-1.5 rounded-lg text-[#b3a496] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation Scroll Area - Zero scroller, clean fixed icon set */}
      <div className={`flex-1 overflow-hidden px-2 py-1 flex flex-col justify-start ${collapsed ? 'items-center space-y-1' : 'space-y-1.5 overflow-y-auto scrollbar-thin'}`}>
        {/* 1. HOME BUTTON */}
        <div className="relative group w-full">
          <Link
            href="/"
            onClick={handleLinkClick}
            className={`flex items-center text-xs transition-all duration-200 border ${
              collapsed 
                ? 'w-9 h-9 rounded-xl justify-center mx-auto' 
                : 'gap-3 px-3 py-2 rounded-xl'
            } ${
              pathname === '/'
                ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold shadow-sm border-[#cda052]/60'
                : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Home className={`${collapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'} flex-shrink-0 ${pathname === '/' ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover:text-white'}`} />
            {!collapsed && <span className="animate-fade-in">Home</span>}
          </Link>

          {/* Hover Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
              Home
            </div>
          )}
        </div>

        {/* 2. WORK TRACKING (Always expanded, clean header without submenu text) */}
        <div className="w-full">
          {!collapsed ? (
            <div className="px-2 mt-1.5 mb-1 flex items-center justify-between text-[10px] font-semibold tracking-wider text-[#a89487] dark:text-[#94a3b8] uppercase">
              <span className="flex items-center gap-1.5">
                <ListTree className="w-3.5 h-3.5 text-[#cda052]" />
                Work Tracking
              </span>
            </div>
          ) : (
            <div className="w-7 border-t border-[#3d2b20] dark:border-white/[0.08] my-1 mx-auto" />
          )}

          {/* Submenu Items visible outside with clear indented structure */}
          <div className={collapsed ? 'space-y-1' : 'ml-2 pl-2 border-l-2 border-[#3d2b20] dark:border-[#1c2336] space-y-1 my-0.5'}>
            {workSubmenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkTab === item.tab;
              return (
                <div key={item.href} className="relative group w-full">
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center text-xs transition-all duration-200 border ${
                      collapsed 
                        ? 'w-9 h-9 rounded-xl justify-center mx-auto' 
                        : 'gap-2 px-2.5 py-1.5 rounded-lg'
                    } ${
                      isActive
                        ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                        : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    <Icon className={`${collapsed ? 'w-[18px] h-[18px]' : 'w-3.5 h-3.5'} flex-shrink-0 ${isActive ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover:text-white'}`} />
                    {!collapsed && <span className="truncate animate-fade-in">{item.label}</span>}
                  </Link>

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                      <span className="text-[#a99a8b] dark:text-[#8895ad] text-[10px] block font-normal">Work Tracking</span>
                      <span className="font-semibold text-[#f7d88c] dark:text-[#e6c875]">{item.label}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. BUSINESS & OPERATIONS MODULES */}
        <div className={`w-full ${collapsed ? 'space-y-1' : 'space-y-1'}`}>
          {!collapsed ? (
            <div className="px-2 mt-1.5 mb-1 text-[10px] font-semibold tracking-wider text-[#a89487] dark:text-[#94a3b8] uppercase">
              Operations & Planning
            </div>
          ) : (
            <div className="w-7 border-t border-[#3d2b20] dark:border-white/[0.08] my-1 mx-auto" />
          )}

          {/* Business Calculations (Single direct link when collapsed; expandable when opened) */}
          <div className="relative group w-full">
            {collapsed ? (
              <Link
                href="/calculator"
                onClick={handleLinkClick}
                className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all duration-200 border ${
                  isCalcPath
                    ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                    : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <Calculator className={`w-[18px] h-[18px] flex-shrink-0 ${isCalcPath ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover:text-white'}`} />
              </Link>
            ) : (
              <div
                className={`nav-expandable-row group/row flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 border cursor-pointer ${
                  isCalcPath
                    ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                    : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1]'
                }`}
              >
                <Link
                  href="/calculator"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 flex-1 truncate py-0.5 outline-none"
                >
                  <Calculator className={`w-4 h-4 flex-shrink-0 ${isCalcPath ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/row:text-[#f7d88c]'}`} />
                  <span className="truncate group-hover/row:text-white">Business Calculations</span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCalculatorExpanded((v) => !v);
                  }}
                  className="p-1 rounded text-[#a99a8b] hover:text-[#cda052] transition-colors flex-shrink-0 cursor-pointer outline-none"
                  aria-label="Toggle calculation sub-modules"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${calculatorExpanded ? '' : '-rotate-90'}`} />
                </button>
              </div>
            )}

            {/* Submodules in expanded view */}
            {!collapsed && calculatorExpanded && (
              <div className="ml-4 pl-2.5 py-1 space-y-0.5 border-l border-[#3d2b20] dark:border-[#1f2638] text-[11px] animate-fade-in">
                <Link
                  href="/calculator?tab=overview"
                  onClick={handleLinkClick}
                  className={`nav-sub-link block px-2.5 py-1 rounded-md transition-colors ${
                    isOverviewActive
                      ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.14)]'
                      : 'text-[#d7cbbe] dark:text-[#94a3b8]'
                  }`}
                >
                  • Overview Dashboard
                </Link>
                <Link
                  href="/calculator?tab=studio"
                  onClick={handleLinkClick}
                  className={`nav-sub-link block px-2.5 py-1 rounded-md transition-colors ${
                    isStudioActive
                      ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.14)]'
                      : 'text-[#d7cbbe] dark:text-[#94a3b8]'
                  }`}
                >
                  • Pricing & Unit Economy
                </Link>
                <Link
                  href="/calculator?tab=styles"
                  onClick={handleLinkClick}
                  className={`nav-sub-link block px-2.5 py-1 rounded-md transition-colors ${
                    isStylesActive
                      ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.14)]'
                      : 'text-[#d7cbbe] dark:text-[#94a3b8]'
                  }`}
                >
                  • Active Styles
                </Link>
                <Link
                  href="/calculator?tab=guide"
                  onClick={handleLinkClick}
                  className={`nav-sub-link block px-2.5 py-1 rounded-md transition-colors ${
                    isGuideActive
                      ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.14)]'
                      : 'text-[#d7cbbe] dark:text-[#94a3b8]'
                  }`}
                >
                  • Calculation Guide
                </Link>
              </div>
            )}

            {/* Hover Floating Dropdown Flyout when collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-3 top-0 p-3 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-2xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-[90] min-w-[210px]">
                <div className="flex items-center gap-2 font-bold text-[#f7d88c] dark:text-[#e6c875] pb-2 mb-2 border-b border-white/[0.08]">
                  <Calculator className="w-4 h-4 text-[#cda052]" />
                  <span>Business Calculations</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <Link
                    href="/calculator?tab=overview"
                    onClick={handleLinkClick}
                    className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                      isOverviewActive
                        ? 'bg-[rgba(205,160,82,0.22)] text-[#f7d88c] font-semibold'
                        : 'text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    • Overview Dashboard
                  </Link>
                  <Link
                    href="/calculator?tab=studio"
                    onClick={handleLinkClick}
                    className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                      isStudioActive
                        ? 'bg-[rgba(205,160,82,0.22)] text-[#f7d88c] font-semibold'
                        : 'text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    • Pricing & Unit Economy
                  </Link>
                  <Link
                    href="/calculator?tab=styles"
                    onClick={handleLinkClick}
                    className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                      isStylesActive
                        ? 'bg-[rgba(205,160,82,0.22)] text-[#f7d88c] font-semibold'
                        : 'text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    • Active Styles
                  </Link>
                  <Link
                    href="/calculator?tab=guide"
                    onClick={handleLinkClick}
                    className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                      isGuideActive
                        ? 'bg-[rgba(205,160,82,0.22)] text-[#f7d88c] font-semibold'
                        : 'text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                    }`}
                  >
                    • Calculation Guide
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Vendors */}
          <div className="relative group w-full">
            <Link
              href="/vendors"
              onClick={handleLinkClick}
              className={`flex items-center text-xs transition-all duration-200 border ${
                collapsed 
                  ? 'w-9 h-9 rounded-xl justify-center mx-auto' 
                  : 'gap-3 px-3 py-2 rounded-xl'
              } ${
                pathname === '/vendors'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Factory className={`${collapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'} flex-shrink-0 ${pathname === '/vendors' ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover:text-white'}`} />
              {!collapsed && <span className="animate-fade-in">Vendors</span>}
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                Vendors
              </div>
            )}
          </div>

          {/* Pipeline */}
          <div className="relative group w-full">
            <Link
              href="/pipeline"
              onClick={handleLinkClick}
              className={`flex items-center text-xs transition-all duration-200 border ${
                collapsed 
                  ? 'w-9 h-9 rounded-xl justify-center mx-auto' 
                  : 'gap-3 px-3 py-2 rounded-xl'
              } ${
                pathname === '/pipeline'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <GitBranch className={`${collapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'} flex-shrink-0 ${pathname === '/pipeline' ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover:text-white'}`} />
              {!collapsed && <span className="animate-fade-in">Pipeline</span>}
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                Pipeline
              </div>
            )}
          </div>

          {/* Budget Tracker */}
          <div className="relative group w-full">
            <Link
              href="/budget"
              onClick={handleLinkClick}
              className={`flex items-center text-xs transition-all duration-200 border ${
                collapsed 
                  ? 'w-9 h-9 rounded-xl justify-center mx-auto' 
                  : 'gap-3 px-3 py-2 rounded-xl'
              } ${
                pathname === '/budget'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              <Wallet className={`${collapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'} flex-shrink-0 ${pathname === '/budget' ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover:text-white'}`} />
              {!collapsed && <span className="animate-fade-in">Budget Tracker</span>}
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                Budget Tracker
              </div>
            )}
          </div>
        </div>

        {/* 4. CONSOLIDATED DOCUMENTATION & VAULT MENU */}
        <div className="space-y-1 w-full">
          {!collapsed ? (
            <div className="px-2 mt-1.5 mb-1 text-[10px] font-semibold tracking-wider text-[#a89487] dark:text-[#94a3b8] uppercase">
              Knowledge & Assets
            </div>
          ) : (
            <div className="w-7 border-t border-[#3d2b20] dark:border-white/[0.08] my-1 mx-auto" />
          )}

          {!collapsed ? (
            <div className="relative group w-full">
              <div
                className={`nav-expandable-row group/row flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-200 border cursor-pointer ${
                  isDocsActive
                    ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                    : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1]'
                }`}
              >
                <Link
                  href="/documents"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 flex-1 truncate py-0.5 outline-none"
                >
                  <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isDocsActive ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/row:text-[#f7d88c]'}`} />
                  <span className="truncate group-hover/row:text-white">Documentation & Vault</span>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDocsExpanded((v) => !v);
                  }}
                  className="p-1 rounded text-[#a99a8b] hover:text-[#cda052] transition-colors flex-shrink-0 cursor-pointer outline-none"
                  aria-label="Toggle documentation sub-items"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${docsExpanded ? '' : '-rotate-90'}`} />
                </button>
              </div>

              {/* Subnavigations when expanded */}
              {docsExpanded && (
                <div className="ml-4 pl-2.5 py-1 space-y-0.5 border-l border-[#3d2b20] dark:border-[#1f2638] text-[11px] animate-fade-in">
                  {docsSubmenuItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={handleLinkClick}
                        className={`nav-sub-link flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                          isSubActive
                            ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.14)]'
                            : 'text-[#d7cbbe] dark:text-[#94a3b8]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? 'text-[#cda052]' : 'text-[#a99a8b]'}`} />
                          <span className="truncate">{sub.label}</span>
                        </div>
                        {sub.badge !== undefined && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/40 text-[#f7d88c] border border-white/10 font-mono">
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
                  <div key={sub.href} className="relative group w-full">
                    <Link
                      href={sub.href}
                      onClick={handleLinkClick}
                      className={`flex items-center justify-center transition-all duration-200 border ${
                        collapsed 
                          ? 'w-9 h-9 rounded-xl mx-auto' 
                          : 'px-3 py-2 rounded-xl text-xs'
                      } ${
                        isSubActive
                          ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                          : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      <SubIcon className={`${collapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'} flex-shrink-0 ${isSubActive ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover:text-white'}`} />
                    </Link>

                    {/* Floating Dropdown / Tooltip when hovering any of the 3 docs icons */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 p-3 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-2xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-[90] min-w-[210px]">
                      <div className="flex items-center gap-2 font-bold text-[#f7d88c] dark:text-[#e6c875] pb-2 mb-2 border-b border-white/[0.08]">
                        <FolderOpen className="w-4 h-4 text-[#cda052]" />
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
                                  ? 'bg-[rgba(205,160,82,0.22)] text-[#f7d88c] font-semibold'
                                  : 'text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.06]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <ItemIcon className={`w-3.5 h-3.5 ${isItemActive ? 'text-[#cda052]' : 'text-[#a99a8b]'}`} />
                                <span>{item.label}</span>
                              </div>
                              {item.badge !== undefined && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-[#f7d88c] font-mono border border-white/10">
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
      <div className={`p-2 bg-black/25 dark:bg-[#07080d]/80 text-[11px] border-t border-[#3d2b20] dark:border-[#1a2233] ${collapsed ? 'text-center' : ''}`}>
        {!collapsed ? (
          <div>
            <div className="px-2 mb-1 text-[10px] font-semibold tracking-wider text-[#a89487] dark:text-[#94a3b8] uppercase flex items-center justify-between">
              <span>Account</span>
              <UserCheck className="w-3 h-3 text-[#cda052]" />
            </div>

            <div className="space-y-1">
              <Link
                href="/profile"
                onClick={handleLinkClick}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                  pathname === '/profile'
                    ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold'
                    : 'text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Settings className="w-4 h-4 text-[#cda052]" />
                  <span className="truncate">Profile & Brand Settings</span>
                </div>
              </Link>

              <div className="pt-1.5 flex items-center justify-between px-1">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] text-black flex items-center justify-center text-xs font-bold shadow-glow flex-shrink-0">
                    {user?.name?.[0]?.toUpperCase() || 'R'}
                  </div>
                  <div className="truncate text-left">
                    <span className="text-xs text-[#f1f5f9] truncate font-semibold block">
                      {user?.name || 'Rivlet Admin'}
                    </span>
                    <span className="text-[10px] text-[#a89487] dark:text-[#94a3b8] block -mt-0.5 truncate">
                      {user?.email || 'admin@therivlet.com'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-[#a89487] dark:text-[#94a3b8] hover:text-rose-400 p-1 rounded-lg hover:bg-rose-950/30 transition-colors flex-shrink-0 cursor-pointer"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 relative group w-full">
            <Link
              href="/profile"
              onClick={handleLinkClick}
              className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto transition-all duration-200 border ${
                pathname === '/profile'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] border-[#cda052]/60'
                  : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-[#cda052] hover:bg-white/[0.08]'
              }`}
            >
              <Settings className="w-[18px] h-[18px]" />
            </Link>

            <button
              onClick={() => signOut()}
              className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto text-[#a89487] dark:text-[#94a3b8] hover:text-rose-400 hover:bg-rose-950/30 border border-transparent transition-all duration-200 cursor-pointer"
              aria-label="Sign Out"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>

            {/* Account Tooltip when collapsed */}
            <div className="absolute left-full ml-3 bottom-0 p-2.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
              <div className="font-semibold text-white">{user?.name || 'Rivlet Admin'}</div>
              <div className="text-[10px] text-[#a99a8b] dark:text-[#94a3b8]">{user?.email || 'admin@therivlet.com'}</div>
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
