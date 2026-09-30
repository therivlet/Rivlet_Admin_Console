'use client';

import React, { useState } from 'react';
import { Settings2, Users, Plus, X, Save, Trash2, Pencil, Clock } from 'lucide-react';
import { useAdminStore } from '@/lib/store';
import { TeamMember } from '@/lib/types';
import ModalPortal from '@/components/ui/ModalPortal';
import { useConfirm } from '@/lib/confirmContext';

const LENGTH_PRESETS = [
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '3 Weeks', days: 21 },
  { label: '4 Weeks', days: 28 },
];

function emptyMember(): Omit<TeamMember, 'createdAt' | 'updatedAt'> {
  return { id: `tm-${Date.now()}`, name: '' };
}

export default function SettingsView() {
  const confirm = useConfirm();
  const { workSettings, saveWorkSettings, teamMembers, saveTeamMember, deleteTeamMember } = useAdminStore();
  const [customDays, setCustomDays] = useState(String(workSettings.defaultSprintLengthDays));
  const [modalMember, setModalMember] = useState<TeamMember | Omit<TeamMember, 'createdAt' | 'updatedAt'> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPreset = LENGTH_PRESETS.some((p) => p.days === workSettings.defaultSprintLengthDays);

  const handleSaveMember = async () => {
    if (!modalMember) return;
    if (!modalMember.name || modalMember.name.trim().length < 2) { setError('Name is required.'); return; }
    setError(null);
    setIsSaving(true);
    const now = new Date().toISOString();
    await saveTeamMember({ ...(modalMember as TeamMember), name: modalMember.name.trim(), createdAt: (modalMember as TeamMember).createdAt || now, updatedAt: now });
    setIsSaving(false);
    setModalMember(null);
  };

  const handleDeleteMember = async (id: string, name: string) => {
    const ok = await confirm({
      title: 'Remove Team Member',
      message: `Remove "${name}" from the team roster? Existing work items will retain their assignment history, but "${name}" will no longer be selectable for new assignments.`,
      confirmLabel: 'Remove Member',
      danger: true,
    });
    if (!ok) return;
    await deleteTeamMember(id);
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* Sprint Cadence */}
      <div className="rounded-2xl border border-[#1a1f2c] bg-[#0e121b] p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-1.5 rounded-lg bg-sky-950/60 text-sky-400"><Clock className="w-4 h-4" /></div>
          <h2 className="text-sm font-semibold text-white">Sprint Cadence</h2>
        </div>
        <p className="text-xs text-[#94a3b8] mb-4">Default sprint length used when you create a new sprint. You can still override it per sprint.</p>

        <div className="flex flex-wrap gap-2">
          {LENGTH_PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => saveWorkSettings({ defaultSprintLengthDays: p.days })}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                workSettings.defaultSprintLengthDays === p.days
                  ? 'bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black border-transparent'
                  : 'bg-[#0a0c12] text-[#cbd5e1] border-[#1f2638] hover:border-[#2a3346]'
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              className="w-20 px-3 py-2 rounded-xl bg-[#0a0c12] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50"
            />
            <button
              onClick={() => customDays && saveWorkSettings({ defaultSprintLengthDays: Number(customDays) })}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                !isPreset ? 'bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black border-transparent' : 'bg-[#0a0c12] text-[#cbd5e1] border-[#1f2638] hover:border-[#2a3346]'
              }`}
            >
              Custom Days
            </button>
          </div>
        </div>
      </div>

      {/* Team Roster */}
      <div className="rounded-2xl border border-[#1a1f2c] bg-[#0e121b] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-950/60 text-indigo-400"><Users className="w-4 h-4" /></div>
            <h2 className="text-sm font-semibold text-white">Team Roster</h2>
          </div>
          <button
            onClick={() => { setModalMember(emptyMember()); setError(null); }}
            title="Add a team member"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141724] border border-[#263148] text-[#cbd5e1] text-xs font-medium hover:text-white transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>
        <p className="text-xs text-[#94a3b8] mb-4">People selectable as an Assignee when creating stories or tasks.</p>

        <div className="space-y-2">
          {teamMembers.length === 0 ? (
            <p className="text-xs text-[#5f6c85]">No team members yet.</p>
          ) : (
            teamMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0a0c12] border border-[#1c2438]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] text-black flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {m.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{m.name}</p>
                    <p className="text-[11px] text-[#7c869d]">{m.role || 'Team member'}{m.email ? ` · ${m.email}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setModalMember(m); setError(null); }} title="Edit" aria-label={`Edit ${m.name}`} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-[#cda052] hover:bg-[#141724]">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteMember(m.id, m.name)} title="Remove" aria-label={`Remove ${m.name}`} className="p-1.5 rounded-lg text-[#94a3b8] hover:text-rose-400 hover:bg-rose-950/30">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ModalPortal isOpen={!!modalMember}>
        {modalMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm" onClick={() => setModalMember(null)}>
            <div className="w-full max-w-sm rounded-2xl border border-[#1f2638] bg-[#0a0c12] p-5 sm:p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Team member details">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">{(modalMember as TeamMember).createdAt ? 'Edit Member' : 'Add Member'}</h2>
                <button onClick={() => setModalMember(null)} aria-label="Close" title="Close" className="text-[#94a3b8] hover:text-white"><X className="w-4.5 h-4.5" /></button>
              </div>
              {error && <div className="mb-3 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg px-3 py-2">{error}</div>}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Name *</label>
                  <input value={modalMember.name} onChange={(e) => setModalMember({ ...modalMember, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Role</label>
                  <input value={modalMember.role || ''} onChange={(e) => setModalMember({ ...modalMember, role: e.target.value })} placeholder="e.g. Sourcing Manager"
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
                <div>
                  <label className="text-[11px] text-[#94a3b8] block mb-1">Email</label>
                  <input value={modalMember.email || ''} onChange={(e) => setModalMember({ ...modalMember, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#0e121b] border border-[#1f2638] text-sm text-white focus:outline-none focus:border-[#cda052]/50" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-5">
                <button onClick={() => setModalMember(null)} className="px-4 py-2 rounded-lg text-sm text-[#94a3b8] hover:text-white">Cancel</button>
                <button onClick={handleSaveMember} disabled={isSaving} title="Save member" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#a97f38] text-black text-sm font-semibold disabled:opacity-60">
                  <Save className="w-3.5 h-3.5" /> {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
}
