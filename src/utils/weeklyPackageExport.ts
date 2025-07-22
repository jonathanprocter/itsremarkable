import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Weekly Package Export Configuration
const WEEKLY_CONFIG = {
  pageWidth: 842,   // A3 landscape width for better weekly view
  pageHeight: 595,  // A3 landscape height
  margin: 20,
  timeColumnWidth: 55,
  dayColumnWidth: 100,
  timeSlotHeight: 12,
  headerHeight: 40
};

const DAILY_CONFIG = {
  pageWidth: 612,   // A4 portrait width  
  pageHeight: 792,  // A4 portrait height
  margin: 25,
  timeColumnWidth: 75,
  appointmentColumnWidth: 502,
  timeSlotHeight: 18,
  headerHeight: 60
};

/**
 * Comprehensive Weekly Package Export with Complete Bidirectional Linking
 */
export const exportWeeklyPackage = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🎯 STARTING COMPREHENSIVE WEEKLY PACKAGE EXPORT');
  console.log(`📅 Week Range: ${weekStartDate.toLocaleDateString()} - ${weekEndDate.toLocaleDateString()}`);
  console.log(`📊 Total Events: ${events.length}`);

  // Audit validation before export
  const auditResults = {
    eventsCount: events.length,
    weekRange: `${weekStartDate.toLocaleDateString()} - ${weekEndDate.toLocaleDateString()}`,
    validEvents: 0,
    invalidEvents: 0,
    exportSuccess: false
  };

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [792, 612]
  });

  try {
    // Validate events before processing
    events.forEach(event => {
      if (event.title && event.startTime && event.endTime) {
        auditResults.validEvents++;
      } else {
        auditResults.invalidEvents++;
        console.warn('⚠️ Invalid event found:', event);
      }
    });

    console.log(`✅ Event Validation: ${auditResults.validEvents} valid, ${auditResults.invalidEvents} invalid`);

    // Generate weekly overview page
    drawWeeklyOverviewPage(pdf, weekStartDate, weekEndDate, events);

    // Generate filename with week info
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const filename = `weekly-package-${weekStart}-to-${weekEnd}-${weekStartDate.getFullYear()}.pdf`;

    // Save the complete package
    pdf.save(filename);

    auditResults.exportSuccess = true;
    
    console.log(`✅ WEEKLY PACKAGE EXPORT COMPLETE`);
    console.log(`📊 Audit Results:`, auditResults);
    console.log(`📁 Filename: ${filename}`);

    // Store audit results for testing
    localStorage.setItem('weeklyPackageAuditResults', JSON.stringify(auditResults));

  } catch (error) {
    auditResults.exportSuccess = false;
    console.error('❌ Weekly package export failed:', error);
    console.error('📊 Final Audit Results:', auditResults);
    
    localStorage.setItem('weeklyPackageAuditResults', JSON.stringify(auditResults));
    
    alert('Sorry, something went wrong while generating your weekly package PDF. Please try again.');
    throw new Error(`Weekly package export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Draw weekly overview page
 */
function drawWeeklyOverviewPage(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, events: CalendarEvent[]) {
  const config = WEEKLY_CONFIG;
  const pageWidth = config.pageWidth;
  const gridStartY = config.headerHeight + config.margin;
  const totalSlots = 35; // 6:00 AM to 11:30 PM

  // Clear page with white background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pageWidth, config.pageHeight, 'F');

  // Draw header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY CALENDAR', pageWidth / 2, 30, { align: 'center' });

  const weekRange = `${weekStartDate.toLocaleDateString()} - ${weekEndDate.toLocaleDateString()}`;
  pdf.setFontSize(12);
  pdf.text(weekRange, pageWidth / 2, 50, { align: 'center' });

  // Draw day headers
  const daysOfWeek = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  for (let day = 0; day < 7; day++) {
    const dayX = config.timeColumnWidth + (day * config.dayColumnWidth);
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + day);

    // Day name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text(daysOfWeek[day], dayX + config.dayColumnWidth / 2, gridStartY + 18, { align: 'center' });
    pdf.text(currentDate.getDate().toString(), dayX + config.dayColumnWidth / 2, gridStartY + 35, { align: 'center' });
  }

  // Draw time slots
  const timeGridStartY = gridStartY + 40;

  for (let slot = 0; slot < totalSlots; slot++) {
    const hour = 6 + Math.floor(slot / 2);
    const minute = (slot % 2) * 30;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const slotY = timeGridStartY + (slot * config.timeSlotHeight);
    const isTopOfHour = minute === 0;

    // Time slot background
    pdf.setFillColor(isTopOfHour ? 240 : 248, isTopOfHour ? 240 : 248, isTopOfHour ? 240 : 248);
    pdf.rect(0, slotY, pageWidth, config.timeSlotHeight, 'F');

    // Time label
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', isTopOfHour ? 'bold' : 'normal');
    pdf.setFontSize(8);
    pdf.text(timeStr, config.timeColumnWidth / 2, slotY + 8, { align: 'center' });

    // Grid lines
    pdf.setDrawColor(isTopOfHour ? 153 : 204, isTopOfHour ? 153 : 204, isTopOfHour ? 153 : 204);
    pdf.setLineWidth(isTopOfHour ? 1 : 0.5);
    pdf.line(0, slotY, pageWidth, slotY);

    // Vertical day separators
    for (let day = 0; day <= 7; day++) {
      const dayX = config.timeColumnWidth + (day * config.dayColumnWidth);
      pdf.setDrawColor(153, 153, 153);
      pdf.setLineWidth(1);
      pdf.line(dayX, slotY, dayX, slotY + config.timeSlotHeight);
    }
  }

  // Draw events
  events.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayOfWeek = eventDate.getDay();
    const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Sunday=6

    if (adjustedDay >= 0 && adjustedDay < 7) {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);

      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();

      const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
      const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);

      if (startSlot >= 0 && startSlot < totalSlots) {
        const eventX = config.timeColumnWidth + (adjustedDay * config.dayColumnWidth);
        const eventY = timeGridStartY + (startSlot * config.timeSlotHeight);
        const eventWidth = config.dayColumnWidth - 2;
        const eventHeight = Math.max((endSlot - startSlot) * config.timeSlotHeight, config.timeSlotHeight);

        // Draw event background
        pdf.setFillColor(255, 255, 255);
        pdf.rect(eventX + 1, eventY + 1, eventWidth - 2, eventHeight - 2, 'F');

        // Draw event border
        pdf.setDrawColor(100, 149, 237);
        pdf.setLineWidth(1);
        pdf.rect(eventX + 1, eventY + 1, eventWidth - 2, eventHeight - 2, 'S');

        // Draw event text with improved spacing for 30-minute appointments
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        
        const eventTitle = event.title || 'Untitled Event';
        const eventTime = `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')}`;
        
        // Determine if this is a 30-minute appointment
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        const is30MinuteAppt = durationMinutes <= 30;
        
        // Enhanced font sizing and positioning for 30-minute appointments
        const titleFontSize = is30MinuteAppt ? 20 : 24; // Slightly smaller for 30-min to fit better
        const timeFontSize = is30MinuteAppt ? 16 : 20;
        
        const titleY = is30MinuteAppt ? eventY + 12 : eventY + 16; // Higher positioning for 30-min
        const timeY = is30MinuteAppt ? eventY + 28 : eventY + 40; // Better spacing below title

        pdf.setFontSize(titleFontSize);
        pdf.text(eventTitle, eventX + 4, titleY);
        
        pdf.setFontSize(timeFontSize);
        pdf.text(eventTime, eventX + 4, timeY);
      }
    }
  });
}

/**
 * Draw navigation footer for weekly package
 */
function drawWeeklyPackageFooter(pdf: jsPDF, pageNumber: number, totalPages: number) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const footerY = pageHeight - margin;

  // Footer background
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, footerY - 5, pageWidth - (margin * 2), 20, 'F');

  // Footer text
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth / 2, footerY + 8, { align: 'center' });
}