'use client';

import React, { useState } from 'react';
import {
  CalendarEventItem,
  CalendarEventCategory,
  CalendarEventPriority,
  CalendarEventRecurrence,
} from '@/lib/types';
import { Calendar, Plus, X, Repeat, Clock, Link as LinkIcon, Edit3 } from 'lucide-react';

interface CreateEventModalProps {
  initialDate?: Date;
  initialEvent?: CalendarEventItem | null;
  onClose: () => void;
  onSaveEvent: (event: CalendarEventItem) => void;
}

export default function CreateEventModal({
  initialDate,
  initialEvent,
  onClose,
  onSaveEvent,
}: CreateEventModalProps) {
  const isEditing = Boolean(initialEvent);

  const defaultDateStr = initialEvent
    ? new Date(initialEvent.startTime).toISOString().split('T')[0]
    : (initialDate || new Date()).toISOString().split('T')[0];

  const defaultStartTimeStr = initialEvent
    ? new Date(initialEvent.startTime).toTimeString().slice(0, 5)
    : '09:00';

  const defaultEndDateStr = initialEvent
    ? new Date(initialEvent.endTime).toISOString().split('T')[0]
    : (initialDate || new Date()).toISOString().split('T')[0];

  const defaultEndTimeStr = initialEvent
    ? new Date(initialEvent.endTime).toTimeString().slice(0, 5)
    : '18:00';

  const [title, setTitle] = useState(initialEvent?.title || '');
  const [description, setDescription] = useState(initialEvent?.description || '');
  const [category, setCategory] = useState<CalendarEventCategory>(initialEvent?.category || 'gst');
  const [priority, setPriority] = useState<CalendarEventPriority>(initialEvent?.priority || 'high');
  const [startDate, setStartDate] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState(defaultStartTimeStr);
  const [endDate, setEndDate] = useState(defaultEndDateStr);
  const [endTime, setEndTime] = useState(defaultEndTimeStr);
  const [allDay, setAllDay] = useState(initialEvent ? initialEvent.allDay : true);
  const [relatedLink, setRelatedLink] = useState(initialEvent?.relatedLink || '/compliance?tab=gst');

  // Recurrence settings
  const [recurrence, setRecurrence] = useState<CalendarEventRecurrence>(
    initialEvent?.recurrence || 'none'
  );
  const [recurrenceRule, setRecurrenceRule] = useState<string>(
    initialEvent?.recurrenceRule || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    const startIso = allDay
      ? `${startDate}T00:00:00.000Z`
      : `${startDate}T${startTime}:00.000Z`;
    const endIso = allDay
      ? `${endDate || startDate}T23:59:59.000Z`
      : `${endDate || startDate}T${endTime}:00.000Z`;

    // Derive human friendly recurrence rule description if not custom-typed
    let derivedRule = recurrenceRule.trim();
    if (recurrence !== 'none' && !derivedRule) {
      const d = new Date(startDate);
      const dayOfMonth = d.getDate();
      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = d.toLocaleDateString('en-US', { month: 'long' });

      if (recurrence === 'monthly') {
        derivedRule = `Every month on the ${dayOfMonth}${getOrdinal(dayOfMonth)}`;
      } else if (recurrence === 'yearly') {
        derivedRule = `Every year on ${monthName} ${dayOfMonth}`;
      } else if (recurrence === 'weekly') {
        derivedRule = `Every week on ${dayOfWeek}`;
      } else if (recurrence === 'custom') {
        derivedRule = 'Custom recurrence cycle';
      }
    }

    const eventId = initialEvent?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `evt-${Date.now()}`);

    const savedEvent: CalendarEventItem = {
      id: eventId,
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startIso,
      endTime: endIso,
      allDay,
      category,
      priority,
      relatedLink: relatedLink.trim() || undefined,
      status: initialEvent?.status || 'pending',
      recurrence,
      recurrenceRule: recurrence !== 'none' ? derivedRule : undefined,
      groupId: initialEvent?.groupId || (recurrence !== 'none' ? eventId : undefined),
      createdAt: initialEvent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveEvent(savedEvent);
    onClose();
  };

  function getOrdinal(n: number) {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-[#0e121b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-[#1e2638] p-5 sm:p-6 shadow-2xl my-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1e2638] mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {isEditing ? (
              <>
                <Edit3 className="w-4 h-4 text-[#cda052]" />
                <span>Edit Calendar Event & Recurrence</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-[#cda052]" />
                <span>Add Event to Operational Calendar</span>
              </>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-[#8a96ae] mb-1 font-medium">Event Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. GSTR-3B Tax Settlement & Verification"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-[#8a96ae] mb-1 font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CalendarEventCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
              >
                <option value="gst">GST (Goods & Services Tax)</option>
                <option value="customs">ICEGATE Customs Clearance</option>
                <option value="itr">Direct Tax & ITR</option>
                <option value="dsc">DSC Certificate Expiry</option>
                <option value="sprint">Work Tracking & Sprints</option>
                <option value="general">General Operational</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-[#8a96ae] mb-1 font-medium">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CalendarEventPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
              >
                <option value="critical">Critical (Statutory Due Date)</option>
                <option value="high">High (Audit / Customs)</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Date & Time Settings */}
          <div className="space-y-2 bg-slate-50 dark:bg-black/30 p-3 rounded-xl border border-slate-200 dark:border-[#1e2638]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#cda052]" />
                <span>Date & Schedule</span>
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded border-slate-300 dark:border-white/20 text-[#cda052] focus:ring-0"
                />
                <span>All Day Event</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 text-[11px]">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate || endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/50 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none"
                />
              </div>

              {!allDay && (
                <div>
                  <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 text-[11px]">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/50 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none"
                  />
                </div>
              )}
            </div>

            {!allDay && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/50 dark:border-white/5">
                <div>
                  <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 text-[11px]">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/50 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 dark:text-[#8a96ae] mb-1 text-[11px]">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/50 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recurrence Schedule Section */}
          <div className="space-y-2.5 bg-amber-500/5 dark:bg-[rgba(205,160,82,0.06)] p-3 rounded-xl border border-amber-500/20 dark:border-[#cda052]/30">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-[#cda052]" />
                <span>Recurring Schedule Cadence</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#cda052]/10 text-[#cda052] font-bold">
                Automation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-[#8a96ae] mb-1 font-medium">Recurrence Frequency</label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as CalendarEventRecurrence)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none font-medium"
                >
                  <option value="none">Does not repeat (One-off)</option>
                  <option value="monthly">Every Month on Same Date</option>
                  <option value="yearly">Every Year on Same Date</option>
                  <option value="weekly">Every Week on Same Day</option>
                  <option value="custom">Custom Recurrence Schedule</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-[#8a96ae] mb-1 font-medium">
                  {recurrence === 'custom' ? 'Custom Cadence Rule *' : 'Cadence Summary'}
                </label>
                <input
                  type="text"
                  placeholder={
                    recurrence === 'monthly'
                      ? 'e.g. Every month on the 20th'
                      : recurrence === 'yearly'
                      ? 'e.g. Every year on Nov 10th'
                      : recurrence === 'weekly'
                      ? 'e.g. Every Monday'
                      : recurrence === 'custom'
                      ? 'e.g. Bi-weekly every other Friday'
                      : 'Not repeating'
                  }
                  disabled={recurrence === 'none'}
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none disabled:opacity-50"
                />
              </div>
            </div>

            {recurrence !== 'none' && (
              <div className="text-[11px] text-amber-700 dark:text-[#f7d88c] bg-amber-500/10 p-2 rounded-lg flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  This event will automatically recur in your master schedule and display as an organized group in the Agenda tab.
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-700 dark:text-[#8a96ae] mb-1 font-medium">Linked Module Route</label>
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. /compliance?tab=gst or /work?tab=board"
                value={relatedLink}
                onChange={(e) => setRelatedLink(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-[#8a96ae] mb-1 font-medium">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Filing guidelines, payment amounts, CHA instructions, recurring compliance rules..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/40 text-slate-900 dark:text-white border border-slate-200 dark:border-[#1e2638] focus:border-[#cda052] outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-[#1e2638]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-black/40 text-slate-600 dark:text-[#8a96ae] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#cda052] text-slate-900 font-semibold hover:bg-[#dfb56c] shadow-sm transition-colors"
            >
              {isEditing ? 'Save Changes' : 'Save to Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
