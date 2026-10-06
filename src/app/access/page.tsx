'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  UserCheck, 
  UserX, 
  Mail, 
  Calendar, 
  RefreshCw,
  Info,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { AppRole, AppModule, PermissionAction, ModulePermissionSet, UserPermissionMap } from '@/lib/types';
import { 
  ALL_MODULES, 
  ALL_ACTIONS, 
  MODULE_CONFIG, 
  ACTION_CONFIG, 
  ROLE_LABELS, 
  ROLE_DESCRIPTIONS, 
  getRoleTemplateDefaults,
  getEffectivePermissions 
} from '@/lib/permissions';
import AccessDenied from '@/components/ui/AccessDenied';

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  status: 'active' | 'deactivated';
  invitedBy?: string;
  invitedAt?: string;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
  permissions: UserPermissionMap;
}

export default function AccessManagementPage() {
  const { user: currentUser, can, canView, session } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('member');
  const [isInviting, setIsInviting] = useState(false);

  // Edit Permissions Modal State
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [editRole, setEditRole] = useState<AppRole>('member');
  const [editOverrides, setEditOverrides] = useState<UserPermissionMap>(() => getRoleTemplateDefaults('member'));
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        setErrorMessage(data.error || 'Failed to load user roster');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with access server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Guard: Must have view permission on 'access'
  if (!canView('access')) {
    return <AccessDenied module="access" />;
  }

  const handleOpenInvite = () => {
    setInviteEmail('');
    setInviteName('');
    setInviteRole('member');
    setErrorMessage('');
    setSuccessMessage('');
    setInviteModalOpen(true);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !session?.access_token) return;

    setIsInviting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Invitation successfully registered for ${inviteEmail}!`);
        setInviteModalOpen(false);
        fetchUsers();
      } else {
        setErrorMessage(data.error || 'Failed to send invitation');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while sending invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleOpenPermissionsEditor = (targetUser: ManagedUser) => {
    setSelectedUser(targetUser);
    setEditRole(targetUser.role);
    const defaults = getRoleTemplateDefaults(targetUser.role);
    const merged = { ...defaults, ...(targetUser.permissions || {}) };
    setEditOverrides(JSON.parse(JSON.stringify(merged)));
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleTogglePermission = (module: AppModule, action: PermissionAction) => {
    setEditOverrides(prev => {
      const defaults = getRoleTemplateDefaults(editRole);
      const currentMod = prev[module] || defaults[module];
      
      const updatedMod: ModulePermissionSet = {
        ...currentMod,
        [action]: !currentMod[action],
      };

      return {
        ...prev,
        [module]: updatedMod,
      };
    });
  };

  const handleRoleChangeInEditor = (newRole: AppRole) => {
    setEditRole(newRole);
    setEditOverrides(getRoleTemplateDefaults(newRole));
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !session?.access_token) return;

    setIsSavingPermissions(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          role: editRole,
          permissions: editOverrides,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Permissions successfully updated for ${selectedUser.email}`);
        setSelectedUser(null);
        fetchUsers();
      } else {
        setErrorMessage(data.error || 'Failed to update permissions');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error updating user permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleToggleStatus = async (targetUser: ManagedUser) => {
    if (!session?.access_token) return;
    const newStatus = targetUser.status === 'active' ? 'deactivated' : 'active';
    
    if (newStatus === 'deactivated') {
      const confirmDeactivate = window.confirm(`Are you sure you want to deactivate ${targetUser.name || targetUser.email}? They will no longer be able to sign in.`);
      if (!confirmDeactivate) return;
    }

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`User status changed to ${newStatus}`);
        fetchUsers();
      } else {
        setErrorMessage(data.error || 'Failed to change user status');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error updating user status');
    }
  };

  const handleDeleteUser = async (targetUser: ManagedUser) => {
    if (!session?.access_token) return;
    const confirmDelete = window.confirm(`Permanently remove ${targetUser.email}? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`User account removed successfully.`);
        fetchUsers();
      } else {
        setErrorMessage(data.error || 'Failed to remove user account');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error removing user account');
    }
  };

  const activeOwners = users.filter(u => u.role === 'owner' && u.status === 'active');
  const administrators = users.filter(u => u.role === 'admin' && u.status === 'active');
  const managers = users.filter(u => u.role === 'manager' && u.status === 'active');
  const members = users.filter(u => u.role === 'member' && u.status === 'active');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#20293d]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#cda052] uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Governance & Security Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            Access Management & Roles
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1 max-w-2xl leading-relaxed">
            Configure authoritative database Row Level Security policies, assign role templates,
            and customize fine-grained per-module action overrides.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={refreshing}
            className="p-2 rounded-xl bg-[#0f1422] hover:bg-[#161d30] border border-[#242f47] text-[#cbd5e1] hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh User Roster"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#cda052]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {can('access', 'manage_access') && (
            <button
              type="button"
              onClick={handleOpenInvite}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#cda052] to-[#b38536] text-black text-xs font-bold hover:brightness-110 shadow-glow transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Invite New User</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto text-rose-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-auto text-emerald-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Role Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-[#0e121b] border border-[#20293d] space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-[#94a3b8] font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#cda052]" />
            <span>Permanent Owners</span>
          </div>
          <div className="text-2xl font-bold font-mono text-[#f7dda0]">{activeOwners.length}</div>
          <div className="text-[10px] text-[#64748b]">Unrestricted governance</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121b] border border-[#20293d] space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-[#94a3b8] font-mono flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Administrators</span>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-400">{administrators.length}</div>
          <div className="text-[10px] text-[#64748b]">Full module operations</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121b] border border-[#20293d] space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-[#94a3b8] font-mono flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Managers</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{managers.length}</div>
          <div className="text-[10px] text-[#64748b]">Team & workflow approvals</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121b] border border-[#20293d] space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-[#94a3b8] font-mono flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Team Members</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">{members.length}</div>
          <div className="text-[10px] text-[#64748b]">Explicitly granted access</div>
        </div>
      </div>

      {/* Owner Protection Advisory Banner */}
      <div className="p-3 rounded-xl bg-[#121623] border border-[#1e273d] flex items-start gap-2.5 text-xs text-[#94a3b8]">
        <Info className="w-4 h-4 text-[#cda052] flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-[#cbd5e1]">Enterprise Governance Principle:</span>
          <p className="text-[11px] leading-relaxed">
            At least one Owner must always remain active in the system. The database prevents deleting or demoting the last active Owner.
            Public sign-up is permanently disabled: new accounts can only be issued through secure invitations created here.
          </p>
        </div>
      </div>

      {/* Users Roster Table */}
      <div className="bg-[#0e121b] border border-[#20293d] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1b2336] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wide">Authorized User Roster</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161d2e] border border-[#2a3854] text-[#cbd5e1] font-mono">
              {users.length} {users.length === 1 ? 'Account' : 'Accounts'}
            </span>
          </div>
          <span className="text-[11px] text-[#64748b] hidden sm:inline">
            Click &quot;Configure Permissions&quot; to customize module actions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090c14] border-b border-[#1b2336] text-[10px] uppercase font-mono tracking-wider text-[#64748b]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-3">Role Template</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 hidden md:table-cell">Overrides</th>
                <th className="py-3 px-3 hidden lg:table-cell">Created / Invited</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161e30]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#94a3b8]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#cda052]" />
                      <span>Loading authenticated user roster...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#94a3b8]">
                    No users found. Click &quot;Invite New User&quot; to provision an account.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const overrideCount = Object.keys(u.permissions || {}).length;
                  const isLastOwner = u.role === 'owner' && activeOwners.length <= 1;

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#cda052] to-[#8c672b] flex items-center justify-center text-xs font-bold text-black flex-shrink-0">
                            {u.name?.[0]?.toUpperCase() || u.email[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white truncate">{u.name || 'User'}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-[#cda052] border border-[#cda052]/40 font-mono">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#8e9ab5] font-mono block truncate">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Template Badge */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-semibold border ${
                          u.role === 'owner'
                            ? 'bg-amber-500/15 text-[#e6c875] border-[#cda052]/40'
                            : u.role === 'admin'
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                            : u.role === 'manager'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                            : 'bg-slate-500/15 text-slate-300 border-slate-500/40'
                        }`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                          u.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>

                      {/* Overrides Count */}
                      <td className="py-3.5 px-3 hidden md:table-cell">
                        {overrideCount > 0 ? (
                          <span className="text-[11px] text-[#cda052] font-mono">
                            {overrideCount} custom {overrideCount === 1 ? 'module' : 'modules'}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#64748b] font-mono">Role default</span>
                        )}
                      </td>

                      {/* Created / Invited Date */}
                      <td className="py-3.5 px-3 hidden lg:table-cell">
                        <div className="text-[11px] text-[#8e9ab5] font-mono">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {can('access', 'manage_access') && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenPermissionsEditor(u)}
                                className="p-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1f2a44] border border-[#263554] text-[#cbd5e1] hover:text-[#cda052] transition-colors cursor-pointer"
                                title="Configure Module Permissions"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(u)}
                                disabled={isLastOwner}
                                className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                  u.status === 'active'
                                    ? 'bg-[#1a1215] hover:bg-rose-950/40 border-[#3d1e25] text-rose-300'
                                    : 'bg-[#101b17] hover:bg-emerald-950/40 border-[#1c3a2f] text-emerald-300'
                                }`}
                                title={isLastOwner ? 'Cannot deactivate the last active Owner' : u.status === 'active' ? 'Deactivate User' : 'Activate User'}
                              >
                                {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>

                              {currentUser?.role === 'owner' && !isLastOwner && !isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg bg-[#1a1215] hover:bg-rose-950/60 border border-[#3d1e25] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                  title="Delete User Account"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVITE USER MODAL */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#0e121b] border border-[#222a3d] rounded-2xl p-6 shadow-2xl relative space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2438]">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#cda052]" />
                <h3 className="text-base font-bold text-white">Invite Team Member</h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="p-1 rounded text-[#8e9ab5] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono font-semibold text-[#8e9ab5] tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@therivlet.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#07090f] border border-[#242f47] text-white text-xs outline-none focus:border-[#cda052]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono font-semibold text-[#8e9ab5] tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Sourcing Director"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#07090f] border border-[#242f47] text-white text-xs outline-none focus:border-[#cda052]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono font-semibold text-[#8e9ab5] tracking-wider mb-1.5">
                  Initial Role Template
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'manager', 'member'] as AppRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        inviteRole === r
                          ? 'bg-amber-500/15 border-[#cda052] text-[#f7dda0] font-bold'
                          : 'bg-[#07090f] border-[#1e273d] text-[#8e9ab5] hover:text-white'
                      }`}
                    >
                      <span className="block text-[11px]">{ROLE_LABELS[r]}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#64748b] mt-1.5">
                  {ROLE_DESCRIPTIONS[inviteRole]}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1c2438]">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#141b2c] hover:bg-[#1d263d] text-[#cbd5e1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black text-xs font-bold hover:brightness-110 shadow-glow disabled:opacity-50 cursor-pointer"
                >
                  {isInviting ? 'Sending Invite...' : 'Dispatch Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PERMISSIONS MATRIX MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-4xl bg-[#0e121b] border border-[#222a3d] rounded-2xl p-5 sm:p-6 shadow-2xl relative space-y-5 my-auto max-h-[92vh] flex flex-col animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2438] flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-[#cda052]" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Configure Permissions: {selectedUser.name || selectedUser.email}
                  </h3>
                  <p className="text-[11px] text-[#8e9ab5] font-mono">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded text-[#8e9ab5] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role Template Selector */}
            <div className="p-3.5 rounded-xl bg-[#07090f] border border-[#1b2338] space-y-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#cda052]">
                  Base Role Template
                </label>
                <span className="text-[10px] text-[#64748b]">
                  Changing the role applies its recommended permission defaults
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['owner', 'admin', 'manager', 'member'] as AppRole[]).map((r) => {
                  const isSelected = editRole === r;
                  const isOwnerDisabled = r === 'owner' && currentUser?.role !== 'owner';
                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={isOwnerDisabled}
                      onClick={() => handleRoleChangeInEditor(r)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-amber-500/15 border-[#cda052] text-[#f7dda0] shadow-sm'
                          : 'bg-[#0f1422] border-[#1e273d] text-[#8e9ab5] hover:text-white'
                      } ${isOwnerDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="font-bold text-xs">{ROLE_LABELS[r]}</div>
                      <div className="text-[10px] text-[#64748b] truncate mt-0.5">{ROLE_DESCRIPTIONS[r]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fine-Grained Module Matrix Scroll Area */}
            <div className="flex-1 overflow-y-auto border border-[#1b2338] rounded-xl overflow-hidden bg-[#07090f]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b0e18] sticky top-0 border-b border-[#1b2338] text-[10px] uppercase font-mono tracking-wider text-[#64748b] z-10">
                  <tr>
                    <th className="py-2.5 px-3">Module</th>
                    {ALL_ACTIONS.map(action => (
                      <th key={action} className="py-2.5 px-2 text-center" title={ACTION_CONFIG[action].description}>
                        {ACTION_CONFIG[action].label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141b2c]">
                  {ALL_MODULES.map(module => {
                    const isOwnerRole = editRole === 'owner';

                    return (
                      <tr key={module} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-white block">{MODULE_CONFIG[module].name}</span>
                          <span className="text-[10px] text-[#64748b] block">{MODULE_CONFIG[module].description}</span>
                        </td>
                        {ALL_ACTIONS.map(action => {
                          const isChecked = isOwnerRole || Boolean(editOverrides[module]?.[action]);

                          return (
                            <td key={action} className="py-2.5 px-2 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isOwnerRole}
                                onChange={() => handleTogglePermission(module, action)}
                                className="w-4 h-4 rounded bg-[#0e121b] border-[#2a3854] text-[#cda052] focus:ring-[#cda052]/40 focus:ring-offset-0 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1c2438] flex-shrink-0">
              <span className="text-[11px] text-[#64748b]">
                {editRole === 'owner' ? 'Owner maintains full unrestricted access to all modules.' : 'Custom changes apply as explicit overrides in Supabase RLS.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-lg bg-[#141b2c] hover:bg-[#1d263d] text-[#cbd5e1] text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={isSavingPermissions}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black text-xs font-bold hover:brightness-110 shadow-glow disabled:opacity-50 cursor-pointer"
                >
                  {isSavingPermissions ? 'Applying Changes...' : 'Save & Enforce Permissions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
