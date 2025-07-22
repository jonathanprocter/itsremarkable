
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isSameMonth } from 'date-fns';

interface MonthlyExportConfig {
  pageWidth: number;
  pageHeight: number;
  margins: number;
  headerHeight: number;
  weekHeight: number;
  dayWidth: number;
  fonts: {
    title: number;
    monthYear: number;
    dayHeader: number;
    dayNumber: number;
    eventText: number;
  };
}

const MONTHLY_CONFIG: MonthlyExportConfig = {
  pageWidth: 792,
  pageHeight: 612,
  margins: 20,
  headerHeight: 80,
  weekHeight: 85,
  dayWidth: 108,
  fonts: {
    title: 16,
    monthYear: 14,
    dayHeader: 10,
    dayNumber: 12,
    eventText: 6,
  },
};

export const exportMonthlyCalendar = (
  selectedDate: Date,
  events: CalendarEvent[]
): void => {
  console.log('🗓️ Starting Monthly Calendar Export');
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [MONTHLY_CONFIG.pageWidth, MONTHLY_CONFIG.pageHeight]
  });

  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  // Filter events for the month
  const monthEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= monthStart && eventDate <= monthEnd;
  });

  console.log(`📅 Month: ${format(monthStart, 'MMMM yyyy')}`);
  console.log(`📊 Events: ${monthEvents.length}`);

  // Draw header
  drawMonthlyHeader(pdf, selectedDate);
  
  // Draw calendar grid
  drawMonthlyGrid(pdf, selectedDate, monthEvents);
  
  // Save PDF
  const filename = `monthly-calendar-${format(selectedDate, 'yyyy-MM')}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ Monthly calendar exported: ${filename}`);
};

const drawMonthlyHeader = (pdf: jsPDF, selectedDate: Date): void => {
  const { pageWidth, margins, fonts } = MONTHLY_CONFIG;
  const centerX = pageWidth / 2;

  // Title
  pdf.setFontSize(fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MONTHLY CALENDAR', centerX, margins + 20, { align: 'center' });

  // Month and Year
  pdf.setFontSize(fonts.monthYear);
  pdf.setFont('helvetica', 'normal');
  const monthYear = format(selectedDate, 'MMMM yyyy');
  pdf.text(monthYear, centerX, margins + 40, { align: 'center' });

  // Header line
  pdf.setLineWidth(1);
  pdf.line(margins, margins + 60, pageWidth - margins, margins + 60);
};

const drawMonthlyGrid = (pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]): void => {
  const { pageWidth, margins, headerHeight, weekHeight, dayWidth, fonts } = MONTHLY_CONFIG;
  
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  // Get weeks that include this month
  const firstWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const lastWeekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const weeks = eachWeekOfInterval({
    start: firstWeekStart,
    end: lastWeekEnd
  }, { weekStartsOn: 1 });

  // Draw day headers
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const gridStartY = margins + headerHeight;
  
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const x = margins + dayIndex * dayWidth;
    
    // Day header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(x, gridStartY, dayWidth, 25, 'F');
    
    // Day header border
    pdf.setDrawColor(100, 100, 100);
    pdf.rect(x, gridStartY, dayWidth, 25, 'D');
    
    // Day name
    pdf.setFontSize(fonts.dayHeader);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayNames[dayIndex], x + dayWidth / 2, gridStartY + 16, { align: 'center' });
  }

  // Draw weeks
  weeks.forEach((weekStart, weekIndex) => {
    const weekY = gridStartY + 25 + (weekIndex * weekHeight);
    
    // Draw each day of the week
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayDate = addDays(weekStart, dayIndex);
      const x = margins + dayIndex * dayWidth;
      
      // Day cell background - different for current month vs other months
      const isCurrentMonth = isSameMonth(dayDate, selectedDate);
      pdf.setFillColor(isCurrentMonth ? 255 : 250, isCurrentMonth ? 255 : 250, isCurrentMonth ? 255 : 250);
      pdf.rect(x, weekY, dayWidth, weekHeight, 'F');
      
      // Day cell border
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(x, weekY, dayWidth, weekHeight, 'D');
      
      // Day number
      pdf.setFontSize(fonts.dayNumber);
      pdf.setFont('helvetica', isCurrentMonth ? 'bold' : 'normal');
      pdf.setTextColor(isCurrentMonth ? 0 : 150, isCurrentMonth ? 0 : 150, isCurrentMonth ? 0 : 150);
      pdf.text(format(dayDate, 'd'), x + 5, weekY + 15);
      
      // Draw events for this day
      if (isCurrentMonth) {
        drawDayEvents(pdf, dayDate, events, x, weekY + 20, dayWidth - 4, weekHeight - 25);
      }
    }
  });
};

const drawDayEvents = (
  pdf: jsPDF,
  dayDate: Date,
  events: CalendarEvent[],
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  const { fonts } = MONTHLY_CONFIG;
  
  // Filter events for this specific day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return format(eventDate, 'yyyy-MM-dd') === format(dayDate, 'yyyy-MM-dd');
  });

  // Sort events by start time
  dayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Draw up to 4 events per day
  const maxEvents = Math.floor(height / 12);
  const visibleEvents = dayEvents.slice(0, maxEvents);
  
  visibleEvents.forEach((event, index) => {
    const eventY = y + (index * 12);
    
    // Event background
    const eventType = getEventType(event);
    setEventColor(pdf, eventType);
    pdf.rect(x + 2, eventY, width - 4, 10, 'F');
    
    // Event text
    pdf.setFontSize(fonts.eventText);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    const eventTime = format(new Date(event.startTime), 'HH:mm');
    const eventTitle = event.title.replace(' Appointment', '').substring(0, 15);
    const eventText = `${eventTime} ${eventTitle}`;
    
    pdf.text(eventText, x + 3, eventY + 7, { maxWidth: width - 6 });
  });
  
  // Show "more events" indicator if needed
  if (dayEvents.length > maxEvents) {
    const moreY = y + (maxEvents * 12);
    pdf.setFontSize(fonts.eventText - 1);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`+${dayEvents.length - maxEvents} more`, x + 3, moreY + 7);
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

const setEventColor = (pdf: jsPDF, eventType: 'simplepractice' | 'google' | 'holiday'): void => {
  switch (eventType) {
    case 'simplepractice':
      pdf.setFillColor(173, 216, 230); // Light blue
      break;
    case 'google':
      pdf.setFillColor(144, 238, 144); // Light green
      break;
    case 'holiday':
      pdf.setFillColor(255, 228, 181); // Light orange
      break;
  }
};

export default exportMonthlyCalendar;
