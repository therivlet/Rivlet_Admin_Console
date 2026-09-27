'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Tag, 
  Menu, 
  User, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  Download,
  Info,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import RivletLogo from '@/components/brand/RivletLogo';

interface TopbarProps {
  onOpenCommand?: () => void;
  onNewArtifact?: () => void;
  onToggleMobileMenu?: () => void;
}

export default function Topbar({ 
  onOpenCommand, 
  onNewArtifact, 
  onToggleMobileMenu 
}: TopbarProps) {
  const { user, signOut } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
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

  const handleInstallPWA = () => {
    if (typeof window !== 'undefined' && (window as any).__rivletInstallPrompt) {
      const promptEvent = (window as any).__rivletInstallPrompt;
      promptEvent.prompt();
      promptEvent.userChoice.then((choice: any) => {
        if (choice.outcome === 'accepted') {
          (window as any).__rivletInstallPrompt = null;
        }
      });
    } else {
      setShowInstallHelp(true);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-[#1a1f2c] bg-[#0a0c12]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Left section: Mobile Hamburger + Logo + Search */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
          {/* Mobile Hamburger Menu Toggle */}
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-[#828ca1] hover:text-white hover:bg-[#141824] transition-colors"
            title="Open Navigation Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile Brand Logo */}
          <div className="lg:hidden flex items-center">
            <Link href="/" title="Rivlet Admin Console Home">
              <RivletLogo variant="gold" size="xs" />
            </Link>
          </div>

          {/* Search trigger button (Responsive) */}
          <button
            onClick={triggerCommand}
            title="Search platform (⌘K / Ctrl+K)"
            aria-label="Search platform"
            className="w-full flex items-center justify-between px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-[#0e121b] border border-[#242e44] text-xs text-[#cbd5e1] hover:border-[#cda052]/60 hover:text-white transition-all shadow-inner cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0" />
              <span className="truncate hidden sm:inline text-[#94a3b8]">Search artifacts, costing sheets, SOPs...</span>
              <span className="truncate sm:hidden text-[#94a3b8]">Search portal...</span>
            </div>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-[#1a2234] border border-[#2b3852] rounded text-[#cbd5e1] font-mono flex-shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Season Indicator */}
          <div 
            className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121623] border border-[#242e44] text-xs text-[#cda052] cursor-default"
            title="Active Merchandising Season: FW26 / SS27"
          >
            <Tag className="w-3 h-3 text-[#cda052]" />
            <span className="font-semibold tracking-wider font-mono">FW26 / SS27</span>
          </div>

          {/* Chrome PWA Install Button */}
          <button
            onClick={handleInstallPWA}
            title="Install Rivlet Executive App as Chrome Desktop or Mobile PWA"
            aria-label="Install Chrome PWA"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#141824] border border-[#263148] text-[#cda052] hover:text-white hover:border-[#cda052]/60 text-xs font-semibold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#cda052]" />
            <span className="hidden md:inline">Install App</span>
          </button>

          {/* Quick action: Add Artifact */}
          {onNewArtifact ? (
            <button
              onClick={onNewArtifact}
              title="Create or import Claude Artifact"
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 transition-all shadow-glow flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Artifact</span>
            </button>
          ) : (
            <Link
              href="/artifacts?action=new"
              title="Create or import Claude Artifact"
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 transition-all shadow-glow flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Artifact</span>
            </Link>
          )}

          {/* User Profile Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              title="Account settings & profile options"
              aria-label="Open User Menu"
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-[#161a26] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] flex items-center justify-center text-xs font-bold text-black shadow-glow">
                {user?.name?.[0]?.toUpperCase() || 'R'}
              </div>
              <ChevronDown className="w-3 h-3 text-[#8c97ad] hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0d101a] border border-[#22293e] rounded-xl shadow-2xl p-2 space-y-2 z-50 animate-fade-in text-xs">
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
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#cbd5e1] hover:text-white hover:bg-[#151a28] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#cda052]" />
                    <span>My Profile & Brand Info</span>
                  </Link>

                  <Link
                    href="/calculator"
                    onClick={() => setProfileDropdownOpen(false)}
                    title="Open Garment Pricing Engine & Technical BOM"
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#cbd5e1] hover:text-white hover:bg-[#151a28] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#cda052]" />
                    <span>Pricing Engine & BOM</span>
                  </Link>
                </div>

                {/* Sign Out */}
                <div className="pt-1 border-t border-[#1a2133]">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      signOut();
                    }}
                    title="Sign out of Rivlet Executive Console"
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors text-left font-medium"
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

      {/* PWA Install Guide Modal */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0e121b] border border-[#242e44] rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowInstallHelp(false)}
              className="absolute top-4 right-4 p-1.5 text-[#717a90] hover:text-white rounded-lg hover:bg-[#1a1f2e] transition-colors"
              title="Close Dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#cda052] to-[#8c672b] flex items-center justify-center text-black font-bold shadow-glow">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install Rivlet Admin on Chrome</h3>
                <p className="text-xs text-[#94a3b8]">Run as a standalone desktop or mobile application</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#cbd5e1] bg-[#07090e] p-4 rounded-xl border border-[#1b2234] leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#171d2b] text-[#cda052] flex items-center justify-center font-bold flex-shrink-0">1</span>
                <span>Look at the right side of your Chrome URL address bar.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#171d2b] text-[#cda052] flex items-center justify-center font-bold flex-shrink-0">2</span>
                <span>Click the <strong>Install Rivlet (⊕ or ⤓)</strong> icon.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#171d2b] text-[#cda052] flex items-center justify-center font-bold flex-shrink-0">3</span>
                <span>Or open Chrome Menu <strong>(⋮) → More Tools → Install Rivlet Console...</strong></span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowInstallHelp(false)}
                className="px-4 py-2 rounded-lg bg-[#cda052] text-black font-bold text-xs hover:brightness-110 transition-all shadow-glow"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
