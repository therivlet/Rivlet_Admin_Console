'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ListTree, KanbanSquare, CalendarRange, Users, Sparkles } from 'lucide-react';
import BacklogView from '@/components/work/BacklogView';
import BoardView from '@/components/work/BoardView';
import SprintsView from '@/components/work/SprintsView';
import SettingsView from '@/components/work/SettingsView';
import BulkCreationView from '@/components/work/BulkCreationView';

type Tab = 'backlog' | 'board' | 'sprints' | 'bulk' | 'settings';

interface TabItem {
  key: Tab;
  label: string;
  shortLabel: string;
  icon: typeof ListTree;
  description: string;
}

const TABS: TabItem[] = [
  { key: 'backlog', label: 'Backlogs', shortLabel: 'Backlogs', icon: ListTree, description: 'Work hierarchy & epics' },
  { key: 'board', label: 'Sprint Board', shortLabel: 'Board', icon: KanbanSquare, description: 'Active sprint Kanban' },
  { key: 'sprints', label: 'Sprints', shortLabel: 'Sprints', icon: CalendarRange, description: 'Sprint cadences & schedule' },
  { key: 'bulk', label: 'Sprint Bulk Creation', shortLabel: 'Bulk', icon: Sparkles, description: 'AI bulk story & task importer' },
  { key: 'settings', label: 'Teams', shortLabel: 'Teams', icon: Users, description: 'Team roster & cadence rules' },
];

function WorkPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: Tab = (tabParam === 'board' || tabParam === 'sprints' || tabParam === 'bulk' || tabParam === 'settings' || tabParam === 'teams') ? (tabParam === 'teams' ? 'settings' : tabParam) : 'backlog';
  const [boardSprintId, setBoardSprintId] = useState<string | undefined>(undefined);

  const setTab = (next: Tab) => {
    router.push(`/work?tab=${next}`);
  };

  const openBoardForSprint = (sprintId?: string) => {
    setBoardSprintId(sprintId);
    setTab('board');
  };

  const activeTabMeta = TABS.find((t) => t.key === tab) || TABS[0];

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Header with responsive active module indicator */}
      <div className="mb-4 sm:mb-5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
            <KanbanSquare className="w-5 h-5 sm:w-6 sm:h-6 text-[#cda052] flex-shrink-0" />
            <span>Work Tracking</span>
            <span className="sm:hidden text-[11px] font-semibold text-[#cda052] bg-[rgba(205,160,82,0.12)] px-2 py-0.5 rounded-md border border-[rgba(205,160,82,0.25)] ml-1">
              {activeTabMeta.label}
            </span>
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#94a3b8] mt-1">Plan, track, and ship — Epics down to Tasks, sprint by sprint.</p>
      </div>

      {/* Module Navigation Tabs (Responsive & Mobile-Adaptive) */}
      <div className="mb-5 sm:mb-6">
        {/* Mobile View: 5-column aspect-ratio module card grid (All 5 modules fit 100% of mobile screen without overflow) */}
        <nav
          className="sm:hidden grid grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-[#090c13] border border-[#1b2234] shadow-lg"
          aria-label="Work Tracking Modules"
        >
          {TABS.map(({ key, label, shortLabel, icon: Icon, description }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                title={`Switch to ${label} (${description})`}
                aria-selected={isActive}
                role="tab"
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all relative aspect-[4/3] xs:aspect-[5/4] min-h-[52px] select-none ${
                  isActive
                    ? 'bg-gradient-to-b from-[#1b2438] to-[#0f1524] text-[#e6c875] border border-[#cda052]/60 shadow-[0_2px_10px_rgba(205,160,82,0.2)] font-semibold'
                    : 'text-[#828ca1] hover:text-white hover:bg-[#121624] border border-transparent'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-4 h-4 xs:w-4.5 xs:h-4.5 transition-transform ${
                      isActive ? 'text-[#cda052] scale-110 drop-shadow-[0_0_6px_rgba(205,160,82,0.4)]' : 'text-[#7c869d]'
                    }`}
                  />
                </div>
                <span className="text-[9px] xs:text-[10px] mt-1 leading-tight truncate max-w-full font-medium tracking-tight">
                  {shortLabel}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-3 h-0.5 rounded-full bg-[#cda052]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Tablet & Desktop View: Classic luxury tab bar with full module names and hover animations */}
        <nav
          className="hidden sm:flex items-center gap-1.5 border-b border-[#1a1f2c] overflow-x-auto custom-scrollbar"
          aria-label="Work Tracking Modules"
        >
          {TABS.map(({ key, label, icon: Icon, description }) => {
            const isActive = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                title={`${label} — ${description}`}
                aria-selected={isActive}
                role="tab"
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#cda052] text-[#e6c875] bg-[#cda052]/5 rounded-t-lg'
                    : 'border-transparent text-[#94a3b8] hover:text-white hover:border-[#2a344a]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#cda052]' : 'text-[#7c869d]'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {tab === 'backlog' && <BacklogView />}
      {tab === 'board' && <BoardView initialSprintId={boardSprintId} />}
      {tab === 'sprints' && <SprintsView onOpenBoard={openBoardForSprint} />}
      {tab === 'bulk' && <BulkCreationView onNavigateToBoard={openBoardForSprint} onNavigateToBacklog={() => setTab('backlog')} />}
      {tab === 'settings' && <SettingsView />}
    </div>
  );
}

export default function WorkPage() {
  return (
    <Suspense fallback={null}>
      <WorkPageInner />
    </Suspense>
  );
}
