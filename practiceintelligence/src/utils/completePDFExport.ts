// Add this to your utils folder as completePDFExport.ts

import { CalendarEvent } from '../types/calendar';

interface ExportData {
  date: string;
  appointments: {
    time: string;
    title: string;
    source: string;
    duration: string;
    notes?: string;
    actionItems?: string;
  }[];
  totalAppointments: number;
  dailyNotes?: string;
}

export const generateCompleteExportData = (
  selectedDate: Date,
  events: CalendarEvent[],
  dailyNotes: string = ''
): ExportData => {
  console.log('Generating complete export data...');
  console.log('Selected date:', selectedDate);
  console.log('Total events passed:', events.length);
  
  // Filter events for the selected day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const selectedDateStr = selectedDate.toDateString();
    const eventDateStr = eventDate.toDateString();
    const matches = eventDateStr === selectedDateStr;
    
    if (matches) {
      console.log(`Event matches date: ${event.title} at ${event.startTime}`);
    }
    
    return matches;
  });

  console.log(`Found ${dayEvents.length} events for ${selectedDate.toDateString()}`);

  // Sort events by start time
  dayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Format appointments
  const appointments = dayEvents.map(event => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    const timeString = `${formatTime(startTime)}-${formatTime(endTime)}`;
    const duration = calculateDuration(startTime, endTime);
    
    return {
      time: timeString,
      title: event.title,
      source: getSourceName(event.source),
      duration: duration,
      notes: event.notes || '',
      actionItems: event.actionItems || ''
    };
  });

  return {
    date: selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    appointments,
    totalAppointments: appointments.length,
    dailyNotes
  };
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const calculateDuration = (start: Date, end: Date): string => {
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.round(diffMs / (1000 * 60));
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;
  
  if (hours === 0) {
    return `${minutes}min`;
  } else if (minutes === 0) {
    return `${hours}hr`;
  } else {
    return `${hours}hr ${minutes}min`;
  }
};

const getSourceName = (source: string): string => {
  switch (source) {
    case 'google':
      return 'Google Calendar';
    case 'simplepractice':
      return 'SimplePractice';
    case 'manual':
      return 'Manual Entry';
    default:
      return source;
  }
};

export const exportToText = (data: ExportData): string => {
  let output = '';
  
  output += `DAILY PLANNER\n`;
  output += `${data.date}\n`;
  output += `${'='.repeat(50)}\n\n`;
  
  output += `Total Appointments: ${data.totalAppointments}\n\n`;
  
  if (data.appointments.length === 0) {
    output += `No appointments scheduled for this day.\n\n`;
  } else {
    output += `APPOINTMENTS:\n`;
    output += `${'-'.repeat(50)}\n`;
    
    data.appointments.forEach((apt, index) => {
      output += `${index + 1}. ${apt.time}\n`;
      output += `   ${apt.title}\n`;
      output += `   Source: ${apt.source} | Duration: ${apt.duration}\n`;
      
      if (apt.notes && apt.notes.trim()) {
        output += `   Notes: ${apt.notes}\n`;
      }
      
      if (apt.actionItems && apt.actionItems.trim()) {
        output += `   Action Items: ${apt.actionItems}\n`;
      }
      
      output += `\n`;
    });
  }
  
  if (data.dailyNotes && data.dailyNotes.trim()) {
    output += `DAILY NOTES:\n`;
    output += `${'-'.repeat(50)}\n`;
    output += `${data.dailyNotes}\n\n`;
  }
  
  return output;
};

export const exportToJSON = (data: ExportData): string => {
  return JSON.stringify(data, null, 2);
};

export const exportToCSV = (data: ExportData): string => {
  let csv = 'Time,Title,Source,Duration,Notes,Action Items\n';
  
  data.appointments.forEach(apt => {
    const escapeCsv = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    csv += `${escapeCsv(apt.time)},${escapeCsv(apt.title)},${escapeCsv(apt.source)},${escapeCsv(apt.duration)},${escapeCsv(apt.notes || '')},${escapeCsv(apt.actionItems || '')}\n`;
  });
  
  return csv;
};

// Test function to verify data
export const testExportData = (events: CalendarEvent[], selectedDate: Date): void => {
  try {
    console.log('=== EXPORT DATA TEST ===');
    console.log('Input events:', events.length);
    console.log('Selected date:', selectedDate);
    
    const data = generateCompleteExportData(selectedDate, events);
    console.log('Generated data:', data);
    
    const textOutput = exportToText(data);
    console.log('Text output length:', textOutput.length);
    console.log('Text output preview:', textOutput.substring(0, 500));
    
    // Download the text file for testing
    const blob = new Blob([textOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-planner-test-${selectedDate.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('❌ Export data test failed:', error);
    alert('Sorry, something went wrong while testing the export data. Please try again or contact support if this issue persists.\n\nError details: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};