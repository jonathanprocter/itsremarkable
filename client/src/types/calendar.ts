export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  source: 'manual' | 'google' | 'simplepractice';
  sourceId?: string;
  color: string;
  notes?: string;
  actionItems?: string;
  calendarId?: string; // For Google Calendar filtering
  // Location field for appointment location
  location?: 'woodbury' | 'rvc' | 'telehealth' | null;
  // Appointment status fields - matching database schema
  status?: 'scheduled' | 'confirmed' | 'cancelled' | 'no_show' | 'clinician_canceled' | 'completed';
  statusUpdatedAt?: Date | null;
  statusReason?: string | null;
}

export interface DailyNote {
  id: string;
  date: string; // YYYY-MM-DD format
  content: string;
}

export interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
}

export interface CalendarDay {
  date: Date;
  dayOfWeek: string;
  dayNumber: number;
  events: CalendarEvent[];
}

export interface CalendarWeek {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: CalendarDay[];
}

export type ViewMode = 'weekly' | 'daily';

export interface CalendarState {
  currentDate: Date;
  selectedDate: Date;
  viewMode: ViewMode;
  currentWeek: CalendarWeek;
  events: CalendarEvent[];
  dailyNotes: { [date: string]: string };
  isGoogleConnected: boolean;
  isOnline: boolean;
}
