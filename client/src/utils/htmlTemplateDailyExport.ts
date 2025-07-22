// HTML Template Daily PDF Export - Absolute Pixel-Perfect Implementation
import jsPDF from 'jspdf';
import { CalendarEvent } from '@/types/calendar';

// Exact layout constants matching HTML/CSS with precise measurements
const LAYOUT_CONSTANTS = {
  remarkable: {
    pageWidth: 507,
    pageHeight: 677,
    margin: 15,
    headerHeight: 60,
    statsBarHeight: 45,
    legendHeight: 25,
    footerHeight: 25,
    timeColumnWidth: 50,
    timeRowHeight: 15,
    gridStartY: 145, // header + stats + legend + spacing
    fonts: {
      headerTitle: 11,
      headerSubtitle: 9,
      statsValue: 8,
      statsLabel: 6,
      legendText: 5,
      timeLabel: 5,
      timeLabelBold: 6,
      eventTitle: 5,
      eventSource: 4,
      eventTime: 4,
      footer: 4
    }
  },
  usLetter: {
    pageWidth: 612,
    pageHeight: 792,
    margin: 20,
    headerHeight: 80,
    statsBarHeight: 60,
    legendHeight: 30,
    footerHeight: 30,
    timeColumnWidth: 65,
    timeRowHeight: 18,
    gridStartY: 180, // header + stats + legend + spacing
    fonts: {
      headerTitle: 14,
      headerSubtitle: 12,
      statsValue: 11,
      statsLabel: 8,
      legendText: 7,
      timeLabel: 7,
      timeLabelBold: 8,
      eventTitle: 7,
      eventSource: 6,
      eventTime: 6,
      footer: 6
    }
  }
};

// Exact color values from HTML/CSS
const COLORS = {
  black: [0, 0, 0] as [number, number, number],
  darkGray: [64, 64, 64] as [number, number, number],
  gray: [128, 128, 128] as [number, number, number],
  lightGray: [240, 240, 240] as [number, number, number],
  veryLightGray: [248, 248, 248] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  borderGray: [200, 200, 200] as [number, number, number],
  simplePracticeBlue: [100, 149, 237] as [number, number, number],
  googleGreen: [34, 197, 94] as [number, number, number],
  holidayYellow: [245, 158, 11] as [number, number, number]
};

// Time slots exactly as in HTML
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

// Utility function to filter out test appointments and ghost events
function shouldIncludeAppointment(appt: CalendarEvent): boolean {
  const title = appt.title?.toLowerCase() || "";
  
  // Remove test appointments - comprehensive filtering
  if (title.includes("test") || 
      title.includes("test-appointment") || 
      title.includes("event test") ||
      title.includes("test-event") ||
      title.includes("dummy") ||
      title.includes("sample") ||
      title.includes("placeholder")) {
    console.log(`🚫 Filtering out test appointment: "${appt.title}"`);
    return false;
  }
  
  // Remove ghost/populating events that shouldn't be there
  if (title.includes("paul benjamin") || 
      title.includes("ghost") || 
      title.includes("populating")) {
    console.log(`🚫 Filtering out ghost appointment: "${appt.title}"`);
    return false;
  }
  
  return true;
}

// Device detection with exact matching
function detectRemarkableDevice(): boolean {
  const userAgent = navigator.userAgent || '';
  const isRemarkable = userAgent.includes('reMarkable') || userAgent.includes('remarkable');
  
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const isRemarkableDimensions = 
    (screenWidth === 1404 && screenHeight === 1872) || 
    (screenWidth === 1872 && screenHeight === 1404);
  
  return isRemarkable || isRemarkableDimensions || 
         (screenWidth <= 1404 && 'ontouchstart' in window);
}

// Main export function
export const exportHtmlTemplateDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('=== PIXEL-PERFECT DAILY TEMPLATE PDF EXPORT ===');
  
  // Device detection and configuration
  const isRemarkable = detectRemarkableDevice();
  const config = isRemarkable ? LAYOUT_CONSTANTS.remarkable : LAYOUT_CONSTANTS.usLetter;
  
  console.log(`📱 Device: ${isRemarkable ? 'reMarkable Paper Pro' : 'US Letter'}`);
  console.log(`📏 Dimensions: ${config.pageWidth}x${config.pageHeight}pt`);
  
  // Filter events for selected date AND remove test/ghost appointments
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const isCorrectDate = eventDate.toDateString() === selectedDate.toDateString();
    return isCorrectDate && shouldIncludeAppointment(event);
  });
  
  const totalDayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).length;
  
  console.log(`📅 Events for ${selectedDate.toDateString()}:`, dayEvents.length);
  console.log(`🧹 Filtered out ${totalDayEvents - dayEvents.length} test/ghost appointments`);
  
  // Create PDF with exact dimensions
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [config.pageWidth, config.pageHeight]
  });
  
  // Draw pixel-perfect layout
  await drawPixelPerfectLayout(pdf, selectedDate, dayEvents, config);
  
  // Save with device-specific filename
  const dateStr = selectedDate.toISOString().split('T')[0];
  const deviceSuffix = isRemarkable ? '-remarkable' : '-letter';
  const filename = `daily-template-${dateStr}${deviceSuffix}.pdf`;
  
  pdf.save(filename);
  console.log(`✅ Pixel-perfect PDF exported: ${filename}`);
};

async function drawPixelPerfectLayout(
  pdf: jsPDF,
  selectedDate: Date,
  dayEvents: CalendarEvent[],
  config: any
): Promise<void> {
  let currentY = config.margin;
  
  // 1. HEADER SECTION - Exact HTML match
  currentY = drawPreciseHeader(pdf, selectedDate, dayEvents, currentY, config);
  
  // 2. STATS BAR - Exact HTML match
  currentY = drawPreciseStatsBar(pdf, dayEvents, currentY, config);
  
  // 3. LEGEND - Exact HTML match
  currentY = drawPreciseLegend(pdf, currentY, config);
  
  // 4. TIME GRID + APPOINTMENTS - Exact HTML match
  drawPreciseTimeGrid(pdf, dayEvents, currentY, config);
  
  // 5. FOOTER - Exact HTML match
  drawPreciseFooter(pdf, config);
}

function drawPreciseHeader(
  pdf: jsPDF,
  selectedDate: Date,
  dayEvents: CalendarEvent[],
  y: number,
  config: any
): number {
  const { pageWidth, margin, fonts } = config;
  
  // Format date strings exactly as HTML
  const fullDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const shortDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  // Main title - exact positioning to match HTML
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(fonts.headerTitle);
  pdf.setTextColor(...COLORS.black);
  pdf.text(fullDate, margin, y + 20);
  
  // Subtitle - exact positioning to match HTML
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(fonts.headerSubtitle);
  pdf.setTextColor(...COLORS.darkGray);
  pdf.text(shortDate, margin, y + 40);
  
  // Appointment count - exact positioning to match HTML
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(fonts.statsLabel);
  pdf.setTextColor(...COLORS.gray);
  pdf.text(`${dayEvents.length} appointments scheduled`, margin, y + 55);
  
  return y + config.headerHeight;
}

function drawPreciseStatsBar(
  pdf: jsPDF,
  dayEvents: CalendarEvent[],
  y: number,
  config: any
): number {
  const { pageWidth, margin, fonts } = config;
  
  // Calculate exact statistics
  const totalAppointments = dayEvents.length;
  const totalScheduledHours = dayEvents.reduce((total, event) => {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
    return total + duration;
  }, 0);
  
  const totalAvailableHours = 17.5; // 6:00 AM to 11:30 PM
  const availableHours = totalAvailableHours - totalScheduledHours;
  const freeTimePercentage = Math.round((availableHours / totalAvailableHours) * 100);
  
  // Stats data array - exact order as HTML
  const stats = [
    { value: totalAppointments.toString(), label: 'Appointments' },
    { value: `${totalScheduledHours.toFixed(1)}h`, label: 'Scheduled' },
    { value: `${availableHours.toFixed(1)}h`, label: 'Available' },
    { value: `${freeTimePercentage}%`, label: 'Free Time' }
  ];
  
  // Draw stats bar background - exact match to HTML
  pdf.setFillColor(...COLORS.veryLightGray);
  pdf.rect(margin, y + 5, pageWidth - margin * 2, config.statsBarHeight - 10, 'F');
  
  // Draw stats in exact columns with proper spacing
  const colWidth = (pageWidth - margin * 2) / stats.length;
  
  stats.forEach((stat, index) => {
    const centerX = margin + (colWidth * index) + (colWidth / 2);
    
    // Value - exact positioning to match HTML
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fonts.statsValue);
    pdf.setTextColor(...COLORS.black);
    pdf.text(stat.value, centerX, y + 22, { align: 'center' });
    
    // Label - exact positioning to match HTML
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fonts.statsLabel);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(stat.label, centerX, y + 38, { align: 'center' });
  });
  
  return y + config.statsBarHeight;
}

function drawPreciseLegend(pdf: jsPDF, y: number, config: any): number {
  const { pageWidth, margin, fonts } = config;
  
  // Position legend at top right exactly as HTML
  const legendStartX = pageWidth - margin - 140;
  const iconSize = 6;
  const itemSpacing = 40;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(fonts.legendText);
  pdf.setTextColor(...COLORS.black);
  
  let currentX = legendStartX;
  
  // SimplePractice legend - exact match to HTML
  pdf.setFillColor(...COLORS.white);
  pdf.setDrawColor(...COLORS.simplePracticeBlue);
  pdf.setLineWidth(0.5);
  pdf.rect(currentX, y + 8, iconSize, iconSize, 'FD');
  pdf.setFillColor(...COLORS.simplePracticeBlue);
  pdf.rect(currentX, y + 8, 2, iconSize, 'F');
  pdf.text('SimplePractice', currentX + iconSize + 2, y + 13);
  
  // Google Calendar legend - exact match to HTML
  currentX += itemSpacing;
  pdf.setFillColor(...COLORS.white);
  pdf.setDrawColor(...COLORS.googleGreen);
  pdf.setLineDash([1, 1]);
  pdf.rect(currentX, y + 8, iconSize, iconSize, 'FD');
  pdf.setLineDash([]);
  pdf.text('Google Calendar', currentX + iconSize + 2, y + 13);
  
  // Holidays legend - exact match to HTML
  currentX += 50;
  pdf.setFillColor(...COLORS.holidayYellow);
  pdf.setDrawColor(...COLORS.holidayYellow);
  pdf.rect(currentX, y + 8, iconSize, iconSize, 'FD');
  pdf.text('Holidays', currentX + iconSize + 2, y + 13);
  
  return y + config.legendHeight;
}

function drawPreciseTimeGrid(
  pdf: jsPDF,
  dayEvents: CalendarEvent[],
  y: number,
  config: any
): void {
  const { pageWidth, margin, timeColumnWidth, timeRowHeight, fonts } = config;
  const appointmentColumnWidth = pageWidth - margin * 2 - timeColumnWidth;
  const totalGridHeight = TIME_SLOTS.length * timeRowHeight;
  
  // Draw main grid border - exact match to HTML
  pdf.setDrawColor(...COLORS.borderGray);
  pdf.setLineWidth(1);
  pdf.rect(margin, y, pageWidth - margin * 2, totalGridHeight, 'S');
  
  // Draw time slots and grid - exact match to HTML
  TIME_SLOTS.forEach((timeSlot, index) => {
    const slotY = y + (index * timeRowHeight);
    const isHourSlot = timeSlot.endsWith(':00');
    
    // Row background - exact HTML colors and pattern
    if (isHourSlot) {
      pdf.setFillColor(...COLORS.lightGray);
    } else {
      pdf.setFillColor(...COLORS.veryLightGray);
    }
    pdf.rect(margin, slotY, pageWidth - margin * 2, timeRowHeight, 'F');
    
    // Time label - exact positioning to match HTML
    pdf.setFont('helvetica', isHourSlot ? 'bold' : 'normal');
    pdf.setFontSize(isHourSlot ? fonts.timeLabelBold : fonts.timeLabel);
    pdf.setTextColor(...COLORS.black);
    
    // Center text in time column exactly as HTML
    const textX = margin + (timeColumnWidth / 2);
    const textY = slotY + (timeRowHeight / 2) + 2;
    pdf.text(timeSlot, textX, textY, { align: 'center' });
    
    // Horizontal grid lines - exact match to HTML
    pdf.setDrawColor(...COLORS.borderGray);
    pdf.setLineWidth(0.5);
    pdf.line(margin, slotY, pageWidth - margin, slotY);
  });
  
  // Final bottom line
  pdf.setDrawColor(...COLORS.borderGray);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y + totalGridHeight, pageWidth - margin, y + totalGridHeight);
  
  // Vertical separator between time and appointments - exact match to HTML
  pdf.setDrawColor(...COLORS.borderGray);
  pdf.setLineWidth(1);
  pdf.line(margin + timeColumnWidth, y, margin + timeColumnWidth, y + totalGridHeight);
  
  // Draw appointments with exact positioning
  drawPreciseAppointments(pdf, dayEvents, y, margin + timeColumnWidth, appointmentColumnWidth, config);
}

function drawPreciseAppointments(
  pdf: jsPDF,
  dayEvents: CalendarEvent[],
  gridY: number,
  appointmentX: number,
  appointmentWidth: number,
  config: any
): void {
  const { timeRowHeight, fonts } = config;
  
  // Group events by time slot for proper overlapping handling
  const slotGroups = new Map<number, CalendarEvent[]>();
  
  dayEvents.forEach(event => {
    const startTime = new Date(event.startTime);
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    
    if (startSlot >= 0 && startSlot < TIME_SLOTS.length) {
      if (!slotGroups.has(startSlot)) {
        slotGroups.set(startSlot, []);
      }
      slotGroups.get(startSlot)!.push(event);
    }
  });
  
  // Draw each slot group with proper side-by-side positioning
  slotGroups.forEach((events, startSlot) => {
    const eventsInSlot = events.length;
    
    events.forEach((event, eventIndex) => {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      
      // Calculate exact slot positioning
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();
      const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
      
      // Calculate exact positioning for side-by-side events
      const eventY = gridY + (startSlot * timeRowHeight) + 2;
      const eventHeight = Math.max(timeRowHeight - 4, (endSlot - startSlot) * timeRowHeight - 4);
      
      // Side-by-side positioning for overlapping events with better spacing
      const totalWidth = appointmentWidth - 8;
      const eventWidth = eventsInSlot > 1 ? Math.floor(totalWidth / eventsInSlot) - 4 : totalWidth;
      const eventX = appointmentX + 4 + (eventIndex * (eventWidth + 4));
      
      // Determine event type for proper styling
      const isSimplePractice = event.title.includes('Appointment') || 
                             event.source === 'simplepractice' ||
                             event.calendarId?.includes('simplepractice');
      const isHoliday = event.title.includes('Holiday') || 
                       event.calendarId?.includes('holiday');
      
      // Draw event background - white as specified
      pdf.setFillColor(...COLORS.white);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      
      // Draw event border based on type - exact HTML styling
      if (isSimplePractice) {
        // SimplePractice: Blue border with thick left flag
        pdf.setDrawColor(...COLORS.simplePracticeBlue);
        pdf.setLineWidth(0.5);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
        pdf.setFillColor(...COLORS.simplePracticeBlue);
        pdf.rect(eventX, eventY, 3, eventHeight, 'F'); // Thick left flag
      } else if (isHoliday) {
        // Holiday: Yellow fill with orange border
        pdf.setFillColor(...COLORS.holidayYellow);
        pdf.setDrawColor(...COLORS.holidayYellow);
        pdf.setLineWidth(0.5);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'FD');
      } else {
        // Google Calendar: Dashed green border
        pdf.setDrawColor(...COLORS.googleGreen);
        pdf.setLineWidth(0.5);
        pdf.setLineDash([2, 2]);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
        pdf.setLineDash([]);
      }
      
      // Event text with exact positioning and proper wrapping
      const textX = eventX + (isSimplePractice ? 6 : 4);
      const textY = eventY + 12;
      const maxWidth = eventWidth - (isSimplePractice ? 8 : 6);
      
      // Event title - clean and truncated to fit
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(fonts.eventTitle);
      pdf.setTextColor(...COLORS.black);
      
      // Comprehensive title cleaning to prevent PDF encoding issues
      const originalTitle = event.title;
      const afterEmojiStrip = stripLeadingEmoji(originalTitle);
      const withoutAppointment = afterEmojiStrip.replace(' Appointment', '');
      // Additional safety: ensure only ASCII characters for PDF compatibility
      const safeTitle = withoutAppointment.replace(/[^\x00-\x7F]/g, '');
      const cleanTitle = safeTitle.substring(0, 12);
      
      // Debug logging to see what's happening
      console.log(`📝 Title processing: "${originalTitle}" → "${afterEmojiStrip}" → "${safeTitle}" → "${cleanTitle}"`);
      
      pdf.text(cleanTitle, textX, textY, { maxWidth });
      
      // Event source
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fonts.eventSource);
      pdf.setTextColor(...COLORS.gray);
      const source = isSimplePractice ? 'SIMPLEPRACTICE' : isHoliday ? 'HOLIDAY' : 'GOOGLE CALENDAR';
      pdf.text(source, textX, textY + 10, { maxWidth });
      
      // Event time (if space allows)
      if (eventHeight > 30) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(fonts.eventTime);
        pdf.setTextColor(...COLORS.black);
        const timeStr = `${formatTime(startTime)} - ${formatTime(endTime)}`;
        pdf.text(timeStr, textX, textY + 20, { maxWidth });
      }
    });
  });
}

function drawPreciseFooter(pdf: jsPDF, config: any): void {
  const { pageWidth, pageHeight, margin, fonts } = config;
  const footerY = pageHeight - config.footerHeight;
  
  // Footer separator line
  pdf.setDrawColor(...COLORS.borderGray);
  pdf.setLineWidth(0.5);
  pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  
  // Footer navigation - using plain text to avoid encoding issues
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(fonts.footer);
  pdf.setTextColor(...COLORS.black);
  
  // Previous Day - using plain text
  pdf.text('< Previous Day', margin, footerY + 15);
  
  // Weekly Overview (center) - using plain text
  pdf.text('Weekly Overview', pageWidth / 2, footerY + 15, { align: 'center' });
  
  // Next Day - using plain text
  pdf.text('Next Day >', pageWidth - margin, footerY + 15, { align: 'right' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Utility function to strip leading emojis and artifacts from appointment titles
function stripLeadingEmoji(text: string): string {
  // Comprehensive approach to handle the specific lock emoji causing "Ø=Ý" corruption
  // The lock emoji (🔒) is causing jsPDF encoding issues, so we need to be very aggressive
  
  // First, try to remove the exact lock emoji character in multiple ways
  let cleanText = text;
  
  // Remove the lock emoji character by character code
  cleanText = cleanText.replace(/\uD83D\uDD12/g, ''); // Lock emoji Unicode
  cleanText = cleanText.replace(/🔒/g, ''); // Direct emoji
  cleanText = cleanText.replace(/[\u{1F512}]/gu, ''); // Unicode property
  
  // Remove other common emoji patterns that might appear
  cleanText = cleanText.replace(/^[\u{1F300}-\u{1F9FF}]/gu, ''); // Extended emoji range
  cleanText = cleanText.replace(/^[\u{2600}-\u{26FF}]/gu, ''); // Symbols
  cleanText = cleanText.replace(/^[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
  
  // Remove any remaining leading non-ASCII characters that might cause PDF issues
  cleanText = cleanText.replace(/^[^\x00-\x7F]+/, '');
  
  // Remove leading whitespace
  cleanText = cleanText.replace(/^\s+/, '');
  
  return cleanText.trim();
}