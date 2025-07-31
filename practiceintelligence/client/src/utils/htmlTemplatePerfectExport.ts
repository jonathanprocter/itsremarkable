import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// HTML Template Constants - Extracted from reference HTML
const HTML_TEMPLATE_CONSTANTS = {
  // Layout dimensions (from HTML CSS)
  timeSlotHeight: 30, // 30px per time slot
  timeColumnWidth: 80, // 80px for time column
  headerHeight: 80, // Header section height
  statsBarHeight: 60, // Stats bar height
  footerHeight: 60, // Footer height
  
  // Typography (from HTML CSS)
  fonts: {
    dateTitle: { size: 24, weight: 'bold' },
    subtitle: { size: 14, weight: 'normal' },
    statNumber: { size: 24, weight: 'bold' },
    statLabel: { size: 12, weight: 'normal' },
    timeLabel: { size: 11, weight: 'bold' },
    appointmentTitle: { size: 11, weight: 'bold' },
    appointmentSubtitle: { size: 8, weight: 'normal' },
    appointmentTime: { size: 16, weight: 'bold' },
    serviceIcon: { size: 13, weight: 'normal' },
    navButton: { size: 12, weight: 'normal' }
  },
  
  // Colors (from HTML CSS)
  colors: {
    white: [255, 255, 255],
    black: [0, 0, 0],
    gray: [102, 102, 102],
    lightGray: [233, 236, 239],
    mediumGray: [204, 204, 204],
    darkGray: [51, 51, 51],
    headerBackground: [248, 249, 250],
    hourSlotBackground: [233, 236, 239],
    halfHourSlotBackground: [255, 255, 255],
    appointmentBorder: [108, 155, 209],
    simplePracticeColor: [66, 133, 244],
    googleColor: [52, 168, 83],
    holidayColor: [251, 188, 4]
  },
  
  // Appointment styling (from HTML CSS)
  appointment: {
    borderWidth: 1,
    leftBorderWidth: 4,
    borderRadius: 2,
    padding: 4,
    height: 56, // 60px container - 4px padding
    marginTop: 2,
    marginLeft: 2,
    marginRight: 3
  }
};

// Device-specific configurations
const DEVICE_CONFIGS = {
  remarkable: {
    pageWidth: 507,
    pageHeight: 677,
    margin: 15,
    scaleFactor: 0.63 // Scale down for reMarkable
  },
  usLetter: {
    pageWidth: 612,
    pageHeight: 792,
    margin: 25,
    scaleFactor: 0.75 // Scale down for US Letter
  }
};

// Time slots from 6:00 AM to 11:30 PM (matching HTML)
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

/**
 * Strict appointment filtering to exclude test appointments and ghost events
 */
function filterRealAppointments(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(event => {
    // Filter out test appointments and ghost events
    if (event.title && (
      event.title.toLowerCase().includes('test-e') ||
      event.title.toLowerCase().includes('event test') ||
      event.title.toLowerCase().includes('test-appointment') ||
      event.title.toLowerCase().includes('ghost') ||
      event.title.toLowerCase().includes('paul benjamin') ||
      event.title.trim() === '' ||
      event.title.trim().length === 0
    )) {
      console.log(`❌ FILTERED OUT test/ghost appointment: "${event.title}"`);
      return false;
    }
    
    return true;
  });
}

/**
 * Comprehensive emoji and Unicode artifact removal
 */
function stripLeadingEmoji(text: string): string {
  if (!text) return '';
  
  // Remove leading emoji and Unicode artifacts
  let cleaned = text
    .replace(/^[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    .replace(/^🔒\s*/, '') // Remove lock emoji
    .replace(/^[^\w\s\-\.,:;!?'"()]+\s*/, '') // Remove non-printable leading characters
    .replace(/Ø=Ý/g, '') // Remove encoding artifacts
    .replace(/Ø=ÜÅ/g, '') // Remove encoding artifacts
    .trim();
  
  // Remove "Appointment" suffix if present
  if (cleaned.endsWith(' Appointment')) {
    cleaned = cleaned.replace(' Appointment', '');
  }
  
  return cleaned;
}

/**
 * Get event type information for styling
 */
function getEventTypeInfo(event: CalendarEvent) {
  const isSimplePractice = event.source === 'simplepractice' || 
                          event.title?.includes('Appointment') || 
                          event.calendarId?.includes('simplepractice');
  const isGoogle = event.source === 'google' || 
                   event.calendarId?.includes('google');
  const isHoliday = event.source === 'holiday' || 
                    event.calendarId?.includes('holiday');
  
  return { isSimplePractice, isGoogle, isHoliday };
}

/**
 * Draw header section matching HTML layout
 */
function drawHeader(pdf: jsPDF, selectedDate: Date, appointmentCount: number, config: any) {
  const { margin, scaleFactor } = config;
  const { headerHeight, colors, fonts } = HTML_TEMPLATE_CONSTANTS;
  
  const headerY = margin;
  const headerWidth = (config.pageWidth - 2 * margin);
  
  // Header background
  pdf.setFillColor(...colors.headerBackground);
  pdf.rect(margin, headerY, headerWidth, headerHeight * scaleFactor, 'F');
  
  // Header border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...colors.darkGray);
  pdf.rect(margin, headerY, headerWidth, headerHeight * scaleFactor);
  
  // Date title
  pdf.setFontSize(fonts.dateTitle.size * scaleFactor);
  pdf.setFont('helvetica', fonts.dateTitle.weight);
  pdf.setTextColor(...colors.black);
  const dateTitle = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateTitle, margin + 10, headerY + 20 * scaleFactor);
  
  // Subtitle
  pdf.setFontSize(fonts.subtitle.size * scaleFactor);
  pdf.setFont('helvetica', fonts.subtitle.weight);
  pdf.setTextColor(...colors.gray);
  pdf.text(`${appointmentCount} appointments`, margin + 10, headerY + 35 * scaleFactor);
  
  // Service icons/legend (right side)
  const legendX = margin + headerWidth - 200 * scaleFactor;
  pdf.setFontSize(fonts.serviceIcon.size * scaleFactor);
  pdf.setFont('helvetica', fonts.serviceIcon.weight);
  pdf.setTextColor(...colors.black);
  
  // SimplePractice icon
  pdf.setFillColor(...colors.simplePracticeColor);
  pdf.rect(legendX, headerY + 15 * scaleFactor, 14 * scaleFactor, 14 * scaleFactor, 'F');
  pdf.text('SimplePractice', legendX + 20 * scaleFactor, headerY + 25 * scaleFactor);
  
  // Google Calendar icon
  pdf.setFillColor(...colors.googleColor);
  pdf.rect(legendX, headerY + 35 * scaleFactor, 14 * scaleFactor, 14 * scaleFactor, 'F');
  pdf.text('Google Calendar', legendX + 20 * scaleFactor, headerY + 45 * scaleFactor);
  
  // Holidays icon
  pdf.setFillColor(...colors.holidayColor);
  pdf.rect(legendX + 120 * scaleFactor, headerY + 35 * scaleFactor, 14 * scaleFactor, 14 * scaleFactor, 'F');
  pdf.text('Holidays', legendX + 140 * scaleFactor, headerY + 45 * scaleFactor);
  
  return headerY + headerHeight * scaleFactor;
}

/**
 * Draw stats bar matching HTML layout
 */
function drawStatsBar(pdf: jsPDF, events: CalendarEvent[], config: any, yPosition: number) {
  const { margin, scaleFactor } = config;
  const { statsBarHeight, colors, fonts } = HTML_TEMPLATE_CONSTANTS;
  
  const statsWidth = (config.pageWidth - 2 * margin);
  
  // Stats bar background
  pdf.setFillColor(...colors.headerBackground);
  pdf.rect(margin, yPosition, statsWidth, statsBarHeight * scaleFactor, 'F');
  
  // Stats bar border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...colors.darkGray);
  pdf.rect(margin, yPosition, statsWidth, statsBarHeight * scaleFactor);
  
  // Calculate stats
  const appointmentCount = events.length;
  const totalScheduled = events.reduce((sum, event) => {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const totalAvailable = 17.5; // 6:00 AM to 11:30 PM
  const freeTime = Math.max(0, totalAvailable - totalScheduled);
  const freeTimePercent = Math.round((freeTime / totalAvailable) * 100);
  
  // Draw stats
  const statWidth = statsWidth / 4;
  const stats = [
    { label: 'Appointments', value: appointmentCount.toString() },
    { label: 'Scheduled', value: `${totalScheduled.toFixed(1)}h` },
    { label: 'Available', value: `${freeTime.toFixed(1)}h` },
    { label: 'Free Time', value: `${freeTimePercent}%` }
  ];
  
  stats.forEach((stat, index) => {
    const statX = margin + index * statWidth + statWidth / 2;
    
    // Stat number
    pdf.setFontSize(fonts.statNumber.size * scaleFactor);
    pdf.setFont('helvetica', fonts.statNumber.weight);
    pdf.setTextColor(...colors.black);
    pdf.text(stat.value, statX, yPosition + 25 * scaleFactor, { align: 'center' });
    
    // Stat label
    pdf.setFontSize(fonts.statLabel.size * scaleFactor);
    pdf.setFont('helvetica', fonts.statLabel.weight);
    pdf.setTextColor(...colors.gray);
    pdf.text(stat.label, statX, yPosition + 40 * scaleFactor, { align: 'center' });
  });
  
  return yPosition + statsBarHeight * scaleFactor;
}

/**
 * Draw time grid matching HTML layout
 */
function drawTimeGrid(pdf: jsPDF, config: any, yPosition: number) {
  const { margin, scaleFactor } = config;
  const { timeSlotHeight, timeColumnWidth, colors, fonts } = HTML_TEMPLATE_CONSTANTS;
  
  const gridWidth = config.pageWidth - 2 * margin;
  const contentWidth = gridWidth - timeColumnWidth * scaleFactor;
  
  let currentY = yPosition;
  
  // Draw time slots
  TIME_SLOTS.forEach((timeSlot, index) => {
    const isHour = timeSlot.endsWith(':00');
    const slotHeight = timeSlotHeight * scaleFactor;
    
    // Time slot background
    if (isHour) {
      pdf.setFillColor(...colors.hourSlotBackground);
    } else {
      pdf.setFillColor(...colors.halfHourSlotBackground);
    }
    pdf.rect(margin, currentY, gridWidth, slotHeight, 'F');
    
    // Time column background
    if (isHour) {
      pdf.setFillColor(...colors.hourSlotBackground);
    } else {
      pdf.setFillColor(...colors.halfHourSlotBackground);
    }
    pdf.rect(margin, currentY, timeColumnWidth * scaleFactor, slotHeight, 'F');
    
    // Time label
    pdf.setFontSize(fonts.timeLabel.size * scaleFactor);
    pdf.setFont('helvetica', fonts.timeLabel.weight);
    pdf.setTextColor(...colors.black);
    pdf.text(timeSlot, margin + (timeColumnWidth * scaleFactor) / 2, currentY + slotHeight / 2 + 3, { align: 'center' });
    
    // Horizontal grid line
    pdf.setLineWidth(isHour ? 1 : 0.5);
    pdf.setDrawColor(...colors.mediumGray);
    pdf.line(margin, currentY + slotHeight, margin + gridWidth, currentY + slotHeight);
    
    currentY += slotHeight;
  });
  
  // Vertical separator (time column border)
  pdf.setLineWidth(1);
  pdf.setDrawColor(...colors.darkGray);
  pdf.line(margin + timeColumnWidth * scaleFactor, yPosition, margin + timeColumnWidth * scaleFactor, currentY);
  
  return { gridStartY: yPosition, gridEndY: currentY };
}

/**
 * Draw appointments matching HTML layout
 */
function drawAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[], config: any, gridStartY: number) {
  const { margin, scaleFactor } = config;
  const { timeSlotHeight, timeColumnWidth, colors, fonts, appointment } = HTML_TEMPLATE_CONSTANTS;
  
  // Filter events for the selected day
  const selectedDateString = selectedDate.toISOString().split('T')[0];
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventDateString = eventDate.toISOString().split('T')[0];
    return eventDateString === selectedDateString;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  console.log(`📅 Rendering ${dayEvents.length} appointments for ${selectedDateString}`);
  
  dayEvents.forEach((event, index) => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    
    // Calculate position in grid
    const startSlotIndex = (startHour - 6) * 2 + (startMinute >= 30 ? 1 : 0);
    const endSlotIndex = (endHour - 6) * 2 + (endMinute >= 30 ? 1 : 0);
    const durationSlots = Math.max(1, endSlotIndex - startSlotIndex);
    
    // Skip if outside time range
    if (startSlotIndex < 0 || startSlotIndex >= TIME_SLOTS.length) {
      console.log(`⚠️ Skipping appointment outside time range: ${event.title}`);
      return;
    }
    
    // Calculate appointment position and size
    const appointmentY = gridStartY + startSlotIndex * timeSlotHeight * scaleFactor + appointment.marginTop * scaleFactor;
    const appointmentX = margin + timeColumnWidth * scaleFactor + appointment.marginLeft * scaleFactor;
    const appointmentWidth = (config.pageWidth - 2 * margin - timeColumnWidth * scaleFactor) - (appointment.marginLeft + appointment.marginRight) * scaleFactor;
    const appointmentHeight = Math.max(appointment.height * scaleFactor, durationSlots * timeSlotHeight * scaleFactor - 4 * scaleFactor);
    
    // Get event type for styling
    const { isSimplePractice, isGoogle, isHoliday } = getEventTypeInfo(event);
    
    // Draw appointment box
    pdf.setFillColor(...colors.white);
    pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight, 'F');
    
    // Draw appointment border
    if (isSimplePractice) {
      // SimplePractice: blue border with thick left border
      pdf.setLineWidth(appointment.borderWidth);
      pdf.setDrawColor(...colors.appointmentBorder);
      pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight);
      
      // Thick left border
      pdf.setLineWidth(appointment.leftBorderWidth);
      pdf.setDrawColor(...colors.simplePracticeColor);
      pdf.line(appointmentX, appointmentY, appointmentX, appointmentY + appointmentHeight);
    } else if (isGoogle) {
      // Google Calendar: dashed green border
      pdf.setLineWidth(appointment.borderWidth);
      pdf.setDrawColor(...colors.googleColor);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight);
      pdf.setLineDashPattern([], 0); // Reset dash pattern
    } else if (isHoliday) {
      // Holiday: yellow background with orange border
      pdf.setFillColor(...colors.holidayColor);
      pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight, 'F');
      pdf.setLineWidth(appointment.borderWidth);
      pdf.setDrawColor(255, 165, 0); // Orange
      pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight);
    }
    
    // Draw appointment text
    const textX = appointmentX + appointment.padding * scaleFactor;
    let textY = appointmentY + 12 * scaleFactor;
    
    // Clean title
    const cleanTitle = stripLeadingEmoji(event.title || '');
    
    // Appointment title
    pdf.setFontSize(fonts.appointmentTitle.size * scaleFactor);
    pdf.setFont('helvetica', fonts.appointmentTitle.weight);
    pdf.setTextColor(...colors.black);
    pdf.text(cleanTitle, textX, textY);
    
    // Appointment subtitle (source)
    textY += 10 * scaleFactor;
    pdf.setFontSize(fonts.appointmentSubtitle.size * scaleFactor);
    pdf.setFont('helvetica', fonts.appointmentSubtitle.weight);
    pdf.setTextColor(...colors.gray);
    
    let sourceText = 'MANUAL';
    if (isSimplePractice) sourceText = 'SIMPLEPRACTICE';
    else if (isGoogle) sourceText = 'GOOGLE CALENDAR';
    else if (isHoliday) sourceText = 'HOLIDAYS IN UNITED STATES';
    
    pdf.text(sourceText, textX, textY);
    
    // Appointment time
    textY += 12 * scaleFactor;
    pdf.setFontSize(fonts.appointmentTime.size * scaleFactor);
    pdf.setFont('helvetica', fonts.appointmentTime.weight);
    pdf.setTextColor(...colors.black);
    
    const startTimeStr = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const timeRange = `${startTimeStr}-${endTimeStr}`;
    
    pdf.text(timeRange, textX, textY);
    
    console.log(`✅ Rendered appointment: ${cleanTitle} (${timeRange})`);
  });
}

/**
 * Draw footer matching HTML layout
 */
function drawFooter(pdf: jsPDF, selectedDate: Date, config: any, yPosition: number) {
  const { margin, scaleFactor } = config;
  const { footerHeight, colors, fonts } = HTML_TEMPLATE_CONSTANTS;
  
  const footerWidth = config.pageWidth - 2 * margin;
  
  // Footer background
  pdf.setFillColor(...colors.headerBackground);
  pdf.rect(margin, yPosition, footerWidth, footerHeight * scaleFactor, 'F');
  
  // Footer border
  pdf.setLineWidth(1);
  pdf.setDrawColor(...colors.darkGray);
  pdf.rect(margin, yPosition, footerWidth, footerHeight * scaleFactor);
  
  // Previous day button
  pdf.setFillColor(...colors.lightGray);
  pdf.rect(margin + 10 * scaleFactor, yPosition + 15 * scaleFactor, 80 * scaleFactor, 25 * scaleFactor, 'F');
  pdf.setLineWidth(1);
  pdf.setDrawColor(...colors.mediumGray);
  pdf.rect(margin + 10 * scaleFactor, yPosition + 15 * scaleFactor, 80 * scaleFactor, 25 * scaleFactor);
  
  const prevDate = new Date(selectedDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDayName = prevDate.toLocaleDateString('en-US', { weekday: 'long' });
  
  pdf.setFontSize(fonts.navButton.size * scaleFactor);
  pdf.setFont('helvetica', fonts.navButton.weight);
  pdf.setTextColor(...colors.black);
  pdf.text(`← ${prevDayName}`, margin + 50 * scaleFactor, yPosition + 30 * scaleFactor, { align: 'center' });
  
  // Weekly overview button (center)
  pdf.setFillColor(...colors.lightGray);
  pdf.rect(margin + footerWidth/2 - 60 * scaleFactor, yPosition + 15 * scaleFactor, 120 * scaleFactor, 25 * scaleFactor, 'F');
  pdf.setLineWidth(1);
  pdf.setDrawColor(...colors.mediumGray);
  pdf.rect(margin + footerWidth/2 - 60 * scaleFactor, yPosition + 15 * scaleFactor, 120 * scaleFactor, 25 * scaleFactor);
  
  pdf.text('📅 Weekly Overview', margin + footerWidth/2, yPosition + 30 * scaleFactor, { align: 'center' });
  
  // Next day button
  pdf.setFillColor(...colors.lightGray);
  pdf.rect(margin + footerWidth - 90 * scaleFactor, yPosition + 15 * scaleFactor, 80 * scaleFactor, 25 * scaleFactor, 'F');
  pdf.setLineWidth(1);
  pdf.setDrawColor(...colors.mediumGray);
  pdf.rect(margin + footerWidth - 90 * scaleFactor, yPosition + 15 * scaleFactor, 80 * scaleFactor, 25 * scaleFactor);
  
  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDayName = nextDate.toLocaleDateString('en-US', { weekday: 'long' });
  
  pdf.text(`${nextDayName} →`, margin + footerWidth - 50 * scaleFactor, yPosition + 30 * scaleFactor, { align: 'center' });
}

/**
 * Main export function - creates pixel-perfect HTML replica
 */
export async function exportHTMLTemplatePerfect(
  selectedDate: Date,
  events: CalendarEvent[],
  deviceType: 'remarkable' | 'usLetter' = 'usLetter'
): Promise<void> {
  try {
    console.log('🎯 Starting HTML Template Perfect Export');
    
    // Get device configuration
    const config = DEVICE_CONFIGS[deviceType];
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [config.pageWidth, config.pageHeight]
    });
    
    // Filter real appointments only
    const realEvents = filterRealAppointments(events);
    console.log(`📋 Filtered ${events.length} → ${realEvents.length} real appointments`);
    
    // Draw sections in exact HTML order
    let currentY = config.margin;
    
    // 1. Header
    currentY = drawHeader(pdf, selectedDate, realEvents.length, config);
    
    // 2. Stats bar
    currentY = drawStatsBar(pdf, realEvents, config, currentY);
    
    // 3. Time grid
    const { gridStartY, gridEndY } = drawTimeGrid(pdf, config, currentY);
    
    // 4. Appointments
    drawAppointments(pdf, selectedDate, realEvents, config, gridStartY);
    
    // 5. Footer
    drawFooter(pdf, selectedDate, config, gridEndY + 10);
    
    // Save PDF
    const dateStr = selectedDate.toISOString().split('T')[0];
    const filename = `daily-template-${dateStr}-${deviceType}.pdf`;
    
    // Use a promise-based approach for saving
    await new Promise<void>((resolve, reject) => {
      try {
        pdf.save(filename);
        console.log(`✅ HTML Template Perfect PDF exported: ${filename}`);
        resolve();
      } catch (error) {
        console.error('❌ Error saving PDF:', error);
        reject(error);
      }
    });
    
  } catch (error) {
    console.error('❌ HTML Template Perfect Export failed:', error);
    throw error;
  }
}