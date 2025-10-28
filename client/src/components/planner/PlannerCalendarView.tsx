import React from 'react';
import { Loader2 } from 'lucide-react';
import { CalendarEvent, CalendarDay, ViewMode } from '@/types/calendar';
import { WeeklyCalendarGrid } from '@/components/calendar/WeeklyCalendarGrid';
import { DailyView } from '@/components/calendar/DailyView';
import { MonthlyView } from '@/components/calendar/MonthlyView';
import { YearlyView } from '@/components/calendar/YearlyView';

export interface PlannerCalendarViewProps {
  viewMode: ViewMode;
  selectedDate: Date;
  currentWeek: CalendarDay[];
  events: CalendarEvent[];
  isLoading: boolean;
  onDayClick: (date: Date) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventMove: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
  onUpdateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  onCreateEvent: (startTime: Date, endTime: Date) => void;
  onDeleteEvent: (eventId: string) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onDateChange: (date: Date) => void;
  onNavigateDay: (direction: 'prev' | 'next') => void;
}

/**
 * Planner Calendar View Component
 *
 * Renders the appropriate calendar view based on the current view mode:
 * - Weekly: WeeklyCalendarGrid
 * - Daily: DailyView
 * - Monthly: MonthlyView
 * - Yearly: YearlyView
 *
 * Handles all event interactions and passes them to parent handlers
 */
export function PlannerCalendarView({
  viewMode,
  selectedDate,
  currentWeek,
  events,
  isLoading,
  onDayClick,
  onTimeSlotClick,
  onEventClick,
  onEventMove,
  onUpdateEvent,
  onCreateEvent,
  onDeleteEvent,
  onViewModeChange,
  onDateChange,
  onNavigateDay,
}: PlannerCalendarViewProps) {
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading calendar...</span>
      </div>
    );
  }

  // Filter events for daily view
  const getDailyEvents = () => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
  };

  // Render appropriate view based on viewMode
  if (viewMode === 'weekly') {
    return (
      <WeeklyCalendarGrid
        week={currentWeek}
        events={events}
        onDayClick={onDayClick}
        onTimeSlotClick={onTimeSlotClick}
        onEventClick={onEventClick}
        onEventMove={onEventMove}
      />
    );
  }

  if (viewMode === 'daily') {
    const dailyEvents = getDailyEvents();

    return (
      <DailyView
        selectedDate={selectedDate}
        events={dailyEvents}
        dailyNotes=""
        onPreviousDay={() => onNavigateDay('prev')}
        onNextDay={() => onNavigateDay('next')}
        onBackToWeek={() => onViewModeChange('weekly')}
        onEventClick={onEventClick}
        onUpdateEvent={onUpdateEvent}
        onUpdateDailyNotes={() => {
          // Handle daily notes update if needed
        }}
        onEventMove={onEventMove}
        onCreateEvent={onCreateEvent}
        onDeleteEvent={onDeleteEvent}
      />
    );
  }

  if (viewMode === 'monthly') {
    return (
      <MonthlyView
        currentDate={selectedDate}
        events={events}
        onDateSelect={(date) => {
          onDateChange(date);
          onViewModeChange('daily');
        }}
        onMonthChange={onDateChange}
        onEventClick={onEventClick}
      />
    );
  }

  // Yearly view
  return (
    <YearlyView
      currentDate={selectedDate}
      events={events}
      onDateSelect={(date) => {
        onDateChange(date);
        onViewModeChange('daily');
      }}
      onYearChange={onDateChange}
      onMonthSelect={(date) => {
        onDateChange(date);
        onViewModeChange('monthly');
      }}
    />
  );
}
