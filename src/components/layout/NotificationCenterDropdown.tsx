'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  ExternalLink, 
  Clock, 
  AlertTriangle, 
  Info, 
  ShieldAlert, 
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import { NotificationRecord, AppModule } from '@/lib/types';
import { 
  loadMergedNotifications, 
  markAsReadPermanently, 
  markAllAsReadPermanently, 
  deleteNotificationPermanently,
  createOperationalReminder 
} from '@/lib/notificationStorage';

export default function NotificationCenterDropdown() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  
  // New reminder form state
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [reminderModule, setReminderModule] = useState<AppModule>('work');
  const [reminderPriority, setReminderPriority] = useState<NotificationRecord['priority']>('normal');
  const [reminderMessage, setReminderMessage] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const all = await loadMergedNotifications(user?.id);
      setNotifications(all);
    } catch (err) {
      console.warn('Notice loading notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsReminderModalOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    // 1. Instantly update UI
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );

    // 2. Persist in permanent storage & Supabase
    markAsReadPermanently(id);

    if (supabase && user?.id) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', user.id);
      } catch {}
    }
  };

  const markAllAsRead = async () => {
    const ids = notifications.map(n => n.id);
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );

    markAllAsReadPermanently(ids);

    if (supabase && user?.id) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } catch {}
    }
  };

  const handleDelete = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await deleteNotificationPermanently(id, user?.id);
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;

    const moduleLinks: Record<string, string> = {
      work: '/work',
      pipeline: '/pipeline',
      calculator: '/calculator',
      vendors: '/vendors',
      documents: '/documents',
      budget: '/budget',
      dashboard: '/',
    };

    const newNotif = await createOperationalReminder({
      userId: user?.id,
      title: reminderTitle.trim(),
      dueDate: reminderDate,
      message: reminderMessage.trim() || `Scheduled deadline for ${reminderDate}`,
      module: reminderModule,
      priority: reminderPriority,
      link: moduleLinks[reminderModule] || '/work',
    });

    setNotifications(prev => [newNotif, ...prev]);
    setReminderTitle('');
    setReminderMessage('');
    setIsReminderModalOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayedNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const getTypeIcon = (type: string, priority?: string) => {
    if (priority === 'urgent' || priority === 'high') {
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
    }
    switch (type) {
      case 'reminder':
        return <Clock className="w-3.5 h-3.5 text-[#cda052] flex-shrink-0" />;
      case 'security':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Durable Notification Center & Operational Reminders"
        aria-label="Notification Center"
        className="relative p-2 rounded-lg border border-slate-200 dark:border-[#242e44] bg-slate-100 dark:bg-[#0e121b] hover:border-[#cda052]/60 hover:bg-slate-200 dark:hover:bg-[#151a26] text-slate-700 dark:text-[#cbd5e1] hover:text-amber-700 dark:hover:text-[#cda052] transition-all shadow-sm cursor-pointer"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-amber-500 to-[#cda052] text-black text-[10px] font-bold font-mono flex items-center justify-center shadow-glow animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 bg-white dark:bg-[#0d101a] border border-slate-200 dark:border-[#22293e] rounded-2xl shadow-2xl z-50 animate-fade-in text-xs overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#080a11] border-b border-slate-200 dark:border-[#1b2236] flex items-center justify-between flex-shrink-0 text-slate-900 dark:text-white">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#cda052]" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Notifications & Reminders</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-800 dark:text-[#cda052] font-mono font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(!isReminderModalOpen)}
                className="text-[11px] px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-[#cda052] border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer font-medium"
                title="Create operational reminder"
              >
                <Plus className="w-3 h-3" />
                <span>Reminder</span>
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] text-[#a99a8b] dark:text-[#8e9ab5] hover:text-[#f7dda0] dark:hover:text-[#cda052] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Create Reminder Card */}
          {isReminderModalOpen && (
            <form onSubmit={handleSaveReminder} className="p-3 bg-[#131724] border-b border-[#222a3d] space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#cda052] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> New Operational Reminder
                </span>
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="text-[#64748b] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                required
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="Reminder title (e.g. Audit Layo proto samples)..."
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#07090f] border border-[#20273a] text-xs text-white placeholder:text-[#5a667d] focus:outline-none focus:border-[#cda052]"
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-[#64748b] block mb-0.5">Due Date</label>
                  <input
                    type="date"
                    required
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full px-1.5 py-1 rounded bg-[#07090f] border border-[#20273a] text-[11px] text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-[#64748b] block mb-0.5">Module</label>
                  <select
                    value={reminderModule}
                    onChange={(e) => setReminderModule(e.target.value as any)}
                    className="w-full px-1.5 py-1 rounded bg-[#07090f] border border-[#20273a] text-[11px] text-white focus:outline-none"
                  >
                    <option value="work">Work</option>
                    <option value="pipeline">Pipeline</option>
                    <option value="calculator">Calculator</option>
                    <option value="vendors">Vendors</option>
                    <option value="documents">Documents</option>
                    <option value="budget">Budget</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#64748b] block mb-0.5">Priority</label>
                  <select
                    value={reminderPriority}
                    onChange={(e) => setReminderPriority(e.target.value as any)}
                    className="w-full px-1.5 py-1 rounded bg-[#07090f] border border-[#20273a] text-[11px] text-white focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="px-2 py-1 text-[11px] text-[#8e9ab5] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#cda052] to-[#b38536] text-black font-bold text-[11px] hover:shadow-glow cursor-pointer"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          )}

          {/* Filter Bar */}
          <div className="px-3.5 py-2 bg-slate-50 dark:bg-[#0b0e17] border-b border-slate-200 dark:border-[#192133] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-amber-500/10 text-amber-800 dark:text-[#cda052] font-semibold'
                    : 'text-slate-500 dark:text-[#8e9ab5] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  filter === 'unread'
                    ? 'bg-amber-500/10 text-amber-800 dark:text-[#cda052] font-semibold'
                    : 'text-slate-500 dark:text-[#8e9ab5] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            <button
              type="button"
              onClick={fetchNotifications}
              className="text-[10px] text-slate-400 hover:text-[#cda052] font-mono cursor-pointer"
              title="Refresh notifications"
            >
              Sync
            </button>
          </div>

          {/* List Area */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-[#161d2e] flex-1">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-[#64748b]">
                <Clock className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No {filter === 'unread' ? 'unread' : ''} notifications at this time.</p>
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(true)}
                  className="mt-3 text-[11px] text-[#cda052] hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Set an operational reminder
                </button>
              </div>
            ) : (
              displayedNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-start gap-3 group ${
                    !n.isRead ? 'bg-amber-500/5 dark:bg-[rgba(205,160,82,0.06)]' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    {getTypeIcon(n.type, n.priority)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-semibold truncate text-xs ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-[#cbd5e1]'}`}>
                        {n.title}
                      </span>
                      <div className="flex items-center gap-1">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#cda052] flex-shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(n.id)}
                          title="Dismiss notification"
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {n.message && (
                      <p className="text-[11px] text-slate-500 dark:text-[#94a3b8] leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[10px] text-[#8a786a] dark:text-[#64748b] font-mono">
                      <span>{new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>

                      <div className="flex items-center gap-2">
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => {
                              markAsRead(n.id);
                              setIsOpen(false);
                            }}
                            className="text-[#cda052] hover:underline flex items-center gap-0.5 font-medium"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => markAsRead(n.id)}
                            className="text-[#8e9ab5] hover:text-white p-0.5 rounded hover:bg-[#1a2233] cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
