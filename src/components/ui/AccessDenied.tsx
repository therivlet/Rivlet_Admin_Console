'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { AppModule } from '@/lib/types';
import { MODULE_CONFIG } from '@/lib/permissions';

interface AccessDeniedProps {
  module?: AppModule;
  customMessage?: string;
}

export default function AccessDenied({ module, customMessage }: AccessDeniedProps) {
  const router = useRouter();
  const moduleConfig = module ? MODULE_CONFIG[module] : null;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in relative">
      {/* Background Ambient Glow */}
      <div className="absolute w-96 h-96 bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0e121b] border border-[#222a3d] rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Shield Icon */}
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold font-serif text-white tracking-wide">
            Access Restricted
          </h1>
          <p className="text-xs text-[#94a3b8] leading-relaxed">
            {customMessage || (
              <>
                You do not have permission to access the{' '}
                <strong className="text-[#e6c875]">{moduleConfig?.name || 'requested'}</strong> module.
                Rivlet enforces strict database Row Level Security and role policies.
              </>
            )}
          </p>
        </div>

        {/* Notice Info Box */}
        <div className="p-3 bg-[#07090f] border border-[#1b2233] rounded-xl text-[11px] text-[#8e9bb3] flex items-start gap-2.5 text-left">
          <Lock className="w-4 h-4 text-[#cda052] flex-shrink-0 mt-0.5" />
          <span>
            If your role requires access to this operational area, please contact your organization&apos;s
            <strong> Rivlet Owner</strong> or Administrator to update your module permissions.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#141926] hover:bg-[#1c2336] border border-[#253047] text-xs font-semibold text-[#cbd5e1] hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>

          <Link
            href="/"
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b38536] text-black text-xs font-bold hover:brightness-110 shadow-glow transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
