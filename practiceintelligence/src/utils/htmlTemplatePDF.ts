import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { getWeekNumber } from './dateUtils';
import { generateTimeSlots } from './timeSlots';

// Helper function to format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
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

// reMarkable Paper Pro specific configuration for daily view - reMarkable dimensions (1.2x scaled)
const REMARKABLE_DAILY_CONFIG = {
  // reMarkable Pro portrait dimensions scaled 1.2x for better screen fit
  pageWidth: 608,   // 507 * 1.2 = 608.4
  pageHeight: 812,  // 677 * 1.2 = 812.4
  margin: 24,       // 20 * 1.2 = 24

  // Header configuration - scaled 1.2x for better visibility
  headerHeight: 84,  // 70 * 1.2 = 84
  statsHeight: 42,   // 35 * 1.2 = 42
  legendHeight: 30,  // 25 * 1.2 = 30

  get totalHeaderHeight() {
    return this.headerHeight + this.statsHeight + this.legendHeight;
  },

  // Grid configuration - optimized for reMarkable with 36 time slots (6:00-23:30) - scaled 1.2x
  timeColumnWidth: 90,  // 75 * 1.2 = 90

  get timeSlotHeight() {
    // Calculate slot height to fit 36 slots in available space
    const availableHeight = this.pageHeight - (this.margin * 2) - this.totalHeaderHeight;
    return Math.floor(availableHeight / 36); // 36 slots from 6:00-23:30
  },

  get gridStartY() {
    return this.margin + this.totalHeaderHeight;
  },

  get dayColumnWidth() {
    return this.pageWidth - (this.margin * 2) - this.timeColumnWidth;
  },

  // Typography - optimized for reMarkable readability - scaled 1.2x
  fonts: {
    title: 17,         // 14 * 1.2 = 16.8 ≈ 17
    subtitle: 14,      // 12 * 1.2 = 14.4 ≈ 14
    stats: 12,         // 10 * 1.2 = 12
    timeSlot: 10,      // 8 * 1.2 = 9.6 ≈ 10
    eventTitle: 28,    // Increased from 22 to 28 for much better visibility
    eventSource: 24,   // Increased from 18 to 24 for much better visibility
    eventTime: 26      // Increased from 20 to 26 for much better visibility
  },

  colors: {
    black: [0, 0, 0],
    white: [255, 255, 255],
    lightGray: [245, 245, 245],
    mediumGray: [200, 200, 200],
    darkGray: [100, 100, 100],
    simplePracticeBlue: [66, 133, 244],
    googleGreen: [52, 168, 83],
    holidayYellow: [251, 188, 4]
  }
};

// HTML Template Configuration - Professional calendar layout
const HTML_TEMPLATE_CONFIG = {
  // Page dimensions - reMarkable Paper Pro landscape (239mm × 179mm)
  pageWidth: 677,   // 239mm in points (239 * 72 / 25.4)
  pageHeight: 507,  // 179mm in points (179 * 72 / 25.4)

  // Layout structure - optimized for reMarkable Pro landscape
  margin: 12,
  headerHeight: 45,
  statsHeight: 35,
  legendHeight: 20,

  // Total header section height
  get totalHeaderHeight() {
    return this.headerHeight + this.statsHeight + this.legendHeight;
  },

  // Grid configuration - optimized for reMarkable Pro landscape
  timeColumnWidth: 70,
  get gridStartY() {
    return this.margin + this.totalHeaderHeight; // No gap for cohesive flow
  },
  timeSlotHeight: 18, // Optimal height for text readability

  // Text and padding configuration
  cellPadding: 4,
  eventPadding: 3,

  // Calculate day column width dynamically
  get dayColumnWidth() {
    return (this.pageWidth - (this.margin * 2) - this.timeColumnWidth) / 7;
  },

  // Colors for visual clarity
  colors: {
    black: [0, 0, 0],
    white: [255, 255, 255],
    lightGray: [248, 248, 248],
    mediumGray: [220, 220, 220],
    darkGray: [180, 180, 180],
    simplePracticeBlue: [66, 133, 244],
    googleGreen: [52, 168, 83],
    holidayYellow: [251, 188, 4]
  }
};

// Time slots from 06:00 to 23:30 (matches HTML template)
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

// Compact time slots for reMarkable daily view (hourly only)
const REMARKABLE_TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00'
];

export const exportHTMLTemplatePDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  isDailyView: boolean = false
): Promise<void> => {
  try {
    console.log('📄 Starting PDF export...');
    let pdf;

    if (isDailyView) {
      // 8.5 x 11 inch portrait format for daily view
      pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [612, 792] // 8.5 x 11 inches
      });
    } else {
      // 8.5 x 11 inch landscape format for weekly view
      pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: [792, 612] // 11 x 8.5 inches (landscape)
      });
    }

    // Set default font - use helvetica instead of arial for better compatibility
    pdf.setFont('helvetica', 'normal');

  if (isDailyView) {
    // === DAILY VIEW LAYOUT - COMPLETELY REWRITTEN ===
    console.log('=== DAILY EVENT DEBUGGING ===');
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getFullYear() === weekStartDate.getFullYear() &&
             eventDate.getMonth() === weekStartDate.getMonth() &&
             eventDate.getDate() === weekStartDate.getDate();
    });

    console.log(`Found ${dayEvents.length} events for ${weekStartDate.toDateString()}`);

    dayEvents.forEach(event => {
      const eventType = getEventTypeInfo(event);
      console.log({
        title: event.title,
        source: event.source,
        calendarId: event.calendarId,
        startTime: event.startTime.toLocaleString(),
        eventType: eventType,
        shouldBeSimplePractice: eventType.isSimplePractice,
        shouldBeGoogle: eventType.isGoogle,
        shouldBeHoliday: eventType.isHoliday
      });
    });

    drawDailyHeader(pdf, weekStartDate, events, 1, 1);
    drawDailyGrid(pdf, weekStartDate, events);
    drawDailyFooter(pdf, weekStartDate, 1, 1);

    // Save the PDF with daily filename
    const filename = `daily-planner-${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}.pdf`;

    try {
      pdf.save(filename);
      console.log(`✅ Daily Template PDF exported: ${filename}`);
      console.log('✅ PDF download should have started automatically');
    } catch (error) {
      console.error('❌ Error saving daily PDF:', error);
      alert('Sorry, something went wrong while generating your daily PDF. Please try again or contact support if this issue persists.\n\nError details: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  } else {
    // === WEEKLY VIEW LAYOUT ===
    drawHeader(pdf, weekStartDate, weekEndDate, events);
    drawCalendarGrid(pdf, weekStartDate, events);

    // Save the PDF with weekly filename
    const filename = `weekly-planner-${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}.pdf`;

    try {
      pdf.save(filename);
      console.log(`✅ HTML Template PDF exported: ${filename}`);
      console.log('✅ PDF download should have started automatically');
    } catch (error) {
      console.error('❌ Error saving weekly PDF:', error);
      alert('Sorry, something went wrong while generating your weekly PDF. Please try again or contact support if this issue persists.\n\nError details: ' + (error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }
  } catch (error) {
    // Catch-all error handler for the entire function
    console.error('❌ Critical PDF generation error:', error);
    alert('Sorry, something went wrong while generating your PDF. Please try again or contact support if this issue persists.\n\nError details: ' + (error instanceof Error ? error.message : 'Unknown error'));
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export function drawDailyHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[], pageNumber: number = 1, dayOfWeek: number = 1): void {
  const { margin, pageWidth, pageHeight } = REMARKABLE_DAILY_CONFIG;

  // Page border - full page
  pdf.setLineWidth(2);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

  // Filter events for the selected day  
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.getFullYear() === selectedDate.getFullYear() &&
           eventDate.getMonth() === selectedDate.getMonth() &&
           eventDate.getDate() === selectedDate.getDate();
  });

  // === TITLE SECTION ===
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.text('DAILY PLANNER', pageWidth / 2, margin + 20, { align: 'center' });

  // Date info
  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.subtitle);
  pdf.setFont('helvetica', 'normal');
  const dateText = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateText, pageWidth / 2, margin + 35, { align: 'center' });

  // Navigation info matching daily console format
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const weekNumber = getWeekNumber(selectedDate);
  const navText = `Week ${weekNumber} • Day ${dayOfWeek} of 7 • Page ${pageNumber} of 8`;
  pdf.text(navText, pageWidth / 2, margin + 50, { align: 'center' });

  // Navigation buttons (visual representation)
  const navY = margin + 60;
  const buttonWidth = 60;
  const buttonHeight = 16;

  // Back to Week button
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.rect(margin + 20, navY, buttonWidth + 20, buttonHeight, 'FD');
  pdf.setFontSize(7);
  pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.text('Weekly Overview', margin + 30, navY + 10);

  // Previous/Next day buttons
  const rightButtonX = pageWidth - margin - 80;
  pdf.rect(rightButtonX, navY, 30, buttonHeight, 'FD');
  pdf.rect(rightButtonX + 35, navY, 30, buttonHeight, 'FD');
  pdf.text('Prev', rightButtonX + 12, navY + 10);
  pdf.text('Next', rightButtonX + 47, navY + 10);

  // === STATS SECTION ===
  const statsY = margin + REMARKABLE_DAILY_CONFIG.headerHeight;
  const contentWidth = pageWidth - (margin * 2);

  // Calculate stats
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, e) => {
    const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const availableHours = 17.5 - totalHours; // Business hours 6am-11:30pm
  const freeTimePercentage = totalHours > 0 ? Math.round((availableHours / 17.5) * 100) : 100;

  // Stats background
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
  pdf.rect(margin, statsY, contentWidth, REMARKABLE_DAILY_CONFIG.statsHeight, 'F');

  // Stats border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
  pdf.rect(margin, statsY, contentWidth, REMARKABLE_DAILY_CONFIG.statsHeight);

  // Draw stat cards
  const cardWidth = contentWidth / 4;
  const stats = [
    { label: 'Appointments', value: totalEvents.toString() },
    { label: 'Scheduled', value: `${totalHours.toFixed(1)}h` },
    { label: 'Available', value: `${availableHours.toFixed(1)}h` },
    { label: 'Free Time', value: `${freeTimePercentage}%` }
  ];

  stats.forEach((stat, index) => {
    const x = margin + (index * cardWidth);

    // Vertical dividers
    if (index > 0) {
      pdf.setLineWidth(1);
      pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
      pdf.line(x, statsY + 8, x, statsY + REMARKABLE_DAILY_CONFIG.statsHeight - 8);
    }

    // Stat value (large, bold)
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
    pdf.text(stat.value, x + cardWidth / 2, statsY + 18, { align: 'center' });

    // Stat label (smaller)
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x + cardWidth / 2, statsY + 32, { align: 'center' });
  });

  // === LEGEND SECTION ===
  const legendY = statsY + REMARKABLE_DAILY_CONFIG.statsHeight;

  // Legend background
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
  pdf.rect(margin, legendY, contentWidth, REMARKABLE_DAILY_CONFIG.legendHeight, 'F');

  // Legend border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
  pdf.rect(margin, legendY, contentWidth, REMARKABLE_DAILY_CONFIG.legendHeight);

  // Legend items
  const legendItems = [
    { label: 'SimplePractice', color: REMARKABLE_DAILY_CONFIG.colors.simplePracticeBlue, style: 'left-border' },
    { label: 'Google Calendar', color: REMARKABLE_DAILY_CONFIG.colors.googleGreen, style: 'dashed' },
    { label: 'Holidays in United States', color: REMARKABLE_DAILY_CONFIG.colors.holidayYellow, style: 'filled' }
  ];

  const itemWidth = contentWidth / legendItems.length;

  legendItems.forEach((item, index) => {
    const x = margin + (index * itemWidth) + 20;
    const symbolY = legendY + 10;
    const symbolSize = 12;

    // Draw legend symbol
    if (item.style === 'left-border') {
      pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
      pdf.setDrawColor(...item.color);
      pdf.setLineWidth(3);
      pdf.line(x, symbolY, x, symbolY + symbolSize);
    } else if (item.style === 'dashed') {
      pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...item.color);
      pdf.setLineWidth(1);
      pdf.setLineDash([2, 1]);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
      pdf.setLineDash([]);
    } else {
      pdf.setFillColor(...item.color);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
    }

    // Legend text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
    pdf.text(item.label, x + symbolSize + 6, symbolY + 8);
  });
}

export function drawDailyFooter(pdf: jsPDF, selectedDate: Date, pageNumber: number = 1, dayOfWeek: number = 1): void {
  const { margin, pageWidth, pageHeight } = REMARKABLE_DAILY_CONFIG;

  // Footer area
  const footerY = pageHeight - margin - 40;
  const footerHeight = 30;

  // Footer background
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
  pdf.rect(margin, footerY, pageWidth - (margin * 2), footerHeight, 'F');

  // Footer border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
  pdf.rect(margin, footerY, pageWidth - (margin * 2), footerHeight);

  // BIDIRECTIONAL navigation text exactly like weekly package
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);

  // Get day names for complete bidirectional navigation
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDayName = dayNames[dayOfWeek - 1];

  // Left side: Weekly Overview link (bidirectional)
  pdf.text('Return to Weekly Overview (Page 1)', margin + 10, footerY + 12);

  // Center: Current page info with bidirectional context
  const centerText = `${currentDayName} - Page ${pageNumber} of 8`;
  pdf.text(centerText, pageWidth / 2, footerY + 12, { align: 'center' });

  // Right side: Day navigation (bidirectional)
  const prevDay = dayOfWeek > 1 ? dayOfWeek - 1 : 7;
  const nextDay = dayOfWeek < 7 ? dayOfWeek + 1 : 1;
  const navText = `← Page ${prevDay + 1} | Page ${nextDay + 1} →`;
  pdf.text(navText, pageWidth - margin - 10, footerY + 12, { align: 'right' });

  // Additional navigation helper
  pdf.setFontSize(7);
  pdf.setTextColor(100, 100, 100);
  pdf.text('All pages are bidirectionally linked', pageWidth / 2, footerY + 25, { align: 'center' });
}

function drawHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, events: CalendarEvent[]): void {
  const { margin } = HTML_TEMPLATE_CONFIG;
  const totalHeaderHeight = HTML_TEMPLATE_CONFIG.headerHeight + HTML_TEMPLATE_CONFIG.statsHeight + HTML_TEMPLATE_CONFIG.legendHeight;

  // Page border
  pdf.setLineWidth(2);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.rect(margin, margin, HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2), HTML_TEMPLATE_CONFIG.pageHeight - (margin * 2));

  // Complete header background (title + stats + legend)
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
  pdf.rect(margin, margin, HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2), totalHeaderHeight, 'F');

  // === TITLE SECTION ===
  // Main title - optimized for reMarkable Pro
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.text('WEEKLY PLANNER', HTML_TEMPLATE_CONFIG.pageWidth / 2, margin + 22, { align: 'center' });

  // Week info - properly positioned
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  const weekNumber = getWeekNumber(weekStartDate);
  const weekText = `${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • Week ${weekNumber}`;
  pdf.text(weekText, HTML_TEMPLATE_CONFIG.pageWidth / 2, margin + 46, { align: 'center' });

  // === STATS SECTION ===
  const statsY = margin + HTML_TEMPLATE_CONFIG.headerHeight;
  const contentWidth = HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2);

  // Stats background
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.lightGray);
  pdf.rect(margin, statsY, contentWidth, HTML_TEMPLATE_CONFIG.statsHeight, 'F');

  // Stats border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
  pdf.rect(margin, statsY, contentWidth, HTML_TEMPLATE_CONFIG.statsHeight);

  // Calculate weekly stats
  const totalEvents = events.length;
  const totalHours = events.reduce((sum, e) => {
    const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const dailyAverage = totalHours / 7;
  const availableHours = (17.5 * 7) - totalHours; // 17.5 hours per day (6am-11:30pm)

  // Draw stat cards
  const cardWidth = contentWidth / 4;
  const stats = [
    { label: 'Total Appointments', value: totalEvents.toString() },
    { label: 'Scheduled Time', value: `${totalHours.toFixed(1)}h` },
    { label: 'Daily Average', value: `${dailyAverage.toFixed(1)}h` },
    { label: 'Available Time', value: `${availableHours.toFixed(0)}h` }
  ];

  stats.forEach((stat, index) => {
    const x = margin + (index * cardWidth);

    // Vertical dividers
    if (index > 0) {
      pdf.setLineWidth(1);
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      pdf.line(x, statsY + 8, x, statsY + HTML_TEMPLATE_CONFIG.statsHeight - 8);
    }

    // Stat value
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(stat.value, x + cardWidth / 2, statsY + 14, { align: 'center' });

    // Stat label
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x + cardWidth / 2, statsY + 32, { align: 'center' });
  });

  // === LEGEND SECTION ===
  const legendY = statsY + HTML_TEMPLATE_CONFIG.statsHeight;

  // Legend background
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
  pdf.rect(margin, legendY, contentWidth, HTML_TEMPLATE_CONFIG.legendHeight, 'F');

  // Legend border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
  pdf.rect(margin, legendY, contentWidth, HTML_TEMPLATE_CONFIG.legendHeight);

  // Legend items
  const legendItems = [
    { label: 'SimplePractice', color: HTML_TEMPLATE_CONFIG.colors.simplePracticeBlue, style: 'left-border' },
    { label: 'Google Calendar', color: HTML_TEMPLATE_CONFIG.colors.googleGreen, style: 'filled' },
    { label: 'Holidays in United States', color: HTML_TEMPLATE_CONFIG.colors.holidayYellow, style: 'filled' }
  ];

  const itemWidth = contentWidth / legendItems.length;

  legendItems.forEach((item, index) => {
    const x = margin + (index * itemWidth) + 18;
    const symbolY = legendY + 8;
    const symbolSize = 10;

    // Draw legend symbol
    if (item.style === 'left-border') {
      // SimplePractice style
      pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
      // Blue left border
      pdf.setDrawColor(...item.color);
      pdf.setLineWidth(3);
      pdf.line(x, symbolY, x, symbolY + symbolSize);
    } else {
      // Filled style
      pdf.setFillColor(...item.color);
      pdf.rect(x, symbolY, symbolSize, symbolSize, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
      pdf.setLineWidth(1);
      pdf.rect(x, symbolY, symbolSize, symbolSize);
    }

    // Legend text
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(item.label, x + symbolSize + 5, symbolY + 6);
  });

  // Complete header border
  pdf.setLineWidth(3);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.line(margin, margin + totalHeaderHeight, HTML_TEMPLATE_CONFIG.pageWidth - margin, margin + totalHeaderHeight);
}

// Remove these functions as they're now integrated into drawHeader

export function drawDailyGrid(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]): void {
  const { margin, pageWidth, timeColumnWidth, timeSlotHeight } = REMARKABLE_DAILY_CONFIG;
  const gridY = REMARKABLE_DAILY_CONFIG.gridStartY;
  const dayColumnWidth = REMARKABLE_DAILY_CONFIG.dayColumnWidth;

  // Use the same generateTimeSlots function as the dashboard
  const timeSlots = generateTimeSlots().map(slot => ({
    ...slot,
    isHour: slot.minute === 0
  }));

  const totalGridHeight = timeSlots.length * timeSlotHeight;
  const headerHeight = 25;

  // === GRID BACKGROUND ===
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
  pdf.rect(margin, gridY, timeColumnWidth + dayColumnWidth, headerHeight + totalGridHeight, 'F');

  // === GRID BORDER ===
  pdf.setLineWidth(2);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.rect(margin, gridY, timeColumnWidth + dayColumnWidth, headerHeight + totalGridHeight);

  // === HEADERS ===
  // Time column header
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
  pdf.rect(margin, gridY, timeColumnWidth, headerHeight, 'F');

  pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.stats);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.text('TIME', margin + timeColumnWidth / 2, gridY + 16, { align: 'center' });

  // Day header
  const dayX = margin + timeColumnWidth;
  pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
  pdf.rect(dayX, gridY, dayColumnWidth, headerHeight, 'F');

  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(dayName, dayX + dayColumnWidth / 2, gridY + 12, { align: 'center' });

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(dateStr, dayX + dayColumnWidth / 2, gridY + 20, { align: 'center' });

  // === TIME GRID ===
  timeSlots.forEach((slot, index) => {
    const y = gridY + headerHeight + (index * timeSlotHeight);

    // Time column cell
    pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.lightGray);
    pdf.rect(margin, y, timeColumnWidth, timeSlotHeight, 'F');

    // Time text
    pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.timeSlot);
    pdf.setFont('helvetica', slot.isHour ? 'bold' : 'normal');
    pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
    pdf.text(slot.time, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 2, { align: 'center' });

    // Day cell
    pdf.setFillColor(...REMARKABLE_DAILY_CONFIG.colors.white);
    pdf.rect(dayX, y, dayColumnWidth, timeSlotHeight, 'F');

    // Horizontal grid lines
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.mediumGray);
    pdf.line(margin, y + timeSlotHeight, margin + timeColumnWidth + dayColumnWidth, y + timeSlotHeight);
  });

  // === VERTICAL GRID LINES ===
  pdf.setLineWidth(2);
  pdf.setDrawColor(...REMARKABLE_DAILY_CONFIG.colors.black);
  pdf.line(margin + timeColumnWidth, gridY, margin + timeColumnWidth, gridY + headerHeight + totalGridHeight);

  // Header separator
  pdf.line(margin, gridY + headerHeight, margin + timeColumnWidth + dayColumnWidth, gridY + headerHeight);

  // === EVENTS ===
  drawRemarkableDailyAppointments(pdf, selectedDate, events, gridY + headerHeight, dayColumnWidth, timeSlotHeight);
}

function drawCalendarGrid(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[]): void {
  const { margin } = HTML_TEMPLATE_CONFIG;
  const gridY = HTML_TEMPLATE_CONFIG.gridStartY;
  const dayColumnWidth = HTML_TEMPLATE_CONFIG.dayColumnWidth;
  const headerHeight = 26;

  // Calculate total grid height for proper 30-minute slots
  const totalGridHeight = headerHeight + (TIME_SLOTS.length * HTML_TEMPLATE_CONFIG.timeSlotHeight);

  // === GRID BACKGROUND ===
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
  pdf.rect(margin, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth + (7 * dayColumnWidth), totalGridHeight, 'F');

  // === GRID BORDER ===
  pdf.setLineWidth(2);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.rect(margin, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth + (7 * dayColumnWidth), totalGridHeight);

  // === TIME COLUMN HEADER ===
  pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.lightGray);
  pdf.rect(margin, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth, headerHeight, 'F');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.text('TIME', margin + HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, gridY + 16, { align: 'center' });

  // === DAY HEADERS - CLEAN AND CLEAR ===
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (i * dayColumnWidth);

    // Clean day header background
    pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.lightGray);
    pdf.rect(x, gridY, dayColumnWidth, headerHeight, 'F');

    // Day name - clear and bold
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(dayNames[i], x + dayColumnWidth / 2, gridY + 12, { align: 'center' });

    // Date number - clear and readable
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(dayDate.getDate().toString(), x + dayColumnWidth / 2, gridY + 22, { align: 'center' });

    // Day header border
    pdf.setLineWidth(1);
    pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
    pdf.rect(x, gridY, dayColumnWidth, headerHeight);
  }

  // === TIME GRID - PROPER 30-MINUTE SLOTS ===
  TIME_SLOTS.forEach((timeSlot, index) => {
    const y = gridY + headerHeight + (index * HTML_TEMPLATE_CONFIG.timeSlotHeight);
    const isHourSlot = timeSlot.endsWith(':00');

    // Time column cell with clean time display
    pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.lightGray);
    pdf.rect(margin, y, HTML_TEMPLATE_CONFIG.timeColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight, 'F');

    // Time text - properly centered and sized
    pdf.setFontSize(isHourSlot ? 9 : 8);
    pdf.setFont('helvetica', isHourSlot ? 'bold' : 'normal');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);
    pdf.text(timeSlot, margin + HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, y + 12, { align: 'center' });

    // Day columns - clean white background for each day
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * dayColumnWidth);
      pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.white);
      pdf.rect(x, y, dayColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight, 'F');
    }

    // Horizontal grid lines - lighter for half-hour slots
    if (index < TIME_SLOTS.length - 1) {
      pdf.setLineWidth(isHourSlot ? 1 : 0.5);
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      const lineY = y + HTML_TEMPLATE_CONFIG.timeSlotHeight;
      pdf.line(margin, lineY, margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (7 * dayColumnWidth), lineY);
    }
  });

  // === VERTICAL GRID LINES ===
  for (let i = 0; i <= 7; i++) {
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (i * dayColumnWidth);
    pdf.setLineWidth(1);
    pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
    pdf.line(x, gridY + headerHeight, x, gridY + totalGridHeight);
  }

  // === MAIN VERTICAL SEPARATORS ===
  // Time column separator
  pdf.setLineWidth(2);
  pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
  pdf.line(margin + HTML_TEMPLATE_CONFIG.timeColumnWidth, gridY, margin + HTML_TEMPLATE_CONFIG.timeColumnWidth, gridY + totalGridHeight);

  // Header separator
  pdf.line(margin, gridY + headerHeight, margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (7 * dayColumnWidth), gridY + headerHeight);

  // === EVENTS ===
  drawAppointments(pdf, weekStartDate, events, gridY + headerHeight);
}

function drawRemarkableDailyAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[], gridStartY: number, dayColumnWidth: number, timeSlotHeight: number): void {
  const { margin, timeColumnWidth } = REMARKABLE_DAILY_CONFIG;

  // Filter events for the selected day using robust date comparison
  const selectedDateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventDateString = eventDate.toISOString().split('T')[0];
    const matches = eventDateString === selectedDateString;

    console.log(`Event: ${event.title} on ${eventDateString}, Selected: ${selectedDateString}, Matches: ${matches}`);
    return matches;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  console.log(`=== RENDERING ${dayEvents.length} EVENTS FOR ${selectedDateString} ===`);
  console.log(`Available events: ${events.length}`);

  if (dayEvents.length === 0) {
    console.log(`No events found for ${selectedDateString}. Available event dates:`);
    events.forEach(event => {
      const eventDate = new Date(event.startTime);
      const eventDateString = eventDate.toISOString().split('T')[0];
      console.log(`  - ${event.title}: ${eventDateString}`);
    });
  }

  dayEvents.forEach((event, index) => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();

    console.log(`\n--- Event ${index + 1}: "${event.title}" ---`);
    console.log(`Has notes: ${!!(event.notes && event.notes.trim())}`);
    console.log(`Has action items: ${!!(event.actionItems && event.actionItems.trim())}`);

    // Calculate position EXACTLY like daily view (DailyView.tsx line 101-106)
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    const slotsFromStart = minutesSince6am / 30;
    const topPosition = Math.max(0, slotsFromStart * timeSlotHeight); // Use PDF timeSlotHeight

    // Calculate duration in minutes like daily view
    const durationMinutes = (endDate.getTime() - eventDate.getTime()) / (1000 * 60);

    // Skip events outside time range
    if (minutesSince6am < 0 || minutesSince6am > (17.5 * 60)) { // 6:00 to 23:30
      console.log('Event outside time range, skipping');
      return;
    }

    // Check if event has notes or action items for expanded layout
    const hasNotes = !!(event.notes && event.notes.trim());
    const hasActionItems = !!(event.actionItems && event.actionItems.trim());
    const needsExpandedLayout = hasNotes || hasActionItems;

    // Position calculation - match daily view exactly
    const eventX = margin + timeColumnWidth + 3;
    const eventY = gridStartY + topPosition + 1;
    const eventWidth = dayColumnWidth - 6;

    // Height calculation - match daily view logic (line 106)
    let eventHeight = Math.max(56, (durationMinutes / 30) * timeSlotHeight - 4); // 60px per 30min slot, minus padding

    // For expanded layout, ensure minimum height for 3 columns
    if (needsExpandedLayout) {
      const notesLines = hasNotes ? event.notes!.split('\n').filter(line => line.trim()).length : 0;
      const actionLines = hasActionItems ? event.actionItems!.split('\n').filter(line => line.trim()).length : 0;
      const maxContentLines = Math.max(notesLines, actionLines);
      const minimumHeight = 70 + (maxContentLines * 12); // More space for 3-column layout
      eventHeight = Math.max(minimumHeight, eventHeight);
    }

    console.log(`Position: X=${eventX}, Y=${eventY}, Width=${eventWidth}, Height=${eventHeight}`);
    console.log(`Expanded layout: ${needsExpandedLayout}`);

    // Determine event type - EXACTLY match daily view logic (line 110-114)
    const isSimplePractice = event.source === 'simplepractice' || 
                           event.notes?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('simple practice') ||
                           event.description?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('appointment'); // SimplePractice appointments sync as "X Appointment"

    const isHoliday = event.title.toLowerCase().includes('holiday') ||
                     event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';

    const isGoogle = event.source === 'google' && !isSimplePractice && !isHoliday;

    // Draw event background (WHITE)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

    // Draw borders based on event type
    if (isSimplePractice) {
      pdf.setDrawColor(66, 133, 244);
      pdf.setLineWidth(4);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);

      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(eventX + 4, eventY, eventX + eventWidth, eventY);
      pdf.line(eventX + eventWidth, eventY, eventX + eventWidth, eventY + eventHeight);
      pdf.line(eventX, eventY + eventHeight, eventX + eventWidth, eventY + eventHeight);

    } else if (isGoogle) {
      pdf.setDrawColor(52, 168, 83);
      pdf.setLineWidth(2);
      pdf.setLineDash([4, 2]);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
      pdf.setLineDash([]);

    } else if (isHoliday) {
      pdf.setFillColor(251, 188, 4);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(255, 152, 0);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);

    } else {
      pdf.setDrawColor(156, 163, 175);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    }

    // === IMPROVED TEXT RENDERING ===
    const padding = isSimplePractice ? 8 : 6;
    const startX = eventX + padding;
    const contentWidth = eventWidth - (padding * 2);

    // DASHBOARD-MATCHING title processing
    let displayTitle = event.title || 'Untitled Event';

    // Clean exactly like dashboard - remove corrupted symbols and normalize
    displayTitle = displayTitle.replace(/[🔒📅➡️⬅️Ø=ÝÅ]/g, ''); // Remove ALL corrupted symbols
    displayTitle = displayTitle.replace(/\s+/g, ' ').trim(); // Normalize whitespace

    // Remove "Appointment" suffix like dashboard does
    if (displayTitle.endsWith(' Appointment')) {
      displayTitle = displayTitle.slice(0, -12); // Remove " Appointment"
    }

    // Skip empty events
    if (!displayTitle || displayTitle.length === 0) {
      console.log('Skipping empty/corrupted event');
      return;
    }

    console.log(`Original title: "${event.title}"`);
    console.log(`Display title: "${displayTitle}"`);

    if (needsExpandedLayout) {
      // === 3-COLUMN LAYOUT ===
      const col1Width = contentWidth * 0.33;
      const col2Width = contentWidth * 0.33;
      const col3Width = contentWidth * 0.33;

      const col1X = startX;
      const col2X = startX + col1Width + 8;
      const col3X = startX + col1Width + col2Width + 16;

      // Draw column dividers
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.5);
      pdf.line(col2X - 4, eventY + 8, col2X - 4, eventY + eventHeight - 8);
      pdf.line(col3X - 4, eventY + 8, col3X - 4, eventY + eventHeight - 8);

      // === COLUMN 1: Event Info ===
      let col1Y = eventY + 18;

      // Event title - IMPROVED RENDERING
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);

      // Simple text wrapping - don't overcomplicate
      const maxCharsPerLine = Math.floor(col1Width / 6); // Approximate
      if (displayTitle.length <= maxCharsPerLine) {
        // Single line
        pdf.text(displayTitle, col1X, col1Y);
        console.log(`Drew single-line title: "${displayTitle}"`);
        col1Y += 12;
      } else {
        // Split into words and wrap
        const words = displayTitle.split(' ');
        let line1 = words[0] || '';
        let line2 = '';

        for (let i = 1; i < words.length; i++) {
          const testLine = line1 + ' ' + words[i];
          // Use simple length check instead of getTextWidth to prevent character spacing issues
          if (testLine.length <= maxCharsPerLine) {
            line1 = testLine;
          } else {
            line2 = words.slice(i).join(' ');
            break;
          }
        }

        pdf.text(line1, col1X, col1Y);
        console.log(`Drew title line 1: "${line1}"`);
        col1Y += 12;

        if (line2 && col1Y + 12 <= eventY + eventHeight - 30) {
          pdf.text(line2, col1X, col1Y);
          console.log(`Drew title line 2: "${line2}"`);
          col1Y += 12;
        }
      }

      // Source
      if (col1Y + 10 <= eventY + eventHeight - 20) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);

        let sourceText = '';
        if (isSimplePractice) sourceText = 'SIMPLEPRACTICE';
        else if (isGoogle) sourceText = 'GOOGLE CALENDAR';
        else if (isHoliday) sourceText = 'HOLIDAYS IN UNITED STATES';
        else sourceText = (event.source || 'MANUAL').toUpperCase();

        pdf.text(sourceText, col1X, col1Y);
        col1Y += 12;
      }

      // Time
      if (col1Y + 10 <= eventY + eventHeight - 8) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);

        const startTimeStr = eventDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', minute: '2-digit', hour12: false 
        });
        const endTimeStr = endDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', minute: '2-digit', hour12: false 
        });
        const timeRange = `${startTimeStr}-${endTimeStr}`;

        pdf.text(timeRange, col1X, col1Y);
        col1Y += 12;
      }

      // === COLUMN 2: Event Notes ===
      if (hasNotes) {
        let col2Y = eventY + 18;

        // Header
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Event Notes', col2X, col2Y);
        col2Y += 14;

        // Notes content
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        const noteLines = event.notes!.split('\n').filter(line => line.trim());
        noteLines.forEach(note => {
          const cleanNote = note.trim().replace(/^[•\s-]+/, '').trim();
          if (cleanNote && col2Y + 10 <= eventY + eventHeight - 8) {
            // Bullet point
            pdf.text('•', col2X, col2Y);

            // Wrap note text properly
            const noteWords = cleanNote.split(' ');
            const wrappedLines = [];
            let currentNoteLine = '';

            for (const word of noteWords) {
              const testLine = currentNoteLine ? `${currentNoteLine} ${word}` : word;
              const textWidth = pdf.getTextWidth(testLine);

              if (textWidth <= col2Width - 12) {
                currentNoteLine = testLine;
              } else {
                if (currentNoteLine) wrappedLines.push(currentNoteLine);
                currentNoteLine = word;
              }
            }
            if (currentNoteLine) wrappedLines.push(currentNoteLine);

            // Render wrapped lines
            for (let i = 0; i < Math.min(wrappedLines.length, 2); i++) {
              if (col2Y + (i * 9) + 9 <= eventY + eventHeight - 8) {
                pdf.text(wrappedLines[i], col2X + 10, col2Y + (i * 9));
              }
            }
            col2Y += Math.min(wrappedLines.length, 2) * 9 + 3;
          }
        });
      }

      // === COLUMN 3: Action Items ===
      if (hasActionItems) {
        let col3Y = eventY + 18;

        // Header
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Action Items', col3X, col3Y);
        col3Y += 14;

        // Action items content
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);

        const actionLines = event.actionItems!.split('\n').filter(line => line.trim());
        actionLines.forEach(action => {
          const cleanAction = action.trim().replace(/^[•\s-]+/, '').trim();
          if (cleanAction && col3Y + 10 <= eventY + eventHeight - 8) {
            // Bullet point
            pdf.text('•', col3X, col3Y);

            // Wrap action text properly
            const actionWords = cleanAction.split(' ');
            const wrappedLines = [];
            let currentActionLine = '';

            for (const word of actionWords) {
              const testLine = currentActionLine ? `${currentActionLine} ${word}` : word;
              const textWidth = pdf.getTextWidth(testLine);

              if (textWidth <= col3Width - 12) {
                currentActionLine = testLine;
              } else {
                if (currentActionLine) wrappedLines.push(currentActionLine);
                currentActionLine = word;
              }
            }
            if (currentActionLine) wrappedLines.push(currentActionLine);

            // Render wrapped lines
            for (let i = 0; i < Math.min(wrappedLines.length, 2); i++) {
              if (col3Y + (i * 9) + 9 <= eventY + eventHeight - 8) {
                pdf.text(wrappedLines[i], col3X + 10, col3Y + (i * 9));
              }
            }
            col3Y += Math.min(wrappedLines.length, 2) * 9 + 3;
          }
        });
      }

    } else {
      // === SIMPLE LAYOUT (No notes/action items) ===
      let currentY = eventY + 18;

      // Event title - IMPROVED RENDERING
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);

      // ALWAYS SHOW TITLE, SOURCE, AND TIME for simple layout
      if (displayTitle && displayTitle.length > 0) {
        // Simple text wrapping
        // CRITICAL FIX: Simple text rendering without complex wrapping
        const maxLength = 22; // Conservative character limit
        if (displayTitle.length <= maxLength) {
          pdf.text(displayTitle, startX, currentY);
          console.log(`Drew simple title: "${displayTitle}"`);
          currentY += 14;
        } else {
          // Simple truncation to prevent character spacing issues
          const truncated = displayTitle.substring(0, maxLength - 3) + '...';
          pdf.text(truncated, startX, currentY);
          console.log(`Drew truncated title: "${truncated}"`);
          currentY += 14;
        }
      } else {
        console.log('WARNING: No display title for simple layout!');
      }

      // Source
      if (currentY + 10 <= eventY + eventHeight - 15) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);

        let sourceText = '';
        if (isSimplePractice) sourceText = 'SIMPLEPRACTICE';
        else if (isGoogle) sourceText = 'GOOGLE CALENDAR';
        else if (isHoliday) sourceText = 'HOLIDAYS IN UNITED STATES';
        else sourceText = (event.source || 'MANUAL').toUpperCase();

        pdf.text(sourceText, startX, currentY);
        console.log(`Drew simple source: "${sourceText}"`);
        currentY += 12;
      }

      // Time
      if (currentY + 10 <= eventY + eventHeight - 8) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);

        const startTimeStr = eventDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', minute: '2-digit', hour12: false 
        });
        const endTimeStr = endDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', minute: '2-digit', hour12: false 
        });
        const timeRange = `${startTimeStr}-${endTimeStr}`;

        pdf.text(timeRange, startX, currentY);
        console.log(`Drew simple time range: "${timeRange}"`);
      }
    }

    console.log(`Finished rendering event ${index + 1}`);
  });
}

function drawDailyAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[], gridStartY: number, dayColumnWidth: number): void {
  const { margin } = HTML_TEMPLATE_CONFIG;

  // Filter events for the selected day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  dayEvents.forEach(event => {
    const eventDate = new Date(event.startTime);

    // Get event time
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();

    // Find the time slot
    const timeString = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;

    let slotIndex = -1;
    for (let i = 0; i < TIME_SLOTS.length; i++) {
      const slot = TIME_SLOTS[i];
      if (slot === timeString) {
        slotIndex = i;
        break;
      }
      // Check if time falls within slot
      const [slotHour, slotMin] = slot.split(':').map(Number);
      const nextSlotMin = slotMin === 0 ? 30 : 0;
      const nextSlotHour = slotMin === 0 ? slotHour : slotHour + 1;

      if (startHour === slotHour && startMinute >= slotMin && 
          (startHour < nextSlotHour || (startHour === nextSlotHour && startMinute < nextSlotMin))) {
        slotIndex = i;
        break;
      }
    }

    if (slotIndex === -1) return;

    // Calculate event height
    const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
    const heightInSlots = Math.max(1, Math.ceil(duration / 30));

    // Position calculation
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + 2;
    const y = gridStartY + (slotIndex * HTML_TEMPLATE_CONFIG.timeSlotHeight) + 1;
    const width = dayColumnWidth - 4;
    const height = (heightInSlots * HTML_TEMPLATE_CONFIG.timeSlotHeight) - 2;

    // Event styling
    const isSimplePractice = event.title.includes('Appointment');

    if (isSimplePractice) {
      // SimplePractice: light gray background with blue left border
      pdf.setFillColor(248, 248, 248);
      pdf.rect(x, y, width, height, 'F');

      // Blue left border
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(4);
      pdf.line(x, y, x, y + height);

      // Border around event
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, height);
    } else {
      // Google Calendar: light green filled
      pdf.setFillColor(240, 255, 240);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.googleGreen);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);
    }

    // Event text with better spacing for wide layout
    const cleanTitle = event.title.replace(/ Appointment$/, '');
    const textWidth = width - (HTML_TEMPLATE_CONFIG.eventPadding * 2);

    // Event name - larger font for daily view
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);

    const nameLines = pdf.splitTextToSize(cleanTitle, textWidth);
    const maxNameLines = Math.min(nameLines.length, Math.floor(height / 16));

    for (let i = 0; i < maxNameLines; i++) {
      pdf.text(nameLines[i], x + HTML_TEMPLATE_CONFIG.eventPadding, y + 14 + (i * 16));
    }

    // Time range
    if (height > 25) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);

      const startTime = formatTime(event.startTime);
      const endTime = formatTime(event.endTime);
      const timeRange = `${startTime} - ${endTime}`;

      const timeY = y + 14 + (maxNameLines * 16) + 4;
      if (timeY + 10 <= y + height - HTML_TEMPLATE_CONFIG.eventPadding) {
        pdf.text(timeRange, x + HTML_TEMPLATE_CONFIG.eventPadding, timeY);
      }
    }
  });
}

function drawAppointments(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], gridStartY: number): void {
  const { margin } = HTML_TEMPLATE_CONFIG;
  const dayColumnWidth = HTML_TEMPLATE_CONFIG.dayColumnWidth;

  // Filter events for the current week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return eventDate >= weekStartDate && eventDate <= weekEnd;
  });

  weekEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayIndex < 0 || dayIndex >= 7) return;

    // Get event time
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();

    // Find the exact time slot index
    const timeString = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;

    let slotIndex = -1;
    for (let i = 0; i < TIME_SLOTS.length; i++) {
      const slot = TIME_SLOTS[i];
      if (slot === timeString) {
        slotIndex = i;
        break;
      }
      // Check if time falls within slot
      const [slotHour, slotMin] = slot.split(':').map(Number);
      const nextSlotMin = slotMin === 0 ? 30 : 0;
      const nextSlotHour = slotMin === 0 ? slotHour : slotHour + 1;

      if (startHour === slotHour && startMinute >= slotMin && 
          (startHour < nextSlotHour || (startHour === nextSlotHour && startMinute < nextSlotMin))) {
        slotIndex = i;
        break;
      }
    }

    if (slotIndex === -1) return;

    // Calculate event height based on duration
    const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
    const heightInSlots = Math.max(1, Math.ceil(duration / 30));

    // Position calculation using proper time slot system
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * dayColumnWidth) + 1;
    const y = gridStartY + (slotIndex * HTML_TEMPLATE_CONFIG.timeSlotHeight) + 1;
    const width = dayColumnWidth - 2;
    const height = (heightInSlots * HTML_TEMPLATE_CONFIG.timeSlotHeight) - 2;

    // Event styling based on type
    const eventTypeInfo = getEventTypeInfo(event);

    if (eventTypeInfo.isSimplePractice) {
      // SimplePractice: white background with blue left border
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, width, height, 'F');

      // Blue left border
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(3);
      pdf.line(x, y, x, y + height);

      // Light border around event
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      pdf.setLineWidth(0.5);
      pdf.rect(x, y, width, height);
    } else if (eventTypeInfo.isGoogle) {
      // Google Calendar: white background with green dashed border
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.googleGreen);
      pdf.setLineWidth(1);
      pdf.setLineDash([2, 2]);
      pdf.rect(x, y, width, height);
      pdf.setLineDash([]);
    } else if (eventTypeInfo.isHoliday) {
      // Holiday: yellow filled
      pdf.setFillColor(...HTML_TEMPLATE_CONFIG.colors.holidayYellow);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.black);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);
    } else {
      // Default: white background with gray border
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(...HTML_TEMPLATE_CONFIG.colors.mediumGray);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height);
    }

    // Clean title - remove corrupted symbols and " Appointment" suffix
    let cleanTitle = event.title || 'Untitled Event';
    cleanTitle = cleanTitle.replace(/[^\w\s\-\(\)&]/g, ''); // Remove special characters
    cleanTitle = cleanTitle.replace(/ Appointment$/, '');
    cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();

    // Calculate available text area with padding
    const textWidth = width - (HTML_TEMPLATE_CONFIG.eventPadding * 2);

    // Event name
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...HTML_TEMPLATE_CONFIG.colors.black);

    // Split text to fit width properly
    const nameLines = pdf.splitTextToSize(cleanTitle, textWidth);

    // Draw name (max 2 lines for readability)
    const nameLineHeight = 11;
    const maxNameLines = Math.min(nameLines.length, height > 24 ? 2 : 1);

    for (let i = 0; i < maxNameLines; i++) {
      pdf.text(nameLines[i], x + HTML_TEMPLATE_CONFIG.eventPadding, y + 12 + (i * nameLineHeight));
    }

    // Time range if there's space
    if (height > 25) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);

      // Format time range
      const startTime = formatTime(event.startTime);
      const endTime = formatTime(event.endTime);
      const timeRange = `${startTime} - ${endTime}`;

      // Position time range below name
      const timeY = y + 12 + (maxNameLines * nameLineHeight) + 2;
      if (timeY + 8 <= y + height - HTML_TEMPLATE_CONFIG.eventPadding) {
        pdf.text(timeRange, x + HTML_TEMPLATE_CONFIG.eventPadding, timeY);
      }
    }
  });
}

//Centralized function to clean event titles
function cleanEventTitle(title: string | undefined): string {
  if (!title) return 'Untitled Event';
  let cleanTitle = title.replace(/[🔒📅➡️⬅️Ø=ÝÅ]/g, ''); // Remove all corrupted symbols
  cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim(); // Normalize whitespace
  if (cleanTitle.endsWith(' Appointment')) {
    cleanTitle = cleanTitle.slice(0, -12); // Remove " Appointment"
  }
  return cleanTitle;
}

//Centralized function to format time in military format
function formatMilitaryTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function drawRemarkableDailyAppointments_old(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[], gridStartY: number, dayColumnWidth: number, timeSlotHeight: number): void {
  const { margin, timeColumnWidth, fonts, colors } = REMARKABLE_DAILY_CONFIG;

  // Filter events for the selected day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  dayEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    // Calculate position (DailyView.tsx line 101-106)
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    const slotsFromStart = minutesSince6am / 30;
    const topPosition = Math.max(0, slotsFromStart * timeSlotHeight); // Use PDF timeSlotHeight

    // Calculate duration
    const durationMinutes = (endDate.getTime() - eventDate.getTime()) / (1000 * 60);

    // Skip events outside time range
    if (minutesSince6am < 0 || minutesSince6am > (17.5 * 60)) return; // 6:00 to 23:30

    // Position calculation - match daily view exactly
    const eventX = margin + timeColumnWidth + 3;
    const eventY = gridStartY + topPosition + 1;
    const eventWidth = dayColumnWidth - 6;
    let eventHeight = Math.max(56, (durationMinutes / 30) * timeSlotHeight - 4); // 60px per 30min slot, minus padding

    // Determine event type - EXACTLY match daily view logic (line 110-114)
    const eventType = getEventTypeInfo(event);

    // Draw event background (WHITE)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

    // Draw borders based on event type
    if (eventType.isSimplePractice) {
      pdf.setDrawColor(66, 133, 244);
      pdf.setLineWidth(4);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);

      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(eventX + 4, eventY, eventX + eventWidth, eventY);
      pdf.line(eventX + eventWidth, eventY, eventX + eventWidth, eventY + eventHeight);
      pdf.line(eventX, eventY + eventHeight, eventX + eventWidth, eventY + eventHeight);

    } else if (eventType.isGoogle) {
      pdf.setDrawColor(52, 168, 83);
      pdf.setLineWidth(2);
      pdf.setLineDash([4, 2]);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
      pdf.setLineDash([]);

    } else if (eventType.isHoliday) {
      pdf.setFillColor(251, 188, 4);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(255, 152, 0);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);

    } else {
      pdf.setDrawColor(156, 163, 175);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    }

    // Clean title using centralized function
    const displayTitle = cleanEventTitle(event.title);

    console.log(`Event ${event.id}: "${event.title}" -> "${displayTitle}"`);

    // Calculate vertical spacing based on appointment duration
    const is30MinuteAppt = durationMinutes <= 30;

    // Improved spacing for 30-minute appointments
    const titleY = is30MinuteAppt ? eventY + 12 : eventY + 8;
    const sourceY = is30MinuteAppt ? eventY + 24 : eventY + 16;
    const timeY = is30MinuteAppt ? eventY + 36 : eventY + 24;

    // Appointment name with improved positioning
    pdf.text(displayTitle, eventX, titleY);

    // Source line with optimized spacing
    pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.eventSource.size);
    pdf.setFont('helvetica', REMARKABLE_DAILY_CONFIG.fonts.eventSource.weight);
    pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
    pdf.text(eventType.source, eventX, sourceY);

    // Time range positioned below with proper spacing
    pdf.setFontSize(REMARKABLE_DAILY_CONFIG.fonts.eventTime.size);
    pdf.setFont('helvetica', REMARKABLE_DAILY_CONFIG.fonts.eventTime.weight);
    pdf.setTextColor(...REMARKABLE_DAILY_CONFIG.colors.black);
    const timeRange = `${formatMilitaryTime(eventDate)} - ${formatMilitaryTime(endDate)}`;
    pdf.text(timeRange, eventX, timeY);
  });
}