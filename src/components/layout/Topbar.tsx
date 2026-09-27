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
  ChevronDown
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
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    }
  };

  return (
    <header className="h-16 border-b border-[#1a1f2c] bg-[#0a0c12]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left section: Mobile Hamburger + Logo + Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#828ca1] hover:text-white hover:bg-[#141824] transition-colors"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Logo */}
        <div className="lg:hidden flex items-center">
          <Link href="/">
            <RivletLogo variant="gold" size="xs" />
          </Link>
        </div>

        {/* Search trigger button (Responsive) */}
        <button
          onClick={triggerCommand}
          className="w-full flex items-center justify-between px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-[#0e121b] border border-[#242e44] text-xs text-[#cbd5e1] hover:border-[#cda052]/60 hover:text-white transition-all shadow-inner"
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
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121623] border border-[#242e44] text-xs text-[#cda052]">
          <Tag className="w-3 h-3 text-[#cda052]" />
          <span className="font-semibold tracking-wider font-mono">FW26 / SS27</span>
        </div>

        {/* Quick action: Add Artifact */}
        {onNewArtifact ? (
          <button
            onClick={onNewArtifact}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 transition-all shadow-glow flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Artifact</span>
          </button>
        ) : (
          <Link
            href="/artifacts?action=new"
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
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[#cbd5e1] hover:text-white hover:bg-[#151a28] transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-[#cda052]" />
                  <span>My Profile & Brand Info</span>
                </Link>

                <Link
                  href="/calculator"
                  onClick={() => setProfileDropdownOpen(false)}
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
  );
}
