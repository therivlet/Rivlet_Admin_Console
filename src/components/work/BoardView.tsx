'use client';

import React, { useMemo, useState } from 'react';
import {
  Plus,
  User,
  Flag,
  ListChecks,
  Factory,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  ChevronsUp,
  ChevronsDown,
  ArrowUpDown,
  GripVertical,
  Calendar,
  Clock,
  Shirt,
  Sparkles,
  Layers,
  CheckCircle2,
  Tag,
  ArrowRight,
  Filter,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { WorkItem, WorkItemState, Sprint } from '@/lib/types';
import WorkItemModal, { TYPE_COLOR, STATE_COLOR, PRIORITY_BADGE_COLOR, PRIORITY_LABEL } from '@/components/work/WorkItemModal';
import ModalPortal from '@/components/ui/ModalPortal';
import { notify } from '@/lib/notificationContext';
import { useConfirm } from '@/lib/confirmContext';
import { promptAndCascadeParentClosure } from '@/lib/workCascade';

const COLUMNS: WorkItemState[] = ['New', 'Active', 'In Review', 'Resolved', 'Closed'];
const ROW_TYPES: WorkItem['type'][] = ['User Story', 'Bug'];
const UNPARENTED = '__unparented__';

export const isStoryClosed = (w: WorkItem): boolean => w.state === 'Closed' || w.state === 'Resolved';

export function currentSprintId(sprints: Sprint[]): string | undefined {
  if (!sprints || sprints.length === 0) return undefined;
  const today = new Date().toISOString().slice(0, 10);
  // Find all active sprints covering today's date
  const active = sprints.filter((s) => s.startDate <= today && s.endDate >= today);
  if (active.length > 0) {
    // Sort descending by startDate so the newest active sprint (e.g. Sprint 2) takes precedence over an older overlapping sprint
    active.sort((a, b) => b.startDate.localeCompare(a.startDate));
    return active[0].id;
  }
  // If none active right now, find the nearest upcoming sprint
  const upcoming = [...sprints]
    .filter((s) => s.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  if (upcoming.length > 0) return upcoming[0].id;

  // Otherwise pick the most recently ended sprint
  return [...sprints].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]?.id;
}

// Default is unassigned (not Dasani)
function emptyTask(sprintId?: string, parentId?: string, state?: WorkItemState, nextOrder?: number, taskNumber?: number): Omit<WorkItem, 'createdAt' | 'updatedAt'> {
  return { id: `wi-${Date.now()}`, type: 'Task', title: '', state: state || 'New', priority: 2, tags: [], sprintId, parentId, order: nextOrder || Date.now(), taskNumber, assignee: undefined, comments: [] };
}

function emptyStory(sprintId?: string, nextOrder?: number): Omit<WorkItem, 'createdAt' | 'updatedAt'> {
  return { id: `wi-${Date.now()}`, type: 'User Story', title: '', state: 'New', priority: 2, tags: [], sprintId, order: nextOrder || Date.now(), assignee: undefined, comments: [] };
}

interface BoardViewProps {
  initialSprintId?: string;
}

export default function BoardView({ initialSprintId }: BoardViewProps) {
  const confirm = useConfirm();
  const { workItems, sprints, vendors, teamMembers, pipelineItems, saveWorkItem, reorderWorkItems } = useAdminStore();
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>(() => initialSprintId ?? currentSprintId(sprints));
  const [modalItem, setModalItem] = useState<WorkItem | Omit<WorkItem, 'createdAt' | 'updatedAt'> | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [boardPriorityFilter, setBoardPriorityFilter] = useState<'All' | number>('All');
  const [boardSortBy, setBoardSortBy] = useState<'order' | 'priority' | 'points'>('order');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [collapsedRowIds, setCollapsedRowIds] = useState<Set<string>>(new Set());

  // Drag and drop for stories on the main board
  const [draggingStoryId, setDraggingStoryId] = useState<string | null>(null);
  const [dragOverStoryTarget, setDragOverStoryTarget] = useState<{ id: string; position: 'before' | 'after' } | null>(null);

  // Dedicated Story Reorder Organizer Modal
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [modalStoriesList, setModalStoriesList] = useState<WorkItem[]>([]);
  const [modalDraggingStoryId, setModalDraggingStoryId] = useState<string | null>(null);
  const [modalDragOverId, setModalDragOverId] = useState<string | null>(null);

  // Always keep selected sprint synced with the active sprint based on today's date if not explicitly set
  React.useEffect(() => {
    if (initialSprintId) {
      setSelectedSprintId(initialSprintId);
    } else if (!selectedSprintId || !sprints.some((s) => s.id === selectedSprintId)) {
      const best = currentSprintId(sprints);
      if (best) setSelectedSprintId(best);
    }
  }, [initialSprintId, sprints, selectedSprintId]);

  const toggleRowCollapse = (rowId: string) => {
    setCollapsedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const activeSprintId = selectedSprintId ?? currentSprintId(sprints);
  const sprint = sprints.find((s) => s.id === activeSprintId);

  // Rows (User Stories) in active sprint, sorted by order or priority, with Closed stories always at the bottom
  const rows = useMemo(() => {
    let list = workItems.filter((w) => w.sprintId === activeSprintId && ROW_TYPES.includes(w.type));
    if (boardPriorityFilter !== 'All') {
      list = list.filter((w) => w.priority === boardPriorityFilter);
    }
    if (boardSortBy === 'priority') {
      const active = list.filter((w) => !isStoryClosed(w)).sort((a, b) => a.priority - b.priority);
      const closed = list.filter((w) => isStoryClosed(w)).sort((a, b) => a.priority - b.priority);
      return [...active, ...closed];
    }
    if (boardSortBy === 'points') {
      const active = list.filter((w) => !isStoryClosed(w)).sort((a, b) => (b.storyPoints ?? 0) - (a.storyPoints ?? 0));
      const closed = list.filter((w) => isStoryClosed(w)).sort((a, b) => (b.storyPoints ?? 0) - (a.storyPoints ?? 0));
      return [...active, ...closed];
    }
    // Default custom order: active stories first by order, then closed stories at the bottom by order
    const active = list.filter((w) => !isStoryClosed(w)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const closed = list.filter((w) => isStoryClosed(w)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return [...active, ...closed];
  }, [workItems, activeSprintId, boardPriorityFilter, boardSortBy]);

  // Sync modalStoriesList when modal opens or rows change
  React.useEffect(() => {
    if (showReorderModal) {
      setModalStoriesList([...rows]);
    }
  }, [showReorderModal, rows]);

  // Tasks in active sprint, sorted by order
  const tasksInSprint = useMemo(() => {
    const list = workItems.filter((w) => w.sprintId === activeSprintId && w.type === 'Task');
    return [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [workItems, activeSprintId]);

  // Stable Task Numbering Map across all flow transitions
  const storyTaskNumberMap = useMemo(() => {
    const map = new Map<string, number>();

    const tasksByParent = new Map<string, WorkItem[]>();
    for (const t of tasksInSprint) {
      const parentKey = t.parentId || UNPARENTED;
      if (!tasksByParent.has(parentKey)) {
        tasksByParent.set(parentKey, []);
      }
      tasksByParent.get(parentKey)!.push(t);
    }

    tasksByParent.forEach((tasks) => {
      const sorted = [...tasks].sort((a, b) => {
        if (a.taskNumber && b.taskNumber) return a.taskNumber - b.taskNumber;
        if (a.taskNumber) return -1;
        if (b.taskNumber) return 1;

        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateA !== dateB) return dateA - dateB;

        if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
        return a.id.localeCompare(b.id);
      });

      sorted.forEach((task, idx) => {
        map.set(task.id, task.taskNumber || (idx + 1));
      });
    });

    return map;
  }, [tasksInSprint]);

  const unparentedTasks = useMemo(
    () => tasksInSprint.filter((t) => !t.parentId || !rows.find((r) => r.id === t.parentId)),
    [tasksInSprint, rows]
  );

  const tasksFor = (rowId: string) => {
    const all = rowId === UNPARENTED ? unparentedTasks : tasksInSprint.filter((t) => t.parentId === rowId);
    if (assigneeFilter === 'All') return all;
    if (assigneeFilter === 'Unassigned') return all.filter((t) => !t.assignee || t.assignee.trim() === '');
    return all.filter((t) => t.assignee === assigneeFilter);
  };

  const visibleRowIdsSet = useMemo(() => {
    if (assigneeFilter === 'All') return null;
    if (assigneeFilter === 'Unassigned') {
      return new Set(
        rows
          .filter(
            (r) =>
              !r.assignee ||
              r.assignee.trim() === '' ||
              tasksInSprint.some((t) => t.parentId === r.id && (!t.assignee || t.assignee.trim() === ''))
          )
          .map((r) => r.id)
      );
    }
    return new Set(
      rows.filter((r) => r.assignee === assigneeFilter || tasksInSprint.some((t) => t.parentId === r.id && t.assignee === assigneeFilter)).map((r) => r.id)
    );
  }, [rows, tasksInSprint, assigneeFilter]);

  const totalPoints = [...rows, ...tasksInSprint].reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const donePoints = [...rows, ...tasksInSprint].filter((i) => i.state === 'Closed' || i.state === 'Resolved').reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const doneTasksCount = tasksInSprint.filter((t) => t.state === 'Closed' || t.state === 'Resolved').length;

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>(teamMembers.map((m) => m.name));
    for (const w of [...rows, ...tasksInSprint]) if (w.assignee) names.add(w.assignee);
    return Array.from(names);
  }, [teamMembers, rows, tasksInSprint]);

  // Drag and drop task across state columns or stories
  const handleDrop = async (rowId: string, state: WorkItemState) => {
    if (!draggingId) return;
    const target = workItems.find((w) => w.id === draggingId);
    setDraggingId(null);
    if (!target) return;
    const nextParentId = rowId === UNPARENTED ? undefined : rowId;
    if (target.state === state && target.parentId === nextParentId) return;

    const destTasks = workItems.filter(
      (w) =>
        w.sprintId === activeSprintId &&
        w.type === 'Task' &&
        (rowId === UNPARENTED ? !w.parentId : w.parentId === rowId) &&
        w.state === state
    );
    const maxOrder = destTasks.reduce((max, t) => Math.max(max, t.order ?? 0), 0);

    const updatedTask: WorkItem = {
      ...target,
      state,
      parentId: nextParentId,
      sprintId: activeSprintId,
      order: maxOrder + 1,
      completedDate: (state === 'Closed' || state === 'Resolved') ? (target.completedDate || new Date().toISOString().slice(0, 10)) : target.completedDate,
    };

    await saveWorkItem(updatedTask);

    if (state === 'Closed' || state === 'Resolved') {
      const updatedList = workItems.map((w) => (w.id === updatedTask.id ? updatedTask : w));
      await promptAndCascadeParentClosure({
        itemJustClosed: updatedTask,
        allWorkItems: updatedList,
        confirm,
        saveWorkItem,
      });
    }
  };

  // Move Story to an exact target rank position (0-indexed)
  const handleMoveStoryToPosition = async (storyId: string, targetIdx: number) => {
    const fromIdx = rows.findIndex((r) => r.id === storyId);
    if (fromIdx < 0) return;
    const boundedTargetIdx = Math.max(0, Math.min(rows.length - 1, targetIdx));
    if (fromIdx === boundedTargetIdx) return;

    const newRows = [...rows];
    const [moved] = newRows.splice(fromIdx, 1);
    newRows.splice(boundedTargetIdx, 0, moved);

    // Assign sequential order indices (1, 2, 3...)
    const updatedMap = new Map<string, number>();
    newRows.forEach((r, i) => updatedMap.set(r.id, i + 1));

    const newWorkItems = workItems.map((w) => {
      if (updatedMap.has(w.id)) {
        return { ...w, order: updatedMap.get(w.id) };
      }
      return w;
    });

    await reorderWorkItems(newWorkItems);
  };

  // Move Story by direction: top, up, down, bottom
  const handleMoveStory = async (storyId: string, direction: 'top' | 'up' | 'down' | 'bottom') => {
    const idx = rows.findIndex((r) => r.id === storyId);
    if (idx < 0) return;

    let targetIdx = idx;
    if (direction === 'top') {
      targetIdx = 0;
    } else if (direction === 'up') {
      targetIdx = Math.max(0, idx - 1);
    } else if (direction === 'down') {
      targetIdx = Math.min(rows.length - 1, idx + 1);
    } else if (direction === 'bottom') {
      targetIdx = rows.length - 1;
    }

    if (targetIdx === idx) return;
    await handleMoveStoryToPosition(storyId, targetIdx);
  };

  // Move Task Up or Down within its cell / column
  const handleMoveTask = async (taskId: string, direction: 'up' | 'down', cellTasks: WorkItem[]) => {
    const idx = cellTasks.findIndex((t) => t.id === taskId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= cellTasks.length) return;

    const current = cellTasks[idx];
    const target = cellTasks[targetIdx];

    const updatedCell = [...cellTasks];
    updatedCell[idx] = target;
    updatedCell[targetIdx] = current;

    // Assign sequential order indices (1, 2, 3...) for this cell
    const updatedMap = new Map<string, number>();
    updatedCell.forEach((t, i) => updatedMap.set(t.id, i + 1));

    const newWorkItems = workItems.map((w) => {
      if (updatedMap.has(w.id)) {
        return { ...w, order: updatedMap.get(w.id) };
      }
      return w;
    });

    await reorderWorkItems(newWorkItems);
  };

  // Modal: Move story inside modal preview list
  const handleModalMoveStory = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || toIdx >= modalStoriesList.length) return;
    const next = [...modalStoriesList];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setModalStoriesList(next);
  };

  // Modal Preset: Group by Feature
  const handleSortByFeature = () => {
    const featuresMap = new Map<string, string>();
    for (const w of workItems) {
      if (w.type === 'Feature') featuresMap.set(w.id, w.title);
    }

    const sorted = [...modalStoriesList].sort((a, b) => {
      const aClosed = isStoryClosed(a);
      const bClosed = isStoryClosed(b);
      if (aClosed !== bClosed) return aClosed ? 1 : -1;

      const featA = a.parentId ? featuresMap.get(a.parentId) || a.parentId : 'zzz_no_feature';
      const featB = b.parentId ? featuresMap.get(b.parentId) || b.parentId : 'zzz_no_feature';
      if (featA !== featB) return featA.localeCompare(featB);

      return (a.order ?? 0) - (b.order ?? 0);
    });
    setModalStoriesList(sorted);
    notify.info('Stories grouped by feature');
  };

  // Modal Preset: Sort by Priority
  const handleSortByPriority = () => {
    const sorted = [...modalStoriesList].sort((a, b) => {
      const aClosed = isStoryClosed(a);
      const bClosed = isStoryClosed(b);
      if (aClosed !== bClosed) return aClosed ? 1 : -1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return (a.order ?? 0) - (b.order ?? 0);
    });
    setModalStoriesList(sorted);
    notify.info('Stories ordered by priority (P1 → P4)');
  };

  // Modal Preset: Move Closed to Bottom
  const handleMoveClosedToBottom = () => {
    const active = modalStoriesList.filter((s) => !isStoryClosed(s));
    const closed = modalStoriesList.filter((s) => isStoryClosed(s));
    setModalStoriesList([...active, ...closed]);
    notify.info('Closed stories moved to bottom');
  };

  // Modal: Apply and Save
  const handleApplyModalReorder = async () => {
    const updatedMap = new Map<string, number>();
    modalStoriesList.forEach((r, i) => updatedMap.set(r.id, i + 1));

    const newWorkItems = workItems.map((w) => {
      if (updatedMap.has(w.id)) {
        return { ...w, order: updatedMap.get(w.id) };
      }
      return w;
    });

    await reorderWorkItems(newWorkItems);
    setShowReorderModal(false);
    notify.success(`Saved new arrangement for ${modalStoriesList.length} stories`);
  };

  const filteredRows = visibleRowIdsSet ? rows.filter((r) => visibleRowIdsSet.has(r.id)) : rows;
  const filteredUnparented =
    assigneeFilter === 'All'
      ? unparentedTasks
      : assigneeFilter === 'Unassigned'
      ? unparentedTasks.filter((t) => !t.assignee || t.assignee.trim() === '')
      : unparentedTasks.filter((t) => t.assignee === assigneeFilter);
  const rowIds = [...filteredRows.map((r) => r.id), ...(filteredUnparented.length > 0 ? [UNPARENTED] : [])];

  const allCollapsed = rowIds.length > 0 && collapsedRowIds.size >= rowIds.length;
  const handleToggleAllCollapse = () => {
    if (allCollapsed) {
      setCollapsedRowIds(new Set());
    } else {
      setCollapsedRowIds(new Set(rowIds));
    }
  };

  // Sprint days remaining calculation
  const sprintDaysLeft = useMemo(() => {
    if (!sprint) return null;
    const today = new Date();
    const end = new Date(sprint.endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [sprint]);

  const completionPct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#0a0d14] p-3.5 rounded-2xl border border-[#1a2233]">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs text-[#7c869d] font-semibold uppercase tracking-wider">Sprint:</label>
          <select
            value={activeSprintId || ''}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0e121b] border border-[#222c42] text-sm font-semibold text-white focus:outline-none focus:border-[#cda052]/50"
          >
            {sprints.length === 0 && <option value="">No sprints yet</option>}
            {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            title="Filter by assignee"
            className="px-3 py-2 rounded-xl bg-[#0e121b] border border-[#222c42] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
          >
            <option value="All">All Assignees</option>
            <option value="Unassigned">Unassigned</option>
            {assigneeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 flex-shrink-0">
          {rowIds.length > 0 && (
            <button
              onClick={handleToggleAllCollapse}
              title={allCollapsed ? "Expand all story swimlanes" : "Collapse all story swimlanes"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] border border-[#263148] text-[#cbd5e1] text-xs font-semibold hover:text-white hover:border-[#cda052]/50 transition-all cursor-pointer shadow-sm"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 text-[#cda052]" />
              <span>{allCollapsed ? 'Expand All' : 'Collapse All'}</span>
            </button>
          )}

          {rows.length > 1 && (
            <button
              onClick={() => setShowReorderModal(true)}
              title="Open high-speed story organizer to rearrange all stories at once"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] border border-[#cda052]/40 text-[#f5dfa8] text-xs font-semibold hover:border-[#cda052] hover:bg-[#1a2133] transition-all cursor-pointer shadow-sm"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#cda052]" />
              <span>Reorder Stories ({rows.length})</span>
            </button>
          )}

          <button
            onClick={() => setModalItem(emptyStory(activeSprintId, rows.length + 1))}
            disabled={!activeSprintId}
            title="Add a User Story to this sprint"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141824] border border-[#263148] text-[#cbd5e1] text-xs font-semibold hover:text-white transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Story
          </button>
          <button
            onClick={() => setModalItem(emptyTask(activeSprintId, undefined, 'New', tasksInSprint.length + 1))}
            disabled={!activeSprintId}
            title="Add a standalone task to this sprint"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs font-bold hover:shadow-glow transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Task
          </button>
        </div>
      </div>

      {/* Rich Sprint Board Details Bar */}
      {sprint && (
        <div className="rounded-2xl border border-[#1c2438] bg-gradient-to-r from-[#0d121c] via-[#0f1524] to-[#0d121c] p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#cda052]" /> {sprint.name}
                </h2>
                {sprintDaysLeft !== null && (
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-semibold ${
                    sprintDaysLeft > 0
                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                      : 'bg-slate-900/60 text-slate-400 border-slate-700/60'
                  }`}>
                    {sprintDaysLeft > 0 ? `${sprintDaysLeft} days remaining` : 'Sprint Closed'}
                  </span>
                )}
                <span className="text-xs text-[#64748b]">
                  {new Date(sprint.startDate).toLocaleDateString()} → {new Date(sprint.endDate).toLocaleDateString()}
                </span>
              </div>
              {sprint.goal && (
                <p className="text-xs text-[#94a3b8] italic pl-6">
                  Goal: {sprint.goal}
                </p>
              )}
            </div>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5">
              <div className="px-3 py-1.5 rounded-xl bg-[#080b11] border border-[#1d263b] text-center">
                <span className="text-[10px] text-[#64748b] block font-medium uppercase">Stories</span>
                <span className="text-xs font-bold text-white">{rows.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#080b11] border border-[#1d263b] text-center">
                <span className="text-[10px] text-[#64748b] block font-medium uppercase">Tasks</span>
                <span className="text-xs font-bold text-white">{tasksInSprint.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#080b11] border border-[#1d263b] text-center">
                <span className="text-[10px] text-[#64748b] block font-medium uppercase">Tasks Done</span>
                <span className="text-xs font-bold text-emerald-400">{doneTasksCount}/{tasksInSprint.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#080b11] border border-[#1d263b] text-center">
                <span className="text-[10px] text-[#64748b] block font-medium uppercase">Points</span>
                <span className="text-xs font-bold text-[#cda052]">{donePoints}/{totalPoints} pts</span>
              </div>
            </div>
          </div>

          {/* Progress Bar with Points & Percentage */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] text-[#94a3b8]">
              <span>Sprint Velocity & Progress</span>
              <span className="font-semibold text-white">{completionPct}% Completed</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#141a28] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#cda052] via-emerald-400 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {!activeSprintId ? (
        <div className="text-center py-16 border border-dashed border-[#1f2638] rounded-2xl">
          <p className="text-sm text-[#94a3b8]">Create a sprint first, then assign stories and tasks to it.</p>
        </div>
      ) : rowIds.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#1f2638] rounded-2xl">
          <p className="text-sm text-[#94a3b8]">No User Stories or Bugs in this sprint yet. Add one, or assign one from the Backlog tab.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="sm:hidden flex items-center gap-1.5 text-[11px] text-[#8e9cb5] px-1">
            <ArrowRight className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0" />
            <span>Swipe horizontally to view all Kanban swimlane columns</span>
          </div>
          <div className="relative max-h-[calc(100vh-140px)] min-h-[500px] overflow-auto rounded-2xl border border-[#1a2335] bg-[#07090e]/95 custom-scrollbar pb-6 shadow-2xl">
            <div className="grid gap-2 p-3 min-w-max" style={{ gridTemplateColumns: `340px repeat(${COLUMNS.length}, minmax(220px, 1fr))` }}>
              {/* Header row */}
              <div className="text-[11px] font-bold text-[#cda052] uppercase tracking-wider px-3.5 py-2.5 sticky top-0 md:left-0 z-30 md:z-40 bg-[#0a0d14]/98 backdrop-blur-md rounded-xl border border-[#232d44] shadow-md flex items-center justify-between relative">
                <span className="flex items-center gap-1.5 truncate"><Layers className="w-3.5 h-3.5 text-[#cda052]" /> Stories & Milestones</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161c2b] text-[#94a3b8] border border-[#232d44]">{rows.length}</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                      title="Filter & sort sprint stories"
                      className={`p-1 rounded-md border text-[10px] transition-all flex items-center gap-1 cursor-pointer ${
                        boardPriorityFilter !== 'All' || boardSortBy !== 'order'
                          ? 'bg-[#cda052]/20 border-[#cda052] text-[#cda052]'
                          : 'bg-[#141824] border-[#263148] text-[#8e9ab5] hover:text-white hover:border-[#384664]'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      {(boardPriorityFilter !== 'All' || boardSortBy !== 'order') && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#cda052]" />
                      )}
                    </button>

                    {isFilterDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#0d101a] border border-[#232d44] rounded-xl shadow-2xl p-2.5 z-50 text-left normal-case font-normal space-y-2">
                        <div>
                          <span className="text-[10px] text-[#64748b] font-semibold uppercase block mb-1">Priority</span>
                          <div className="flex items-center gap-1">
                            {['All', 1, 2, 3].map((p) => (
                              <button
                                key={p}
                                onClick={() => setBoardPriorityFilter(p as any)}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                  boardPriorityFilter === p
                                    ? 'bg-[#cda052]/20 border-[#cda052] text-[#cda052]'
                                    : 'bg-[#141824] border-[#222c42] text-[#8e9ab5] hover:text-white'
                                }`}
                              >
                                {p === 'All' ? 'All' : `P${p}`}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-[#64748b] font-semibold uppercase block mb-1">Sort Stories</span>
                          <select
                            value={boardSortBy}
                            onChange={(e) => setBoardSortBy(e.target.value as any)}
                            className="w-full px-2 py-1 bg-[#141824] border border-[#222c42] rounded text-[11px] text-white focus:outline-none"
                          >
                            <option value="order">Custom Order</option>
                            <option value="priority">Priority (P1 → P4)</option>
                            <option value="points">Points (High → Low)</option>
                          </select>
                        </div>

                        {(boardPriorityFilter !== 'All' || boardSortBy !== 'order') && (
                          <button
                            onClick={() => {
                              setBoardPriorityFilter('All');
                              setBoardSortBy('order');
                              setIsFilterDropdownOpen(false);
                            }}
                            className="text-[10px] text-amber-400 hover:underline pt-1 block"
                          >
                            Reset filter
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            {COLUMNS.map((col) => {
              const colTasksCount = tasksInSprint.filter((t) => t.state === col).length;
              const dotColor =
                col === 'New' ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]' :
                col === 'Active' ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]' :
                col === 'In Review' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' :
                col === 'Resolved' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                'bg-slate-400';

              return (
                <div
                  key={col}
                  className="text-[11px] font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl bg-[#0a0d14]/98 backdrop-blur-md sticky top-0 z-30 text-center border border-[#232d44] shadow-md flex items-center justify-between gap-1 select-none"
                >
                  <span className="flex items-center gap-1.5 text-white">
                    <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                    {col}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#161c2b] text-[#cbd5e1] border border-[#283550]">
                    {colTasksCount}
                  </span>
                </div>
              );
            })}

            {rowIds.map((rowId, rowIdx) => {
              const row = rowId === UNPARENTED ? null : rows.find((r) => r.id === rowId)!;
              const rowTasks = tasksFor(rowId);
              const doneCount = rowTasks.filter((t) => t.state === 'Closed' || t.state === 'Resolved').length;
              const storyIdx = row ? rows.findIndex((r) => r.id === row.id) : -1;
              const storyNumber = storyIdx + 1;
              const isCollapsed = collapsedRowIds.has(rowId);
              const isClosed = row ? isStoryClosed(row) : false;
              const isFirstClosed = row && isClosed && rows.slice(0, storyIdx).every((prev) => !isStoryClosed(prev));
              const closedStoriesCount = rows.filter(isStoryClosed).length;
              const isDraggingThisStory = draggingStoryId === rowId;
              const isDropTarget = dragOverStoryTarget?.id === rowId;

              return (
                <React.Fragment key={rowId}>
                  {/* Closed Stories Visual Divider Banner */}
                  {isFirstClosed && (
                    <div
                      style={{ gridColumn: '1 / -1' }}
                      className="py-2.5 px-4 my-1 rounded-xl border border-dashed border-[#232d44] bg-[#0c1018]/90 backdrop-blur-sm flex items-center justify-between text-xs text-[#8e9cb5] shadow-inner select-none"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                          Closed & Completed Stories ({closedStoriesCount})
                        </span>
                        <span className="text-[10px] text-[#64748b]">
                          — Automatically organized to bottom for sprint focus
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                        Finished
                      </span>
                    </div>
                  )}

                  {/* Story / Row Header Cell */}
                  {isCollapsed ? (
                    /* COLLAPSED STORY CELL (Full story name, sprint & fast reorder controls) */
                    <div
                      draggable={!!row}
                      onDragStart={(e) => {
                        if (!row) return;
                        e.dataTransfer.setData('text/story-id', row.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggingStoryId(row.id);
                      }}
                      onDragEnd={() => {
                        setDraggingStoryId(null);
                        setDragOverStoryTarget(null);
                      }}
                      onDragOver={(e) => {
                        if (!draggingStoryId || draggingStoryId === rowId) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const midY = rect.top + rect.height / 2;
                        const position = e.clientY < midY ? 'before' : 'after';
                        setDragOverStoryTarget({ id: rowId, position });
                      }}
                      onDragLeave={() => {
                        if (dragOverStoryTarget?.id === rowId) setDragOverStoryTarget(null);
                      }}
                      onDrop={(e) => {
                        if (!row) return;
                        const sourceId = e.dataTransfer.getData('text/story-id') || draggingStoryId;
                        if (!sourceId || sourceId === row.id) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const fromIdx = rows.findIndex((r) => r.id === sourceId);
                        let toIdx = rows.findIndex((r) => r.id === row.id);
                        if (fromIdx < 0 || toIdx < 0) return;
                        if (dragOverStoryTarget?.position === 'after' && toIdx < fromIdx) toIdx += 1;
                        else if (dragOverStoryTarget?.position === 'before' && toIdx > fromIdx) toIdx -= 1;
                        handleMoveStoryToPosition(sourceId, toIdx);
                        setDraggingStoryId(null);
                        setDragOverStoryTarget(null);
                      }}
                      onClick={() => row && setModalItem(row)}
                      className={`relative rounded-xl border p-3 flex flex-col justify-between transition-all min-h-[84px] select-none md:sticky md:left-0 md:z-20 ${
                        isDraggingThisStory ? 'opacity-40 border-[#cda052] border-dashed' : ''
                      } ${
                        row
                          ? isClosed
                            ? 'border-[#1a2233] bg-[#090c13] opacity-80 cursor-pointer hover:border-[#2a3854] shadow-sm'
                            : 'border-[#1f2638] bg-[#0c1018] cursor-pointer hover:border-[#33415c] shadow-sm'
                          : 'border-dashed border-[#263148] bg-[#0c1018]'
                      }`}
                    >
                      {/* Drop indicator line */}
                      {isDropTarget && (
                        <div
                          className={`absolute left-0 right-0 h-1 bg-[#cda052] shadow-[0_0_8px_#cda052] z-30 pointer-events-none rounded ${
                            dragOverStoryTarget.position === 'before' ? '-top-1' : '-bottom-1'
                          }`}
                        />
                      )}

                      {row ? (
                        <>
                          <div className="space-y-1.5">
                            {/* Top row: Chevron expand button, Story badge, Type, State badge, and Reorder Controls */}
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowCollapse(rowId);
                                  }}
                                  title="Expand story swimlane"
                                  className="p-1 rounded-md bg-[#141824] border border-[#263148] text-[#cda052] hover:bg-[#1f273b] hover:text-white transition-colors flex-shrink-0 cursor-pointer"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/40 flex-shrink-0">
                                  Story #{storyNumber}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold flex-shrink-0 ${TYPE_COLOR[row.type]}`}>
                                  {row.type}
                                </span>
                                <span className={`text-[8px] px-1.5 py-0.2 rounded border font-medium flex-shrink-0 ${STATE_COLOR[row.state]}`}>
                                  {row.state}
                                </span>
                              </div>

                              {/* Story Fast Reorder Controls */}
                              <div
                                className="flex items-center gap-0.5 bg-[#07090e] p-0.5 rounded-lg border border-[#1a2335] shadow-sm flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span
                                  title="Drag story to reorder"
                                  className="p-1 text-[#54627a] hover:text-[#cda052] cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </span>

                                <button
                                  onClick={() => handleMoveStory(row.id, 'top')}
                                  disabled={storyIdx === 0}
                                  title="Jump to Top (#1)"
                                  className="p-1 rounded text-[#7c869d] hover:text-[#cda052] hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                                >
                                  <ChevronsUp className="w-3 h-3" />
                                </button>

                                <button
                                  onClick={() => handleMoveStory(row.id, 'up')}
                                  disabled={storyIdx === 0}
                                  title="Move Up 1 spot"
                                  className="p-1 rounded text-[#7c869d] hover:text-white hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>

                                <select
                                  value={storyNumber}
                                  onChange={(e) => handleMoveStoryToPosition(row.id, parseInt(e.target.value) - 1)}
                                  title="Jump directly to position"
                                  className="bg-[#121724] border border-[#232e44] text-[10px] font-mono text-[#cda052] font-bold rounded px-1 py-0.5 hover:border-[#cda052]/50 focus:outline-none cursor-pointer"
                                >
                                  {rows.map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                      #{i + 1}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => handleMoveStory(row.id, 'down')}
                                  disabled={storyIdx === rows.length - 1}
                                  title="Move Down 1 spot"
                                  className="p-1 rounded text-[#7c869d] hover:text-white hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>

                                <button
                                  onClick={() => handleMoveStory(row.id, 'bottom')}
                                  disabled={storyIdx === rows.length - 1}
                                  title="Jump to Bottom"
                                  className="p-1 rounded text-[#7c869d] hover:text-[#cda052] hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                                >
                                  <ChevronsDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Full Story Name - clearly readable, not truncated */}
                            <p className="text-xs font-bold text-white leading-snug break-words" title={row.title}>
                              <span className="text-[#cda052] font-mono font-bold mr-1">#{storyNumber}</span>
                              {row.title}
                            </p>

                            {/* Parent Feature & Extra Attributes */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {row.parentId && (() => {
                                const parentFeature = workItems.find((w) => w.id === row.parentId);
                                return parentFeature ? (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalItem(parentFeature);
                                    }}
                                    className="text-[8px] px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800/50 text-purple-300 font-semibold flex items-center gap-1 hover:border-purple-600 transition-colors"
                                    title={`Parent Feature: ${parentFeature.title}. Click to view.`}
                                  >
                                    <Layers className="w-2.5 h-2.5 text-[#cda052]" /> {parentFeature.title}
                                  </span>
                                ) : null;
                              })()}
                            </div>

                            {/* Sprint Name, Assignee & Operations Info */}
                            <div className="flex items-center gap-2 text-[9px] text-[#7c869d] pt-1 flex-wrap">
                              {sprint && (
                                <span className="flex items-center gap-1 text-[#a5b4fc] font-medium">
                                  <Calendar className="w-2.5 h-2.5 text-[#cda052]" /> {sprint.name}
                                </span>
                              )}
                              {row.assignee ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[rgba(205,160,82,0.14)] dark:bg-[rgba(205,160,82,0.18)] border border-[#cda052]/60 text-[#2b1803] dark:text-[#f5dfa8] text-[9px] font-bold" title={`Assigned to ${row.assignee}`}>
                                  <span className="w-3 h-3 rounded-full bg-[#cda052] text-black text-[8px] font-black flex items-center justify-center">
                                    {row.assignee[0]?.toUpperCase()}
                                  </span>
                                  <span className="font-semibold text-[#2b1803] dark:text-[#f5dfa8]">{row.assignee}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#141824]/60 border border-dashed border-[#3d4b66] text-[#828ca1] text-[9px] font-medium">
                                  <User className="w-2 h-2 text-[#64748b]" />
                                  <span>Unassigned</span>
                                </span>
                              )}

                              {rowTasks.length > 0 && (
                                <span className="text-[10px] font-mono text-[#7c869d] flex items-center gap-1 ml-auto">
                                  <ListChecks className="w-2.5 h-2.5 text-[#cda052]" /> {doneCount}/{rowTasks.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowCollapse(rowId);
                              }}
                              title="Expand unparented tasks"
                              className="p-1 rounded-md bg-[#141824] border border-[#263148] text-[#cda052] hover:bg-[#1f273b] hover:text-white transition-colors cursor-pointer"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <p className="text-xs text-[#7c869d] font-semibold italic">Unparented tasks</p>
                          </div>
                          <span className="text-[10px] font-mono text-[#7c869d]">{rowTasks.length} tasks</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* EXPANDED STORY CELL */
                    <div
                      draggable={!!row}
                      onDragStart={(e) => {
                        if (!row) return;
                        e.dataTransfer.setData('text/story-id', row.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggingStoryId(row.id);
                      }}
                      onDragEnd={() => {
                        setDraggingStoryId(null);
                        setDragOverStoryTarget(null);
                      }}
                      onDragOver={(e) => {
                        if (!draggingStoryId || draggingStoryId === rowId) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const midY = rect.top + rect.height / 2;
                        const position = e.clientY < midY ? 'before' : 'after';
                        setDragOverStoryTarget({ id: rowId, position });
                      }}
                      onDragLeave={() => {
                        if (dragOverStoryTarget?.id === rowId) setDragOverStoryTarget(null);
                      }}
                      onDrop={(e) => {
                        if (!row) return;
                        const sourceId = e.dataTransfer.getData('text/story-id') || draggingStoryId;
                        if (!sourceId || sourceId === row.id) return;
                        e.preventDefault();
                        e.stopPropagation();
                        const fromIdx = rows.findIndex((r) => r.id === sourceId);
                        let toIdx = rows.findIndex((r) => r.id === row.id);
                        if (fromIdx < 0 || toIdx < 0) return;
                        if (dragOverStoryTarget?.position === 'after' && toIdx < fromIdx) toIdx += 1;
                        else if (dragOverStoryTarget?.position === 'before' && toIdx > fromIdx) toIdx -= 1;
                        handleMoveStoryToPosition(sourceId, toIdx);
                        setDraggingStoryId(null);
                        setDragOverStoryTarget(null);
                      }}
                      onClick={() => row && setModalItem(row)}
                      className={`relative rounded-xl border p-3 flex flex-col justify-between transition-all select-none md:sticky md:left-0 md:z-20 ${
                        isDraggingThisStory ? 'opacity-40 border-[#cda052] border-dashed' : ''
                      } ${
                        row
                          ? isClosed
                            ? 'border-[#1a2233] bg-[#090c13] opacity-80 cursor-pointer hover:border-[#2a3854] shadow-sm'
                            : 'border-[#1f2638] bg-[#0c1018] cursor-pointer hover:border-[#33415c] shadow-sm'
                          : 'border-dashed border-[#263148] bg-[#0c1018]'
                      }`}
                    >
                      {/* Drop indicator line */}
                      {isDropTarget && (
                        <div
                          className={`absolute left-0 right-0 h-1 bg-[#cda052] shadow-[0_0_8px_#cda052] z-30 pointer-events-none rounded ${
                            dragOverStoryTarget.position === 'before' ? '-top-1' : '-bottom-1'
                          }`}
                        />
                      )}

                      {row ? (
                        <>
                          <div className="space-y-1.5">
                            {/* Top controls: Collapse button, type, priority, and Move Up / Down buttons */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {/* Collapse Icon */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowCollapse(rowId);
                                  }}
                                  title="Collapse story swimlane"
                                  className="p-1 rounded-md bg-[#141824] border border-[#263148] text-[#cda052] hover:bg-[#1f273b] hover:text-white transition-colors flex-shrink-0 cursor-pointer"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>

                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/40 shadow-sm flex items-center gap-1 flex-shrink-0">
                                  Story #{storyNumber}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${TYPE_COLOR[row.type]}`}>
                                  {row.type}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${PRIORITY_BADGE_COLOR[row.priority]}`}>
                                  P{row.priority}
                                </span>
                                {row.storyPoints !== undefined && (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#131b2c] text-[#cbd5e1] border border-[#20293d]">
                                    {row.storyPoints} pts
                                  </span>
                                )}
                              </div>

                              {/* Story Fast Reorder Controls */}
                              <div
                                className="flex items-center gap-0.5 bg-[#07090e] p-0.5 rounded-lg border border-[#1a2335] shadow-sm flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span
                                  title="Drag story to reorder"
                                  className="p-1 text-[#54627a] hover:text-[#cda052] cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </span>

                                <button
                                  onClick={() => handleMoveStory(row.id, 'top')}
                                  disabled={storyIdx === 0}
                                  title="Jump to Top (#1)"
                                  className="p-1 rounded text-[#7c869d] hover:text-[#cda052] hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                                >
                                  <ChevronsUp className="w-3 h-3" />
                                </button>

                                <button
                                  onClick={() => handleMoveStory(row.id, 'up')}
                                  disabled={storyIdx === 0}
                                  title="Move Up 1 spot"
                                  className="p-1 rounded text-[#7c869d] hover:text-white hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>

                                <select
                                  value={storyNumber}
                                  onChange={(e) => handleMoveStoryToPosition(row.id, parseInt(e.target.value) - 1)}
                                  title="Jump directly to position"
                                  className="bg-[#121724] border border-[#232e44] text-[10px] font-mono text-[#cda052] font-bold rounded px-1 py-0.5 hover:border-[#cda052]/50 focus:outline-none cursor-pointer"
                                >
                                  {rows.map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                      #{i + 1}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  onClick={() => handleMoveStory(row.id, 'down')}
                                  disabled={storyIdx === rows.length - 1}
                                  title="Move Down 1 spot"
                                  className="p-1 rounded text-[#7c869d] hover:text-white hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>

                                <button
                                  onClick={() => handleMoveStory(row.id, 'bottom')}
                                  disabled={storyIdx === rows.length - 1}
                                  title="Jump to Bottom"
                                  className="p-1 rounded text-[#7c869d] hover:text-[#cda052] hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                                >
                                  <ChevronsDown className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-white leading-snug flex items-start gap-1.5">
                              <span className="text-[#cda052] font-mono font-bold text-xs flex-shrink-0">#{storyNumber}</span>
                              <span>{row.title}</span>
                            </p>

                            {/* Extra Story Details on Board */}
                            <div className="flex items-center gap-1 flex-wrap pt-1">
                              {/* Parent Feature if linked */}
                              {row.parentId && (() => {
                                const parentFeature = workItems.find((w) => w.id === row.parentId);
                                return parentFeature ? (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalItem(parentFeature);
                                    }}
                                    className="text-[8px] px-1.5 py-0.5 rounded bg-purple-950/70 border border-purple-800/50 text-purple-300 font-semibold flex items-center gap-1 hover:border-purple-600 transition-colors cursor-pointer"
                                    title={`Parent Feature: ${parentFeature.title}. Click to view.`}
                                  >
                                    <Layers className="w-2.5 h-2.5 text-[#cda052]" /> {parentFeature.title}
                                  </span>
                                ) : null;
                              })()}

                              {row.linkedPipelineItemIds?.includes('all') ? (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 font-semibold flex items-center gap-0.5">
                                  <Shirt className="w-2.5 h-2.5" /> All Styles
                                </span>
                              ) : row.linkedPipelineItemIds && row.linkedPipelineItemIds.length > 0 ? (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#161c28] border border-[#252f44] text-[#cbd5e1] font-medium flex items-center gap-0.5">
                                  <Shirt className="w-2.5 h-2.5" /> {row.linkedPipelineItemIds.length} Styles
                                </span>
                              ) : null}

                            </div>
                          </div>

                          {/* Bottom Row Attributes */}
                          <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#171d2b]">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${STATE_COLOR[row.state]}`}>
                              {row.state}
                            </span>

                            <div className="flex items-center gap-2">
                              {/* Assignee pill - Highlighted & Readable */}
                              {row.assignee ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(205,160,82,0.14)] dark:bg-[rgba(205,160,82,0.18)] border border-[#cda052]/60 text-[#2b1803] dark:text-[#f5dfa8] text-[10px] font-bold shadow-sm" title={`Assigned to ${row.assignee}`}>
                                  <span className="w-3.5 h-3.5 rounded-full bg-[#cda052] text-black text-[9px] font-black flex items-center justify-center flex-shrink-0">
                                    {row.assignee[0]?.toUpperCase()}
                                  </span>
                                  <span className="font-semibold text-[#2b1803] dark:text-[#f5dfa8]">{row.assignee}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#141824]/80 border border-dashed border-[#3d4b66] text-[#828ca1] text-[9px] font-medium" title="Unassigned story">
                                  <User className="w-2.5 h-2.5 text-[#64748b]" />
                                  <span>Unassigned</span>
                                </span>
                              )}

                              {rowTasks.length > 0 && (
                                <span className="text-[10px] font-mono text-[#7c869d] flex items-center gap-1">
                                  <ListChecks className="w-2.5 h-2.5 text-[#cda052]" /> {doneCount}/{rowTasks.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowCollapse(rowId);
                              }}
                              title="Collapse unparented tasks"
                              className="p-1 rounded-md bg-[#141824] border border-[#263148] text-[#cda052] hover:bg-[#1f273b] hover:text-white transition-colors cursor-pointer"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <p className="text-[11px] text-[#7c869d] italic">Unparented tasks</p>
                          </div>
                          <span className="text-[10px] font-mono text-[#7c869d]">{rowTasks.length} tasks</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Task Cells per State Column */}
                  {COLUMNS.map((col) => {
                    const cellTasks = [...rowTasks.filter((t) => t.state === col)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

                    if (isCollapsed) {
                      return (
                        <div
                          key={col}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDrop(rowId, col)}
                          onClick={() => toggleRowCollapse(rowId)}
                          title={`${cellTasks.length} task${cellTasks.length === 1 ? '' : 's'} in ${col}. Click to expand.`}
                          className="rounded-xl border border-[#161a26] bg-[#07090e]/60 p-2 flex flex-col items-center justify-center min-h-[78px] cursor-pointer hover:border-[#2b3956] transition-colors"
                        >
                          {cellTasks.length > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-[#121724] border border-[#232e44] text-[#cbd5e1] hover:text-white flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#cda052]" />
                                {cellTasks.length} {cellTasks.length === 1 ? 'task' : 'tasks'}
                              </span>
                              <span className="text-[8px] text-[#64748b]">expand story</span>
                            </div>
                          ) : (
                            <span className="text-[#3b4760] text-sm font-mono select-none"> - </span>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={col}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(rowId, col)}
                        className="rounded-xl border border-[#161a26] bg-[#07090e] p-1.5 space-y-1.5 min-h-[70px]"
                      >
                        {cellTasks.map((task, taskIdx) => {
                          const taskNumber = storyTaskNumberMap.get(task.id) || (taskIdx + 1);
                          const linkedVendor = task.linkedVendorId ? vendors.find((v) => v.id === task.linkedVendorId) : undefined;

                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => setDraggingId(task.id)}
                              onDragEnd={() => setDraggingId(null)}
                              onClick={() => setModalItem(task)}
                              className={`rounded-lg border border-[#1f2638] bg-[#0e121b] p-2.5 cursor-grab active:cursor-grabbing hover:border-[#33425f] transition-all shadow-sm flex flex-col ${
                                draggingId === task.id ? 'opacity-40' : ''
                              }`}
                            >
                              {/* Top Task Header: Priority flag, Type, Points & Move Up/Down buttons */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/40 shadow-sm flex items-center gap-0.5 flex-shrink-0">
                                    Task #{taskNumber}
                                  </span>
                                  <span className={`text-[8px] px-1 py-0.2 rounded border font-semibold ${TYPE_COLOR[task.type]}`}>
                                    {task.type}
                                  </span>
                                  {task.priority <= 2 && (
                                    <Flag className={`w-2.5 h-2.5 ${task.priority === 1 ? 'text-rose-400' : 'text-amber-400'}`} />
                                  )}
                                  {task.storyPoints !== undefined && (
                                    <span className="text-[8px] font-mono text-[#8594ab]">
                                      {task.storyPoints} pt{task.storyPoints === 1 ? '' : 's'}
                                    </span>
                                  )}
                                </div>

                                {/* Task Move Up / Down Buttons */}
                                <div
                                  className="flex items-center gap-0.5 bg-[#080b11] rounded border border-[#1b2336]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => handleMoveTask(task.id, 'up', cellTasks)}
                                    disabled={taskIdx === 0}
                                    title={`Move Task #${taskNumber} Up`}
                                    className="p-0.5 rounded text-[#64748b] hover:text-white hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveTask(task.id, 'down', cellTasks)}
                                    disabled={taskIdx === cellTasks.length - 1}
                                    title={`Move Task #${taskNumber} Down`}
                                    className="p-0.5 rounded text-[#64748b] hover:text-white hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-[11px] font-medium text-white leading-snug flex items-start gap-1">
                                <span className="text-[#cda052] font-mono font-bold text-[10px] flex-shrink-0">#{taskNumber}</span>
                                <span>{task.title}</span>
                              </p>

                              {/* Task Metadata: Manufacturer & Operation */}
                              {linkedVendor && (
                                <p className="text-[9px] text-amber-300/80 flex items-center gap-0.5 mt-1 truncate">
                                  <Factory className="w-2 h-2 text-amber-400" /> {linkedVendor.name}
                                </p>
                              )}
                              {/* Task Footer: Assignee & Story/Task code aligned cleanly at the bottom */}
                              <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1a2336] text-[10px]">
                                {task.assignee ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[rgba(205,160,82,0.14)] dark:bg-gradient-to-r dark:from-[rgba(205,160,82,0.22)] dark:to-[rgba(205,160,82,0.1)] border border-[#cda052]/60 text-[#2b1803] dark:text-[#f5dfa8] font-bold text-[10px] shadow-sm max-w-[145px]" title={`Assigned to ${task.assignee}`}>
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#cda052] text-black text-[9px] font-black flex items-center justify-center flex-shrink-0">
                                      {task.assignee[0]?.toUpperCase()}
                                    </span>
                                    <span className="truncate font-semibold text-[#2b1803] dark:text-[#f5dfa8]">{task.assignee}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#121622]/80 border border-dashed border-[#3d4b66] text-[#828ca1] text-[9px] font-medium" title="Unassigned task">
                                    <User className="w-2.5 h-2.5 text-[#64748b]" />
                                    <span>Unassigned</span>
                                  </span>
                                )}
                                <div className="flex items-center gap-1 font-mono text-[8px] text-[#64748b] flex-shrink-0">
                                  {row && <span className="text-[#cda052]/80 font-bold">S{storyNumber}</span>}
                                  <span>{task.id.slice(-4)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {col === 'New' && (
                          <button
                            onClick={() => {
                              const nextNum = rowTasks.length + 1;
                              setModalItem(emptyTask(activeSprintId, rowId === UNPARENTED ? undefined : rowId, col, nextNum, nextNum));
                            }}
                            title="Add task here"
                            className="w-full text-[10px] text-[#5f6c85] hover:text-[#cda052] py-1 rounded border border-dashed border-[#1f2638] hover:border-[#cda052]/40 transition-colors cursor-pointer"
                          >
                            + Task
                          </button>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* Dedicated Sprint Story Organizer Modal */}
      <ModalPortal isOpen={showReorderModal}>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] bg-[#0c1018] border border-[#232d44] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#1c2438] bg-gradient-to-r from-[#0d121c] via-[#101524] to-[#0d121c] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#cda052]/10 border border-[#cda052]/30 text-[#cda052]">
                  <ArrowUpDown className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">Sprint Story Organizer</h2>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/40">
                      {modalStoriesList.length} Stories
                    </span>
                    {sprint && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#161c2b] text-[#cbd5e1] border border-[#25324c]">
                        {sprint.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8e9cb5]">
                    Quickly reorder 20+ stories via drag-and-drop, category grouping, or priority sorting.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReorderModal(false)}
                className="p-1.5 rounded-xl text-[#7c869d] hover:text-white hover:bg-[#161c2b] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets Toolbar */}
            <div className="px-5 py-3 bg-[#080b11] border-b border-[#1c2438] flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Smart Presets:</span>
                <button
                  type="button"
                  onClick={handleSortByFeature}
                  title="Group all stories that belong to the same Feature together"
                  className="px-2.5 py-1.5 rounded-lg bg-[#141824] border border-[#263148] text-purple-300 text-xs font-medium hover:bg-purple-950/40 hover:border-purple-600/50 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Group by Feature</span>
                </button>

                <button
                  type="button"
                  onClick={handleSortByPriority}
                  title="Sort active stories by Priority (P1 to P4) with closed at bottom"
                  className="px-2.5 py-1.5 rounded-lg bg-[#141824] border border-[#263148] text-amber-300 text-xs font-medium hover:bg-amber-950/40 hover:border-amber-600/50 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sort by Priority (P1 → P4)</span>
                </button>

                <button
                  type="button"
                  onClick={handleMoveClosedToBottom}
                  title="Push all Resolved and Closed stories to the bottom"
                  className="px-2.5 py-1.5 rounded-lg bg-[#141824] border border-[#263148] text-emerald-300 text-xs font-medium hover:bg-emerald-950/40 hover:border-emerald-600/50 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Move Closed to Bottom</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalStoriesList([...rows])}
                  title="Reset to board order"
                  className="px-2.5 py-1.5 rounded-lg bg-[#141824] border border-[#263148] text-[#94a3b8] text-xs font-medium hover:bg-[#1f273b] hover:text-white flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              <span className="text-[11px] text-[#64748b]">
                {modalStoriesList.filter(isStoryClosed).length} closed stories
              </span>
            </div>

            {/* Stories List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar bg-[#07090e]">
              {modalStoriesList.length === 0 ? (
                <div className="text-center py-12 text-[#64748b]">No stories in this sprint to organize.</div>
              ) : (
                modalStoriesList.map((story, idx) => {
                  const currentNumber = idx + 1;
                  const isClosed = isStoryClosed(story);
                  const isModalDragging = modalDraggingStoryId === story.id;
                  const isModalOver = modalDragOverId === story.id;
                  const parentFeature = story.parentId ? workItems.find((w) => w.id === story.parentId) : null;

                  return (
                    <div
                      key={story.id}
                      draggable
                      onDragStart={() => setModalDraggingStoryId(story.id)}
                      onDragEnd={() => {
                        setModalDraggingStoryId(null);
                        setModalDragOverId(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (modalDraggingStoryId && modalDraggingStoryId !== story.id) {
                          setModalDragOverId(story.id);
                        }
                      }}
                      onDragLeave={() => {
                        if (modalDragOverId === story.id) setModalDragOverId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (!modalDraggingStoryId || modalDraggingStoryId === story.id) return;
                        const from = modalStoriesList.findIndex((s) => s.id === modalDraggingStoryId);
                        const to = idx;
                        handleModalMoveStory(from, to);
                        setModalDraggingStoryId(null);
                        setModalDragOverId(null);
                      }}
                      className={`relative flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                        isModalDragging ? 'opacity-30 border-[#cda052] border-dashed' : ''
                      } ${
                        isModalOver ? 'border-[#cda052] bg-[#cda052]/10 scale-[1.01]' : ''
                      } ${
                        isClosed
                          ? 'border-[#1b2336] bg-[#0b0e16]/80 opacity-75'
                          : 'border-[#1f283d] bg-[#0d121c] hover:border-[#334262]'
                      }`}
                    >
                      {/* Left: Drag Handle, Rank Number Dropdown & Story Details */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          title="Drag up or down"
                          className="p-1 text-[#54627a] hover:text-[#cda052] cursor-grab active:cursor-grabbing flex-shrink-0"
                        >
                          <GripVertical className="w-4 h-4" />
                        </span>

                        {/* Rank Select */}
                        <select
                          value={currentNumber}
                          onChange={(e) => handleModalMoveStory(idx, parseInt(e.target.value) - 1)}
                          title="Directly select target position"
                          className="bg-[#141a28] border border-[#26334d] text-xs font-mono font-bold text-[#cda052] rounded-lg px-2 py-1 focus:outline-none hover:border-[#cda052]/60 cursor-pointer flex-shrink-0"
                        >
                          {modalStoriesList.map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              #{i + 1}
                            </option>
                          ))}
                        </select>

                        {/* Parent Feature Tag if any */}
                        {parentFeature && (
                          <span
                            className="text-[9px] px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800/50 text-purple-300 font-semibold flex items-center gap-1 flex-shrink-0 max-w-[150px] truncate"
                            title={`Feature: ${parentFeature.title}`}
                          >
                            <Layers className="w-2.5 h-2.5 text-[#cda052]" />
                            <span className="truncate">{parentFeature.title}</span>
                          </span>
                        )}

                        {/* Title */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate" title={story.title}>
                            {story.title}
                          </p>
                        </div>
                      </div>

                      {/* Right: Badges & Move Controls */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${TYPE_COLOR[story.type]}`}>
                          {story.type}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${PRIORITY_BADGE_COLOR[story.priority]}`}>
                          P{story.priority}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${STATE_COLOR[story.state]}`}>
                          {story.state}
                        </span>
                        {story.storyPoints !== undefined && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#141b2b] text-[#cbd5e1] border border-[#212c44]">
                            {story.storyPoints} pts
                          </span>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-0.5 bg-[#07090e] p-0.5 rounded-lg border border-[#1a2335]">
                          <button
                            type="button"
                            onClick={() => handleModalMoveStory(idx, 0)}
                            disabled={idx === 0}
                            title="Jump to Top (#1)"
                            className="p-1 rounded text-[#7c869d] hover:text-[#cda052] hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModalMoveStory(idx, Math.max(0, idx - 1))}
                            disabled={idx === 0}
                            title="Move Up 1 spot"
                            className="p-1 rounded text-[#7c869d] hover:text-white hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModalMoveStory(idx, Math.min(modalStoriesList.length - 1, idx + 1))}
                            disabled={idx === modalStoriesList.length - 1}
                            title="Move Down 1 spot"
                            className="p-1 rounded text-[#7c869d] hover:text-white hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleModalMoveStory(idx, modalStoriesList.length - 1)}
                            disabled={idx === modalStoriesList.length - 1}
                            title="Jump to Bottom"
                            className="p-1 rounded text-[#7c869d] hover:text-[#cda052] hover:bg-[#161d2d] disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-[#1c2438] bg-[#090d15] flex items-center justify-between gap-3">
              <span className="text-xs text-[#7c869d]">
                Tip: Drag rows or use preset buttons. Click Apply to save the order to the sprint board.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReorderModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#141824] border border-[#263148] text-[#cbd5e1] text-xs font-semibold hover:text-white hover:bg-[#1c2233] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyModalReorder}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs font-bold hover:shadow-glow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save & Apply Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalPortal>

      {modalItem && <WorkItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
