'use client';

import React, { useMemo, useState, useRef } from 'react';
import {
  ListTree,
  Plus,
  Search,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  User,
  GripVertical,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { WorkItem, WorkItemType, WorkItemState } from '@/lib/types';
import WorkItemModal, { TYPE_COLOR, STATE_COLOR } from '@/components/work/WorkItemModal';

const TYPES: WorkItemType[] = ['Epic', 'Feature', 'User Story', 'Task', 'Bug'];
const STATES: WorkItemState[] = ['New', 'Active', 'In Review', 'Resolved', 'Closed'];

function emptyItem(parentId?: string): Omit<WorkItem, 'createdAt' | 'updatedAt'> {
  return {
    id: `wi-${Date.now()}`,
    type: 'User Story',
    title: '',
    state: 'New',
    priority: 2,
    tags: [],
    parentId,
    assignee: undefined,
    comments: [],
  };
}

// Stable deterministic order sorting: order number -> createdAt -> id
function sortByOrder(items: WorkItem[]): WorkItem[] {
  return [...items].sort((a, b) => {
    const ordA = a.order ?? 999999;
    const ordB = b.order ?? 999999;
    if (ordA !== ordB) return ordA - ordB;
    const dateA = a.createdAt || '';
    const dateB = b.createdAt || '';
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    return a.id.localeCompare(b.id);
  });
}

export default function BacklogView() {
  const { workItems, sprints, teamMembers, reorderWorkItems } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | WorkItemType>('All');
  const [stateFilter, setStateFilter] = useState<'All' | WorkItemState>('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');
  const [sprintFilter, setSprintFilter] = useState<'All' | 'backlog' | string>('All');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modalItem, setModalItem] = useState<WorkItem | Omit<WorkItem, 'createdAt' | 'updatedAt'> | null>(null);

  // Drag and drop state & immediate refs for instant synchronous tracking
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    id: string;
    position: 'before' | 'after';
  } | null>(null);
  const [syncStatus, setSyncStatus] = useState<'saving' | 'synced' | null>(null);

  const draggingIdRef = useRef<string | null>(null);
  const draggingItemRef = useRef<WorkItem | null>(null);

  // Top level items sorted deterministically by order
  const topLevel = useMemo(() => {
    return sortByOrder(workItems.filter((w) => !w.parentId));
  }, [workItems]);

  // Children of specific item sorted deterministically by order
  const childrenOf = (id: string) => {
    return sortByOrder(workItems.filter((w) => w.parentId === id));
  };

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>(teamMembers.map((m) => m.name));
    for (const w of workItems) if (w.assignee) names.add(w.assignee);
    return Array.from(names);
  }, [teamMembers, workItems]);

  const backlogStoryCount = useMemo(() => {
    return workItems.filter((w) => w.type === 'User Story' && !w.sprintId).length;
  }, [workItems]);

  // Effective sprint for a work item (Tasks inherit from parent story; Epics & Features do not use sprint schedule)
  const getEffectiveSprintId = (w: WorkItem): string | undefined => {
    if (w.type === 'Epic' || w.type === 'Feature') return undefined;
    if (w.type === 'Task' && w.parentId) {
      const parent = workItems.find((p) => p.id === w.parentId);
      if (parent) return parent.sprintId;
    }
    return w.sprintId;
  };

  const matchesDirect = (w: WorkItem): boolean => {
    const matchesSearch =
      !searchQuery.trim() ||
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;

    if (typeFilter !== 'All' && w.type !== typeFilter) return false;
    if (stateFilter !== 'All' && w.state !== stateFilter) return false;
    if (assigneeFilter !== 'All' && w.assignee !== assigneeFilter) return false;

    if (sprintFilter !== 'All') {
      // Epics and Features do NOT have sprint schedules and never match sprint filter directly
      if (w.type === 'Epic' || w.type === 'Feature') {
        return false;
      }
      const effSprint = getEffectiveSprintId(w);
      if (sprintFilter === 'backlog') {
        if (effSprint) return false;
      } else {
        if (effSprint !== sprintFilter) return false;
      }
    }

    return true;
  };

  const hasMatchingDescendant = (itemId: string): boolean => {
    const children = workItems.filter((w) => w.parentId === itemId);
    for (const c of children) {
      if (matchesDirect(c) || hasMatchingDescendant(c.id)) {
        return true;
      }
    }
    return false;
  };

  const isItemVisible = (w: WorkItem): boolean => {
    return matchesDirect(w) || hasMatchingDescendant(w.id);
  };

  const sprintName = (id?: string) => sprints.find((s) => s.id === id)?.name;
  const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    for (const w of workItems) all[w.id] = true;
    setExpanded(all);
  };

  const collapseAll = () => {
    setExpanded({});
  };

  const hasAnyExpanded = Object.values(expanded).some(Boolean);

  // Drag start
  const handleDragStart = (e: React.DragEvent, item: WorkItem) => {
    draggingIdRef.current = item.id;
    draggingItemRef.current = item;
    setDraggingId(item.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  // Drag over target row
  const handleDragOver = (e: React.DragEvent, targetItem: WorkItem) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = draggingIdRef.current || draggingId;
    const sourceItem = draggingItemRef.current || (sourceId ? workItems.find((w) => w.id === sourceId) : null);
    if (!sourceItem || sourceItem.id === targetItem.id) return;

    // Strict constraint: only allow reordering within the same parent / sibling group!
    // e.g. Epics among Epics, Features within that Epic, Stories within that Feature, Tasks within that Story
    if (sourceItem.parentId !== targetItem.parentId) {
      return;
    }

    e.dataTransfer.dropEffect = 'move';

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    // Up or Down reordering position based on upper/lower half of target item
    const position: 'before' | 'after' = offsetY < height * 0.5 ? 'before' : 'after';

    if (!dragOverTarget || dragOverTarget.id !== targetItem.id || dragOverTarget.position !== position) {
      setDragOverTarget({ id: targetItem.id, position });
    }
  };

  const handleDragLeave = (e: React.DragEvent, targetItem: WorkItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && (e.currentTarget.contains(e.relatedTarget as Node))) {
      return;
    }
    if (dragOverTarget?.id === targetItem.id) {
      setDragOverTarget(null);
    }
  };

  const handleDragEnd = () => {
    draggingIdRef.current = null;
    draggingItemRef.current = null;
    setDraggingId(null);
    setDragOverTarget(null);
  };

  // Drop on target row: moves item up or down relative to its sibling
  const handleDrop = async (e: React.DragEvent, targetItem: WorkItem) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId = draggingIdRef.current || draggingId || e.dataTransfer.getData('text/plain');
    const dropTarget = dragOverTarget;
    setDraggingId(null);
    setDragOverTarget(null);
    draggingIdRef.current = null;
    draggingItemRef.current = null;

    if (!sourceId || sourceId === targetItem.id) return;
    const sourceItem = workItems.find((w) => w.id === sourceId);
    if (!sourceItem) return;

    // Strict constraint: both items must share the same parent!
    if (sourceItem.parentId !== targetItem.parentId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const fallbackPosition: 'before' | 'after' = offsetY < rect.height * 0.5 ? 'before' : 'after';
    const position = dropTarget?.id === targetItem.id ? dropTarget.position : fallbackPosition;

    const parentId = sourceItem.parentId;
    const currentSiblings = parentId
      ? sortByOrder(workItems.filter((w) => w.parentId === parentId))
      : sortByOrder(workItems.filter((w) => !w.parentId));

    const fromIdx = currentSiblings.findIndex((w) => w.id === sourceId);
    const targetIdx = currentSiblings.findIndex((w) => w.id === targetItem.id);
    if (fromIdx < 0 || targetIdx < 0) return;

    // Splice and reorder siblings cleanly
    const reorderedSiblings = [...currentSiblings];
    const [movedItem] = reorderedSiblings.splice(fromIdx, 1);
    const newTargetIdx = reorderedSiblings.findIndex((w) => w.id === targetItem.id);
    const insertIdx = position === 'before' ? newTargetIdx : newTargetIdx + 1;
    reorderedSiblings.splice(insertIdx, 0, movedItem);

    // Assign sequential order indices (1, 2, 3...) to destination group
    const orderMap = new Map<string, number>();
    reorderedSiblings.forEach((item, idx) => orderMap.set(item.id, idx + 1));

    const changedItems: WorkItem[] = [];
    const newWorkItems = workItems.map((w) => {
      if (orderMap.has(w.id)) {
        const nextOrder = orderMap.get(w.id)!;
        if (w.order !== nextOrder) {
          const updated = { ...w, order: nextOrder };
          changedItems.push(updated);
          return updated;
        }
      }
      return w;
    });

    if (changedItems.length === 0) return;

    setSyncStatus('saving');
    try {
      await reorderWorkItems(newWorkItems, changedItems);
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus(null), 2500);
    } catch (_) {
      setSyncStatus(null);
    }
  };

  const renderRow = (item: WorkItem, depth: number) => {
    const children = childrenOf(item.id);
    const isFiltered =
      sprintFilter !== 'All' ||
      searchQuery.trim().length > 0 ||
      typeFilter !== 'All' ||
      stateFilter !== 'All' ||
      assigneeFilter !== 'All';
    const isExpanded =
      expanded[item.id] !== undefined
        ? expanded[item.id]
        : isFiltered && hasMatchingDescendant(item.id);
    const visible = isItemVisible(item);
    if (!visible) return null;

    const isDraggingThis = draggingId === item.id;
    const isTarget = dragOverTarget?.id === item.id;
    const isDropBefore = isTarget && dragOverTarget?.position === 'before';
    const isDropAfter = isTarget && dragOverTarget?.position === 'after';

    return (
      <React.Fragment key={item.id}>
        <div
          onDragOver={(e) => handleDragOver(e, item)}
          onDragLeave={(e) => handleDragLeave(e, item)}
          onDrop={(e) => handleDrop(e, item)}
          onClick={() => setModalItem(item)}
          className={`relative group flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg cursor-pointer border-b transition-all duration-150 select-none ${
            isDraggingThis
              ? 'opacity-30 bg-[#161a26]/40 scale-[0.99] border-[#cda052]/40'
              : 'hover:bg-[#0e121b] border-[#161a26]/60'
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
        >
          {/* Top Drop Insertion Indicator Line */}
          {isDropBefore && (
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#cda052] via-[#f5dfa8] to-[#cda052] z-30 pointer-events-none flex items-center shadow-[0_0_8px_rgba(205,160,82,0.9)]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#cda052] -translate-x-1 ring-2 ring-black" />
            </div>
          )}

          {/* Bottom Drop Insertion Indicator Line */}
          {isDropAfter && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#cda052] via-[#f5dfa8] to-[#cda052] z-30 pointer-events-none flex items-center shadow-[0_0_8px_rgba(205,160,82,0.9)]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#cda052] -translate-x-1 ring-2 ring-black" />
            </div>
          )}

          {/* Dedicated Drag Grip Handle */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            title="Drag to move up or down"
            aria-label="Drag to move item up or down"
            className="flex items-center justify-center p-1.5 rounded-md text-[#8e9cb5] hover:text-[#cda052] hover:bg-[#151c2a] cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* Hierarchy Expand/Collapse toggle */}
          {children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.id);
              }}
              className="text-[#7c869d] hover:text-white flex-shrink-0 transition-colors p-0.5 rounded"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRightIcon className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-3.5 flex-shrink-0" />
          )}

          {/* Item Type Badge */}
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${
              TYPE_COLOR[item.type]
            }`}
          >
            {item.type}
          </span>

          {/* Item Title */}
          <span className="text-xs sm:text-sm text-white truncate flex-1 group-hover:text-[#cda052] transition-colors font-medium">
            {item.title}
          </span>

          {/* Assignee Badge */}
          {item.assignee ? (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(205,160,82,0.14)] dark:bg-[rgba(205,160,82,0.18)] border border-[#cda052]/60 text-[#2b1803] dark:text-[#f5dfa8] text-[10px] font-bold flex-shrink-0"
              title={`Assigned to ${item.assignee}`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-[#cda052] text-black text-[9px] font-black flex items-center justify-center flex-shrink-0">
                {item.assignee[0]?.toUpperCase()}
              </span>
              <span className="font-semibold text-[#2b1803] dark:text-[#f5dfa8] hidden xs:inline">
                {item.assignee}
              </span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#141824]/60 border border-dashed border-[#3d4b66] text-[#828ca1] text-[9px] font-medium flex-shrink-0"
              title="Unassigned item"
            >
              <User className="w-2.5 h-2.5 text-[#64748b]" />
              <span className="hidden xs:inline">Unassigned</span>
            </span>
          )}

          {/* Story Points */}
          {item.storyPoints !== undefined && (
            <span className="text-[10px] font-mono text-[#7c869d] flex-shrink-0">
              {item.storyPoints} pts
            </span>
          )}

          {/* Sprint Name badge: Epics and Features NEVER show a sprint or "Backlog" label! */}
          {item.type !== 'Epic' && item.type !== 'Feature' && (
            <span className="text-[10px] flex-shrink-0 hidden md:inline">
              {item.sprintId ? (
                <span className="px-2 py-0.5 rounded-full bg-sky-950/70 border border-sky-800/60 text-sky-300 font-medium">
                  {sprintName(item.sprintId)}
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-[#141b28] border border-[#232f48] text-[#8e9cb5] font-medium">
                  Backlog
                </span>
              )}
            </span>
          )}

          {/* State Badge */}
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${
              STATE_COLOR[item.state]
            }`}
          >
            {item.state}
          </span>
        </div>

        {/* Child items recursively rendered */}
        {isExpanded && children.map((c) => renderRow(c, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <div>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div>
          <p className="text-xs sm:text-sm text-[#94a3b8]">
            Epics, Features, User Stories, Tasks & Bugs — drag handle to move up or down. Position syncs realtime.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto flex-wrap">
          {/* Realtime Sync Status Indicator */}
          {syncStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b1f2d] border border-[#cda052]/40 text-[#f5dfa8] text-xs font-medium animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#cda052]" />
              Syncing order realtime...
            </span>
          )}
          {syncStatus === 'synced' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 text-xs font-medium transition-all">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Order synced realtime
            </span>
          )}

          <button
            onClick={hasAnyExpanded ? collapseAll : expandAll}
            title={hasAnyExpanded ? 'Collapse all work items' : 'Expand all work items'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0e121b] border border-[#20293d] text-xs text-[#cbd5e1] hover:text-white hover:border-[#cda052]/50 transition-all cursor-pointer"
          >
            {hasAnyExpanded ? (
              <>
                <ChevronRightIcon className="w-3.5 h-3.5 text-[#cda052]" /> Collapse All
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#cda052]" /> Expand All
              </>
            )}
          </button>

          <button
            onClick={() => setModalItem(emptyItem())}
            title="Create a new work item"
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs sm:text-sm font-semibold hover:shadow-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">New Work Item</span>
            <span className="xs:hidden">New Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c869d]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title or tags..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white placeholder:text-[#5f6c85] focus:outline-none focus:border-[#cda052]/50"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
        >
          <option value="All">All Types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as any)}
          className="px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
        >
          <option value="All">All States</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
        >
          <option value="All">All Assignees</option>
          {assigneeOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={sprintFilter}
          onChange={(e) => setSprintFilter(e.target.value)}
          aria-label="Filter by Sprint or Backlog"
          className="px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50 font-medium"
        >
          <option value="All">All Iterations & Backlog</option>
          <option value="backlog">In Backlog ({backlogStoryCount} Stories)</option>
          {sprints.map((s) => {
            const sprintStoryCount = workItems.filter((w) => w.type === 'User Story' && w.sprintId === s.id).length;
            return (
              <option key={s.id} value={s.id}>
                {s.name} ({sprintStoryCount} Stories)
              </option>
            );
          })}
        </select>
      </div>

      {/* Backlog Item List Container */}
      <div className="rounded-2xl border border-[#1a1f2c] bg-[#0a0c12] p-2">
        {topLevel.filter(isItemVisible).length === 0 ? (
          <div className="text-center py-16">
            <ListTree className="w-8 h-8 text-[#3d4658] mx-auto mb-3" />
            <p className="text-sm text-[#94a3b8]">
              {sprintFilter === 'backlog'
                ? 'No user stories found under Backlog.'
                : 'No work items match the selected filter criteria.'}
            </p>
            {(sprintFilter !== 'All' || typeFilter !== 'All' || stateFilter !== 'All' || assigneeFilter !== 'All' || searchQuery) && (
              <button
                onClick={() => {
                  setSprintFilter('All');
                  setTypeFilter('All');
                  setStateFilter('All');
                  setAssigneeFilter('All');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs text-[#cda052] hover:underline font-medium inline-block"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          topLevel.map((item) => renderRow(item, 0))
        )}
      </div>

      {modalItem && <WorkItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
