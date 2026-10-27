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
  downloadIcsFile,
} from '@/lib/calendarStorage';

function CalendarPageInner() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<Set<CalendarEventCategory>>(
    new Set(['gst', 'customs', 'itr', 'dsc', 'sprint', 'general'])
  );

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCellDate, setSelectedCellDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    setEvents(getLocalCalendarEvents());
    loadMergedCalendarEvents().then((merged) => {
      if (merged && merged.length > 0) setEvents(merged);
    });
  }, []);

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
    setIsCreateModalOpen(true);
  };

  const handleSaveEvent = (newEvent: CalendarEventItem) => {
    const updated = [newEvent, ...events];
    setEvents(updated);
    saveLocalCalendarEvents(updated);
  };

  const handleUpdateStatus = (id: string, status: CalendarEventStatus) => {
    const updated = events.map((e) => (e.id === id ? { ...e, status } : e));
    setEvents(updated);
    saveLocalCalendarEvents(updated);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    saveLocalCalendarEvents(updated);
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
        onOpenCreateModal={() => {
          setSelectedCellDate(new Date());
          setIsCreateModalOpen(true);
        }}
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
      />

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <CreateEventModal
          initialDate={selectedCellDate}
          onClose={() => setIsCreateModalOpen(false)}
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
