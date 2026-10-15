'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
  ArrowRightLeft,
  Link2,
  Unlink,
  Calendar,
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
  1: 'P1: Critical',
  2: 'P2: High',
  3: 'P3: Medium',
  4: 'P4: Low',
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
  const { workItems, sprints, teamMembers, vendors, pipelineItems, saveWorkItem, deleteWorkItem, addWorkItemComment, moveWorkItemToSprint, moveTaskToStory } = useAdminStore();
  const { user } = useAuth();

  const [activeItem, setActiveItem] = useState<WorkItem | (Omit<WorkItem, 'createdAt' | 'updatedAt' | 'comments'> & { comments?: WorkItem['comments'] })>(item);

  const isExisting = !!(activeItem as WorkItem).createdAt;
  // If opening an existing story or task, show in read-only big screen mode by default unless explicitly asked to edit
  const [isEditing, setIsEditing] = useState<boolean>(!isExisting || !!startInEditMode);

  // Initialize form state
  const [form, setForm] = useState<WorkItem>(() => {
    const raw = activeItem as WorkItem;
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

  // Sync form when active item changes (e.g. clicking parent/child in breadcrumb)
  useEffect(() => {
    const raw = activeItem as WorkItem;
    let initialStyleIds: string[] = [];
    if (Array.isArray(raw.linkedPipelineItemIds) && raw.linkedPipelineItemIds.length > 0) {
      initialStyleIds = raw.linkedPipelineItemIds;
    } else if (raw.linkedPipelineItemId) {
      initialStyleIds = [raw.linkedPipelineItemId];
    }
    setForm({
      ...raw,
      comments: raw.comments || [],
      tags: raw.tags || [],
      linkedPipelineItemIds: initialStyleIds,
      operationCategory: raw.operationCategory || undefined,
    });
    setTagsInput((raw.tags || []).join(', '));
  }, [activeItem]);

  const switchItem = (next: WorkItem) => {
    setActiveItem(next);
    setIsEditing(false);
    setError(null);
  };

  const [tagsInput, setTagsInput] = useState(form.tags.join(', '));
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isCreatingChildItem, setIsCreatingChildItem] = useState(false);
  const [childItemTitle, setChildItemTitle] = useState('');
  const [isAttachingChild, setIsAttachingChild] = useState(false);
  const [selectedAttachId, setSelectedAttachId] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);

  // Live item & comments from store
  const liveItem = workItems.find((w) => w.id === form.id);
  const currentItem = liveItem || form;
  const liveComments = currentItem.comments || [];
  // Stack order: Newest comments at the top, older comments below
  const sortedComments = useMemo(() => {
    return [...liveComments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [liveComments]);

  // Full hierarchy ancestors chain: Task -> Story -> Feature -> Epic
  const hierarchyChain = useMemo(() => {
    const chain: WorkItem[] = [];
    let curParentId = currentItem.parentId;
    while (curParentId) {
      const p = workItems.find((w) => w.id === curParentId);
      if (!p || chain.some((c) => c.id === p.id)) break;
      chain.unshift(p);
      curParentId = p.parentId;
    }
    return chain;
  }, [workItems, currentItem.parentId]);

  // Child items (e.g. Tasks under this Story, Stories under this Feature, Features under this Epic)
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

  // Dynamic position number based on active sprint board placement
  const boardPosition = useMemo(() => {
    if (!currentItem.sprintId) return null;
    if (currentItem.type === 'User Story' || currentItem.type === 'Bug') {
      const stories = workItems
        .filter((w) => w.sprintId === currentItem.sprintId && ['User Story', 'Bug'].includes(w.type))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const idx = stories.findIndex((s) => s.id === currentItem.id);
      return idx >= 0 ? `Story #${idx + 1}` : null;
    }
    if (currentItem.type === 'Task') {
      if (currentItem.taskNumber) {
        return `Task #${currentItem.taskNumber}`;
      }
      const siblingTasks = workItems
        .filter(
          (w) =>
            w.sprintId === currentItem.sprintId &&
            w.type === 'Task' &&
            w.parentId === currentItem.parentId
        )
        .sort((a, b) => {
          if (a.taskNumber && b.taskNumber) return a.taskNumber - b.taskNumber;
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (dateA !== dateB) return dateA - dateB;
          return a.id.localeCompare(b.id);
        });
      const idx = siblingTasks.findIndex((t) => t.id === currentItem.id);
      return idx >= 0 ? `Task #${idx + 1}` : null;
    }
    return null;
  }, [workItems, currentItem]);

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
      await addWorkItemComment(form.id, text, user?.name || 'Rivlet Admin');
    } catch {
      setCommentText(text);
    } finally {
      setIsPostingComment(false);
    }
  };

  const childType: WorkItemType = currentItem.type === 'Epic' ? 'Feature' : currentItem.type === 'Feature' ? 'User Story' : 'Task';

  const handleCreateChildItem = async () => {
    if (!childItemTitle.trim()) return;
    const now = new Date().toISOString();
    const newChild: WorkItem = {
      id: `wi-${Date.now()}`,
      type: childType,
      title: childItemTitle.trim(),
      state: 'New',
      priority: 2,
      storyPoints: childType === 'Task' ? 1 : 3,
      parentId: currentItem.id,
      sprintId: currentItem.sprintId,
      assignee: currentItem.assignee || undefined,
      linkedVendorId: currentItem.linkedVendorId,
      linkedPipelineItemIds: currentItem.linkedPipelineItemIds,
      operationCategory: currentItem.operationCategory,
      tags: currentItem.tags || [],
      comments: [],
      createdAt: now,
      updatedAt: now,
    };
    await saveWorkItem(newChild);
    setChildItemTitle('');
    setIsCreatingChildItem(false);
  };

  const handleAttachChildItem = async (candidateId: string) => {
    const candidate = workItems.find((w) => w.id === candidateId);
    if (!candidate) return;
    await saveWorkItem({
      ...candidate,
      parentId: currentItem.id,
      sprintId: currentItem.sprintId || candidate.sprintId,
    });
    setIsAttachingChild(false);
    setSelectedAttachId('');
  };

  const attachableCandidates = useMemo(() => {
    if (currentItem.type === 'User Story') {
      return workItems.filter((w) => (w.type === 'Task' || w.type === 'Bug') && w.parentId !== currentItem.id && w.id !== currentItem.id);
    }
    if (currentItem.type === 'Feature') {
      return workItems.filter((w) => w.type === 'User Story' && w.parentId !== currentItem.id && w.id !== currentItem.id);
    }
    if (currentItem.type === 'Epic') {
      return workItems.filter((w) => w.type === 'Feature' && w.parentId !== currentItem.id && w.id !== currentItem.id);
    }
    return [];
  }, [workItems, currentItem.type, currentItem.id]);

  const renderReadonlyStyles = () => {
    const ids = currentItem.linkedPipelineItemIds || (currentItem.linkedPipelineItemId ? [currentItem.linkedPipelineItemId] : []);
    if (ids.includes('all')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/70 border border-emerald-700/60 text-emerald-300">
          <Shirt className="w-3.5 h-3.5 text-emerald-400" /> All Styles (Drop 1: 6 Styles)
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
              {boardPosition && (
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/40 shadow-sm">
                  {boardPosition}
                </span>
              )}
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

          {/* Interactive Hierarchy Breadcrumb Bar */}
          {hierarchyChain.length > 0 && (
            <div className="flex items-center gap-1.5 px-5 py-2.5 bg-[#080b11] border-b border-[#171d2b] text-xs overflow-x-auto custom-scrollbar">
              <span className="text-[#64748b] text-[10px] font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#cda052]" /> Hierarchy:
              </span>
              {hierarchyChain.map((ancestor, aIdx) => (
                <React.Fragment key={ancestor.id}>
                  {aIdx > 0 && <span className="text-[#3a4863] text-xs">/</span>}
                  <button
                    onClick={() => switchItem(ancestor)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[#121824] text-[#94a3b8] hover:text-[#cda052] transition-colors cursor-pointer"
                    title={`Open parent ${ancestor.type}: ${ancestor.title}`}
                  >
                    <span className={`text-[8px] px-1 py-0.2 rounded border font-semibold ${TYPE_COLOR[ancestor.type]}`}>
                      {ancestor.type}
                    </span>
                    <span className="truncate max-w-[140px] font-medium">{ancestor.title}</span>
                  </button>
                </React.Fragment>
              ))}
              <span className="text-[#3a4863] text-xs">/</span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#101624] text-white font-semibold border border-[#232f48] shadow-sm">
                <span className={`text-[8px] px-1 py-0.2 rounded border font-semibold ${TYPE_COLOR[currentItem.type]}`}>
                  {currentItem.type}
                </span>
                <span className="truncate max-w-[170px]">{currentItem.title || 'Current Item'}</span>
              </span>
            </div>
          )}

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
                  placeholder="e.g. Confirm lab-dip approvals with Layo Group"
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

                  {/* Child Hierarchy Items (Tasks under Story, Stories under Feature, Features under Epic) */}
                  {(currentItem.type === 'User Story' || currentItem.type === 'Feature' || currentItem.type === 'Epic') && (
                    <div className="rounded-xl border border-[#1b2233] bg-[#0c1018] p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7c869d] flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#cda052]" /> {childType}s ({childItems.length})
                          </h3>
                          {childItems.length > 0 && currentItem.type === 'User Story' && (
                            <span className="text-[10px] text-[#7c869d] font-mono">
                              ({childItems.filter((c) => c.state === 'Closed' || c.state === 'Resolved').length}/{childItems.length} completed)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isCreatingChildItem && !isAttachingChild && (
                            <>
                              <button
                                onClick={() => setIsCreatingChildItem(true)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#cda052] bg-[#cda052]/10 hover:bg-[#cda052]/20 border border-[#cda052]/30 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> New {childType}
                              </button>
                              {attachableCandidates.length > 0 && (
                                <button
                                  onClick={() => setIsAttachingChild(true)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[#94a3b8] hover:text-white bg-[#141824] hover:bg-[#1a2130] border border-[#232e44] transition-colors"
                                  title={`Attach an existing ${childType} under this ${currentItem.type}`}
                                >
                                  <Link2 className="w-3.5 h-3.5 text-[#cda052]" /> Attach Existing
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Create New Child Item Input Box */}
                      {isCreatingChildItem && (
                        <div className="mb-3 p-3 rounded-lg border border-[#222c42] bg-[#0f1422] flex items-center gap-2">
                          <input
                            value={childItemTitle}
                            onChange={(e) => setChildItemTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateChildItem(); }}
                            placeholder={`e.g. Title for new ${childType}...`}
                            className="flex-1 px-3 py-1.5 rounded bg-[#0a0c12] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50"
                            autoFocus
                          />
                          <button
                            onClick={handleCreateChildItem}
                            disabled={!childItemTitle.trim()}
                            className="px-3 py-1.5 rounded bg-[#cda052] text-black text-xs font-semibold disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => { setIsCreatingChildItem(false); setChildItemTitle(''); }}
                            className="px-2 py-1.5 text-xs text-[#94a3b8] hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Attach Existing Child Item Selector */}
                      {isAttachingChild && (
                        <div className="mb-3 p-3 rounded-lg border border-[#222c42] bg-[#0f1422] flex items-center gap-2">
                          <select
                            value={selectedAttachId}
                            onChange={(e) => setSelectedAttachId(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded bg-[#0a0c12] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50"
                          >
                            <option value="">Select an existing {childType} to link under here...</option>
                            {attachableCandidates.map((cand) => (
                              <option key={cand.id} value={cand.id}>
                                {cand.title} {cand.parentId ? `(currently in another parent)` : '(unparented)'}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => selectedAttachId && handleAttachChildItem(selectedAttachId)}
                            disabled={!selectedAttachId}
                            className="px-3 py-1.5 rounded bg-[#cda052] text-black text-xs font-semibold disabled:opacity-50"
                          >
                            Link
                          </button>
                          <button
                            onClick={() => { setIsAttachingChild(false); setSelectedAttachId(''); }}
                            className="px-2 py-1.5 text-xs text-[#94a3b8] hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {childItems.length === 0 && !isCreatingChildItem && !isAttachingChild ? (
                        <p className="text-xs text-[#54627a] italic">No {childType.toLowerCase()}s linked to this {currentItem.type.toLowerCase()} yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {childItems.map((child, childIdx) => {
                            const childTasksCount = child.type === 'User Story' ? workItems.filter((w) => w.parentId === child.id).length : 0;

                            return (
                              <div
                                key={child.id}
                                onClick={() => switchItem(child)}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border border-[#1a2233] bg-[#080b11] hover:border-[#2a3754] transition-all cursor-pointer group gap-2"
                              >
                                <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#cda052]/20 text-[#cda052] border border-[#cda052]/40 flex-shrink-0">
                                    #{childIdx + 1}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${TYPE_COLOR[child.type]}`}>
                                    {child.type}
                                  </span>
                                  <span className="text-xs text-white font-medium truncate group-hover:text-[#cda052] transition-colors">
                                    {child.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                                  {childTasksCount > 0 && (
                                    <span className="text-[10px] text-[#7c869d] font-mono px-1.5 py-0.5 rounded bg-[#10141e] border border-[#1e2535]">
                                      {childTasksCount} tasks
                                    </span>
                                  )}

                                  {child.assignee && (
                                    <span className="text-[10px] text-[#7c869d] flex items-center gap-0.5">
                                      <User className="w-2.5 h-2.5" /> {child.assignee}
                                    </span>
                                  )}

                                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${STATE_COLOR[child.state]}`}>
                                    {child.state}
                                  </span>

                                  {/* Independent Move Task to another Story */}
                                  {child.type === 'Task' && (
                                    <select
                                      value={child.parentId || ''}
                                      onChange={async (e) => {
                                        const nextStoryId = e.target.value || undefined;
                                        await moveTaskToStory(child.id, nextStoryId);
                                      }}
                                      title="Move this task independently to another User Story"
                                      className="text-[9px] bg-[#0d121c] border border-[#222d42] hover:border-[#cda052]/60 rounded px-1.5 py-0.5 text-[#cbd5e1] focus:outline-none"
                                    >
                                      <option value={currentItem.id}>• In this Story</option>
                                      {workItems.filter((w) => w.type === 'User Story' && w.id !== currentItem.id).map((s) => (
                                        <option key={s.id} value={s.id}>
                                          → Move to: {s.title.slice(0, 20)}
                                        </option>
                                      ))}
                                      <option value="">→ Make Unparented</option>
                                    </select>
                                  )}

                                  {/* Detach button for non-tasks or quick unlink */}
                                  <button
                                    onClick={async () => {
                                      await saveWorkItem({ ...child, parentId: undefined });
                                    }}
                                    title={`Unlink this ${child.type} from this ${currentItem.type}`}
                                    className="p-1 rounded text-[#64748b] hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                                  >
                                    <Unlink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Discussion / Comment Box - input box at top, comments listed at bottom of text box */}
                  <div className="rounded-xl border border-[#1b2233] bg-[#0c1018] p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-[#171d2b] pb-2.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7c869d] flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#cda052]" /> Discussion & Comments ({liveComments.length})
                      </h3>
                    </div>

                    {/* Add Comment Input - Placed at the top */}
                    <div>
                      <label className="text-[11px] font-medium text-[#94a3b8] block mb-1.5">Add a Comment / Note</label>
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
                          placeholder="Type your comment or update here..."
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

                    {/* Comment list - Appears at the bottom of the text box, stacked newest first */}
                    <div className="space-y-2 pt-1 border-t border-[#171d2b]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium text-[#64748b]">Comment History</span>
                        {sortedComments.length > 0 && (
                          <span className="text-[10px] text-[#cda052] font-semibold bg-[#cda052]/10 px-2 py-0.5 rounded border border-[#cda052]/20">
                            Newest at top (Stack)
                          </span>
                        )}
                      </div>
                      {sortedComments.length === 0 ? (
                        <p className="text-xs text-[#54627a] italic p-3 rounded-lg bg-[#080b11] border border-[#171e2e]">
                          No comments yet. Type in the box above to add a comment.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                          {(showAllComments ? sortedComments : sortedComments.slice(0, 5)).map((c, idx) => (
                            <div key={c.id} className="p-3 rounded-lg bg-[#0e1320] border border-[#1a2336] text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-white flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#cda052] to-[#7f5a1c] text-black text-[10px] font-bold flex items-center justify-center">
                                    {c.author ? c.author[0]?.toUpperCase() : '?'}
                                  </span>
                                  {c.author}
                                  {idx === 0 && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 font-medium">
                                      Latest
                                    </span>
                                  )}
                                </span>
                                <span className="text-[10px] text-[#64748b]">{new Date(c.createdAt).toLocaleString()}</span>
                              </div>
                              <p className="text-[#cbd5e1] leading-relaxed pl-6 whitespace-pre-wrap">{c.text}</p>
                            </div>
                          ))}

                          {sortedComments.length > 5 && (
                            <div className="pt-2 flex items-center justify-between border-t border-[#1a2336]">
                              <span className="text-[11px] text-[#7c869d]">
                                Showing {showAllComments ? sortedComments.length : 5} of {sortedComments.length} comments
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowAllComments(!showAllComments)}
                                className="flex items-center gap-1.5 text-xs text-[#cda052] hover:text-[#e6c875] font-semibold transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-[#141a28]"
                              >
                                {showAllComments ? (
                                  <>
                                    <span>Show fewer (Top 5)</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>Show more ({sortedComments.length - 5} remaining)</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
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
                      <span className="text-[11px] text-[#7c869d] block mb-1.5 uppercase tracking-wider font-semibold">Assignee</span>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#080b11] border border-[#1a2233]">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          currentItem.assignee 
                            ? 'bg-gradient-to-br from-[#cda052] to-[#8c672b] text-black shadow-glow' 
                            : 'bg-[#141824] text-[#64748b] border border-[#263148]'
                        }`}>
                          {currentItem.assignee ? currentItem.assignee[0]?.toUpperCase() : <User className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${currentItem.assignee ? 'text-[#451a03] dark:text-[#f5dfa8]' : 'text-[#8594ab] italic'}`}>
                            {currentItem.assignee || 'Unassigned'}
                          </p>
                          {currentItem.assignee ? (
                            <p className="text-[10px] text-[#94a3b8] truncate">
                              {teamMembers.find((m) => m.name === currentItem.assignee)?.role || 'Team Member'}
                            </p>
                          ) : (
                            <p className="text-[10px] text-[#64748b]">Select below to assign owner</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sprint */}
                    <div>
                      <span className="text-[11px] text-[#64748b] block mb-1">Sprint Scheduling</span>
                      {sprint ? (
                        <div className="p-2.5 rounded-lg bg-[#080b11] border border-[#1a2233]">
                          <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[#cda052]" /> {sprint.name}
                          </p>
                          <p className="text-[10px] text-[#64748b] mt-0.5">
                            {new Date(sprint.startDate).toLocaleDateString()} → {new Date(sprint.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-[#080b11] border border-[#1a2233]">
                          <p className="text-xs text-[#94a3b8] italic">Backlog (Unscheduled)</p>
                        </div>
                      )}

                      {(currentItem.type === 'User Story' || currentItem.type === 'Feature') && childItems.length > 0 && (
                        <p className="text-[10px] text-amber-300/80 mt-1 leading-snug">
                          Note: Moving sprint will cascade to all {childItems.length} linked child {currentItem.type === 'User Story' ? 'task(s)' : 'story/tasks'}.
                        </p>
                      )}

                      {/* Quick Move Sprint Selector */}
                      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                        <label className="text-[10px] text-[#7c869d] block mb-1 font-semibold flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-[#cda052]" /> {currentItem.type === 'Task' ? 'Change Sprint (independent):' : 'Move to Sprint (with child items):'}
                        </label>
                        <select
                          value={currentItem.sprintId || ''}
                          onChange={async (e) => {
                            const nextSprint = e.target.value === 'backlog' ? undefined : (e.target.value || undefined);
                            await moveWorkItemToSprint(currentItem.id, nextSprint);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-[#080b11] border border-[#1f2638] text-xs text-[#cbd5e1] focus:outline-none focus:border-[#cda052]/60"
                        >
                          <option value="" disabled>Select target sprint...</option>
                          {sprints.map((s) => (
                            <option key={s.id} value={s.id} disabled={s.id === currentItem.sprintId}>
                              {s.id === currentItem.sprintId ? `• Current: ${s.name}` : `→ Move to: ${s.name}`}
                            </option>
                          ))}
                          <option value="backlog">→ Move to Backlog</option>
                        </select>
                      </div>
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
                        <div
                          onClick={() => switchItem(parentItem)}
                          className="p-2.5 rounded-lg bg-[#080b11] border border-[#1a2233] hover:border-[#303f5c] transition-colors cursor-pointer group"
                          title={`Click to view parent ${parentItem.type}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${TYPE_COLOR[parentItem.type]}`}>
                              {parentItem.type}
                            </span>
                            <span className="text-[9px] text-[#64748b] group-hover:text-[#cda052]">open →</span>
                          </div>
                          <p className="text-xs text-white font-medium truncate group-hover:text-[#cda052]">{parentItem.title}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-[#64748b] italic">No parent (Top-level {currentItem.type})</p>
                      )}

                      {/* Quick Independent Task Re-Parenting */}
                      {(currentItem.type === 'Task' || currentItem.type === 'Bug') && (
                        <div className="mt-2 pt-2 border-t border-[#1a2233]" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[10px] text-[#7c869d] block mb-1 font-semibold flex items-center gap-1">
                            <ArrowRightLeft className="w-2.5 h-2.5 text-[#cda052]" /> Move Task to another Story:
                          </label>
                          <select
                            value={currentItem.parentId || ''}
                            onChange={async (e) => {
                              const targetStoryId = e.target.value || undefined;
                              await moveTaskToStory(currentItem.id, targetStoryId);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#080b11] border border-[#1f2638] text-xs text-[#cbd5e1] focus:outline-none focus:border-[#cda052]/60"
                          >
                            <option value="">Unlink (Make Unparented)</option>
                            {workItems.filter((w) => w.type === 'User Story' && w.id !== currentItem.id).map((s) => {
                              const sSprint = sprints.find((sp) => sp.id === s.sprintId)?.name || 'Backlog';
                              return (
                                <option key={s.id} value={s.id}>
                                  {s.title} ({sSprint})
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}

                      {/* Quick Story Re-Parenting to Feature */}
                      {currentItem.type === 'User Story' && (
                        <div className="mt-2 pt-2 border-t border-[#1a2233]" onClick={(e) => e.stopPropagation()}>
                          <label className="text-[10px] text-[#7c869d] block mb-1 font-semibold flex items-center gap-1">
                            <Layers className="w-2.5 h-2.5 text-[#cda052]" /> Link under Feature:
                          </label>
                          <select
                            value={currentItem.parentId || ''}
                            onChange={async (e) => {
                              const targetFeatureId = e.target.value || undefined;
                              await saveWorkItem({ ...currentItem, parentId: targetFeatureId });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-[#080b11] border border-[#1f2638] text-xs text-[#cbd5e1] focus:outline-none focus:border-[#cda052]/60"
                          >
                            <option value="">No Parent Feature (Top-level Story)</option>
                            {workItems.filter((w) => w.type === 'Feature' && w.id !== currentItem.id).map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.title}
                              </option>
                            ))}
                          </select>
                        </div>
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
                    {(form.type === 'User Story' || form.type === 'Feature') && childItems.length > 0 && (
                      <p className="text-[10px] text-amber-300/80 mt-1 leading-snug">
                        Note: Moving this {form.type} will automatically move all {childItems.length} linked child {form.type === 'User Story' ? 'tasks' : 'stories/tasks'} to the new sprint.
                      </p>
                    )}
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
                      onChange={(e) => {
                        const nextParentId = e.target.value || undefined;
                        const parent = workItems.find((w) => w.id === nextParentId);
                        setForm({
                          ...form,
                          parentId: nextParentId,
                          sprintId: (form.type === 'Task' && parent?.sprintId) ? parent.sprintId : form.sprintId,
                        });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#080b11] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
                    >
                      <option value="">No parent (Top-level {form.type})</option>
                      {allowedParents.map((p) => {
                        const pSprint = sprints.find((s) => s.id === p.sprintId)?.name || 'Backlog';
                        return (
                          <option key={p.id} value={p.id}>
                            {p.type}: {p.title} (Sprint: {pSprint})
                          </option>
                        );
                      })}
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
                          <span>{style.styleName}</span>
                          {style.hsnCode && (
                            <span className="font-mono text-[10px] text-[#cda052]/80">(HSN: {style.hsnCode})</span>
                          )}
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
                    placeholder="Outreach, Fabric, Quality, Sampling"
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
