'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Building,
  FileText,
  BellRing,
  MoreHorizontal,
  Edit3,
  Trash2,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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

type SortField =
  | 'title'
  | 'entityName'
  | 'returnType'
  | 'dueDate'
  | 'status'
  | 'assignedTo'
  | 'arnNumber';

export default function WorkflowTrackerView({
  workflows,
  onSaveWorkflows,
}: WorkflowTrackerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sorting State
  const [sortField, setSortField] = useState<SortField | null>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Three-dot action menu tracking
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ComplianceWorkflowItem | null>(null);
  const [filingModalItem, setFilingModalItem] = useState<ComplianceWorkflowItem | null>(null);
  const [arnInput, setArnInput] = useState('');

  // Form State for New Workflow
  const [newTitle, setNewTitle] = useState('');
  const [newEntity, setNewEntity] = useState('Rivlet Apparel Private Limited');
  const [newCategory, setNewCategory] = useState<ComplianceCategory>('gst');
  const [newReturnType, setNewReturnType] = useState('GSTR-1');
  const [newPeriod, setNewPeriod] = useState('November 2026');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newAssignee, setNewAssignee] = useState('Chief Financial Officer');
  const [newNotes, setNewNotes] = useState('');

  // Close three-dot menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [openMenuId]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered workflows
  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.returnType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.arnNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || w.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorted workflows
  const sortedWorkflows = useMemo(() => {
    const list = [...filteredWorkflows];
    if (!sortField) return list;
    return list.sort((a, b) => {
      let valA: string | number = a[sortField] || '';
      let valB: string | number = b[sortField] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredWorkflows, sortField, sortDirection]);

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

  const handleEditWorkflowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkflow) return;

    const updated = workflows.map((w) =>
      w.id === editingWorkflow.id
        ? {
            ...editingWorkflow,
            updatedAt: new Date().toISOString(),
          }
        : w
    );

    onSaveWorkflows(updated);
    setEditingWorkflow(null);
  };

  const handleDeleteWorkflow = (id: string) => {
    if (confirm('Are you sure you want to remove this statutory compliance workflow?')) {
      const updated = workflows.filter((w) => w.id !== id);
      onSaveWorkflows(updated);
      setOpenMenuId(null);
    }
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
    setOpenMenuId(null);
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
      setOpenMenuId(null);
    } catch (err) {
      console.error('Error dispatching reminder:', err);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#cda052]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#cda052]" />
    );
  };

  const getStatusBadge = (status: ComplianceStatus) => {
    switch (status) {
      case 'filed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Filed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            In Progress
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-800 dark:text-sky-400 border border-sky-500/30">
            <Clock className="w-3 h-3" />
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Search, Filters, and New Workflow Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0e121b] p-4 rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8a96ae]" />
            <input
              type="text"
              placeholder="Search workflows, entities, return types, ARN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#080b12] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none transition-colors"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#080b12] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
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
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#080b12] text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
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
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#cda052] hover:bg-[#dfb56c] text-slate-950 font-semibold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {/* Primary Compliance Data Table with Fixed Column Widths */}
      <div className="bg-white dark:bg-[#0e121b] rounded-2xl border border-slate-200 dark:border-[#1e2638] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed">
            <colgroup>
              <col className="w-[260px]" />
              <col className="w-[200px]" />
              <col className="w-[170px]" />
              <col className="w-[140px]" />
              <col className="w-[130px]" />
              <col className="w-[170px]" />
              <col className="w-[160px]" />
              <col className="w-[70px]" />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 dark:bg-[#080b12] text-slate-600 dark:text-[#8a96ae] uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-[#1e2638] select-none">
                {/* 1. Workflow */}
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center gap-1.5 hover:text-[#cda052] transition-colors group"
                  >
                    <span>Workflow</span>
                    {renderSortIcon('title')}
                  </button>
                </th>

                {/* 2. Client / Entity */}
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('entityName')}
                    className="flex items-center gap-1.5 hover:text-[#cda052] transition-colors group"
                  >
                    <span>Client / Entity</span>
                    {renderSortIcon('entityName')}
                  </button>
                </th>

                {/* 3. Return Type & Period */}
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('returnType')}
                    className="flex items-center gap-1.5 hover:text-[#cda052] transition-colors group"
                  >
                    <span>Return Type & Period</span>
                    {renderSortIcon('returnType')}
                  </button>
                </th>

                {/* 4. Due Date */}
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('dueDate')}
                    className="flex items-center gap-1.5 hover:text-[#cda052] transition-colors group"
                  >
                    <span>Due Date</span>
                    {renderSortIcon('dueDate')}
                  </button>
                </th>

                {/* 5. Status */}
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1.5 hover:text-[#cda052] transition-colors group"
                  >
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </button>
                </th>

                {/* 6. Assignee */}
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('assignedTo')}
                    className="flex items-center gap-1.5 hover:text-[#cda052] transition-colors group"
                  >
                    <span>Assignee</span>
                    {renderSortIcon('assignedTo')}
                  </button>
                </th>

                {/* 7. ARN / Challan */}
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('arnNumber')}
                    className="flex items-center gap-1.5 hover:text-[#cda052] transition-colors group"
                  >
                    <span>ARN / Challan</span>
                    {renderSortIcon('arnNumber')}
                  </button>
                </th>

                {/* 8. Action (Three dots) */}
                <th className="py-3 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {sortedWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-[#8a96ae]">
                    No compliance workflows match your criteria.
                  </td>
                </tr>
              ) : (
                sortedWorkflows.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* 1. Workflow Title */}
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex items-start gap-2">
                        <span className="p-1 rounded bg-slate-100 dark:bg-white/5 text-[#cda052] border border-slate-200 dark:border-[#1e2638] mt-0.5 flex-shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-[#cda052] dark:group-hover:text-[#f7d88c] transition-colors truncate">
                            {item.title}
                          </div>
                          {item.notes && (
                            <div className="text-[11px] text-slate-500 dark:text-[#8895ad] truncate">
                              {item.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Client / Entity */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-[#cbd5e1] truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building className="w-3.5 h-3.5 text-slate-400 dark:text-[#8a96ae] flex-shrink-0" />
                        <span className="truncate">{item.entityName}</span>
                      </div>
                    </td>

                    {/* 3. Return Type & Period */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {item.returnType}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#8a96ae] truncate">
                        {item.taxPeriod}
                      </div>
                    </td>

                    {/* 4. Due Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-slate-900 dark:text-white font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#cda052]" />
                        <span>{item.dueDate}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-[#8895ad]">
                        Cutoff: {item.statutoryDeadline}
                      </div>
                    </td>

                    {/* 5. Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* 6. Assignee */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-[#cbd5e1] truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0" />
                        <span className="truncate">{item.assignedTo}</span>
                      </div>
                    </td>

                    {/* 7. ARN / Challan */}
                    <td className="py-3.5 px-4 font-mono text-xs truncate">
                      {item.arnNumber ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 truncate block">
                          {item.arnNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-[#8895ad] italic">Pending Filing</span>
                      )}
                    </td>

                    {/* 8. Three-dot Action Menu */}
                    <td className="py-3.5 px-4 text-center relative">
                      <div className="inline-block text-left" ref={openMenuId === item.id ? menuRef : null}>
                        <button
                          type="button"
                          onClick={() => setOpenMenuId((curr) => (curr === item.id ? null : item.id))}
                          className="p-1.5 rounded-lg text-slate-400 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                          title="Workflow Actions"
                          aria-label="Actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Floating Action Dropdown Menu */}
                        {openMenuId === item.id && (
                          <div className="absolute right-4 top-10 w-44 bg-white dark:bg-[#0e121b] border border-slate-200 dark:border-[#1e2638] rounded-xl shadow-xl z-30 py-1 text-left animate-fade-in divide-y divide-slate-100 dark:divide-white/5">
                            <div className="py-1">
                              {/* 1. Mark as Filed */}
                              {item.status !== 'filed' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFilingModalItem(item);
                                    setArnInput(item.arnNumber || '');
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors font-medium"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark as Filed</span>
                                </button>
                              )}

                              {/* 2. Send Alarm / Reminder */}
                              <button
                                type="button"
                                onClick={() => handleSendReminder(item)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                              >
                                <BellRing className="w-3.5 h-3.5 text-[#cda052]" />
                                <span>Set Alarm / Remind</span>
                              </button>

                              {/* 3. Edit Workflow */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingWorkflow({ ...item });
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-[#cbd5e1] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                <span>Edit Workflow</span>
                              </button>
                            </div>

                            {/* 4. Delete Workflow */}
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteWorkflow(item.id)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Workflow</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create New Workflow */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-2xl p-5 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638] mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#cda052]" />
                <span>Create Statutory Compliance Workflow</span>
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkflow} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Workflow Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSTR-1 Outward Supplies Filing"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ComplianceCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
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
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Client / Legal Entity</label>
                  <input
                    type="text"
                    required
                    value={newEntity}
                    onChange={(e) => setNewEntity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Return Type</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GSTR-1, GSTR-3B, Form 26Q"
                    value={newReturnType}
                    onChange={(e) => setNewReturnType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Tax Period</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. November 2026 / Q3 FY26"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Statutory Cutoff Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Assignee / CA Lead</label>
                <input
                  type="text"
                  required
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Operational Notes</label>
                <textarea
                  rows={2}
                  placeholder="Supporting instructions, e-Invoice checks, portal details..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e2638]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#cda052] text-slate-950 font-semibold hover:bg-[#dfb56c]"
                >
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Workflow */}
      {editingWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-2xl p-5 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638] mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Edit Compliance Workflow</span>
              </h2>
              <button
                onClick={() => setEditingWorkflow(null)}
                className="p-1 rounded-lg text-slate-400 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditWorkflowSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Workflow Title *</label>
                <input
                  type="text"
                  required
                  value={editingWorkflow.title}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Category</label>
                  <select
                    value={editingWorkflow.category}
                    onChange={(e) =>
                      setEditingWorkflow({
                        ...editingWorkflow,
                        category: e.target.value as ComplianceCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
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
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Client / Legal Entity</label>
                  <input
                    type="text"
                    required
                    value={editingWorkflow.entityName}
                    onChange={(e) =>
                      setEditingWorkflow({ ...editingWorkflow, entityName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Return Type</label>
                  <input
                    type="text"
                    required
                    value={editingWorkflow.returnType}
                    onChange={(e) =>
                      setEditingWorkflow({ ...editingWorkflow, returnType: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Tax Period</label>
                  <input
                    type="text"
                    required
                    value={editingWorkflow.taxPeriod}
                    onChange={(e) =>
                      setEditingWorkflow({ ...editingWorkflow, taxPeriod: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editingWorkflow.dueDate}
                    onChange={(e) =>
                      setEditingWorkflow({ ...editingWorkflow, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Statutory Cutoff</label>
                  <input
                    type="date"
                    value={editingWorkflow.statutoryDeadline}
                    onChange={(e) =>
                      setEditingWorkflow({
                        ...editingWorkflow,
                        statutoryDeadline: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Status</label>
                  <select
                    value={editingWorkflow.status}
                    onChange={(e) =>
                      setEditingWorkflow({
                        ...editingWorkflow,
                        status: e.target.value as ComplianceStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="in_progress">In Progress</option>
                    <option value="filed">Filed</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Assignee</label>
                  <input
                    type="text"
                    required
                    value={editingWorkflow.assignedTo}
                    onChange={(e) =>
                      setEditingWorkflow({ ...editingWorkflow, assignedTo: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">ARN / Challan No</label>
                  <input
                    type="text"
                    placeholder="e.g. AA331026001928K"
                    value={editingWorkflow.arnNumber || ''}
                    onChange={(e) =>
                      setEditingWorkflow({ ...editingWorkflow, arnNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">Operational Notes</label>
                <textarea
                  rows={2}
                  value={editingWorkflow.notes || ''}
                  onChange={(e) =>
                    setEditingWorkflow({ ...editingWorkflow, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
                <button
                  type="button"
                  onClick={() => setEditingWorkflow(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e2638]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#cda052] text-slate-950 font-semibold hover:bg-[#dfb56c]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Mark Filed & Enter ARN */}
      {filingModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0e121b] w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1e2638] shadow-2xl p-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Record Statutory Filing Completion</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8a96ae] mb-4">
              {filingModalItem.title} ({filingModalItem.taxPeriod})
            </p>

            <form onSubmit={handleMarkFiled} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-[#8a96ae] mb-1 font-medium">
                  Acknowledgment Reference Number (ARN) / Challan No *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AA331026001928K"
                  value={arnInput}
                  onChange={(e) => setArnInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#080b12] text-slate-900 dark:text-white font-mono border border-slate-200 dark:border-[#1e2638] focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setFilingModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-[#cbd5e1] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-[#1e2638]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white dark:text-black font-semibold hover:bg-emerald-500"
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
