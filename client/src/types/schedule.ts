export interface Appointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'clinician_canceled' | 'client_canceled';
  clientName: string;
  duration: number;
}

export interface DailyScheduleData {
  date: string;
  appointments: Appointment[];
  totalAppointments: number;
  scheduledHours: number;
  availableHours: number;
  freeTimePercentage: number;
}