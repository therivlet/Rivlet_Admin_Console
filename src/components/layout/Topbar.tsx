'use client';

import React from 'react';
import { 
  Search, 
  Plus, 
  Sparkles, 
  Tag, 
  ShieldAlert, 
  FileUp,
  Calculator,
  LogOut,
  User
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';

interface TopbarProps {
  onOpenCommand?: () => void;
  onNewArtifact?: () => void;
}

export default function Topbar({ onOpenCommand, onNewArtifact }: TopbarProps) {
  const { user } = useAuth();
  const triggerCommand = () => {
    if (onOpenCommand) {
      onOpenCommand();
    } else {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    }
  };

  return (
    <header className="h-16 border-b border-[#1a1f2c] bg-[#0c0e14]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search trigger */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <button
          onClick={triggerCommand}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#141722] border border-[#23293a] text-xs text-[#858d9f] hover:border-[#cda052]/50 hover:text-white transition-all shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-[#cda052]" />
            <span>Search artifacts, costing sheets, SOPs...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] bg-[#1d2232] border border-[#2b3348] rounded text-[#a5adbe] font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Season Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#161a26] border border-[#252c3f] text-[11px] text-[#cda052]">
          <Tag className="w-3 h-3 text-[#cda052]" />
          <span className="font-semibold tracking-wider">FW26 / SS27</span>
        </div>

        {/* Quick action: Add Artifact */}
        {onNewArtifact ? (
          <button
            onClick={onNewArtifact}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 transition-all shadow-glow"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Artifact</span>
          </button>
        ) : (
          <Link
            href="/artifacts?action=new"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-semibold text-xs hover:brightness-110 transition-all shadow-glow"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Artifact</span>
          </Link>
        )}

        {/* User Monogram & Logout */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="w-8 h-8 rounded-full bg-[#1b202f] border border-[#2c344a] flex items-center justify-center text-xs font-semibold text-[#cda052] hover:border-[#cda052] transition-colors"
            title={user ? `${user.name} (${user.email})` : 'Sign In'}
          >
            {user?.name?.[0]?.toUpperCase() || 'R'}
          </Link>
        </div>
      </div>
    </header>
  );
}
