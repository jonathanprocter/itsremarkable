import { jsPDF } from 'jspdf';
import { CalendarEvent } from '@/types/calendar';
import { format, startOfWeek, endOfWeek, addDays, startOfDay, endOfDay } from 'date-fns';
import { exportEnhancedWeeklyPDF } from './enhancedWeeklyPDFExport';
import { exportEnhancedDailyPDF } from './enhancedDailyPDFExport';

export interface WeeklyPackageConfig {
  includeNavigation: boolean;
  includeStatistics: boolean;
  includeEventNotes: boolean;
  includeActionItems: boolean;
  pageFormat: 'letter' | 'a4';
  weeklyOrientation: 'landscape' | 'portrait';
  dailyOrientation: 'landscape' | 'portrait';
}

const DEFAULT_PACKAGE_CONFIG: WeeklyPackageConfig = {
  includeNavigation: true,
  includeStatistics: true,
  includeEventNotes: true,
  includeActionItems: true,
  pageFormat: 'letter',
  weeklyOrientation: 'landscape',
  dailyOrientation: 'portrait'
};

export const exportEnhancedWeeklyPackage = (
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date,
  config: Partial<WeeklyPackageConfig> = {}
): void => {
  const finalConfig = { ...DEFAULT_PACKAGE_CONFIG, ...config };
  
  console.log('🔄 Starting Enhanced Weekly Package Export...');
  console.log('📅 Week:', format(weekStart, 'yyyy-MM-dd'), 'to', format(weekEnd, 'yyyy-MM-dd'));
  console.log('📊 Total events:', events.length);
  console.log('⚙️ Config:', finalConfig);

  const pdf = new jsPDF({
    orientation: finalConfig.weeklyOrientation,
    unit: 'pt',
    format: finalConfig.pageFormat
  });

  // Page 1: Weekly Overview (landscape)
  generateWeeklyOverviewPage(pdf, events, weekStart, weekEnd, finalConfig);

  // Pages 2-8: Daily Views (portrait)
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  for (let i = 0; i < 7; i++) {
    const currentDay = addDays(weekStart, i);
    const dayEvents = getEventsForDay(events, currentDay);
    
    pdf.addPage([612, 792], 'portrait'); // Standard letter portrait
    generateDailyPage(pdf, dayEvents, currentDay, dayNames[i], weekStart, weekEnd, finalConfig, i + 2);
  }

  // Download the complete package
  const filename = `enhanced-weekly-package-${format(weekStart, 'yyyy-MM-dd')}-to-${format(weekEnd, 'yyyy-MM-dd')}.pdf`;
  pdf.save(filename);
  console.log('✅ Enhanced Weekly Package Export completed:', filename);
};

const generateWeeklyOverviewPage = (
  pdf: jsPDF,
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date,
  config: WeeklyPackageConfig
): void => {
  console.log('📄 Generating Weekly Overview Page...');
  
  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ENHANCED WEEKLY PLANNER', 396, 40, { align: 'center' });
  
  // Week info
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  const weekInfo = `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'MMMM d, yyyy')}`;
  pdf.text(weekInfo, 396, 60, { align: 'center' });

  // Enhanced features notice
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Enhanced with Event Notes & Action Items', 396, 80, { align: 'center' });

  // Statistics section
  if (config.includeStatistics) {
    generateWeeklyStatistics(pdf, events, weekStart, weekEnd, 100);
  }

  // Legend section
  generateWeeklyLegend(pdf, 140);

  // Navigation section
  if (config.includeNavigation) {
    generateWeeklyNavigation(pdf, weekStart, weekEnd, 180);
  }

  // Weekly grid
  generateWeeklyGrid(pdf, events, weekStart, weekEnd, 220);

  // Daily page links
  generateDailyPageLinks(pdf, weekStart, 500);
};

const generateWeeklyStatistics = (
  pdf: jsPDF,
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date,
  startY: number
): void => {
  const totalEvents = events.length;
  const eventsWithNotes = events.filter(e => e.notes && e.notes.trim().length > 0).length;
  const eventsWithActions = events.filter(e => e.actionItems && e.actionItems.trim().length > 0).length;
  
  const totalMinutes = events.reduce((sum, event) => {
    return sum + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Statistics background
  pdf.setFillColor(248, 250, 252);
  pdf.rect(40, startY, 712, 30, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(40, startY, 712, 30, 'D');

  // Statistics text
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  const stats = `${totalEvents} Appointments | ${totalHours}h Scheduled | ${eventsWithNotes} with Notes | ${eventsWithActions} with Actions`;
  pdf.text(stats, 396, startY + 20, { align: 'center' });
};

const generateWeeklyLegend = (pdf: jsPDF, startY: number): void => {
  const legendItems = [
    { color: [100, 149, 237], label: 'SimplePractice' },
    { color: [34, 197, 94], label: 'Google Calendar' },
    { color: [245, 158, 11], label: 'Holidays' },
    { color: [147, 51, 234], label: 'With Notes/Actions' }
  ];

  const itemWidth = 150;
  const startX = 96; // Center the legend

  legendItems.forEach((item, index) => {
    const x = startX + index * itemWidth;
    
    // Legend box
    pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
    pdf.rect(x, startY, 12, 8, 'F');
    
    // Legend label
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, x + 16, startY + 6);
  });
};

const generateWeeklyNavigation = (
  pdf: jsPDF,
  weekStart: Date,
  weekEnd: Date,
  startY: number
): void => {
  const prevWeekStart = addDays(weekStart, -7);
  const nextWeekStart = addDays(weekStart, 7);

  // Previous week button
  pdf.setFillColor(245, 245, 245);
  pdf.rect(200, startY, 100, 25, 'F');
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(200, startY, 100, 25, 'D');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('← Previous Week', 250, startY + 16, { align: 'center' });

  // Current week indicator
  pdf.setFillColor(220, 220, 220);
  pdf.rect(320, startY, 152, 25, 'F');
  pdf.rect(320, startY, 152, 25, 'D');
  pdf.setFont('helvetica', 'bold');
  pdf.text('Current Week', 396, startY + 16, { align: 'center' });

  // Next week button
  pdf.setFillColor(245, 245, 245);
  pdf.rect(492, startY, 100, 25, 'F');
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(492, startY, 100, 25, 'D');
  pdf.setFont('helvetica', 'normal');
  pdf.text('Next Week →', 542, startY + 16, { align: 'center' });
};

const generateWeeklyGrid = (
  pdf: jsPDF,
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date,
  startY: number
): void => {
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const dayWidth = 100;
  const timeWidth = 52;
  const slotHeight = 12;
  const gridStartX = 40;

  // Draw headers
  pdf.setFillColor(240, 240, 240);
  pdf.rect(gridStartX, startY, timeWidth + dayWidth * 7, 25, 'F');
  
  // TIME header
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TIME', gridStartX + timeWidth / 2, startY + 16, { align: 'center' });

  // Day headers
  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(weekStart, i);
    const x = gridStartX + timeWidth + i * dayWidth;
    
    pdf.text(dayNames[i], x + dayWidth / 2, startY + 10, { align: 'center' });
    pdf.text(format(dayDate, 'd'), x + dayWidth / 2, startY + 20, { align: 'center' });
  }

  // Time slots (simplified for overview)
  const timeSlots = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'];
  
  timeSlots.forEach((time, index) => {
    const slotY = startY + 25 + index * slotHeight * 2;
    
    // Time label
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(time, gridStartX + timeWidth - 5, slotY + 8, { align: 'right' });
    
    // Day slots
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayDate = addDays(weekStart, dayIndex);
      const dayEvents = getEventsForTimeSlot(events, dayDate, time);
      
      if (dayEvents.length > 0) {
        const eventX = gridStartX + timeWidth + dayIndex * dayWidth + 1;
        const eventY = slotY;
        const eventWidth = dayWidth - 2;
        const eventHeight = slotHeight * 2 - 1;
        
        // Event background
        const hasDetails = dayEvents.some(e => 
          (e.notes && e.notes.trim().length > 0) || 
          (e.actionItems && e.actionItems.trim().length > 0)
        );
        
        pdf.setFillColor(hasDetails ? 248 : 255, hasDetails ? 250 : 255, hasDetails ? 252 : 255);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
        
        // Event border
        const eventType = getEventType(dayEvents[0]);
        setEventBorder(pdf, eventType);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'D');
        
        // Event text
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        const title = dayEvents[0].title.substring(0, 15);
        pdf.text(title, eventX + 2, eventY + 8, { maxWidth: eventWidth - 4 });
        
        // Details indicator
        if (hasDetails) {
          pdf.setFontSize(5);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(147, 51, 234);
          pdf.text('●', eventX + eventWidth - 8, eventY + 8);
        }
      }
      
      // Grid lines
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.5);
      pdf.line(gridStartX, slotY, gridStartX + timeWidth + dayWidth * 7, slotY);
    }
  });

  // Outer border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(gridStartX, startY, timeWidth + dayWidth * 7, 25 + timeSlots.length * slotHeight * 2, 'D');
};

const generateDailyPageLinks = (pdf: jsPDF, weekStart: Date, startY: number): void => {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const buttonWidth = 95;
  const buttonHeight = 25;
  const spacing = 10;
  const totalWidth = dayNames.length * buttonWidth + (dayNames.length - 1) * spacing;
  const startX = (792 - totalWidth) / 2;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DAILY VIEWS', 396, startY + 15, { align: 'center' });

  dayNames.forEach((dayName, index) => {
    const x = startX + index * (buttonWidth + spacing);
    const y = startY + 30;
    
    // Button background
    pdf.setFillColor(245, 245, 245);
    pdf.rect(x, y, buttonWidth, buttonHeight, 'F');
    
    // Button border
    pdf.setDrawColor(180, 180, 180);
    pdf.rect(x, y, buttonWidth, buttonHeight, 'D');
    
    // Button text
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(dayName, x + buttonWidth / 2, y + 16, { align: 'center' });
    
    // Page reference
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Page ${index + 2}`, x + buttonWidth / 2, y + 24, { align: 'center' });
  });
};

const generateDailyPage = (
  pdf: jsPDF,
  events: CalendarEvent[],
  date: Date,
  dayName: string,
  weekStart: Date,
  weekEnd: Date,
  config: WeeklyPackageConfig,
  pageNumber: number
): void => {
  console.log(`📄 Generating Daily Page: ${dayName} (${format(date, 'yyyy-MM-dd')})`);
  
  // Use the enhanced daily export for individual pages
  const pageWidth = 612;
  const pageHeight = 792;
  const margins = 20;
  
  // Header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('ENHANCED DAILY PLANNER', pageWidth / 2, margins + 20, { align: 'center' });
  
  // Date
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${dayName}, ${format(date, 'MMMM d, yyyy')}`, pageWidth / 2, margins + 40, { align: 'center' });
  
  // Page number
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text(`Page ${pageNumber} of 8`, pageWidth / 2, margins + 55, { align: 'center' });
  
  // Navigation
  generateDailyNavigation(pdf, date, weekStart, weekEnd, margins + 70);
  
  // Statistics
  generateDailyStatistics(pdf, events, date, margins + 100);
  
  // Legend
  generateDailyLegend(pdf, margins + 125);
  
  // Event grid and events
  generateDailyGrid(pdf, events, date, margins + 150);
  
  // Footer navigation
  generateDailyFooter(pdf, date, weekStart, weekEnd, pageHeight - 30);
};

const generateDailyNavigation = (
  pdf: jsPDF,
  date: Date,
  weekStart: Date,
  weekEnd: Date,
  startY: number
): void => {
  const prevDay = addDays(date, -1);
  const nextDay = addDays(date, 1);
  
  // Back to weekly button
  pdf.setFillColor(245, 245, 245);
  pdf.rect(50, startY, 120, 20, 'F');
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(50, startY, 120, 20, 'D');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('← Back to Weekly', 110, startY + 13, { align: 'center' });
  
  // Previous day
  pdf.rect(200, startY, 100, 20, 'F');
  pdf.rect(200, startY, 100, 20, 'D');
  pdf.text(`← ${format(prevDay, 'EEE')}`, 250, startY + 13, { align: 'center' });
  
  // Next day
  pdf.rect(320, startY, 100, 20, 'F');
  pdf.rect(320, startY, 100, 20, 'D');
  pdf.text(`${format(nextDay, 'EEE')} →`, 370, startY + 13, { align: 'center' });
};

const generateDailyStatistics = (pdf: jsPDF, events: CalendarEvent[], date: Date, startY: number): void => {
  const dayEvents = getEventsForDay(events, date);
  const eventsWithNotes = dayEvents.filter(e => e.notes && e.notes.trim().length > 0).length;
  const eventsWithActions = dayEvents.filter(e => e.actionItems && e.actionItems.trim().length > 0).length;
  
  const totalMinutes = dayEvents.reduce((sum, event) => {
    return sum + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
  }, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const stats = `${dayEvents.length} Appointments | ${totalHours}h Scheduled | ${eventsWithNotes} with Notes | ${eventsWithActions} with Actions`;
  pdf.text(stats, 306, startY, { align: 'center' });
};

const generateDailyLegend = (pdf: jsPDF, startY: number): void => {
  const legendItems = [
    { color: [100, 149, 237], label: 'SimplePractice' },
    { color: [34, 197, 94], label: 'Google Calendar' },
    { color: [147, 51, 234], label: 'Enhanced' }
  ];
  
  const itemWidth = 150;
  const startX = 81; // Center for 3 items
  
  legendItems.forEach((item, index) => {
    const x = startX + index * itemWidth;
    
    pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
    pdf.rect(x, startY, 10, 6, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(item.label, x + 14, startY + 4);
  });
};

const generateDailyGrid = (pdf: jsPDF, events: CalendarEvent[], date: Date, startY: number): void => {
  const dayEvents = getEventsForDay(events, date);
  const timeColumnWidth = 60;
  const appointmentColumnWidth = 500;
  const timeSlotHeight = 20;
  const gridStartX = 26;
  
  // Column headers
  pdf.setFillColor(240, 240, 240);
  pdf.rect(gridStartX, startY, timeColumnWidth, 25, 'F');
  pdf.rect(gridStartX + timeColumnWidth, startY, appointmentColumnWidth, 25, 'F');
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TIME', gridStartX + timeColumnWidth / 2, startY + 16, { align: 'center' });
  pdf.text('APPOINTMENTS', gridStartX + timeColumnWidth + appointmentColumnWidth / 2, startY + 16, { align: 'center' });
  
  // Time slots
  const timeSlots = [];
  for (let hour = 7; hour < 22; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  
  timeSlots.forEach((time, index) => {
    const slotY = startY + 25 + index * timeSlotHeight;
    
    // Time cell
    pdf.setFillColor(250, 250, 250);
    pdf.rect(gridStartX, slotY, timeColumnWidth, timeSlotHeight, 'F');
    
    // Time label
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text(time, gridStartX + timeColumnWidth - 5, slotY + 13, { align: 'right' });
    
    // Appointment cell
    pdf.setFillColor(255, 255, 255);
    pdf.rect(gridStartX + timeColumnWidth, slotY, appointmentColumnWidth, timeSlotHeight, 'F');
    
    // Find events for this time slot
    const slotEvents = getEventsForTimeSlot(dayEvents, date, time);
    
    if (slotEvents.length > 0) {
      const event = slotEvents[0];
      const hasDetails = (event.notes && event.notes.trim().length > 0) || 
                        (event.actionItems && event.actionItems.trim().length > 0);
      
      // Event content
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      const title = event.title.replace(' Appointment', '');
      pdf.text(title, gridStartX + timeColumnWidth + 5, slotY + 10, { maxWidth: 200 });
      
      // Event details indicator
      if (hasDetails) {
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(147, 51, 234);
        pdf.text('Enhanced with notes/actions', gridStartX + timeColumnWidth + 5, slotY + 18);
      }
    }
    
    // Grid lines
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    pdf.line(gridStartX, slotY, gridStartX + timeColumnWidth + appointmentColumnWidth, slotY);
  });
  
  // Outer border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(gridStartX, startY, timeColumnWidth + appointmentColumnWidth, 25 + timeSlots.length * timeSlotHeight, 'D');
};

const generateDailyFooter = (
  pdf: jsPDF,
  date: Date,
  weekStart: Date,
  weekEnd: Date,
  startY: number
): void => {
  const prevDay = addDays(date, -1);
  const nextDay = addDays(date, 1);
  
  // Footer navigation
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text(`← ${format(prevDay, 'EEEE')}`, 50, startY, { align: 'left' });
  pdf.text('Weekly Package Export', 306, startY, { align: 'center' });
  pdf.text(`${format(nextDay, 'EEEE')} →`, 562, startY, { align: 'right' });
};

// Helper functions
const getEventsForDay = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  
  return events.filter(event => {
    return event.startTime >= dayStart && event.startTime < dayEnd;
  });
};

const getEventsForTimeSlot = (events: CalendarEvent[], date: Date, timeSlot: string): CalendarEvent[] => {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotStart = new Date(date);
  slotStart.setHours(hours, minutes, 0, 0);
  const slotEnd = new Date(slotStart);
  slotEnd.setHours(hours + 1, minutes, 0, 0);
  
  return events.filter(event => {
    return event.startTime >= slotStart && event.startTime < slotEnd;
  });
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

const setEventBorder = (pdf: jsPDF, eventType: 'simplepractice' | 'google' | 'holiday'): void => {
  pdf.setLineWidth(0.5);
  
  switch (eventType) {
    case 'simplepractice':
      pdf.setDrawColor(100, 149, 237);
      break;
    case 'google':
      pdf.setDrawColor(34, 197, 94);
      break;
    case 'holiday':
      pdf.setDrawColor(245, 158, 11);
      break;
  }
};