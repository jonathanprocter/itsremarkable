import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Helper function to format time in military format
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
}

// Helper function to determine event type and styling
interface EventTypeInfo {
  isSimplePractice: boolean;
  isGoogle: boolean;
  isHoliday: boolean;
  sourceText: string;
}

function getEventTypeInfo(event: CalendarEvent): EventTypeInfo {
  // Check for holidays first
  const isHoliday = 
    event.title.toLowerCase().includes('holiday') ||
    event.calendarId === 'en.usa#holiday@group.v.calendar.google.com' ||
    event.source === 'holiday';

  // Check for specific Google Calendar events (non-appointments)
  const isGoogle = !isHoliday && (
    event.title.toLowerCase().includes('haircut') ||
    event.title.toLowerCase().includes('dan re:') ||
    event.title.toLowerCase().includes('blake') ||
    event.title.toLowerCase().includes('phone call')
  );

  // All other appointments are SimplePractice
  const isSimplePractice = !isHoliday && !isGoogle && event.title.toLowerCase().includes('appointment');

  // Determine source text for display
  let sourceText = '';
  if (isSimplePractice) {
    sourceText = 'SIMPLEPRACTICE';
  } else if (isGoogle) {
    sourceText = 'GOOGLE CALENDAR';
  } else if (isHoliday) {
    sourceText = 'HOLIDAYS IN UNITED STATES';
  } else {
    sourceText = (event.source || 'MANUAL').toUpperCase();
  }

  return {
    isSimplePractice,
    isGoogle,
    isHoliday,
    sourceText
  };
}

// Time slots from 06:00 to 23:30
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

// Scaled configuration for standard US Letter portrait (612x792)
const SCALED_DAILY_CONFIG = {
  // Standard US Letter portrait
  pageWidth: 612,
  pageHeight: 792,
  margin: 25,
  
  // Header configuration - scaled proportionally
  headerHeight: 70,
  statsHeight: 35,
  legendHeight: 25,
  
  get totalHeaderHeight() {
    return this.headerHeight + this.statsHeight + this.legendHeight;
  },
  
  // Grid configuration - scaled to fit
  timeColumnWidth: 60,
  
  get timeSlotHeight() {
    // Calculate to fit all 36 time slots in available space
    const availableHeight = this.pageHeight - (this.margin * 2) - this.totalHeaderHeight - 60; // 60 for footer
    return Math.floor(availableHeight / 36);
  },
  
  get gridStartY() {
    return this.margin + this.totalHeaderHeight;
  },
  
  get dayColumnWidth() {
    return this.pageWidth - (this.margin * 2) - this.timeColumnWidth;
  },
  
  // Typography - scaled down slightly
  fonts: {
    title: 18,
    subtitle: 12,
    stats: 12,
    timeSlot: 11,
    timeSlotHalf: 9,
    eventTitle: 9,
    eventSource: 8,
    eventTime: 8
  },
  
  colors: {
    black: [0, 0, 0],
    white: [255, 255, 255],
    lightGray: [243, 244, 246],
    mediumGray: [229, 231, 235],
    darkGray: [107, 114, 128],
    simplePracticeBlue: [99, 102, 241],
    googleGreen: [5, 150, 105],
    holidayYellow: [217, 119, 6]
  }
};

export const drawScaledDailyTemplate = (
  pdf: jsPDF,
  selectedDate: Date,
  events: CalendarEvent[],
  pageNumber: number,
  dayOfWeek: number
): void => {
  const config = SCALED_DAILY_CONFIG;
  const margin = config.margin;
  const pageWidth = config.pageWidth;
  const pageHeight = config.pageHeight;
  
  // Filter events for the selected day
  const dayEvents = events.filter(event => {
    const eventDate = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  console.log(`📅 Filtered ${dayEvents.length} events for ${selectedDate.toDateString()}`);
  
  // === HEADER SECTION ===
  // Background
  pdf.setFillColor(...config.colors.lightGray);
  pdf.rect(margin, margin, pageWidth - (margin * 2), config.headerHeight, 'F');
  
  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(config.fonts.title);
  pdf.setTextColor(...config.colors.black);
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(`${dayName}, ${dateStr}`, pageWidth / 2, margin + 25, { align: 'center' });
  
  // Navigation buttons
  const navY = margin + 40;
  const buttonWidth = 60;
  const buttonHeight = 14;
  
  // Weekly Overview button
  pdf.setFillColor(...config.colors.white);
  pdf.setDrawColor(...config.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.rect(margin + 20, navY, buttonWidth + 20, buttonHeight, 'FD');
  pdf.setFontSize(7);
  pdf.setTextColor(...config.colors.black);
  pdf.text('Weekly Overview', margin + 30, navY + 9);
  
  // === STATS SECTION ===
  const statsY = margin + config.headerHeight;
  const contentWidth = pageWidth - (margin * 2);
  
  // Calculate stats
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, e) => {
    const startTime = e.startTime instanceof Date ? e.startTime : new Date(e.startTime);
    const endTime = e.endTime instanceof Date ? e.endTime : new Date(e.endTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return sum;
    }
    
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const availableHours = 17.5 - totalHours;
  const freeTimePercentage = totalHours > 0 ? Math.round((availableHours / 17.5) * 100) : 100;
  
  // Stats background
  pdf.setFillColor(...config.colors.lightGray);
  pdf.rect(margin, statsY, contentWidth, config.statsHeight, 'F');
  
  // Draw stats
  const cardWidth = contentWidth / 4;
  const stats = [
    { label: 'Appointments', value: totalEvents.toString() },
    { label: 'Scheduled', value: `${totalHours.toFixed(1)}h` },
    { label: 'Available', value: `${availableHours.toFixed(1)}h` },
    { label: 'Free Time', value: `${freeTimePercentage}%` }
  ];
  
  stats.forEach((stat, index) => {
    const x = margin + (index * cardWidth);
    
    if (index > 0) {
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(...config.colors.mediumGray);
      pdf.line(x, statsY + 8, x, statsY + config.statsHeight - 8);
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(config.fonts.stats);
    pdf.setTextColor(...config.colors.black);
    pdf.text(stat.value, x + cardWidth / 2, statsY + 15, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...config.colors.darkGray);
    pdf.text(stat.label, x + cardWidth / 2, statsY + 25, { align: 'center' });
  });
  
  // === LEGEND SECTION ===
  const legendY = statsY + config.statsHeight;
  pdf.setFillColor(...config.colors.white);
  pdf.rect(margin, legendY, contentWidth, config.legendHeight, 'F');
  
  const legendItems = [
    { label: 'SimplePractice', color: config.colors.simplePracticeBlue },
    { label: 'Google Calendar', color: config.colors.googleGreen },
    { label: 'Holidays', color: config.colors.holidayYellow }
  ];
  
  const legendItemWidth = contentWidth / 3;
  legendItems.forEach((item, index) => {
    const x = margin + (index * legendItemWidth) + legendItemWidth / 2;
    
    // Color box
    pdf.setFillColor(...item.color);
    pdf.rect(x - 40, legendY + 7, 10, 10, 'F');
    
    // Label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...config.colors.black);
    pdf.text(item.label, x - 25, legendY + 13);
  });
  
  // === TIME GRID ===
  const gridStartY = config.gridStartY;
  const timeColumnWidth = config.timeColumnWidth;
  const dayColumnWidth = config.dayColumnWidth;
  const timeSlotHeight = config.timeSlotHeight;
  
  // Grid background
  pdf.setFillColor(...config.colors.white);
  pdf.rect(margin, gridStartY, contentWidth, timeSlotHeight * TIME_SLOTS.length, 'F');
  
  // Time slots
  TIME_SLOTS.forEach((time, index) => {
    const y = gridStartY + (index * timeSlotHeight);
    const isHour = time.endsWith(':00');
    
    // Alternating backgrounds
    if (index % 2 === 0) {
      pdf.setFillColor(...config.colors.lightGray);
      pdf.rect(margin + timeColumnWidth, y, dayColumnWidth, timeSlotHeight, 'F');
    }
    
    // Time label
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setFontSize(isHour ? config.fonts.timeSlot : config.fonts.timeSlotHalf);
    pdf.setTextColor(...config.colors.darkGray);
    pdf.text(time, margin + timeColumnWidth - 5, y + timeSlotHeight / 2 + 3, { align: 'right' });
    
    // Horizontal line
    pdf.setLineWidth(isHour ? 1 : 0.5);
    pdf.setDrawColor(...(isHour ? config.colors.mediumGray : config.colors.lightGray));
    pdf.line(margin, y, margin + contentWidth, y);
  });
  
  // Vertical lines
  pdf.setLineWidth(1);
  pdf.setDrawColor(...config.colors.mediumGray);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, gridStartY + timeSlotHeight * TIME_SLOTS.length);
  
  // === APPOINTMENTS ===
  dayEvents.forEach(event => {
    const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return;
    }
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const startSlot = (startHour - 6) * 2 + Math.floor(startMinute / 30);
    const endSlot = (endHour - 6) * 2 + Math.ceil(endMinute / 30);
    
    if (startSlot < 0 || startSlot >= TIME_SLOTS.length) return;
    
    const y = gridStartY + (startSlot * timeSlotHeight);
    const height = Math.max((endSlot - startSlot) * timeSlotHeight - 2, timeSlotHeight - 2);
    const x = margin + timeColumnWidth + 2;
    const width = dayColumnWidth - 4;
    
    const eventType = getEventTypeInfo(event);
    
    // Event background
    pdf.setFillColor(...config.colors.white);
    pdf.rect(x, y, width, height, 'F');
    
    // Event border
    if (eventType.isSimplePractice) {
      pdf.setLineWidth(2);
      pdf.setDrawColor(...config.colors.simplePracticeBlue);
      pdf.line(x, y, x, y + height); // Left border only
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, height);
    } else if (eventType.isGoogle) {
      pdf.setLineWidth(1);
      pdf.setDrawColor(...config.colors.googleGreen);
      pdf.setLineDash([2, 2]);
      pdf.rect(x, y, width, height);
      pdf.setLineDash([]);
    } else if (eventType.isHoliday) {
      pdf.setLineWidth(1);
      pdf.setDrawColor(...config.colors.holidayYellow);
      pdf.setFillColor(...config.colors.holidayYellow);
      pdf.rect(x, y, width, height, 'FD');
    }
    
    // Event text
    const textX = x + 5;
    let textY = y + 12;
    
    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(config.fonts.eventTitle);
    pdf.setTextColor(...config.colors.black);
    const title = event.title.replace(' Appointment', '').replace('🔒 ', '');
    const titleLines = pdf.splitTextToSize(title, width - 10);
    titleLines.forEach((line: string) => {
      pdf.text(line, textX, textY);
      textY += 10;
    });
    
    // Time
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(config.fonts.eventTime);
    pdf.setTextColor(...config.colors.darkGray);
    pdf.text(`${formatTime(startTime)} - ${formatTime(endTime)}`, textX, textY);
  });
  
  // === FOOTER ===
  const footerY = pageHeight - margin - 30;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...config.colors.darkGray);
  
  // Page number
  pdf.text(`Page ${pageNumber} of 8`, pageWidth / 2, footerY, { align: 'center' });
  
  // Navigation
  const navTexts = [];
  if (pageNumber > 2) navTexts.push('< Previous Day');
  navTexts.push('Weekly Overview');
  if (pageNumber < 8) navTexts.push('Next Day >');
  
  const navSpacing = 100;
  const navStartX = pageWidth / 2 - ((navTexts.length - 1) * navSpacing / 2);
  
  navTexts.forEach((text, index) => {
    pdf.text(text, navStartX + (index * navSpacing), footerY + 15, { align: 'center' });
  });
  
  console.log(`✅ Scaled daily template applied for ${dayName}`);
};