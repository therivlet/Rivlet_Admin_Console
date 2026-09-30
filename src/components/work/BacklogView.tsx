'use client';

import React, { useMemo, useState } from 'react';
import { ListTree, Plus, Search, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { WorkItem, WorkItemType, WorkItemState } from '@/lib/types';
import WorkItemModal, { TYPE_COLOR, STATE_COLOR } from '@/components/work/WorkItemModal';

const TYPES: WorkItemType[] = ['Epic', 'Feature', 'User Story', 'Task', 'Bug'];
const STATES: WorkItemState[] = ['New', 'Active', 'In Review', 'Resolved', 'Closed'];

function emptyItem(parentId?: string): Omit<WorkItem, 'createdAt' | 'updatedAt'> {
  return { id: `wi-${Date.now()}`, type: 'User Story', title: '', state: 'New', priority: 2, tags: [], parentId, assignee: 'Dasani', comments: [] };
}

export default function BacklogView() {
  const { workItems, sprints, teamMembers } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | WorkItemType>('All');
  const [stateFilter, setStateFilter] = useState<'All' | WorkItemState>('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [modalItem, setModalItem] = useState<WorkItem | Omit<WorkItem, 'createdAt' | 'updatedAt'> | null>(null);

  const topLevel = useMemo(() => workItems.filter((w) => !w.parentId), [workItems]);
  const childrenOf = (id: string) => workItems.filter((w) => w.parentId === id);

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>(teamMembers.map((m) => m.name));
    for (const w of workItems) if (w.assignee) names.add(w.assignee);
    return Array.from(names);
  }, [teamMembers, workItems]);

  const matchesFilters = (w: WorkItem) => {
    const matchesSearch = w.title.toLowerCase().includes(searchQuery.toLowerCase()) || w.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'All' || w.type === typeFilter;
    const matchesState = stateFilter === 'All' || w.state === stateFilter;
    const matchesAssignee = assigneeFilter === 'All' || w.assignee === assigneeFilter;
    return matchesSearch && matchesType && matchesState && matchesAssignee;
  };

  const sprintName = (id?: string) => sprints.find((s) => s.id === id)?.name;
  const toggleCollapse = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderRow = (item: WorkItem, depth: number) => {
    const children = childrenOf(item.id);
    const isCollapsed = collapsed[item.id];
    const visible = matchesFilters(item) || children.some((c) => matchesFilters(c) || childrenOf(c.id).some(matchesFilters));
    if (!visible) return null;

    return (
      <React.Fragment key={item.id}>
        <div
          className="flex items-center gap-2 px-3 py-2.5 hover:bg-[#0e121b] rounded-lg cursor-pointer group border-b border-[#161a26]/60"
          style={{ paddingLeft: `${12 + depth * 24}px` }}
          onClick={() => setModalItem(item)}
        >
          {children.length > 0 ? (
            <button onClick={(e) => { e.stopPropagation(); toggleCollapse(item.id); }} className="text-[#7c869d] hover:text-white flex-shrink-0" title="Expand/collapse">
              {isCollapsed ? <ChevronRightIcon className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          ) : <span className="w-3.5 flex-shrink-0" />}

          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${TYPE_COLOR[item.type]}`}>{item.type}</span>
          <span className="text-sm text-white truncate flex-1 group-hover:text-[#cda052]">{item.title}</span>
          {item.assignee && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#131b2c] border border-[#202d48] text-[#cda052] flex-shrink-0 hidden md:inline font-semibold">
              {item.assignee}
            </span>
          )}
          {item.storyPoints !== undefined && <span className="text-[10px] font-mono text-[#7c869d] flex-shrink-0">{item.storyPoints} pts</span>}
          <span className="text-[10px] text-[#7c869d] flex-shrink-0 hidden sm:inline">{sprintName(item.sprintId) || 'Backlog'}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${STATE_COLOR[item.state]}`}>{item.state}</span>
        </div>
        {!isCollapsed && children.map((c) => renderRow(c, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <p className="text-sm text-[#94a3b8]">Epics, Features, User Stories, Tasks & Bugs — the full work hierarchy.</p>
        <button
          onClick={() => setModalItem(emptyItem())}
          title="Create a new work item"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold hover:shadow-glow transition-all flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> New Work Item
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c869d]" />
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search title or tags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white placeholder:text-[#5f6c85] focus:outline-none focus:border-[#cda052]/50" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
          <option value="All">All Types</option>
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value as any)} className="px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
          <option value="All">All States</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
          <option value="All">All Assignees</option>
          {assigneeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-[#1a1f2c] bg-[#0a0c12] p-2">
        {topLevel.length === 0 ? (
          <div className="text-center py-16">
            <ListTree className="w-8 h-8 text-[#3d4658] mx-auto mb-3" />
            <p className="text-sm text-[#94a3b8]">No work items yet. Create your first Epic.</p>
          </div>
        ) : (
          topLevel.map((item) => renderRow(item, 0))
        )}
      </div>

      {modalItem && <WorkItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
