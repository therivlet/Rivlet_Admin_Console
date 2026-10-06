'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Tag, 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  ChevronDown, 
  Check, 
  Calendar, 
  Sun, 
  Moon,
  Lock,
  FileSearch,
  CloudUpload
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { useAdminStore } from '@/lib/store';
import { ROLE_LABELS } from '@/lib/permissions';
import RivletLogo from '@/components/brand/RivletLogo';
import NotificationCenterDropdown from './NotificationCenterDropdown';

interface TopbarProps {
  onOpenCommand?: () => void;
  onNewArtifact?: () => void;
  onToggleMobileMenu?: () => void;
  onToggleSidebarCollapse?: () => void;
}

const SEASON_OPTIONS = [
  {
    code: 'FW26 / SS27',
    fiscalYear: 'FY 2026–27',
    description: 'Active Merchandising & Sourcing (Current Cycle)',
  },
  {
    code: 'SS26 / FW26',
    fiscalYear: 'FY 2025–26',
    description: 'Past Production & Final Inventory',
  },
  {
    code: 'FW27 / SS28',
    fiscalYear: 'FY 2027–28',
    description: 'Upcoming Range Forecasting & Mill Outreaches',
  },
  {
    code: 'SS25 / FW25',
    fiscalYear: 'FY 2024–25',
    description: 'Historical Benchmark Archive',
  },
];

export default function Topbar({ 
  onOpenCommand, 
  onToggleMobileMenu,
  onToggleSidebarCollapse
}: TopbarProps) {
  const { user, signOut, canView } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { activeSeason, setActiveSeason, isSyncing } = useAdminStore();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [customSeasonInput, setCustomSeasonInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const seasonDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(event.target as Node)) {
        setSeasonDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerCommand = () => {
    if (onOpenCommand) {
      onOpenCommand();
    } else {
      window.dispatchEvent(new CustomEvent('open-command-palette'));
    }
  };

  const handleMenuClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggleMobileMenu?.();
    } else {
      onToggleSidebarCollapse?.();
    }
  };

  return (
    <>
      <header className="h-14 flex-shrink-0 bg-white/95 dark:bg-[#0a0c12]/95 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between z-30 select-none gap-2 shadow-sm border-b border-[#e5ded6] dark:border-[#1a2233] transition-all relative">
        {/* Left section: 3-Lines YouTube-style Hamburger + Combined Brand Logo & Wordmark */}
        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 z-10">
          <button
            onClick={handleMenuClick}
            className="p-2 rounded-xl text-[#57534e] dark:text-[#94a3b8] hover:text-[#8c672b] dark:hover:text-[#f7dda0] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] active:scale-95 transition-all flex-shrink-0 cursor-pointer"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            href="/"
            className="brand-logo-link flex items-center outline-none hover:opacity-90 transition-opacity flex-shrink-0 py-1"
          >
            <RivletLogo variant="gold" size="sm" className="h-6 w-auto" />
          </Link>
        </div>

        {/* Center section: Search bar box positioned at the center of the screen/header */}
        <div className="flex-1 flex justify-center items-center px-1 sm:px-2 md:px-0 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md lg:max-w-xl z-20 pointer-events-none min-w-0">
          <button
            onClick={triggerCommand}
            title="Search platform (⌘K / Ctrl+K)"
            aria-label="Search platform"
            className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xl flex items-center justify-between px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-[#f6f2ec] dark:bg-[#0e121b] border border-[#ded5c8] dark:border-[#242e44] text-xs text-[#1c1917] dark:text-[#cbd5e1] hover:border-[#cda052]/60 hover:text-black dark:hover:text-white transition-all shadow-inner cursor-pointer pointer-events-auto"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0" />
              <span className="truncate hidden md:inline text-[#78716c] dark:text-[#94a3b8]">Search artifacts, costing sheets, SOPs...</span>
              <span className="truncate hidden xs:inline md:hidden text-[#78716c] dark:text-[#94a3b8]">Search portal...</span>
              <span className="truncate xs:hidden text-[#78716c] dark:text-[#94a3b8] text-[11px]">Search...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#eae3d7] dark:bg-[#1a2234] border border-[#d8cdbe] dark:border-[#2b3852] rounded text-[#57534e] dark:text-[#cbd5e1] font-mono flex-shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 z-10">
          {/* Season & Financial Year Selector */}
          <div className="relative" ref={seasonDropdownRef}>
            <button
              onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
              title="Change active merchandising season / financial year"
              aria-label="Change active merchandising season and financial year"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-[#f6f2ec] dark:bg-[#121623] hover:bg-[#efe7dc] dark:hover:bg-[#182030] border border-[#ded5c8] dark:border-[#242e44] hover:border-[#cda052]/60 text-xs text-[#8c672b] dark:text-[#cda052] transition-all shadow-sm cursor-pointer group"
            >
              <Tag className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-semibold tracking-wider font-mono hidden sm:inline">{activeSeason}</span>
              <span className="font-semibold tracking-wider font-mono text-[11px] sm:hidden">{activeSeason.split('/')[0].trim()}</span>
              <ChevronDown className={`w-3 h-3 text-[#78716c] dark:text-[#94a3b8] hidden xs:inline transition-transform duration-200 ${seasonDropdownOpen ? 'rotate-180 text-[#cda052]' : ''}`} />
            </button>

            {seasonDropdownOpen && (
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 bg-white dark:bg-[#0d101a] border border-[#ded5c8] dark:border-[#22293e] rounded-2xl shadow-2xl p-4 z-50 animate-fade-in text-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1c1917] dark:text-white text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#cda052]" />
                    Season & Financial Year
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.12)] text-[#8c672b] dark:text-[#cda052] border border-[rgba(205,160,82,0.25)] font-mono font-semibold">
                    Merchandising Cycle
                  </span>
                </div>

                <div className="space-y-1.5">
                  {SEASON_OPTIONS.map((opt) => {
                    const isSelected = activeSeason === opt.code;
                    return (
                      <button
                        key={opt.code}
                        onClick={() => {
                          setActiveSeason(opt.code);
                          setSeasonDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-[rgba(205,160,82,0.12)] border-[#cda052] text-[#1c1917] dark:text-white shadow-sm'
                            : 'bg-[#faf8f5] dark:bg-[#121623] border-[#ede5da] dark:border-[#1e2638] text-[#44403c] dark:text-[#cbd5e1] hover:bg-[#f5f0ea] dark:hover:bg-[#182030] hover:border-[#ded5c8] dark:hover:border-[#2b3854]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#8c672b] dark:text-[#cda052]">{opt.code}</span>
                            <span className="text-[10px] text-[#78716c] dark:text-[#94a3b8] font-mono font-semibold">({opt.fiscalYear})</span>
                          </div>
                          <div className="text-[11px] text-[#78716c] dark:text-[#8e97af] mt-0.5">{opt.description}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#cda052] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle interface theme"
            className="flex items-center justify-center p-2 rounded-lg border border-[#ded5c8] dark:border-[#242e44] bg-[#f6f2ec] dark:bg-[#0e121b] hover:border-[#cda052]/60 hover:bg-[#efe7dc] dark:hover:bg-[#151a26] text-[#8c672b] dark:text-[#cda052] transition-all shadow-sm cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#cda052]" /> : <Moon className="w-3.5 h-3.5 text-[#8c672b]" />}
          </button>

          {/* Durable Notification Center */}
          <NotificationCenterDropdown />

          {/* User Profile Avatar & Dropdown (Hutch icon button containing User Profile & Role) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              title={`${user?.name || 'Rivlet Executive'} (${user?.role ? ROLE_LABELS[user.role] : 'Owner'})`}
              aria-label="Open User Menu"
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] border border-transparent hover:border-[#ded5c8] dark:hover:border-[#2b3852] focus:outline-none transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] flex items-center justify-center text-xs font-bold text-black shadow-glow ring-2 ring-[rgba(205,160,82,0.3)]">
                {user?.name?.[0]?.toUpperCase() || 'R'}
              </div>
              <ChevronDown className="w-3 h-3 text-[#78716c] dark:text-[#8c97ad] hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-64 bg-[#0d101a] border border-[#22293e] rounded-xl shadow-2xl p-2 space-y-2 z-50 animate-fade-in text-xs">
                {/* User Header */}
                <div className="p-2.5 bg-[#07090f] border border-[#1b2133] rounded-lg">
                  <div className="font-bold text-white truncate">{user?.name || 'Rivlet Executive'}</div>
                  <div className="text-xs text-[#94a3b8] truncate font-mono">{user?.email || 'admin@therivlet.com'}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold font-mono uppercase">
                      {user?.role ? ROLE_LABELS[user.role] : 'Owner'}
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Active
                    </span>
                  </div>
                </div>

                {/* Menu Links */}
                <div className="space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#cbd5e1] hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#cda052]" />
                    <span>My Profile & Brand Info</span>
                  </Link>

                  {canView('access') && (
                    <Link
                      href="/access"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#cbd5e1] hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5 text-[#cda052]" />
                      <span>Access & Governance</span>
                    </Link>
                  )}

                  {canView('audit') && (
                    <Link
                      href="/audit"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#cbd5e1] hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
                      <FileSearch className="w-3.5 h-3.5 text-[#cda052]" />
                      <span>Audit Trail History</span>
                    </Link>
                  )}

                  <Link
                    href="/calculator"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#cbd5e1] hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#cda052]" />
                    <span>Pricing Engine & BOM</span>
                  </Link>
                </div>

                {/* Sign Out */}
                <div className="pt-1 border-t border-white/[0.08]">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 border border-transparent hover:border-rose-500/30 transition-all text-left font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
