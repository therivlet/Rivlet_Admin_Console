'use client';

import React, { useMemo, useState } from 'react';
import { Plus, User, Flag, ListChecks } from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { WorkItem, WorkItemState, Sprint } from '@/lib/types';
import WorkItemModal, { TYPE_COLOR, STATE_COLOR } from '@/components/work/WorkItemModal';

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

function emptyTask(sprintId?: string, parentId?: string, state?: WorkItemState): Omit<WorkItem, 'createdAt' | 'updatedAt'> {
  return { id: `wi-${Date.now()}`, type: 'Task', title: '', state: state || 'New', priority: 2, tags: [], sprintId, parentId, comments: [] };
}

function emptyStory(sprintId?: string): Omit<WorkItem, 'createdAt' | 'updatedAt'> {
  return { id: `wi-${Date.now()}`, type: 'User Story', title: '', state: 'New', priority: 2, tags: [], sprintId, comments: [] };
}

interface BoardViewProps {
  initialSprintId?: string;
}

export default function BoardView({ initialSprintId }: BoardViewProps) {
  const { workItems, sprints, saveWorkItem } = useAdminStore();
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>(() => initialSprintId ?? currentSprintId(sprints));
  const [modalItem, setModalItem] = useState<WorkItem | Omit<WorkItem, 'createdAt' | 'updatedAt'> | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const activeSprintId = selectedSprintId ?? currentSprintId(sprints);
  const sprint = sprints.find((s) => s.id === activeSprintId);

  const rows = useMemo(
    () => workItems.filter((w) => w.sprintId === activeSprintId && ROW_TYPES.includes(w.type)),
    [workItems, activeSprintId]
  );
  const tasksInSprint = useMemo(
    () => workItems.filter((w) => w.sprintId === activeSprintId && w.type === 'Task'),
    [workItems, activeSprintId]
  );
  const unparentedTasks = useMemo(
    () => tasksInSprint.filter((t) => !t.parentId || !rows.find((r) => r.id === t.parentId)),
    [tasksInSprint, rows]
  );

  const tasksFor = (rowId: string) => (rowId === UNPARENTED ? unparentedTasks : tasksInSprint.filter((t) => t.parentId === rowId));

  const totalPoints = [...rows, ...tasksInSprint].reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const donePoints = [...rows, ...tasksInSprint].filter((i) => i.state === 'Closed' || i.state === 'Resolved').reduce((sum, i) => sum + (i.storyPoints || 0), 0);

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

  const rowIds = [...rows.map((r) => r.id), ...(unparentedTasks.length > 0 ? [UNPARENTED] : [])];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <p className="text-sm text-[#94a3b8]">{sprint?.goal || 'Drag tasks across states, or into a different story row to re-parent them.'}</p>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <select value={activeSprintId || ''} onChange={(e) => setSelectedSprintId(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
            {sprints.length === 0 && <option value="">No sprints yet</option>}
            {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => setModalItem(emptyStory(activeSprintId))} disabled={!activeSprintId} title="Add a User Story to this sprint"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#141724] border border-[#263148] text-[#cbd5e1] text-sm font-medium hover:text-white transition-all disabled:opacity-50">
            <Plus className="w-4 h-4" /> Story
          </button>
          <button onClick={() => setModalItem(emptyTask(activeSprintId))} disabled={!activeSprintId} title="Add a standalone task to this sprint"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold hover:shadow-glow transition-all disabled:opacity-50">
            <Plus className="w-4 h-4" /> Task
          </button>
        </div>
      </div>

      {sprint && (
        <div className="flex items-center gap-4 mb-5 text-xs text-[#94a3b8]">
          <span>{new Date(sprint.startDate).toLocaleDateString()} → {new Date(sprint.endDate).toLocaleDateString()}</span>
          <span className="flex items-center gap-1.5">
            <span className="w-24 h-1.5 rounded-full bg-[#1a1f2c] overflow-hidden inline-block align-middle">
              <span className="h-full bg-gradient-to-r from-[#cda052] to-emerald-500 block" style={{ width: `${totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0}%` }} />
            </span>
            {donePoints} / {totalPoints} pts done
          </span>
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
          <div className="grid gap-2" style={{ gridTemplateColumns: `260px repeat(${COLUMNS.length}, minmax(200px, 1fr))`, minWidth: `${260 + COLUMNS.length * 200}px` }}>
            {/* Header row */}
            <div className="text-[10px] font-semibold text-[#7c869d] uppercase tracking-wide px-2 py-1.5 sticky top-0">Story</div>
            {COLUMNS.map((col) => (
              <div key={col} className="text-[10px] font-semibold text-[#cbd5e1] uppercase tracking-wide px-2 py-1.5 rounded-lg bg-[#0a0c12] sticky top-0 text-center">{col}</div>
            ))}

            {rowIds.map((rowId) => {
              const row = rowId === UNPARENTED ? null : rows.find((r) => r.id === rowId)!;
              const rowTasks = tasksFor(rowId);
              const doneCount = rowTasks.filter((t) => t.state === 'Closed' || t.state === 'Resolved').length;

              return (
                <React.Fragment key={rowId}>
                  {/* Story / row header cell */}
                  <div
                    onClick={() => row && setModalItem(row)}
                    className={`rounded-xl border p-3 flex flex-col justify-between ${row ? 'border-[#1f2638] bg-[#0e121b] cursor-pointer hover:border-[#2a3346]' : 'border-dashed border-[#263148] bg-transparent'}`}
                  >
                    {row ? (
                      <>
                        <div>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${TYPE_COLOR[row.type]}`}>{row.type}</span>
                          <p className="text-xs font-semibold text-white mt-1.5 leading-snug">{row.title}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${STATE_COLOR[row.state]}`}>{row.state}</span>
                          {rowTasks.length > 0 && (
                            <span className="text-[10px] font-mono text-[#7c869d] flex items-center gap-1"><ListChecks className="w-2.5 h-2.5" /> {doneCount}/{rowTasks.length}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-[#7c869d] italic">Unparented tasks</p>
                    )}
                  </div>

                  {/* Task cells per state column */}
                  {COLUMNS.map((col) => (
                    <div
                      key={col}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDrop(rowId, col)}
                      className="rounded-xl border border-[#161a26] bg-[#07090e] p-1.5 space-y-1.5 min-h-[70px]"
                    >
                      {rowTasks.filter((t) => t.state === col).map((task) => (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={() => setDraggingId(task.id)}
                          onDragEnd={() => setDraggingId(null)}
                          onClick={() => setModalItem(task)}
                          className={`rounded-lg border border-[#1f2638] bg-[#0e121b] p-2 cursor-grab active:cursor-grabbing hover:border-[#2a3346] transition-colors ${draggingId === task.id ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[8px] px-1 py-0.5 rounded border font-medium ${TYPE_COLOR[task.type]}`}>{task.type}</span>
                            {task.priority <= 2 && <Flag className={`w-2.5 h-2.5 ${task.priority === 1 ? 'text-rose-400' : 'text-amber-400'}`} />}
                          </div>
                          <p className="text-[11px] font-medium text-white leading-snug">{task.title}</p>
                          <div className="flex items-center justify-between mt-1 text-[9px] text-[#7c869d]">
                            {task.assignee ? <span className="flex items-center gap-0.5 truncate"><User className="w-2 h-2" /> {task.assignee}</span> : <span />}
                            {task.storyPoints !== undefined && <span className="font-mono">{task.storyPoints}</span>}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => setModalItem(emptyTask(activeSprintId, rowId === UNPARENTED ? undefined : rowId, col))}
                        title="Add task here"
                        className="w-full text-[10px] text-[#5f6c85] hover:text-[#cda052] py-1 rounded border border-dashed border-[#1f2638] hover:border-[#cda052]/40 transition-colors"
                      >
                        + Task
                      </button>
                    </div>
                  ))}
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
