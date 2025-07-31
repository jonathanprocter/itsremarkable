/**
 * Time slot generation utility for consistent time grid creation
 */

export interface TimeSlot {
  hour: number;
  minute: number;
  time: string;
}

export function generateTimeSlots(): TimeSlot[] {
  const timeSlots: TimeSlot[] = [];
  
  // Generate time slots from 06:00 to 23:30 in 30-minute increments
  for (let hour = 6; hour <= 23; hour++) {
    // Add the top of the hour (e.g., 06:00, 07:00, etc.)
    timeSlots.push({
      hour,
      minute: 0,
      time: `${hour.toString().padStart(2, '0')}:00`
    });
    
    // Add the half hour (e.g., 06:30, 07:30, etc.)
    if (hour < 23) { // Don't add 23:30 as the last slot
      timeSlots.push({
        hour,
        minute: 30,
        time: `${hour.toString().padStart(2, '0')}:30`
      });
    }
  }
  
  // Add the final 23:30 slot
  timeSlots.push({
    hour: 23,
    minute: 30,
    time: '23:30'
  });
  
  return timeSlots;
}

export function getTimeSlotIndex(time: string): number {
  const timeSlots = generateTimeSlots();
  return timeSlots.findIndex(slot => slot.time === time);
}

export function calculateSlotPosition(startTime: Date, endTime: Date): { startSlot: number; endSlot: number } {
  const startHour = startTime.getHours();
  const startMinute = startTime.getMinutes();
  const endHour = endTime.getHours();
  const endMinute = endTime.getMinutes();
  
  // Calculate slot positions (each hour has 2 slots: :00 and :30)
  const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
  const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
  
  return { startSlot, endSlot };
}

export function formatTimeRange(startTime: Date, endTime: Date): string {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

export function getEventDurationInSlots(event: { startTime: Date; endTime: Date }): number {
  const startHour = event.startTime.getHours();
  const startMinute = event.startTime.getMinutes();
  const endHour = event.endTime.getHours();
  const endMinute = event.endTime.getMinutes();
  
  // Calculate total duration in 30-minute slots
  const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
  const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
  
  return Math.max(1, endSlot - startSlot);
}

export function isEventInTimeSlot(event: { startTime: Date; endTime: Date }, timeSlot: { hour: number; minute: number }): boolean {
  const eventStartHour = event.startTime.getHours();
  const eventStartMinute = event.startTime.getMinutes();
  const eventEndHour = event.endTime.getHours();
  const eventEndMinute = event.endTime.getMinutes();
  
  // Convert event times to minutes since midnight
  const eventStartMinutes = eventStartHour * 60 + eventStartMinute;
  const eventEndMinutes = eventEndHour * 60 + eventEndMinute;
  
  // Convert time slot to minutes since midnight
  const slotMinutes = timeSlot.hour * 60 + timeSlot.minute;
  
  // Check if the time slot falls within the event duration
  return slotMinutes >= eventStartMinutes && slotMinutes < eventEndMinutes;
}