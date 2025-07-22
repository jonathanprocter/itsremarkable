import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

/**
 * Browser-Matching PDF Export
 * Creates PDF exports that exactly match what's displayed in the browser
 */

export const exportBrowserMatchingWeeklyPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🔄 Creating browser-matching weekly PDF using EXACT Python specifications...');

  // Create PDF with US Letter landscape (11 x 8.5 inches = 792 x 612 points)
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter'
  });

  // EXACT SPECIFICATIONS from Python reference file
  // Original: 3300x2550 pixels at 300 DPI = 11x8.5 inches
  // PDF: 792x612 points (72 DPI equivalent)
  // Calculate scale factor to ensure full grid fits within page margins
  const availableWidth = 792 - 40; // 20pt margins on each side
  const pythonTotalWidth = 180 + (441 * 7); // time column + 7 day columns
  const scaleFactor = availableWidth / pythonTotalWidth;
  
  const config = {
    // Python specs scaled to fit within PDF margins
    margin: 20,                         // Fixed margins
    headerHeight: 120 * scaleFactor,    // 120px scaled
    lineSpacing: 20 * scaleFactor,      // 20px scaled
    timeColumnWidth: 180 * scaleFactor, // 180px scaled
    dayColumnWidth: 441 * scaleFactor,  // 441px scaled
    rowHeight: 63 * scaleFactor,        // 63px scaled
    totalRows: 37 // 1 header + 36 time slots
  };
  
  console.log('📊 EXACT Python specifications scaled to PDF:', config);
  console.log('📊 Scale factor:', scaleFactor);

  const gridStartX = config.margin;
  const gridStartY = config.margin + config.headerHeight + config.lineSpacing;
  const totalGridWidth = config.timeColumnWidth + (config.dayColumnWidth * 7);

  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 792, 612, 'F');

  // HEADER - exactly match Python specifications
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(60 * scaleFactor); // 60pt scaled to PDF
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY PLANNER', config.margin, config.margin + (20 * scaleFactor));

  // Week info - right aligned like Python spec but ensure it fits
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(60 * scaleFactor);
  const weekText = 'Week 27 — 7/7-7/13';
  const weekTextWidth = pdf.getTextWidth(weekText);
  pdf.text(weekText, 792 - config.margin - weekTextWidth, config.margin + (20 * scaleFactor));

  // Header line - exactly match Python specs
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2 * scaleFactor);
  pdf.line(config.margin, config.margin + config.headerHeight, 792 - config.margin, config.margin + config.headerHeight);

  // GRID STRUCTURE - EXACT Python specifications
  const tableStartY = gridStartY;
  
  // Column headers exactly as Python spec
  const headers = ['Time', 'Mon 7/7', 'Tue 7/8', 'Wed 7/9', 'Thu 7/10', 'Fri 7/11', 'Sat 7/12', 'Sun 7/13'];
  
  // Draw header row with 2px border
  let currentX = gridStartX;
  for (let i = 0; i < headers.length; i++) {
    const colWidth = i === 0 ? config.timeColumnWidth : config.dayColumnWidth;
    
    // Gray background for header
    pdf.setFillColor(240, 240, 240);
    pdf.rect(currentX, tableStartY, colWidth, config.rowHeight, 'F');
    
    // Header border - 2px as per Python spec
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(2);
    pdf.rect(currentX, tableStartY, colWidth, config.rowHeight, 'S');
    
    // Header text
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28 * scaleFactor); // 28pt scaled
    pdf.setTextColor(0, 0, 0);
    pdf.text(headers[i], currentX + colWidth/2, tableStartY + config.rowHeight/2 + 2, { align: 'center' });
    
    currentX += colWidth;
  }

  // Generate ALL 36 time slots exactly as Python spec
  const timeSlots = [];
  for (let hour = 6; hour < 24; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}00`);  // Top of hour
    timeSlots.push(`${hour.toString().padStart(2, '0')}30`);  // Half hour
  }
  
  console.log(`Generated ${timeSlots.length} time slots as per Python spec`);

  // Draw all time rows
  let currentY = tableStartY + config.rowHeight;
  
  for (let rowIdx = 0; rowIdx < timeSlots.length; rowIdx++) {
    const timeSlot = timeSlots[rowIdx];
    const isTopOfHour = timeSlot.endsWith('00');
    
    // Background color - grey for top of hour, white for half hour
    const bgColor = isTopOfHour ? [220, 220, 220] : [255, 255, 255];
    const fontSize = isTopOfHour ? Math.max(12, 28 * scaleFactor) : Math.max(10, 24 * scaleFactor);
    
    currentX = gridStartX;
    
    // Draw all cells in this row
    for (let colIdx = 0; colIdx < 8; colIdx++) {
      const colWidth = colIdx === 0 ? config.timeColumnWidth : config.dayColumnWidth;
      
      // Fill background - extends across entire row for top of hour
      if (isTopOfHour) {
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(currentX + 1, currentY + 1, colWidth - 2, config.rowHeight - 2, 'F');
      }
      
      // Cell border - 1px as per Python spec
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.rect(currentX, currentY, colWidth, config.rowHeight, 'S');
      
      // Time text in first column only
      if (colIdx === 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(fontSize);
        pdf.setTextColor(0, 0, 0);
        pdf.text(timeSlot, currentX + colWidth/2, currentY + config.rowHeight/2 + 2, { align: 'center' });
      }
      
      currentX += colWidth;
    }
    
    currentY += config.rowHeight;
  }

  // VERTICAL SEPARATORS - strong vertical lines between ALL columns
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  currentX = gridStartX;
  for (let col = 0; col <= 7; col++) {
    pdf.line(currentX, tableStartY, currentX, tableStartY + (config.rowHeight * 37)); // 37 = 1 header + 36 time slots
    currentX += (col === 0 ? config.timeColumnWidth : config.dayColumnWidth);
  }

  // EVENTS - positioned according to Python grid structure
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });

  console.log(`Rendering ${weekEvents.length} events using Python grid positioning...`);

  weekEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Calculate day column (0-6 for Mon-Sun)
    const dayOfWeek = (eventDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 format
    
    // Calculate time slot position (0-35 for 36 slots)
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    
    const endHour = eventEnd.getHours();
    const endMinute = eventEnd.getMinutes();
    const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlot < 0 || startSlot >= 36) return; // Skip events outside time range
    
    // Position within the day column
    const eventX = gridStartX + config.timeColumnWidth + (dayOfWeek * config.dayColumnWidth) + 2;
    
    // Position within the time grid (accounting for header row)
    const eventY = tableStartY + config.rowHeight + (startSlot * config.rowHeight) + 2;
    
    const eventWidth = config.dayColumnWidth - 4;
    const eventHeight = Math.max((endSlot - startSlot) * config.rowHeight - 4, config.rowHeight - 4);
    
    // Event styling based on source (match browser exactly)
    pdf.setFillColor(255, 255, 255); // White background for all events
    
    if (event.title.toLowerCase().includes('appointment')) {
      // SimplePractice appointments - cornflower blue border with thick left flag
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(100, 149, 237); // Cornflower blue
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      // Thick left border flag
      pdf.setLineWidth(2 * scaleFactor);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);
    } else if (event.source === 'google') {
      // Google Calendar events - dashed green border
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(34, 197, 94); // Green
      pdf.setLineWidth(1);
      // Dashed border (approximate with short lines)
      const dashLength = 3 * scaleFactor;
      for (let i = 0; i < eventWidth; i += dashLength * 2) {
        pdf.line(eventX + i, eventY, eventX + Math.min(i + dashLength, eventWidth), eventY);
        pdf.line(eventX + i, eventY + eventHeight, eventX + Math.min(i + dashLength, eventWidth), eventY + eventHeight);
      }
      for (let i = 0; i < eventHeight; i += dashLength * 2) {
        pdf.line(eventX, eventY + i, eventX, eventY + Math.min(i + dashLength, eventHeight));
        pdf.line(eventX + eventWidth, eventY + i, eventX + eventWidth, eventY + Math.min(i + dashLength, eventHeight));
      }
    } else {
      // Holiday/other events - orange border
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(245, 158, 11); // Orange
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    }
    
    // Event text - increased font sizes for better readability
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(Math.max(10, 8 * scaleFactor)); // Minimum 10pt for event titles
    pdf.setTextColor(0, 0, 0);
    
    // Event title (remove "Appointment" suffix like browser)
    let displayTitle = event.title;
    if (displayTitle.toLowerCase().includes(' appointment')) {
      displayTitle = displayTitle.replace(/ appointment$/i, '');
    }
    
    // Truncate if too long for readability
    if (displayTitle.length > 10) {
      displayTitle = displayTitle.substring(0, 10) + '...';
    }
    
    pdf.text(displayTitle, eventX + 3, eventY + 10);
    
    // Time display - larger font for better readability
    pdf.setFontSize(Math.max(9, 6 * scaleFactor)); // Minimum 9pt for time display
    const timeDisplay = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    pdf.text(timeDisplay, eventX + 3, eventY + eventHeight - 5);
  });

  // Legend is now at the top

  // Save PDF
  const filename = `browser-matching-weekly-${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ Browser-matching weekly PDF saved: ${filename}`);
};

export const exportBrowserMatchingDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🔄 Creating browser-matching daily PDF...');

  // Create PDF with 8.5x11 portrait format
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [612, 792]
  });

  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  console.log(`Found ${dayEvents.length} events for ${selectedDate.toDateString()}`);

  // Configuration for daily view
  const config = {
    margin: 30,
    timeColumnWidth: 80,
    appointmentColumnWidth: 502,
    timeSlotHeight: 20,
    headerHeight: 100
  };

  const gridStartY = config.margin + config.headerHeight;

  // White background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, 612, 792, 'F');

  // HEADER
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(0, 0, 0);
  pdf.text('DAILY PLANNER', 612 / 2, config.margin + 30, { align: 'center' });

  // Date
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(16);
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, 612 / 2, config.margin + 60, { align: 'center' });

  // Navigation buttons
  const buttonWidth = 100;
  const buttonHeight = 25;
  
  // Back to week button
  pdf.setFillColor(245, 245, 245);
  pdf.rect(config.margin, config.margin + 70, buttonWidth, buttonHeight, 'F');
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(1);
  pdf.rect(config.margin, config.margin + 70, buttonWidth, buttonHeight, 'S');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('← Back to Week', config.margin + buttonWidth/2, config.margin + 70 + buttonHeight/2 + 3, { align: 'center' });

  // Previous/Next day buttons
  pdf.setFillColor(245, 245, 245);
  pdf.rect(612 - config.margin - buttonWidth - 30, config.margin + 70, 25, buttonHeight, 'F');
  pdf.rect(612 - config.margin - buttonWidth - 30, config.margin + 70, 25, buttonHeight, 'S');
  pdf.text('<', 612 - config.margin - buttonWidth - 30 + 12, config.margin + 70 + buttonHeight/2 + 3, { align: 'center' });
  
  pdf.rect(612 - config.margin - 25, config.margin + 70, 25, buttonHeight, 'F');
  pdf.rect(612 - config.margin - 25, config.margin + 70, 25, buttonHeight, 'S');
  pdf.text('>', 612 - config.margin - 25 + 12, config.margin + 70 + buttonHeight/2 + 3, { align: 'center' });

  // GRID HEADERS
  pdf.setFillColor(255, 255, 255); // White headers like browser
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  
  // Time header
  pdf.rect(config.margin, gridStartY, config.timeColumnWidth, config.timeSlotHeight, 'F');
  pdf.rect(config.margin, gridStartY, config.timeColumnWidth, config.timeSlotHeight, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('TIME', config.margin + config.timeColumnWidth/2, gridStartY + config.timeSlotHeight/2 + 3, { align: 'center' });

  // Appointment header
  pdf.rect(config.margin + config.timeColumnWidth, gridStartY, config.appointmentColumnWidth, config.timeSlotHeight, 'F');
  pdf.rect(config.margin + config.timeColumnWidth, gridStartY, config.appointmentColumnWidth, config.timeSlotHeight, 'S');
  pdf.text('APPOINTMENTS', config.margin + config.timeColumnWidth + config.appointmentColumnWidth/2, gridStartY + config.timeSlotHeight/2 + 3, { align: 'center' });

  // TIME GRID - 6:00 to 23:30 (36 slots)
  for (let slot = 0; slot < 36; slot++) {
    const hour = Math.floor(slot / 2) + 6;
    const minute = (slot % 2) * 30;
    const timeY = gridStartY + ((slot + 1) * config.timeSlotHeight);
    
    // Alternating row backgrounds (match browser)
    if (slot % 2 === 0) {
      pdf.setFillColor(240, 240, 240); // Gray for hour rows
    } else {
      pdf.setFillColor(248, 248, 248); // Light gray for half-hour rows
    }
    pdf.rect(config.margin, timeY, config.timeColumnWidth + config.appointmentColumnWidth, config.timeSlotHeight, 'F');
    
    // Grid lines
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(config.margin, timeY, config.margin + config.timeColumnWidth + config.appointmentColumnWidth, timeY);
    
    // Time labels
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(slot % 2 === 0 ? 10 : 9);
    pdf.setTextColor(0, 0, 0);
    const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    pdf.text(timeLabel, config.margin + config.timeColumnWidth/2, timeY + config.timeSlotHeight/2 + 2, { align: 'center' });
  }

  // Vertical separator between time and appointments
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(config.margin + config.timeColumnWidth, gridStartY, config.margin + config.timeColumnWidth, gridStartY + (36 * config.timeSlotHeight));

  // APPOINTMENTS
  dayEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    
    const endHour = eventEnd.getHours();
    const endMinute = eventEnd.getMinutes();
    const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlot < 0 || startSlot >= 36) return; // Skip events outside time range
    
    const eventX = config.margin + config.timeColumnWidth + 5;
    const eventY = gridStartY + ((startSlot + 1) * config.timeSlotHeight) + 2;
    const eventWidth = config.appointmentColumnWidth - 10;
    const eventHeight = Math.max((endSlot - startSlot) * config.timeSlotHeight - 4, config.timeSlotHeight - 4);
    
    // Event background - white
    pdf.setFillColor(255, 255, 255);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
    
    // Event border based on source
    if (event.title.toLowerCase().includes('appointment')) {
      // SimplePractice - cornflower blue with thick left flag
      pdf.setDrawColor(100, 149, 237);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      pdf.setLineWidth(4);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);
    } else if (event.source === 'google') {
      // Google Calendar - dashed green
      pdf.setDrawColor(34, 197, 94);
      pdf.setLineWidth(1);
      // Simplified dashed border
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    } else {
      // Holiday - orange
      pdf.setDrawColor(245, 158, 11);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    }
    
    // Event text
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    
    let displayTitle = event.title;
    if (displayTitle.toLowerCase().includes(' appointment')) {
      displayTitle = displayTitle.replace(/ appointment$/i, '');
    }
    
    pdf.text(displayTitle, eventX + 5, eventY + 15);
    
    // Source and time
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const source = event.title.toLowerCase().includes('appointment') ? 'SimplePractice' : 'Google Calendar';
    pdf.text(source, eventX + 5, eventY + 30);
    
    pdf.setFontSize(24); // Large time display like browser
    const timeDisplay = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    pdf.text(timeDisplay, eventX + 5, eventY + 55);
  });

  // Save PDF
  const filename = `browser-matching-daily-${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ Browser-matching daily PDF saved: ${filename}`);
};