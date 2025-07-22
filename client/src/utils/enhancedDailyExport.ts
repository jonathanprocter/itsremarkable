
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Enhanced configuration for professional daily planner
const ENHANCED_CONFIG = {
  pageWidth: 612,   // 8.5 inches
  pageHeight: 792,  // 11 inches
  margin: 50,       // Increased margin for professional look
  timeColumnWidth: 120, // Wider for better time display
  eventColumnWidth: 442, // Adjusted for new time column width
  timeSlotHeight: 20,   // Increased for better readability
  headerHeight: 100,    // Proper header space
  
  colors: {
    black: [0, 0, 0],
    gray: [128, 128, 128],
    lightGray: [245, 245, 245],
    white: [255, 255, 255],
    simplePracticeBlue: [65, 105, 225],
    googleGreen: [34, 139, 34],
    holidayOrange: [255, 140, 0]
  },
  
  fonts: {
    title: 18,        // Larger title
    subtitle: 14,     // Readable subtitle
    timeLabel: 11,    // Clear time labels
    eventTitle: 12,   // Readable event titles
    eventDetails: 10  // Clear detail text
  }
};

// Complete time slots from 6:00 AM to 11:30 PM
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
}

function cleanEventTitle(title: string): string {
  return title
    .replace(/[^\w\s\-\.\,\:\(\)]/g, '')
    .replace(/\s+/g, ' ')
    .replace(' Appointment', '')
    .trim();
}

function getEventType(event: CalendarEvent) {
  const isSimplePractice = event.source === 'simplepractice' || 
                          event.title?.toLowerCase().includes('appointment') ||
                          event.calendarId === '0np7sib5u30o7oc297j5pb259g';
  const isHoliday = event.title?.toLowerCase().includes('holiday') ||
                   event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';
  const isGoogle = event.source === 'google' && !isSimplePractice && !isHoliday;
  
  return { isSimplePractice, isGoogle, isHoliday };
}

function drawEnhancedHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, pageWidth } = ENHANCED_CONFIG;
  
  // Title
  pdf.setFontSize(ENHANCED_CONFIG.fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...ENHANCED_CONFIG.colors.black);
  pdf.text('DAILY PLANNER', pageWidth / 2, margin + 25, { align: 'center' });
  
  // Date
  pdf.setFontSize(ENHANCED_CONFIG.fonts.subtitle);
  pdf.setFont('helvetica', 'normal');
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, pageWidth / 2, margin + 45, { align: 'center' });
  
  // Statistics
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  pdf.setFontSize(11);
  pdf.text(`${totalEvents} appointments • ${totalHours.toFixed(1)}h scheduled`, pageWidth / 2, margin + 65, { align: 'center' });
  
  // Legend
  const legendY = margin + 85;
  let legendX = margin + 40;
  
  // SimplePractice legend
  pdf.setFillColor(...ENHANCED_CONFIG.colors.white);
  pdf.rect(legendX, legendY - 6, 12, 8, 'F');
  pdf.setDrawColor(...ENHANCED_CONFIG.colors.simplePracticeBlue);
  pdf.setLineWidth(3);
  pdf.line(legendX, legendY - 6, legendX, legendY + 2);
  pdf.setLineWidth(1);
  pdf.setDrawColor(...ENHANCED_CONFIG.colors.gray);
  pdf.rect(legendX, legendY - 6, 12, 8);
  pdf.setFontSize(9);
  pdf.setTextColor(...ENHANCED_CONFIG.colors.black);
  pdf.text('SimplePractice', legendX + 18, legendY);
  
  // Google Calendar legend
  legendX += 110;
  pdf.setFillColor(...ENHANCED_CONFIG.colors.white);
  pdf.rect(legendX, legendY - 6, 12, 8, 'F');
  pdf.setDrawColor(...ENHANCED_CONFIG.colors.googleGreen);
  pdf.setLineWidth(2);
  pdf.setLineDash([3, 2]);
  pdf.rect(legendX, legendY - 6, 12, 8);
  pdf.setLineDash([]);
  pdf.text('Google Calendar', legendX + 18, legendY);
  
  // Holidays legend
  legendX += 110;
  pdf.setFillColor(...ENHANCED_CONFIG.colors.holidayOrange);
  pdf.rect(legendX, legendY - 6, 12, 8, 'F');
  pdf.setDrawColor(...ENHANCED_CONFIG.colors.black);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY - 6, 12, 8);
  pdf.text('Holidays', legendX + 18, legendY);
}

function drawEnhancedTimeGrid(pdf: jsPDF) {
  const { margin, timeColumnWidth, eventColumnWidth, timeSlotHeight } = ENHANCED_CONFIG;
  const gridStartY = margin + ENHANCED_CONFIG.headerHeight;
  
  // Column headers
  pdf.setFillColor(...ENHANCED_CONFIG.colors.lightGray);
  pdf.rect(margin, gridStartY, timeColumnWidth, 25, 'F');
  pdf.rect(margin + timeColumnWidth, gridStartY, eventColumnWidth, 25, 'F');
  
  pdf.setFontSize(ENHANCED_CONFIG.fonts.subtitle);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...ENHANCED_CONFIG.colors.black);
  pdf.text('TIME', margin + timeColumnWidth / 2, gridStartY + 16, { align: 'center' });
  pdf.text('APPOINTMENTS', margin + timeColumnWidth + eventColumnWidth / 2, gridStartY + 16, { align: 'center' });
  
  // Time slots
  TIME_SLOTS.forEach((timeSlot, index) => {
    const y = gridStartY + 25 + (index * timeSlotHeight);
    const isHour = timeSlot.endsWith(':00');
    
    // Time column background
    pdf.setFillColor(...(isHour ? ENHANCED_CONFIG.colors.lightGray : ENHANCED_CONFIG.colors.white));
    pdf.rect(margin, y, timeColumnWidth, timeSlotHeight, 'F');
    
    // Time label
    pdf.setFontSize(ENHANCED_CONFIG.fonts.timeLabel);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...ENHANCED_CONFIG.colors.black);
    pdf.text(timeSlot, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 3, { align: 'center' });
    
    // Event column background
    pdf.setFillColor(...ENHANCED_CONFIG.colors.white);
    pdf.rect(margin + timeColumnWidth, y, eventColumnWidth, timeSlotHeight, 'F');
    
    // Grid lines
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(...ENHANCED_CONFIG.colors.gray);
    pdf.line(margin, y, margin + timeColumnWidth + eventColumnWidth, y);
  });
  
  // Final bottom line
  const finalY = gridStartY + 25 + (TIME_SLOTS.length * timeSlotHeight);
  pdf.line(margin, finalY, margin + timeColumnWidth + eventColumnWidth, finalY);
  
  // Vertical separator
  pdf.setLineWidth(1);
  pdf.setDrawColor(...ENHANCED_CONFIG.colors.black);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, finalY);
  
  // Outer border
  pdf.rect(margin, gridStartY, timeColumnWidth + eventColumnWidth, 25 + (TIME_SLOTS.length * timeSlotHeight));
}

function drawEnhancedEvents(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, eventColumnWidth, timeSlotHeight } = ENHANCED_CONFIG;
  const gridStartY = margin + ENHANCED_CONFIG.headerHeight + 25;
  
  // Filter and sort events
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  console.log(`Drawing ${dayEvents.length} events for ${selectedDate.toDateString()}`);
  
  dayEvents.forEach((event) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Calculate position
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const totalMinutesFrom6AM = (startHour - 6) * 60 + startMinute;
    
    // Skip events outside range
    if (totalMinutesFrom6AM < 0 || totalMinutesFrom6AM > (17.5 * 60)) {
      return;
    }
    
    // Calculate Y position
    const slotIndex = totalMinutesFrom6AM / 30;
    const eventY = gridStartY + (slotIndex * timeSlotHeight) + 2;
    
    // Calculate height
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    const eventHeight = Math.max(16, (durationMinutes / 30) * timeSlotHeight - 2);
    
    const eventX = margin + timeColumnWidth + 3;
    const eventWidth = eventColumnWidth - 6;
    
    // Get event type
    const { isSimplePractice, isGoogle, isHoliday } = getEventType(event);
    
    // Draw event background
    pdf.setFillColor(...ENHANCED_CONFIG.colors.white);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
    
    // Draw event border
    if (isSimplePractice) {
      pdf.setDrawColor(...ENHANCED_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(3);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);
      pdf.setLineWidth(1);
      pdf.setDrawColor(...ENHANCED_CONFIG.colors.gray);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    } else if (isGoogle) {
      pdf.setDrawColor(...ENHANCED_CONFIG.colors.googleGreen);
      pdf.setLineWidth(2);
      pdf.setLineDash([3, 2]);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
      pdf.setLineDash([]);
    } else if (isHoliday) {
      pdf.setFillColor(...ENHANCED_CONFIG.colors.holidayOrange);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(...ENHANCED_CONFIG.colors.black);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    }
    
    // Event text
    if (eventHeight >= 12) {
      const textPadding = 4;
      let currentY = eventY + 10;
      
      // Event title
      const title = cleanEventTitle(event.title || 'Untitled Event');
      pdf.setFontSize(ENHANCED_CONFIG.fonts.eventTitle);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...ENHANCED_CONFIG.colors.black);
      
      const maxWidth = eventWidth - (textPadding * 2);
      const titleLines = pdf.splitTextToSize(title, maxWidth);
      
      if (Array.isArray(titleLines)) {
        titleLines.slice(0, 1).forEach((line) => {
          if (currentY < eventY + eventHeight - 8) {
            pdf.text(line, eventX + textPadding, currentY);
            currentY += 10;
          }
        });
      } else {
        pdf.text(titleLines, eventX + textPadding, currentY);
        currentY += 10;
      }
      
      // Event time
      if (currentY < eventY + eventHeight - 3) {
        pdf.setFontSize(ENHANCED_CONFIG.fonts.eventDetails);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...ENHANCED_CONFIG.colors.gray);
        
        const timeRange = `${formatTime(eventStart)} - ${formatTime(eventEnd)}`;
        pdf.text(timeRange, eventX + textPadding, currentY);
      }
    }
  });
}

export const exportEnhancedDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('=== ENHANCED DAILY PDF EXPORT ===');
    console.log('Date:', selectedDate.toDateString());
    console.log('Total events:', events.length);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [ENHANCED_CONFIG.pageWidth, ENHANCED_CONFIG.pageHeight]
    });
    
    // Draw all sections
    drawEnhancedHeader(pdf, selectedDate, events);
    drawEnhancedTimeGrid(pdf);
    drawEnhancedEvents(pdf, selectedDate, events);
    
    // Save PDF
    const fileName = `enhanced-daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
    
    console.log(`Enhanced PDF saved as: ${fileName}`);
    console.log('=== ENHANCED DAILY PDF EXPORT COMPLETE ===');
    
  } catch (error) {
    console.error('Enhanced daily PDF export failed:', error);
    throw error;
  }
};
