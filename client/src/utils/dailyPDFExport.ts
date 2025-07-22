import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Daily PDF configuration - 8.5x11 portrait
const DAILY_CONFIG = {
  pageWidth: 612,   // 8.5 inches
  pageHeight: 792,  // 11 inches
  margin: 30,
  timeColumnWidth: 80,
  appointmentColumnWidth: 502,
  timeSlotHeight: 20,
  headerHeight: 100,

  fonts: {
    title: { size: 20, weight: 'bold' },
    date: { size: 16, weight: 'normal' },
    stats: { size: 12, weight: 'normal' },
    timeLabels: { size: 10, weight: 'normal' },
    eventTitle: { size: 14, weight: 'bold' },
    eventSource: { size: 10, weight: 'normal' },
    eventTime: { size: 12, weight: 'bold' },
    eventNotes: { size: 10, weight: 'normal' }
  },

  colors: {
    black: [0, 0, 0],
    gray: [100, 100, 100],
    lightGray: [240, 240, 240],
    mediumGray: [150, 150, 150],
    veryLightGray: [248, 248, 248],
    white: [255, 255, 255],
    simplePracticeBlue: [59, 130, 246],
    googleGreen: [34, 197, 94],
    holidayOrange: [249, 115, 22],
    holidayYellow: [251, 188, 4]
  }
};

// Time slots from 6:00 to 23:30
const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30'
];

// Text wrapping utility for narrow events
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  // Approximate character width based on font size
  const charWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / charWidth);
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.length > 0 ? lines : [text];
}

function getEventTypeInfo(event: CalendarEvent) {
  const title = (event.title || '').toLowerCase();
  const source = (event.source || '').toLowerCase();
  const calendarId = event.calendarId || '';

  // Holiday detection
  const isHoliday = title.includes('holiday') || calendarId.includes('holiday');

  // SimplePractice detection
  const isSimplePractice = source === 'simplepractice' || 
                          title.includes('appointment') ||
                          event.notes?.toLowerCase().includes('simplepractice');

  // Google Calendar detection (everything else that's not holiday or SimplePractice)
  const isGoogle = !isHoliday && !isSimplePractice && source === 'google';

  return { 
    isSimplePractice, 
    isGoogle, 
    isHoliday,
    sourceText: isSimplePractice ? 'SIMPLEPRACTICE' : 
                isGoogle ? 'GOOGLE CALENDAR' : 
                isHoliday ? 'HOLIDAYS IN UNITED STATES' : 'MANUAL'
  };
}

function drawDailyHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, pageWidth } = DAILY_CONFIG;

  // Title
  pdf.setFontSize(DAILY_CONFIG.fonts.title.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.title.weight);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('DAILY PLANNER', pageWidth / 2, margin + 25, { align: 'center' });

  // Date
  pdf.setFontSize(DAILY_CONFIG.fonts.date.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.date.weight);
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, pageWidth / 2, margin + 45, { align: 'center' });

  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  // Statistics
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  const availableHours = 17.5 - totalHours; // 6am to 11:30pm
  const freeTimePercentage = Math.round((availableHours / 17.5) * 100);

  pdf.setFontSize(DAILY_CONFIG.fonts.stats.size);
  pdf.setFont('helvetica', DAILY_CONFIG.fonts.stats.weight);

  const statsY = margin + 65;
  const statsSpacing = 120;
  let statsX = pageWidth / 2 - 180;

  // Total events
  pdf.text(totalEvents.toString(), statsX, statsY, { align: 'center' });
  pdf.text('Total Events', statsX, statsY + 12, { align: 'center' });

  // Hours scheduled
  statsX += statsSpacing;
  pdf.text(totalHours.toFixed(1) + 'h', statsX, statsY, { align: 'center' });
  pdf.text('Scheduled', statsX, statsY + 12, { align: 'center' });

  // Available hours
  statsX += statsSpacing;
  pdf.text(availableHours.toFixed(1) + 'h', statsX, statsY, { align: 'center' });
  pdf.text('Available', statsX, statsY + 12, { align: 'center' });

  // Free time percentage
  statsX += statsSpacing;
  pdf.text(freeTimePercentage + '%', statsX, statsY, { align: 'center' });
  pdf.text('Free Time', statsX, statsY + 12, { align: 'center' });

  // Legend
  const legendY = margin + 90;
  let legendX = pageWidth / 2 - 140;

  // SimplePractice
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.rect(legendX, legendY - 5, 10, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.simplePracticeBlue);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY - 5, 10, 8);
  pdf.setLineWidth(3);
  pdf.line(legendX, legendY - 5, legendX, legendY + 3);
  pdf.setFontSize(8);
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('SimplePractice', legendX + 15, legendY);

  // Google Calendar
  legendX += 90;
  pdf.setFillColor(...DAILY_CONFIG.colors.white);
  pdf.rect(legendX, legendY - 5, 10, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.googleGreen);
  pdf.setLineWidth(1);
  pdf.setLineDash([2, 1]);
  pdf.rect(legendX, legendY - 5, 10, 8);
  pdf.setLineDash([]);
  pdf.text('Google Calendar', legendX + 15, legendY);

  // Holidays
  legendX += 90;
  pdf.setFillColor(...DAILY_CONFIG.colors.holidayYellow);
  pdf.rect(legendX, legendY - 5, 10, 8, 'F');
  pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY - 5, 10, 8);
  pdf.text('Holidays', legendX + 15, legendY);
}

// Calculate layout for overlapping events
function calculateEventLayout(events: CalendarEvent[]): Array<{ column: number; totalColumns: number; width: number; offset: number }> {
  if (events.length === 0) return [];
  
  const layout: Array<{ column: number; totalColumns: number; width: number; offset: number }> = [];
  
  // Group events by time conflicts
  const timeGroups: CalendarEvent[][] = [];
  
  events.forEach(event => {
    const eventStart = new Date(event.startTime).getTime();
    const eventEnd = new Date(event.endTime).getTime();
    
    // Find existing group that overlaps with this event
    let foundGroup = false;
    for (const group of timeGroups) {
      if (group.some(groupEvent => {
        const groupStart = new Date(groupEvent.startTime).getTime();
        const groupEnd = new Date(groupEvent.endTime).getTime();
        return (eventStart < groupEnd && eventEnd > groupStart);
      })) {
        group.push(event);
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      timeGroups.push([event]);
    }
  });
  
  // Assign column positions within each group
  const eventToLayout = new Map<CalendarEvent, { column: number; totalColumns: number; width: number; offset: number }>();
  
  timeGroups.forEach(group => {
    const totalColumns = group.length;
    group.forEach((event, index) => {
      const columnWidth = 1 / totalColumns;
      const columnOffset = index * columnWidth;
      eventToLayout.set(event, {
        column: index,
        totalColumns: totalColumns,
        width: columnWidth,
        offset: columnOffset
      });
    });
  });
  
  // Map back to original order
  return events.map(event => eventToLayout.get(event)!);
}

function drawTimeGrid(pdf: jsPDF) {
  const { margin, timeColumnWidth, appointmentColumnWidth, timeSlotHeight } = DAILY_CONFIG;
  const gridStartY = margin + DAILY_CONFIG.headerHeight;
  const headerHeight = 20;

  // Column headers
  pdf.setFillColor(...DAILY_CONFIG.colors.lightGray);
  pdf.setDrawColor(...DAILY_CONFIG.colors.black);
  pdf.setLineWidth(1);

  // TIME header
  pdf.rect(margin, gridStartY, timeColumnWidth, headerHeight, 'FD');
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...DAILY_CONFIG.colors.black);
  pdf.text('TIME', margin + timeColumnWidth / 2, gridStartY + 13, { align: 'center' });

  // APPOINTMENTS header
  const dayX = margin + timeColumnWidth;
  pdf.rect(dayX, gridStartY, appointmentColumnWidth, headerHeight, 'FD');
  pdf.text('APPOINTMENTS', dayX + appointmentColumnWidth / 2, gridStartY + 13, { align: 'center' });

  // Time slots
  TIME_SLOTS.forEach((timeSlot, index) => {
    const y = gridStartY + headerHeight + (index * timeSlotHeight);
    const isHour = timeSlot.endsWith(':00');

    // Time cell
    const bgColor = isHour ? DAILY_CONFIG.colors.lightGray : DAILY_CONFIG.colors.veryLightGray;
    pdf.setFillColor(...bgColor);
    pdf.rect(margin, y, timeColumnWidth, timeSlotHeight, 'F');

    // Time text
    pdf.setFontSize(DAILY_CONFIG.fonts.timeLabels.size);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(...DAILY_CONFIG.colors.black);
    pdf.text(timeSlot, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 3, { align: 'center' });

    // Appointment cell
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(dayX, y, appointmentColumnWidth, timeSlotHeight, 'F');

    // Grid lines
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
    pdf.line(margin, y + timeSlotHeight, margin + timeColumnWidth + appointmentColumnWidth, y + timeSlotHeight);
  });

  // Vertical grid lines
  pdf.setLineWidth(1);
  pdf.setDrawColor(...DAILY_CONFIG.colors.black);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, gridStartY + headerHeight + (TIME_SLOTS.length * timeSlotHeight));

  // Outer border
  pdf.rect(margin, gridStartY, timeColumnWidth + appointmentColumnWidth, headerHeight + (TIME_SLOTS.length * timeSlotHeight));
}

function drawAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, appointmentColumnWidth, timeSlotHeight } = DAILY_CONFIG;
  const gridStartY = margin + DAILY_CONFIG.headerHeight + 20;

  // Filter and sort events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  console.log(`Rendering ${dayEvents.length} events for ${selectedDate.toDateString()}`);

  // Detect overlapping events and calculate layout columns
  const eventLayout = calculateEventLayout(dayEvents);

  dayEvents.forEach((event, index) => {
    const layoutInfo = eventLayout[index];
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    // Calculate position
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    const slotsFromStart = minutesSince6am / 30;
    const topPosition = Math.max(0, slotsFromStart * timeSlotHeight);

    // Calculate duration
    const durationMinutes = (endDate.getTime() - eventDate.getTime()) / (1000 * 60);
    const eventHeight = Math.max(50, (durationMinutes / 30) * timeSlotHeight);

    // Skip if outside range
    if (minutesSince6am < 0 || minutesSince6am > (17.5 * 60)) {
      return;
    }

    // Position calculation with overlap handling
    const baseEventX = margin + timeColumnWidth + 4;
    const baseEventWidth = appointmentColumnWidth - 8;
    
    // Apply layout positioning for overlapping events
    const eventWidth = baseEventWidth * layoutInfo.width;
    const eventX = baseEventX + (baseEventWidth * layoutInfo.offset);
    const eventY = gridStartY + topPosition;

    console.log(`Event: ${event.title} at Y=${eventY}, height=${eventHeight}`);

    // Get event type
    const eventType = getEventTypeInfo(event);

    // Draw background
    pdf.setFillColor(...DAILY_CONFIG.colors.white);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

    // Draw borders based on type
    if (eventType.isSimplePractice) {
      // SimplePractice: cornflower blue border with thick left flag
      pdf.setDrawColor(100, 149, 237); // Cornflower blue RGB
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
      // Thick left border flag
      pdf.setLineWidth(5);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);
    } else if (eventType.isGoogle) {
      // Google Calendar: dashed green border
      pdf.setDrawColor(34, 197, 94); // Green RGB
      pdf.setLineWidth(1);
      pdf.setLineDash([3, 2]);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
      pdf.setLineDash([]);
    } else if (eventType.isHoliday) {
      // Holiday: yellow background with orange border
      pdf.setFillColor(...DAILY_CONFIG.colors.holidayYellow);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(...DAILY_CONFIG.colors.holidayOrange);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight);
    }

    // Clean title
    let displayTitle = event.title || 'Untitled Event';
    if (displayTitle.endsWith(' Appointment')) {
      displayTitle = displayTitle.slice(0, -12);
    }

    // Check for notes/action items
    const hasNotes = !!(event.notes && event.notes.trim());
    const hasActionItems = !!(event.actionItems && event.actionItems.trim());
    const needsExpandedLayout = hasNotes || hasActionItems;
    
    // Adjust font sizes based on available width for overlapping events
    const widthRatio = layoutInfo.width;
    const fontSizeMultiplier = Math.max(0.7, Math.min(1.0, widthRatio * 1.2));
    
    const adjustedFontSizes = {
      title: Math.max(10, DAILY_CONFIG.fonts.eventTitle.size * fontSizeMultiplier),
      source: Math.max(8, DAILY_CONFIG.fonts.eventSource.size * fontSizeMultiplier),
      time: Math.max(9, DAILY_CONFIG.fonts.eventTime.size * fontSizeMultiplier),
      notes: Math.max(8, DAILY_CONFIG.fonts.eventNotes.size * fontSizeMultiplier)
    };

    if (needsExpandedLayout && eventHeight >= 60 && layoutInfo.totalColumns <= 2) {
      // 3-column layout
      const col1Width = eventWidth * 0.33;
      const col2Width = eventWidth * 0.33;
      const col3Width = eventWidth * 0.33;

      const col1X = eventX + 6;
      const col2X = eventX + col1Width + 8;
      const col3X = eventX + col1Width + col2Width + 10;

      // Column dividers
      if (hasNotes) {
        pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
        pdf.setLineWidth(0.5);
        pdf.line(col2X - 2, eventY + 5, col2X - 2, eventY + eventHeight - 5);
      }
      if (hasActionItems) {
        pdf.setDrawColor(...DAILY_CONFIG.colors.mediumGray);
        pdf.setLineWidth(0.5);
        pdf.line(col3X - 2, eventY + 5, col3X - 2, eventY + eventHeight - 5);
      }

      // Column 1: Event info
      let currentY = eventY + 12;

      // Title
      pdf.setFontSize(adjustedFontSizes.title);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTitle.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      pdf.text(displayTitle, col1X, currentY);
      currentY += 12;

      // Source
      pdf.setFontSize(adjustedFontSizes.source);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.gray);
      pdf.text(eventType.sourceText, col1X, currentY);
      currentY += 12;

      // Time
      pdf.setFontSize(adjustedFontSizes.time);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const timeRange = `${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      pdf.text(timeRange, col1X, currentY);

      // Column 2: Notes
      if (hasNotes) {
        let notesY = eventY + 12;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...DAILY_CONFIG.colors.black);
        pdf.text('Event Notes', col2X, notesY);
        notesY += 14;

        pdf.setFontSize(adjustedFontSizes.notes);
        pdf.setFont('helvetica', 'normal');
        const noteLines = event.notes!.split('\n').filter(line => line.trim());
        noteLines.forEach(line => {
          const cleanLine = line.trim().replace(/^[•\s-]+/, '').trim();
          if (cleanLine && notesY + 10 <= eventY + eventHeight - 5) {
            pdf.text(cleanLine, col2X, notesY);
            notesY += 10;
          }
        });
      }

      // Column 3: Action Items
      if (hasActionItems) {
        let actionY = eventY + 12;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...DAILY_CONFIG.colors.black);
        pdf.text('Action Items', col3X, actionY);
        actionY += 14;

        pdf.setFontSize(adjustedFontSizes.notes);
        pdf.setFont('helvetica', 'normal');
        const actionLines = event.actionItems!.split('\n').filter(line => line.trim());
        actionLines.forEach(line => {
          const cleanLine = line.trim().replace(/^[•\s-]+/, '').trim();
          if (cleanLine && actionY + 10 <= eventY + eventHeight - 5) {
            pdf.text(cleanLine, col3X, actionY);
            actionY += 10;
          }
        });
      }

    } else {
      // Simple layout
      let currentY = eventY + 12;
      const padding = 8;

      // Title
      pdf.setFontSize(adjustedFontSizes.title);
      pdf.setFont('helvetica', DAILY_CONFIG.fonts.eventTitle.weight);
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      // Wrap long titles for narrow events
      const titleLines = wrapText(displayTitle, eventWidth - (padding * 2), adjustedFontSizes.title);
      titleLines.forEach((line, index) => {
        if (currentY + 12 <= eventY + eventHeight - 5) {
          pdf.text(line, eventX + padding, currentY);
          currentY += 12;
        }
      });

      // Source
      pdf.setFontSize(adjustedFontSizes.source);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...DAILY_CONFIG.colors.gray);
      if (currentY + 12 <= eventY + eventHeight - 5) {
        pdf.text(eventType.sourceText, eventX + padding, currentY);
        currentY += 12;
      }

      // Time - ALWAYS DISPLAY THE TIME
      pdf.setFontSize(adjustedFontSizes.time);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...DAILY_CONFIG.colors.black);
      const timeRange = `${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      if (currentY + 12 <= eventY + eventHeight - 5) {
        pdf.text(timeRange, eventX + padding, currentY);
      }
    }
  });
}

export const exportDailyToPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log(`=== DAILY PDF EXPORT ===`);
  console.log(`Date: ${selectedDate.toDateString()}`);
  console.log(`Total events: ${events.length}`);

  try {
    // Validate inputs
    if (!selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
      throw new Error('Invalid selected date for daily export');
    }
    
    if (!Array.isArray(events)) {
      throw new Error('Events must be an array');
    }

    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [DAILY_CONFIG.pageWidth, DAILY_CONFIG.pageHeight],
      compress: true
    });

    console.log('✓ PDF document created successfully');

    // Draw components
    drawDailyHeader(pdf, selectedDate, events);
    console.log('✓ Header drawn successfully');
    
    drawTimeGrid(pdf);
    console.log('✓ Time grid drawn successfully');
    
    drawAppointments(pdf, selectedDate, events);
    console.log('✓ Appointments drawn successfully');

    // Save PDF
    const filename = `daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
    
    console.log(`🔄 Attempting to save PDF as: ${filename}`);
    pdf.save(filename);
    
    console.log(`✅ PDF saved successfully as: ${filename}`);
    
    // Additional success confirmation
    setTimeout(() => {
      console.log('🎉 Daily PDF export completed successfully!');
    }, 1000);

  } catch (error) {
    console.error('❌ Daily PDF export failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      selectedDate: selectedDate?.toString(),
      eventsCount: events?.length
    });
    throw error;
  }
};