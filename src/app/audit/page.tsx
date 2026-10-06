'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileSearch, 
  Filter, 
  Download, 
  RefreshCw, 
  Calendar, 
  User, 
  Tag, 
  ExternalLink, 
  ShieldCheck, 
  Eye, 
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { AppModule, AuditLogEntry } from '@/lib/types';
import { MODULE_CONFIG, ALL_MODULES } from '@/lib/permissions';
import AccessDenied from '@/components/ui/AccessDenied';

export default function AuditLogPage() {
  const { can, canView, session } = useAuth();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Log for Inspection Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        limit: '100',
        offset: '0',
      });
      if (selectedModule !== 'all') params.set('module', selectedModule);
      if (selectedAction !== 'all') params.set('action', selectedAction);

      const res = await fetch(`/api/audit?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
        setTotalCount(data.totalCount || data.logs.length);
      } else {
        setErrorMessage(data.error || 'Failed to retrieve audit log trail');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with audit API');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token, selectedModule, selectedAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Guard: Requires view permission on 'audit'
  if (!canView('audit')) {
    return <AccessDenied module="audit" />;
  }

  // Filter logs locally by search query
  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.actorName || '').toLowerCase().includes(q) ||
      (log.actorEmail || '').toLowerCase().includes(q) ||
      (log.recordTitle || '').toLowerCase().includes(q) ||
      (log.recordId || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (!can('audit', 'export')) {
      alert('You do not have permission to export audit records.');
      return;
    }

    const headers = ['Timestamp', 'Actor Name', 'Actor Email', 'Action', 'Module', 'Record ID', 'Record Title'];
    const rows = filteredLogs.map(l => [
      l.createdAt,
      `"${l.actorName.replace(/"/g, '""')}"`,
      l.actorEmail,
      l.action,
      l.module,
      l.recordId || '',
      `"${(l.recordTitle || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rivlet_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeClass = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'invite':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'delete':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'update':
      case 'permission_change':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'approve':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#20293d]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#cda052] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Immutable Security Trail</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-wide">
            System & Business Audit Log
          </h1>
          <p className="text-xs text-[#94a3b8] mt-1 max-w-2xl leading-relaxed">
            Append-only, cryptographically verified record of all operational actions, user permissions,
            status changes, and sensitive business transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={refreshing}
            className="p-2 rounded-xl bg-[#0f1422] hover:bg-[#161d30] border border-[#242f47] text-[#cbd5e1] hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Audit Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#cda052]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {can('audit', 'export') && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="py-2 px-3.5 rounded-xl bg-[#141b2c] hover:bg-[#1f283d] border border-[#293754] text-[#cbd5e1] hover:text-white text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#cda052]" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/80 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-auto text-rose-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="p-3.5 rounded-2xl bg-[#0e121b] border border-[#20293d] flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Module Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#8e9ab5]">
            <Filter className="w-3.5 h-3.5 text-[#cda052]" />
            <span className="font-mono text-[11px] uppercase">Module:</span>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#07090f] border border-[#242f47] text-white text-xs outline-none focus:border-[#cda052]"
            >
              <option value="all">All Modules</option>
              {ALL_MODULES.map(m => (
                <option key={m} value={m}>{MODULE_CONFIG[m].name}</option>
              ))}
            </select>
          </div>

          {/* Action Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[#8e9ab5]">
            <span className="font-mono text-[11px] uppercase">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#07090f] border border-[#242f47] text-white text-xs outline-none focus:border-[#cda052]"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="invite">Invite</option>
              <option value="permission_change">Permission Change</option>
              <option value="approve">Approve</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor, record, or title..."
            className="w-full px-3 py-1.5 rounded-lg bg-[#07090f] border border-[#242f47] text-white placeholder-[#64748b] text-xs outline-none focus:border-[#cda052]"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0e121b] border border-[#20293d] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1b2336] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wide">Audit Trail History</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#161d2e] border border-[#2a3854] text-[#cbd5e1] font-mono">
              {filteredLogs.length} Records
            </span>
          </div>
          <span className="text-[11px] text-[#64748b] font-mono">
            Append-only database triggers active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090c14] border-b border-[#1b2336] text-[10px] uppercase font-mono tracking-wider text-[#64748b]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Actor</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Target Record</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#161e30]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#94a3b8]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#cda052]" />
                      <span>Loading audit history...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#94a3b8]">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 font-mono text-[11px] text-[#8e9ab5] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1b2438] border border-[#2b3957] flex items-center justify-center text-[10px] font-bold text-[#cda052]">
                          {log.actorName?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-white truncate block">{log.actorName || 'User'}</span>
                          <span className="text-[10px] text-[#64748b] font-mono block truncate">{log.actorEmail}</span>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Module */}
                    <td className="py-3 px-3">
                      <span className="font-mono text-xs text-[#cbd5e1] capitalize">
                        {log.module}
                      </span>
                    </td>

                    {/* Record Title / ID */}
                    <td className="py-3 px-3 max-w-xs">
                      <div className="truncate text-white font-medium">
                        {log.recordTitle || log.recordId || '—'}
                      </div>
                      {log.recordId && (
                        <span className="text-[10px] text-[#64748b] font-mono block truncate">
                          ID: {log.recordId}
                        </span>
                      )}
                    </td>

                    {/* Diff Inspector Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg bg-[#141b2c] hover:bg-[#1f2a44] border border-[#263554] text-[#cbd5e1] hover:text-[#cda052] transition-colors cursor-pointer"
                        title="Inspect Event Diff & Metadata"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIFF & DETAILS INSPECTOR MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0e121b] border border-[#222a3d] rounded-2xl p-6 shadow-2xl relative space-y-4 max-h-[85vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2438] flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-[#cda052]" />
                <h3 className="text-base font-bold text-white">
                  Audit Entry: {selectedLog.action} on {selectedLog.module}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded text-[#8e9ab5] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-[#07090f] p-3 rounded-xl border border-[#1b2338] flex-shrink-0">
              <div>
                <span className="text-[10px] text-[#64748b] uppercase font-mono block">Actor:</span>
                <span className="font-semibold text-white">{selectedLog.actorName} ({selectedLog.actorEmail})</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] uppercase font-mono block">Event Timestamp:</span>
                <span className="font-mono text-[#cbd5e1]">{new Date(selectedLog.createdAt).toUTCString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] uppercase font-mono block">Target Record ID:</span>
                <span className="font-mono text-[#cbd5e1]">{selectedLog.recordId || 'None'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748b] uppercase font-mono block">Audit ID:</span>
                <span className="font-mono text-[#cbd5e1]">{selectedLog.id}</span>
              </div>
            </div>

            {/* Changes Diff */}
            <div className="space-y-1.5 flex-1 min-h-0 flex flex-col">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#cda052]">
                Structured Event Changes (Redacted):
              </span>
              <pre className="flex-1 overflow-auto p-3.5 rounded-xl bg-[#07090f] border border-[#1b2338] text-[11px] font-mono text-[#a5b4fc] whitespace-pre-wrap select-text">
                {JSON.stringify(selectedLog.changes, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end border-t border-[#1c2438] flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg bg-[#141b2c] hover:bg-[#1d263d] text-[#cbd5e1] text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
