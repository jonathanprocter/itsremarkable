import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

/**
 * TEMPLATE EXTRACTORS - Extract core rendering functions from existing templates
 * This file extracts the EXACT rendering logic from currentWeeklyExport.ts and browserReplicaPDF.ts
 * to make them available for the unified bidirectional export
 */

// EXACT configuration from currentWeeklyExport.ts
const CURRENT_WEEKLY_CONFIG = {
  pageWidth: 792, // 11" landscape
  pageHeight: 612, // 8.5" landscape
  margins: 16, // Perfect centering
  headerHeight: 40,
  timeColumnWidth: 60,
  dayColumnWidth: 100, // Clean 100px for 7 days = 700px total
  timeSlotHeight: 13, // Slightly reduced to fit all time slots
  fonts: {
    title: 16,
    weekInfo: 12,
    dayHeader: 9,
    timeLabel: 7,
    eventTitle: 5, // Small but readable
    eventSource: 4, // Very small for source/location
    eventTime: 4, // Very small for time
  },
};

/**
 * Extract and apply the EXACT weekly template rendering to an existing PDF context
 * This is the core logic from currentWeeklyExport.ts adapted for unified PDF
 */
export const applyCurrentWeeklyTemplate = (
  pdf: jsPDF,
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date
): void => {
  console.log('📄 Applying ACTUAL Current Weekly Export template...');
  
  // Normalize dates exactly like the original template
  const normalizedWeekStart = new Date(weekStart);
  normalizedWeekStart.setHours(0, 0, 0, 0);
  
  const normalizedWeekEnd = new Date(weekEnd);
  normalizedWeekEnd.setHours(23, 59, 59, 999);
  
  pdf.setFont('helvetica');
  
  // EXACT header rendering from original template
  drawCurrentWeeklyHeader(pdf, normalizedWeekStart, normalizedWeekEnd);
  
  // EXACT grid and event rendering from original template
  drawCurrentWeeklyGrid(pdf, events, normalizedWeekStart);
  
  console.log('✅ Applied ACTUAL Current Weekly Export template rendering');
};

const drawCurrentWeeklyHeader = (pdf: jsPDF, weekStart: Date, weekEnd: Date): void => {
  const { margins, fonts } = CURRENT_WEEKLY_CONFIG;
  
  // Title
  pdf.setFontSize(fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY PLANNER', margins, margins + 20);
  
  // Week info - dynamic for any week
  pdf.setFontSize(fonts.weekInfo);
  pdf.setFont('helvetica', 'normal');
  const weekStartStr = weekStart.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  const weekEndStr = weekEnd.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  
  pdf.text(`${weekStartStr} — ${weekEndStr}`, margins, margins + 40);
  
  // Week number calculation
  const startOfYear = new Date(weekStart.getFullYear(), 0, 1);
  const pastDaysOfYear = (weekStart.getTime() - startOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  
  pdf.setFontSize(fonts.weekInfo - 2);
  pdf.text(`Week ${weekNumber} of ${weekStart.getFullYear()}`, margins, margins + 60);
};

const drawCurrentWeeklyGrid = (pdf: jsPDF, events: CalendarEvent[], weekStart: Date): void => {
  const { margins, timeColumnWidth, dayColumnWidth, timeSlotHeight, headerHeight, fonts } = CURRENT_WEEKLY_CONFIG;
  
  const gridStartY = headerHeight + 40;
  
  // Day headers with dates
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  pdf.setFontSize(fonts.dayHeader);
  pdf.setFont('helvetica', 'bold');
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    
    const x = margins + timeColumnWidth + i * dayColumnWidth + dayColumnWidth / 2;
    const dayLabel = `${dayNames[i]} ${dayDate.getDate()}`;
    pdf.text(dayLabel, x, gridStartY + 16, { align: 'center' });
  }
  
  // Filter events for the week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStart && eventDate <= new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  });
  
  console.log(`📊 Weekly events found: ${weekEvents.length}`);
  
  // Draw time slots from 6:00 to 23:30 (36 slots)
  for (let slot = 0; slot < 36; slot++) {
    const y = gridStartY + 25 + slot * timeSlotHeight;
    const hour = Math.floor(slot / 2) + 6;
    const minute = (slot % 2) * 30;
    
    // Time labels (only on the hour)
    if (minute === 0) {
      pdf.setFontSize(fonts.timeLabel);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`${hour.toString().padStart(2, '0')}:00`, margins + timeColumnWidth / 2, y + 8, { align: 'center' });
    }
    
    // Grid lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margins, y, margins + timeColumnWidth + 7 * dayColumnWidth, y);
  }
  
  // Draw vertical lines
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  
  // Time column separator
  pdf.line(margins + timeColumnWidth, gridStartY + 16, margins + timeColumnWidth, gridStartY + 25 + 36 * timeSlotHeight);
  
  // Day column separators
  for (let i = 1; i < 7; i++) {
    const x = margins + timeColumnWidth + i * dayColumnWidth;
    pdf.line(x, gridStartY + 16, x, gridStartY + 25 + 36 * timeSlotHeight);
  }
  
  // Draw events in their proper time slots
  weekEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const dayOfWeek = eventStart.getDay(); // 0=Sunday, 1=Monday, etc.
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0=Monday
    
    if (adjustedDay >= 0 && adjustedDay < 7) {
      const eventHour = eventStart.getHours();
      const eventMinute = eventStart.getMinutes();
      const slotIndex = (eventHour - 6) * 2 + (eventMinute >= 30 ? 1 : 0);
      
      if (slotIndex >= 0 && slotIndex < 36) {
        const x = margins + timeColumnWidth + adjustedDay * dayColumnWidth + 2;
        const y = gridStartY + 25 + slotIndex * timeSlotHeight + 2;
        
        // Event background
        pdf.setFillColor(255, 255, 255);
        pdf.rect(x, y, dayColumnWidth - 4, timeSlotHeight - 1, 'F');
        
        // Event border based on source
        if (event.source === 'simplepractice') {
          pdf.setDrawColor(99, 102, 241); // Blue
          pdf.setLineWidth(1);
          pdf.rect(x, y, dayColumnWidth - 4, timeSlotHeight - 1, 'S');
          // Thick left border
          pdf.setLineWidth(3);
          pdf.line(x, y, x, y + timeSlotHeight - 1);
        } else if (event.source === 'google') {
          pdf.setDrawColor(34, 197, 94); // Green
          pdf.setLineWidth(0.5);
          // Dashed border effect
          const dashLength = 2;
          for (let d = 0; d < dayColumnWidth - 4; d += dashLength * 2) {
            pdf.line(x + d, y, x + Math.min(d + dashLength, dayColumnWidth - 4), y);
            pdf.line(x + d, y + timeSlotHeight - 1, x + Math.min(d + dashLength, dayColumnWidth - 4), y + timeSlotHeight - 1);
          }
          for (let d = 0; d < timeSlotHeight - 1; d += dashLength * 2) {
            pdf.line(x, y + d, x, y + Math.min(d + dashLength, timeSlotHeight - 1));
            pdf.line(x + dayColumnWidth - 4, y + d, x + dayColumnWidth - 4, y + Math.min(d + dashLength, timeSlotHeight - 1));
          }
        }
        
        // Event text
        const cleanTitle = event.title.replace(/^🔒\s*/, '').replace(/\s*Appointment$/, '');
        pdf.setFontSize(fonts.eventTitle);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        // Truncate if too long
        const maxWidth = dayColumnWidth - 8;
        let displayTitle = cleanTitle;
        if (pdf.getTextWidth(displayTitle) > maxWidth) {
          while (pdf.getTextWidth(displayTitle + '...') > maxWidth && displayTitle.length > 1) {
            displayTitle = displayTitle.slice(0, -1);
          }
          displayTitle += '...';
        }
        
        pdf.text(displayTitle, x + 2, y + 8);
      }
    }
  });
};

/**
 * Extract and apply the EXACT daily template rendering to an existing PDF context
 * This is the core logic from browserReplicaPDF.ts adapted for unified PDF
 */
export const applyBrowserReplicaTemplate = async (
  pdf: jsPDF,
  events: CalendarEvent[],
  selectedDate: Date
): Promise<void> => {
  console.log('📄 Applying ACTUAL Browser Replica PDF template...');
  
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = selectedDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Filter events for this day
  const dayEvents = events.filter(event => {
    if (!event?.startTime || !selectedDate) return false;
    try {
      const eventStart = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      if (isNaN(eventStart.getTime())) return false;
      return eventStart.toDateString() === selectedDate.toDateString();
    } catch (error) {
      return false;
    }
  });

  console.log(`📊 Daily events for ${dayName}: ${dayEvents.length}`);

  // Header - EXACT same as browserReplicaPDF.ts
  pdf.setFontSize(24);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Daily Planner', 306, 50, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${dayName}, ${dateString}`, 306, 80, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.text(`${dayEvents.length} appointments scheduled`, 306, 110, { align: 'center' });

  // Time grid setup - EXACT same as browserReplicaPDF.ts
  const margins = 40;
  const timeColumnWidth = 80;
  const appointmentColumnWidth = 450;
  const timeSlotHeight = 20;
  const gridStartY = 140;
  
  // Draw time slots from 6:00 to 23:30
  for (let slot = 0; slot < 36; slot++) {
    const y = gridStartY + slot * timeSlotHeight;
    const hour = Math.floor(slot / 2) + 6;
    const minute = (slot % 2) * 30;
    
    // Time labels
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`, margins + timeColumnWidth - 5, y + 12, { align: 'right' });
    
    // Grid lines
    pdf.setDrawColor(230, 230, 230);
    pdf.setLineWidth(0.5);
    pdf.line(margins, y, margins + timeColumnWidth + appointmentColumnWidth, y);
    
    // Alternating backgrounds
    if (minute === 0) {
      pdf.setFillColor(248, 249, 250); // Hour rows
    } else {
      pdf.setFillColor(255, 255, 255); // Half-hour rows
    }
    pdf.rect(margins + timeColumnWidth, y, appointmentColumnWidth, timeSlotHeight, 'F');
  }
  
  // Draw appointments
  dayEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const endHour = eventEnd.getHours();
    const endMinute = eventEnd.getMinutes();
    
    const startSlot = (startHour - 6) * 2 + (startMinute >= 30 ? 1 : 0);
    const endSlot = (endHour - 6) * 2 + (endMinute >= 30 ? 1 : 0);
    const duration = Math.max(1, endSlot - startSlot);
    
    if (startSlot >= 0 && startSlot < 36) {
      const x = margins + timeColumnWidth + 2;
      const y = gridStartY + startSlot * timeSlotHeight + 1;
      const height = duration * timeSlotHeight - 2;
      
      // Event background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, appointmentColumnWidth - 4, height, 'F');
      
      // Event border based on source
      if (event.source === 'simplepractice') {
        pdf.setDrawColor(99, 102, 241); // Blue
        pdf.setLineWidth(2);
        pdf.rect(x, y, appointmentColumnWidth - 4, height, 'S');
        // Thick left border
        pdf.setLineWidth(4);
        pdf.line(x, y, x, y + height);
      } else if (event.source === 'google') {
        pdf.setDrawColor(34, 197, 94); // Green dashed
        pdf.setLineWidth(1);
        pdf.rect(x, y, appointmentColumnWidth - 4, height, 'S');
      }
      
      // Event text
      const cleanTitle = event.title.replace(/^🔒\s*/, '').replace(/\s*Appointment$/, '');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(cleanTitle, x + 8, y + 15);
      
      // Source
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');
      const sourceLabel = event.source === 'simplepractice' ? 'SimplePractice' : 
                         event.source === 'google' ? 'Google Calendar' : 'Manual';
      pdf.text(sourceLabel, x + 8, y + 28);
      
      // Time range
      const timeRange = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(timeRange, x + 8, y + 41);
    }
  });
  
  console.log('✅ Applied ACTUAL Browser Replica PDF template rendering');
};