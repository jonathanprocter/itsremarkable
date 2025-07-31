import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Exact measurements from the reference PDF template
const TEMPLATE_CONFIG = {
  // Page dimensions
  pageWidth: 612,
  pageHeight: 792,
  margin: 30,
  
  // Layout constants
  headerHeight: 80,
  statsBarHeight: 60,
  timeColumnWidth: 65,
  appointmentColumnWidth: 480,
  timeSlotHeight: 22,
  
  // Colors matching the reference
  colors: {
    background: '#ffffff',
    headerBg: '#f8f9fa',
    statsBg: '#f8f9fa',
    borderDark: '#333333',
    borderLight: '#cccccc',
    textPrimary: '#000000',
    textSecondary: '#666666',
    textLight: '#999999',
    simplePracticeBlue: '#4285f4',
    googleGreen: '#34a853',
    holidayYellow: '#fbbc04'
  },
  
  // Typography
  fonts: {
    title: { size: 18, weight: 'bold' },
    subtitle: { size: 12, weight: 'normal' },
    stats: { size: 14, weight: 'bold' },
    statsLabel: { size: 10, weight: 'normal' },
    timeLabel: { size: 10, weight: 'normal' },
    appointmentTitle: { size: 9, weight: 'bold' },
    appointmentSource: { size: 8, weight: 'normal' },
    navigationBtn: { size: 10, weight: 'normal' }
  }
};

// Time slots from 6:00 AM to 11:30 PM
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

/**
 * Filter real appointments excluding test data
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
 * Clean appointment title
 */
function cleanAppointmentTitle(title: string): string {
  if (!title) return '';
  
  // Remove emoji and special characters
  let cleaned = title.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  
  // Remove " Appointment" suffix
  cleaned = cleaned.replace(/\s+Appointment\s*$/i, '');
  
  return cleaned.trim();
}

/**
 * Draw header section exactly matching the reference PDF
 */
function drawHeader(pdf: jsPDF, selectedDate: Date, appointmentCount: number): number {
  const { pageWidth, margin, headerHeight, colors, fonts } = TEMPLATE_CONFIG;
  
  // Header background
  pdf.setFillColor(colors.headerBg);
  pdf.rect(margin, margin, pageWidth - 2 * margin, headerHeight, 'F');
  
  // Header border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, margin, pageWidth - 2 * margin, headerHeight);
  
  // Date title - "Friday, July 18, 2025"
  const fullDateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  pdf.setFontSize(fonts.title.size);
  pdf.setFont('helvetica', fonts.title.weight);
  pdf.setTextColor(colors.textPrimary);
  pdf.text(fullDateStr, pageWidth / 2, margin + 25, { align: 'center' });
  
  // Short date - "Fri, Jul 18"
  const shortDateStr = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  
  pdf.setFontSize(fonts.subtitle.size);
  pdf.setFont('helvetica', fonts.subtitle.weight);
  pdf.setTextColor(colors.textSecondary);
  pdf.text(shortDateStr, pageWidth / 2, margin + 40, { align: 'center' });
  
  // Appointment count - "8 appointments scheduled"
  pdf.setFontSize(fonts.subtitle.size);
  pdf.setFont('helvetica', fonts.subtitle.weight);
  pdf.text(`${appointmentCount} appointments scheduled`, pageWidth / 2, margin + 55, { align: 'center' });
  
  return margin + headerHeight;
}

/**
 * Draw stats bar exactly matching the reference PDF
 */
function drawStatsBar(pdf: jsPDF, events: CalendarEvent[], yPosition: number): number {
  const { pageWidth, margin, statsBarHeight, colors, fonts } = TEMPLATE_CONFIG;
  
  // Stats bar background
  pdf.setFillColor(colors.statsBg);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, statsBarHeight, 'F');
  
  // Stats bar border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, statsBarHeight);
  
  // Calculate stats
  const totalAppointments = events.length;
  const scheduledHours = events.reduce((sum, event) => {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const availableHours = 17.5; // 6:00 AM to 11:30 PM
  const freeTimePercent = Math.round(((availableHours - scheduledHours) / availableHours) * 100);
  
  // Draw stats
  const statWidth = (pageWidth - 2 * margin) / 4;
  const stats = [
    { value: totalAppointments, label: 'Appointments' },
    { value: `${scheduledHours.toFixed(1)}h`, label: 'Scheduled' },
    { value: `${(availableHours - scheduledHours).toFixed(1)}h`, label: 'Available' },
    { value: `${freeTimePercent}%`, label: 'Free Time' }
  ];
  
  stats.forEach((stat, index) => {
    const statX = margin + index * statWidth + statWidth / 2;
    
    // Stat value
    pdf.setFontSize(fonts.stats.size);
    pdf.setFont('helvetica', fonts.stats.weight);
    pdf.setTextColor(colors.textPrimary);
    pdf.text(stat.value.toString(), statX, yPosition + 25, { align: 'center' });
    
    // Stat label
    pdf.setFontSize(fonts.statsLabel.size);
    pdf.setFont('helvetica', fonts.statsLabel.weight);
    pdf.setTextColor(colors.textSecondary);
    pdf.text(stat.label, statX, yPosition + 40, { align: 'center' });
  });
  
  return yPosition + statsBarHeight;
}

/**
 * Draw legend exactly matching the reference PDF
 */
function drawLegend(pdf: jsPDF, yPosition: number): number {
  const { pageWidth, margin, colors, fonts } = TEMPLATE_CONFIG;
  const legendHeight = 30;
  
  // Legend background
  pdf.setFillColor(colors.headerBg);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, legendHeight, 'F');
  
  // Legend border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, legendHeight);
  
  // Legend items
  const legendY = yPosition + 20;
  const legendItems = [
    { color: colors.simplePracticeBlue, label: 'SimplePractice' },
    { color: colors.googleGreen, label: 'Google Calendar' },
    { color: colors.holidayYellow, label: 'Holidays' }
  ];
  
  let currentX = margin + 20;
  legendItems.forEach((item, index) => {
    // Color indicator
    pdf.setFillColor(item.color);
    pdf.rect(currentX, legendY - 8, 12, 8, 'F');
    
    // Label
    pdf.setFontSize(fonts.statsLabel.size);
    pdf.setFont('helvetica', fonts.statsLabel.weight);
    pdf.setTextColor(colors.textSecondary);
    pdf.text(item.label, currentX + 20, legendY - 2);
    
    currentX += 120;
  });
  
  return yPosition + legendHeight;
}

/**
 * Draw time grid exactly matching the reference PDF
 */
function drawTimeGrid(pdf: jsPDF, yPosition: number): { gridStartY: number, gridEndY: number } {
  const { pageWidth, margin, timeColumnWidth, timeSlotHeight, colors, fonts } = TEMPLATE_CONFIG;
  
  let currentY = yPosition;
  
  // Draw time slots
  TIME_SLOTS.forEach((timeSlot, index) => {
    // Time slot background (alternating)
    if (index % 2 === 0) {
      pdf.setFillColor('#f8f9fa');
      pdf.rect(margin, currentY, pageWidth - 2 * margin, timeSlotHeight, 'F');
    }
    
    // Time label
    pdf.setFontSize(fonts.timeLabel.size);
    pdf.setFont('helvetica', fonts.timeLabel.weight);
    pdf.setTextColor(colors.textSecondary);
    pdf.text(timeSlot, margin + 10, currentY + 15);
    
    // Time slot border
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(colors.borderLight);
    pdf.line(margin, currentY + timeSlotHeight, pageWidth - margin, currentY + timeSlotHeight);
    
    currentY += timeSlotHeight;
  });
  
  // Time column separator
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.line(margin + timeColumnWidth, yPosition, margin + timeColumnWidth, currentY);
  
  return { gridStartY: yPosition, gridEndY: currentY };
}

/**
 * Draw appointments exactly matching the reference PDF
 */
function drawAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[], gridStartY: number) {
  const { margin, timeColumnWidth, appointmentColumnWidth, timeSlotHeight, colors, fonts } = TEMPLATE_CONFIG;
  
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
    
    // Find time slot position
    const timeStr = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const slotIndex = TIME_SLOTS.findIndex(slot => slot === timeStr);
    
    if (slotIndex === -1) return;
    
    // Calculate duration in minutes and convert to time slots (30-minute slots)
    const durationMs = eventEndDate.getTime() - eventDate.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    const timeSlots = Math.max(1, Math.ceil(durationMinutes / 30)); // Minimum 1 slot, round up for partial slots
    
    console.log(`📅 Event: ${event.title}, Duration: ${durationMinutes} minutes, Time slots: ${timeSlots}`);
    
    // Calculate appointment position
    const appointmentY = gridStartY + slotIndex * timeSlotHeight;
    const appointmentX = margin + timeColumnWidth + 5;
    const appointmentWidth = appointmentColumnWidth - 10;
    const appointmentHeight = (timeSlots * timeSlotHeight) - 2; // Height spans multiple slots
    
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
    pdf.rect(appointmentX, appointmentY + 1, appointmentWidth, appointmentHeight, 'F');
    
    // Draw appointment border with rounded corners effect
    pdf.setLineWidth(1);
    pdf.setDrawColor(borderColor);
    pdf.rect(appointmentX, appointmentY + 1, appointmentWidth, appointmentHeight);
    
    // Apply additional border styling based on type
    if (isSimplePractice && status === 'scheduled') {
      // SimplePractice: blue left border (only for non-cancelled)
      pdf.setLineWidth(3);
      pdf.setDrawColor(colors.simplePracticeBlue);
      pdf.line(appointmentX, appointmentY + 1, appointmentX, appointmentY + appointmentHeight + 1);
    } else if (isGoogle) {
      // Google: dashed green border
      pdf.setLineWidth(1);
      pdf.setDrawColor(colors.googleGreen);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.rect(appointmentX, appointmentY + 1, appointmentWidth, appointmentHeight);
      pdf.setLineDashPattern([], 0);
    } else if (isHoliday) {
      // Holiday: yellow background
      pdf.setFillColor(colors.holidayYellow);
      pdf.rect(appointmentX, appointmentY + 1, appointmentWidth, appointmentHeight, 'F');
      pdf.setLineWidth(1);
      pdf.setDrawColor(colors.borderDark);
      pdf.rect(appointmentX, appointmentY + 1, appointmentWidth, appointmentHeight);
    }
    
    // Draw status badge (top-right corner like modal)
    if (showBadge) {
      const badgeWidth = 70;
      const badgeHeight = 14;
      const badgeX = appointmentX + appointmentWidth - badgeWidth - 5;
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
    const textX = appointmentX + 8;
    let textY = appointmentY + 12;
    
    // Appointment title with strikethrough if cancelled
    const cleanedTitle = cleanAppointmentTitle(event.title || '');
    pdf.setFontSize(fonts.appointmentTitle.size);
    pdf.setFont('helvetica', fonts.appointmentTitle.weight);
    pdf.setTextColor(textColor);
    pdf.text(cleanedTitle, textX, textY);
    
    // Add strikethrough effect for cancelled appointments (double line like modal)
    if (useStrikethrough) {
      const titleWidth = pdf.getTextWidth(cleanedTitle);
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(textColor);
      // Double strikethrough effect
      pdf.line(textX, textY - 2, textX + titleWidth, textY - 2);
      pdf.line(textX, textY - 1, textX + titleWidth, textY - 1);
    }
    
    // Time display with strikethrough if cancelled
    const timeText = `${timeStr} - ${eventEndDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    textY += 10;
    pdf.setFontSize(fonts.appointmentSource.size);
    pdf.setFont('helvetica', fonts.appointmentSource.weight);
    pdf.setTextColor(textColor);
    pdf.text(timeText, textX, textY);
    
    // Add strikethrough to time if cancelled
    if (useStrikethrough) {
      const timeWidth = pdf.getTextWidth(timeText);
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
}

/**
 * Draw footer navigation exactly matching the reference PDF
 */
function drawFooter(pdf: jsPDF, selectedDate: Date, yPosition: number) {
  const { pageWidth, margin, colors, fonts } = TEMPLATE_CONFIG;
  const footerHeight = 40;
  
  // Footer background
  pdf.setFillColor(colors.headerBg);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, footerHeight, 'F');
  
  // Footer border
  pdf.setLineWidth(1);
  pdf.setDrawColor(colors.borderDark);
  pdf.rect(margin, yPosition, pageWidth - 2 * margin, footerHeight);
  
  // Navigation buttons
  const btnY = yPosition + 25;
  
  // Previous day
  const prevDate = new Date(selectedDate);
  prevDate.setDate(prevDate.getDate() - 1);
  
  pdf.setFontSize(fonts.navigationBtn.size);
  pdf.setFont('helvetica', fonts.navigationBtn.weight);
  pdf.setTextColor(colors.textSecondary);
  pdf.text('< Previous Day', margin + 20, btnY);
  
  // Weekly overview (center)
  pdf.text('Weekly Overview', pageWidth / 2, btnY, { align: 'center' });
  
  // Next day
  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);
  
  pdf.text('Next Day >', pageWidth - margin - 20, btnY, { align: 'right' });
}

/**
 * Main export function - creates exact match of reference PDF
 */
export async function exportHTMLTemplateExactMatch(
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🎯 Starting HTML Template Exact Match Export');
    console.log(`📅 Date: ${selectedDate.toDateString()}`);
    console.log(`📊 Total events: ${events.length}`);
    
    // Create PDF with exact dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [TEMPLATE_CONFIG.pageWidth, TEMPLATE_CONFIG.pageHeight]
    });
    
    // Filter real appointments
    const realEvents = filterRealAppointments(events);
    console.log(`📋 Filtered ${events.length} → ${realEvents.length} real appointments`);
    
    // Draw sections in exact order
    let currentY = TEMPLATE_CONFIG.margin;
    
    // 1. Header
    currentY = drawHeader(pdf, selectedDate, realEvents.length);
    
    // 2. Stats bar
    currentY = drawStatsBar(pdf, realEvents, currentY);
    
    // 3. Legend
    currentY = drawLegend(pdf, currentY);
    
    // 4. Time grid
    const { gridStartY, gridEndY } = drawTimeGrid(pdf, currentY);
    
    // 5. Appointments
    drawAppointments(pdf, selectedDate, realEvents, gridStartY);
    
    // 6. Footer
    drawFooter(pdf, selectedDate, gridEndY + 10);
    
    // Save PDF
    const dateStr = selectedDate.toISOString().split('T')[0];
    const filename = `—latest.daily-template-${dateStr}-remarkable.pdf`;
    
    await new Promise<void>((resolve, reject) => {
      try {
        pdf.save(filename);
        console.log(`✅ HTML Template Exact Match PDF exported: ${filename}`);
        resolve();
      } catch (error) {
        console.error('❌ Error saving PDF:', error);
        reject(error);
      }
    });
    
  } catch (error) {
    console.error('❌ HTML Template Exact Match Export failed:', error);
    throw error;
  }
}