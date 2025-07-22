import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Exact HTML Template Constants - Direct from CSS
const TEMPLATE_CONSTANTS = {
  // Page dimensions
  page: {
    width: 612,    // US Letter width
    height: 792,   // US Letter height
    margin: 20
  },
  
  // Layout measurements (exact from CSS)
  layout: {
    maxWidth: 800,
    timeSlotHeight: 30,
    timeLabelWidth: 80,
    headerPadding: 15,
    statsBarPadding: 15,
    footerPadding: 15,
    appointmentHeight: 56,
    appointmentContainerHeight: 60,
    appointmentOffsetLeft: 81,
    appointmentTopOffset: 2,
    appointmentLeftOffset: 2,
    appointmentRightOffset: 3
  },
  
  // Typography (exact from CSS)
  fonts: {
    dateTitle: { size: 24, weight: 'bold' },
    subtitle: { size: 14, weight: 'normal', color: '#666' },
    statNumber: { size: 24, weight: 'bold' },
    statLabel: { size: 12, weight: 'normal', color: '#666' },
    timeLabel: { size: 11, weight: 'bold' },
    serviceIcon: { size: 13, weight: 'normal' },
    appointmentTitle: { size: 11, weight: 'bold' },
    appointmentSubtitle: { size: 8, weight: 'normal', color: '#999' },
    appointmentTime: { size: 16, weight: 'bold' },
    navBtn: { size: 12, weight: 'normal' }
  },
  
  // Colors (exact from CSS)
  colors: {
    background: '#f5f5f5',
    white: '#ffffff',
    black: '#000000',
    headerBg: '#f8f9fa',
    borderDark: '#333333',
    borderLight: '#e0e0e0',
    borderMedium: '#ccc',
    hourSlotBg: '#e9ecef',
    halfHourSlotBg: '#ffffff',
    simplePracticeMain: '#4285f4',
    simplePracticeBorder: '#6c9bd1',
    googleMain: '#34a853',
    holidaysMain: '#fbbc04',
    grayText: '#666',
    lightGrayText: '#999',
    buttonBg: '#e9ecef'
  }
};

// Time slots from HTML
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

// Device configurations
const DEVICE_CONFIGS = {
  remarkable: {
    pageWidth: 507,
    pageHeight: 677,
    scaleFactor: 0.6
  },
  usLetter: {
    pageWidth: 612,
    pageHeight: 792,
    scaleFactor: 0.75
  }
};

/**
 * Filter real appointments (exclude test appointments)
 */
function filterRealAppointments(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(event => {
    const title = event.title?.toLowerCase() || '';
    const isTestEvent = title.includes('test-e') || 
                       title.includes('event test') || 
                       title.includes('ghost') ||
                       title.trim() === '';
    
    if (isTestEvent) {
      console.log(`🚫 Filtering out test appointment: "${event.title}"`);
    }
    
    return !isTestEvent;
  });
}

/**
 * Clean title by removing emoji and appointment suffix
 */
function cleanTitle(title: string): string {
  if (!title) return '';
  
  // Remove emoji and special characters
  let cleaned = title.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  
  // Remove " Appointment" suffix
  cleaned = cleaned.replace(/\s+Appointment\s*$/i, '');
  
  return cleaned.trim();
}

/**
 * Draw header section exactly like HTML
 */
function drawHeader(pdf: jsPDF, selectedDate: Date, appointmentCount: number, config: any): number {
  const { margin, scaleFactor } = config;
  const { layout, fonts, colors } = TEMPLATE_CONSTANTS;
  
  const headerHeight = 80 * scaleFactor;
  const headerWidth = config.pageWidth - 2 * margin;
  
  // Header background
  pdf.setFillColor(colors.headerBg);
  pdf.rect(margin, margin, headerWidth, headerHeight, 'F');
  
  // Header border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, margin, headerWidth, headerHeight);
  
  // Date section (left side)
  const dateX = margin + layout.headerPadding * scaleFactor;
  const dateY = margin + 25 * scaleFactor;
  
  // Weekly overview button
  const btnWidth = 100 * scaleFactor;
  const btnHeight = 25 * scaleFactor;
  pdf.setFillColor(colors.buttonBg);
  pdf.rect(dateX, dateY - 20 * scaleFactor, btnWidth, btnHeight, 'F');
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(colors.borderMedium);
  pdf.rect(dateX, dateY - 20 * scaleFactor, btnWidth, btnHeight);
  
  pdf.setFontSize(fonts.navBtn.size * scaleFactor);
  pdf.setFont('helvetica', fonts.navBtn.weight);
  pdf.setTextColor(colors.black);
  pdf.text('📅 Weekly Overview', dateX + btnWidth/2, dateY - 8 * scaleFactor, { align: 'center' });
  
  // Date title
  pdf.setFontSize(fonts.dateTitle.size * scaleFactor);
  pdf.setFont('helvetica', fonts.dateTitle.weight);
  pdf.setTextColor(colors.black);
  const formattedDate = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(formattedDate, dateX, dateY + 15 * scaleFactor);
  
  // Subtitle
  pdf.setFontSize(fonts.subtitle.size * scaleFactor);
  pdf.setFont('helvetica', fonts.subtitle.weight);
  pdf.setTextColor(colors.grayText);
  pdf.text(`${appointmentCount} appointments`, dateX, dateY + 35 * scaleFactor);
  
  // Service icons (right side)
  const iconsX = margin + headerWidth - 200 * scaleFactor;
  const iconsY = dateY;
  
  // SimplePractice icon
  pdf.setFillColor(colors.simplePracticeMain);
  pdf.rect(iconsX, iconsY, 14 * scaleFactor, 14 * scaleFactor, 'F');
  pdf.setFontSize(fonts.serviceIcon.size * scaleFactor);
  pdf.setTextColor(colors.black);
  pdf.text('SimplePractice', iconsX + 20 * scaleFactor, iconsY + 10 * scaleFactor);
  
  // Google icon
  pdf.setFillColor(colors.googleMain);
  pdf.rect(iconsX, iconsY + 20 * scaleFactor, 14 * scaleFactor, 14 * scaleFactor, 'F');
  pdf.text('Google', iconsX + 20 * scaleFactor, iconsY + 30 * scaleFactor);
  
  // Holidays icon
  pdf.setFillColor(colors.holidaysMain);
  pdf.rect(iconsX + 80 * scaleFactor, iconsY + 20 * scaleFactor, 14 * scaleFactor, 14 * scaleFactor, 'F');
  pdf.text('Holidays', iconsX + 100 * scaleFactor, iconsY + 30 * scaleFactor);
  
  return margin + headerHeight;
}

/**
 * Draw stats bar exactly like HTML
 */
function drawStatsBar(pdf: jsPDF, events: CalendarEvent[], config: any, yPosition: number): number {
  const { margin, scaleFactor } = config;
  const { layout, fonts, colors } = TEMPLATE_CONSTANTS;
  
  const statsHeight = 60 * scaleFactor;
  const statsWidth = config.pageWidth - 2 * margin;
  
  // Stats background
  pdf.setFillColor(colors.headerBg);
  pdf.rect(margin, yPosition, statsWidth, statsHeight, 'F');
  
  // Stats border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, yPosition, statsWidth, statsHeight);
  
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
    pdf.setTextColor(colors.black);
    pdf.text(stat.value, statX, yPosition + 25 * scaleFactor, { align: 'center' });
    
    // Stat label
    pdf.setFontSize(fonts.statLabel.size * scaleFactor);
    pdf.setFont('helvetica', fonts.statLabel.weight);
    pdf.setTextColor(colors.grayText);
    pdf.text(stat.label, statX, yPosition + 45 * scaleFactor, { align: 'center' });
  });
  
  return yPosition + statsHeight;
}

/**
 * Draw time grid exactly like HTML
 */
function drawTimeGrid(pdf: jsPDF, config: any, yPosition: number): { gridStartY: number, gridEndY: number } {
  const { margin, scaleFactor } = config;
  const { layout, fonts, colors } = TEMPLATE_CONSTANTS;
  
  const gridWidth = config.pageWidth - 2 * margin;
  let currentY = yPosition;
  
  // Draw time slots
  TIME_SLOTS.forEach((timeSlot, index) => {
    const isHour = timeSlot.endsWith(':00');
    const slotHeight = layout.timeSlotHeight * scaleFactor;
    
    // Time slot background
    if (isHour) {
      pdf.setFillColor(colors.hourSlotBg);
    } else {
      pdf.setFillColor(colors.halfHourSlotBg);
    }
    pdf.rect(margin, currentY, gridWidth, slotHeight, 'F');
    
    // Time label background
    if (isHour) {
      pdf.setFillColor(colors.hourSlotBg);
    } else {
      pdf.setFillColor(colors.halfHourSlotBg);
    }
    pdf.rect(margin, currentY, layout.timeLabelWidth * scaleFactor, slotHeight, 'F');
    
    // Time label
    pdf.setFontSize(fonts.timeLabel.size * scaleFactor);
    pdf.setFont('helvetica', fonts.timeLabel.weight);
    pdf.setTextColor(colors.black);
    pdf.text(timeSlot, margin + (layout.timeLabelWidth * scaleFactor) / 2, currentY + slotHeight / 2 + 3, { align: 'center' });
    
    // Bottom border
    pdf.setLineWidth(isHour ? 1 : 0.5);
    pdf.setDrawColor(isHour ? colors.borderMedium : colors.borderLight);
    pdf.line(margin, currentY + slotHeight, margin + gridWidth, currentY + slotHeight);
    
    currentY += slotHeight;
  });
  
  // Time column right border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.line(margin + layout.timeLabelWidth * scaleFactor, yPosition, margin + layout.timeLabelWidth * scaleFactor, currentY);
  
  return { gridStartY: yPosition, gridEndY: currentY };
}

/**
 * Draw appointments exactly like HTML
 */
function drawAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[], config: any, gridStartY: number) {
  const { margin, scaleFactor } = config;
  const { layout, fonts, colors } = TEMPLATE_CONSTANTS;
  
  // Filter events for selected date
  const selectedDateString = selectedDate.toISOString().split('T')[0];
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toISOString().split('T')[0] === selectedDateString;
  });
  
  console.log(`📅 Drawing ${dayEvents.length} appointments for ${selectedDate.toDateString()}`);
  
  dayEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const eventEndDate = new Date(event.endTime);
    
    // Calculate time slot position
    const startHour = eventDate.getHours();
    const startMinutes = eventDate.getMinutes();
    const startSlotIndex = TIME_SLOTS.findIndex(slot => {
      const [slotHour, slotMinutes] = slot.split(':').map(Number);
      return slotHour === startHour && slotMinutes === startMinutes;
    });
    
    if (startSlotIndex === -1) return;
    
    // Calculate appointment position (exact HTML positioning)
    const appointmentY = gridStartY + startSlotIndex * layout.timeSlotHeight * scaleFactor + layout.appointmentTopOffset * scaleFactor;
    const appointmentX = margin + layout.appointmentOffsetLeft * scaleFactor + layout.appointmentLeftOffset * scaleFactor;
    const appointmentWidth = (config.pageWidth - 2 * margin - layout.appointmentOffsetLeft * scaleFactor - layout.appointmentRightOffset * scaleFactor);
    const appointmentHeight = layout.appointmentHeight * scaleFactor;
    
    // Determine appointment type
    const isSimplePractice = event.source === 'simplepractice' || event.title?.includes('Appointment');
    const isGoogle = event.source === 'google';
    const isHoliday = event.source === 'manual' || event.title?.toLowerCase().includes('holiday');
    
    // Draw appointment background
    pdf.setFillColor(colors.white);
    pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight, 'F');
    
    // Draw appointment border based on type
    if (isSimplePractice) {
      // SimplePractice: blue border with thick left border
      pdf.setLineWidth(1);
      pdf.setDrawColor(colors.simplePracticeBorder);
      pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight);
      
      // Thick left border
      pdf.setLineWidth(4);
      pdf.setDrawColor(colors.simplePracticeMain);
      pdf.line(appointmentX, appointmentY, appointmentX, appointmentY + appointmentHeight);
    } else if (isGoogle) {
      // Google: dashed green border
      pdf.setLineWidth(1);
      pdf.setDrawColor(colors.googleMain);
      pdf.setLineDashPattern([3, 2], 0);
      pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight);
      pdf.setLineDashPattern([], 0);
    } else if (isHoliday) {
      // Holiday: yellow background with border
      pdf.setFillColor(colors.holidaysMain);
      pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight, 'F');
      pdf.setLineWidth(1);
      pdf.setDrawColor(colors.borderDark);
      pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight);
    }
    
    // Draw appointment content
    const textX = appointmentX + 8 * scaleFactor;
    let textY = appointmentY + 12 * scaleFactor;
    
    // Title
    const cleanedTitle = cleanTitle(event.title || '');
    pdf.setFontSize(fonts.appointmentTitle.size * scaleFactor);
    pdf.setFont('helvetica', fonts.appointmentTitle.weight);
    pdf.setTextColor(colors.black);
    pdf.text(cleanedTitle, textX, textY);
    
    // Subtitle (source)
    textY += 12 * scaleFactor;
    pdf.setFontSize(fonts.appointmentSubtitle.size * scaleFactor);
    pdf.setFont('helvetica', fonts.appointmentSubtitle.weight);
    pdf.setTextColor(colors.lightGrayText);
    
    let sourceText = 'MANUAL';
    if (isSimplePractice) sourceText = 'SIMPLEPRACTICE';
    else if (isGoogle) sourceText = 'GOOGLE';
    else if (isHoliday) sourceText = 'HOLIDAYS';
    
    pdf.text(sourceText, textX, textY);
    
    // Time
    textY += 18 * scaleFactor;
    pdf.setFontSize(fonts.appointmentTime.size * scaleFactor);
    pdf.setFont('helvetica', fonts.appointmentTime.weight);
    pdf.setTextColor(colors.black);
    
    const startTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const endTime = eventEndDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    pdf.text(`${startTime}-${endTime}`, textX, textY);
    
    console.log(`✅ Drew appointment: ${cleanedTitle} (${startTime}-${endTime})`);
  });
}

/**
 * Draw footer exactly like HTML
 */
function drawFooter(pdf: jsPDF, selectedDate: Date, config: any, yPosition: number) {
  const { margin, scaleFactor } = config;
  const { layout, fonts, colors } = TEMPLATE_CONSTANTS;
  
  const footerHeight = 50 * scaleFactor;
  const footerWidth = config.pageWidth - 2 * margin;
  
  // Footer background
  pdf.setFillColor(colors.headerBg);
  pdf.rect(margin, yPosition, footerWidth, footerHeight, 'F');
  
  // Footer border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, yPosition, footerWidth, footerHeight);
  
  // Navigation buttons
  const btnHeight = 25 * scaleFactor;
  const btnY = yPosition + (footerHeight - btnHeight) / 2;
  
  // Previous day button
  const prevBtnWidth = 80 * scaleFactor;
  const prevBtnX = margin + 15 * scaleFactor;
  
  pdf.setFillColor(colors.buttonBg);
  pdf.rect(prevBtnX, btnY, prevBtnWidth, btnHeight, 'F');
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(colors.borderMedium);
  pdf.rect(prevBtnX, btnY, prevBtnWidth, btnHeight);
  
  const prevDate = new Date(selectedDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDayName = prevDate.toLocaleDateString('en-US', { weekday: 'short' });
  
  pdf.setFontSize(fonts.navBtn.size * scaleFactor);
  pdf.setFont('helvetica', fonts.navBtn.weight);
  pdf.setTextColor(colors.black);
  pdf.text(`← ${prevDayName}`, prevBtnX + prevBtnWidth/2, btnY + btnHeight/2 + 3, { align: 'center' });
  
  // Weekly overview button (center)
  const weeklyBtnWidth = 120 * scaleFactor;
  const weeklyBtnX = margin + (footerWidth - weeklyBtnWidth) / 2;
  
  pdf.setFillColor(colors.buttonBg);
  pdf.rect(weeklyBtnX, btnY, weeklyBtnWidth, btnHeight, 'F');
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(colors.borderMedium);
  pdf.rect(weeklyBtnX, btnY, weeklyBtnWidth, btnHeight);
  
  pdf.text('Weekly Overview', weeklyBtnX + weeklyBtnWidth/2, btnY + btnHeight/2 + 3, { align: 'center' });
  
  // Next day button
  const nextBtnWidth = 80 * scaleFactor;
  const nextBtnX = margin + footerWidth - 15 * scaleFactor - nextBtnWidth;
  
  pdf.setFillColor(colors.buttonBg);
  pdf.rect(nextBtnX, btnY, nextBtnWidth, btnHeight, 'F');
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(colors.borderMedium);
  pdf.rect(nextBtnX, btnY, nextBtnWidth, btnHeight);
  
  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDayName = nextDate.toLocaleDateString('en-US', { weekday: 'short' });
  
  pdf.text(`${nextDayName} →`, nextBtnX + nextBtnWidth/2, btnY + btnHeight/2 + 3, { align: 'center' });
}

/**
 * Main export function - creates pixel-perfect HTML replica
 */
export async function exportHTMLTemplatePerfectFixed(
  selectedDate: Date,
  events: CalendarEvent[],
  deviceType: 'remarkable' | 'usLetter' = 'usLetter'
): Promise<void> {
  try {
    console.log('🎯 Starting HTML Template Perfect Fixed Export');
    console.log(`📱 Device: ${deviceType}`);
    console.log(`📅 Date: ${selectedDate.toDateString()}`);
    console.log(`📊 Total events: ${events.length}`);
    
    // Get device configuration
    const config = DEVICE_CONFIGS[deviceType];
    console.log(`📏 Dimensions: ${config.pageWidth}x${config.pageHeight}pt`);
    
    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [config.pageWidth, config.pageHeight]
    });
    
    // Filter real appointments
    const realEvents = filterRealAppointments(events);
    console.log(`📋 Filtered ${events.length} → ${realEvents.length} real appointments`);
    
    // Draw sections in exact HTML order
    let currentY = config.scaleFactor * 20; // Margin
    
    // 1. Header
    currentY = drawHeader(pdf, selectedDate, realEvents.length, config);
    
    // 2. Stats bar
    currentY = drawStatsBar(pdf, realEvents, config, currentY);
    
    // 3. Time grid
    const { gridStartY, gridEndY } = drawTimeGrid(pdf, config, currentY);
    
    // 4. Appointments
    drawAppointments(pdf, selectedDate, realEvents, config, gridStartY);
    
    // 5. Footer
    drawFooter(pdf, selectedDate, config, gridEndY + 5);
    
    // Save PDF
    const dateStr = selectedDate.toISOString().split('T')[0];
    const filename = `daily-template-${dateStr}-${deviceType}-fixed.pdf`;
    
    await new Promise<void>((resolve, reject) => {
      try {
        pdf.save(filename);
        console.log(`✅ HTML Template Perfect Fixed PDF exported: ${filename}`);
        resolve();
      } catch (error) {
        console.error('❌ Error saving PDF:', error);
        reject(error);
      }
    });
    
  } catch (error) {
    console.error('❌ HTML Template Perfect Fixed Export failed:', error);
    throw error;
  }
}