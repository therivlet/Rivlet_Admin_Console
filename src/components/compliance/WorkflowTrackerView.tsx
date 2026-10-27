'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Building,
  FileText,
  BellRing,
  ExternalLink,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import {
  ComplianceWorkflowItem,
  ComplianceCategory,
  ComplianceStatus,
} from '@/lib/types';
import { addDurableNotification } from '@/lib/notificationStorage';

interface WorkflowTrackerViewProps {
  workflows: ComplianceWorkflowItem[];
  onSaveWorkflows: (updated: ComplianceWorkflowItem[]) => void;
}

export default function WorkflowTrackerView({
  workflows,
  onSaveWorkflows,
}: WorkflowTrackerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filingModalItem, setFilingModalItem] = useState<ComplianceWorkflowItem | null>(null);
  const [arnInput, setArnInput] = useState('');

  // Form State for New Workflow
  const [newTitle, setNewTitle] = useState('');
  const [newEntity, setNewEntity] = useState('Rivlet Luxury Apparel Private Limited');
  const [newCategory, setNewCategory] = useState<ComplianceCategory>('gst');
  const [newReturnType, setNewReturnType] = useState('GSTR-1');
  const [newPeriod, setNewPeriod] = useState('November 2026');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newAssignee, setNewAssignee] = useState('Chief Financial Officer');
  const [newNotes, setNewNotes] = useState('');

  // Filtered workflows
  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.returnType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || w.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleCreateWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    const newItem: ComplianceWorkflowItem = {
      id: `wf-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      entityName: newEntity.trim(),
      returnType: newReturnType.trim(),
      taxPeriod: newPeriod.trim(),
      dueDate: newDueDate,
      statutoryDeadline: newDeadline || newDueDate,
      status: 'upcoming',
      assignedTo: newAssignee.trim(),
      notes: newNotes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...workflows];
    onSaveWorkflows(updated);
    setIsCreateModalOpen(false);

    // Reset form
    setNewTitle('');
    setNewDueDate('');
    setNewDeadline('');
    setNewNotes('');
  };

  const handleMarkFiled = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filingModalItem) return;

    const updated = workflows.map((w) => {
      if (w.id === filingModalItem.id) {
        return {
          ...w,
          status: 'filed' as ComplianceStatus,
          arnNumber: arnInput.trim() || w.arnNumber || `ARN${Date.now()}`,
          updatedAt: new Date().toISOString(),
        };
      }
      return w;
    });

    onSaveWorkflows(updated);
    setFilingModalItem(null);
    setArnInput('');
  };

  const handleSendReminder = async (item: ComplianceWorkflowItem) => {
    try {
      await addDurableNotification({
        title: `Statutory Reminder: ${item.title}`,
        message: `${item.returnType} for ${item.taxPeriod} is due on ${item.dueDate}. Assigned to ${item.assignedTo}.`,
        link: '/compliance?tab=workflows',
        type: 'reminder',
        priority: 'high',
        module: 'compliance',
      });
      alert(`Reminder dispatched to notification center for ${item.title}!`);
    } catch (err) {
      console.error('Error dispatching reminder:', err);
    }
  };

  const getStatusBadge = (status: ComplianceStatus) => {
    switch (status) {
      case 'filed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Filed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search, Filters, and Add Workflow Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1e140e] dark:bg-[#0c101a] p-3.5 rounded-2xl border border-[#3d2b20] dark:border-[#1a2233]">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#a99a8b]" />
            <input
              type="text"
              placeholder="Search workflows, entities, return types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 text-xs text-white placeholder-[#8895ad] border border-white/10 focus:border-[#cda052] outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-black/40 text-xs text-white border border-white/10 focus:border-[#cda052] outline-none"
          >
            <option value="all">All Categories</option>
            <option value="gst">GST (GSTR-1 / 3B)</option>
            <option value="icegate">ICEGATE Customs</option>
            <option value="itr">Income Tax (ITR)</option>
            <option value="tds">TDS Returns (26Q)</option>
            <option value="dsc">DSC Certificate</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-black/40 text-xs text-white border border-white/10 focus:border-[#cda052] outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="in_progress">In Progress</option>
            <option value="filed">Filed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-black font-semibold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {/* Primary Compliance Grid / Table */}
      <div className="bg-[#18100b] dark:bg-[#090c14] rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-black/40 text-[#a99a8b] uppercase tracking-wider text-[10px] border-b border-white/10">
                <th className="py-3 px-4 font-semibold">Workflow</th>
                <th className="py-3 px-4 font-semibold">Client / Entity</th>
                <th className="py-3 px-4 font-semibold">Return Type & Period</th>
                <th className="py-3 px-4 font-semibold">Due Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Assignee</th>
                <th className="py-3 px-4 font-semibold">ARN / Challan</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#a99a8b]">
                    No compliance workflows match your criteria.
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Workflow Title */}
                    <td className="py-3.5 px-4 font-medium text-white max-w-[240px]">
                      <div className="flex items-start gap-2">
                        <span className="p-1 rounded bg-black/40 text-[#cda052] border border-white/10 mt-0.5">
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                        <div>
                          <div className="font-semibold text-white group-hover:text-[#f7d88c] transition-colors">
                            {item.title}
                          </div>
                          {item.notes && (
                            <div className="text-[11px] text-[#8895ad] line-clamp-1">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Client / Entity */}
                    <td className="py-3.5 px-4 text-[#cbd5e1] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#a99a8b]" />
                        <span>{item.entityName}</span>
                      </div>
                    </td>

                    {/* Return Type & Period */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{item.returnType}</div>
                      <div className="text-[11px] text-[#a99a8b]">{item.taxPeriod}</div>
                    </td>

                    {/* Due Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-white">
                        <Calendar className="w-3.5 h-3.5 text-[#cda052]" />
                        <span>{item.dueDate}</span>
                      </div>
                      <div className="text-[10px] text-[#8895ad]">
                        Cutoff: {item.statutoryDeadline}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Assignee */}
                    <td className="py-3.5 px-4 text-[#cbd5e1] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#cda052]" />
                        <span>{item.assignedTo}</span>
                      </div>
                    </td>

                    {/* ARN Reference */}
                    <td className="py-3.5 px-4 font-mono text-xs whitespace-nowrap">
                      {item.arnNumber ? (
                        <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {item.arnNumber}
                        </span>
                      ) : (
                        <span className="text-[#8895ad] italic">Pending Filing</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status !== 'filed' && (
                          <button
                            onClick={() => {
                              setFilingModalItem(item);
                              setArnInput(item.arnNumber || '');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 font-semibold text-[11px] transition-colors"
                            title="Mark as Filed"
                          >
                            Mark Filed
                          </button>
                        )}
                        <button
                          onClick={() => handleSendReminder(item)}
                          className="p-1.5 rounded-lg text-[#a99a8b] hover:text-[#f7d88c] hover:bg-white/5 transition-colors"
                          title="Trigger Due Date Reminder"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Workflow */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e140e] dark:bg-[#0c101a] w-full max-w-xl rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] shadow-2xl p-5 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#cda052]" />
                <span>Create Statutory Compliance Workflow</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-[#a99a8b] hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Workflow Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSTR-1 Outward Supplies Filing"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#cda052] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ComplianceCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#cda052] outline-none"
                  >
                    <option value="gst">GST (Goods & Services Tax)</option>
                    <option value="icegate">ICEGATE Customs</option>
                    <option value="itr">Direct Tax / ITR</option>
                    <option value="tds">TDS Returns</option>
                    <option value="dsc">Digital Signature (DSC)</option>
                    <option value="other">General Statutory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Client / Legal Entity</label>
                  <input
                    type="text"
                    required
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#cda052] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Return Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GSTR-1, GSTR-3B, Form 26Q"
                    value={newReturnType}
                    onChange={(e) => setNewReturnType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#cda052] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Tax Period</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. November 2026 / Q3 FY26"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#cda052] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#cda052] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#a99a8b] mb-1 font-medium">Statutory Cutoff Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#cda052] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Assignee / CA Lead</label>
                <input
                  type="text"
                  required
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#cda052] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">Operational Notes</label>
                <textarea
                  rows={2}
                  placeholder="Supporting instructions, e-Invoice checks, portal details..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white border border-white/10 focus:border-[#cda052] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black/40 text-[#a99a8b] hover:text-white border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#cda052] text-black font-semibold hover:bg-[#dfb56c]"
                >
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark Filed & Enter ARN */}
      {filingModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e140e] dark:bg-[#0c101a] w-full max-w-md rounded-2xl border border-[#3d2b20] dark:border-[#1a2233] shadow-2xl p-5">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Record Statutory Filing Completion</span>
            </h3>
            <p className="text-xs text-[#a99a8b] mb-4">
              {filingModalItem.title} ({filingModalItem.taxPeriod})
            </p>

            <form onSubmit={handleMarkFiled} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#a99a8b] mb-1 font-medium">
                  Acknowledgment Reference Number (ARN) / Challan No *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AA331026001928K"
                  value={arnInput}
                  onChange={(e) => setArnInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 text-white font-mono border border-white/10 focus:border-emerald-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setFilingModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-black/40 text-[#a99a8b] hover:text-white border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400"
                >
                  Confirm Filing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
