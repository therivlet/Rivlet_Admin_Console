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
  Calendar,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';
import { NotificationRecord } from '@/lib/types';

export default function NotificationCenterDropdown() {
  const { user, session } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!supabase || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!error && Array.isArray(data) && data.length > 0) {
        setNotifications(data.map((n: any) => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type,
          module: n.module,
          link: n.link,
          isRead: n.is_read,
          readAt: n.read_at,
          priority: n.priority || 'normal',
          createdAt: n.created_at,
        })));
      } else {
        // Provide starter reminders if notifications table is empty
        setNotifications([
          {
            id: 'notif-welcome',
            userId: user.id,
            title: 'Welcome to Rivlet Executive Console',
            message: `Signed in as ${user.name} (${user.role.toUpperCase()}). Enterprise RLS policies active.`,
            type: 'info',
            module: 'dashboard',
            isRead: false,
            priority: 'normal',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'notif-compliance',
            userId: user.id,
            title: 'Compliance Audit Reminder',
            message: 'Vendor ISO 9001 certifications due for renewal in 45 days.',
            type: 'reminder',
            module: 'documents',
            link: '/documents',
            isRead: false,
            priority: 'high',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'notif-pipeline',
            userId: user.id,
            title: 'Pipeline Milestone Check',
            message: 'Sample review target date approaching for Fall/Winter collection.',
            type: 'reminder',
            module: 'pipeline',
            link: '/pipeline',
            isRead: false,
            priority: 'normal',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
          }
        ]);
      }
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
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );

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
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );

    if (supabase && user?.id) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } catch {}
    }
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
        className="relative p-2 rounded-lg border border-[#ded5c8] dark:border-[#242e44] bg-[#f6f2ec] dark:bg-[#0e121b] hover:border-[#cda052]/60 hover:bg-[#efe7dc] dark:hover:bg-[#151a26] text-[#57534e] dark:text-[#cbd5e1] hover:text-[#8c672b] dark:hover:text-[#cda052] transition-all shadow-sm cursor-pointer"
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
        <div className="absolute right-0 mt-2 w-[calc(100vw-24px)] max-w-sm sm:w-96 bg-white dark:bg-[#0d101a] border border-[#ded5c8] dark:border-[#22293e] rounded-2xl shadow-2xl z-50 animate-fade-in text-xs overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="p-3.5 bg-[#faf8f5] dark:bg-[#080a11] border-b border-[#ede5da] dark:border-[#1b2236] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#cda052]" />
              <span className="font-bold text-[#1c1917] dark:text-white text-sm">Notifications & Reminders</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[#8c672b] dark:text-[#cda052] font-mono font-semibold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] text-[#78716c] dark:text-[#8e9ab5] hover:text-[#8c672b] dark:hover:text-[#cda052] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="px-3.5 py-2 bg-[#f5f0ea] dark:bg-[#0b0e17] border-b border-[#ede5da] dark:border-[#192133] flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filter === 'all'
                  ? 'bg-[rgba(205,160,82,0.18)] text-[#8c672b] dark:text-[#f7dda0] font-semibold'
                  : 'text-[#78716c] dark:text-[#8e9ab5] hover:text-[#1c1917] dark:hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filter === 'unread'
                  ? 'bg-[rgba(205,160,82,0.18)] text-[#f7dda0] font-semibold'
                  : 'text-[#8e9ab5] hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* List Area */}
          <div className="overflow-y-auto divide-y divide-[#ede5da] dark:divide-[#161d2e] flex-1">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center text-[#78716c] dark:text-[#64748b]">
                <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No {filter === 'unread' ? 'unread' : ''} notifications at this time.</p>
              </div>
            ) : (
              displayedNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] flex items-start gap-3 ${
                    !n.isRead ? 'bg-[rgba(205,160,82,0.06)]' : ''
                  }`}
                >
                  <div className="mt-0.5">
                    {getTypeIcon(n.type, n.priority)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-semibold truncate text-xs ${!n.isRead ? 'text-[#1c1917] dark:text-white' : 'text-[#57534e] dark:text-[#cbd5e1]'}`}>
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#cda052] flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-[11px] text-[#78716c] dark:text-[#94a3b8] leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-[#64748b] font-mono">
                      <span>{new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>

                      <div className="flex items-center gap-2">
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={() => {
                              markAsRead(n.id);
                              setIsOpen(false);
                            }}
                            className="text-[#cda052] hover:underline flex items-center gap-0.5"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                        {!n.isRead && (
                          <button
                            type="button"
                            onClick={() => markAsRead(n.id)}
                            className="text-[#8e9ab5] hover:text-white"
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
