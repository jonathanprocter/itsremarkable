import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { templateAuditSystem, REFERENCE_TEMPLATE } from './templateAuditSystem';

// Pixel-perfect configuration based on reference template
const PIXEL_PERFECT_CONFIG = {
  // Exact page dimensions from reference
  pageWidth: 612,
  pageHeight: 792,
  margin: 20,
  
  // Layout measurements (exact from reference analysis)
  headerHeight: 100,
  statsBarHeight: 60,
  legendHeight: 30,
  timeSlotHeight: 25,
  timeColumnWidth: 80,
  appointmentColumnWidth: 480,
  footerHeight: 40,
  
  // Typography (matching reference exactly)
  fonts: {
    title: { size: 22, weight: 'bold' },
    subtitle: { size: 14, weight: 'normal' },
    appointmentCount: { size: 14, weight: 'normal' },
    stats: { size: 16, weight: 'bold' },
    statsLabel: { size: 12, weight: 'normal' },
    timeLabel: { size: 11, weight: 'normal' },
    appointmentTitle: { size: 11, weight: 'bold' },
    appointmentSource: { size: 9, weight: 'normal' },
    navigationBtn: { size: 12, weight: 'normal' },
    legendLabel: { size: 11, weight: 'normal' }
  },
  
  // Colors (exact from reference template)
  colors: {
    background: '#ffffff',
    headerBg: '#f8f9fa',
    statsBg: '#f8f9fa',
    legendBg: '#f8f9fa',
    borderDark: '#333333',
    borderLight: '#cccccc',
    borderMedium: '#999999',
    textPrimary: '#000000',
    textSecondary: '#666666',
    textLight: '#999999',
    simplePracticeBlue: '#4285f4',
    googleGreen: '#34a853',
    holidayYellow: '#fbbc04',
    timeSlotEven: '#f8f9fa',
    timeSlotOdd: '#ffffff'
  },
  
  // Appointment positioning (exact pixel positioning)
  appointments: {
    leftOffset: 85,
    rightOffset: 25,
    topOffset: 2,
    bottomOffset: 2,
    maxTitleLength: 15,
    sideMargin: 5
  }
};

// Time slots exactly as in reference
const REFERENCE_TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

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
 * Clean appointment title - exact processing from reference
 */
function cleanAppointmentTitle(title: string): string {
  if (!title) return '';
  
  console.log(`📝 Processing title: "${title}"`);
  
  // Step 1: Remove emoji and special characters
  let cleaned = title.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  console.log(`   After emoji removal: "${cleaned}"`);
  
  // Step 2: Remove " Appointment" suffix
  cleaned = cleaned.replace(/\s+Appointment\s*$/i, '');
  console.log(`   After suffix removal: "${cleaned}"`);
  
  // Step 3: Truncate to max length (matching reference formatting)
  if (cleaned.length > PIXEL_PERFECT_CONFIG.appointments.maxTitleLength) {
    cleaned = cleaned.substring(0, PIXEL_PERFECT_CONFIG.appointments.maxTitleLength);
    console.log(`   After truncation: "${cleaned}"`);
  }
  
  return cleaned.trim();
}

/**
 * Draw pixel-perfect header matching reference exactly
 */
function drawPixelPerfectHeader(pdf: jsPDF, selectedDate: Date, appointmentCount: number): number {
  const { pageWidth, margin, headerHeight, fonts, colors } = PIXEL_PERFECT_CONFIG;
  
  // Header background
  pdf.setFillColor(colors.headerBg);
  pdf.rect(margin, margin, pageWidth - 2 * margin, headerHeight, 'F');
  
  // Header border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, margin, pageWidth - 2 * margin, headerHeight);
  
  // Main title - "Friday, July 18, 2025"
  const fullDateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  pdf.setFontSize(fonts.title.size);
  pdf.setFont('helvetica', fonts.title.weight);
  pdf.setTextColor(colors.textPrimary);
  pdf.text(fullDateStr, pageWidth / 2, margin + 30, { align: 'center' });
  
  // Short date - "Fri, Jul 18"
  const shortDateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  pdf.setFontSize(fonts.subtitle.size);
  pdf.setFont('helvetica', fonts.subtitle.weight);
  pdf.setTextColor(colors.textSecondary);
  pdf.text(shortDateStr, pageWidth / 2, margin + 50, { align: 'center' });
  
  // Appointment count - "8 appointments scheduled"
  pdf.setFontSize(fonts.appointmentCount.size);
  pdf.setFont('helvetica', fonts.appointmentCount.weight);
  pdf.setTextColor(colors.textSecondary);
  pdf.text(`${appointmentCount} appointments scheduled`, pageWidth / 2, margin + 75, { align: 'center' });
  
  console.log(`📋 Header drawn: ${fullDateStr}, ${shortDateStr}, ${appointmentCount} appointments`);
  
  return margin + headerHeight;
}

/**
 * Draw pixel-perfect stats bar matching reference exactly
 */
function drawPixelPerfectStatsBar(pdf: jsPDF, events: CalendarEvent[], yPosition: number): number {
  const { pageWidth, margin, statsBarHeight, fonts, colors } = PIXEL_PERFECT_CONFIG;
  
  // Stats bar background
  pdf.setFillColor(colors.statsBg);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, statsBarHeight, 'F');
  
  // Stats bar border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, statsBarHeight);
  
  // Calculate exact stats matching reference
  const totalAppointments = events.length;
  const scheduledHours = events.reduce((sum, event) => {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const availableHours = 17.5; // 6:00 AM to 11:30 PM
  const freeTime = availableHours - scheduledHours;
  const freeTimePercent = Math.round((freeTime / availableHours) * 100);
  
  // Draw stats in exact format from reference
  const statWidth = (pageWidth - 2 * margin) / 4;
  const stats = [
    { value: totalAppointments.toString(), label: 'Appointments' },
    { value: `${scheduledHours.toFixed(1)}h`, label: 'Scheduled' },
    { value: `${freeTime.toFixed(1)}h`, label: 'Available' },
    { value: `${freeTimePercent}%`, label: 'Free Time' }
  ];
  
  stats.forEach((stat, index) => {
    const statX = margin + index * statWidth + statWidth / 2;
    
    // Large stat number
    pdf.setFontSize(fonts.stats.size);
    pdf.setFont('helvetica', fonts.stats.weight);
    pdf.setTextColor(colors.textPrimary);
    pdf.text(stat.value, statX, yPosition + 25, { align: 'center' });
    
    // Small stat label
    pdf.setFontSize(fonts.statsLabel.size);
    pdf.setFont('helvetica', fonts.statsLabel.weight);
    pdf.setTextColor(colors.textSecondary);
    pdf.text(stat.label, statX, yPosition + 45, { align: 'center' });
  });
  
  console.log(`📊 Stats drawn: ${totalAppointments} appointments, ${scheduledHours.toFixed(1)}h scheduled, ${freeTimePercent}% free`);
  
  return yPosition + statsBarHeight;
}

/**
 * Draw pixel-perfect legend matching reference exactly
 */
function drawPixelPerfectLegend(pdf: jsPDF, yPosition: number): number {
  const { pageWidth, margin, legendHeight, fonts, colors } = PIXEL_PERFECT_CONFIG;
  
  // Legend background
  pdf.setFillColor(colors.legendBg);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, legendHeight, 'F');
  
  // Legend border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, legendHeight);
  
  // Legend items positioned exactly as in reference
  const legendY = yPosition + 20;
  const legendItems = [
    { color: colors.simplePracticeBlue, label: 'SimplePractice' },
    { color: colors.googleGreen, label: 'Google Calendar' },
    { color: colors.holidayYellow, label: 'Holidays' }
  ];
  
  let currentX = margin + 40;
  legendItems.forEach((item, index) => {
    // Color indicator (exact size from reference)
    pdf.setFillColor(item.color);
    pdf.rect(currentX, legendY - 8, 14, 8, 'F');
    
    // Label
    pdf.setFontSize(fonts.legendLabel.size);
    pdf.setFont('helvetica', fonts.legendLabel.weight);
    pdf.setTextColor(colors.textSecondary);
    pdf.text(item.label, currentX + 20, legendY - 2);
    
    currentX += 150;
  });
  
  console.log(`🏷️ Legend drawn with 3 items`);
  
  return yPosition + legendHeight;
}

/**
 * Draw pixel-perfect time grid matching reference exactly
 */
function drawPixelPerfectTimeGrid(pdf: jsPDF, yPosition: number): { gridStartY: number, gridEndY: number } {
  const { pageWidth, margin, timeSlotHeight, timeColumnWidth, fonts, colors } = PIXEL_PERFECT_CONFIG;
  
  let currentY = yPosition;
  
  // Draw time slots with exact alternating background
  REFERENCE_TIME_SLOTS.forEach((timeSlot, index) => {
    const isEvenRow = index % 2 === 0;
    
    // Time slot background (alternating)
    pdf.setFillColor(isEvenRow ? colors.timeSlotEven : colors.timeSlotOdd);
    pdf.rect(margin, currentY, pageWidth - 2 * margin, timeSlotHeight, 'F');
    
    // Time label with exact positioning
    pdf.setFontSize(fonts.timeLabel.size);
    pdf.setFont('helvetica', fonts.timeLabel.weight);
    pdf.setTextColor(colors.textSecondary);
    pdf.text(timeSlot, margin + 15, currentY + 17);
    
    // Time slot horizontal line
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(colors.borderLight);
    pdf.line(margin, currentY + timeSlotHeight, pageWidth - margin, currentY + timeSlotHeight);
    
    currentY += timeSlotHeight;
  });
  
  // Time column vertical separator
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.line(margin + timeColumnWidth, yPosition, margin + timeColumnWidth, currentY);
  
  console.log(`🕐 Time grid drawn: ${REFERENCE_TIME_SLOTS.length} slots from ${REFERENCE_TIME_SLOTS[0]} to ${REFERENCE_TIME_SLOTS[REFERENCE_TIME_SLOTS.length - 1]}`);
  
  return { gridStartY: yPosition, gridEndY: currentY };
}

/**
 * Draw pixel-perfect appointments with exact positioning
 */
function drawPixelPerfectAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[], gridStartY: number) {
  const { margin, timeSlotHeight, timeColumnWidth, appointmentColumnWidth, fonts, colors, appointments } = PIXEL_PERFECT_CONFIG;
  
  // Filter events for selected date
  const selectedDateString = selectedDate.toISOString().split('T')[0];
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toISOString().split('T')[0] === selectedDateString;
  });
  
  console.log(`📅 Drawing ${dayEvents.length} appointments for ${selectedDate.toDateString()}`);
  
  // Group appointments by time slot to handle overlaps
  const timeSlots = new Map<string, CalendarEvent[]>();
  dayEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const timeStr = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    if (!timeSlots.has(timeStr)) {
      timeSlots.set(timeStr, []);
    }
    timeSlots.get(timeStr)!.push(event);
  });
  
  // Draw appointments with exact positioning
  timeSlots.forEach((slotEvents, timeStr) => {
    const slotIndex = REFERENCE_TIME_SLOTS.findIndex(slot => slot === timeStr);
    if (slotIndex === -1) return;
    
    const appointmentY = gridStartY + slotIndex * timeSlotHeight + appointments.topOffset;
    const appointmentX = margin + timeColumnWidth + appointments.sideMargin;
    
    // Handle multiple appointments in same time slot
    const appointmentWidth = slotEvents.length > 1 ? 
      (appointmentColumnWidth - appointments.sideMargin * 2) / slotEvents.length - 5 : 
      appointmentColumnWidth - appointments.sideMargin * 2;
    
    slotEvents.forEach((event, eventIndex) => {
      const eventX = appointmentX + eventIndex * (appointmentWidth + 5);
      
      // Calculate duration in minutes and convert to time slots (30-minute slots)
      const eventEndDate = new Date(event.endTime);
      const durationMs = eventEndDate.getTime() - new Date(event.startTime).getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));
      const timeSlots = Math.max(1, Math.ceil(durationMinutes / 30)); // Minimum 1 slot, round up for partial slots
      
      console.log(`📅 Pixel Perfect Event: ${event.title}, Duration: ${durationMinutes} minutes, Time slots: ${timeSlots}`);
      
      const eventHeight = (timeSlots * timeSlotHeight) - appointments.topOffset - appointments.bottomOffset;
      
      // Determine appointment type and styling
      const isSimplePractice = event.source === 'simplepractice' || event.title?.includes('Appointment');
      const isGoogle = event.source === 'google';
      const isHoliday = event.source === 'manual' || event.title?.toLowerCase().includes('holiday');
      const status = event.status || 'scheduled';
      
      // Handle cancelled appointment styling (exact modal match)
      let bgColor = colors.background;
      let borderColor = colors.borderLight;
      let textColor = colors.textPrimary;
      let showBadge = false;
      let badgeText = '';
      let badgeColor = '';
      let useStrikethrough = false;
      let opacity = 1.0;
      
      if (status === 'clinician_canceled') {
        bgColor = '#e9ecef'; // Exact gray from modal
        borderColor = '#ced4da';
        textColor = '#495057';
        showBadge = true;
        badgeText = 'Clinician Canceled';
        badgeColor = '#6c757d';
        useStrikethrough = true;
        opacity = 0.6;
      } else if (status === 'cancelled') {
        bgColor = '#fff3cd'; // Amber background
        borderColor = '#ffc107';
        textColor = '#856404';
        showBadge = true;
        badgeText = 'Client Canceled';
        badgeColor = '#fd7e14';
        useStrikethrough = true;
      }
      
      // Draw appointment background with proper color
      pdf.setFillColor(bgColor);
      pdf.rect(eventX, appointmentY, appointmentWidth, eventHeight, 'F');
      
      // Draw appointment border with rounded corners effect
      pdf.setLineWidth(1);
      pdf.setDrawColor(borderColor);
      pdf.rect(eventX, appointmentY, appointmentWidth, eventHeight);
      
      // Apply additional border styling based on type (only for non-cancelled)
      if (isSimplePractice && status === 'scheduled') {
        // SimplePractice: blue left border (only for non-cancelled)
        pdf.setLineWidth(4);
        pdf.setDrawColor(colors.simplePracticeBlue);
        pdf.line(eventX, appointmentY, eventX, appointmentY + eventHeight);
      } else if (isGoogle && status === 'scheduled') {
        // Google: dashed green border (only for non-cancelled)
        pdf.setLineWidth(2);
        pdf.setDrawColor(colors.googleGreen);
        pdf.setLineDashPattern([3, 2], 0);
        pdf.rect(eventX, appointmentY, appointmentWidth, eventHeight);
        pdf.setLineDashPattern([], 0);
      } else if (isHoliday && status === 'scheduled') {
        // Holiday: yellow background with dark border (only for non-cancelled)
        pdf.setFillColor(colors.holidayYellow);
        pdf.rect(eventX, appointmentY, appointmentWidth, eventHeight, 'F');
        pdf.setLineWidth(1);
        pdf.setDrawColor(colors.borderDark);
        pdf.rect(eventX, appointmentY, appointmentWidth, eventHeight);
      }
      
      // Draw status badge (top-right corner like modal)
      if (showBadge) {
        const badgeWidth = 70;
        const badgeHeight = 14;
        const badgeX = eventX + appointmentWidth - badgeWidth - 5;
        const badgeY = appointmentY + 3;
        
        // Badge background
        pdf.setFillColor(badgeColor);
        pdf.rect(badgeX, badgeY, badgeWidth, badgeHeight, 'F');
        
        // Badge text
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor('#ffffff');
        pdf.text(badgeText, badgeX + badgeWidth/2, badgeY + 9, { align: 'center' });
      }
      
      // Draw appointment content with proper text color
      const textX = eventX + 6;
      let textY = appointmentY + 13;
      
      // Appointment title with strikethrough if cancelled
      const cleanedTitle = cleanAppointmentTitle(event.title || '');
      pdf.setFontSize(fonts.appointmentTitle.size);
      pdf.setFont('helvetica', fonts.appointmentTitle.weight);
      pdf.setTextColor(textColor);
      pdf.text(cleanedTitle, textX, textY, { maxWidth: appointmentWidth - 12 });
      
      // Add strikethrough effect for cancelled appointments (double line like modal)
      if (useStrikethrough) {
        const titleWidth = Math.min(pdf.getTextWidth(cleanedTitle), appointmentWidth - 12);
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(textColor);
        // Double strikethrough effect
        pdf.line(textX, textY - 2, textX + titleWidth, textY - 2);
        pdf.line(textX, textY - 1, textX + titleWidth, textY - 1);
      }
      
      // Time display with strikethrough if cancelled
      const eventEndTime = new Date(event.endTime);
      const timeText = `${timeStr} - ${eventEndTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      textY += 10;
      pdf.setFontSize(fonts.appointmentSource.size);
      pdf.setFont('helvetica', fonts.appointmentSource.weight);
      pdf.setTextColor(textColor);
      pdf.text(timeText, textX, textY, { maxWidth: appointmentWidth - 12 });
      
      // Add strikethrough to time if cancelled
      if (useStrikethrough) {
        const timeWidth = Math.min(pdf.getTextWidth(timeText), appointmentWidth - 12);
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(textColor);
        // Double strikethrough effect
        pdf.line(textX, textY - 2, textX + timeWidth, textY - 2);
        pdf.line(textX, textY - 1, textX + timeWidth, textY - 1);
      }
      
      // Source label (only if not cancelled or if showing)
      if (!useStrikethrough) {
        let sourceText = 'SIMPLEPRACTICE';
        if (isGoogle) sourceText = 'GOOGLE';
        else if (isHoliday) sourceText = 'HOLIDAYS';
        
        textY += 8;
        pdf.setFontSize(fonts.appointmentSource.size);
        pdf.setFont('helvetica', fonts.appointmentSource.weight);
        pdf.setTextColor(colors.textLight);
        pdf.text(sourceText, textX, textY);
      }
      
      console.log(`✅ Drew appointment: ${cleanedTitle} at ${timeStr}${showBadge ? ` (${badgeText})` : ''}`);
    });
  });
}

/**
 * Draw pixel-perfect footer navigation
 */
function drawPixelPerfectFooter(pdf: jsPDF, selectedDate: Date, yPosition: number) {
  const { pageWidth, margin, footerHeight, fonts, colors } = PIXEL_PERFECT_CONFIG;
  
  // Footer background
  pdf.setFillColor(colors.headerBg);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, footerHeight, 'F');
  
  // Footer border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, footerHeight);
  
  // Navigation buttons
  const btnY = yPosition + 25;
  
  pdf.setFontSize(fonts.navigationBtn.size);
  pdf.setFont('helvetica', fonts.navigationBtn.weight);
  pdf.setTextColor(colors.textSecondary);
  
  // Previous day
  pdf.text('< Previous Day', margin + 20, btnY);
  
  // Weekly overview (center)
  pdf.text('Weekly Overview', pageWidth / 2, btnY, { align: 'center' });
  
  // Next day
  pdf.text('Next Day >', pageWidth - margin - 20, btnY, { align: 'right' });
  
  console.log(`🔗 Footer navigation drawn`);
}

/**
 * Main export function - pixel-perfect template
 */
export async function exportPixelPerfectTemplate(
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🎯 Starting Pixel-Perfect Template Export');
    console.log(`📅 Date: ${selectedDate.toDateString()}`);
    console.log(`📊 Total events: ${events.length}`);
    
    // Run audit first
    const auditResult = await templateAuditSystem.runCompleteAudit(PIXEL_PERFECT_CONFIG, events, selectedDate);
    console.log('📋 Audit Results:', auditResult.summary);
    
    // Create PDF with exact dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [PIXEL_PERFECT_CONFIG.pageWidth, PIXEL_PERFECT_CONFIG.pageHeight]
    });
    
    // Filter real appointments
    const realEvents = filterRealAppointments(events);
    console.log(`📋 Filtered ${events.length} → ${realEvents.length} real appointments`);
    
    // Draw sections in exact order with pixel-perfect positioning
    let currentY = PIXEL_PERFECT_CONFIG.margin;
    
    // 1. Header
    currentY = drawPixelPerfectHeader(pdf, selectedDate, realEvents.length);
    
    // 2. Stats bar
    currentY = drawPixelPerfectStatsBar(pdf, realEvents, currentY);
    
    // 3. Legend
    currentY = drawPixelPerfectLegend(pdf, currentY);
    
    // 4. Time grid
    const { gridStartY, gridEndY } = drawPixelPerfectTimeGrid(pdf, currentY);
    
    // 5. Appointments
    drawPixelPerfectAppointments(pdf, selectedDate, realEvents, gridStartY);
    
    // 6. Footer
    drawPixelPerfectFooter(pdf, selectedDate, gridEndY + 10);
    
    // Save PDF with exact filename format
    const dateStr = selectedDate.toISOString().split('T')[0];
    const filename = `—latest.daily-template-${dateStr}-remarkable.pdf`;
    
    await new Promise<void>((resolve, reject) => {
      try {
        pdf.save(filename);
        console.log(`✅ Pixel-Perfect Template PDF exported: ${filename}`);
        resolve();
      } catch (error) {
        console.error('❌ Error saving PDF:', error);
        reject(error);
      }
    });
    
    // Log final audit summary
    if (auditResult.summary.total > 0) {
      console.log('🔧 Audit Issues Found:', auditResult.issues.length);
      console.log('💡 Recommendations:', auditResult.recommendations);
    } else {
      console.log('✅ Template passes all audit checks');
    }
    
  } catch (error) {
    console.error('❌ Pixel-Perfect Template Export failed:', error);
    throw error;
  }
}