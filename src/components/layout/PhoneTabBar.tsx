'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Factory, GitBranch, KanbanSquare, LayoutDashboard, Menu, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function PhoneTabBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const [makeOpen, setMakeOpen] = useState(false);
  const makeActive = pathname.startsWith('/calculator') || pathname.startsWith('/vendors') || pathname.startsWith('/pipeline');

  const tab = (active: boolean) => cn(
    'flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
    active ? 'text-accent' : 'text-muted',
  );

  return (
    <>
      {makeOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setMakeOpen(false)}>
          <div className="absolute bottom-20 left-3 right-3 rounded-2xl border border-line bg-card p-2 shadow-card" onClick={(event) => event.stopPropagation()}>
            {[
              ['/calculator', 'Costing', Calculator],
              ['/vendors', 'Vendors', Factory],
              ['/pipeline', 'Sampling & production', GitBranch],
            ].map(([href, label, Icon]) => (
              <Link key={String(href)} href={String(href)} onClick={() => setMakeOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-ink hover:bg-sunken">
                <Icon className="h-4 w-4 text-accent" />
                {label as string}
              </Link>
            ))}
          </div>
        </div>
      )}
      <nav className="phone-tabbar fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-card pb-[env(safe-area-inset-bottom)] sm:hidden" aria-label="Primary">
        <Link href="/" className={tab(pathname === '/')}>
          <LayoutDashboard className="h-5 w-5" />
          Today
        </Link>
        <button type="button" className={tab(makeActive)} onClick={() => setMakeOpen((value) => !value)} aria-expanded={makeOpen}>
          <Calculator className="h-5 w-5" />
          Make
        </button>
        <Link href="/work" className={tab(pathname.startsWith('/work'))}>
          <KanbanSquare className="h-5 w-5" />
          Work
        </Link>
        <Link href="/budget" className={tab(pathname.startsWith('/budget'))}>
          <Wallet className="h-5 w-5" />
          Money
        </Link>
        <button type="button" className={tab(false)} onClick={onOpenMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
          Menu
        </button>
      </nav>
    </>
  );
}
