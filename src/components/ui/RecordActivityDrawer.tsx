'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, 
  X, 
  Clock, 
  User, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { AppModule, AuditLogEntry } from '@/lib/types';

interface RecordActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  module: AppModule;
  recordId: string;
  recordTitle: string;
}

export default function RecordActivityDrawer({
  isOpen,
  onClose,
  module,
  recordId,
  recordTitle,
}: RecordActivityDrawerProps) {
  const { session } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchRecordHistory = useCallback(async () => {
    if (!session?.access_token || !recordId) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/audit?module=${module}&recordId=${encodeURIComponent(recordId)}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.warn('Error fetching record activity:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, module, recordId]);

  useEffect(() => {
    if (isOpen) {
      fetchRecordHistory();
    }
  }, [isOpen, fetchRecordHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-[#0d101a] border-l border-[#20293d] h-full flex flex-col shadow-2xl animate-slide-left">
        {/* Drawer Header */}
        <div className="p-4 bg-[#080b12] border-b border-[#1b2336] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#cda052]" />
            <div>
              <h3 className="font-bold text-white text-sm">Activity History</h3>
              <span className="text-[11px] text-[#8e9ab5] font-mono truncate block max-w-xs">{recordTitle}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e9ab5] hover:text-white hover:bg-white/[0.08]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {loading ? (
            <div className="py-12 text-center text-[#8e9ab5]">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#cda052]" />
              <span>Loading audit records...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-[#64748b]">
              <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p>No activity records logged for this item yet.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1f283d]">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <div key={log.id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#cda052] border-2 border-[#0d101a] ring-2 ring-[#cda052]/30" />

                    <div className="p-3 rounded-xl bg-[#090c14] border border-[#1b2336] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-[#cda052] font-semibold border border-[#cda052]/30">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-[#64748b] font-mono">
                          {new Date(log.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#cbd5e1]">
                        <User className="w-3 h-3 text-[#8e9ab5]" />
                        <span className="font-medium text-white">{log.actorName}</span>
                        <span className="text-[#64748b]">({log.actorEmail})</span>
                      </div>

                      {log.changes && Object.keys(log.changes).length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className="text-[10px] text-[#cda052] hover:underline flex items-center gap-0.5 mt-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide changes' : 'View changes diff'}</span>
                            <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>

                          {isExpanded && (
                            <pre className="mt-2 p-2 rounded-lg bg-[#05070c] border border-[#182030] text-[10px] font-mono text-[#a5b4fc] overflow-auto max-h-40">
                              {JSON.stringify(log.changes, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#080b12] border-t border-[#1b2336] flex items-center justify-between text-[10px] text-[#64748b] font-mono flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Immutable Postgres Trail</span>
          </div>
          <span>{logs.length} logged events</span>
        </div>
      </div>
    </div>
  );
}
