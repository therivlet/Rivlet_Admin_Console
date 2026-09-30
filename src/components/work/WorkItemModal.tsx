'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Save,
  MessageSquare,
  Send,
  Layers,
  Pencil,
  Trash2,
  User,
  Factory,
  CheckCircle2,
  Plus,
  Shirt,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { WorkItem, WorkItemType, WorkItemState, WorkItemPriority } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import ModalPortal from '@/components/ui/ModalPortal';
import { useConfirm } from '@/lib/confirmContext';

const TYPES: WorkItemType[] = ['Epic', 'Feature', 'User Story', 'Task', 'Bug'];
const STATES: WorkItemState[] = ['New', 'Active', 'In Review', 'Resolved', 'Closed'];
const PRIORITIES: WorkItemPriority[] = [1, 2, 3, 4];

const OPERATION_CATEGORIES = [
  'Operations & Sourcing',
  'Sampling & Fit',
  'Production QC',
  'Fabric Mill & Lab Dips',
  'Pattern Making & Tech Packs',
  'Packaging & Trim',
  'Logistics & Warehouse',
  'E-Commerce & Launch',
];

export const TYPE_COLOR: Record<WorkItemType, string> = {
  'Epic': 'bg-purple-950/70 text-purple-300 border-purple-800/60 shadow-sm shadow-purple-950/50',
  'Feature': 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60 shadow-sm shadow-indigo-950/50',
  'User Story': 'bg-sky-950/70 text-sky-300 border-sky-800/60 shadow-sm shadow-sky-950/50',
  'Task': 'bg-[#182030] text-[#94a3b8] border-[#263148]',
  'Bug': 'bg-rose-950/70 text-rose-300 border-rose-800/60 shadow-sm shadow-rose-950/50',
};

export const STATE_COLOR: Record<WorkItemState, string> = {
  'New': 'bg-[#182030] text-[#94a3b8] border-[#263148]',
  'Active': 'bg-sky-950/60 text-sky-300 border-sky-800/50',
  'In Review': 'bg-amber-950/60 text-amber-300 border-amber-800/50',
  'Resolved': 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  'Closed': 'bg-[#0e121b] text-[#5f6c85] border-[#1f2638]',
};

export const PRIORITY_LABEL: Record<WorkItemPriority, string> = {
  1: 'P1 — Critical',
  2: 'P2 — High',
  3: 'P3 — Medium',
  4: 'P4 — Low',
};

export const PRIORITY_BADGE_COLOR: Record<WorkItemPriority, string> = {
  1: 'bg-rose-950/60 text-rose-300 border-rose-800/60',
  2: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
  3: 'bg-blue-950/60 text-blue-300 border-blue-800/60',
  4: 'bg-slate-900/60 text-slate-400 border-slate-700/60',
};

interface WorkItemModalProps {
  item: WorkItem | (Omit<WorkItem, 'createdAt' | 'updatedAt' | 'comments'> & { comments?: WorkItem['comments'] });
  onClose: () => void;
  defaultSprintId?: string;
  startInEditMode?: boolean;
}

export default function WorkItemModal({ item, onClose, startInEditMode }: WorkItemModalProps) {
  const confirm = useConfirm();
  const { workItems, sprints, teamMembers, vendors, pipelineItems, saveWorkItem, deleteWorkItem, addWorkItemComment } = useAdminStore();
  const { user } = useAuth();

  const isExisting = !!(item as WorkItem).createdAt;
  // If opening an existing story or task, show in read-only big screen mode by default unless explicitly asked to edit
  const [isEditing, setIsEditing] = useState<boolean>(!isExisting || !!startInEditMode);

  // Initialize form state
  const [form, setForm] = useState<WorkItem>(() => {
    const raw = item as WorkItem;
    // Normalize linkedPipelineItemIds
    let initialStyleIds: string[] = [];
    if (Array.isArray(raw.linkedPipelineItemIds) && raw.linkedPipelineItemIds.length > 0) {
      initialStyleIds = raw.linkedPipelineItemIds;
    } else if (raw.linkedPipelineItemId) {
      initialStyleIds = [raw.linkedPipelineItemId];
    }

    return {
      ...raw,
      comments: raw.comments || [],
      tags: raw.tags || [],
      linkedPipelineItemIds: initialStyleIds,
      operationCategory: raw.operationCategory || undefined,
    };
  });

  const [tagsInput, setTagsInput] = useState(form.tags.join(', '));
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isCreatingSubTask, setIsCreatingSubTask] = useState(false);
  const [subTaskTitle, setSubTaskTitle] = useState('');

  // Live item & comments from store
  const liveItem = workItems.find((w) => w.id === form.id);
  const currentItem = liveItem || form;
  const liveComments = currentItem.comments || [];

  // Child items (e.g. Tasks under this Story, or Stories under this Feature)
  const childItems = useMemo(
    () => workItems.filter((w) => w.parentId === currentItem.id),
    [workItems, currentItem.id]
  );

  // Strict ADO hierarchy parent filtering:
  // - If Task/Bug -> parent can ONLY be User Story
  // - If User Story -> parent can ONLY be Feature
  // - If Feature -> parent can ONLY be Epic
  // - If Epic -> no parent
  const allowedParents = useMemo(() => {
    if (form.type === 'Task' || form.type === 'Bug') {
      return workItems.filter((w) => w.type === 'User Story' && w.id !== form.id);
    }
    if (form.type === 'User Story') {
      return workItems.filter((w) => w.type === 'Feature' && w.id !== form.id);
    }
    if (form.type === 'Feature') {
      return workItems.filter((w) => w.type === 'Epic' && w.id !== form.id);
    }
    return []; // Epics are top-level
  }, [workItems, form.type, form.id]);

  const parentItem = useMemo(
    () => (currentItem.parentId ? workItems.find((w) => w.id === currentItem.parentId) : undefined),
    [workItems, currentItem.parentId]
  );

  const sprint = useMemo(
    () => (currentItem.sprintId ? sprints.find((s) => s.id === currentItem.sprintId) : undefined),
    [sprints, currentItem.sprintId]
  );

  const vendor = useMemo(
    () => (currentItem.linkedVendorId ? vendors.find((v) => v.id === currentItem.linkedVendorId) : undefined),
    [vendors, currentItem.linkedVendorId]
  );

  // Style names helper
  const selectedStyleIds = form.linkedPipelineItemIds || [];
  const isAllStylesSelected = selectedStyleIds.includes('all') || (pipelineItems.length > 0 && selectedStyleIds.length === pipelineItems.length);

  const handleToggleStyle = (styleId: string) => {
    let next: string[];
    if (styleId === 'all') {
      if (isAllStylesSelected) {
        next = [];
      } else {
        next = ['all'];
      }
    } else {
      const filtered = selectedStyleIds.filter((id) => id !== 'all');
      if (filtered.includes(styleId)) {
        next = filtered.filter((id) => id !== styleId);
      } else {
        next = [...filtered, styleId];
        if (pipelineItems.length > 0 && next.length === pipelineItems.length) {
          next = ['all'];
        }
      }
    }
    setForm({
      ...form,
      linkedPipelineItemIds: next,
      linkedPipelineItemId: next.length > 0 && next[0] !== 'all' ? next[0] : (next.includes('all') && pipelineItems[0] ? pipelineItems[0].id : undefined),
    });
  };

  const handleSave = async () => {
    if (!form.title || form.title.trim().length < 3) {
      setError('Title is required (minimum 3 characters).');
      return;
    }
    setError(null);
    setIsSaving(true);
    const now = new Date().toISOString();

    const normalizedStyleIds = form.linkedPipelineItemIds || [];
    const primaryStyleId =
      normalizedStyleIds.length > 0 && normalizedStyleIds[0] !== 'all'
        ? normalizedStyleIds[0]
        : (normalizedStyleIds.includes('all') && pipelineItems[0] ? pipelineItems[0].id : undefined);

    await saveWorkItem({
      ...form,
      title: form.title.trim(),
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      linkedPipelineItemIds: normalizedStyleIds,
      linkedPipelineItemId: primaryStyleId,
      comments: liveComments,
      createdAt: form.createdAt || now,
      updatedAt: now,
    });
    setIsSaving(false);
    setIsEditing(false);
    if (!isExisting) {
      onClose();
    }
  };

  const handleDelete = async () => {
    const subItemCount = workItems.filter((w) => w.parentId === form.id).length;
    const ok = await confirm({
      title: 'Delete Work Item',
      message: `Are you sure you want to delete "${form.title}"?${
        subItemCount > 0
          ? ` Warning: ${subItemCount} child item${subItemCount === 1 ? '' : 's'} linked to this work item will also be permanently deleted.`
          : ' This action cannot be undone.'
      }`,
      confirmLabel: 'Delete Item',
      danger: true,
    });
    if (!ok) return;
    await deleteWorkItem(form.id);
    onClose();
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || isPostingComment) return;
    setCommentText('');
    setIsPostingComment(true);
    try {
      await addWorkItemComment(form.id, text, user?.name || 'Dasani');
    } catch {
      setCommentText(text);
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleCreateSubTask = async () => {
    if (!subTaskTitle.trim()) return;
    const now = new Date().toISOString();
    const newTask: WorkItem = {
      id: `wi-${Date.now()}`,
      type: 'Task',
      title: subTaskTitle.trim(),
      state: 'New',
      priority: 2,
      storyPoints: 1,
      parentId: currentItem.id,
      sprintId: currentItem.sprintId,
      assignee: currentItem.assignee || 'Dasani',
      linkedVendorId: currentItem.linkedVendorId,
      linkedPipelineItemIds: currentItem.linkedPipelineItemIds,
      operationCategory: currentItem.operationCategory,
      tags: currentItem.tags || [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    };
    await saveWorkItem(newTask);
    setSubTaskTitle('');
    setIsCreatingSubTask(false);
  };

  const renderReadonlyStyles = () => {
    const ids = currentItem.linkedPipelineItemIds || (currentItem.linkedPipelineItemId ? [currentItem.linkedPipelineItemId] : []);
    if (ids.includes('all')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/70 border border-emerald-700/60 text-emerald-300">
          <Shirt className="w-3.5 h-3.5 text-emerald-400" /> All Styles (Drop 1 — 6 Styles)
        </span>
      );
    }
    if (ids.length === 0) {
      return <span className="text-xs text-[#64748b] italic">No styles linked</span>;
    }
    const matchingStyles = pipelineItems.filter((p) => ids.includes(p.id));
    return (
      <div className="flex flex-wrap gap-1.5">
        {matchingStyles.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#141824] border border-[#222c42] text-[#cbd5e1]">
            <Shirt className="w-3 h-3 text-[#cda052]" /> {s.styleName}
          </span>
        ))}
      </div>
    );
  };

  // Omit date fields for Task and User Story as requested by user
  const isDateApplicable = form.type === 'Epic' || form.type === 'Feature';

  return (
    <ModalPortal isOpen={true}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md" onClick={onClose}>
        <div
          className="w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl border border-[#1f2638] bg-[#090b11] shadow-2xl shadow-black overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Work item details"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#171d2b] bg-[#0c1018]/90">
            <div className="flex items-center flex-wrap gap-2.5">
              <span className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold uppercase tracking-wider ${TYPE_COLOR[currentItem.type]}`}>
                {currentItem.type}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${STATE_COLOR[currentItem.state]}`}>
                {currentItem.state}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${PRIORITY_BADGE_COLOR[currentItem.priority]}`}>
                {PRIORITY_LABEL[currentItem.priority]}
              </span>
              {sprint && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-[#222d42] bg-[#121724] text-[#cbd5e1] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#cda052]" /> {sprint.name}
                </span>
              )}
              <span className="text-xs font-mono text-[#54627a] ml-1">{currentItem.id}</span>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && isExisting && (
                <button
                  onClick={() => setIsEditing(true)}
                  title="Edit details"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs font-semibold hover:shadow-glow transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Details
                </button>
              )}
              {isEditing && isExisting && (
                <button
                  onClick={() => setIsEditing(false)}
                  title="Cancel edit"
                  className="px-3 py-1.5 rounded-lg bg-[#141824] border border-[#222c42] text-[#94a3b8] hover:text-white text-xs font-medium"
                >
                  Cancel Edit
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Close modal"
                title="Close"
                className="p-1.5 rounded-lg text-[#7c869d] hover:text-white hover:bg-[#161d2b] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 text-xs text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl px-4 py-2.5 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* Modal Main Body (Scrollable container, but inner content displays fully without cut-offs) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* Title Display or Edit */}
            {isEditing ? (
              <div>
                <label className="text-xs font-semibold text-[#94a3b8] block mb-1.5">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Dasani: Confirm lab-dip approvals with Techno Sportswear"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0d121c] border border-[#222c42] text-base font-semibold text-white focus:outline-none focus:border-[#cda052]/60"
                />
              </div>
            ) : (
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">
                {currentItem.title}
              </h1>
            )}

            {/* Read-Only Format (Big Screen Workspace) */}
            {!isEditing ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 8 Cols: Description, Acceptance Criteria, Child Tasks, Discussion */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Description Box (Full display, NO internal scrollbox) */}
                  <div className="rounded-xl border border-[#1b2233] bg-[#0c1018] p-5 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7c869d] mb-2.5 flex items-center gap-1.5">
                      Description
                    </h3>
                    {currentItem.description ? (
                      <div className="text-sm text-[#cbd5e1] leading-relaxed whitespace-pre-wrap break-words">
                        {currentItem.description}
                      </div>
                    ) : (
                      <p className="text-xs text-[#54627a] italic">No description provided.</p>
                    )}
                  </div>

                  {/* Acceptance Criteria Box (Full display, NO internal scrollbox) */}
                  <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-5 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Acceptance Criteria
                    </h3>
                    {currentItem.acceptanceCriteria ? (
                      <div className="text-sm text-[#e2e8f0] leading-relaxed whitespace-pre-wrap break-words">
                        {currentItem.acceptanceCriteria}
                      </div>
                    ) : (
                      <p className="text-xs text-[#54627a] italic">No acceptance criteria defined yet.</p>
                    )}
                  </div>

                  {/* Sub-Tasks / Child Hierarchy Items (if User Story or Feature) */}
                  {(currentItem.type === 'User Story' || currentItem.type === 'Feature') && (
                    <div className="rounded-xl border border-[#1b2233] bg-[#0c1018] p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7c869d] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#cda052]" /> Sub-Tasks ({childItems.length})
                        </h3>
                        {!isCreatingSubTask && (
                          <button
                            onClick={() => setIsCreatingSubTask(true)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#cda052] hover:bg-[#1a2130] transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Task
                          </button>
                        )}
                      </div>

                      {isCreatingSubTask && (
                        <div className="mb-3 p-3 rounded-lg border border-[#222c42] bg-[#0f1422] flex items-center gap-2">
                          <input
                            value={subTaskTitle}
                            onChange={(e) => setSubTaskTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSubTask(); }}
                            placeholder="e.g. Dasani: Inspect fabric swatch cards under D65 booth"
                            className="flex-1 px-3 py-1.5 rounded bg-[#0a0c12] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50"
                            autoFocus
                          />
                          <button
                            onClick={handleCreateSubTask}
                            disabled={!subTaskTitle.trim()}
                            className="px-3 py-1.5 rounded bg-[#cda052] text-black text-xs font-semibold disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setIsCreatingSubTask(false); setSubTaskTitle(''); }}
                            className="px-2 py-1.5 text-xs text-[#94a3b8] hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {childItems.length === 0 && !isCreatingSubTask ? (
                        <p className="text-xs text-[#54627a] italic">No sub-tasks attached to this story yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {childItems.map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center justify-between p-2.5 rounded-lg border border-[#1a2233] bg-[#080b11] hover:border-[#2a3754] transition-colors"
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${TYPE_COLOR[child.type]}`}>{child.type}</span>
                                <span className="text-xs text-white font-medium truncate">{child.title}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {child.assignee && (
                                  <span className="text-[10px] text-[#7c869d] flex items-center gap-0.5">
                                    <User className="w-2.5 h-2.5" /> {child.assignee}
                                  </span>
                                )}
                                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${STATE_COLOR[child.state]}`}>
                                  {child.state}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Discussion / Comment Box — fully active in Read-Only mode */}
                  <div className="rounded-xl border border-[#1b2233] bg-[#0c1018] p-5 shadow-sm">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7c869d] mb-3 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#cda052]" /> Discussion & Activity
                    </h3>

                    {/* Comment list */}
                    <div className="space-y-2.5 max-h-56 overflow-y-auto mb-4 pr-1">
                      {liveComments.length === 0 ? (
                        <p className="text-xs text-[#54627a] italic">No comments yet. Start the discussion below.</p>
                      ) : (
                        liveComments.map((c) => (
                          <div key={c.id} className="p-3 rounded-lg bg-[#0e1320] border border-[#1a2336] text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-white flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#cda052] to-[#7f5a1c] text-black text-[10px] font-bold flex items-center justify-center">
                                  {c.author[0]?.toUpperCase()}
                                </span>
                                {c.author}
                              </span>
                              <span className="text-[10px] text-[#64748b]">{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-[#cbd5e1] leading-relaxed pl-6 whitespace-pre-wrap">{c.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2">
                      <input
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                        placeholder="Add a comment or update (e.g. Dasani approved swatch card)..."
                        disabled={isPostingComment}
                        className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#080b11] border border-[#20293d] text-xs text-white placeholder:text-[#54627a] focus:outline-none focus:border-[#cda052]/60 disabled:opacity-60"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={isPostingComment || !commentText.trim()}
                        title="Post comment"
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-xs font-semibold hover:shadow-glow transition-all disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> Post
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right 4 Cols: Metadata Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-xl border border-[#1b2233] bg-[#0c1018] p-5 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7c869d] pb-2 border-b border-[#171d2b]">
                      Attributes & Context
                    </h3>

                    {/* Assignee */}
                    <div>
                      <span className="text-[11px] text-[#64748b] block mb-1">Assignee</span>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] text-black flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {currentItem.assignee ? currentItem.assignee[0]?.toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-white">{currentItem.assignee || 'Unassigned'}</p>
                          {currentItem.assignee === 'Dasani' && (
                            <p className="text-[10px] text-[#cda052]">Operations & Sourcing Lead</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sprint */}
                    <div>
                      <span className="text-[11px] text-[#64748b] block mb-1">Sprint Scheduling</span>
                      {sprint ? (
                        <div className="p-2 rounded-lg bg-[#080b11] border border-[#1a2233]">
                          <p className="text-xs font-medium text-white">{sprint.name}</p>
                          <p className="text-[10px] text-[#64748b] mt-0.5">
                            {new Date(sprint.startDate).toLocaleDateString()} → {new Date(sprint.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#94a3b8]">Backlog (Unscheduled)</p>
                      )}
                    </div>

                    {/* Story Points */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-[#64748b] block mb-1">Story Points</span>
                        <span className="text-xs font-mono font-semibold text-[#cbd5e1] px-2.5 py-1 rounded bg-[#080b11] border border-[#1a2233] inline-block">
                          {currentItem.storyPoints !== undefined ? `${currentItem.storyPoints} pts` : 'Not estimated'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#64748b] block mb-1">Priority</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded border font-medium inline-block ${PRIORITY_BADGE_COLOR[currentItem.priority]}`}>
                          {PRIORITY_LABEL[currentItem.priority]}
                        </span>
                      </div>
                    </div>

                    {/* Parent Item */}
                    <div>
                      <span className="text-[11px] text-[#64748b] block mb-1">Parent Hierarchy</span>
                      {parentItem ? (
                        <div className="p-2 rounded-lg bg-[#080b11] border border-[#1a2233]">
                          <span className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${TYPE_COLOR[parentItem.type]}`}>
                            {parentItem.type}
                          </span>
                          <p className="text-xs text-white font-medium mt-1 truncate">{parentItem.title}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748b] italic">No parent (Top-level {currentItem.type})</p>
                      )}
                    </div>

                    {/* Manufacturer or Operation */}
                    <div>
                      <span className="text-[11px] text-[#64748b] block mb-1">Manufacturer / Vendor</span>
                      {vendor ? (
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                          <Factory className="w-3.5 h-3.5 text-[#cda052]" /> {vendor.name}
                        </div>
                      ) : (
                        <span className="text-xs text-[#64748b] italic">None linked</span>
                      )}
                    </div>

                    {/* Operation Area */}
                    <div>
                      <span className="text-[11px] text-[#64748b] block mb-1">Operation Area</span>
                      {currentItem.operationCategory ? (
                        <span className="text-xs px-2.5 py-1 rounded-md bg-[#131b2c] border border-[#1f2e4d] text-indigo-300 font-medium inline-block">
                          {currentItem.operationCategory}
                        </span>
                      ) : (
                        <span className="text-xs text-[#64748b] italic">General Operations</span>
                      )}
                    </div>

                    {/* Related Pipeline Styles */}
                    <div>
                      <span className="text-[11px] text-[#64748b] block mb-1.5">Related Pipeline Styles</span>
                      {renderReadonlyStyles()}
                    </div>

                    {/* Tags */}
                    {currentItem.tags && currentItem.tags.length > 0 && (
                      <div>
                        <span className="text-[11px] text-[#64748b] block mb-1">Tags</span>
                        <div className="flex flex-wrap gap-1">
                          {currentItem.tags.map((t) => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-[#101522] border border-[#1e273b] text-[#94a3b8]">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Editable Form Mode (Wide, comfortable layout) */
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Type */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as WorkItemType, parentId: undefined })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50"
                    >
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* State */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">State</label>
                    <select
                      value={form.state}
                      onChange={(e) => setForm({
                        ...form,
                        state: e.target.value as WorkItemState,
                        completedDate: (e.target.value === 'Closed' || e.target.value === 'Resolved') ? (form.completedDate || new Date().toISOString().slice(0, 10)) : form.completedDate,
                      })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50"
                    >
                      {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: Number(e.target.value) as WorkItemPriority })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50"
                    >
                      {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                    </select>
                  </div>

                  {/* Story Points */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">Story Points</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.storyPoints ?? ''}
                      onChange={(e) => setForm({ ...form, storyPoints: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g. 3 or 5"
                      className="w-full px-3 py-2 rounded-xl bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Assignee */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">Assignee</label>
                    <select
                      value={form.assignee || ''}
                      onChange={(e) => setForm({ ...form, assignee: e.target.value || undefined })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}{m.role ? ` (${m.role})` : ''}
                        </option>
                      ))}
                      {form.assignee && !teamMembers.some((m) => m.name === form.assignee) && (
                        <option value={form.assignee}>{form.assignee} (External / Not on roster)</option>
                      )}
                    </select>
                  </div>

                  {/* Sprint */}
                  <div>
                    <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">Sprint Scheduling</label>
                    <select
                      value={form.sprintId || ''}
                      onChange={(e) => setForm({ ...form, sprintId: e.target.value || undefined })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    >
                      <option value="">Backlog (Unscheduled)</option>
                      {sprints.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Strict ADO Parent Filtering */}
                <div className="rounded-xl border border-[#1b2233] bg-[#0c1018] p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-semibold text-[#94a3b8] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#cda052]" />
                      Parent Item ({form.type === 'Task' || form.type === 'Bug' ? 'Must be a User Story' : form.type === 'User Story' ? 'Must be a Feature' : form.type === 'Feature' ? 'Must be an Epic' : 'Top-Level Epic'})
                    </label>
                  </div>

                  {form.type === 'Epic' ? (
                    <p className="text-xs text-[#54627a] italic">Epics are top-level items and do not have parents.</p>
                  ) : (
                    <select
                      value={form.parentId || ''}
                      onChange={(e) => setForm({ ...form, parentId: e.target.value || undefined })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#080b11] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    >
                      <option value="">No parent (Top-level {form.type})</option>
                      {allowedParents.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.type}: {p.title}
                        </option>
                      ))}
                    </select>
                  )}
                  {form.type !== 'Epic' && allowedParents.length === 0 && (
                    <p className="text-[11px] text-amber-400/80 mt-1.5">
                      No matching parent items found. {form.type === 'Task' ? 'Create a User Story first to link this task under it.' : form.type === 'User Story' ? 'Create a Feature first to link this story.' : 'Create an Epic first.'}
                    </p>
                  )}
                </div>

                {/* Related Manufacturer & Operation Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">Related Manufacturer</label>
                    <select
                      value={form.linkedVendorId || ''}
                      onChange={(e) => setForm({ ...form, linkedVendorId: e.target.value || undefined })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    >
                      <option value="">None / Internal</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>{v.name} ({v.specialty || 'Manufacturer'})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">Operation Category</label>
                    <select
                      value={form.operationCategory || ''}
                      onChange={(e) => setForm({ ...form, operationCategory: e.target.value || undefined })}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    >
                      <option value="">None / General</option>
                      {OPERATION_CATEGORIES.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Related Pipeline Styles (Multi-select + All Styles toggle) */}
                <div className="rounded-xl border border-[#1b2233] bg-[#0c1018] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-semibold text-[#94a3b8] flex items-center gap-1.5">
                      <Shirt className="w-3.5 h-3.5 text-[#cda052]" />
                      Related Pipeline Styles / Products (Single & Multi-Select)
                    </label>
                    <span className="text-[11px] text-[#64748b]">
                      {isAllStylesSelected
                        ? 'All 6 Styles Selected'
                        : `${selectedStyleIds.length} style${selectedStyleIds.length === 1 ? '' : 's'} selected`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {/* "All Styles" shortcut */}
                    <button
                      type="button"
                      onClick={() => handleToggleStyle('all')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isAllStylesSelected
                          ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-sm shadow-emerald-950'
                          : 'bg-[#0e121b] border-[#222c42] text-[#94a3b8] hover:text-white hover:border-[#354566]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      All Styles / All Strains
                    </button>

                    {/* Individual Style Pills */}
                    {pipelineItems.map((style) => {
                      const isSelected = selectedStyleIds.includes('all') || selectedStyleIds.includes(style.id);
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => handleToggleStyle(style.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-[#151d2e] border-[#cda052] text-white shadow-sm'
                              : 'bg-[#0e121b] border-[#1e273a] text-[#8593aa] hover:text-white hover:border-[#2d3a54]'
                          }`}
                        >
                          <Shirt className={`w-3 h-3 ${isSelected ? 'text-[#cda052]' : 'text-[#64748b]'}`} />
                          {style.styleName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dates: ONLY shown for Epic and Feature. Omitted for Story and Task per user instructions */}
                {isDateApplicable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">Start Date</label>
                      <input
                        type="date"
                        value={form.startDate || ''}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">Target Date</label>
                      <input
                        type="date"
                        value={form.targetDate || ''}
                        onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50"
                      />
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="text-[11px] font-semibold text-[#94a3b8] block mb-1">Tags (comma-separated)</label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Outreach, Fabric, Dasani, Sampling"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50"
                  />
                </div>

                {/* Description Textarea (Generous height, full display) */}
                <div>
                  <label className="text-xs font-semibold text-[#94a3b8] block mb-1.5">Description</label>
                  <textarea
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={5}
                    placeholder="Provide complete details, scope, manufacturer contact points, or tech specs..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50 leading-relaxed"
                  />
                </div>

                {/* Acceptance Criteria Textarea (Generous height, full display) */}
                <div>
                  <label className="text-xs font-semibold text-emerald-400 block mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Acceptance Criteria
                  </label>
                  <textarea
                    value={form.acceptanceCriteria || ''}
                    onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })}
                    rows={4}
                    placeholder="Checklist of conditions required to mark this item complete (e.g. Fabric GSM verified, sample fit passed)..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0e121b] border border-emerald-900/40 text-sm text-white focus:outline-none focus:border-emerald-500/50 leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#171d2b] bg-[#0c1018]/90">
            {isExisting ? (
              <button
                onClick={handleDelete}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Item
              </button>
            ) : <span />}

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-white transition-colors"
              >
                Close
              </button>

              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  title="Save changes"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold hover:shadow-glow transition-all disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Work Item'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
