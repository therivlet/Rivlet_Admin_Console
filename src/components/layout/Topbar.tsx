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
  Moon 
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { useAdminStore } from '@/lib/store';
import RivletLogo from '@/components/brand/RivletLogo';

interface TopbarProps {
  onOpenCommand?: () => void;
  onNewArtifact?: () => void;
  onToggleMobileMenu?: () => void;
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
  onToggleMobileMenu 
}: TopbarProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { activeSeason, setActiveSeason } = useAdminStore();
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

  return (
    <>
      <header className="h-16 flex-shrink-0 bg-[#0a0c12]/90 backdrop-blur-xl px-2.5 sm:px-6 flex items-center justify-between z-30 select-none gap-2 shadow-[0_4px_25px_rgba(0,0,0,0.3)] transition-all">
        {/* Left section: Mobile Hamburger + Logo + Search */}
        <div className="flex items-center gap-1.5 sm:gap-4 flex-1 min-w-0 max-w-xl">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg text-[#828ca1] hover:text-white hover:bg-[#141824] transition-colors flex-shrink-0"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand Logo */}
          <div className="lg:hidden flex items-center flex-shrink-0">
            <Link href="/" title="Rivlet Admin Console Home" className="flex items-center">
              <RivletLogo variant={theme === 'light' ? 'white-gold' : 'gold'} size="xs" />
            </Link>
          </div>

          {/* Search trigger button (Responsive: compact on mobile, expansive on desktop) */}
          <button
            onClick={triggerCommand}
            title="Search platform (⌘K / Ctrl+K)"
            aria-label="Search platform"
            className="flex items-center justify-between px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-[#0e121b] border border-[#242e44] text-xs text-[#cbd5e1] hover:border-[#cda052]/60 hover:text-white transition-all shadow-inner cursor-pointer flex-1 min-w-0"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0" />
              <span className="truncate hidden md:inline text-[#94a3b8]">Search artifacts, costing sheets, SOPs...</span>
              <span className="truncate hidden xs:inline md:hidden text-[#94a3b8]">Search portal...</span>
              <span className="truncate xs:hidden text-[#94a3b8] text-[11px]">Search...</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-[#1a2234] border border-[#2b3852] rounded text-[#cbd5e1] font-mono flex-shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
          {/* Interactive Season & Financial Year Selector (Icon + compact code on mobile, full on desktop) */}
          <div className="relative" ref={seasonDropdownRef}>
            <button
              onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
              title="Change active merchandising season / financial year"
              aria-label="Change active merchandising season and financial year"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-[#121623] hover:bg-[#182030] border border-[#242e44] hover:border-[#cda052]/60 text-xs text-[#cda052] transition-all shadow-sm cursor-pointer group"
            >
              <Tag className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0 group-hover:scale-110 transition-transform" />
              <span className="font-semibold tracking-wider font-mono hidden sm:inline">{activeSeason}</span>
              <span className="font-semibold tracking-wider font-mono text-[11px] sm:hidden">{activeSeason.split('/')[0].trim()}</span>
              <ChevronDown className={`w-3 h-3 text-[#94a3b8] hidden xs:inline transition-transform duration-200 ${seasonDropdownOpen ? 'rotate-180 text-[#cda052]' : ''}`} />
            </button>

            {/* Season & Financial Year Dropdown Modal (Viewport-friendly width) */}
            {seasonDropdownOpen && (
              <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 bg-[#0d101a] border border-[#22293e] rounded-2xl shadow-2xl p-4 z-50 animate-fade-in text-xs space-y-3.5">
                {/* Header with Apparel Cycle Explanation */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#cda052]" />
                      Season & Financial Year
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.12)] text-[#cda052] border border-[rgba(205,160,82,0.25)] font-mono font-semibold">
                      Merchandising Cycle
                    </span>
                  </div>

                  {/* Educational Note explaining FW and SS */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-[#07090e] border border-[#1b2133] text-[11px] text-[#94a3b8] leading-relaxed">
                    <p className="font-medium text-[#cbd5e1] mb-1">What do FW and SS mean?</p>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                      <div><strong className="text-[#cda052]">FW:</strong> Fall / Winter (Autumn)</div>
                      <div><strong className="text-[#cda052]">SS:</strong> Spring / Summer</div>
                    </div>
                    <p className="text-[10px] text-[#717a90] mt-1.5">
                      In the apparel industry, each financial year consists of two primary collection drops (e.g. FW26 + SS27 = FY 2026–27).
                    </p>
                  </div>
                </div>

                {/* Season Options */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">Select Active Cycle:</p>
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
                            ? 'bg-[rgba(205,160,82,0.12)] border-[#cda052] text-white shadow-sm'
                            : 'bg-[#121623] border-[#1e2638] text-[#cbd5e1] hover:bg-[#182030] hover:border-[#2b3854]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#cda052]">{opt.code}</span>
                            <span className="text-[10px] text-[#94a3b8] font-mono font-semibold">({opt.fiscalYear})</span>
                          </div>
                          <div className="text-[11px] text-[#8e97af] mt-0.5">{opt.description}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#cda052] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Season Input */}
                <div className="pt-2 border-t border-[#1a2133]">
                  {!showCustomInput ? (
                    <button
                      onClick={() => {
                        setShowCustomInput(true);
                        setCustomSeasonInput(activeSeason);
                      }}
                      className="text-[11px] text-[#cda052] hover:underline flex items-center gap-1 font-medium"
                    >
                      + Enter custom season or financial year
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold text-[#8e97af] uppercase">Custom Season / FY Name:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customSeasonInput}
                          onChange={(e) => setCustomSeasonInput(e.target.value)}
                          placeholder="e.g. FY 2026-27 or Drop 1 / SS27"
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#07090e] border border-[#232d42] text-xs text-white outline-none focus:border-[#cda052]"
                        />
                        <button
                          onClick={() => {
                            if (customSeasonInput.trim()) {
                              setActiveSeason(customSeasonInput.trim());
                              setShowCustomInput(false);
                              setSeasonDropdownOpen(false);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#cda052] text-black font-semibold text-xs hover:brightness-110"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setShowCustomInput(false)}
                          className="px-2 py-1.5 text-xs text-[#8e97af] hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button (Icon only) */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle interface theme"
            className="flex items-center justify-center p-2 rounded-lg border border-[#242e44] bg-[#0e121b] hover:border-[#cda052]/60 hover:bg-[#151a26] text-[#cda052] transition-all shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-[#cda052]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#cda052]" />
            )}
          </button>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              title="Account settings & profile options"
              aria-label="Open User Menu"
              className="flex items-center gap-1 p-1 rounded-xl hover:bg-white/[0.08] border border-transparent hover:border-[#523b2c] dark:hover:border-[#2b3852] focus:outline-none transition-all cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] flex items-center justify-center text-xs font-bold text-black shadow-glow">
                {user?.name?.[0]?.toUpperCase() || 'R'}
              </div>
              <ChevronDown className="w-3 h-3 text-[#8c97ad] hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu (Viewport friendly on mobile) */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-xs sm:w-64 bg-[#0d101a] border border-[#22293e] rounded-xl shadow-2xl p-2 space-y-2 z-50 animate-fade-in text-xs">
                {/* User Header */}
                <div className="p-2.5 bg-[#07090f] border border-[#1b2133] rounded-lg">
                  <div className="font-bold text-white truncate">{user?.name || 'Rivlet Executive'}</div>
                  <div className="text-xs text-[#94a3b8] truncate">{user?.email || 'admin@therivlet.com'}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(205,160,82,0.15)] text-[#cda052] border border-[rgba(205,160,82,0.3)] font-semibold font-mono">
                      Super Admin
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-medium">
                      <ShieldCheck className="w-3 h-3" /> Live
                    </span>
                  </div>
                </div>

                {/* Menu Links */}
                <div className="space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    title="View and update personal profile and brand settings"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#cbd5e1] hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#cda052]" />
                    <span>My Profile & Brand Info</span>
                  </Link>

                  <Link
                    href="/calculator"
                    onClick={() => setProfileDropdownOpen(false)}
                    title="Open Garment Pricing Engine & Technical BOM"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#cbd5e1] hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#cda052]" />
                    <span>Pricing Engine & BOM</span>
                  </Link>

                  <button
                    onClick={() => {
                      toggleTheme();
                      setProfileDropdownOpen(false);
                    }}
                    title="Toggle light or dark interface theme"
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[#cbd5e1] hover:text-white hover:bg-white/[0.08] transition-colors text-left"
                  >
                    <span className="flex items-center gap-2">
                      {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#cda052]" /> : <Moon className="w-3.5 h-3.5 text-[#cda052]" />}
                      <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                    </span>
                    <span className="text-[10px] text-[#94a3b8] uppercase font-mono">
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </button>
                </div>

                {/* Sign Out */}
                <div className="pt-1 border-t border-white/[0.08]">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      signOut();
                    }}
                    title="Sign out of Rivlet Executive Console"
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
