import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { cleanEventTitle, cleanTextForPDF } from './titleCleaner';

// Daily PDF export - 8.5x11 inches with proportional fonts
const DAILY_CONFIG = {
  pageWidth: 612,   // 8.5 inches = 612 points
  pageHeight: 792,  // 11 inches = 792 points
  margin: 40,       // Standard margin for readability
  timeColumnWidth: 80,  // Time column width matching dashboard
  appointmentColumnWidth: 492,  // Remaining width for appointments
  timeSlotHeight: 20,  // Time slots proportional to grid
  headerHeight: 120,     // Header space for title and navigation

  // Typography - proportional to time grid size
  fonts: {
    title: { size: 20, weight: 'bold' },      // Large title for "DAILY PLANNER"
    date: { size: 16, weight: 'normal' },     // Date display
    stats: { size: 12, weight: 'normal' },    // Statistics display
    timeLabels: { size: 10, weight: 'normal' }, // Time labels
    eventTitle: { size: 32, weight: 'bold' },  // Increased from 24 to 32 for much better visibility
    eventSource: { size: 24, weight: 'normal' }, // Increased from 18 to 24 for much better visibility
    eventTime: { size: 36, weight: 'bold' },   // Increased from 32 to 36 for much better visibility
    eventNotes: { size: 20, weight: 'normal' }  // Increased from 16 to 20 for much better visibility
  },

  // Colors matching dashboard
  colors: {
    black: [0, 0, 0],
    gray: [100, 100, 100],
    lightGray: [240, 240, 240],
    mediumGray: [150, 150, 150],
    veryLightGray: [248, 248, 248],
    white: [255, 255, 255],
    bottomHourColor: [253, 252, 250], // #FDFCFA - light cream for bottom-of-hour rows
    topHourColor: [242, 243, 244], // #F2F3F4 - light gray for top-of-hour rows
    simplePracticeBlue: [100, 149, 237],
    googleGreen: [52, 168, 83],
    holidayOrange: [255, 152, 0],
    holidayYellow: [251, 188, 4]
  }
};

// Time slots exactly matching dashboard (6:00 to 23:30)
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

// Helper function for military time formatting
const formatMilitaryTime = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

function getEventTypeInfo(event: CalendarEvent) {
  // Check for holiday events first
  const isHoliday = event.title.toLowerCase().includes('holiday') ||
                   event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';

  // Check for specific Google Calendar events (non-appointments)
  const isGoogle = !isHoliday && (
    event.title.toLowerCase().includes('haircut') ||
    event.title.toLowerCase().includes('dan re:') ||
    event.title.toLowerCase().includes('blake') ||
    event.title.toLowerCase().includes('phone call')
  );

  // All other appointments are SimplePractice
  const isSimplePractice = !isHoliday && !isGoogle && event.title.includes('Appointment');

  console.log(`Event type detection for "${event.title}":`, {
    source: event.source,
    calendarId: event.calendarId,
    isSimplePractice,
    isGoogle,
    isHoliday
  });

  return { 
    isSimplePractice, 
    isGoogle, 
    isHoliday,
    source: isHoliday ? 'Holidays in United States' : 
            isSimplePractice ? 'SimplePractice' : 
            'Google Calendar'
  };
}

function drawDashboardHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, pageWidth } = DAILY_CONFIG;

  // Header border - full width box around entire header
  const headerBoxY = margin + 5;
  const headerBoxHeight = 50;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(margin, headerBoxY, pageWidth - (margin * 2), headerBoxHeight, 'D');

  // Title section with border
  const titleSectionHeight = 25;
  pdf.setFillColor(255, 255, 255); // White background
  pdf.rect(margin, headerBoxY, pageWidth - (margin * 2), titleSectionHeight, 'F');
  pdf.line(margin, headerBoxY + titleSectionHeight, pageWidth - margin, headerBoxY + titleSectionHeight);

  // Navigation buttons to match dashboard - positioned at the top
  const buttonHeight = 12;
  const buttonWidth = 60;
  const buttonY = headerBoxY + 3;
  
  // Back to Weekly button (left side)
  const backButtonX = margin + 10;
  pdf.setFillColor(245, 245, 245); // Light gray background
  pdf.rect(backButtonX, buttonY, buttonWidth, buttonHeight, 'F');
  pdf.setDrawColor(128, 128, 128); // Gray border
  pdf.setLineWidth(0.5);
  pdf.rect(backButtonX, buttonY, buttonWidth, buttonHeight, 'S');
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Back to week', backButtonX + buttonWidth/2, buttonY + 8, { align: 'center' });

  // Previous day button
  const prevButtonX = backButtonX + buttonWidth + 5;
  pdf.setFillColor(245, 245, 245);
  pdf.rect(prevButtonX, buttonY, 18, buttonHeight, 'F');
  pdf.setDrawColor(128, 128, 128);
  pdf.rect(prevButtonX, buttonY, 18, buttonHeight, 'S');
  pdf.text('<', prevButtonX + 9, buttonY + 8, { align: 'center' });

  // Next day button
  const nextButtonX = prevButtonX + 18 + 3;
  pdf.setFillColor(245, 245, 245);
  pdf.rect(nextButtonX, buttonY, 18, buttonHeight, 'F');
  pdf.setDrawColor(128, 128, 128);
  pdf.rect(nextButtonX, buttonY, 18, buttonHeight, 'S');
  pdf.text('>', nextButtonX + 9, buttonY + 8, { align: 'center' });

  // Title - DAILY PLANNER at the top
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('DAILY PLANNER', pageWidth / 2, headerBoxY + 15, { align: 'center' });

  // Date display
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  // Format date as "Monday, July 7, 2025"
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const fullDate = `${dayName}, ${dateString}`;
  pdf.text(fullDate, pageWidth / 2, headerBoxY + 28, { align: 'center' });

  // Statistics table - full width spanning the four boxes
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  const totalAppointments = dayEvents.length;
  const scheduledMinutes = dayEvents.reduce((total, event) => {
    return total + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60);
  }, 0);
  const scheduledHours = Math.round(scheduledMinutes / 60 * 10) / 10;
  const dailyAverage = scheduledHours; // For daily view, this is the same as scheduled time
  const availableTime = Math.max(0, 12 - scheduledHours); // Assuming 12-hour workday

  // Statistics table positioned in lower section of header
  const tableY = headerBoxY + titleSectionHeight;
  const tableHeight = 25;
  const colWidth = (pageWidth - (margin * 2)) / 4;

  // Table background
  pdf.setFillColor(245, 245, 245); // Light gray background
  pdf.rect(margin, tableY, pageWidth - (margin * 2), tableHeight, 'F');

  // Vertical dividers
  for (let i = 1; i < 4; i++) {
    pdf.line(margin + (colWidth * i), tableY, margin + (colWidth * i), tableY + tableHeight);
  }

  // Values (top row)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text(`${totalAppointments}`, margin + colWidth * 0.5, tableY + 8, { align: 'center' });
  pdf.text(`${scheduledHours}h`, margin + colWidth * 1.5, tableY + 8, { align: 'center' });
  pdf.text(`${dailyAverage}h`, margin + colWidth * 2.5, tableY + 8, { align: 'center' });
  pdf.text(`${availableTime}h`, margin + colWidth * 3.5, tableY + 8, { align: 'center' });

  // Labels (bottom row)
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.text('Total Appointments', margin + colWidth * 0.5, tableY + 18, { align: 'center' });
  pdf.text('Scheduled Time', margin + colWidth * 1.5, tableY + 18, { align: 'center' });
  pdf.text('Daily Average', margin + colWidth * 2.5, tableY + 18, { align: 'center' });
  pdf.text('Available Time', margin + colWidth * 3.5, tableY + 18, { align: 'center' });

  // Legend section - full width below statistics table
  const legendY = headerBoxY + titleSectionHeight + tableHeight;
  const legendHeight = headerBoxHeight - titleSectionHeight - tableHeight;

  // Legend background
  pdf.setFillColor(255, 255, 255); // White background
  pdf.rect(margin, legendY, pageWidth - (margin * 2), legendHeight, 'F');

  // Legend items positioned horizontally with proper centering and proportional sizing
  pdf.setFontSize(4);
  pdf.setFont('helvetica', 'normal');

  const legendItemSpacing = (pageWidth - (margin * 2)) / 3;
  const legendItemY = legendY + (legendHeight / 2) - 3; // Vertically centered
  const iconSize = 8;
  const iconHeight = 4;

  // Calculate horizontal centering for each legend item
  const centerOffset = legendItemSpacing / 2;

  // SimplePractice - left position, centered
  const sp1X = margin + centerOffset - 25;
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.setLineWidth(0.5);
  pdf.rect(sp1X, legendItemY, iconSize, iconHeight, 'FD');
  pdf.setFillColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.rect(sp1X, legendItemY, 2, iconHeight, 'F');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('SimplePractice', sp1X + 10, legendItemY + 3);

  // Google Calendar - center position, centered
  const gc1X = margin + centerOffset + legendItemSpacing - 30;
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
  pdf.setLineWidth(0.5);
  pdf.setLineDash([1, 1]);
  pdf.rect(gc1X, legendItemY, iconSize, iconHeight, 'FD');
  pdf.setLineDash([]);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('Google Calendar', gc1X + 10, legendItemY + 3);

  // Holidays - right position, centered
  const h1X = margin + centerOffset + legendItemSpacing * 2 - 50;
  pdf.setFillColor(...DAILY_CONFIG.colors.holidayYellow);
  pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
  pdf.setLineWidth(0.5);
  pdf.rect(h1X, legendItemY, iconSize, iconHeight, 'FD');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('Holidays in United States', h1X + 10, legendItemY + 3);
}



function drawDashboardGrid(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, appointmentColumnWidth, timeSlotHeight, headerHeight, pageWidth } = DAILY_CONFIG;
  const gridStartY = headerHeight;  // Grid starts after header space
  const totalGridHeight = timeSlotHeight * TIME_SLOTS.length;  // Full timeline to 23:30 (36 slots * 16px = 576px)
  const gridWidth = pageWidth - (margin * 2);  // Match header width exactly

  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  // Filter out all-day events from timeline
  const timedEvents = dayEvents.filter(event => {
    const isMarkedAllDay = (event as any).isAllDay;
    const duration = event.endTime.getTime() - event.startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
    return !(isMarkedAllDay || isFullDay || hours >= 20);
  });

  // Draw time slots exactly like dashboard
  console.log(`📅 Drawing time slots from ${TIME_SLOTS[0]} to ${TIME_SLOTS[TIME_SLOTS.length - 1]} (${TIME_SLOTS.length} slots)`);
  TIME_SLOTS.forEach((timeSlot, index) => {
    const y = gridStartY + (index * timeSlotHeight);
    const isHour = timeSlot.endsWith(':00');

    // Time slot background - match dashboard exactly
    if (isHour) {
      pdf.setFillColor(...DAILY_CONFIG.colors.topHourColor);  // #F9F6EE for top of hour (hour marks)
    } else {
      pdf.setFillColor(...DAILY_CONFIG.colors.bottomHourColor);  // #FFFFF0 for bottom of hour (30-minute marks)
    }
    pdf.rect(margin, y, gridWidth, timeSlotHeight, 'F');

    // Time label - centered both vertically and horizontally in the time column
    pdf.setFontSize(isHour ? DAILY_CONFIG.fonts.timeLabels.size + 1 : DAILY_CONFIG.fonts.timeLabels.size);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(timeSlot, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 2, { align: 'center' });

    // Grid lines - subtle like dashboard
    pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, margin + gridWidth, y);
  });

  // Draw vertical separator between time and appointments
  pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, gridStartY + totalGridHeight);

  // Draw bottom border to close the grid at 23:30
  pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
  pdf.setLineWidth(1);
  pdf.line(margin, gridStartY + totalGridHeight, margin + gridWidth, gridStartY + totalGridHeight);

  // Draw events exactly like dashboard with precise positioning
  timedEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);

    // Calculate position exactly like dashboard CSS Grid
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();

    // Calculate exact slot position from 6:00 AM starting point
    const slotIndex = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    const slotStartY = gridStartY + (slotIndex * timeSlotHeight);

    // Calculate duration in slots, ensuring proper containment
    const durationSlots = Math.ceil(durationMinutes / 30);
    const slotEndY = gridStartY + ((slotIndex + durationSlots) * timeSlotHeight);

    // Strictly contain within grid boundaries with conservative margins
    const topPosition = slotStartY + 4; // Start 4px below the grid line
    const bottomPosition = slotEndY - 4; // End 4px before the next grid line
    const exactHeight = Math.max(bottomPosition - topPosition, 16); // Minimum 16px height for smaller format

    console.log(`📅 Event: ${event.title}`);
    console.log(`  ⏰ Start: ${formatMilitaryTime(eventStart)} (${startHour}:${startMinute.toString().padStart(2, '0')})`);
    console.log(`  ⏳ Duration: ${durationMinutes} minutes (${durationSlots} slots)`);
    console.log(`  📍 Slot index: ${slotIndex} (calculated: ${startHour - 6}*2 + ${startMinute >= 30 ? 1 : 0})`);
    console.log(`  📐 Top position: ${topPosition}px (gridStart: ${gridStartY} + slot: ${slotIndex} * height: ${timeSlotHeight})`);
    console.log(`  📏 Height: ${exactHeight}px`);

    // Event styling based on type
    const eventType = getEventTypeInfo(event);

    // Draw event background - always white like dashboard, STRICTLY contained within grid boundaries
    const eventBoxX = margin + timeColumnWidth + 8; // Start from time column
    const eventBoxWidth = appointmentColumnWidth - 16; // Width to ensure strict containment
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(eventBoxX, topPosition, eventBoxWidth, exactHeight, 'F');

    // Draw event borders based on type - match dashboard styling EXACTLY, strictly contained
    if (eventType.isSimplePractice) {
      // SimplePractice: white background with thin cornflower blue border and left flag
      pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.setLineWidth(0.5);
      pdf.rect(eventBoxX, topPosition, eventBoxWidth, exactHeight, 'D');
      // Thin left flag (2px wide instead of 4px)
      pdf.setFillColor(...DAILY_CONFIG.colors.simplePracticeBlue);
      pdf.rect(eventBoxX, topPosition, 2, exactHeight, 'F');
    } else if (eventType.isGoogle) {
      // Google Calendar: white background with dashed green border all around
      pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
      pdf.setLineWidth(0.5);
      pdf.setLineDash([2, 2]);
      pdf.rect(eventBoxX, topPosition, eventBoxWidth, exactHeight, 'D');
      pdf.setLineDash([]);
    } else {
      // Holiday: orange border around appointment
      pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
      pdf.setLineWidth(0.5);
      pdf.rect(eventBoxX, topPosition, eventBoxWidth, exactHeight, 'D');
    }

    // Draw event content in 3-column layout optimized for smaller format
    const eventX = margin + timeColumnWidth + 12; // Align with event box
    const eventY = topPosition + 4;  // Position at the very top of the appointment square
    const columnWidth = (appointmentColumnWidth - 35) / 3;  // Column width to match contained appointment box

    // Left column: Event title, calendar source, and time
    pdf.setFontSize(DAILY_CONFIG.fonts.eventTitle.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTitle.weight);
    pdf.setTextColor(...DAILY_CONFIG.colors.black);

    // Clean title using centralized function
    const cleanTitle = cleanEventTitle(event.title);

    console.log(`Event ${event.id}: "${event.title}" -> "${cleanTitle}"`);

    // Calculate improved spacing for 30-minute appointments
    const is30MinuteAppt = durationMinutes <= 30;
    
    // Enhanced vertical positioning for better readability
    const titleYOffset = is30MinuteAppt ? 14 : 8;
    const sourceYOffset = is30MinuteAppt ? 28 : 16;
    const timeYOffset = is30MinuteAppt ? 42 : 24;

    // Appointment name with optimized positioning
    pdf.text(cleanTitle, eventX, eventY + titleYOffset);

    // Source line with improved spacing
    pdf.setFontSize(DAILY_CONFIG.fonts.eventSource.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventSource.weight);
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(eventType.source, eventX, eventY + sourceYOffset);

    // Time range positioned below with enhanced spacing
    pdf.setFontSize(DAILY_CONFIG.fonts.eventTime.size);
    pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTime.weight);
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    const timeRange = `${formatMilitaryTime(eventStart)} - ${formatMilitaryTime(eventEnd)}`;
    pdf.text(timeRange, eventX, eventY + timeYOffset);

    // Center column: Event Notes (if they exist)
    if (event.notes && event.notes.trim()) {
      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size + 1);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const notesHeaderX = eventX + columnWidth; // Position directly over vertical line
      pdf.text('Event Notes', notesHeaderX, eventY + 2); // Move up to align with vertical line

      // Draw underline for Event Notes header
      pdf.setDrawColor(...DAILY_CONFIG.colors.black);
      pdf.setLineWidth(0.3);
      pdf.line(notesHeaderX, eventY + 3, notesHeaderX + 30, eventY + 3);

      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const notes = event.notes.split('\n')
        .filter(note => note.trim().length > 0)
        .map(note => note.trim().replace(/^[•\s-]+/, '').trim())
        .filter(note => note.length > 0 && note !== '•' && note !== '-');

      let currentY = eventY + 10;
      notes.forEach((note, index) => {
        // Wrap text to fit within column width with block text formatting
        const maxWidth = columnWidth - 10; // Leave margin for bullet and spacing
        const lines = pdf.splitTextToSize(`- ${note}`, maxWidth);

        lines.forEach((line, lineIndex) => {
          pdf.setTextColor(...DAILY_CONFIG.colors.black);
          pdf.text(line, notesHeaderX, currentY);
          currentY += 5; // Compact line spacing scaled to dashboard
        });
        currentY += 1; // Minimal gap between bullet points
      });
    }

    // Right column: Action Items (if they exist)
    if (event.actionItems && event.actionItems.trim()) {
      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size + 1);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const actionHeaderX = eventX + columnWidth * 2; // Position directly over vertical line
      pdf.text('Action Items', actionHeaderX, eventY + 2); // Move up to align with vertical line

      // Draw underline for Action Items header
      pdf.setDrawColor(...DAILY_CONFIG.colors.black);
      pdf.setLineWidth(0.3);
      pdf.line(actionHeaderX, eventY + 3, actionHeaderX + 30, eventY + 3);

      pdf.setFontSize(DAILY_CONFIG.fonts.eventNotes.size);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const actionItems = event.actionItems.split('\n')
        .filter(item => item.trim().length > 0)
        .map(item => item.trim().replace(/^[•\s-]+/, '').trim())
        .filter(item => item.length > 0 && item !== '•' && item !== '-');

      let currentY = eventY + 10;
      actionItems.forEach((item, index) => {
        // Wrap text to fit within column width with block text formatting
        const maxWidth = columnWidth - 10; // Leave margin for bullet and spacing
        const lines = pdf.splitTextToSize(`- ${item}`, maxWidth);

        lines.forEach((line, lineIndex) => {
          pdf.setTextColor(...DAILY_CONFIG.colors.black);
          pdf.text(line, actionHeaderX, currentY);
          currentY += 5; // Compact line spacing scaled to dashboard
        });
        currentY += 1; // Minimal gap between bullet points
      });
    }

    // Draw vertical lines only where the bullets are located
    if ((event.notes && event.notes.trim()) || (event.actionItems && event.actionItems.trim())) {
      pdf.setDrawColor(100, 100, 100); // Dark gray for visibility
      pdf.setLineWidth(0.5);

      // Draw vertical line only in the bullet area for notes
      if (event.notes && event.notes.trim()) {
        const notesX = eventX + columnWidth; // Align with header position
        const bulletStartY = eventY + 6; // Start higher to align with headers

        // Calculate actual height of notes content
        const notes = event.notes.split('\n')
          .filter(note => note.trim().length > 0)
          .map(note => note.trim().replace(/^[•\s-]+/, '').trim())
          .filter(note => note.length > 0 && note !== '•' && note !== '-');

        let notesHeight = 0;
        notes.forEach(note => {
          const lines = pdf.splitTextToSize(`- ${note}`, columnWidth - 10);
          notesHeight += lines.length * 5; // 5pt line spacing
          notesHeight += 1; // Gap between bullet points
        });

        const bulletEndY = bulletStartY + notesHeight - 1;
        pdf.line(notesX - 5, bulletStartY, notesX - 5, bulletEndY);
      }

      // Draw vertical line only in the bullet area for action items
      if (event.actionItems && event.actionItems.trim()) {
        const actionX = eventX + columnWidth * 2; // Align with header position
        const bulletStartY = eventY + 6; // Start higher to align with headers

        // Calculate actual height of action items content
        const actionItems = event.actionItems.split('\n')
          .filter(item => item.trim().length > 0)
          .map(item => item.trim().replace(/^[•\s-]+/, '').trim())
          .filter(item => item.length > 0 && item !== '•' && item !== '-');

        let actionHeight = 0;
        actionItems.forEach(item => {
          const lines = pdf.splitTextToSize(`- ${item}`, columnWidth - 10);
          actionHeight += lines.length * 5; // 5pt line spacing
          actionHeight += 1; // Gap between bullet points
        });

        const bulletEndY = bulletStartY + actionHeight - 1;
        pdf.line(actionX - 5, bulletStartY, actionX - 5, bulletEndY);
      }
    }
  });
}



export const exportExactDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log(`🚀🚀🚀 EXACT DAILY PDF EXPORT START 🚀🚀🚀`);
    console.log(`📅 Date: ${selectedDate.toDateString()}`);
    console.log(`📊 Total events: ${events.length}`);

    // Add a visible alert to confirm the function is being called
    console.log('🔥 CREATING PDF OBJECT...');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [612, 792] // 8.5 x 11 inches
    });

    console.log('✅ PDF OBJECT CREATED SUCCESSFULLY');

    // Filter events for selected date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });

    console.log(`Day events: ${dayEvents.length}`);
    dayEvents.forEach((event, i) => {
      console.log(`Event ${i + 1}: ${event.title} at ${formatMilitaryTime(new Date(event.startTime))}`);
    });

    // Draw exactly what the dashboard shows
    console.log('Drawing header...');
    drawDashboardHeader(pdf, selectedDate, dayEvents);

    console.log('Drawing grid...');
    drawDashboardGrid(pdf, selectedDate, events);

    // Save PDF
    const fileName = `daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
    console.log(`Saving PDF as: ${fileName}`);
    pdf.save(fileName);

    console.log(`=== EXACT DAILY PDF EXPORT COMPLETE ===`);

  } catch (error) {
    console.error('=== EXACT DAILY PDF EXPORT ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};