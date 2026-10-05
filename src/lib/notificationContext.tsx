'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, Sparkles, AlertTriangle, AlertCircle, X } from 'lucide-react';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms
  createdAt: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'createdAt'>) => string;
  removeNotification: (id: string) => void;
  success: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Global standalone dispatcher that works anywhere in client-side code
type GlobalNotificationListener = (item: Omit<NotificationItem, 'id' | 'createdAt'>) => void;
const globalListeners: Set<GlobalNotificationListener> = new Set();

export const notify = {
  show: (item: Omit<NotificationItem, 'id' | 'createdAt'>) => {
    globalListeners.forEach((fn) => fn(item));
  },
  success: (title: string, message?: string, duration: number = 3800) => {
    notify.show({ type: 'success', title, message, duration });
  },
  info: (title: string, message?: string, duration: number = 3800) => {
    notify.show({ type: 'info', title, message, duration });
  },
  warning: (title: string, message?: string, duration: number = 4200) => {
    notify.show({ type: 'warning', title, message, duration });
  },
  error: (title: string, message?: string, duration: number = 4800) => {
    notify.show({ type: 'error', title, message, duration });
  },
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (item: Omit<NotificationItem, 'id' | 'createdAt'>) => {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newNotif: NotificationItem = {
        ...item,
        id,
        duration: item.duration ?? 3800,
        createdAt: Date.now(),
      };

      setNotifications((prev) => [newNotif, ...prev.slice(0, 4)]); // Keep maximum 5 at a time
      return id;
    },
    []
  );

  const success = useCallback(
    (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'success', title, message, duration }),
    [addNotification]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'info', title, message, duration }),
    [addNotification]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'warning', title, message, duration }),
    [addNotification]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) =>
      addNotification({ type: 'error', title, message, duration }),
    [addNotification]
  );

  // Subscribe standalone notify helper to this provider
  useEffect(() => {
    const handleGlobal = (item: Omit<NotificationItem, 'id' | 'createdAt'>) => {
      addNotification(item);
    };
    globalListeners.add(handleGlobal);
    return () => {
      globalListeners.delete(handleGlobal);
    };
  }, [addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        success,
        info,
        warning,
        error,
      }}
    >
      {children}
      <NotificationContainer notifications={notifications} onDismiss={removeNotification} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    // Graceful fallback to global dispatcher if outside provider
    return {
      notifications: [],
      addNotification: (item: any) => notify.show(item),
      removeNotification: () => {},
      success: notify.success,
      info: notify.info,
      warning: notify.warning,
      error: notify.error,
    };
  }
  return ctx;
}

// Notification Card Component
function NotificationCard({
  item,
  onDismiss,
}: {
  item: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = item.duration || 3800;
    const intervalTime = 50;
    const decrement = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          onDismiss(item.id);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [item, onDismiss]);

  const styleConfig = {
    success: {
      border: 'border-[#cda052]/50 hover:border-[#cda052]',
      bg: 'bg-[#0d121c]/95',
      glow: 'shadow-[0_8px_30px_rgba(205,160,82,0.18)]',
      iconBg: 'bg-gradient-to-br from-[#cda052]/20 to-[#8c672b]/10 text-[#e6c875] border border-[#cda052]/40',
      progressBar: 'bg-gradient-to-r from-[#cda052] to-[#f0d48f]',
      icon: CheckCircle2,
    },
    info: {
      border: 'border-sky-500/40 hover:border-sky-400',
      bg: 'bg-[#0b1220]/95',
      glow: 'shadow-[0_8px_30px_rgba(56,189,248,0.18)]',
      iconBg: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
      progressBar: 'bg-gradient-to-r from-sky-400 to-cyan-300',
      icon: Sparkles,
    },
    warning: {
      border: 'border-amber-500/40 hover:border-amber-400',
      bg: 'bg-[#18120a]/95',
      glow: 'shadow-[0_8px_30px_rgba(245,158,11,0.18)]',
      iconBg: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      progressBar: 'bg-gradient-to-r from-amber-400 to-yellow-300',
      icon: AlertTriangle,
    },
    error: {
      border: 'border-rose-500/40 hover:border-rose-400',
      bg: 'bg-[#190c10]/95',
      glow: 'shadow-[0_8px_30px_rgba(244,63,94,0.2)]',
      iconBg: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
      progressBar: 'bg-gradient-to-r from-rose-500 to-red-400',
      icon: AlertCircle,
    },
  }[item.type];

  const Icon = styleConfig.icon;

  return (
    <div
      role="alert"
      className={`pointer-events-auto relative overflow-hidden w-full max-w-sm sm:max-w-md rounded-2xl border ${styleConfig.border} ${styleConfig.bg} ${styleConfig.glow} backdrop-blur-2xl p-4 transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-top-4`}
    >
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={`p-2 rounded-xl flex-shrink-0 ${styleConfig.iconBg}`}>
          <Icon className="w-4 h-4 stroke-[2.2]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
            {item.title}
          </h4>
          {item.message && (
            <p className="text-[11px] text-[#cbd5e1] leading-relaxed mt-0.5 whitespace-pre-line line-clamp-3">
              {item.message}
            </p>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => onDismiss(item.id)}
          className="p-1 rounded-lg text-[#7c869d] hover:text-white hover:bg-white/[0.08] transition-colors flex-shrink-0 cursor-pointer"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-Dismiss Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${styleConfig.progressBar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Container View rendered at the top of the viewport
function NotificationContainer({
  notifications,
  onDismiss,
}: {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}) {
  if (notifications.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 sm:top-5 sm:right-6 z-[99999] flex flex-col gap-2.5 pointer-events-none max-w-full px-2 sm:px-0"
    >
      {notifications.map((n) => (
        <NotificationCard key={n.id} item={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
