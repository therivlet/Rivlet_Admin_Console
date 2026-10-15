import { supabase } from '@/lib/supabase';
import { NotificationRecord, ReminderRecord, AppModule } from '@/lib/types';

export const STORAGE_KEY_READ_IDS = 'rivlet_read_notification_ids';
export const STORAGE_KEY_NOTIFICATIONS = 'rivlet_durable_notifications';
export const STORAGE_KEY_REMINDERS = 'rivlet_durable_reminders';

/**
 * Get the set of notification IDs that the user has marked as read.
 * Guarantees read status persistence even across refreshes or backend sync delays.
 */
export function getReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ_IDS);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    console.error('Error reading read notification IDs:', e);
    return new Set();
  }
}

/**
 * Mark a notification as read permanently in local persistence.
 */
export function markAsReadPermanently(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getReadNotificationIds();
    set.add(id);
    localStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(Array.from(set)));

    // Also update in durable notifications store
    const stored = getLocalNotifications();
    const updated = stored.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n);
    saveLocalNotifications(updated);
  } catch (e) {
    console.error('Error saving read notification ID:', e);
  }
}

/**
 * Mark multiple or all notifications as read permanently.
 */
export function markAllAsReadPermanently(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getReadNotificationIds();
    for (const id of ids) set.add(id);
    localStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(Array.from(set)));

    const stored = getLocalNotifications();
    const updated = stored.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }));
    saveLocalNotifications(updated);
  } catch (e) {
    console.error('Error marking all notifications as read:', e);
  }
}

/**
 * Get locally stored notifications.
 */
export function getLocalNotifications(): NotificationRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading local notifications:', e);
    return [];
  }
}

/**
 * Save notifications list to local storage.
 */
export function saveLocalNotifications(items: NotificationRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving local notifications:', e);
  }
}

/**
 * Add a new durable notification (persisting to Supabase and LocalStorage).
 */
export async function addDurableNotification(
  item: {
    userId?: string;
    title: string;
    message?: string;
    type?: NotificationRecord['type'];
    module?: AppModule;
    priority?: NotificationRecord['priority'];
    link?: string;
  }
): Promise<NotificationRecord> {
  const newRecord: NotificationRecord = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: item.userId,
    title: item.title,
    message: item.message,
    type: item.type || 'info',
    module: item.module,
    priority: item.priority || 'normal',
    link: item.link,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  // 1. Save locally
  const current = getLocalNotifications();
  const updated = [newRecord, ...current.slice(0, 49)];
  saveLocalNotifications(updated);

  // 2. Save to Supabase if available
  if (supabase && item.userId) {
    try {
      await supabase.from('notifications').insert({
        id: newRecord.id,
        user_id: item.userId,
        title: newRecord.title,
        message: newRecord.message || '',
        type: newRecord.type,
        module: newRecord.module || 'work',
        priority: newRecord.priority,
        link: newRecord.link,
        is_read: false,
        created_at: newRecord.createdAt,
      });
    } catch (err) {
      console.warn('Notice syncing notification to Supabase:', err);
    }
  }

  return newRecord;
}

/**
 * Create an operational reminder.
 */
export async function createOperationalReminder(reminder: {
  userId?: string;
  title: string;
  dueDate: string;
  message?: string;
  module?: AppModule;
  priority?: NotificationRecord['priority'];
  link?: string;
}): Promise<NotificationRecord> {
  // Add as a notification of type 'reminder'
  const notif = await addDurableNotification({
    userId: reminder.userId,
    title: `Reminder: ${reminder.title}`,
    message: reminder.message || `Due on ${new Date(reminder.dueDate).toLocaleDateString()}`,
    type: 'reminder',
    module: reminder.module || 'work',
    priority: reminder.priority || 'normal',
    link: reminder.link,
  });

  // Also store in Supabase reminders table if available
  if (supabase && reminder.userId) {
    try {
      await supabase.from('reminders').insert({
        id: `rem-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        user_id: reminder.userId,
        title: reminder.title,
        due_date: reminder.dueDate,
        status: 'pending',
      });
    } catch (e) {
      console.warn('Notice saving reminder to Supabase:', e);
    }
  }

  return notif;
}

/**
 * Delete a notification permanently.
 */
export async function deleteNotificationPermanently(id: string, userId?: string): Promise<void> {
  const current = getLocalNotifications();
  saveLocalNotifications(current.filter(n => n.id !== id));

  if (supabase && userId) {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    } catch {}
  }
}

/**
 * Load merged notifications from Supabase and local storage,
 * applying guaranteed read statuses from `getReadNotificationIds()`.
 */
export async function loadMergedNotifications(userId?: string): Promise<NotificationRecord[]> {
  const readIds = getReadNotificationIds();
  const localList = getLocalNotifications();
  const map = new Map<string, NotificationRecord>();

  // Add local records first
  for (const n of localList) {
    map.set(n.id, {
      ...n,
      isRead: n.isRead || readIds.has(n.id),
    });
  }

  // Fetch from Supabase if connected
  if (supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40);

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const isRead = row.is_read || readIds.has(row.id);
          map.set(row.id, {
            id: row.id,
            userId: row.user_id,
            title: row.title,
            message: row.message,
            type: row.type || 'info',
            module: row.module,
            link: row.link,
            priority: row.priority || 'normal',
            isRead,
            readAt: row.read_at,
            createdAt: row.created_at,
          });
        }
      }
    } catch (err) {
      console.warn('Notice fetching Supabase notifications:', err);
    }
  }

  const all = Array.from(map.values());
  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return all;
}
