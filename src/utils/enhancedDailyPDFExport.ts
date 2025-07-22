import { jsPDF } from 'jspdf';
import { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';

export interface EnhancedDailyExportConfig {
  pageWidth: number;
  pageHeight: number;
  margins: number;
  headerHeight: number;
  timeColumnWidth: number;
  appointmentColumnWidth: number;
  timeSlotHeight: number;
  fonts: {
    title: number;
    date: number;
    timeLabel: number;
    eventTitle: number;
    eventSource: number;
    eventTime: number;
    eventNotes: number;
    sectionHeader: number;
    navigation: number;
  };
}

const ENHANCED_DAILY_CONFIG: EnhancedDailyExportConfig = {
  pageWidth: 612,
  pageHeight: 1200,
  margins: 20,
  headerHeight: 90,
  timeColumnWidth: 75,
  appointmentColumnWidth: 500,
  timeSlotHeight: 30,
  fonts: {
    title: 18,
    date: 14,
    timeLabel: 12,
    eventTitle: 12,
    eventSource: 10,
    eventTime: 10,
    eventNotes: 10,
    sectionHeader: 10,
    navigation: 10
  }
};

export const exportEnhancedDailyPDF = (
  events: CalendarEvent[],
  selectedDate: Date
): void => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [ENHANCED_DAILY_CONFIG.pageWidth, ENHANCED_DAILY_CONFIG.pageHeight]
  });

  console.log('🔄 Starting Enhanced Daily PDF Export with Event Notes & Action Items...');
  console.log('📅 Selected date:', format(selectedDate, 'yyyy-MM-dd'));
  console.log('📊 Events for day:', events.length);

  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    const eventDate = format(event.startTime, 'yyyy-MM-dd');
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return eventDate === selectedDateStr;
  });

  console.log('📅 Filtered events for day:', dayEvents.length);

  // Draw header
  drawEnhancedDailyHeader(pdf, selectedDate, dayEvents);

  // Draw navigation
  drawEnhancedDailyNavigation(pdf, selectedDate);

  // Draw legend
  drawEnhancedDailyLegend(pdf);

  // Draw calendar grid
  drawEnhancedDailyGrid(pdf, dayEvents, selectedDate);

  // Draw events with enhanced details
  drawEnhancedDailyEvents(pdf, dayEvents, selectedDate);

  // Download PDF
  const filename = `enhanced-daily-planner-${format(selectedDate, 'yyyy-MM-dd')}.pdf`;
  pdf.save(filename);
  console.log('✅ Enhanced Daily PDF Export completed:', filename);
};

const drawEnhancedDailyHeader = (pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]): void => {
  const { pageWidth, margins, fonts } = ENHANCED_DAILY_CONFIG;
  const centerX = pageWidth / 2;

  // Header background
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margins, margins, pageWidth - margins * 2, 70, 'F');

  // Title
  pdf.setFontSize(fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('ENHANCED DAILY PLANNER', centerX, margins + 20, { align: 'center' });

  // Date
  pdf.setFontSize(fonts.date);
  pdf.setFont('helvetica', 'normal');
  const dateStr = format(selectedDate, 'EEEE, MMMM d, yyyy');
  pdf.text(dateStr, centerX, margins + 40, { align: 'center' });

  // Statistics
  const appointmentCount = events.length;
  const scheduledMinutes = events.reduce((total, event) => {
    const duration = event.endTime.getTime() - event.startTime.getTime();
    return total + (duration / (1000 * 60));
  }, 0);
  const scheduledHours = (scheduledMinutes / 60).toFixed(1);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${appointmentCount} Appointments | ${scheduledHours}h Scheduled | Enhanced with Notes & Actions`, centerX, margins + 55, { align: 'center' });

  // Border
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(margins, margins, pageWidth - margins * 2, 70, 'D');
};

const drawEnhancedDailyNavigation = (pdf: jsPDF, selectedDate: Date): void => {
  const { pageWidth, margins, fonts } = ENHANCED_DAILY_CONFIG;
  const navY = margins + 75;

  // Navigation buttons
  pdf.setFontSize(fonts.navigation);
  pdf.setFont('helvetica', 'normal');
  
  // Back to week button
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margins, navY, 100, 20, 'F');
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(margins, navY, 100, 20, 'D');
  pdf.setTextColor(0, 0, 0);
  pdf.text('← Back to Week', margins + 50, navY + 13, { align: 'center' });

  // Previous day
  const prevDate = new Date(selectedDate);
  prevDate.setDate(prevDate.getDate() - 1);
  pdf.rect(margins + 110, navY, 80, 20, 'F');
  pdf.rect(margins + 110, navY, 80, 20, 'D');
  pdf.text(`← ${format(prevDate, 'EEE')}`, margins + 150, navY + 13, { align: 'center' });

  // Next day
  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);
  pdf.rect(margins + 200, navY, 80, 20, 'F');
  pdf.rect(margins + 200, navY, 80, 20, 'D');
  pdf.text(`${format(nextDate, 'EEE')} →`, margins + 240, navY + 13, { align: 'center' });
};

const drawEnhancedDailyLegend = (pdf: jsPDF): void => {
  const { pageWidth, margins } = ENHANCED_DAILY_CONFIG;
  const legendY = margins + 105;
  const legendStartX = margins + 20;
  const itemSpacing = 120;

  // SimplePractice legend
  pdf.setFillColor(100, 149, 237);
  pdf.rect(legendStartX, legendY - 5, 12, 6, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('SimplePractice', legendStartX + 16, legendY);

  // Google Calendar legend
  pdf.setFillColor(34, 197, 94);
  pdf.rect(legendStartX + itemSpacing, legendY - 5, 12, 6, 'F');
  pdf.text('Google Calendar', legendStartX + itemSpacing + 16, legendY);

  // Enhanced features
  pdf.setFillColor(147, 51, 234);
  pdf.rect(legendStartX + itemSpacing * 2, legendY - 5, 12, 6, 'F');
  pdf.text('With Notes/Actions', legendStartX + itemSpacing * 2 + 16, legendY);
};

const drawEnhancedDailyGrid = (pdf: jsPDF, events: CalendarEvent[], selectedDate: Date): void => {
  const { pageWidth, margins, headerHeight, timeColumnWidth, appointmentColumnWidth, timeSlotHeight } = ENHANCED_DAILY_CONFIG;
  const gridStartY = margins + headerHeight + 50;

  // Time slots from 06:00 to 23:30
  const timeSlots = [];
  for (let hour = 6; hour < 24; hour++) {
    timeSlots.push({ hour, minute: 0, display: `${hour.toString().padStart(2, '0')}:00` });
    timeSlots.push({ hour, minute: 30, display: `${hour.toString().padStart(2, '0')}:30` });
  }

  // Draw time column header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margins, gridStartY, timeColumnWidth, 30, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margins, gridStartY, timeColumnWidth, 30, 'D');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TIME', margins + timeColumnWidth / 2, gridStartY + 20, { align: 'center' });

  // Draw appointments column header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margins + timeColumnWidth, gridStartY, appointmentColumnWidth, 30, 'F');
  pdf.rect(margins + timeColumnWidth, gridStartY, appointmentColumnWidth, 30, 'D');
  pdf.text('APPOINTMENTS', margins + timeColumnWidth + appointmentColumnWidth / 2, gridStartY + 20, { align: 'center' });

  // Draw time slots
  timeSlots.forEach((slot, index) => {
    const slotY = gridStartY + 30 + index * timeSlotHeight;
    
    // Time cell
    pdf.setFillColor(slot.minute === 0 ? 245 : 255, slot.minute === 0 ? 245 : 255, slot.minute === 0 ? 245 : 255);
    pdf.rect(margins, slotY, timeColumnWidth, timeSlotHeight, 'F');
    
    // Time label
    pdf.setFontSize(ENHANCED_DAILY_CONFIG.fonts.timeLabel);
    pdf.setFont('helvetica', slot.minute === 0 ? 'bold' : 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(slot.display, margins + timeColumnWidth - 5, slotY + timeSlotHeight / 2 + 4, { align: 'right' });

    // Appointment cell
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margins + timeColumnWidth, slotY, appointmentColumnWidth, timeSlotHeight, 'F');
    
    // Grid lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    pdf.line(margins, slotY, margins + timeColumnWidth + appointmentColumnWidth, slotY);
    pdf.line(margins + timeColumnWidth, slotY, margins + timeColumnWidth, slotY + timeSlotHeight);
  });

  // Outer border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(margins, gridStartY, timeColumnWidth + appointmentColumnWidth, 30 + timeSlots.length * timeSlotHeight, 'D');
};

const drawEnhancedDailyEvents = (pdf: jsPDF, events: CalendarEvent[], selectedDate: Date): void => {
  const { margins, headerHeight, timeColumnWidth, appointmentColumnWidth, timeSlotHeight, fonts } = ENHANCED_DAILY_CONFIG;
  const gridStartY = margins + headerHeight + 50 + 30; // After header and column headers

  events.forEach(event => {
    const eventStartHour = event.startTime.getHours();
    const eventStartMinute = event.startTime.getMinutes();
    const eventEndHour = event.endTime.getHours();
    const eventEndMinute = event.endTime.getMinutes();

    // Skip events outside time range
    if (eventStartHour < 6 || eventStartHour >= 24) return;

    // Calculate position
    const startSlotIndex = (eventStartHour - 6) * 2 + (eventStartMinute >= 30 ? 1 : 0);
    const endSlotIndex = (eventEndHour - 6) * 2 + (eventEndMinute >= 30 ? 1 : 0);
    const duration = Math.max(1, endSlotIndex - startSlotIndex);

    const eventX = margins + timeColumnWidth + 2;
    const eventY = gridStartY + startSlotIndex * timeSlotHeight + 1;
    const eventWidth = appointmentColumnWidth - 4;
    
    // Check if event has notes or action items
    const hasNotes = event.notes && event.notes.trim().length > 0;
    const hasActionItems = event.actionItems && event.actionItems.trim().length > 0;
    const hasDetails = hasNotes || hasActionItems;
    
    // Calculate event height
    let eventHeight = duration * timeSlotHeight - 2;
    if (hasDetails) {
      const additionalHeight = calculateEnhancedEventHeight(event);
      eventHeight = Math.max(eventHeight, additionalHeight);
    }

    // Draw event background
    const eventType = getEnhancedEventType(event);
    setEnhancedEventBackground(pdf, eventType, hasDetails);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

    // Draw event border
    setEnhancedEventBorder(pdf, eventType, hasDetails);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'D');

    // Draw enhanced event content
    drawEnhancedEventContent(pdf, event, eventX, eventY, eventWidth, eventHeight, hasDetails);
  });
};

const calculateEnhancedEventHeight = (event: CalendarEvent): number => {
  const { fonts } = ENHANCED_DAILY_CONFIG;
  let height = 60; // Base height for title, source, time

  if (event.notes && event.notes.trim().length > 0) {
    height += fonts.sectionHeader + 4; // Section header
    const notesLines = event.notes.split('\n').filter(line => line.trim()).length;
    height += notesLines * (fonts.eventNotes + 2);
    height += 8; // Section spacing
  }

  if (event.actionItems && event.actionItems.trim().length > 0) {
    height += fonts.sectionHeader + 4; // Section header
    const actionLines = event.actionItems.split('\n').filter(line => line.trim()).length;
    height += actionLines * (fonts.eventNotes + 2);
    height += 8; // Section spacing
  }

  return height;
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
  const { fonts } = ENHANCED_DAILY_CONFIG;
  let currentY = y + 8;

  // Event title
  pdf.setFontSize(fonts.eventTitle);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  const cleanTitle = event.title.replace(' Appointment', '');
  pdf.text(cleanTitle, x + 8, currentY, { maxWidth: width - 16 });
  currentY += fonts.eventTitle + 4;

  // Event source
  pdf.setFontSize(fonts.eventSource);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  const sourceText = event.source === 'google' ? 'Google Calendar' : 
                     event.source === 'simplepractice' ? 'SimplePractice' : 
                     event.source.toUpperCase();
  pdf.text(sourceText, x + 8, currentY);
  currentY += fonts.eventSource + 4;

  // Event time
  pdf.setFontSize(fonts.eventTime);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  const timeRange = `${format(event.startTime, 'HH:mm')}-${format(event.endTime, 'HH:mm')}`;
  pdf.text(timeRange, x + 8, currentY);
  currentY += fonts.eventTime + 8;

  // Event notes section
  if (event.notes && event.notes.trim().length > 0) {
    // Section divider
    pdf.setDrawColor(220, 220, 220);
    pdf.line(x + 8, currentY, x + width - 8, currentY);
    currentY += 4;

    // Section header
    pdf.setFontSize(fonts.sectionHeader);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 118, 210);
    pdf.text('Event Notes', x + 8, currentY);
    currentY += fonts.sectionHeader + 4;

    // Notes content
    pdf.setFontSize(fonts.eventNotes);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const notes = event.notes.split('\n').filter(line => line.trim());
    notes.forEach(note => {
      pdf.text(`• ${note.trim()}`, x + 12, currentY, { maxWidth: width - 20 });
      currentY += fonts.eventNotes + 2;
    });
    currentY += 6;
  }

  // Action items section
  if (event.actionItems && event.actionItems.trim().length > 0) {
    // Section divider
    pdf.setDrawColor(220, 220, 220);
    pdf.line(x + 8, currentY, x + width - 8, currentY);
    currentY += 4;

    // Section header
    pdf.setFontSize(fonts.sectionHeader);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(25, 118, 210);
    pdf.text('Action Items', x + 8, currentY);
    currentY += fonts.sectionHeader + 4;

    // Action items content
    pdf.setFontSize(fonts.eventNotes);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const actions = event.actionItems.split('\n').filter(line => line.trim());
    actions.forEach(action => {
      pdf.text(`• ${action.trim()}`, x + 12, currentY, { maxWidth: width - 20 });
      currentY += fonts.eventNotes + 2;
    });
  }
};

const getEnhancedEventType = (event: CalendarEvent): 'simplepractice' | 'google' | 'holiday' => {
  if (event.source === 'simplepractice' || event.title.includes('Appointment')) {
    return 'simplepractice';
  }
  if (event.title.toLowerCase().includes('holiday')) {
    return 'holiday';
  }
  return 'google';
};

const setEnhancedEventBackground = (pdf: jsPDF, eventType: 'simplepractice' | 'google' | 'holiday', hasDetails: boolean): void => {
  if (hasDetails) {
    // Enhanced background for events with details
    pdf.setFillColor(248, 250, 252); // Light blue-gray
  } else {
    // Standard white background
    pdf.setFillColor(255, 255, 255);
  }
};

const setEnhancedEventBorder = (pdf: jsPDF, eventType: 'simplepractice' | 'google' | 'holiday', hasDetails: boolean): void => {
  pdf.setLineWidth(hasDetails ? 1.5 : 1);
  
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