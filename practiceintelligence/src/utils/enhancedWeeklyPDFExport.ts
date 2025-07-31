import { jsPDF } from 'jspdf';
import { CalendarEvent } from '@/types/calendar';
import { format, startOfWeek, endOfWeek, addDays, parse } from 'date-fns';

export interface EnhancedWeeklyExportConfig {
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
    eventTime: number;
    eventNotes: number;
    sectionHeader: number;
  };
}

const ENHANCED_WEEKLY_CONFIG: EnhancedWeeklyExportConfig = {
  pageWidth: 792,
  pageHeight: 612,
  margins: 20,
  headerHeight: 60,
  timeColumnWidth: 50,
  dayColumnWidth: 100,
  timeSlotHeight: 12,
  fonts: {
    title: 14,
    weekInfo: 10,
    dayHeader: 8,
    timeLabel: 6,
    eventTitle: 5,
    eventTime: 4,
    eventNotes: 4,
    sectionHeader: 4
  }
};

export const exportEnhancedWeeklyPDF = (
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date
): void => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [ENHANCED_WEEKLY_CONFIG.pageWidth, ENHANCED_WEEKLY_CONFIG.pageHeight]
  });

  console.log('🔄 Starting Enhanced Weekly PDF Export with Event Notes & Action Items...');
  console.log('📊 Events:', events.length);

  // Draw header
  drawEnhancedWeeklyHeader(pdf, weekStart, weekEnd);

  // Draw legend
  drawEnhancedWeeklyLegend(pdf);

  // Draw calendar grid
  drawEnhancedWeeklyGrid(pdf, events, weekStart);

  // Draw events with notes and action items
  drawEnhancedWeeklyEvents(pdf, events, weekStart);

  // Download PDF
  const filename = `enhanced-weekly-planner-${format(weekStart, 'yyyy-MM-dd')}-to-${format(weekEnd, 'yyyy-MM-dd')}.pdf`;
  pdf.save(filename);
  console.log('✅ Enhanced Weekly PDF Export completed:', filename);
};

const drawEnhancedWeeklyHeader = (pdf: jsPDF, weekStart: Date, weekEnd: Date): void => {
  const { pageWidth, margins, headerHeight, fonts } = ENHANCED_WEEKLY_CONFIG;
  const centerX = pageWidth / 2;

  // Title
  pdf.setFontSize(fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ENHANCED WEEKLY PLANNER', centerX, margins + 20, { align: 'center' });

  // Week info
  pdf.setFontSize(fonts.weekInfo);
  pdf.setFont('helvetica', 'normal');
  const weekInfo = `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'MMMM d, yyyy')}`;
  pdf.text(weekInfo, centerX, margins + 35, { align: 'center' });

  // Statistics
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Enhanced with Event Notes & Action Items', centerX, margins + 48, { align: 'center' });
};

const drawEnhancedWeeklyLegend = (pdf: jsPDF): void => {
  const { pageWidth, margins, headerHeight } = ENHANCED_WEEKLY_CONFIG;
  const legendY = margins + headerHeight - 10;
  const legendStartX = margins + 20;
  const itemSpacing = 120;

  // SimplePractice legend
  pdf.setFillColor(100, 149, 237);
  pdf.rect(legendStartX, legendY - 5, 8, 5, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('SimplePractice', legendStartX + 12, legendY - 1);

  // Google Calendar legend
  pdf.setFillColor(34, 197, 94);
  pdf.rect(legendStartX + itemSpacing, legendY - 5, 8, 5, 'F');
  pdf.text('Google Calendar', legendStartX + itemSpacing + 12, legendY - 1);

  // Holiday legend
  pdf.setFillColor(245, 158, 11);
  pdf.rect(legendStartX + itemSpacing * 2, legendY - 5, 8, 5, 'F');
  pdf.text('Holidays', legendStartX + itemSpacing * 2 + 12, legendY - 1);

  // Enhanced features indicator
  pdf.setFillColor(147, 51, 234);
  pdf.rect(legendStartX + itemSpacing * 3, legendY - 5, 8, 5, 'F');
  pdf.text('With Notes/Actions', legendStartX + itemSpacing * 3 + 12, legendY - 1);
};

const drawEnhancedWeeklyGrid = (pdf: jsPDF, events: CalendarEvent[], weekStart: Date): void => {
  const { pageWidth, pageHeight, margins, headerHeight, timeColumnWidth, dayColumnWidth, timeSlotHeight } = ENHANCED_WEEKLY_CONFIG;
  const gridStartY = margins + headerHeight + 10;
  const gridEndY = pageHeight - margins;
  const gridHeight = gridEndY - gridStartY;

  // Time slots from 06:00 to 23:30
  const timeSlots = [];
  for (let hour = 6; hour < 24; hour++) {
    timeSlots.push({ hour, minute: 0 });
    timeSlots.push({ hour, minute: 30 });
  }

  // Draw day headers
  const dayNames = ['TIME', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const dayDates = [];
  for (let i = 0; i < 7; i++) {
    dayDates.push(addDays(weekStart, i));
  }

  // Header row
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margins, gridStartY, pageWidth - margins * 2, 25, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margins, gridStartY, pageWidth - margins * 2, 25, 'D');

  // Day headers
  for (let i = 0; i < 8; i++) {
    const x = margins + (i === 0 ? 0 : timeColumnWidth + (i - 1) * dayColumnWidth);
    const width = i === 0 ? timeColumnWidth : dayColumnWidth;
    
    pdf.setFontSize(ENHANCED_WEEKLY_CONFIG.fonts.dayHeader);
    pdf.setFont('helvetica', 'bold');
    
    if (i === 0) {
      pdf.text('TIME', x + width / 2, gridStartY + 15, { align: 'center' });
    } else {
      const dayName = dayNames[i];
      const dayDate = dayDates[i - 1];
      pdf.text(dayName, x + width / 2, gridStartY + 10, { align: 'center' });
      pdf.text(format(dayDate, 'd'), x + width / 2, gridStartY + 20, { align: 'center' });
    }
  }

  // Time slots
  let currentY = gridStartY + 25;
  timeSlots.forEach((slot, index) => {
    const slotY = currentY + index * timeSlotHeight;
    
    // Time label
    pdf.setFontSize(ENHANCED_WEEKLY_CONFIG.fonts.timeLabel);
    pdf.setFont('helvetica', slot.minute === 0 ? 'bold' : 'normal');
    const timeStr = `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`;
    pdf.text(timeStr, margins + timeColumnWidth - 5, slotY + 8, { align: 'right' });

    // Horizontal lines
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margins, slotY, pageWidth - margins, slotY);
    
    // Hour separation lines (darker)
    if (slot.minute === 0) {
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(1);
      pdf.line(margins, slotY, pageWidth - margins, slotY);
      pdf.setLineWidth(0.5);
    }
  });

  // Vertical lines
  pdf.setDrawColor(100, 100, 100);
  pdf.setLineWidth(1);
  for (let i = 0; i <= 7; i++) {
    const x = margins + (i === 0 ? timeColumnWidth : timeColumnWidth + i * dayColumnWidth);
    pdf.line(x, gridStartY, x, gridEndY);
  }
};

const drawEnhancedWeeklyEvents = (pdf: jsPDF, events: CalendarEvent[], weekStart: Date): void => {
  const { margins, headerHeight, timeColumnWidth, dayColumnWidth, timeSlotHeight } = ENHANCED_WEEKLY_CONFIG;
  const gridStartY = margins + headerHeight + 10 + 25; // After header row

  events.forEach(event => {
    const eventDayOfWeek = event.startTime.getDay();
    const dayIndex = eventDayOfWeek === 0 ? 6 : eventDayOfWeek - 1; // Convert to Mon=0, Sun=6
    
    if (dayIndex < 0 || dayIndex > 6) return;

    const eventStartHour = event.startTime.getHours();
    const eventStartMinute = event.startTime.getMinutes();
    const eventEndHour = event.endTime.getHours();
    const eventEndMinute = event.endTime.getMinutes();

    // Skip events outside time range
    if (eventStartHour < 6 || eventStartHour >= 24) return;

    // Calculate position
    const startSlotIndex = (eventStartHour - 6) * 2 + (eventStartMinute >= 30 ? 1 : 0);
    const endSlotIndex = (eventEndHour - 6) * 2 + (eventEndMinute >= 30 ? 1 : 0);
    const duration = endSlotIndex - startSlotIndex;

    const eventX = margins + timeColumnWidth + dayIndex * dayColumnWidth + 1;
    const eventY = gridStartY + startSlotIndex * timeSlotHeight;
    const eventWidth = dayColumnWidth - 2;
    
    // Check if event has notes or action items
    const hasNotes = event.notes && event.notes.trim().length > 0;
    const hasActionItems = event.actionItems && event.actionItems.trim().length > 0;
    const hasDetails = hasNotes || hasActionItems;
    
    // Calculate enhanced height for events with details
    let eventHeight = Math.max(duration * timeSlotHeight - 1, 20);
    if (hasDetails) {
      const additionalHeight = calculateAdditionalHeight(event);
      eventHeight = Math.max(eventHeight, eventHeight + additionalHeight);
    }

    // Draw event background
    const eventType = getEventType(event);
    setEventBackground(pdf, eventType, hasDetails);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

    // Draw event border
    setEventBorder(pdf, eventType, hasDetails);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'D');

    // Draw event content
    drawEnhancedEventContent(pdf, event, eventX, eventY, eventWidth, eventHeight, hasDetails);
  });
};

const calculateAdditionalHeight = (event: CalendarEvent): number => {
  const { eventNotes, sectionHeader } = ENHANCED_WEEKLY_CONFIG.fonts;
  let additionalHeight = 0;
  
  if (event.notes && event.notes.trim().length > 0) {
    additionalHeight += sectionHeader + 2; // Section header
    const notesLines = event.notes.split('\n').length;
    additionalHeight += notesLines * (eventNotes + 1);
  }
  
  if (event.actionItems && event.actionItems.trim().length > 0) {
    additionalHeight += sectionHeader + 2; // Section header
    const actionLines = event.actionItems.split('\n').length;
    additionalHeight += actionLines * (eventNotes + 1);
  }
  
  return additionalHeight;
};

const drawEnhancedEventContent = (
  pdf: jsPDF,
  event: CalendarEvent,
  x: number,
  y: number,
  width: number,
  height: number,
  hasDetails: boolean
): void => {
  const { eventTitle, eventTime, eventNotes, sectionHeader } = ENHANCED_WEEKLY_CONFIG.fonts;
  let currentY = y + 8;

  // Event title
  pdf.setFontSize(eventTitle);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  const cleanTitle = event.title.replace(' Appointment', '').substring(0, 20);
  pdf.text(cleanTitle, x + 2, currentY, { maxWidth: width - 4 });
  currentY += eventTitle + 2;

  // Event time
  pdf.setFontSize(eventTime);
  pdf.setFont('helvetica', 'normal');
  const timeRange = `${format(event.startTime, 'HH:mm')}-${format(event.endTime, 'HH:mm')}`;
  pdf.text(timeRange, x + 2, currentY, { maxWidth: width - 4 });
  currentY += eventTime + 2;

  // Event notes
  if (event.notes && event.notes.trim().length > 0) {
    pdf.setFontSize(sectionHeader);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 118, 210);
    pdf.text('EVENT NOTES', x + 2, currentY);
    currentY += sectionHeader + 2;

    pdf.setFontSize(eventNotes);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const notes = event.notes.split('\n');
    notes.forEach(note => {
      if (note.trim()) {
        pdf.text(`• ${note.trim()}`, x + 4, currentY, { maxWidth: width - 6 });
        currentY += eventNotes + 1;
      }
    });
    currentY += 2;
  }

  // Action items
  if (event.actionItems && event.actionItems.trim().length > 0) {
    pdf.setFontSize(sectionHeader);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 118, 210);
    pdf.text('ACTION ITEMS', x + 2, currentY);
    currentY += sectionHeader + 2;

    pdf.setFontSize(eventNotes);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const actions = event.actionItems.split('\n');
    actions.forEach(action => {
      if (action.trim()) {
        pdf.text(`• ${action.trim()}`, x + 4, currentY, { maxWidth: width - 6 });
        currentY += eventNotes + 1;
      }
    });
  }
};

const getEventType = (event: CalendarEvent): 'simplepractice' | 'google' | 'holiday' => {
  if (event.source === 'simplepractice' || event.title.includes('Appointment')) {
    return 'simplepractice';
  }
  if (event.title.toLowerCase().includes('holiday')) {
    return 'holiday';
  }
  return 'google';
};

const setEventBackground = (pdf: jsPDF, eventType: 'simplepractice' | 'google' | 'holiday', hasDetails: boolean): void => {
  if (hasDetails) {
    // Enhanced background for events with details
    pdf.setFillColor(248, 250, 252); // Light blue-gray
  } else {
    // Standard white background
    pdf.setFillColor(255, 255, 255);
  }
};

const setEventBorder = (pdf: jsPDF, eventType: 'simplepractice' | 'google' | 'holiday', hasDetails: boolean): void => {
  pdf.setLineWidth(hasDetails ? 1 : 0.5);
  
  switch (eventType) {
    case 'simplepractice':
      pdf.setDrawColor(100, 149, 237); // Cornflower blue
      break;
    case 'google':
      pdf.setDrawColor(34, 197, 94); // Green
      break;
    case 'holiday':
      pdf.setDrawColor(245, 158, 11); // Orange
      break;
  }
};