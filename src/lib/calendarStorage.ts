import { supabase } from '@/lib/supabase';
import { CalendarEventItem } from '@/lib/types';

export const STORAGE_KEY_CALENDAR_EVENTS = 'rivlet_calendar_events';

// Real production events for current operational period
export const INITIAL_CALENDAR_EVENTS: CalendarEventItem[] = [
  {
    id: 'evt-gst-gstr1-nov26',
    title: 'Statutory Filing: GSTR-1 Monthly Return',
    description: 'Outward supplies and invoice furnishing cutoff for Rivlet Apparel. Mandatory upload before portal cutoff.',
    startTime: '2026-11-10T09:00:00Z',
    endTime: '2026-11-10T18:00:00Z',
    allDay: true,
    category: 'gst',
    priority: 'high',
    relatedLink: '/compliance?tab=gst',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-gst-gstr3b-nov26',
    title: 'Statutory Filing: GSTR-3B Summary & Tax Settlement',
    description: 'Net tax settlement under Rule 88A. Settle output tax liability through available Input Tax Credit and PMT-06 challans.',
    startTime: '2026-11-20T09:00:00Z',
    endTime: '2026-11-20T20:00:00Z',
    allDay: true,
    category: 'gst',
    priority: 'critical',
    relatedLink: '/compliance?tab=gst',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-customs-boe-chennai',
    title: 'Customs Duty Payment: Giza Cotton Yarn (BE-8492019)',
    description: 'Port INMAA1 Chennai Sea Customs. Pay assessed basic customs duty and IGST via ICEGATE payment gateway.',
    startTime: '2026-11-05T10:00:00Z',
    endTime: '2026-11-05T17:00:00Z',
    allDay: false,
    category: 'customs',
    priority: 'high',
    relatedLink: '/compliance?tab=icegate',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-tds-26q-oct26',
    title: 'TDS Quarterly Return: Form 26Q (Q2 Non-Salary)',
    description: 'Statutory quarterly filing for vendor contracts, mill job-work (194C), and professional legal retainers (194J).',
    startTime: '2026-10-31T09:00:00Z',
    endTime: '2026-10-31T18:00:00Z',
    allDay: true,
    category: 'itr',
    priority: 'high',
    relatedLink: '/compliance?tab=itr',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-dsc-renewal-director',
    title: 'Digital Signature Certificate Expiry Warning (Director DSC)',
    description: 'eMudhra Class 3 token expires soon. Physical token in Executive Safe A-1. Complete eKYC video verification with issuing authority.',
    startTime: '2026-11-28T11:00:00Z',
    endTime: '2026-11-28T13:00:00Z',
    allDay: false,
    category: 'dsc',
    priority: 'high',
    relatedLink: '/compliance?tab=dsc',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-itr-adv-tax-q3',
    title: 'Advance Tax 3rd Installment (75% Cumulative)',
    description: 'Challan 280 payment on Income Tax E-Filing portal. Section 208/211 corporate obligation.',
    startTime: '2026-12-15T09:00:00Z',
    endTime: '2026-12-15T23:59:00Z',
    allDay: true,
    category: 'itr',
    priority: 'critical',
    relatedLink: '/compliance?tab=itr',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-sprint-autumn-launch',
    title: 'Sprint Cadence: Autumn/Winter RTW Sample Gate',
    description: 'Milestone review for initial 12 tailored styles, BOM pricing lock, and vendor fabric yield checks.',
    startTime: '2026-11-14T14:00:00Z',
    endTime: '2026-11-14T17:30:00Z',
    allDay: false,
    category: 'sprint',
    priority: 'medium',
    relatedLink: '/work?tab=board',
    status: 'in_progress',
    createdAt: new Date().toISOString(),
  },
];

export function getLocalCalendarEvents(): CalendarEventItem[] {
  if (typeof window === 'undefined') return INITIAL_CALENDAR_EVENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CALENDAR_EVENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CALENDAR_EVENTS, JSON.stringify(INITIAL_CALENDAR_EVENTS));
      return INITIAL_CALENDAR_EVENTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading calendar events:', err);
    return INITIAL_CALENDAR_EVENTS;
  }
}

export function saveLocalCalendarEvents(events: CalendarEventItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CALENDAR_EVENTS, JSON.stringify(events));
  } catch (err) {
    console.error('Error saving calendar events:', err);
  }
}

export function expandRecurringEvents(
  baseEvents: CalendarEventItem[],
  horizonMonths: number = 6
): CalendarEventItem[] {
  const result: CalendarEventItem[] = [];

  baseEvents.forEach((evt) => {
    // Always include the base event instance
    result.push(evt);

    // If it's not recurring, nothing more to expand
    if (!evt.recurrence || evt.recurrence === 'none') {
      return;
    }

    const start = new Date(evt.startTime);
    const end = new Date(evt.endTime);
    const durationMs = Math.max(0, end.getTime() - start.getTime());
    const eventGroupId = evt.groupId || evt.id;

    let occurrencesCount = 0;
    const maxOccurrences = 12; // safe ceiling

    let currentStart = new Date(start);

    for (let i = 1; i <= maxOccurrences; i++) {
      if (evt.recurrence === 'weekly') {
        currentStart = new Date(currentStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (evt.recurrence === 'monthly') {
        currentStart = new Date(currentStart);
        currentStart.setMonth(currentStart.getMonth() + 1);
      } else if (evt.recurrence === 'yearly') {
        currentStart = new Date(currentStart);
        currentStart.setFullYear(currentStart.getFullYear() + 1);
      } else if (evt.recurrence === 'custom') {
        // Bi-weekly fallback for custom schedule
        currentStart = new Date(currentStart.getTime() + 14 * 24 * 60 * 60 * 1000);
      }

      // Check horizon (don't generate further than horizonMonths)
      const monthsDiff =
        (currentStart.getFullYear() - start.getFullYear()) * 12 +
        (currentStart.getMonth() - start.getMonth());
      if (monthsDiff > horizonMonths) break;

      const currentEnd = new Date(currentStart.getTime() + durationMs);

      result.push({
        ...evt,
        id: `${eventGroupId}-rec-${i}`,
        groupId: eventGroupId,
        startTime: currentStart.toISOString(),
        endTime: currentEnd.toISOString(),
        status: 'pending', // generated future instances start as pending
      });
      occurrencesCount++;
    }
  });

  return result;
}

export async function loadMergedCalendarEvents(): Promise<CalendarEventItem[]> {
  const localList = getLocalCalendarEvents();
  if (!supabase) return localList;

  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_time', { ascending: true });

    if (error || !data || data.length === 0) return localList;

    const remoteItems: CalendarEventItem[] = data.map((d: any) => {
      let recurrence: CalendarEventItem['recurrence'] = 'none';
      let recurrenceRule: string | undefined = undefined;
      let groupId: string | undefined = undefined;

      // Extract recurrence metadata if stored in description JSON or standard field
      if (d.description && d.description.includes('__REC_META__:')) {
        try {
          const parts = d.description.split('__REC_META__:');
          const meta = JSON.parse(parts[1]);
          recurrence = meta.recurrence;
          recurrenceRule = meta.recurrenceRule;
          groupId = meta.groupId;
        } catch {
          // ignore parsing error
        }
      }

      return {
        id: d.id,
        title: d.title,
        description: d.description ? d.description.split('__REC_META__:')[0].trim() : '',
        startTime: d.start_time,
        endTime: d.end_time,
        allDay: Boolean(d.all_day),
        category: d.event_category,
        priority: d.priority,
        relatedEntityId: d.related_entity_id,
        relatedLink: d.related_link,
        status: d.status,
        recurrence,
        recurrenceRule,
        groupId,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      };
    });

    saveLocalCalendarEvents(remoteItems);
    return remoteItems;
  } catch (err) {
    console.warn('Notice loading calendar events from Supabase:', err);
    return localList;
  }
}

export async function saveMergedCalendarEvents(events: CalendarEventItem[]): Promise<void> {
  saveLocalCalendarEvents(events);
  if (!supabase) return;

  try {
    // Only persist root events or non-virtual instances
    const nonVirtual = events.filter((e) => !e.id.includes('-rec-'));

    for (const evt of nonVirtual) {
      const isUuid = evt.id.length === 36 && evt.id.includes('-');
      
      // Embed recurrence metadata in description if recurring
      let finalDescription = evt.description || '';
      if (evt.recurrence && evt.recurrence !== 'none') {
        const meta = JSON.stringify({
          recurrence: evt.recurrence,
          recurrenceRule: evt.recurrenceRule,
          groupId: evt.groupId || evt.id,
        });
        finalDescription = `${finalDescription}\n\n__REC_META__:${meta}`;
      }

      const payload: any = {
        title: evt.title,
        description: finalDescription,
        start_time: evt.startTime,
        end_time: evt.endTime,
        all_day: evt.allDay,
        event_category: evt.category,
        priority: evt.priority,
        related_link: evt.relatedLink || null,
        status: evt.status,
        updated_at: new Date().toISOString(),
      };

      if (isUuid) {
        payload.id = evt.id;
        await supabase.from('calendar_events').upsert(payload);
      } else {
        await supabase.from('calendar_events').insert(payload);
      }
    }
  } catch (err) {
    console.error('Notice persisting calendar events to Supabase:', err);
  }
}

export async function deleteMergedCalendarEvent(id: string): Promise<void> {
  const current = getLocalCalendarEvents();
  const updated = current.filter((e) => e.id !== id && e.groupId !== id);
  saveLocalCalendarEvents(updated);
  if (!supabase) return;

  try {
    const isUuid = id.length === 36 && id.includes('-');
    if (isUuid) {
      await supabase.from('calendar_events').delete().eq('id', id);
    }
  } catch (err) {
    console.error('Notice deleting calendar event from Supabase:', err);
  }
}

// Generate RFC 5545 standard .ics file for Google Calendar, Apple Calendar, and Microsoft Teams
export function generateIcsData(events: CalendarEventItem[]): string {
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rivlet Apparel//Operations & Compliance Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((evt) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${evt.id}@rivlet.app`);
    lines.push(`DTSTAMP:${formatDate(new Date().toISOString())}`);
    lines.push(`DTSTART:${formatDate(evt.startTime)}`);
    lines.push(`DTEND:${formatDate(evt.endTime)}`);
    lines.push(`SUMMARY:${evt.title.replace(/\n/g, ' ')}`);
    if (evt.description) {
      lines.push(`DESCRIPTION:${evt.description.replace(/\n/g, '\\n')}`);
    }
    if (evt.relatedLink) {
      lines.push(`URL:https://admin.rivlet.app${evt.relatedLink}`);
    }
    lines.push(`STATUS:${evt.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsFile(events: CalendarEventItem[], filename: string = 'rivlet_compliance_schedule.ics'): void {
  const icsData = generateIcsData(events);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
