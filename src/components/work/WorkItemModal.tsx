'use client';

import React, { useState } from 'react';
import { X, Save, MessageSquare, Send, Layers } from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { WorkItem, WorkItemType, WorkItemState, WorkItemPriority } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import ModalPortal from '@/components/ui/ModalPortal';

const TYPES: WorkItemType[] = ['Epic', 'Feature', 'User Story', 'Task', 'Bug'];
const STATES: WorkItemState[] = ['New', 'Active', 'In Review', 'Resolved', 'Closed'];
const PRIORITIES: WorkItemPriority[] = [1, 2, 3, 4];

export const TYPE_COLOR: Record<WorkItemType, string> = {
  'Epic': 'bg-purple-950/60 text-purple-300 border-purple-800/50',
  'Feature': 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50',
  'User Story': 'bg-sky-950/60 text-sky-300 border-sky-800/50',
  'Task': 'bg-[#182030] text-[#94a3b8] border-[#263148]',
  'Bug': 'bg-rose-950/60 text-rose-300 border-rose-800/50',
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

interface WorkItemModalProps {
  item: WorkItem | (Omit<WorkItem, 'createdAt' | 'updatedAt' | 'comments'> & { comments?: WorkItem['comments'] });
  onClose: () => void;
  defaultSprintId?: string;
}

export default function WorkItemModal({ item, onClose }: WorkItemModalProps) {
  const { workItems, sprints, teamMembers, vendors, pipelineItems, saveWorkItem, deleteWorkItem, addWorkItemComment } = useAdminStore();
  const { user } = useAuth();
  const [form, setForm] = useState<WorkItem>({
    ...(item as WorkItem),
    comments: (item as WorkItem).comments || [],
    tags: (item as WorkItem).tags || [],
  });
  const [tagsInput, setTagsInput] = useState(form.tags.join(', '));
  const [commentText, setCommentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!(item as WorkItem).createdAt;

  const possibleParents = workItems.filter((w) => w.id !== form.id);

  // `form` is a local snapshot taken when the modal opened. Comments, though,
  // can be added while the modal is open (handleAddComment writes straight to
  // the store) — reading them from the live store instead of the stale local
  // snapshot fixes two things: the discussion thread updating immediately
  // after posting, and clicking Save no longer overwriting the store's
  // current comment list with the older one captured at open-time (which
  // would silently delete any comment posted since).
  const liveItem = workItems.find((w) => w.id === form.id);
  const liveComments = liveItem?.comments ?? form.comments;

  const handleSave = async () => {
    if (!form.title || form.title.trim().length < 3) {
      setError('Title is required (minimum 3 characters).');
      return;
    }
    setError(null);
    setIsSaving(true);
    const now = new Date().toISOString();
    await saveWorkItem({
      ...form,
      title: form.title.trim(),
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      comments: liveComments,
      createdAt: form.createdAt || now,
      updatedAt: now,
    });
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${form.title}"? Any sub-items will also be removed.`)) return;
    await deleteWorkItem(form.id);
    onClose();
  };

  const [isPostingComment, setIsPostingComment] = useState(false);

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || isPostingComment) return;
    setCommentText('');
    setIsPostingComment(true);
    try {
      await addWorkItemComment(form.id, text, user?.name || 'Rivlet Admin');
    } catch {
      // Restore the draft so a failed post doesn't silently lose what was typed.
      setCommentText(text);
    } finally {
      setIsPostingComment(false);
    }
  };

  return (
    <ModalPortal isOpen={true}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={onClose}>
        <div
          className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Work item details"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${TYPE_COLOR[form.type]}`}>{form.type}</span>
              <h2 className="text-base font-semibold text-white">{isEditing ? `Edit ${form.type}` : `New ${form.type}`}</h2>
            </div>
            <button onClick={onClose} aria-label="Close" title="Close" className="text-[#94a3b8] hover:text-white">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {error && <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">{error}</div>}

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[#94a3b8] block mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Confirm lab-dip approval with Techno Sportswear"
                className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as WorkItemType })}
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50">
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">State</label>
                <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value as WorkItemState, completedDate: (e.target.value === 'Closed' || e.target.value === 'Resolved') ? (form.completedDate || new Date().toISOString().slice(0, 10)) : form.completedDate })}
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50">
                  {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) as WorkItemPriority })}
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50">
                  {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Story Points</label>
                <input type="number" step="0.5" value={form.storyPoints ?? ''} onChange={(e) => setForm({ ...form, storyPoints: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Assignee</label>
                <select value={form.assignee || ''} onChange={(e) => setForm({ ...form, assignee: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => <option key={m.id} value={m.name}>{m.name}{m.role ? ` (${m.role})` : ''}</option>)}
                  {form.assignee && !teamMembers.some((m) => m.name === form.assignee) && (
                    <option value={form.assignee}>{form.assignee} (not on roster)</option>
                  )}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Sprint</label>
                <select value={form.sprintId || ''} onChange={(e) => setForm({ ...form, sprintId: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
                  <option value="">Backlog (unscheduled)</option>
                  {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Related Manufacturer</label>
                <select value={form.linkedVendorId || ''} onChange={(e) => setForm({ ...form, linkedVendorId: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
                  <option value="">None</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Related Pipeline Style</label>
                <select value={form.linkedPipelineItemId || ''} onChange={(e) => setForm({ ...form, linkedPipelineItemId: e.target.value || undefined })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
                  <option value="">None</option>
                  {pipelineItems.map((p) => <option key={p.id} value={p.id}>{p.styleName}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#94a3b8] block mb-1 flex items-center gap-1"><Layers className="w-3 h-3" /> Parent</label>
              <select value={form.parentId || ''} onChange={(e) => setForm({ ...form, parentId: e.target.value || undefined })}
                className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50">
                <option value="">No parent (top-level)</option>
                {possibleParents.map((p) => <option key={p.id} value={p.id}>{p.type}: {p.title}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Start Date</label>
                <input type="date" value={form.startDate || ''} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50" />
              </div>
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Target Date</label>
                <input type="date" value={form.targetDate || ''} onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50" />
              </div>
              <div>
                <label className="text-[11px] text-[#94a3b8] block mb-1">Tags</label>
                <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Outreach, Vendor"
                  className="w-full px-2.5 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50" />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#94a3b8] block mb-1">Description</label>
              <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50 resize-none" />
            </div>

            <div>
              <label className="text-[11px] text-[#94a3b8] block mb-1">Acceptance Criteria</label>
              <textarea value={form.acceptanceCriteria || ''} onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })} rows={3}
                placeholder="Given / When / Then, or a checklist of done conditions"
                className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50 resize-none" />
            </div>

            {/* Discussion / Activity thread — only for existing items */}
            {isEditing && (
              <div className="pt-2 border-t border-[#161a26]">
                <label className="text-[11px] text-[#94a3b8] block mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Discussion</label>
                <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                  {liveComments.length === 0 && <p className="text-xs text-[#5f6c85]">No comments yet.</p>}
                  {liveComments.map((c) => (
                    <div key={c.id} className="bg-[#0e121b] border border-[#1c2438] rounded-lg p-2.5 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-[#cbd5e1]">{c.author}</span>
                        <span className="text-[10px] text-[#5f6c85]">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-[#94a3b8]">{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    placeholder="Add a comment..."
                    disabled={isPostingComment}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-xs text-white focus:outline-none focus:border-[#cda052]/50 disabled:opacity-60"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={isPostingComment || !commentText.trim()}
                    title="Post comment"
                    aria-label="Post comment"
                    className="p-2 rounded-lg bg-[#141724] text-[#cda052] hover:bg-[#1a1f2e] disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-5">
            {isEditing ? (
              <button onClick={handleDelete} className="text-xs text-rose-400 hover:text-rose-300 font-medium">Delete</button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} title="Save work item" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold disabled:opacity-60">
                <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
