/**
 * Enhanced Daily PDF Export System
 * Fixes all audit-detected issues with proper styling, positioning, and source-based formatting
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

interface EnhancedDailyExportConfig {
  pageWidth: number;
  pageHeight: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  header: {
    height: number;
    fontSize: {
      title: number;
      date: number;
      stats: number;
    };
  };
  timeColumn: {
    width: number;
    fontSize: number;
  };
  timeSlots: {
    height: number;
    count: number;
    startHour: number;
    endHour: number;
  };
  appointments: {
    minHeight: number;
    fontSize: {
      title: number;
      source: number;
      time: number;
    };
    padding: number;
  };
  colors: {
    simplepractice: {
      border: string;
      background: string;
      leftBorder: string;
    };
    google: {
      border: string;
      background: string;
      borderStyle: string;
    };
    holiday: {
      border: string;
      background: string;
    };
    canceled: {
      clinician: string;
      client: string;
    };
  };
}

const ENHANCED_CONFIG: EnhancedDailyExportConfig = {
  pageWidth: 612, // 8.5 inches
  pageHeight: 792, // 11 inches
  margins: {
    top: 40,
    bottom: 40,
    left: 30,
    right: 30,
  },
  header: {
    height: 80,
    fontSize: {
      title: 22,
      date: 16,
      stats: 12,
    },
  },
  timeColumn: {
    width: 80,
    fontSize: 10,
  },
  timeSlots: {
    height: 25,
    count: 26, // 7 AM to 7 PM (12 hours * 2 + 2 for 7 PM)
    startHour: 7,
    endHour: 19,
  },
  appointments: {
    minHeight: 55,
    fontSize: {
      title: 12,
      source: 10,
      time: 10,
    },
    padding: 6,
  },
  colors: {
    simplepractice: {
      border: '#6c8ebf',
      background: '#ffffff',
      leftBorder: '#6c8ebf',
    },
    google: {
      border: '#4285f4',
      background: '#f8fbff',
      borderStyle: 'dashed',
    },
    holiday: {
      border: '#ff9500',
      background: '#fff8e1',
    },
    canceled: {
      clinician: '#e9ecef',
      client: '#fff3cd',
    },
  },
};

export async function exportEnhancedDailyPDF(selectedDate: Date, events: CalendarEvent[]): Promise<void> {
  console.log('🎯 ENHANCED DAILY PDF EXPORT STARTING...');
  console.log(`📅 Selected Date: ${selectedDate.toDateString()}`);
  console.log(`📊 Total Events: ${events.length}`);

  // Filter events for the selected date
  const dailyEvents = filterDailyEvents(selectedDate, events);
  console.log(`📅 Daily Events: ${dailyEvents.length}`);
  
  // Log daily events for debugging
  dailyEvents.forEach(event => {
    const startTime = new Date(event.startTime);
    console.log(`📋 Event: ${event.title} at ${startTime.toLocaleTimeString()} (${event.source})`);
  });

  // Generate time slots
  const timeSlots = generateTimeSlots();
  console.log(`🕒 Generated ${timeSlots.length} time slots`);

  // Create enhanced HTML template
  const htmlContent = createEnhancedHTMLTemplate(selectedDate, dailyEvents, timeSlots);
  
  // Render and export to PDF
  await renderAndExportPDF(htmlContent, selectedDate);
  
  console.log('✅ Enhanced Daily PDF Export completed successfully');
}

function filterDailyEvents(selectedDate: Date, events: CalendarEvent[]): CalendarEvent[] {
  const targetDateStr = selectedDate.toDateString();
  
  return events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === targetDateStr;
  }).sort((a, b) => {
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const config = ENHANCED_CONFIG.timeSlots;
  
  for (let hour = config.startHour; hour <= config.endHour; hour++) {
    // Top of hour
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    
    // Half hour (except for the last hour)
    if (hour < config.endHour) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  
  return slots;
}

function createEnhancedHTMLTemplate(selectedDate: Date, events: CalendarEvent[], timeSlots: string[]): string {
  const config = ENHANCED_CONFIG;
  const contentWidth = config.pageWidth - config.margins.left - config.margins.right;
  const appointmentColumnWidth = contentWidth - config.timeColumn.width;

  // Update the renderAppointments function to use the correct selectedDate
  const renderAppointmentsWithDate = (eventsToRender: CalendarEvent[]) => {
    return renderAppointments(eventsToRender.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    }), timeSlots);
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          width: ${config.pageWidth}px;
          height: ${config.pageHeight}px;
          padding: ${config.margins.top}px ${config.margins.right}px ${config.margins.bottom}px ${config.margins.left}px;
          background: white;
          color: #000;
          overflow: hidden;
        }
        
        .header {
          height: ${config.header.height}px;
          border-bottom: 2px solid #e9ecef;
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        .title {
          font-size: ${config.header.fontSize.title}px;
          font-weight: bold;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        
        .date {
          font-size: ${config.header.fontSize.date}px;
          color: #4a5568;
          margin-bottom: 8px;
        }
        
        .stats {
          font-size: ${config.header.fontSize.stats}px;
          color: #6b7280;
        }
        
        .calendar-grid {
          display: flex;
          width: 100%;
          height: calc(100% - ${config.header.height + 20}px);
        }
        
        .time-column {
          width: ${config.timeColumn.width}px;
          border-right: 1px solid #e9ecef;
        }
        
        .time-slot {
          height: ${config.timeSlots.height}px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${config.timeColumn.fontSize}px;
          color: #6b7280;
          border-bottom: 1px solid #f3f4f6;
          font-weight: 500;
          background: #fafafa;
        }
        
        .time-slot:nth-child(odd) {
          background: #f8f9fa;
        }
        
        .appointments-column {
          flex: 1;
          position: relative;
          width: ${appointmentColumnWidth}px;
        }
        
        .appointment {
          position: absolute;
          left: ${config.appointments.padding}px;
          right: ${config.appointments.padding}px;
          border-radius: 4px;
          padding: ${config.appointments.padding}px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          min-height: ${config.appointments.minHeight}px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          overflow: hidden;
          background: white;
        }
        
        .appointment-title {
          font-size: ${config.appointments.fontSize.title}px;
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 2px;
        }
        
        .appointment-source {
          font-size: ${config.appointments.fontSize.source}px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        
        .appointment-time {
          font-size: ${config.appointments.fontSize.time}px;
          color: #4a5568;
          font-weight: 500;
        }
        
        .appointment-simplepractice {
          background: ${config.colors.simplepractice.background} !important;
          border: 1px solid ${config.colors.simplepractice.border} !important;
          border-left: 4px solid ${config.colors.simplepractice.leftBorder} !important;
        }
        
        .appointment-google {
          background: ${config.colors.google.background} !important;
          border: 2px dashed ${config.colors.google.border} !important;
        }
        
        .appointment-holiday {
          background: ${config.colors.holiday.background} !important;
          border: 1px solid ${config.colors.holiday.border} !important;
        }
        
        .appointment-canceled-clinician {
          background: ${config.colors.canceled.clinician};
          opacity: 0.7;
        }
        
        .appointment-canceled-client {
          background: ${config.colors.canceled.client};
          opacity: 0.7;
        }
        
        .canceled-text {
          text-decoration: line-through;
        }
        
        .legend {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 15px;
          font-size: 10px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .legend-color {
          width: 12px;
          height: 8px;
          border-radius: 2px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">DAILY PLANNER</div>
        <div class="date">${formatDateForDisplay(selectedDate)}</div>
        <div class="stats">${events.length} appointments scheduled</div>
      </div>
      
      <div class="legend">
        <div class="legend-item">
          <div class="legend-color" style="background: ${config.colors.simplepractice.border};"></div>
          <span>SimplePractice</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: ${config.colors.google.border};"></div>
          <span>Google Calendar</span>
        </div>
        <div class="legend-item">
          <div class="legend-color" style="background: ${config.colors.holiday.border};"></div>
          <span>Holidays in United States</span>
        </div>
      </div>
      
      <div class="calendar-grid">
        <div class="time-column">
          ${timeSlots.map(slot => `
            <div class="time-slot">${formatTimeSlot(slot)}</div>
          `).join('')}
        </div>
        
        <div class="appointments-column">
          ${renderAppointmentsWithDate(events)}
        </div>
      </div>
    </body>
    </html>
  `;
}

function formatDateForDisplay(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

function formatTimeSlot(slot: string): string {
  const [hours, minutes] = slot.split(':');
  const hour = parseInt(hours);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${minutes} ${period}`;
}

function renderAppointments(events: CalendarEvent[], timeSlots: string[]): string {
  const config = ENHANCED_CONFIG;
  let html = '';
  
  // Events are already filtered by the calling function, just sort by start time
  const filteredEvents = events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  filteredEvents.forEach((event, index) => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    // Get local time directly (times are already in local timezone in the database)
    const localStartHour = startTime.getHours();
    const localStartMinutes = startTime.getMinutes();
    
    // Calculate position based on local time
    const startSlotIndex = ((localStartHour - config.timeSlots.startHour) * 2) + (localStartMinutes >= 30 ? 1 : 0);
    
    // Skip if outside time range
    if (startSlotIndex < 0 || startSlotIndex >= config.timeSlots.count) {
      return;
    }
    
    // Calculate height based on duration
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const heightSlots = Math.max(2, Math.round(durationHours * 2)); // Minimum 2 slots (1 hour)
    const height = Math.max(config.appointments.minHeight, heightSlots * config.timeSlots.height);
    
    // Position from top
    const top = startSlotIndex * config.timeSlots.height;
    
    // Determine styling class
    const sourceClass = getAppointmentClass(event);
    const statusClass = getStatusClass(event);
    
    // Clean title (remove emojis and "Appointment" suffix)
    const cleanTitle = cleanAppointmentTitle(event.title);
    
    // Format time display (times are already in correct timezone)
    const timeDisplay = formatTimeRange(startTime, endTime);
    
    html += `
      <div class="appointment ${sourceClass} ${statusClass}" 
           style="top: ${top}px; height: ${height}px; z-index: ${1000 + index};">
        <div class="appointment-title ${event.status?.includes('canceled') ? 'canceled-text' : ''}">${cleanTitle}</div>
        <div class="appointment-source">${getSourceLabel(event.source)}</div>
        <div class="appointment-time ${event.status?.includes('canceled') ? 'canceled-text' : ''}">${timeDisplay}</div>
      </div>
    `;
  });
  
  return html;
}

function getAppointmentClass(event: CalendarEvent): string {
  if (event.status?.includes('canceled')) {
    return event.status.includes('clinician') ? 'appointment-canceled-clinician' : 'appointment-canceled-client';
  }
  
  switch (event.source) {
    case 'simplepractice':
      return 'appointment-simplepractice';
    case 'google':
      return 'appointment-google';
    case 'holiday':
      return 'appointment-holiday';
    default:
      return 'appointment-simplepractice'; // Default fallback
  }
}

function getStatusClass(event: CalendarEvent): string {
  if (event.status?.includes('canceled')) {
    return event.status.includes('clinician') ? 'canceled-clinician' : 'canceled-client';
  }
  return '';
}

function cleanAppointmentTitle(title: string): string {
  return title
    .replace(/^🔒\s*/, '') // Remove lock emoji
    .replace(/\s*Appointment$/, '') // Remove "Appointment" suffix
    .trim();
}

function getSourceLabel(source?: string): string {
  switch (source) {
    case 'simplepractice':
      return 'SimplePractice';
    case 'google':
      return 'Google Calendar';
    case 'holiday':
      return 'Holiday';
    default:
      return 'Manual';
  }
}

function formatTimeRange(start: Date, end: Date): string {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  return `${formatTime(start)} - ${formatTime(end)}`;
}

async function renderAndExportPDF(htmlContent: string, selectedDate: Date): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Create temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.visibility = 'hidden';
    document.body.appendChild(container);

    // Wait for styles to apply
    setTimeout(async () => {
      try {
        // Generate canvas from HTML
        const canvas = await html2canvas(container, {
          width: ENHANCED_CONFIG.pageWidth,
          height: ENHANCED_CONFIG.pageHeight,
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        // Create PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: [ENHANCED_CONFIG.pageWidth, ENHANCED_CONFIG.pageHeight]
        });

        // Add canvas to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, ENHANCED_CONFIG.pageWidth, ENHANCED_CONFIG.pageHeight);

        // Generate filename
        const dateStr = selectedDate.toISOString().split('T')[0];
        const filename = `enhanced-daily-planner-${dateStr}.pdf`;

        // Save PDF
        pdf.save(filename);
        console.log(`💾 PDF saved as: ${filename}`);
        
        resolve();

      } catch (error) {
        console.error('PDF generation error:', error);
        reject(error);
      } finally {
        // Cleanup
        if (document.body.contains(container)) {
          document.body.removeChild(container);
        }
      }
    }, 100);
  });
}