import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { cleanEventTitle } from './titleCleaner';

// EXACT WEEKLY PLANNER SPECIFICATIONS IMPLEMENTATION
export const exportExactWeeklySpec = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🎯 Starting EXACT weekly planner export with precise specifications...');
  
  // EXACT CANVAS DIMENSIONS - 3300x2550 pixels at 300 DPI
  // Convert to points for jsPDF: 1 inch = 72 points, 300 DPI = 300 pixels per inch
  // 3300 pixels / 300 DPI = 11 inches = 792 points
  // 2550 pixels / 300 DPI = 8.5 inches = 612 points
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [792, 612] // 11" x 8.5" in points
  });

  // Scale factor: 792 points / 3300 pixels = 0.24
  const SCALE = 792 / 3300;

  // EXACT SPECIFICATIONS matching Python implementation
  const SPEC = {
    // Canvas
    TOTAL_WIDTH: 3300,
    TOTAL_HEIGHT: 2550,
    DPI: 300,
    
    // Margins
    MARGIN: 30,
    
    // Header (matching Python: header_height = 120, line_spacing = 20, table_start_y = header_height + line_spacing + 30)
    HEADER_HEIGHT: 120,
    HEADER_LINE_SPACING: 20,
    HEADER_FONT_SIZE: 60,
    TABLE_START_Y: 170, // 120 + 20 + 30
    
    // Table calculations (matching Python)
    AVAILABLE_HEIGHT: 2350, // height - table_start_y - margin = 2550 - 170 - 30
    TOTAL_ROWS: 37, // 1 header + 36 time slots
    ROW_HEIGHT: 63, // available_height // total_rows = 2350 // 37
    
    // Column calculations (matching Python)
    TIME_COL_WIDTH: 180,
    AVAILABLE_WIDTH: 3240, // width - (2 * margin) - time_col_width = 3300 - 60 - 180
    DAY_COL_WIDTH: 462, // available_width // 7 = 3240 // 7
    
    // Colors
    BLACK: [0, 0, 0],
    WHITE: [255, 255, 255],
    GREY_BG: [220, 220, 220],
    
    // Font sizes (matching Python)
    TOP_HOUR_FONT: 28,
    HALF_HOUR_FONT: 24,
    HEADER_FONT: 60,
    
    // Borders
    HEADER_BORDER: 2,
    CELL_BORDER: 1
  };

  // Filter events for this week with more robust date comparison
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventLocalDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const weekStartLocalDate = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate());
    const weekEndLocalDate = new Date(weekEndDate.getFullYear(), weekEndDate.getMonth(), weekEndDate.getDate());
    
    return eventLocalDate >= weekStartLocalDate && eventLocalDate <= weekEndLocalDate;
  });

  console.log(`📅 Week Export Debug:`);
  console.log(`Week Start: ${weekStartDate.toDateString()}`);
  console.log(`Week End: ${weekEndDate.toDateString()}`);
  console.log(`Total Events: ${weekEvents.length}`);
  
  // Log events by day for debugging
  const eventsByDay = {};
  weekEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (!eventsByDay[dayName]) eventsByDay[dayName] = [];
    eventsByDay[dayName].push(event.title);
  });
  console.log('Events by day:', eventsByDay);
  
  // Verify first day of week is Monday
  const firstDayOfWeek = weekStartDate.getDay(); // 0=Sunday, 1=Monday
  if (firstDayOfWeek !== 1) {
    console.warn(`⚠️ Week start is not Monday! Day of week: ${firstDayOfWeek}`);
  }

  // Set white background
  pdf.setFillColor(...SPEC.WHITE);
  pdf.rect(0, 0, 792, 612, 'F');

  // Draw all components
  drawExactHeader(pdf, weekStartDate, weekEndDate, SPEC, SCALE);
  drawExactTable(pdf, weekStartDate, weekEvents, SPEC, SCALE);
  
  // Save with exact filename
  const filename = `exact-weekly-planner-${weekStartDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ EXACT weekly planner exported: ${filename}`);
};

function drawExactHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, SPEC: any, SCALE: number): void {
  // Header font setup (matching Python: font_header_large 60pt)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(SPEC.HEADER_FONT * SCALE);
  pdf.setTextColor(...SPEC.BLACK);
  
  // "WEEKLY PLANNER" moved down to be centered in header space
  pdf.text('WEEKLY PLANNER', SPEC.TOTAL_WIDTH * SCALE / 2, 70 * SCALE, { align: 'center' });
  
  // Week info positioned flush with left side of Time column with smaller font
  const weekStart = weekStartDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  const weekEnd = weekEndDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  const weekText = `WEEK ${weekNumber} -- ${weekStart} - ${weekEnd}`;
  
  // Set smaller font size for week info
  pdf.setFontSize((SPEC.HEADER_FONT - 10) * SCALE);
  // Position flush with left side of Time column
  pdf.text(weekText, SPEC.MARGIN * SCALE, 90 * SCALE);
  
  // Header line (matching Python: margin to width - margin at header_height + line_spacing)
  pdf.setLineWidth(SPEC.HEADER_BORDER * SCALE);
  pdf.setDrawColor(...SPEC.BLACK);
  pdf.line(
    SPEC.MARGIN * SCALE,
    (SPEC.HEADER_HEIGHT + SPEC.HEADER_LINE_SPACING) * SCALE,
    (SPEC.TOTAL_WIDTH - SPEC.MARGIN) * SCALE,
    (SPEC.HEADER_HEIGHT + SPEC.HEADER_LINE_SPACING) * SCALE
  );
}

function drawExactTable(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], SPEC: any, SCALE: number): void {
  // Column positions - ensure Monday column is properly positioned
  const columnPositions = [];
  let currentX = SPEC.MARGIN;
  
  // Time column
  columnPositions.push({ start: currentX, end: currentX + SPEC.TIME_COL_WIDTH });
  currentX += SPEC.TIME_COL_WIDTH;
  
  // Calculate day column width to ensure all days fit within page boundaries
  const availableWidth = SPEC.TOTAL_WIDTH - SPEC.MARGIN * 2 - SPEC.TIME_COL_WIDTH;
  const dayWidth = Math.floor(availableWidth / 7); // Use floor to prevent overflow
  
  // Day columns - ensure Monday (index 0) starts immediately after time column
  for (let i = 0; i < 7; i++) {
    const colStart = currentX;
    const colEnd = currentX + dayWidth;
    columnPositions.push({ start: colStart, end: colEnd });
    currentX += dayWidth;
    
    const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i];
    console.log(`${dayName} column: ${colStart}-${colEnd} (width: ${dayWidth})`);
  }

  // Day headers with full day names and dates
  const dayHeaders = ['Time'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Generate full day headers with dates - ensure Monday start
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    const formattedDate = `${dayDate.getMonth() + 1}-${dayDate.getDate()}-${dayDate.getFullYear()}`;
    
    console.log(`Day ${i}: ${dayNames[i]} ${formattedDate} (${dayDate.toDateString()})`);
    
    dayHeaders.push(`${dayNames[i]} ${formattedDate}`);
  }
  
  // Draw header row (matching Python logic exactly)
  let currentY = SPEC.TABLE_START_Y * SCALE;
  
  // Draw header row cells
  for (let col = 0; col < dayHeaders.length; col++) {
    const x = columnPositions[col].start * SCALE;
    const width = (columnPositions[col].end - columnPositions[col].start) * SCALE;
    
    // Header cell background
    pdf.setFillColor(...SPEC.WHITE);
    pdf.rect(x, currentY, width, SPEC.ROW_HEIGHT * SCALE, 'F');
    
    // Header cell border (matching Python: width=2 for header)
    pdf.setLineWidth(SPEC.HEADER_BORDER * SCALE);
    pdf.setDrawColor(...SPEC.BLACK);
    pdf.rect(x, currentY, width, SPEC.ROW_HEIGHT * SCALE, 'S');
    
    // Header text - perfectly centered both horizontally and vertically
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(SPEC.TOP_HOUR_FONT * SCALE);
    pdf.setTextColor(...SPEC.BLACK);
    
    // Calculate exact center position for both horizontal and vertical alignment
    const centerX = x + width / 2;
    const centerY = currentY + SPEC.ROW_HEIGHT * SCALE / 2;
    
    // Adjust for font baseline to center the text exactly
    const fontAdjustment = (SPEC.TOP_HOUR_FONT * SCALE) / 3;
    const textY = centerY + fontAdjustment;
    
    pdf.text(
      dayHeaders[col],
      centerX,
      textY,
      { align: 'center' }
    );
  }
  
  currentY += SPEC.ROW_HEIGHT * SCALE;

  // Generate time slots exactly like Python (6 AM to 11 PM with 30-minute increments)
  const timeSlots = [];
  for (let hour = 6; hour < 24; hour++) {
    timeSlots.push({ time: `${hour.toString().padStart(2, '0')}:00`, isTopHour: true });
    timeSlots.push({ time: `${hour.toString().padStart(2, '0')}:30`, isTopHour: false });
  }

  // Draw all time slot rows (matching Python logic exactly)
  timeSlots.forEach((slot, rowIndex) => {
    const y = currentY + (rowIndex * SPEC.ROW_HEIGHT * SCALE);
    
    // Background color for entire row (matching Python: is_top_of_hour = time_slot.endswith('00'))
    const bgColor = slot.isTopHour ? SPEC.GREY_BG : SPEC.WHITE;
    const fontToUse = slot.isTopHour ? SPEC.TOP_HOUR_FONT : SPEC.HALF_HOUR_FONT;
    
    // Fill background for top of hour rows only within the grid area
    if (slot.isTopHour) {
      pdf.setFillColor(...bgColor);
      // Gray background only within the grid, not extending beyond right grid line
      const gridWidth = columnPositions[columnPositions.length - 1].end - columnPositions[0].start;
      pdf.rect(
        columnPositions[0].start * SCALE,
        y,
        gridWidth * SCALE,
        SPEC.ROW_HEIGHT * SCALE,
        'F'
      );
    }
    
    // Draw all cells in this row
    for (let col = 0; col < dayHeaders.length; col++) {
      const x = columnPositions[col].start * SCALE;
      const width = (columnPositions[col].end - columnPositions[col].start) * SCALE;
      
      // Cell border (matching Python: width=1 for cells)
      pdf.setLineWidth(SPEC.CELL_BORDER * SCALE);
      pdf.setDrawColor(...SPEC.BLACK);
      pdf.rect(x, y, width, SPEC.ROW_HEIGHT * SCALE, 'S');
      
      // Time column text - perfectly centered both horizontally and vertically
      if (col === 0) {
        // Bold font for top-of-hour times, normal for half-hour times
        pdf.setFont('helvetica', slot.isTopHour ? 'bold' : 'normal');
        pdf.setFontSize(fontToUse * SCALE);
        pdf.setTextColor(...SPEC.BLACK);
        
        // Calculate exact center position
        const centerX = x + (width / 2);
        const centerY = y + (SPEC.ROW_HEIGHT * SCALE / 2);
        
        // Adjust for font baseline - center the text exactly
        const fontAdjustment = (fontToUse * SCALE) / 3; // Approximate font baseline adjustment
        const textY = centerY + fontAdjustment;
        
        pdf.text(
          slot.time,
          centerX,
          textY,
          { align: 'center' }
        );
      }
    }
  });

  // Draw appointments with exact styling
  drawExactAppointments(pdf, weekStartDate, events, SPEC, SCALE, columnPositions, SPEC.TABLE_START_Y * SCALE, timeSlots);
}

function drawExactAppointments(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], SPEC: any, SCALE: number, columnPositions: any[], headerY: number, timeSlots: any[]): void {
  events.forEach(event => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    // Fix timezone issue by comparing dates in local timezone
    const eventLocalDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const weekStartLocalDate = new Date(weekStartDate.getFullYear(), weekStartDate.getMonth(), weekStartDate.getDate());
    
    // Calculate day index (0-6 for Mon-Sun)
    const dayIndex = Math.floor((eventLocalDate.getTime() - weekStartLocalDate.getTime()) / (1000 * 60 * 60 * 24));
    const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIndex];
    
    console.log(`📍 Event: ${event.title} | Event Date: ${eventDate.toDateString()} | Day: ${dayName} | Day Index: ${dayIndex}`);
    
    if (dayIndex < 0 || dayIndex > 6) {
      console.warn(`⚠️ Event ${event.title} outside week range - Day Index: ${dayIndex}`);
      return;
    }
    
    const columnIndex = dayIndex + 1; // +1 to skip TIME column (1-7 for Mon-Sun)
    console.log(`📊 ${event.title} -> Column ${columnIndex} (${dayName})`);
    
    // Verify column exists
    if (!columnPositions[columnIndex]) {
      console.error(`❌ Column ${columnIndex} not found for ${dayName} event: ${event.title}`);
      return;
    }
    
    // Find time slot indices
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    
    // Convert to 24-hour format strings with colons
    const startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinute >= 30 ? '30' : '00'}`;
    const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute >= 30 ? '30' : '00'}`;
    
    const startSlotIndex = timeSlots.findIndex(slot => slot.time === startTimeStr);
    const endSlotIndex = timeSlots.findIndex(slot => slot.time === endTimeStr);
    
    if (startSlotIndex === -1) return;
    
    // Calculate position
    const x = columnPositions[columnIndex].start * SCALE + 2;
    const y = headerY + ((startSlotIndex + 1) * SPEC.ROW_HEIGHT * SCALE) + 2;
    const width = (columnPositions[columnIndex].end - columnPositions[columnIndex].start) * SCALE - 4;
    
    // Calculate exact height based on appointment duration
    const durationInMinutes = (endDate.getTime() - eventDate.getTime()) / (1000 * 60);
    const durationInSlots = durationInMinutes / 30; // Each slot is 30 minutes
    
    // Height should be proportional to the duration
    const height = Math.max(
      SPEC.ROW_HEIGHT * SCALE - 4, // Minimum height (30 minutes)
      durationInSlots * SPEC.ROW_HEIGHT * SCALE - 4 // Actual duration height
    );
    
    // Debug logging for appointment spacing
    console.log(`📊 Appointment: ${event.title} | Duration: ${durationInMinutes}min (${durationInSlots} slots) | Height: ${height}px`);
    
    // White background for all appointments
    pdf.setFillColor(...SPEC.WHITE);
    pdf.rect(x, y, width, height, 'F');
    
    // Styling based on event type
    if (event.title.includes('Appointment')) {
      // SimplePractice - cornflower blue border with thick left edge
      pdf.setDrawColor(100, 149, 237);
      pdf.setLineWidth(1 * SCALE);
      pdf.rect(x, y, width, height, 'S');
      
      // Thick left border - 2px thicker than before
      pdf.setLineWidth(5 * SCALE); // Made 2px thicker (was 3, now 5)
      pdf.line(x, y, x, y + height);
      
    } else if (event.source === 'google') {
      // Google Calendar - green dashed border
      pdf.setDrawColor(34, 197, 94);
      pdf.setLineWidth(1 * SCALE);
      pdf.setLineDashPattern([3 * SCALE, 2 * SCALE], 0);
      pdf.rect(x, y, width, height, 'S');
      pdf.setLineDashPattern([], 0);
      
    } else {
      // Holidays - solid yellow
      pdf.setFillColor(255, 193, 7);
      pdf.rect(x, y, width, height, 'F');
    }
    
    // Event text - sized to fit proportionally within the appointment box
    const padding = 4; // Reduced padding for better text fitting
    
    // Clean title and handle long text - remove emojis and problematic characters
    let title = cleanEventTitle(event.title);
    // Remove "Appointment" suffix if present
    if (title.endsWith(' Appointment')) {
      title = title.slice(0, -12);
    }
    const source = event.source === 'google' ? 'GOOGLE CALENDAR' : 'SIMPLEPRACTICE';
    const timeText = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}-${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
    
    // Calculate available space for text
    const availableHeight = height - (padding * 2);
    const availableWidth = width - (padding * 2);
    
    // Compact font sizes optimized for space efficiency while maintaining readability
    let titleFontSize, sourceFontSize, timeFontSize;
    
    if (durationInMinutes <= 30) {
      // 30-minute appointments: very compact fonts for small spaces
      titleFontSize = 6;  // Small but readable titles
      sourceFontSize = 4; // Compact source labels
      timeFontSize = 5;   // Clear time display
    } else if (durationInMinutes >= 90) {
      // 90-minute appointments: moderate fonts with room for wrapping
      titleFontSize = 8;  // Readable titles in larger spaces
      sourceFontSize = 6; // Clear source identification
      timeFontSize = 7;   // Time ranges
    } else {
      // 60-minute appointments: balanced compact fonts with text wrapping
      titleFontSize = 7;  // Moderate title size
      sourceFontSize = 5; // Readable source size
      timeFontSize = 6;   // Clear time size
    }
    
    // Calculate starting position for text with compact spacing
    let titleY;
    
    if (durationInMinutes <= 30) {
      // 30-minute appointments: start very close to top for maximum space usage
      titleY = y + padding + 1;
    } else if (durationInMinutes >= 90) {
      // 90-minute appointments: start with moderate spacing
      titleY = y + padding + 1.5;
    } else {
      // 60-minute appointments: balanced compact starting position
      titleY = y + padding + 1.2;
    }
    
    // Helper function to wrap text to fit within available width
    function wrapText(text: string, fontSize: number, maxWidth: number): string[] {
      pdf.setFontSize(fontSize);
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = pdf.getTextWidth(testLine);
        
        if (testWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Single word is too long, split it
            lines.push(word);
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    }
    
    // Wrap title text to fit within available width
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(titleFontSize);
    const titleLines = wrapText(title, titleFontSize, availableWidth);
    
    // Draw title lines with tight spacing
    pdf.setTextColor(...SPEC.BLACK);
    let currentY = titleY;
    const lineHeight = titleFontSize * 1.1; // 10% line spacing for compact layout
    
    for (let i = 0; i < titleLines.length && currentY < y + height - padding; i++) {
      pdf.text(titleLines[i], x + padding, currentY);
      currentY += lineHeight;
    }
    
    // Draw source - wrap text to fit within available width
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(sourceFontSize);
    const sourceLines = wrapText(source, sourceFontSize, availableWidth);
    
    // Calculate dynamic sourceY based on title lines with tight spacing
    let dynamicSourceY = titleY + (titleLines.length * lineHeight) + 1;
    const sourceLineHeight = sourceFontSize * 1.1; // Tighter spacing for compact layout
    
    for (let i = 0; i < sourceLines.length && dynamicSourceY < y + height - padding; i++) {
      pdf.text(sourceLines[i], x + padding, dynamicSourceY);
      dynamicSourceY += sourceLineHeight;
    }
    
    // Draw time range - wrap text to fit within available width
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(timeFontSize);
    const timeLines = wrapText(timeText, timeFontSize, availableWidth);
    
    // Calculate dynamic timeY based on source lines with tight spacing
    let dynamicTimeY = dynamicSourceY + 1;
    const timeLineHeight = timeFontSize * 1.1; // Tighter spacing for compact layout
    
    for (let i = 0; i < timeLines.length && dynamicTimeY < y + height - padding; i++) {
      pdf.text(timeLines[i], x + padding, dynamicTimeY);
      dynamicTimeY += timeLineHeight;
    }
  });
}