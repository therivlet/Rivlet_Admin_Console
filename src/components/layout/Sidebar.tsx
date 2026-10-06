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
    canView('documents') ? { label: 'Document Vault', href: '/documents', icon: FileText } : null,
    canView('knowledge') ? { label: 'Confidential Brand KB', href: '/knowledge-base', icon: BookOpen } : null,
    canView('artifacts') ? { label: 'Artifact Hub Review', href: '/artifacts', icon: Layers, badge: artifacts.length } : null,
  ].filter(Boolean) as { label: string; href: string; icon: any; badge?: number }[];

  const renderNavContent = (collapsed: boolean) => (
    <aside
      className={`relative flex flex-col h-full bg-[#241812] dark:bg-[#0a0c12]/95 backdrop-blur-xl select-none z-30 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[6px_0_30px_rgba(0,0,0,0.45)] border-r border-[#3d2b20] dark:border-[#1a2233] overflow-visible ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
    >
      {/* Modern Edge Seam Collapse / Expand Toggle Arrow - Fully visible on dividing line, never clipped */}
      <button
        type="button"
        onClick={toggleCollapsed}
        title={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        aria-label={collapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-[80] w-6 h-6 rounded-full bg-white dark:bg-[#182030] hover:bg-[#faf7f2] dark:hover:bg-[#222d42] border border-[#d8c9b8] dark:border-[#313f57] hover:border-[#cda052] dark:hover:border-[#cda052] text-[#6b5847] dark:text-[#cbd5e1] hover:text-[#cda052] dark:hover:text-[#cda052] shadow-[0_2px_10px_rgba(0,0,0,0.25)] items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
      >
        <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      {/* Mobile Drawer Header with Close Button */}
      {onCloseMobile && (
        <div className="lg:hidden h-12 flex items-center justify-between px-3.5 border-b border-[#3d2b20] dark:border-[#1a2233]">
          <span className="text-xs font-semibold text-[#a89487] dark:text-[#94a3b8] uppercase tracking-wider">Navigation</span>
          <button
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="p-1 rounded text-[#b3a496] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Navigation Scroll Area - Zero scroller, clean fixed icon set starting from Home */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto scrollbar-none px-2 py-3 flex flex-col justify-start space-y-1">
        {/* 1. HOME BUTTON */}
        <div className="relative group w-full">
          <Link
            href="/"
            onClick={handleLinkClick}
            className={`group/link flex items-center rounded-xl text-xs transition-colors duration-200 border ${
              pathname === '/'
                ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold shadow-sm border-[#cda052]/60'
                : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
            } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
          >
            <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
              <Home className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/' ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/link:text-white'}`} />
            </div>
            <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
            }`}>
              Home
            </span>
          </Link>

          {/* Hover Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
              Home
            </div>
          )}
        </div>

        {/* 2. WORK TRACKING */}
        <div className="w-full">
          <div className="h-6 flex items-center px-1 my-0.5 overflow-hidden relative">
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[180px] opacity-100 translate-x-0 text-[#a89487] dark:text-[#94a3b8]'
            }`}>
              <ListTree className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0" />
              <span>Work Tracking</span>
            </div>
            <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full ${
              collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="w-7 border-t border-[#3d2b20] dark:border-white/[0.08] mx-auto" />
            </div>
          </div>

          <div className="space-y-1">
            {workSubmenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeWorkTab === item.tab;
              return (
                <div key={item.href} className="relative group w-full">
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`group/link flex items-center rounded-xl text-xs transition-colors duration-200 border ${
                      isActive
                        ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                        : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                    } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
                  >
                    <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                      <Icon className={`w-3.5 h-3.5 flex-shrink-0 transition-transform group-hover/link:scale-110 ${isActive ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/link:text-white'}`} />
                    </div>
                    <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
                    }`}>
                      {item.label}
                    </span>
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
        <div className="w-full space-y-1">
          <div className="h-6 flex items-center px-1 my-0.5 overflow-hidden relative">
            <span className={`text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[180px] opacity-100 translate-x-0 text-[#a89487] dark:text-[#94a3b8]'
            }`}>
              Operations & Planning
            </span>
            <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full ${
              collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="w-7 border-t border-[#3d2b20] dark:border-white/[0.08] mx-auto" />
            </div>
          </div>

          {/* Business Calculations */}
          <div className="relative group w-full">
            <div
              className={`nav-expandable-row group/row flex items-center rounded-xl text-xs transition-colors duration-200 border cursor-pointer ${
                isCalcPath
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1]'
              } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-between'}`}
            >
              <Link
                href="/calculator"
                onClick={handleLinkClick}
                className={`flex items-center h-full min-w-0 outline-none ${collapsed ? 'w-full justify-center' : 'flex-1'}`}
              >
                <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                  <Calculator className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/row:scale-110 ${isCalcPath ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/row:text-[#f7d88c]'}`} />
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
                  className="p-1 rounded text-[#a99a8b] hover:text-[#cda052] transition-all flex-shrink-0 cursor-pointer outline-none mr-0.5"
                  aria-label="Toggle calculation sub-modules"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${calculatorExpanded ? '' : '-rotate-90'}`} />
                </button>
              )}
            </div>

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
              className={`group/link flex items-center rounded-xl text-xs transition-colors duration-200 border ${
                pathname === '/vendors'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
              } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
            >
              <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                <Factory className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/vendors' ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/link:text-white'}`} />
              </div>
              <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
              }`}>
                Vendors
              </span>
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
              className={`group/link flex items-center rounded-xl text-xs transition-colors duration-200 border ${
                pathname === '/pipeline'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
              } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
            >
              <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                <GitBranch className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/pipeline' ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/link:text-white'}`} />
              </div>
              <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
              }`}>
                Pipeline
              </span>
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
              className={`group/link flex items-center rounded-xl text-xs transition-colors duration-200 border ${
                pathname === '/budget'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
              } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
            >
              <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                <Wallet className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/budget' ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/link:text-white'}`} />
              </div>
              <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
              }`}>
                Budget Tracker
              </span>
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                Budget Tracker
              </div>
            )}
          </div>
        </div>

        {/* 4. KNOWLEDGE & ASSETS DIRECT MODULES */}
        <div className="w-full space-y-1">
          <div className="h-6 flex items-center px-1 my-0.5 overflow-hidden relative">
            <span className={`text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[180px] opacity-100 translate-x-0 text-[#a89487] dark:text-[#94a3b8]'
            }`}>
              Knowledge & Assets
            </span>
            <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full ${
              collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="w-7 border-t border-[#3d2b20] dark:border-white/[0.08] mx-auto" />
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
                  className={`group/link flex items-center rounded-xl text-xs transition-colors duration-200 border ${
                    isItemActive
                      ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                      : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                  } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
                >
                  <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                    <ItemIcon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${isItemActive ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/link:text-white'}`} />
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
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                    <span className="text-[#a99a8b] dark:text-[#8895ad] text-[10px] block font-normal">Knowledge & Assets</span>
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
        </div>
      </div>

      {/* GOVERNANCE & SECURITY MODULES */}
      {(canView('access') || canView('audit')) && (
        <div className="w-full space-y-1">
          <div className="h-6 flex items-center px-1 my-0.5 overflow-hidden relative">
            <span className={`text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none' : 'max-w-[180px] opacity-100 translate-x-0 text-[#a89487] dark:text-[#94a3b8]'
            }`}>
              Governance & Security
            </span>
            <div className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full ${
              collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              <div className="w-7 border-t border-[#3d2b20] dark:border-white/[0.08] mx-auto" />
            </div>
          </div>

          {canView('access') && (
            <div className="relative group w-full">
              <Link
                href="/access"
                onClick={handleLinkClick}
                className={`group/link flex items-center rounded-xl text-xs transition-colors duration-200 border ${
                  pathname === '/access'
                    ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                    : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
              >
                <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                  <Lock className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/access' ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/link:text-white'}`} />
                </div>
                <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
                }`}>
                  Access Management
                </span>
              </Link>
              {collapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
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
                className={`group/link flex items-center rounded-xl text-xs transition-colors duration-200 border ${
                  pathname === '/audit'
                    ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                    : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
                } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
              >
                <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                  <FileSearch className={`w-4 h-4 flex-shrink-0 transition-transform group-hover/link:scale-110 ${pathname === '/audit' ? 'text-[#cda052]' : 'text-[#a99a8b] dark:text-[#8895ad] group-hover/link:text-white'}`} />
                </div>
                <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[160px] opacity-100 translate-x-0 ml-1.5'
                }`}>
                  Audit Log
                </span>
              </Link>
              {collapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                  Audit Log
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. ACCOUNTS & USER FOOTER */}
      <div className="p-2 bg-black/25 dark:bg-[#07080d]/80 text-[11px] border-t border-[#3d2b20] dark:border-[#1a2233] transition-all duration-300 overflow-hidden flex-shrink-0">
        <div className="px-1 mb-1 flex items-center justify-between overflow-hidden h-4">
          <span className={`text-[10px] font-semibold tracking-wider text-[#a89487] dark:text-[#94a3b8] uppercase transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            collapsed ? 'max-w-0 opacity-0 pointer-events-none' : 'max-w-[100px] opacity-100'
          }`}>
            Account
          </span>
          <UserCheck className={`w-3 h-3 text-[#cda052] transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`} />
        </div>

        <div className="space-y-1">
          {/* Profile & Brand Settings */}
          <div className="relative group w-full">
            <Link
              href="/profile"
              onClick={handleLinkClick}
              className={`group/link flex items-center rounded-xl text-xs transition-colors duration-200 border ${
                pathname === '/profile'
                  ? 'bg-[rgba(205,160,82,0.25)] text-[#f7d88c] font-semibold border-[#cda052]/60 shadow-sm'
                  : 'border-transparent text-[#d7cbbe] dark:text-[#cbd5e1] hover:text-white hover:bg-white/[0.08]'
              } ${collapsed ? 'w-10 h-10 mx-auto justify-center p-0' : 'w-full h-9 px-2.5 justify-start'}`}
            >
              <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-full h-full' : 'w-7 h-7'}`}>
                <Settings className="w-4 h-4 text-[#cda052] transition-transform group-hover/link:scale-110" />
              </div>
              <span className={`text-xs whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                collapsed ? 'max-w-0 opacity-0 -translate-x-2 pointer-events-none hidden' : 'max-w-[150px] opacity-100 translate-x-0 ml-1.5'
              }`}>
                Profile & Brand Settings
              </span>
            </Link>

            {collapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-lg shadow-2xl text-xs text-white whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                Profile & Brand Settings
              </div>
            )}
          </div>

          {/* User Profile Card & Sign Out */}
          <div className="relative group w-full">
            <div className={`flex items-center rounded-xl transition-colors duration-200 ${
              collapsed ? 'w-10 h-10 mx-auto justify-center' : 'h-9 w-full px-1'
            }`}>
              <div className="flex items-center justify-center flex-shrink-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] text-black flex items-center justify-center text-xs font-bold shadow-glow">
                  {user?.name?.[0]?.toUpperCase() || 'R'}
                </div>
              </div>
              <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex-1 min-w-0 ${
                collapsed ? 'max-w-0 opacity-0 pointer-events-none hidden' : 'max-w-[130px] opacity-100 ml-1.5'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#f1f5f9] truncate font-semibold block leading-tight">
                    {user?.name || 'Rivlet Admin'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-[#cda052] font-semibold leading-tight">
                    {user?.role ? ROLE_LABELS[user.role] : 'Owner'}
                  </span>
                  <span className="text-[10px] text-[#a89487] dark:text-[#94a3b8] truncate leading-tight">
                    • {user?.email || 'admin@therivlet.com'}
                  </span>
                </div>
              </div>
              {!collapsed && (
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-lg text-[#a89487] dark:text-[#94a3b8] hover:text-rose-400 hover:bg-rose-950/30 transition-all flex-shrink-0 cursor-pointer"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Account Tooltip when collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-3 bottom-0 p-2.5 bg-[#1e140e] dark:bg-[#0d101a] border border-[#443023] dark:border-[#22293e] rounded-xl shadow-2xl text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-[90]">
                <div className="font-semibold text-white">{user?.name || 'Rivlet Admin'}</div>
                <div className="text-[10px] text-[#a99a8b] dark:text-[#94a3b8]">{user?.email || 'admin@therivlet.com'}</div>
                <div className="mt-2 pt-2 border-t border-white/[0.08] flex items-center justify-between gap-4">
                  <Link href="/profile" className="text-[11px] text-[#cda052] hover:underline">Settings</Link>
                  <button onClick={() => signOut()} className="text-[11px] text-rose-400 hover:underline">Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
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
