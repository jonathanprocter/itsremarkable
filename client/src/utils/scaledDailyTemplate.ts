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

// Helper to convert color array to individual values for jsPDF
const setColor = (pdf: jsPDF, colorArray: number[], method: 'fill' | 'draw' | 'text') => {
  const [r, g, b] = colorArray;
  switch (method) {
    case 'fill':
      pdf.setFillColor(r, g, b);
      break;
    case 'draw':
      pdf.setDrawColor(r, g, b);
      break;
    case 'text':
      pdf.setTextColor(r, g, b);
      break;
  }
};

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
  setColor(pdf, config.colors.lightGray, 'fill');
  pdf.rect(margin, margin, pageWidth - (margin * 2), config.headerHeight, 'F');
  
  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(config.fonts.title);
  setColor(pdf, config.colors.black, 'text');
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
  setColor(pdf, config.colors.white, 'fill');
  setColor(pdf, config.colors.mediumGray, 'draw');
  pdf.setLineWidth(1);
  pdf.rect(margin + 20, navY, buttonWidth + 20, buttonHeight, 'FD');
  pdf.setFontSize(7);
  setColor(pdf, config.colors.black, 'text');
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
  setColor(pdf, config.colors.lightGray, 'fill');
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
      setColor(pdf, config.colors.mediumGray, 'draw');
      pdf.line(x, statsY + 8, x, statsY + config.statsHeight - 8);
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(config.fonts.stats);
    setColor(pdf, config.colors.black, 'text');
    pdf.text(stat.value, x + cardWidth / 2, statsY + 15, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setColor(pdf, config.colors.darkGray, 'text');
    pdf.text(stat.label, x + cardWidth / 2, statsY + 25, { align: 'center' });
  });
  
  // === LEGEND SECTION ===
  const legendY = statsY + config.statsHeight;
  setColor(pdf, config.colors.white, 'fill');
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
    setColor(pdf, item.color, 'fill');
    pdf.rect(x - 40, legendY + 7, 10, 10, 'F');
    
    // Label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    setColor(pdf, config.colors.black, 'text');
    pdf.text(item.label, x - 25, legendY + 13);
  });
  
  // === TIME GRID ===
  const gridStartY = config.gridStartY;
  const timeColumnWidth = config.timeColumnWidth;
  const dayColumnWidth = config.dayColumnWidth;
  const timeSlotHeight = config.timeSlotHeight;
  
  // Grid background
  setColor(pdf, config.colors.white, 'fill');
  pdf.rect(margin, gridStartY, contentWidth, timeSlotHeight * TIME_SLOTS.length, 'F');
  
  // Time slots
  TIME_SLOTS.forEach((time, index) => {
    const y = gridStartY + (index * timeSlotHeight);
    const isHour = time.endsWith(':00');
    
    // Alternating backgrounds
    if (index % 2 === 0) {
      setColor(pdf, config.colors.lightGray, 'fill');
      pdf.rect(margin + timeColumnWidth, y, dayColumnWidth, timeSlotHeight, 'F');
    }
    
    // Time label
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setFontSize(isHour ? config.fonts.timeSlot : config.fonts.timeSlotHalf);
    setColor(pdf, config.colors.darkGray, 'text');
    pdf.text(time, margin + timeColumnWidth - 5, y + timeSlotHeight / 2 + 3, { align: 'right' });
    
    // Horizontal line
    pdf.setLineWidth(isHour ? 1 : 0.5);
    setColor(pdf, isHour ? config.colors.mediumGray : config.colors.lightGray, 'draw');
    pdf.line(margin, y, margin + contentWidth, y);
  });
  
  // Vertical lines
  pdf.setLineWidth(1);
  setColor(pdf, config.colors.mediumGray, 'draw');
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
    setColor(pdf, config.colors.white, 'fill');
    pdf.rect(x, y, width, height, 'F');
    
    // Event border
    if (eventType.isSimplePractice) {
      pdf.setLineWidth(2);
      setColor(pdf, config.colors.simplePracticeBlue, 'draw');
      pdf.line(x, y, x, y + height); // Left border only
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, height);
    } else if (eventType.isGoogle) {
      pdf.setLineWidth(1);
      setColor(pdf, config.colors.googleGreen, 'draw');
      // Note: jsPDF doesn't support setLineDash in some versions, so we'll use solid line
      pdf.rect(x, y, width, height);
    } else if (eventType.isHoliday) {
      pdf.setLineWidth(1);
      setColor(pdf, config.colors.holidayYellow, 'draw');
      setColor(pdf, config.colors.holidayYellow, 'fill');
      pdf.rect(x, y, width, height, 'FD');
    }
    
    // Check if event has notes or action items
    const hasNotes = event.notes && event.notes.trim().length > 0;
    const hasActionItems = event.actionItems && event.actionItems.trim().length > 0;
    const use3ColumnLayout = hasNotes || hasActionItems;
    
    if (use3ColumnLayout && height >= 50) {
      // 3-column layout for events with notes/action items
      const columnWidth = width / 3;
      
      // Left column - Event info
      const leftX = x + 5;
      let leftY = y + 10;
      
      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(config.fonts.eventTitle);
      setColor(pdf, config.colors.black, 'text');
      const title = event.title.replace(' Appointment', '').replace('🔒 ', '');
      const titleLines = pdf.splitTextToSize(title, columnWidth - 10);
      titleLines.forEach((line: string) => {
        pdf.text(line, leftX, leftY);
        leftY += 8;
      });
      
      // Source
      leftY += 2;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6);
      setColor(pdf, config.colors.darkGray, 'text');
      pdf.text(eventType.sourceText, leftX, leftY);
      
      // Time
      leftY += 8;
      pdf.setFontSize(config.fonts.eventTime);
      pdf.text(`${formatTime(startTime)} - ${formatTime(endTime)}`, leftX, leftY);
      
      // Column dividers
      pdf.setLineWidth(0.5);
      setColor(pdf, config.colors.lightGray, 'draw');
      pdf.line(x + columnWidth, y + 5, x + columnWidth, y + height - 5);
      pdf.line(x + columnWidth * 2, y + 5, x + columnWidth * 2, y + height - 5);
      
      // Center column - Event Notes
      if (hasNotes) {
        const centerX = x + columnWidth + 5;
        let centerY = y + 10;
        
        // Header
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6);
        setColor(pdf, config.colors.black, 'text');
        pdf.text('Event Notes', centerX, centerY);
        
        // Notes content
        centerY += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5);
        const notes = (event.notes || '').split('\n').filter(n => n.trim());
        notes.forEach((note: string) => {
          const noteLines = pdf.splitTextToSize(`• ${note.trim()}`, columnWidth - 10);
          noteLines.forEach((line: string) => {
            pdf.text(line, centerX, centerY);
            centerY += 5;
          });
        });
      }
      
      // Right column - Action Items
      if (hasActionItems) {
        const rightX = x + columnWidth * 2 + 5;
        let rightY = y + 10;
        
        // Header
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6);
        setColor(pdf, config.colors.black, 'text');
        pdf.text('Action Items', rightX, rightY);
        
        // Action items content
        rightY += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5);
        const actions = (event.actionItems || '').split('\n').filter(a => a.trim());
        actions.forEach((action: string) => {
          const actionLines = pdf.splitTextToSize(`• ${action.trim()}`, columnWidth - 10);
          actionLines.forEach((line: string) => {
            pdf.text(line, rightX, rightY);
            rightY += 5;
          });
        });
      }
    } else {
      // Simple layout for events without notes/action items
      const textX = x + 5;
      let textY = y + 12;
      
      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(config.fonts.eventTitle);
      setColor(pdf, config.colors.black, 'text');
      const title = event.title.replace(' Appointment', '').replace('🔒 ', '');
      const titleLines = pdf.splitTextToSize(title, width - 10);
      titleLines.forEach((line: string) => {
        pdf.text(line, textX, textY);
        textY += 10;
      });
      
      // Time
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(config.fonts.eventTime);
      setColor(pdf, config.colors.darkGray, 'text');
      pdf.text(`${formatTime(startTime)} - ${formatTime(endTime)}`, textX, textY);
    }
  });
  
  // === FOOTER ===
  const footerY = pageHeight - margin - 30;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setColor(pdf, config.colors.darkGray, 'text');
  
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