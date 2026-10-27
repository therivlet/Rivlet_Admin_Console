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
  Calendar as CalendarIcon,
  Scale,
  ShieldCheck,
  FileCheck2,
  BadgePercent,
  Ship,
  KeyRound,
  Sparkles,
  Users,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  UserCheck,
  X,
  Lock,
  FileSearch
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { ROLE_LABELS } from '@/lib/permissions';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ 
  mobileOpen = false, 
  onCloseMobile,
  isCollapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeWorkTab = pathname === '/work' ? (searchParams.get('tab') || 'backlog') : null;
  const { artifacts } = useAdminStore();
  const { user, signOut, canView } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Collapsible sidebar state for desktop
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapsed = externalToggleCollapse || (() => {
    setInternalCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rivlet_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  });

  const [calculatorExpanded, setCalculatorExpanded] = useState(pathname.startsWith('/calculator'));
  const [complianceExpanded, setComplianceExpanded] = useState(pathname.startsWith('/compliance'));
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-trigger="true"]')) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname]);

  // Load collapsed preference from localStorage if not controlled externally
  useEffect(() => {
    if (externalCollapsed === undefined) {
      try {
        const saved = localStorage.getItem('rivlet_sidebar_collapsed');
        if (saved !== null) {
          setInternalCollapsed(saved === 'true');
        }
      } catch {
        // ignore SSR or storage exceptions
      }
    }
  }, [externalCollapsed]);

  const isCalcPath = pathname === '/calculator';
  const calcTab = searchParams.get('tab');
  const calcAction = searchParams.get('action');

  const isOverviewActive = isCalcPath && (calcTab === 'overview' || !calcTab) && calcAction !== 'new';
  const isStudioActive = isCalcPath && calcTab === 'studio' && calcAction !== 'new';
  const isStylesActive = isCalcPath && (calcTab === 'styles' || calcTab === 'saved');
  const isGuideActive = isCalcPath && (calcTab === 'guide' || calcTab === 'help');

  const isCompliancePath = pathname === '/compliance';
  const complianceTab = searchParams.get('tab') || 'workflows';

  const isDocsActive = pathname === '/documents' || pathname === '/knowledge-base' || pathname === '/artifacts';

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const workSubmenuItems = [
    { label: 'Backlogs', href: '/work?tab=backlog', tab: 'backlog', icon: ListTree },
    { label: 'Sprint Board', href: '/work?tab=board', tab: 'board', icon: KanbanSquare },
    { label: 'Sprints', href: '/work?tab=sprints', tab: 'sprints', icon: CalendarRange },
  ];

  const complianceSubmenuItems = [
    { label: 'Overview & Workflows', href: '/compliance?tab=workflows', tab: 'workflows', icon: FileCheck2 },
    { label: 'GST Engine & ITC', href: '/compliance?tab=gst', tab: 'gst', icon: BadgePercent },
    { label: 'IEC & ICEGATE Customs', href: '/compliance?tab=icegate', tab: 'icegate', icon: Ship },
    { label: 'ITR & Direct Tax', href: '/compliance?tab=itr', tab: 'itr', icon: FileText },
    { label: 'DSC Token Registry', href: '/compliance?tab=dsc', tab: 'dsc', icon: ShieldCheck },
    { label: 'Secure Credential Vault', href: '/compliance?tab=vault', tab: 'vault', icon: KeyRound },
  ];

  const docsSubmenuItems = [
    canView('documents') ? { label: 'Document Vault', href: '/documents', icon: FileText } : null,
    canView('knowledge') ? { label: 'Confidential Brand KB', href: '/knowledge-base', icon: BookOpen } : null,
    canView('artifacts') ? { label: 'Artifact Hub Review', href: '/artifacts', icon: Layers, badge: artifacts.length } : null,
  ].filter(Boolean) as { label: string; href: string; icon: any; badge?: number }[];

  const renderNavContent = (collapsed: boolean) => (
    <aside
      className={`relative flex flex-col h-full bg-[#0b0f19] select-none z-30 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[6px_0_30px_rgba(0,0,0,0.45)] border-r border-[#1e2638] overflow-visible ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Modern Edge Seam Collapse / Expand Toggle Arrow - Fully visible on dividing line, never clipped */}
      <button
        type="button"
        onClick={toggleCollapsed}
        title={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-[80] w-6 h-6 rounded-full bg-[#0e121b] hover:bg-[#182030] border border-[#1e2638] hover:border-[#cda052] text-[#cbd5e1] hover:text-[#cda052] shadow-[0_2px_10px_rgba(0,0,0,0.35)] items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
      >
        <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      {/* Mobile Drawer Header with Close Button */}
      {onCloseMobile && (
        <div className="lg:hidden h-12 flex items-center justify-between px-3.5 border-b border-[#1e2638]">
          <span className="text-xs font-semibold text-slate-400 dark:text-[#94a3b8] uppercase tracking-wider">Navigation</span>
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="p-1 rounded text-[#b3a496] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Navigation Scroll Area - Adaptive zero-scroller flex column */}
      <div className="flex-1 min-h-0 sidebar-nav-container px-2 py-2 flex flex-col justify-start space-y-0.5 sm:space-y-1">
        {/* 1. HOME BUTTON */}
        <div className="relative group w-full">
          <Link
            href="/"
            onClick={handleLinkClick}
            className={`sidebar-nav-item group/link flex items-center rounded-xl text-xs transition-colors duration-200 border flex-shrink ${
              pathname === '/'
                ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold shadow-sm border-[#cda052]/60'
                : 'border-transparent text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
            } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
          >
            <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
              <Home className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/' ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/link:text-white'}`} />
            </div>
            <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
            }`}>
              Home
            </span>
          </Link>

          {/* Hover Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0e121b] border border-[#1e2638] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
              Home
            </div>
          )}
        </div>

        {/* 2. WORK TRACKING */}
        <div className="w-full">
          <div className="sidebar-nav-section h-6 flex items-center px-1 my-0.5 overflow-hidden relative flex-shrink-0">
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[180px] opacity-100 translate-x-0 text-slate-400 dark:text-[#94a3b8]'
            }`}>
              <ListTree className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0" />
              <span>Work Tracking</span>
            </div>
            <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full ${
              collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="w-7 border-t border-[#1e2638] dark:border-white/[0.08] mx-auto" />
            </div>
          </div>

          <div className="space-y-0.5 sm:space-y-1">
            {workSubmenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkTab === item.tab;
              return (
                <div key={item.href} className="relative group w-full">
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`sidebar-nav-item group/link flex items-center rounded-xl text-xs transition-colors duration-200 border flex-shrink ${
                      isActive
                        ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                        : 'border-transparent text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                    } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
                  >
                    <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover/link:scale-110 ${isActive ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/link:text-white'}`} />
                    </div>
                    <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
                    }`}>
                      {item.label}
                    </span>
                  </Link>

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0e121b] border border-[#1e2638] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                      <span className="text-slate-400 dark:text-[#8895ad] text-[10px] block font-normal">Work Tracking</span>
                      <span className="font-semibold text-[#f7d88c] dark:text-[#e6c875]">{item.label}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. BUSINESS & OPERATIONS MODULES */}
        <div className="w-full space-y-0.5 sm:space-y-1">
          <div className="sidebar-nav-section h-6 flex items-center px-1 my-0.5 overflow-hidden relative flex-shrink-0">
            <span className={`text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[180px] opacity-100 translate-x-0 text-slate-400 dark:text-[#94a3b8]'
            }`}>
              Operations & Planning
            </span>
            <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full ${
              collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="w-7 border-t border-[#1e2638] dark:border-white/[0.08] mx-auto" />
            </div>
          </div>

          {/* Operations & Compliance Calendar */}
          {canView('calendar') && (
            <div className="relative group w-full">
              <Link
                href="/calendar"
                onClick={handleLinkClick}
                className={`sidebar-nav-item group/link flex items-center rounded-xl text-xs transition-colors duration-200 border flex-shrink ${
                  pathname === '/calendar'
                    ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                    : 'border-transparent text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
              >
                <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                  <CalendarIcon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/calendar' ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/link:text-white'}`} />
                </div>
                <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
                }`}>
                  Calendar
                </span>
              </Link>
              {collapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0e121b] border border-[#1e2638] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                  Calendar
                </div>
              )}
            </div>
          )}

          {/* Statutory Compliance & Customs Hub */}
          {canView('compliance') && (
            <div className="relative group w-full">
              <div
                className={`sidebar-nav-item nav-expandable-row group/row flex items-center rounded-xl text-xs transition-colors duration-200 border cursor-pointer flex-shrink ${
                  isCompliancePath
                    ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                    : 'border-transparent text-slate-400 dark:text-[#cbd5e1]'
                } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-between'}`}
              >
                <Link
                  href="/compliance"
                  onClick={handleLinkClick}
                  className={`flex items-center h-full min-w-0 outline-none ${collapsed ? 'w-full justify-center' : 'flex-1'}`}
                >
                  <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                    <Scale className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/row:scale-110 ${isCompliancePath ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/row:text-[#f7d88c]'}`} />
                  </div>
                  <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[140px] opacity-100 translate-x-0 ml-1.5 group-hover/row:text-white'
                  }`}>
                    Compliance
                  </span>
                </Link>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setComplianceExpanded((v) => !v);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-[#cda052] transition-all flex-shrink-0 cursor-pointer outline-none mr-0.5"
                    aria-label="Toggle compliance sub-modules"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${complianceExpanded ? '' : '-rotate-90'}`} />
                  </button>
                )}
              </div>

              {/* Submodules in expanded view */}
              {!collapsed && complianceExpanded && (
                <div className="ml-4 pl-2.5 py-1 space-y-0.5 border-l border-[#1e2638] text-[11px] animate-fade-in">
                  {complianceSubmenuItems.map((item) => {
                    const isSubActive = isCompliancePath && complianceTab === item.tab;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`nav-sub-link block px-2.5 py-1 rounded-md transition-colors ${
                          isSubActive
                            ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.14)]'
                            : 'text-slate-400 dark:text-[#94a3b8] hover:text-white'
                        }`}
                      >
                        • {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Hover Floating Dropdown Flyout when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 top-0 p-3 bg-[#0e121b] border border-[#1e2638] rounded-2xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-[90] min-w-[210px]">
                  <div className="flex items-center gap-2 font-bold text-[#f7d88c] dark:text-[#e6c875] pb-2 mb-2 border-b border-white/[0.08]">
                    <Scale className="w-4 h-4 text-[#cda052]" />
                    <span>Statutory Compliance</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    {complianceSubmenuItems.map((item) => {
                      const isSubActive = isCompliancePath && complianceTab === item.tab;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleLinkClick}
                          className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                            isSubActive
                              ? 'bg-[rgba(205,160,82,0.22)] text-[#f7d88c] font-semibold'
                              : 'text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                          }`}
                        >
                          • {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Business Calculations */}
          <div className="relative group w-full">
            <div
              className={`sidebar-nav-item nav-expandable-row group/row flex items-center rounded-xl text-xs transition-colors duration-200 border cursor-pointer flex-shrink ${
                isCalcPath
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-slate-400 dark:text-[#cbd5e1]'
              } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-between'}`}
            >
              <Link
                href="/calculator"
                onClick={handleLinkClick}
                className={`flex items-center h-full min-w-0 outline-none ${collapsed ? 'w-full justify-center' : 'flex-1'}`}
              >
                <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                  <Calculator className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/row:scale-110 ${isCalcPath ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/row:text-[#f7d88c]'}`} />
                </div>
                <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[140px] opacity-100 translate-x-0 ml-1.5 group-hover/row:text-white'
                }`}>
                  Business Calculations
                </span>
              </Link>
              {!collapsed && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCalculatorExpanded((v) => !v);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-[#cda052] transition-all flex-shrink-0 cursor-pointer outline-none mr-0.5"
                  aria-label="Toggle calculation sub-modules"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${calculatorExpanded ? '' : '-rotate-90'}`} />
                </button>
              )}
            </div>

            {/* Submodules in expanded view */}
            {!collapsed && calculatorExpanded && (
              <div className="ml-4 pl-2.5 py-1 space-y-0.5 border-l border-[#1e2638] text-[11px] animate-fade-in">
                <Link
                  href="/calculator?tab=overview"
                  onClick={handleLinkClick}
                  className={`nav-sub-link block px-2.5 py-1 rounded-md transition-colors ${
                    isOverviewActive
                      ? 'text-[#cda052] font-semibold bg-[rgba(205,160,82,0.14)]'
                      : 'text-slate-400 dark:text-[#94a3b8] hover:text-white'
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
                      : 'text-slate-400 dark:text-[#94a3b8] hover:text-white'
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
                      : 'text-slate-400 dark:text-[#94a3b8] hover:text-white'
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
                      : 'text-slate-400 dark:text-[#94a3b8] hover:text-white'
                  }`}
                >
                  • Calculation Guide
                </Link>
              </div>
            )}

            {/* Hover Floating Dropdown Flyout when collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-3 top-0 p-3 bg-[#0e121b] border border-[#1e2638] rounded-2xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-[90] min-w-[210px]">
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
                        : 'text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
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
                        : 'text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
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
                        : 'text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
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
                        : 'text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
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
              className={`sidebar-nav-item group/link flex items-center rounded-xl text-xs transition-colors duration-200 border flex-shrink ${
                pathname === '/vendors'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
              } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
            >
              <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                <Factory className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/vendors' ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/link:text-white'}`} />
              </div>
              <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
              }`}>
                Vendors
              </span>
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0e121b] border border-[#1e2638] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                Vendors
              </div>
            )}
          </div>

          {/* Pipeline */}
          <div className="relative group w-full">
            <Link
              href="/pipeline"
              onClick={handleLinkClick}
              className={`sidebar-nav-item group/link flex items-center rounded-xl text-xs transition-colors duration-200 border flex-shrink ${
                pathname === '/pipeline'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
              } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
            >
              <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                <GitBranch className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/pipeline' ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/link:text-white'}`} />
              </div>
              <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
              }`}>
                Pipeline
              </span>
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0e121b] border border-[#1e2638] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                Pipeline
              </div>
            )}
          </div>

          {/* Budget Tracker */}
          <div className="relative group w-full">
            <Link
              href="/budget"
              onClick={handleLinkClick}
              className={`sidebar-nav-item group/link flex items-center rounded-xl text-xs transition-colors duration-200 border flex-shrink ${
                pathname === '/budget'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
              } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
            >
              <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                <Wallet className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/budget' ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/link:text-white'}`} />
              </div>
              <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
              }`}>
                Budget Tracker
              </span>
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0e121b] border border-[#1e2638] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                Budget Tracker
              </div>
            )}
          </div>
        </div>

        {/* 4. KNOWLEDGE & ASSETS DIRECT MODULES */}
        <div className="w-full space-y-0.5 sm:space-y-1">
          <div className="sidebar-nav-section h-6 flex items-center px-1 my-0.5 overflow-hidden relative flex-shrink-0">
            <span className={`text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[180px] opacity-100 translate-x-0 text-slate-400 dark:text-[#94a3b8]'
            }`}>
              Knowledge & Assets
            </span>
            <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full ${
              collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="w-7 border-t border-[#1e2638] dark:border-white/[0.08] mx-auto" />
            </div>
          </div>

          {docsSubmenuItems.map((item) => {
            const ItemIcon = item.icon;
            const isItemActive = pathname === item.href;
            return (
              <div key={item.href} className="relative group w-full">
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`sidebar-nav-item group/link flex items-center rounded-xl text-xs transition-colors duration-200 border flex-shrink ${
                    isItemActive
                      ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                      : 'border-transparent text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                  } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
                >
                  <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                    <ItemIcon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${isItemActive ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/link:text-white'}`} />
                  </div>
                  <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[145px] opacity-100 translate-x-0 ml-1.5 flex-1 truncate'
                  }`}>
                    {item.label}
                  </span>
                  {!collapsed && item.badge !== undefined && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-black/40 text-[#f7d88c] border border-white/10 font-mono flex-shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0e121b] border border-[#1e2638] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                    <span className="text-slate-400 dark:text-[#8895ad] text-[10px] block font-normal">Knowledge & Assets</span>
                    <span className="font-semibold text-[#f7d88c] dark:text-[#e6c875] flex items-center gap-1.5">
                      {item.label}
                      {item.badge !== undefined && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/40 text-[#cda052] font-mono border border-white/10">
                          {item.badge}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {/* GOVERNANCE & SECURITY MODULES */}
          {(canView('access') || canView('audit')) && (
            <div className="w-full space-y-0.5 sm:space-y-1">
              <div className="sidebar-nav-section h-6 flex items-center px-1 my-0.5 overflow-hidden relative flex-shrink-0">
                <span className={`text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[180px] opacity-100 translate-x-0 text-slate-400 dark:text-[#94a3b8]'
                }`}>
                  Governance & Security
                </span>
                <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full ${
                  collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}>
                  <div className="w-7 border-t border-[#1e2638] dark:border-white/[0.08] mx-auto" />
                </div>
              </div>

              {canView('access') && (
                <div className="relative group w-full">
                  <Link
                    href="/access"
                    onClick={handleLinkClick}
                    className={`sidebar-nav-item group/link flex items-center rounded-xl text-xs transition-colors duration-200 border flex-shrink ${
                      pathname === '/access'
                        ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                        : 'border-transparent text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                    } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
                  >
                    <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                      <Lock className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/access' ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/link:text-white'}`} />
                    </div>
                    <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
                    }`}>
                      Access Management
                    </span>
                  </Link>
                  {collapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0e121b] border border-[#1e2638] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                      Access Management
                    </div>
                  )}
                </div>
              )}

              {canView('audit') && (
                <div className="relative group w-full">
                  <Link
                    href="/audit"
                    onClick={handleLinkClick}
                    className={`sidebar-nav-item group/link flex items-center rounded-xl text-xs transition-colors duration-200 border flex-shrink ${
                      pathname === '/audit'
                        ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                        : 'border-transparent text-slate-400 dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                    } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
                  >
                    <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                      <FileSearch className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/audit' ? 'text-[#cda052]' : 'text-slate-400 dark:text-[#8895ad] group-hover/link:text-white'}`} />
                    </div>
                    <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
                    }`}>
                      Audit Log
                    </span>
                  </Link>
                  {collapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0e121b] border border-[#1e2638] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                      Audit Log
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. ACCOUNTS & USER FOOTER (Pinned bottom, always accessible) */}
      <div className="p-2 bg-[#07080d]/95 text-[11px] border-t border-[#1e2638] transition-all duration-300 flex-shrink-0 mt-auto relative z-20">
        <div className="px-1 mb-1 flex items-center justify-between overflow-hidden h-4">
          <span className={`text-[10px] font-semibold tracking-wider text-slate-400 dark:text-[#94a3b8] uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[100px] opacity-100'
          }`}>
            Account
          </span>
          <UserCheck className={`w-3 h-3 text-[#cda052] transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`} />
        </div>

        <div className="space-y-1">
          {/* User Profile Card & Popover Trigger */}
          <div data-profile-trigger="true" className="relative group w-full">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-label="Account options"
              aria-expanded={profileMenuOpen}
              className={`flex items-center rounded-xl transition-all duration-200 cursor-pointer ${
                collapsed
                  ? 'w-10 h-10 mx-auto justify-center hover:bg-white/[0.08] active:scale-95'
                  : 'h-10 w-full px-1.5 hover:bg-white/[0.06] text-left'
              }`}
            >
              <div className="flex items-center justify-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] text-black flex items-center justify-center text-xs font-bold shadow-glow">
                  {user?.name?.[0]?.toUpperCase() || 'R'}
                </div>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex-1 min-w-0 ${
                collapsed ? 'max-w-0 opacity-0 pointer-events-none hidden' : 'max-w-[130px] opacity-100 ml-2'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span data-profile-name="true" className="sidebar-user-name text-xs text-white !text-white truncate font-semibold block leading-tight">
                    {user?.name || 'Rivlet Admin'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#cda052] font-semibold leading-tight">
                    {user?.role ? ROLE_LABELS[user.role] : 'Owner'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-[#94a3b8] truncate leading-tight">
                    • {user?.email || 'admin@therivlet.com'}
                  </span>
                </div>
              </div>
            </button>

            {/* Elegant Account Popover with Light/Dark Theme Adaptability */}
            <div
              data-account-popover="true"
              className={`account-popover absolute rounded-2xl p-3.5 text-xs transition-all duration-200 z-[95] border ${
                collapsed ? 'left-full ml-3 bottom-0 w-64' : 'bottom-full mb-2 left-0 w-full min-w-[240px]'
              } ${
                isLight
                  ? 'bg-white border-slate-200 shadow-xl text-slate-900'
                  : 'bg-[#0c1018]/98 dark:bg-[#07090e]/98 border-[#232b3e] dark:border-[#1e2638] shadow-[0_16px_45px_rgba(0,0,0,0.75)] text-[#f1f5f9]'
              } ${
                profileMenuOpen
                  ? 'opacity-100 pointer-events-auto scale-100'
                  : 'opacity-0 pointer-events-none scale-95 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:scale-100'
              }`}
            >
              {/* User info & permission header */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] text-black flex items-center justify-center text-xs font-bold shadow-glow flex-shrink-0 mt-0.5">
                  {user?.name?.[0]?.toUpperCase() || 'R'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-900 dark:text-white text-xs truncate max-w-[120px]">
                      {user?.name || 'Rivlet Admin'}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-[#cda052]/20 dark:bg-[#cda052]/15 text-[#845b1d] dark:text-[#f3db9d] border border-[#cda052]/40 dark:border-[#cda052]/30 leading-none">
                      {user?.role ? ROLE_LABELS[user.role] : 'Owner'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-[#8e9cb5] truncate mt-0.5" title={user?.email || 'admin@therivlet.com'}>
                    {user?.email || 'admin@therivlet.com'}
                  </div>
                </div>
              </div>

              {/* Subtle Divider */}
              <div className="my-2.5 border-t border-slate-200 dark:border-[#1a2133]" />

              {/* Navigation & Sign Out Actions */}
              <div className="space-y-1">
                <Link
                  href="/profile"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLinkClick();
                  }}
                  className="profile-settings-link flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-100 dark:text-[#cbd5e1] dark:hover:text-white dark:hover:bg-white/[0.08] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#a57428] dark:text-[#cda052] flex-shrink-0" />
                  <span>Profile & Brand Settings</span>
                </Link>
                <button
                  type="button"
                  data-signout-btn="true"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    signOut();
                  }}
                  className="sign-out-btn w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 dark:text-rose-500 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-500 flex-shrink-0" />
                  <span className="text-rose-600 dark:text-rose-500 font-semibold !text-rose-600 dark:!text-rose-500">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (Respects isCollapsed state, elevated z-index) */}
      <div className="hidden lg:flex flex-shrink-0 h-full max-h-full relative z-40">
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
          <div className="relative z-10 animate-fade-in h-full h-[100dvh] max-h-screen">
            {renderNavContent(false)}
          </div>
        </div>
      )}
    </>
  );
}
