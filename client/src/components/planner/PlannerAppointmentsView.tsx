import React from 'react';
import { CalendarEvent } from '@/types/calendar';
import { AppointmentStatusView, AppointmentStats } from '@/components/calendar/AppointmentStatusView';

export interface PlannerAppointmentsViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onEventClick: (event: CalendarEvent) => void;
}

/**
 * Planner Appointments View Component
 *
 * Displays:
 * - Appointment statistics (counts, status breakdown)
 * - Appointment status view (list of appointments with statuses)
 *
 * Provides overview of appointments and their current states
 */
export function PlannerAppointmentsView({
  events,
  selectedDate,
  onEventClick,
}: PlannerAppointmentsViewProps) {
  return (
    <div className="space-y-4">
      <AppointmentStats events={events} selectedDate={selectedDate} />
      <AppointmentStatusView
        events={events}
        selectedDate={selectedDate}
        onEventClick={onEventClick}
      />
    </div>
  );
}
