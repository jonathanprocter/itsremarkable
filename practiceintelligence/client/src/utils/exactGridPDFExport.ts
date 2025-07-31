import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { cleanTitleForPDF, cleanEventTitle, cleanTextForPDF } from './emojiCleaner';
import { generateTimeSlots } from './timeSlots';

// Exact dashboard-matching landscape configuration for weekly calendar
const GRID_CONFIG = {
  // Page setup - Adjusted dimensions to achieve exact 110px day columns
  pageWidth: 910,   // Calculated to give exact 110px day columns
  pageHeight: 842,   // A3 height = 842 points (11.7 inches)

  // Improved spacing for better readability
  margin: 30,  // Increased margin for better spacing
  headerHeight: 60,  // Match dashboard header height exactly
  statsHeight: 0, // Remove stats section to maximize grid space
  legendHeight: 30,  // Increased legend height for better visibility

  // Grid structure - match dashboard measurements exactly
  timeColumnWidth: 80, // Match dashboard time column width exactly
  dayColumnWidth: 110, // Fixed to exact dashboard measurement
  slotHeight: 40, // Match dashboard time slot height exactly
  get totalSlots() {
    return generateTimeSlots().length; // Dynamic slot count based on time range
  },

  get contentWidth() {
    return this.pageWidth - (2 * this.margin);
  },

  get totalGridWidth() {
    // Use FULL content width to prevent Sunday cutoff
    return this.contentWidth;
  },

  get gridStartX() {
    // Start at margin
    return this.margin;
  },

  get gridStartY() {
    return this.margin + this.headerHeight + this.legendHeight;
  },

  get gridHeight() {
    // Use remaining vertical space after headers - ensure full 36 slots are visible
    return this.totalSlots * this.slotHeight;
  }
};

export const exportExactGridPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[] = []
): Promise<void> => {
  try {
    console.log('Creating PDF with exact grid layout...');

    // Filter events for the week
    const weekEvents = (events || []).filter(event => {
      if (!event || !event.startTime || !event.endTime) return false;
      try {
        const eventDate = new Date(event.startTime);
        if (isNaN(eventDate.getTime())) return false;
        return eventDate >= weekStartDate && eventDate <= weekEndDate;
      } catch (error) {
        console.warn('Error filtering event:', event, error);
        return false;
      }
    });

    // Create PDF with optimized dimensions for exact 110px day columns
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [910, 842] // Optimized for exact dashboard matching
    });

    // Use full width layout positions
    const centerX = GRID_CONFIG.gridStartX;
    const centerY = GRID_CONFIG.margin;

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, GRID_CONFIG.pageWidth, GRID_CONFIG.pageHeight, 'F');

    // HEADER - Move "WEEKLY PLANNER" down to be centered in header space
    pdf.setFont('times', 'bold');
    pdf.setFontSize(24);  // Much larger title font for better visibility
    pdf.setTextColor(0, 0, 0);
    pdf.text('WEEKLY PLANNER', GRID_CONFIG.pageWidth / 2, centerY + 35, { align: 'center' });

    // Week info - move to the left side
    pdf.setFont('times', 'normal');
    pdf.setFontSize(18);  // Much larger week info font
    const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    const weekEnd = weekEndDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    pdf.text(`WEEK ${weekNumber} -- ${weekStart} - ${weekEnd}`, centerX + 40, centerY + 35, { align: 'left' });

    // Navigation buttons - styled to match dashboard with larger fonts
    const buttonHeight = 25;
    const buttonWidth = 120;

    // Previous week button
    const prevButtonX = centerX + 60;
    const prevButtonY = centerY + 10;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(prevButtonX, prevButtonY, buttonWidth, buttonHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
    pdf.rect(prevButtonX, prevButtonY, buttonWidth, buttonHeight, 'S');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('← Previous Week', prevButtonX + buttonWidth/2, prevButtonY + 16, { align: 'center' });

    // Next week button
    const nextButtonX = GRID_CONFIG.pageWidth - centerX - 60 - buttonWidth;
    const nextButtonY = centerY + 10;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(nextButtonX, nextButtonY, buttonWidth, buttonHeight, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(1);
    pdf.rect(nextButtonX, nextButtonY, buttonWidth, buttonHeight, 'S');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Next Week →', nextButtonX + buttonWidth/2, nextButtonY + 16, { align: 'center' });

    // LEGEND - positioned below header with improved spacing
    const legendY = centerY + GRID_CONFIG.headerHeight + 5;
    const legendWidth = GRID_CONFIG.totalGridWidth;

    pdf.setFillColor(248, 248, 248);
    pdf.rect(centerX, legendY, legendWidth, GRID_CONFIG.legendHeight, 'F');
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(centerX, legendY, legendWidth, GRID_CONFIG.legendHeight, 'S');

    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);  // Larger legend font size for better readability

    // Legend items - better spacing for A3 format
    const legendItemSpacing = 150;  // Increased spacing for A3 format
    const totalLegendWidth = 3 * legendItemSpacing;
    const legendStartX = centerX + (legendWidth - totalLegendWidth) / 2;

    let legendX = legendStartX;

    // SimplePractice - white background with cornflower blue border and thick left flag
    pdf.setFillColor(255, 255, 255);
    pdf.rect(legendX, legendY + 5, 12, 8, 'F');  // Larger legend boxes for better visibility
    pdf.setDrawColor(100, 149, 237);
    pdf.setLineWidth(0.5);
    pdf.rect(legendX, legendY + 5, 12, 8, 'S');
    pdf.setLineWidth(2);  // Thicker left flag for better visibility
    pdf.line(legendX, legendY + 5, legendX, legendY + 13);
    pdf.setTextColor(0, 0, 0);
    pdf.text('SimplePractice', legendX + 18, legendY + 11);

    legendX += legendItemSpacing;

    // Google Calendar - white background with dashed green border
    pdf.setFillColor(255, 255, 255);
    pdf.rect(legendX, legendY + 5, 12, 8, 'F');  // Larger legend boxes for better visibility
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(0.5);
    pdf.setLineDash([2, 2]);
    pdf.rect(legendX, legendY + 5, 12, 8, 'S');
    pdf.setLineDash([]);
    pdf.text('Google Calendar', legendX + 18, legendY + 11);

    legendX += legendItemSpacing;

    // Holidays - filled yellow square
    pdf.setFillColor(255, 255, 0);
    pdf.rect(legendX, legendY + 5, 12, 8, 'F');  // Larger legend boxes for better visibility
    pdf.setDrawColor(245, 158, 11);
    pdf.setLineWidth(0.5);
    pdf.rect(legendX, legendY + 5, 12, 8, 'S');
    pdf.text('Holidays', legendX + 18, legendY + 11);

    // GRID STRUCTURE - full width utilization
    const gridStartY = GRID_CONFIG.gridStartY;

    // Grid border - full width
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(centerX, gridStartY, GRID_CONFIG.totalGridWidth, 25 + GRID_CONFIG.gridHeight);

    // HEADERS
    // Time header
    pdf.setFillColor(255, 255, 255);
    pdf.rect(centerX, gridStartY, GRID_CONFIG.timeColumnWidth, 25, 'F');
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);  // Larger time header font for better readability
    pdf.setTextColor(0, 0, 0);
    pdf.text('TIME', centerX + GRID_CONFIG.timeColumnWidth/2, gridStartY + 16, { align: 'center' });

    // Day headers - Full day names with dates
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    dayNames.forEach((dayName, index) => {
      const dayX = centerX + GRID_CONFIG.timeColumnWidth + (index * GRID_CONFIG.dayColumnWidth);
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + index);

      // Day header background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(dayX, gridStartY, GRID_CONFIG.dayColumnWidth, 25, 'F');

      // Full day name with date (e.g., "Monday 7-7-2025")
      pdf.setFont('times', 'bold');
      pdf.setFontSize(12);  // Smaller font to fit full day name and date
      pdf.setTextColor(0, 0, 0);
      const formattedDate = `${dayDate.getMonth() + 1}-${dayDate.getDate()}-${dayDate.getFullYear()}`;
      const dayHeader = `${dayName} ${formattedDate}`;
      pdf.text(dayHeader, dayX + GRID_CONFIG.dayColumnWidth/2, gridStartY + 16, { align: 'center' });

      // Vertical border between days
      if (index < 6) {
        pdf.setLineWidth(1);
        pdf.setDrawColor(0, 0, 0);
        pdf.line(dayX + GRID_CONFIG.dayColumnWidth, gridStartY, dayX + GRID_CONFIG.dayColumnWidth, gridStartY + 25 + GRID_CONFIG.gridHeight);
      }
    });

    // TIME SLOTS AND GRID - use the proper generateTimeSlots function
    const timeSlots = generateTimeSlots().map(slot => ({
      ...slot,
      isHour: slot.minute === 0
    }));

    console.log(`Generated ${timeSlots.length} time slots from ${timeSlots[0]?.time} to ${timeSlots[timeSlots.length - 1]?.time}`);

    timeSlots.forEach((slot, index) => {
      const y = gridStartY + 25 + (index * GRID_CONFIG.slotHeight);

      // For top-of-hour rows, extend gray background all the way to the right margin
      if (slot.isHour) {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(centerX, y, GRID_CONFIG.totalGridWidth, GRID_CONFIG.slotHeight, 'F');
      }

      // Time slot background - only for time column
      pdf.setFillColor(slot.isHour ? 240 : 248, slot.isHour ? 240 : 248, slot.isHour ? 240 : 248);
      pdf.rect(centerX, y, GRID_CONFIG.timeColumnWidth, GRID_CONFIG.slotHeight, 'F');

      // Time label - centered both horizontally and vertically
      pdf.setFont('times', slot.isHour ? 'bold' : 'normal');
      pdf.setFontSize(slot.isHour ? 12 : 10);  // Much larger time fonts
      pdf.setTextColor(0, 0, 0);
      // Center vertically by adjusting Y position more precisely
      const textY = y + (GRID_CONFIG.slotHeight / 2) + 4; // Better vertical centering
      pdf.text(slot.time, centerX + GRID_CONFIG.timeColumnWidth/2, textY, { align: 'center' });

      // Day cells
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const cellX = centerX + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth);

        // Cell background - only for half-hour slots if not already filled by hour background
        if (!slot.isHour) {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(cellX, y, GRID_CONFIG.dayColumnWidth, GRID_CONFIG.slotHeight, 'F');
        }

        // Cell border - consistent grid lines
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(cellX, y, GRID_CONFIG.dayColumnWidth, GRID_CONFIG.slotHeight, 'S');
      }

      // Horizontal grid lines - stronger for hour marks
      if (slot.isHour) {
        pdf.setLineWidth(1.5);
        pdf.setDrawColor(100, 100, 100);
      } else {
        pdf.setLineWidth(0.5);
        pdf.setDrawColor(200, 200, 200);
      }
      pdf.line(centerX, y, centerX + GRID_CONFIG.totalGridWidth, y);
    });

    // EVENTS - place them exactly like dashboard with NO overlapping using absolute positioning
    console.log(`📅 Rendering ${weekEvents.length} events for weekly PDF export`);

    // Group events by day to handle overlaps properly
    const eventsByDay: { [key: number]: CalendarEvent[] } = {};
    weekEvents.forEach(event => {
      const eventDate = new Date(event.startTime);
      const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayIndex >= 0 && dayIndex < 7) {
        if (!eventsByDay[dayIndex]) {
          eventsByDay[dayIndex] = [];
        }
        eventsByDay[dayIndex].push(event);
      }
    });

    // Render events for each day with proper positioning
    Object.keys(eventsByDay).forEach(dayIndexStr => {
      const dayIndex = parseInt(dayIndexStr);
      const dayEvents = eventsByDay[dayIndex].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      console.log(`📅 Day ${dayIndex}: ${dayEvents.length} events`);

      // Track used time slots for overlap detection
      const usedSlots: Set<number> = new Set();

      dayEvents.forEach((event, eventIndex) => {
        const eventDate = new Date(event.startTime);
        const eventEndDate = new Date(event.endTime);
        const eventHour = eventDate.getHours();
        const eventMinute = eventDate.getMinutes();
        const endHour = eventEndDate.getHours();
        const endMinute = eventEndDate.getMinutes();

        // Only show events within our time range (6:00-23:30)
        if (eventHour >= 6 && eventHour <= 23) {
          // Calculate precise slot position matching dashboard
          const startMinuteOfDay = (eventHour - 6) * 60 + eventMinute;
          const endMinuteOfDay = (endHour - 6) * 60 + endMinute;

          // Convert to slot positions (each slot is 30 minutes)
          const startSlot = Math.floor(startMinuteOfDay / 30);
          const endSlot = Math.min(Math.ceil(endMinuteOfDay / 30), 35); // Cap at 23:30

          // Check for overlaps and adjust position
          let horizontalOffset = 0;
          const maxOverlaps = 3; // Limit to 3 overlapping events max

          // Find available horizontal position
          while (horizontalOffset < maxOverlaps) {
            let hasOverlap = false;
            for (let slot = startSlot; slot < endSlot; slot++) {
              if (usedSlots.has(slot * 10 + horizontalOffset)) {
                hasOverlap = true;
                break;
              }
            }

            if (!hasOverlap) {
              // Mark slots as used
              for (let slot = startSlot; slot < endSlot; slot++) {
                usedSlots.add(slot * 10 + horizontalOffset);
              }
              break;
            }

            horizontalOffset++;
          }

          // Calculate event dimensions with overlap handling
          const baseEventWidth = GRID_CONFIG.dayColumnWidth - 2;
          const eventWidth = horizontalOffset > 0 ? Math.max(baseEventWidth * 0.6, 40) : baseEventWidth;
          const eventHeight = Math.max((endSlot - startSlot) * GRID_CONFIG.slotHeight - 1, 8);

          // Position with horizontal offset for overlapping events
          const eventX = centerX + GRID_CONFIG.timeColumnWidth + (dayIndex * GRID_CONFIG.dayColumnWidth) + 1 + (horizontalOffset * (eventWidth * 0.3));
          const eventY = gridStartY + 25 + (startSlot * GRID_CONFIG.slotHeight) + 1;

          console.log(`  📍 Event ${eventIndex + 1}: "${event.title}" at slot ${startSlot}-${endSlot}, offset ${horizontalOffset}`);

          // Event styling based on type - exact dashboard matching
          const isSimplePractice = event.source === 'simplepractice' || event.title.includes('Appointment');
          const isGoogle = event.source === 'google' && !isSimplePractice;
          const isHoliday = event.title.toLowerCase().includes('holiday') || event.source === 'holiday';

          // White background for ALL appointments - exact dashboard match
          pdf.setFillColor(255, 255, 255);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

          if (isSimplePractice) {
            // SimplePractice: FINAL FIX - exact dashboard matching cornflower blue border with thick left flag
            pdf.setDrawColor(100, 149, 237); // FINAL FIX: Exact cornflower blue RGB values
            pdf.setLineWidth(0.5); // FINAL FIX: Exact dashboard border thickness
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');

            // Thick left side flag - USER REQUESTED: 2px thicker than before
            pdf.setLineWidth(4.5); // USER REQUESTED: Made 2px thicker (2.5 + 2 = 4.5)
            pdf.line(eventX, eventY, eventX, eventY + eventHeight);

          } else if (isGoogle) {
            // Google Calendar: FINAL FIX - exact dashboard matching dashed green border
            pdf.setDrawColor(34, 197, 94); // FINAL FIX: Exact green RGB values
            pdf.setLineWidth(1); // FINAL FIX: Exact dashboard border thickness
            pdf.setLineDash([2.5, 2]); // FINAL FIX: Optimized dash pattern for dashboard match
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
            pdf.setLineDash([]);

          } else if (isHoliday) {
            // Holidays: Orange border
            pdf.setDrawColor(245, 158, 11);
            pdf.setLineWidth(1);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');

          } else {
            // Default: Gray border
            pdf.setDrawColor(156, 163, 175);
            pdf.setLineWidth(1);
            pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
          }

          // Event text - proportionally sized to fit within the appointment box
          const eventTitle = cleanEventTitle(event.title);
          const startTime = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          const endTime = eventEndDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

          pdf.setTextColor(0, 0, 0);

          // Calculate available text space - account for thick left border on SimplePractice
          const textX = isSimplePractice ? eventX + 6 : eventX + 3;
          const maxWidth = eventWidth - (isSimplePractice ? 12 : 6);

          // Determine if this is a 30-minute appointment for better spacing
          const durationMinutes = (eventEndDate.getTime() - eventDate.getTime()) / (1000 * 60);
          const is30MinuteAppt = durationMinutes <= 30;

          // Calculate proportional font sizes that fit within the appointment box
          const textPadding = is30MinuteAppt ? 6 : 4; // Extra padding for 30-min appointments
          const availableHeight = eventHeight - (textPadding * 2);
          const availableWidth = maxWidth - textPadding;

          // Base font sizes and proportional scaling - optimized for 30-minute appointments
          const baseHeightRatio = availableHeight / (is30MinuteAppt ? 8 : 12);
          const baseWidthRatio = availableWidth / 60;
          const scaleFactor = Math.min(baseHeightRatio, baseWidthRatio, 3.0);

          // Apply proportional sizing with enhanced spacing for 30-minute appointments
          const titleFontSize = Math.max(is30MinuteAppt ? 16 : 20, Math.min(40, 32 * scaleFactor));
          const timeFontSize = Math.max(is30MinuteAppt ? 14 : 18, Math.min(36, 28 * scaleFactor));

          // Clean and measure title text
          let displayTitle = eventTitle;
          const cleanTitle = cleanTitleForPDF(displayTitle);

          // Show title for all events that are tall enough
          if (eventHeight >= 8) {
            // Set proportional font size for title
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(titleFontSize);

            // Measure and truncate title if needed to fit width
            let truncatedTitle = cleanTitle;
            const titleWidth = pdf.getTextWidth(truncatedTitle);

            if (titleWidth > availableWidth) {
              // Truncate title to fit within available width
              const charRatio = availableWidth / titleWidth;
              const maxChars = Math.floor(cleanTitle.length * charRatio * 0.9); // 90% safety margin
              truncatedTitle = cleanTitle.substring(0, Math.max(1, maxChars - 3)) + '...';
            }

            // Enhanced positioning for 30-minute appointments
            const titleStartY = is30MinuteAppt ? eventY + textPadding + 8 : eventY + textPadding + titleFontSize;

            // Handle text wrapping using proportional line height
            const words = truncatedTitle.split(' ');
            const lineHeight = is30MinuteAppt ? titleFontSize * 1.1 : titleFontSize * 1.2;
            const maxLines = Math.floor((availableHeight * 0.6) / lineHeight); // Use 60% of height for title
            let currentLine = '';
            let lineCount = 0;

            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const textWidth = pdf.getTextWidth(testLine);

              if (textWidth <= availableWidth) {
                currentLine = testLine;
              } else {
                if (lineCount < maxLines && currentLine) {
                  pdf.text(currentLine, textX, titleStartY + (lineCount * lineHeight));
                  lineCount++;
                  currentLine = word;
                } else {
                  break;
                }
              }
            }

            // Print remaining text if there's space
            if (currentLine && lineCount < maxLines) {
              pdf.text(currentLine, textX, titleStartY + (lineCount * lineHeight));
            }
          }

          // Event time - enhanced positioning for 30-minute appointments
          if (eventHeight >= 12) {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(timeFontSize);

            // Better time positioning for 30-minute appointments
            const timeY = is30MinuteAppt ? 
              eventY + eventHeight - textPadding - 4 : // Position higher in 30-min appointments
              eventY + eventHeight - textPadding - (timeFontSize * 0.3);

            pdf.text(`${startTime}-${endTime}`, textX, timeY);
          }
        }
      });
    });

    // GRID BORDERS - complete border around the entire grid
    const gridEndY = gridStartY + 25 + GRID_CONFIG.gridHeight;
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(0, 0, 0);

    // Complete grid outline
    pdf.rect(centerX, gridStartY, GRID_CONFIG.totalGridWidth, 25 + GRID_CONFIG.gridHeight, 'S');

    // Vertical border between time column and days
    pdf.setLineWidth(0.5);
    pdf.line(
      centerX + GRID_CONFIG.timeColumnWidth, 
      gridStartY, 
      centerX + GRID_CONFIG.timeColumnWidth, 
      gridEndY
    );

    // Vertical lines between all day columns
    for (let i = 1; i < 7; i++) {
      const x = centerX + GRID_CONFIG.timeColumnWidth + (i * GRID_CONFIG.dayColumnWidth);
      pdf.setLineWidth(0.5);
      pdf.line(x, gridStartY, x, gridEndY);
    }

    // Download the PDF
    const filename = `Weekly_Calendar_${weekStartDate.toLocaleDateString('en-US').replace(/\//g, '-')}.pdf`;
    pdf.save(filename);

    console.log('PDF exported successfully!');
  } catch (error) {
    console.error('PDF export error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};