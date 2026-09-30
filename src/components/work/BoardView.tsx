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
  Calendar,
  Clock,
  Shirt,
  Sparkles,
  Layers,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { WorkItem, WorkItemState, Sprint } from '@/lib/types';
import WorkItemModal, { TYPE_COLOR, STATE_COLOR, PRIORITY_BADGE_COLOR, PRIORITY_LABEL } from '@/components/work/WorkItemModal';

const COLUMNS: WorkItemState[] = ['New', 'Active', 'In Review', 'Resolved', 'Closed'];
const ROW_TYPES: WorkItem['type'][] = ['User Story', 'Bug'];
const UNPARENTED = '__unparented__';

function currentSprintId(sprints: Sprint[]): string | undefined {
  const today = new Date().toISOString().slice(0, 10);
  const current = sprints.find((s) => s.startDate <= today && s.endDate >= today);
  if (current) return current.id;
  const upcoming = [...sprints].sort((a, b) => a.startDate.localeCompare(b.startDate)).find((s) => s.startDate > today);
  if (upcoming) return upcoming.id;
  return [...sprints].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]?.id;
}

// Default is unassigned (not Dasani)
function emptyTask(sprintId?: string, parentId?: string, state?: WorkItemState): Omit<WorkItem, 'createdAt' | 'updatedAt'> {
  return { id: `wi-${Date.now()}`, type: 'Task', title: '', state: state || 'New', priority: 2, tags: [], sprintId, parentId, assignee: undefined, comments: [] };
}

function emptyStory(sprintId?: string): Omit<WorkItem, 'createdAt' | 'updatedAt'> {
  return { id: `wi-${Date.now()}`, type: 'User Story', title: '', state: 'New', priority: 2, tags: [], sprintId, assignee: undefined, comments: [] };
}

interface BoardViewProps {
  initialSprintId?: string;
}

export default function BoardView({ initialSprintId }: BoardViewProps) {
  const { workItems, sprints, vendors, teamMembers, pipelineItems, saveWorkItem, reorderWorkItems } = useAdminStore();
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>(() => initialSprintId ?? currentSprintId(sprints));
  const [modalItem, setModalItem] = useState<WorkItem | Omit<WorkItem, 'createdAt' | 'updatedAt'> | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');

  const activeSprintId = selectedSprintId ?? currentSprintId(sprints);
  const sprint = sprints.find((s) => s.id === activeSprintId);

  // Rows (User Stories) in active sprint, sorted by order
  const rows = useMemo(() => {
    const list = workItems.filter((w) => w.sprintId === activeSprintId && ROW_TYPES.includes(w.type));
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [workItems, activeSprintId]);

  // Tasks in active sprint, sorted by order
  const tasksInSprint = useMemo(() => {
    const list = workItems.filter((w) => w.sprintId === activeSprintId && w.type === 'Task');
    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [workItems, activeSprintId]);

  const unparentedTasks = useMemo(
    () => tasksInSprint.filter((t) => !t.parentId || !rows.find((r) => r.id === t.parentId)),
    [tasksInSprint, rows]
  );

  const tasksFor = (rowId: string) => {
    const all = rowId === UNPARENTED ? unparentedTasks : tasksInSprint.filter((t) => t.parentId === rowId);
    return assigneeFilter === 'All' ? all : all.filter((t) => t.assignee === assigneeFilter);
  };

  const visibleRowIdsSet = useMemo(() => {
    if (assigneeFilter === 'All') return null;
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
    await saveWorkItem({
      ...target,
      state,
      parentId: nextParentId,
      sprintId: activeSprintId,
      completedDate: (state === 'Closed' || state === 'Resolved') ? (target.completedDate || new Date().toISOString().slice(0, 10)) : target.completedDate,
    });
  };

  // Move Story Up or Down
  const handleMoveStory = async (storyId: string, direction: 'up' | 'down') => {
    const idx = rows.findIndex((r) => r.id === storyId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= rows.length) return;

    const current = rows[idx];
    const target = rows[targetIdx];

    const updatedRows = [...rows];
    updatedRows[idx] = target;
    updatedRows[targetIdx] = current;

    // Assign sequential order indices
    const updatedMap = new Map<string, number>();
    updatedRows.forEach((r, i) => updatedMap.set(r.id, i + 1));

    const newWorkItems = workItems.map((w) => {
      if (updatedMap.has(w.id)) {
        return { ...w, order: updatedMap.get(w.id) };
      }
      return w;
    });

    await reorderWorkItems(newWorkItems);
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

  const filteredRows = visibleRowIdsSet ? rows.filter((r) => visibleRowIdsSet.has(r.id)) : rows;
  const filteredUnparented = assigneeFilter === 'All' ? unparentedTasks : unparentedTasks.filter((t) => t.assignee === assigneeFilter);
  const rowIds = [...filteredRows.map((r) => r.id), ...(filteredUnparented.length > 0 ? [UNPARENTED] : [])];

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
            {assigneeOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 flex-shrink-0">
          <button
            onClick={() => setModalItem(emptyStory(activeSprintId))}
            disabled={!activeSprintId}
            title="Add a User Story to this sprint"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141824] border border-[#263148] text-[#cbd5e1] text-xs font-semibold hover:text-white transition-all disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Story
          </button>
          <button
            onClick={() => setModalItem(emptyTask(activeSprintId))}
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
            <div className="flex items-center gap-2.5 flex-wrap">
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
        <div className="overflow-x-auto pb-4">
          <div className="grid gap-2" style={{ gridTemplateColumns: `280px repeat(${COLUMNS.length}, minmax(210px, 1fr))`, minWidth: `${280 + COLUMNS.length * 210}px` }}>
            {/* Header row */}
            <div className="text-[10px] font-bold text-[#7c869d] uppercase tracking-wider px-3 py-2 sticky top-0 bg-[#090b11]/90 rounded-lg">
              Stories & Milestones
            </div>
            {COLUMNS.map((col) => (
              <div key={col} className="text-[10px] font-bold text-[#cbd5e1] uppercase tracking-wider px-3 py-2 rounded-lg bg-[#0e121b] sticky top-0 text-center border border-[#1a2335]">
                {col}
              </div>
            ))}

            {rowIds.map((rowId, rowIdx) => {
              const row = rowId === UNPARENTED ? null : rows.find((r) => r.id === rowId)!;
              const rowTasks = tasksFor(rowId);
              const doneCount = rowTasks.filter((t) => t.state === 'Closed' || t.state === 'Resolved').length;

              return (
                <React.Fragment key={rowId}>
                  {/* Story / Row Header Cell with Up/Down Rearrange Buttons */}
                  <div
                    onClick={() => row && setModalItem(row)}
                    className={`rounded-xl border p-3 flex flex-col justify-between transition-all ${
                      row
                        ? 'border-[#1f2638] bg-[#0c1018] cursor-pointer hover:border-[#33415c] shadow-sm'
                        : 'border-dashed border-[#263148] bg-transparent'
                    }`}
                  >
                    {row ? (
                      <>
                        <div className="space-y-1.5">
                          {/* Top controls: type, priority, and Move Up / Down buttons */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
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

                            {/* Move Up / Move Down buttons for Stories */}
                            <div
                              className="flex items-center gap-0.5 bg-[#07090e] p-0.5 rounded border border-[#1a2335]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => handleMoveStory(row.id, 'up')}
                                disabled={rowIdx === 0}
                                title="Move story up"
                                className="p-1 rounded text-[#7c869d] hover:text-white hover:bg-[#161d2d] disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleMoveStory(row.id, 'down')}
                                disabled={rowIdx === rows.length - 1}
                                title="Move story down"
                                className="p-1 rounded text-[#7c869d] hover:text-white hover:bg-[#161d2d] disabled:opacity-30 disabled:hover:bg-transparent"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-xs font-bold text-white leading-snug">{row.title}</p>

                          {/* Extra Story Details on Board */}
                          <div className="flex items-center gap-1 flex-wrap pt-1">
                            {row.linkedPipelineItemIds?.includes('all') ? (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 font-semibold flex items-center gap-0.5">
                                <Shirt className="w-2.5 h-2.5" /> All Styles
                              </span>
                            ) : row.linkedPipelineItemIds && row.linkedPipelineItemIds.length > 0 ? (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#161c28] border border-[#252f44] text-[#cbd5e1] font-medium flex items-center gap-0.5">
                                <Shirt className="w-2.5 h-2.5" /> {row.linkedPipelineItemIds.length} Styles
                              </span>
                            ) : null}

                            {row.operationCategory && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-950/50 border border-indigo-800/40 text-indigo-300 truncate max-w-[130px]">
                                {row.operationCategory}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Row Attributes */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#171d2b]">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${STATE_COLOR[row.state]}`}>
                            {row.state}
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Assignee pill (Unassigned by default) */}
                            <span className="text-[9px] text-[#7c869d] flex items-center gap-0.5">
                              <User className="w-2.5 h-2.5" /> {row.assignee || 'Unassigned'}
                            </span>

                            {rowTasks.length > 0 && (
                              <span className="text-[10px] font-mono text-[#7c869d] flex items-center gap-1">
                                <ListChecks className="w-2.5 h-2.5 text-[#cda052]" /> {doneCount}/{rowTasks.length}
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-[#7c869d] italic">Unparented tasks</p>
                    )}
                  </div>

                  {/* Task Cells per State Column */}
                  {COLUMNS.map((col) => {
                    const cellTasks = rowTasks.filter((t) => t.state === col);

                    return (
                      <div
                        key={col}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(rowId, col)}
                        className="rounded-xl border border-[#161a26] bg-[#07090e] p-1.5 space-y-1.5 min-h-[70px]"
                      >
                        {cellTasks.map((task, taskIdx) => {
                          const linkedVendor = task.linkedVendorId ? vendors.find((v) => v.id === task.linkedVendorId) : undefined;

                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => setDraggingId(task.id)}
                              onDragEnd={() => setDraggingId(null)}
                              onClick={() => setModalItem(task)}
                              className={`rounded-lg border border-[#1f2638] bg-[#0e121b] p-2.5 cursor-grab active:cursor-grabbing hover:border-[#33425f] transition-all shadow-sm ${
                                draggingId === task.id ? 'opacity-40' : ''
                              }`}
                            >
                              {/* Top Task Header: Priority flag, Type, Points & Move Up/Down buttons */}
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-1">
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
                                    title="Move task up"
                                    className="p-0.5 rounded text-[#64748b] hover:text-white hover:bg-[#161d2d] disabled:opacity-20"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveTask(task.id, 'down', cellTasks)}
                                    disabled={taskIdx === cellTasks.length - 1}
                                    title="Move task down"
                                    className="p-0.5 rounded text-[#64748b] hover:text-white hover:bg-[#161d2d] disabled:opacity-20"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-[11px] font-medium text-white leading-snug">{task.title}</p>

                              {/* Task Metadata: Manufacturer & Operation */}
                              {linkedVendor && (
                                <p className="text-[9px] text-amber-300/80 flex items-center gap-0.5 mt-1 truncate">
                                  <Factory className="w-2 h-2 text-amber-400" /> {linkedVendor.name}
                                </p>
                              )}
                              {task.operationCategory && (
                                <span className="text-[7px] px-1 py-0.2 rounded bg-[#141a28] text-indigo-300 border border-[#212b40] mt-1 inline-block truncate max-w-[140px]">
                                  {task.operationCategory}
                                </span>
                              )}

                              {/* Task Footer: Assignee (defaults to Unassigned) */}
                              <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#161c28] text-[9px] text-[#7c869d]">
                                <span className="flex items-center gap-0.5 truncate">
                                  <User className="w-2.5 h-2.5" /> {task.assignee || 'Unassigned'}
                                </span>
                                <span className="text-[8px] font-mono text-[#54627a]">{task.id.slice(-4)}</span>
                              </div>
                            </div>
                          );
                        })}

                        {col === 'New' && (
                          <button
                            onClick={() => setModalItem(emptyTask(activeSprintId, rowId === UNPARENTED ? undefined : rowId, col))}
                            title="Add task here"
                            className="w-full text-[10px] text-[#5f6c85] hover:text-[#cda052] py-1 rounded border border-dashed border-[#1f2638] hover:border-[#cda052]/40 transition-colors"
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
      )}

      {modalItem && <WorkItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
