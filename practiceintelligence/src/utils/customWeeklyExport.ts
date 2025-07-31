import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { getWeekNumber } from './dateUtils';

// Custom weekly export with exact user specifications
export const exportCustomWeeklyCalendar = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🎯 Starting custom weekly calendar export with user specifications...');
  
  // Create PDF with 11" x 8.5" landscape (792x612 points) for US Letter format
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [792, 612]
  });

  // Filter events for this week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });

  // Configuration for proper scaling
  const config = {
    // Page dimensions
    pageWidth: 792,
    pageHeight: 612,
    
    // Margins
    leftMargin: 20,
    rightMargin: 20,
    topMargin: 20,
    bottomMargin: 20,
    
    // Header
    headerHeight: 60,
    headerLineSpacing: 10,
    
    // Grid
    timeColumnWidth: 80,
    startHour: 6,
    endHour: 23,
    endMinute: 30,
    
    // Colors
    colors: {
      black: [0, 0, 0],
      white: [255, 255, 255],
      simplePracticeBlue: [100, 149, 237],
      googleGreen: [34, 197, 94],
      holidayYellow: [255, 193, 7],
      hourRowGray: [240, 240, 240],
      halfHourWhite: [255, 255, 255],
      gridLines: [200, 200, 200]
    }
  };

  // Set white background
  pdf.setFillColor(...config.colors.white);
  pdf.rect(0, 0, config.pageWidth, config.pageHeight, 'F');

  // Draw header
  drawHeader(pdf, weekStartDate, weekEndDate, config);
  
  // Draw time grid and events
  drawTimeGrid(pdf, weekStartDate, weekEvents, config);
  
  // Save the PDF
  const filename = `custom-weekly-planner-${weekStartDate.toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  
  console.log(`✅ Custom weekly calendar exported: ${filename}`);
};

function drawHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, config: any): void {
  // Set font and color for header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(...config.colors.black);
  
  // "WEEKLY PLANNER" at left margin
  pdf.text('WEEKLY PLANNER', config.leftMargin, config.topMargin + 30);
  
  // Week info at right side
  const weekNumber = getWeekNumber(weekStartDate);
  const weekText = `Week ${weekNumber} — ${weekStartDate.getMonth() + 1}/${weekStartDate.getDate()}-${weekEndDate.getMonth() + 1}/${weekEndDate.getDate()}`;
  
  // Calculate text width and position from right
  const textWidth = pdf.getTextWidth(weekText);
  const weekTextX = config.pageWidth - textWidth - 100;
  pdf.text(weekText, weekTextX, config.topMargin + 30);
  
  // Header line
  pdf.setLineWidth(2);
  pdf.setDrawColor(...config.colors.black);
  pdf.line(
    config.leftMargin,
    config.topMargin + config.headerHeight,
    config.pageWidth - config.rightMargin,
    config.topMargin + config.headerHeight
  );
}

function drawTimeGrid(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], config: any): void {
  const gridStartY = config.topMargin + config.headerHeight + config.headerLineSpacing;
  
  // Calculate dimensions
  const totalContentWidth = config.pageWidth - config.leftMargin - config.rightMargin;
  const dayColumnWidth = (totalContentWidth - config.timeColumnWidth) / 7;
  
  // Generate time slots
  const timeSlots = [];
  for (let hour = config.startHour; hour <= config.endHour; hour++) {
    timeSlots.push({ hour, minute: 0, label: `${hour.toString().padStart(2, '0')}:00`, isHour: true });
    if (hour < config.endHour || (hour === config.endHour && config.endMinute >= 30)) {
      timeSlots.push({ hour, minute: 30, label: `${hour.toString().padStart(2, '0')}:30`, isHour: false });
    }
  }
  
  const availableHeight = config.pageHeight - gridStartY - config.bottomMargin - 50; // Space for day headers
  const slotHeight = availableHeight / timeSlots.length;
  
  // Draw day headers
  drawDayHeaders(pdf, weekStartDate, gridStartY - 30, config, dayColumnWidth);
  
  // Draw time slots and grid
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + (index * slotHeight);
    
    // Time column
    pdf.setFillColor(...config.colors.white);
    pdf.rect(config.leftMargin, y, config.timeColumnWidth, slotHeight, 'F');
    
    // Time label - bold for hours, normal for half-hours, with 1pt difference
    pdf.setFont('helvetica', slot.isHour ? 'bold' : 'normal');
    pdf.setFontSize(slot.isHour ? 10 : 9); // 1pt smaller for half-hours
    pdf.setTextColor(...config.colors.black);
    pdf.text(slot.label, config.leftMargin + config.timeColumnWidth - 5, y + slotHeight/2 + 3, { align: 'right' });
    
    // Day columns with appropriate backgrounds
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const x = config.leftMargin + config.timeColumnWidth + (dayIndex * dayColumnWidth);
      
      // Background color - darker for hour rows, white for half-hour rows
      if (slot.isHour) {
        pdf.setFillColor(...config.colors.hourRowGray);
      } else {
        pdf.setFillColor(...config.colors.halfHourWhite);
      }
      pdf.rect(x, y, dayColumnWidth, slotHeight, 'F');
      
      // Cell border
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(...config.colors.gridLines);
      pdf.rect(x, y, dayColumnWidth, slotHeight, 'S');
    }
    
    // Horizontal grid line
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(...config.colors.gridLines);
    pdf.line(config.leftMargin, y, config.pageWidth - config.rightMargin, y);
  });
  
  // Vertical separators - bold lines between TIME and days, and between all day columns
  for (let i = 0; i <= 7; i++) {
    const x = config.leftMargin + config.timeColumnWidth + (i * dayColumnWidth);
    pdf.setLineWidth(2);
    pdf.setDrawColor(...config.colors.black);
    pdf.line(x, gridStartY, x, gridStartY + (timeSlots.length * slotHeight));
  }
  
  // Vertical separator between TIME and first day column
  pdf.setLineWidth(2);
  pdf.setDrawColor(...config.colors.black);
  pdf.line(config.leftMargin + config.timeColumnWidth, gridStartY, config.leftMargin + config.timeColumnWidth, gridStartY + (timeSlots.length * slotHeight));
  
  // Draw events
  drawEvents(pdf, weekStartDate, events, config, gridStartY, dayColumnWidth, slotHeight, timeSlots);
}

function drawDayHeaders(pdf: jsPDF, weekStartDate: Date, headerY: number, config: any, dayColumnWidth: number): void {
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const headerHeight = 30;
  
  // Time column header
  pdf.setFillColor(...config.colors.white);
  pdf.rect(config.leftMargin, headerY, config.timeColumnWidth, headerHeight, 'F');
  pdf.setLineWidth(2);
  pdf.setDrawColor(...config.colors.black);
  pdf.rect(config.leftMargin, headerY, config.timeColumnWidth, headerHeight, 'S');
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...config.colors.black);
  pdf.text('TIME', config.leftMargin + config.timeColumnWidth/2, headerY + headerHeight/2 + 4, { align: 'center' });
  
  // Day headers - linear format "MON 7" instead of "MON" above "7"
  for (let i = 0; i < 7; i++) {
    const x = config.leftMargin + config.timeColumnWidth + (i * dayColumnWidth);
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(dayDate.getDate() + i);
    
    // Day header background - white as requested
    pdf.setFillColor(...config.colors.white);
    pdf.rect(x, headerY, dayColumnWidth, headerHeight, 'F');
    pdf.setLineWidth(2);
    pdf.setDrawColor(...config.colors.black);
    pdf.rect(x, headerY, dayColumnWidth, headerHeight, 'S');
    
    // Linear format: "MON 7" instead of separate lines
    const dayText = `${dayNames[i]} ${dayDate.getDate()}`;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...config.colors.black);
    pdf.text(dayText, x + dayColumnWidth/2, headerY + headerHeight/2 + 4, { align: 'center' });
  }
}

function drawEvents(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], config: any, gridStartY: number, dayColumnWidth: number, slotHeight: number, timeSlots: any[]): void {
  events.forEach(event => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    // Calculate day index
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    if (dayIndex < 0 || dayIndex > 6) return;
    
    // Calculate time slot position
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    
    // Find slot index
    const startSlotIndex = timeSlots.findIndex(slot => 
      slot.hour === startHour && slot.minute === (startMinute >= 30 ? 30 : 0)
    );
    const endSlotIndex = timeSlots.findIndex(slot => 
      slot.hour === endHour && slot.minute === (endMinute >= 30 ? 30 : 0)
    );
    
    if (startSlotIndex === -1) return;
    
    // Calculate position
    const x = config.leftMargin + config.timeColumnWidth + (dayIndex * dayColumnWidth) + 1;
    const y = gridStartY + (startSlotIndex * slotHeight) + 1;
    const width = dayColumnWidth - 2;
    const height = Math.max(slotHeight - 2, (endSlotIndex - startSlotIndex) * slotHeight - 2);
    
    // All appointments have white background as requested
    pdf.setFillColor(...config.colors.white);
    pdf.rect(x, y, width, height, 'F');
    
    // Apply styling based on event type
    if (event.title.includes('Appointment')) {
      // SimplePractice - cornflower blue border with thick left edge
      pdf.setDrawColor(...config.colors.simplePracticeBlue);
      pdf.setLineWidth(1);
      pdf.rect(x, y, width, height, 'S');
      
      // Thick left border
      pdf.setLineWidth(3);
      pdf.line(x, y, x, y + height);
      
    } else if (event.source === 'google') {
      // Google Calendar - green dashed border
      pdf.setDrawColor(...config.colors.googleGreen);
      pdf.setLineWidth(1);
      pdf.setLineDashPattern([3, 2], 0);
      pdf.rect(x, y, width, height, 'S');
      pdf.setLineDashPattern([], 0); // Reset dash pattern
      
    } else {
      // Holidays - solid yellow square (fill overrides white background)
      pdf.setFillColor(...config.colors.holidayYellow);
      pdf.rect(x, y, width, height, 'F');
    }
    
    // Event text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...config.colors.black);
    
    // Clean title and add time
    let title = event.title.replace(' Appointment', '');
    const timeText = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    
    // Word wrap for long titles
    const maxWidth = width - 6;
    const words = title.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = pdf.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    
    // Draw text lines
    const maxLines = Math.floor((height - 12) / 9);
    lines.slice(0, maxLines).forEach((line, index) => {
      pdf.text(line, x + 3, y + 10 + (index * 9));
    });
    
    // Time at bottom
    pdf.setFontSize(6);
    pdf.text(timeText, x + 3, y + height - 3);
  });
}