'use client';

import React, { useState, useMemo } from 'react';
import { UserCheck, X, User, Check, Search, AlertCircle } from 'lucide-react';
import { WorkItem, WorkItemState, TeamMember } from '@/lib/types';
import ModalPortal from '@/components/ui/ModalPortal';
import { TYPE_COLOR, STATE_COLOR } from './WorkItemModal';

interface AssignPromptModalProps {
  isOpen: boolean;
  item: WorkItem;
  targetState?: WorkItemState;
  teamMembers: TeamMember[];
  allWorkItems?: WorkItem[];
  onAssign: (assignee: string) => void;
  onCancel: () => void;
}

export default function AssignPromptModal({
  isOpen,
  item,
  targetState = 'Active',
  teamMembers,
  allWorkItems = [],
  onAssign,
  onCancel,
}: AssignPromptModalProps) {
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Collect candidate assignee names from team roster and existing work items
  const assigneeCandidates = useMemo(() => {
    const map = new Map<string, { name: string; role?: string }>();
    for (const m of teamMembers) {
      if (m.name && m.name.trim()) {
        map.set(m.name.trim(), { name: m.name.trim(), role: m.role });
      }
    }
    for (const w of allWorkItems) {
      if (w.assignee && w.assignee.trim() && !map.has(w.assignee.trim())) {
        map.set(w.assignee.trim(), { name: w.assignee.trim() });
      }
    }
    return Array.from(map.values());
  }, [teamMembers, allWorkItems]);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return assigneeCandidates;
    const q = searchQuery.toLowerCase();
    return assigneeCandidates.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.role && c.role.toLowerCase().includes(q))
    );
  }, [assigneeCandidates, searchQuery]);

  if (!isOpen) return null;

  const effectiveAssignee = customName.trim() || selectedAssignee;

  const handleConfirm = () => {
    if (!effectiveAssignee) return;
    onAssign(effectiveAssignee);
  };

  return (
    <ModalPortal isOpen={isOpen}>
      <div
        className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-[#222c42] bg-[#0a0c13] p-5 sm:p-6 shadow-2xl space-y-4"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#cda052]/15 border border-[#cda052]/40 flex items-center justify-center text-[#cda052] flex-shrink-0 shadow-sm">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Assign to Move to</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${STATE_COLOR[targetState]}`}>
                    {targetState}
                  </span>
                </h3>
                <p className="text-xs text-[#8c9bb5] mt-0.5">
                  Unassigned items must remain in <strong className="text-white">New</strong>. Please select who is responsible.
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-1 rounded-lg text-[#64748b] hover:text-white hover:bg-[#161d2d] transition-colors"
              title="Cancel (Keep in New)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Item Preview Card */}
          <div className="p-3 rounded-xl bg-[#0f1420] border border-[#1b2336] flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${TYPE_COLOR[item.type]}`}>
                  {item.type}
                </span>
                <span className="text-[10px] text-[#64748b]">Current:</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${STATE_COLOR[item.state]}`}>
                  {item.state}
                </span>
              </div>
              <p className="text-xs font-medium text-white truncate">{item.title}</p>
            </div>
          </div>

          {/* Search Assignee */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#cbd5e1] flex items-center justify-between">
              <span>Choose Assignee</span>
              <span className="text-[10px] text-[#cda052] font-normal">Required for {targetState}</span>
            </label>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#54627a] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team member..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#0e121b] border border-[#222c42] text-xs text-white placeholder-[#54627a] focus:outline-none focus:border-[#cda052]/60"
              />
            </div>

            {/* Candidate List */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {filteredCandidates.map((c) => {
                const isSelected = selectedAssignee === c.name && !customName.trim();
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelectedAssignee(c.name);
                      setCustomName('');
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#cda052]/15 border-[#cda052]/70 text-white shadow-sm'
                        : 'bg-[#0e121b] border-[#1b2336] text-[#cbd5e1] hover:border-[#2e3c59] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isSelected ? 'bg-[#cda052] text-black font-black' : 'bg-[#182133] text-[#cda052]'
                        }`}
                      >
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold leading-tight truncate">{c.name}</p>
                        {c.role && <p className="text-[10px] text-[#718096] truncate">{c.role}</p>}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#cda052] flex-shrink-0" />}
                  </button>
                );
              })}

              {filteredCandidates.length === 0 && (
                <p className="text-xs text-[#54627a] italic text-center py-3">No matching team members found.</p>
              )}
            </div>

            {/* Or type a new name */}
            <div className="pt-2 border-t border-[#171d2b]">
              <label className="text-[10px] text-[#718096] block mb-1">Or enter a different assignee name:</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={customName}
                onChange={(e) => {
                  setCustomName(e.target.value);
                  if (e.target.value.trim()) setSelectedAssignee('');
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0e121b] border border-[#222c42] text-xs text-white placeholder-[#54627a] focus:outline-none focus:border-[#cda052]/60"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#171d2b]">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-2 rounded-xl bg-[#141824] border border-[#252f44] text-xs font-semibold text-[#94a3b8] hover:text-white hover:bg-[#1a2133] transition-all cursor-pointer"
            >
              Cancel (Keep in New)
            </button>
            <button
              type="button"
              disabled={!effectiveAssignee}
              onClick={handleConfirm}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b3883b] text-black font-bold text-xs hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#cda052]/20 flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign & Move to {targetState}</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
