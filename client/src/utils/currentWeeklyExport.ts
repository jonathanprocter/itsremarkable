import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Import comprehensive emoji cleaning function
import { cleanTitleForPDF } from './emojiCleaner';

// Clean event title utility function
function cleanEventTitle(title: string): string {
  return cleanTitleForPDF(title);
}

export interface CurrentWeeklyExportConfig {
  pageWidth: number;
  pageHeight: number;
  margins: number;
  headerHeight: number;
  timeColumnWidth: number;
  dayColumnWidth: number;
  timeSlotHeight: number;
  fonts: {
    title: number;
    weekInfo: number;
    dayHeader: number;
    timeLabel: number;
    eventTitle: number;
    eventSource: number;
    eventTime: number;
  };
}

// Optimized configuration for complete time range display
const CURRENT_WEEKLY_CONFIG: CurrentWeeklyExportConfig = {
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

export const exportCurrentWeeklyView = (
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date
): void => {
  // Normalize week start to beginning of Monday
  const normalizedWeekStart = new Date(weekStart);
  normalizedWeekStart.setHours(0, 0, 0, 0);
  
  // Ensure week end covers full Sunday
  const normalizedWeekEnd = new Date(weekEnd);
  normalizedWeekEnd.setHours(23, 59, 59, 999);
  
  console.log(`📊 Exporting weekly view: ${normalizedWeekStart.toDateString()} to ${normalizedWeekEnd.toDateString()}`);
  console.log(`📊 Total events available: ${events.length}`);
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [CURRENT_WEEKLY_CONFIG.pageWidth, CURRENT_WEEKLY_CONFIG.pageHeight]
  });

  pdf.setFont('helvetica');
  
  // Draw header
  drawCurrentWeeklyHeader(pdf, normalizedWeekStart, normalizedWeekEnd);
  
  // Draw grid and events
  drawCurrentWeeklyGrid(pdf, events, normalizedWeekStart);
  
  // Debug Monday events before saving
  const mondayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.getDay() === 1 && // Monday
           eventDate >= normalizedWeekStart && 
           eventDate <= normalizedWeekEnd;
  });
  
  console.log(`🔍 Monday events found: ${mondayEvents.length}`);
  mondayEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    console.log(`  - "${event.title}" at ${eventDate.toLocaleString()}`);
  });
  
  // Save the PDF with dynamic filename
  const weekStartStr = normalizedWeekStart.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  const weekEndStr = normalizedWeekEnd.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  pdf.save(`weekly-planner-${weekStartStr}-to-${weekEndStr}.pdf`);
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
  
  pdf.text(`${weekStartStr} - ${weekEndStr}`, margins, margins + 35);
};

// Draw complete grid with all time slots
const drawCurrentWeeklyGrid = (pdf: jsPDF, events: CalendarEvent[], weekStart: Date): void => {
  const {
    margins,
    timeColumnWidth,
    dayColumnWidth,
    timeSlotHeight,
    fonts
  } = CURRENT_WEEKLY_CONFIG;

  const gridStartY = margins + 50;
  const timeGridStartY = gridStartY + 25;
  const totalSlots = 36; // 6:00 AM to 11:30 PM (half-hour slots)

  // Draw day headers - dynamic for any week
  pdf.setFontSize(fonts.dayHeader);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  const dayNames = ['TIME', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  for (let i = 0; i < dayNames.length; i++) {
    const x = margins + (i === 0 ? 0 : timeColumnWidth + (i - 1) * dayColumnWidth);
    const width = i === 0 ? timeColumnWidth : dayColumnWidth;
    
    // Header background
    pdf.setFillColor(248, 249, 250);
    pdf.rect(x, gridStartY, width, 25, 'F');
    
    // Header border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(x, gridStartY, width, 25, 'S');
    
    if (i > 0) {
      // Dynamic day headers for any week
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + (i - 1));
      
      const dayNum = dayDate.getDate().toString();
      const month = (dayDate.getMonth() + 1).toString();
      const year = dayDate.getFullYear().toString();
      
      const dayHeaderText = `${dayNames[i]} ${month}/${dayNum}/${year}`;
      
      const textWidth = pdf.getTextWidth(dayHeaderText);
      pdf.text(dayHeaderText, x + (width - textWidth) / 2, gridStartY + 16);
    } else {
      const textWidth = pdf.getTextWidth(dayNames[i]);
      pdf.text(dayNames[i], x + (width - textWidth) / 2, gridStartY + 16);
    }
  }

  // Draw ALL time slots including both top and bottom of hours
  for (let slot = 0; slot < totalSlots; slot++) {
    const y = timeGridStartY + slot * timeSlotHeight;
    const hour = Math.floor(slot / 2) + 6;
    const minute = (slot % 2) * 30;
    const isHourSlot = minute === 0;

    // Time slot background - darker for top-of-hour, lighter for half-hour
    const timeSlotColor = isHourSlot ? 230 : 248;
    pdf.setFillColor(timeSlotColor, timeSlotColor, timeSlotColor);
    pdf.rect(margins, y, timeColumnWidth, timeSlotHeight, 'F');

    // Grid lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(margins, y, margins + timeColumnWidth + 7 * dayColumnWidth, y);

    // Time labels - show BOTH top and bottom of hours
    pdf.setFontSize(fonts.timeLabel);
    pdf.setFont('helvetica', isHourSlot ? 'bold' : 'normal');
    pdf.setTextColor(0, 0, 0);
    
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const timeX = margins + timeColumnWidth / 2;
    const timeY = y + timeSlotHeight / 2 + 2;
    
    // Show time for both hour and half-hour slots
    if (isHourSlot || minute === 30) {
      pdf.text(timeStr, timeX, timeY, { align: 'center' });
    }

    // Day columns background
    for (let day = 0; day < 7; day++) {
      const dayX = margins + timeColumnWidth + day * dayColumnWidth;
      pdf.setFillColor(timeSlotColor, timeSlotColor, timeSlotColor);
      pdf.rect(dayX, y, dayColumnWidth, timeSlotHeight, 'F');
    }
  }

  // Draw vertical separators
  for (let day = 0; day <= 7; day++) {
    const x = margins + timeColumnWidth + day * dayColumnWidth;
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(1);
    pdf.line(x, gridStartY, x, timeGridStartY + totalSlots * timeSlotHeight);
  }

  // Draw thick vertical line between time column and day columns
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.line(margins + timeColumnWidth, gridStartY, margins + timeColumnWidth, timeGridStartY + totalSlots * timeSlotHeight);

  // Draw events
  drawCurrentWeeklyEvents(pdf, events, weekStart, timeGridStartY);

  // Draw outer grid border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(margins, gridStartY, timeColumnWidth + 7 * dayColumnWidth, 25 + totalSlots * timeSlotHeight, 'S');
};

const drawCurrentWeeklyEvents = (pdf: jsPDF, events: CalendarEvent[], weekStart: Date, gridStartY: number): void => {
  const {
    margins,
    timeColumnWidth,
    dayColumnWidth,
    timeSlotHeight,
    fonts
  } = CURRENT_WEEKLY_CONFIG;

  // Dynamic week calculation - ensure we capture the full week including early Monday
  const weekStartNormalized = new Date(weekStart);
  weekStartNormalized.setHours(0, 0, 0, 0); // Start of Monday
  
  const weekEnd = new Date(weekStartNormalized);
  weekEnd.setDate(weekStartNormalized.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999); // End of Sunday

  console.log(`🗓️ Week boundaries: ${weekStartNormalized.toISOString()} to ${weekEnd.toISOString()}`);

  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const isInWeek = eventDate >= weekStartNormalized && eventDate <= weekEnd;
    
    if (!isInWeek && eventDate.getDay() === 1) { // Monday events
      console.log(`❌ Monday event excluded: "${event.title}" at ${eventDate.toISOString()}`);
    }
    
    return isInWeek;
  });

  console.log(`📊 Filtered ${weekEvents.length} events for current week (${events.length} total)`);

  weekEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Dynamic day calculation for any week - fix Monday calculation
    const dayOfWeek = eventStart.getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6, Monday = 0
    
    console.log(`📅 Event "${event.title}" on ${eventStart.toDateString()}: dayOfWeek=${dayOfWeek}, adjustedDay=${adjustedDay}`);

    // Calculate position within the 6:00 AM - 11:30 PM range
    const eventHour = eventStart.getHours();
    const eventMinute = eventStart.getMinutes();
    
    // Skip events outside our time range
    if (eventHour < 6 || eventHour >= 24) {
      console.log(`⏰ Event "${event.title}" outside time range: ${eventHour}:${eventMinute.toString().padStart(2, '0')}`);
      return;
    }
    
    const slotIndex = (eventHour - 6) * 2 + (eventMinute >= 30 ? 1 : 0);
    
    console.log(`🎯 Positioning "${event.title}": hour=${eventHour}, minute=${eventMinute}, slotIndex=${slotIndex}, adjustedDay=${adjustedDay}`);

    const x = margins + timeColumnWidth + adjustedDay * dayColumnWidth + 2;
    const y = gridStartY + slotIndex * timeSlotHeight + 2;

    // Calculate height based on duration - CORRECT ROW SPANNING
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    const numberOfSlots = Math.ceil(durationMinutes / 30); // Each slot is 30 minutes
    const height = numberOfSlots * timeSlotHeight - 4; // Span correct number of rows

    const width = dayColumnWidth - 4;

    // Event background and border based on type
    const eventType = getEventType(event);
    drawEventWithCorrectTimePosition(pdf, x, y, width, height, event, eventType, fonts, dayOfWeek);
  });
};

const getEventType = (event: CalendarEvent): string => {
  // Enhanced event type detection
  const title = event.title.toLowerCase();
  const calendarId = event.calendarId?.toLowerCase() || '';
  
  // SimplePractice detection
  if (calendarId.includes('simplepractice') || 
      title.includes('appointment') ||
      title.includes('session') ||
      title.includes('therapy') ||
      title.includes('consultation')) {
    return 'simplepractice';
  }
  
  // Holiday detection
  if (title.includes('holiday') || 
      title.includes('vacation') ||
      title.includes('day off')) {
    return 'holiday';
  }
  
  // Default to Google Calendar for everything else
  return 'google';
};

// Helper function to get calendar source name
const getCalendarSource = (event: CalendarEvent): string => {
  const eventType = getEventType(event);
  
  switch (eventType) {
    case 'simplepractice':
      return 'SimplePractice';
    case 'google':
      return 'Google Calendar';
    case 'holiday':
      return 'Holiday Calendar';
    default:
      return 'Calendar';
  }
};

// Helper function to get location based on day of week and event location
const getLocationByDay = (event: CalendarEvent, dayOfWeek: number): string => {
  // Check if event has specific location that overrides day-based logic
  const eventLocation = event.location?.toLowerCase() || '';
  
  // If event specifically mentions telehealth, respect that
  if (eventLocation.includes('telehealth') || eventLocation.includes('video') || eventLocation.includes('online')) {
    return 'Telehealth';
  }
  
  // If event specifically mentions woodbury, respect that
  if (eventLocation.includes('woodbury')) {
    return 'Woodbury';
  }
  
  // If event specifically mentions RVC, respect that
  if (eventLocation.includes('rvc')) {
    return 'RVC';
  }
  
  // Replace "100 N Village Ave" with "RVC"
  if (eventLocation.includes('100 n village') || eventLocation.includes('village ave')) {
    return 'RVC';
  }
  
  // Day-based location logic (0=Sunday, 1=Monday, 2=Tuesday, etc.)
  switch (dayOfWeek) {
    case 1: // Monday
      return 'Woodbury';
    case 2: // Tuesday
      return 'Telehealth';
    case 3: // Wednesday
      return 'RVC';
    case 4: // Thursday
      return 'RVC';
    case 5: // Friday
      return 'RVC';
    case 0: // Sunday
    case 6: // Saturday
      return 'Telehealth';
    default:
      return 'RVC';
  }
};

// Text wrapping function
const wrapText = (pdf: jsPDF, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = pdf.getTextWidth(testLine);

    if (testWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        lines.push(word);
      }
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const drawEventWithCorrectTimePosition = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  event: CalendarEvent,
  eventType: 'simplepractice' | 'google' | 'holiday',
  fonts: { eventTitle: number; eventSource: number; eventTime: number },
  dayOfWeek: number
): void => {
  // Event background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(x, y, width, height, 'F');

  // EXACT STYLING AS SPECIFIED
  if (eventType === 'simplepractice') {
    // SimplePractice: Thick cornflower blue left border
    pdf.setDrawColor(100, 149, 237); // Cornflower blue
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height, 'S');
    
    // THICK left border (5px wide)
    pdf.setFillColor(100, 149, 237);
    pdf.rect(x, y, 5, height, 'F');
    
  } else if (eventType === 'google') {
    // Google Calendar: Green dotted lines around the appointment
    pdf.setDrawColor(34, 197, 94); // Green
    pdf.setLineWidth(1);
    
    // Create dotted border effect by drawing short line segments
    const dashLength = 3;
    const gapLength = 2;
    
    // Top border (dotted)
    for (let i = x; i < x + width; i += dashLength + gapLength) {
      pdf.line(i, y, Math.min(i + dashLength, x + width), y);
    }
    
    // Bottom border (dotted)
    for (let i = x; i < x + width; i += dashLength + gapLength) {
      pdf.line(i, y + height, Math.min(i + dashLength, x + width), y + height);
    }
    
    // Left border (dotted)
    for (let i = y; i < y + height; i += dashLength + gapLength) {
      pdf.line(x, i, x, Math.min(i + dashLength, y + height));
    }
    
    // Right border (dotted)
    for (let i = y; i < y + height; i += dashLength + gapLength) {
      pdf.line(x + width, i, x + width, Math.min(i + dashLength, y + height));
    }
    
  } else if (eventType === 'holiday') {
    // Holiday: Orange solid border
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(1);
    pdf.rect(x, y, width, height, 'S');
    
    // Thick left border
    pdf.setFillColor(245, 158, 11);
    pdf.rect(x, y, 3, height, 'F');
  }

  // CORRECT LAYOUT: TIME FRAME BELOW HORIZONTAL LINE
  pdf.setTextColor(0, 0, 0);
  
  // Spacing configuration
  const leftPadding = 8; // Away from left border
  const rightPadding = 4;
  const maxWidth = width - leftPadding - rightPadding;

  // Very small fonts and tight spacing
  const titleFontSize = fonts.eventTitle; // 5px
  const sourceFontSize = fonts.eventSource; // 4px
  const timeFontSize = fonts.eventTime; // 4px
  const tightLineHeight = 4; // Tight spacing

  let currentY = y + 4; // Start position

  // 1. APPOINTMENT NAME (limit lines to save space)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(titleFontSize);
  pdf.setTextColor(0, 0, 0);
  
  const eventTitle = cleanEventTitle(event.title);
  const titleLines = wrapText(pdf, eventTitle, maxWidth);
  
  // LIMIT title to maximum 2 lines to save space
  const maxTitleLines = Math.min(titleLines.length, 2);
  for (let i = 0; i < maxTitleLines; i++) {
    pdf.text(titleLines[i], x + leftPadding, currentY + i * tightLineHeight);
  }
  
  currentY += maxTitleLines * tightLineHeight + 1;

  // 2. CALENDAR SOURCE | LOCATION (limit to 1 line)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(sourceFontSize);
  pdf.setTextColor(100, 100, 100); // Grey color
  
  const calendarSource = getCalendarSource(event);
  const location = getLocationByDay(event, dayOfWeek);
  
  const sourceLocationText = `${calendarSource} | ${location}`;
  const sourceLines = wrapText(pdf, sourceLocationText, maxWidth);
  
  // LIMIT source to 1 line to save space
  if (sourceLines.length > 0) {
    pdf.text(sourceLines[0], x + leftPadding, currentY);
    currentY += tightLineHeight + 1;
  }

  // 3. HORIZONTAL SEPARATOR LINE (always show if minimum height is met)
  const minHeightForTime = 16; // Minimum height needed to show separator and time
  
  if (height >= minHeightForTime) {
    // Calculate remaining space for separator and time
    const remainingSpace = (y + height) - currentY;
    
    if (remainingSpace >= 8) { // Need at least 8px for separator + time
      // Draw horizontal separator line
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.3);
      pdf.line(x + leftPadding, currentY, x + width - rightPadding, currentY);
      currentY += 3; // Space after separator line
      
      // 4. TIME FRAME (BELOW the horizontal line)
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      
      const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')} - ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(timeFontSize);
      pdf.setTextColor(100, 100, 100); // Grey color for time
      
      // Draw time BELOW the separator line
      pdf.text(timeStr, x + leftPadding, currentY);
    }
  }

  // Reset text color
  pdf.setTextColor(0, 0, 0);
};

// Default export for easier importing
export default exportCurrentWeeklyView;

