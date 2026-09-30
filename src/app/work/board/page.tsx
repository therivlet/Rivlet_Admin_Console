'use client';

import React, { useMemo, useState } from 'react';
import { KanbanSquare, Plus, User, Flag } from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { WorkItem, WorkItemState } from '@/lib/types';
import WorkItemModal, { TYPE_COLOR, PRIORITY_LABEL } from '@/components/work/WorkItemModal';

const COLUMNS: WorkItemState[] = ['New', 'Active', 'In Review', 'Resolved', 'Closed'];

function currentSprintId(sprints: { id: string; startDate: string; endDate: string }[]): string | undefined {
  const today = new Date().toISOString().slice(0, 10);
  const current = sprints.find((s) => s.startDate <= today && s.endDate >= today);
  if (current) return current.id;
  // fall back to the next upcoming sprint, else the most recent past one
  const upcoming = [...sprints].sort((a, b) => a.startDate.localeCompare(b.startDate)).find((s) => s.startDate > today);
  if (upcoming) return upcoming.id;
  return [...sprints].sort((a, b) => b.endDate.localeCompare(a.endDate))[0]?.id;
}

function emptyItem(sprintId?: string): Omit<WorkItem, 'createdAt' | 'updatedAt'> {
  return { id: `wi-${Date.now()}`, type: 'Task', title: '', state: 'New', priority: 2, tags: [], sprintId, comments: [] };
}

export default function SprintBoardPage() {
  const { workItems, sprints, saveWorkItem } = useAdminStore();
  const [selectedSprintId, setSelectedSprintId] = useState<string | undefined>(() => currentSprintId(sprints));
  const [modalItem, setModalItem] = useState<WorkItem | Omit<WorkItem, 'createdAt' | 'updatedAt'> | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const activeSprintId = selectedSprintId ?? currentSprintId(sprints);
  const sprint = sprints.find((s) => s.id === activeSprintId);
  const items = useMemo(() => workItems.filter((w) => w.sprintId === activeSprintId), [workItems, activeSprintId]);

  const byColumn = useMemo(() => {
    const map: Record<string, WorkItem[]> = {};
    for (const c of COLUMNS) map[c] = [];
    for (const item of items) (map[item.state] ||= []).push(item);
    return map;
  }, [items]);

  const totalPoints = items.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const donePoints = items.filter((i) => i.state === 'Closed' || i.state === 'Resolved').reduce((sum, i) => sum + (i.storyPoints || 0), 0);

  const handleDrop = async (state: WorkItemState) => {
    if (!draggingId) return;
    const target = workItems.find((w) => w.id === draggingId);
    if (!target || target.state === state) { setDraggingId(null); return; }
    await saveWorkItem({
      ...target,
      state,
      completedDate: (state === 'Closed' || state === 'Resolved') ? (target.completedDate || new Date().toISOString().slice(0, 10)) : target.completedDate,
    });
    setDraggingId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <KanbanSquare className="w-6 h-6 text-[#cda052]" />
            Sprint Board
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">{sprint?.goal || 'Drag cards across stages as work progresses.'}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <select value={activeSprintId || ''} onChange={(e) => setSelectedSprintId(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
            {sprints.length === 0 && <option value="">No sprints yet</option>}
            {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button
            onClick={() => setModalItem(emptyItem(activeSprintId))}
            disabled={!activeSprintId}
            title="Add a work item to this sprint"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold hover:shadow-glow transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add Item
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
          <p className="text-sm text-[#94a3b8]">Create a sprint first, then assign work items to it.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {COLUMNS.map((col) => (
            <div
              key={col}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col)}
              className="rounded-2xl border border-[#1a1f2c] bg-[#0a0c12] min-h-[300px]"
            >
              <div className="px-3 py-2.5 border-b border-[#1a1f2c] flex items-center justify-between sticky top-0 bg-[#0a0c12] rounded-t-2xl">
                <span className="text-[11px] font-semibold text-[#cbd5e1] uppercase tracking-wide">{col}</span>
                <span className="text-[10px] font-mono text-[#7c869d] bg-[#141724] px-1.5 py-0.5 rounded">{byColumn[col]?.length || 0}</span>
              </div>
              <div className="p-2.5 space-y-2.5">
                {(byColumn[col] || []).map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggingId(item.id)}
                    onClick={() => setModalItem(item)}
                    className={`rounded-xl border border-[#1f2638] bg-[#0e121b] p-3 cursor-grab active:cursor-grabbing hover:border-[#2a3346] transition-colors ${draggingId === item.id ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${TYPE_COLOR[item.type]}`}>{item.type}</span>
                      {item.priority <= 2 && <Flag className={`w-3 h-3 ${item.priority === 1 ? 'text-rose-400' : 'text-amber-400'}`} />}
                    </div>
                    <p className="text-xs font-medium text-white leading-snug">{item.title}</p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-[#7c869d]">
                      {item.assignee ? <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> {item.assignee}</span> : <span />}
                      {item.storyPoints !== undefined && <span className="font-mono">{item.storyPoints} pts</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalItem && <WorkItemModal item={modalItem} onClose={() => setModalItem(null)} />}
    </div>
  );
}
