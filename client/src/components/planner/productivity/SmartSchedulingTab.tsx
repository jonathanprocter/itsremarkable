import React from 'react';
import { SmartSchedulingPanel } from '@/components/smartCalendar/SmartSchedulingPanel';
import { CalendarEvent } from '@/types/calendar';

export interface SmartSchedulingTabProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onCreateEvent: (event: Partial<CalendarEvent>) => void;
}

/**
 * Smart Scheduling Tab Component
 *
 * Provides smart appointment scheduling interface
 * Handles appointment creation with intelligent time slot suggestions
 */
export function SmartSchedulingTab({
  selectedDate,
  events,
  onCreateEvent,
}: SmartSchedulingTabProps) {
  const handleScheduleAppointment = (appointmentData: any) => {
    // Default to 9 AM if no specific time
    const startTime = new Date(selectedDate);
    startTime.setHours(9, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(
      endTime.getMinutes() + (appointmentData.duration || 60)
    );

    const newEvent: Partial<CalendarEvent> = {
      title: appointmentData.name || 'New Appointment',
      startTime,
      endTime,
      source: 'manual' as const,
      description: appointmentData.description || '',
      location: appointmentData.location || '',
    };

    onCreateEvent(newEvent);
  };

  return (
    <SmartSchedulingPanel
      currentDate={selectedDate}
      events={events}
      onScheduleAppointment={handleScheduleAppointment}
    />
  );
}
