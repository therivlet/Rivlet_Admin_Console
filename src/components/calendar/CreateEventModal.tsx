'use client';

import React, { useState } from 'react';
import {
  CalendarEventItem,
  CalendarEventCategory,
  CalendarEventPriority,
} from '@/lib/types';
import { Calendar, Plus, X } from 'lucide-react';

interface CreateEventModalProps {
  initialDate?: Date;
  onClose: () => void;
  onSaveEvent: (event: CalendarEventItem) => void;
}

export default function CreateEventModal({
  initialDate,
  onClose,
  onSaveEvent,
}: CreateEventModalProps) {
  const defaultDateStr = (initialDate || new Date()).toISOString().split('T')[0];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CalendarEventCategory>('gst');
  const [priority, setPriority] = useState<CalendarEventPriority>('high');
  const [startDate, setStartDate] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState(defaultDateStr);
  const [endTime, setEndTime] = useState('18:00');
  const [allDay, setAllDay] = useState(true);
  const [relatedLink, setRelatedLink] = useState('/compliance?tab=gst');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    const startIso = allDay
      ? `${startDate}T00:00:00.000Z`
      : `${startDate}T${startTime}:00.000Z`;
    const endIso = allDay
      ? `${endDate || startDate}T23:59:59.000Z`
      : `${endDate || startDate}T${endTime}:00.000Z`;

    const newEvent: CalendarEventItem = {
      id: `evt-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startIso,
      endTime: endIso,
      allDay,
      category,
      priority,
      relatedLink: relatedLink.trim() || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onSaveEvent(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#1e140e] w-full max-w-lg rounded-2xl border border-[#e8ded3] dark:border-[#3d2b20] p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#e8ded3] dark:border-white/10 mb-4">
          <h3 className="text-base font-bold text-[#241812] dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#cda052]" />
            <span>Add Event to Operational Calendar</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7d6b5d] dark:text-[#a99a8b] hover:text-[#241812] dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[#604f41] dark:text-[#a99a8b] mb-1 font-medium">Event Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. GSTR-3B Tax Settlement & Verification"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#fcfaf7] dark:bg-black/40 text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 focus:border-[#cda052] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#604f41] dark:text-[#a99a8b] mb-1 font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CalendarEventCategory)}
                className="w-full px-3 py-2 rounded-xl bg-[#fcfaf7] dark:bg-black/40 text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 focus:border-[#cda052] outline-none"
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
              <label className="block text-[#604f41] dark:text-[#a99a8b] mb-1 font-medium">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CalendarEventPriority)}
                className="w-full px-3 py-2 rounded-xl bg-[#fcfaf7] dark:bg-black/40 text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 focus:border-[#cda052] outline-none"
              >
                <option value="critical">Critical (Statutory Due Date)</option>
                <option value="high">High (Audit / Customs)</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Date & Time Settings */}
          <div className="space-y-2 bg-[#fcfaf7] dark:bg-black/30 p-3 rounded-xl border border-[#e8ded3] dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#241812] dark:text-white">Date & Schedule</span>
              <label className="flex items-center gap-2 cursor-pointer text-[#4a3b30] dark:text-[#cbd5e1]">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="rounded border-[#d8c8b8] dark:border-white/20 text-[#cda052] focus:ring-0"
                />
                <span>All Day Event</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#7d6b5d] dark:text-[#8895ad] mb-1 text-[11px]">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/50 text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 outline-none"
                />
              </div>
              {!allDay && (
                <div>
                  <label className="block text-[#7d6b5d] dark:text-[#8895ad] mb-1 text-[11px]">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/50 text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 outline-none"
                  />
                </div>
              )}
            </div>

            {!allDay && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#e8ded3] dark:border-white/5">
                <div>
                  <label className="block text-[#7d6b5d] dark:text-[#8895ad] mb-1 text-[11px]">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/50 text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#7d6b5d] dark:text-[#8895ad] mb-1 text-[11px]">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/50 text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[#604f41] dark:text-[#a99a8b] mb-1 font-medium">Linked Module Route</label>
            <input
              type="text"
              placeholder="e.g. /compliance?tab=gst or /work?tab=board"
              value={relatedLink}
              onChange={(e) => setRelatedLink(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#fcfaf7] dark:bg-black/40 text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 focus:border-[#cda052] outline-none"
            />
          </div>

          <div>
            <label className="block text-[#604f41] dark:text-[#a99a8b] mb-1 font-medium">Description / Notes</label>
            <textarea
              rows={2}
              placeholder="Filing guidelines, payment amounts, CHA instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#fcfaf7] dark:bg-black/40 text-[#241812] dark:text-white border border-[#d8c8b8] dark:border-white/10 focus:border-[#cda052] outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e8ded3] dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#f5efe6] dark:bg-black/40 text-[#604f41] dark:text-[#a99a8b] hover:text-[#241812] dark:hover:text-white border border-[#d8c8b8] dark:border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#cda052] text-[#241812] font-semibold hover:bg-[#dfb56c]"
            >
              Save to Calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
