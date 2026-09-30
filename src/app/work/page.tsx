'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ListTree, KanbanSquare, CalendarRange, Settings2, Sparkles } from 'lucide-react';
import BacklogView from '@/components/work/BacklogView';
import BoardView from '@/components/work/BoardView';
import SprintsView from '@/components/work/SprintsView';
import SettingsView from '@/components/work/SettingsView';
import BulkCreationView from '@/components/work/BulkCreationView';

type Tab = 'backlog' | 'board' | 'sprints' | 'bulk' | 'settings';

const TABS: { key: Tab; label: string; icon: typeof ListTree }[] = [
  { key: 'backlog', label: 'Backlog', icon: ListTree },
  { key: 'board', label: 'Sprint Board', icon: KanbanSquare },
  { key: 'sprints', label: 'Sprints', icon: CalendarRange },
  { key: 'bulk', label: 'Bulk Creation', icon: Sparkles },
  { key: 'settings', label: 'Settings', icon: Settings2 },
];

function WorkPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: Tab = (tabParam === 'board' || tabParam === 'sprints' || tabParam === 'bulk' || tabParam === 'settings') ? tabParam : 'backlog';
  const [boardSprintId, setBoardSprintId] = useState<string | undefined>(undefined);

  const setTab = (next: Tab) => {
    router.push(`/work?tab=${next}`);
  };

  const openBoardForSprint = (sprintId?: string) => {
    setBoardSprintId(sprintId);
    setTab('board');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          <KanbanSquare className="w-6 h-6 text-[#cda052]" />
          Work Tracking
        </h1>
        <p className="text-sm text-[#94a3b8] mt-1">Plan, track, and ship — Epics down to Tasks, sprint by sprint.</p>
      </div>

      <div className="flex items-center gap-1.5 mb-6 border-b border-[#1a1f2c]">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            title={`Switch to ${label}`}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key
                ? 'border-[#cda052] text-[#e6c875]'
                : 'border-transparent text-[#94a3b8] hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
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
