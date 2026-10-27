'use client';

import React, { useState, useEffect, Suspense } from 'react';
import CalendarHeader, { CalendarViewMode } from '@/components/calendar/CalendarHeader';
import CalendarMonthView from '@/components/calendar/CalendarMonthView';
import CalendarWeekView from '@/components/calendar/CalendarWeekView';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import CalendarAgendaView from '@/components/calendar/CalendarAgendaView';
import CalendarEventModal from '@/components/calendar/CalendarEventModal';
import CreateEventModal from '@/components/calendar/CreateEventModal';
import {
  CalendarEventItem,
  CalendarEventCategory,
  CalendarEventStatus,
} from '@/lib/types';
import {
  getLocalCalendarEvents,
  saveLocalCalendarEvents,
  loadMergedCalendarEvents,
  saveMergedCalendarEvents,
  deleteMergedCalendarEvent,
  expandRecurringEvents,
  downloadIcsFile,
} from '@/lib/calendarStorage';

function CalendarPageInner() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [rawEvents, setRawEvents] = useState<CalendarEventItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<CalendarEventCategory>>(
    new Set(['gst', 'customs', 'itr', 'dsc', 'sprint', 'general'])
  );

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEventItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCellDate, setSelectedCellDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setRawEvents(getLocalCalendarEvents());
    loadMergedCalendarEvents().then((merged) => {
      if (merged !== undefined && merged !== null) setRawEvents(merged);
    });
  }, []);

  // Compute active expanded view events (with recurring instances rendered across calendar dates)
  const events = React.useMemo(() => {
    return expandRecurringEvents(rawEvents, 6);
  }, [rawEvents]);

  const handleToggleCategory = (cat: CalendarEventCategory) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleSelectDate = (date: Date) => {
    setSelectedCellDate(date);
    setEditingEvent(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenCreate = () => {
    setSelectedCellDate(new Date());
    setEditingEvent(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (evt: CalendarEventItem) => {
    // If user clicked a virtual occurrence, find the root parent
    const targetId = evt.groupId || (evt.id.includes('-rec-') ? evt.id.split('-rec-')[0] : evt.id);
    const root = rawEvents.find((e) => e.id === targetId) || evt;
    setEditingEvent(root);
    setIsCreateModalOpen(true);
  };

  const handleSaveEvent = (savedEvent: CalendarEventItem) => {
    const exists = rawEvents.some((e) => e.id === savedEvent.id);
    const updated = exists
      ? rawEvents.map((e) => (e.id === savedEvent.id ? savedEvent : e))
      : [savedEvent, ...rawEvents];

    setRawEvents(updated);
    saveMergedCalendarEvents(updated);
  };

  const handleUpdateStatus = (id: string, status: CalendarEventStatus) => {
    const targetId = id.includes('-rec-') ? id.split('-rec-')[0] : id;
    const updated = rawEvents.map((e) => (e.id === targetId || e.id === id ? { ...e, status } : e));
    setRawEvents(updated);
    saveMergedCalendarEvents(updated);
  };

  const handleDeleteEvent = (id: string) => {
    const targetId = id.includes('-rec-') ? id.split('-rec-')[0] : id;
    const updated = rawEvents.filter((e) => e.id !== targetId && e.id !== id && e.groupId !== targetId);
    setRawEvents(updated);
    deleteMergedCalendarEvent(targetId);
  };

  const handleExportIcs = () => {
    const activeEvents = events.filter((e) => selectedCategories.has(e.category));
    downloadIcsFile(activeEvents, 'Rivlet_Master_Schedule.ics');
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4">
      {/* Calendar Header with Mode switch & Filters */}
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        onOpenCreateModal={handleOpenCreate}
        onExportIcs={handleExportIcs}
        events={events}
      />

      {/* Main View Area */}
      <div>
        {viewMode === 'month' && (
          <CalendarMonthView
            currentDate={currentDate}
            events={events}
            selectedCategories={selectedCategories}
            onSelectEvent={setSelectedEvent}
            onSelectDate={handleSelectDate}
          />
        )}

        {viewMode === 'week' && (
          <CalendarWeekView
            currentDate={currentDate}
            events={events}
            selectedCategories={selectedCategories}
            onSelectEvent={setSelectedEvent}
            onSelectDate={handleSelectDate}
          />
        )}

        {viewMode === 'day' && (
          <CalendarDayView
            currentDate={currentDate}
            events={events}
            selectedCategories={selectedCategories}
            onSelectEvent={setSelectedEvent}
            onSelectDate={handleSelectDate}
          />
        )}

        {viewMode === 'agenda' && (
          <CalendarAgendaView
            events={events}
            selectedCategories={selectedCategories}
            onSelectEvent={setSelectedEvent}
            onUpdateEventStatus={handleUpdateStatus}
          />
        )}
      </div>

      {/* Detail / Action Modal on Event Click */}
      <CalendarEventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onUpdateStatus={handleUpdateStatus}
        onDeleteEvent={handleDeleteEvent}
        onEditEvent={handleOpenEdit}
      />

      {/* Create / Edit Event Modal */}
      {isCreateModalOpen && (
        <CreateEventModal
          initialDate={selectedCellDate}
          initialEvent={editingEvent}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingEvent(null);
          }}
          onSaveEvent={handleSaveEvent}
        />
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#a99a8b] animate-pulse">
          Loading Operations Calendar...
        </div>
      }
    >
      <CalendarPageInner />
    </Suspense>
  );
}
