import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { formatDate, formatDateShort } from './dateUtils';
import { generateTimeSlots } from './timeSlots';

// reMarkable Paper Pro optimized dimensions
const REMARKABLE_SPECS = {
  // Physical dimensions in mm
  DISPLAY_WIDTH_MM: 179,
  DISPLAY_HEIGHT_MM: 239,
  // Pixel dimensions
  PIXEL_WIDTH: 2160,
  PIXEL_HEIGHT: 1620,
  PPI: 229,
  // Aspect ratio for landscape mode
  LANDSCAPE_WIDTH_MM: 239,
  LANDSCAPE_HEIGHT_MM: 179,
  // Safe margins for e-ink display (5mm on all sides)
  MARGIN_MM: 5,
  // Optimal content area
  CONTENT_WIDTH_MM: 229, // 239 - 10mm margins
  CONTENT_HEIGHT_MM: 169, // 179 - 10mm margins
  // E-ink optimized colors (high contrast)
  COLORS: {
    BLACK: [0, 0, 0],
    DARK_GRAY: [64, 64, 64],
    MEDIUM_GRAY: [128, 128, 128],
    LIGHT_GRAY: [192, 192, 192],
    WHITE: [255, 255, 255],
    // reMarkable Pro specific colors
    BLUE: [0, 102, 204],
    RED: [204, 51, 51],
    GREEN: [51, 153, 51]
  }
};

// Create PDF with reMarkable Pro optimized settings
const createRemarkablePDF = () => {
  return new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [REMARKABLE_SPECS.LANDSCAPE_WIDTH_MM, REMARKABLE_SPECS.LANDSCAPE_HEIGHT_MM],
    compress: true,
    putOnlyUsedFonts: true
  });
};

// Set e-ink optimized font for high contrast readability
const setEInkFont = (pdf: jsPDF, size: number, style: 'normal' | 'bold' | 'italic' = 'normal') => {
  pdf.setFont('times', style);
  pdf.setFontSize(size);
  // High contrast black for e-ink
  const [r, g, b] = REMARKABLE_SPECS.COLORS.BLACK;
  pdf.setTextColor(r, g, b);
};

// Draw high-contrast border optimized for e-ink
const drawRemarkableBorder = (pdf: jsPDF) => {
  const [r, g, b] = REMARKABLE_SPECS.COLORS.BLACK;
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(1.5); // Optimal line width for e-ink
  pdf.rect(
    REMARKABLE_SPECS.MARGIN_MM,
    REMARKABLE_SPECS.MARGIN_MM,
    REMARKABLE_SPECS.CONTENT_WIDTH_MM,
    REMARKABLE_SPECS.CONTENT_HEIGHT_MM,
    'S'
  );
};

export const exportWeeklyRemarkable = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  // Draw border
  drawRemarkableBorder(pdf);
  
  // Header section - optimized for reMarkable Pro
  const headerHeight = 20;
  const headerY = REMARKABLE_SPECS.MARGIN_MM;
  
  // Header background
  pdf.setFillColor(...REMARKABLE_SPECS.COLORS.WHITE);
  pdf.rect(
    REMARKABLE_SPECS.MARGIN_MM + 1,
    headerY + 1,
    REMARKABLE_SPECS.CONTENT_WIDTH_MM - 2,
    headerHeight - 2,
    'F'
  );
  
  // Header border
  pdf.setDrawColor(...REMARKABLE_SPECS.COLORS.BLACK);
  pdf.setLineWidth(2);
  pdf.line(
    REMARKABLE_SPECS.MARGIN_MM,
    headerY + headerHeight,
    REMARKABLE_SPECS.MARGIN_MM + REMARKABLE_SPECS.CONTENT_WIDTH_MM,
    headerY + headerHeight
  );
  
  // Title - optimized size for reMarkable Pro readability
  setEInkFont(pdf, 16, 'bold');
  pdf.text('Weekly Planner', REMARKABLE_SPECS.LANDSCAPE_WIDTH_MM / 2, headerY + 8, { align: 'center' });
  
  // Week info
  setEInkFont(pdf, 10, 'normal');
  const monthStart = weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const monthEnd = weekEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const weekInfo = `${monthStart}-${monthEnd.split(' ')[1]}, ${monthEnd.split(' ')[2]} • Week ${weekNumber}`;
  pdf.text(weekInfo, REMARKABLE_SPECS.LANDSCAPE_WIDTH_MM / 2, headerY + 16, { align: 'center' });
  
  // Calendar grid - optimized for reMarkable Pro dimensions
  const gridStartY = headerY + headerHeight + 3;
  const gridHeight = REMARKABLE_SPECS.CONTENT_HEIGHT_MM - headerHeight - 10;
  const timeColumnWidth = 25;
  const dayColumnWidth = (REMARKABLE_SPECS.CONTENT_WIDTH_MM - timeColumnWidth) / 7;
  
  // Time column header
  setEInkFont(pdf, 8, 'bold');
  pdf.text('Time', REMARKABLE_SPECS.MARGIN_MM + 2, gridStartY + 8);
  
  // Day headers
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  days.forEach((day, index) => {
    const dayX = REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth + (index * dayColumnWidth);
    
    // Day column background
    if (index % 2 === 0) {
      pdf.setFillColor(...REMARKABLE_SPECS.COLORS.LIGHT_GRAY);
      pdf.rect(dayX, gridStartY, dayColumnWidth, gridHeight, 'F');
    }
    
    // Day header
    setEInkFont(pdf, 7, 'bold');
    pdf.text(day.substring(0, 3), dayX + dayColumnWidth / 2, gridStartY + 6, { align: 'center' });
    
    // Date
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + index);
    setEInkFont(pdf, 10, 'bold');
    pdf.text(
      currentDate.getDate().toString(),
      dayX + dayColumnWidth / 2,
      gridStartY + 12,
      { align: 'center' }
    );
  });
  
  // Grid lines - optimized for e-ink visibility
  pdf.setDrawColor(...REMARKABLE_SPECS.COLORS.MEDIUM_GRAY);
  pdf.setLineWidth(0.5);
  
  // Vertical lines
  for (let i = 0; i <= 7; i++) {
    const x = REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth + (i * dayColumnWidth);
    pdf.line(x, gridStartY, x, gridStartY + gridHeight);
  }
  
  // Time slots and horizontal lines
  const timeSlots = generateTimeSlots();
  const slotHeight = (gridHeight - 15) / timeSlots.length;
  
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + 15 + (index * slotHeight);
    
    // Time label
    if (index % 2 === 0) { // Show every other hour to avoid clutter
      setEInkFont(pdf, 6, 'normal');
      pdf.text(slot.time, REMARKABLE_SPECS.MARGIN_MM + 2, y + 2);
    }
    
    // Horizontal grid line
    pdf.setDrawColor(...REMARKABLE_SPECS.COLORS.LIGHT_GRAY);
    pdf.setLineWidth(0.3);
    pdf.line(
      REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth,
      y,
      REMARKABLE_SPECS.MARGIN_MM + REMARKABLE_SPECS.CONTENT_WIDTH_MM,
      y
    );
  });
  
  // Events - optimized for e-ink display
  events.forEach((event) => {
    const eventDate = new Date(event.startTime);
    const dayIndex = (eventDate.getDay() + 6) % 7; // Convert to Monday = 0
    
    if (dayIndex >= 0 && dayIndex < 7) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const startHour = eventStart.getHours();
      const startMinute = eventStart.getMinutes();
      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60); // minutes
      
      const startSlotIndex = timeSlots.findIndex(slot => 
        slot.hour === startHour && slot.minute === startMinute
      );
      
      if (startSlotIndex >= 0) {
        const eventX = REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth + (dayIndex * dayColumnWidth);
        const eventY = gridStartY + 15 + (startSlotIndex * slotHeight);
        const eventHeight = Math.max((duration / 30) * slotHeight, slotHeight * 0.8);
        const eventWidth = dayColumnWidth - 2;
        
        // Event background - different colors for different sources
        let fillColor = REMARKABLE_SPECS.COLORS.WHITE;
        let borderColor = REMARKABLE_SPECS.COLORS.BLACK;
        
        if (event.source === 'google') {
          fillColor = REMARKABLE_SPECS.COLORS.LIGHT_GRAY;
          borderColor = REMARKABLE_SPECS.COLORS.BLUE;
        } else if (event.source === 'simplepractice') {
          fillColor = REMARKABLE_SPECS.COLORS.LIGHT_GRAY;
          borderColor = REMARKABLE_SPECS.COLORS.GREEN;
        }
        
        // Event rectangle
        pdf.setFillColor(...fillColor);
        pdf.setDrawColor(...borderColor);
        pdf.setLineWidth(1);
        pdf.rect(eventX + 1, eventY, eventWidth, eventHeight, 'FD');
        
        // Event text - optimized for e-ink readability
        setEInkFont(pdf, 6, 'bold');
        const titleLines = pdf.splitTextToSize(event.title, eventWidth - 4);
        pdf.text(titleLines[0] || event.title, eventX + 2, eventY + 4);
        
        // Event time
        setEInkFont(pdf, 5, 'normal');
        const timeStr = `${eventStart.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        })}`;
        pdf.text(timeStr, eventX + 2, eventY + 8);
      }
    }
  });
  
  // Statistics section - reMarkable Pro optimized
  const statsY = gridStartY + gridHeight + 5;
  setEInkFont(pdf, 8, 'bold');
  pdf.text('Weekly Statistics:', REMARKABLE_SPECS.MARGIN_MM + 2, statsY);
  
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });
  
  const totalHours = weekEvents.reduce((sum, event) => {
    return sum + (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
  }, 0);
  
  setEInkFont(pdf, 7, 'normal');
  pdf.text(`Total Events: ${weekEvents.length}`, REMARKABLE_SPECS.MARGIN_MM + 2, statsY + 5);
  pdf.text(`Total Hours: ${totalHours.toFixed(1)}`, REMARKABLE_SPECS.MARGIN_MM + 50, statsY + 5);
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportDailyRemarkable = async (
  selectedDate: Date,
  events: CalendarEvent[],
  dailyNotes: string
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  // Draw border
  drawRemarkableBorder(pdf);
  
  // Header
  const headerHeight = 25;
  const headerY = REMARKABLE_SPECS.MARGIN_MM;
  
  // Header background
  pdf.setFillColor(...REMARKABLE_SPECS.COLORS.WHITE);
  pdf.rect(
    REMARKABLE_SPECS.MARGIN_MM + 1,
    headerY + 1,
    REMARKABLE_SPECS.CONTENT_WIDTH_MM - 2,
    headerHeight - 2,
    'F'
  );
  
  // Header border
  pdf.setDrawColor(...REMARKABLE_SPECS.COLORS.BLACK);
  pdf.setLineWidth(2);
  pdf.line(
    REMARKABLE_SPECS.MARGIN_MM,
    headerY + headerHeight,
    REMARKABLE_SPECS.MARGIN_MM + REMARKABLE_SPECS.CONTENT_WIDTH_MM,
    headerY + headerHeight
  );
  
  // Title
  setEInkFont(pdf, 16, 'bold');
  pdf.text('Daily Planner', REMARKABLE_SPECS.LANDSCAPE_WIDTH_MM / 2, headerY + 8, { align: 'center' });
  
  // Date
  setEInkFont(pdf, 12, 'normal');
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, REMARKABLE_SPECS.LANDSCAPE_WIDTH_MM / 2, headerY + 18, { align: 'center' });
  
  // Content area
  const contentY = headerY + headerHeight + 5;
  const contentHeight = REMARKABLE_SPECS.CONTENT_HEIGHT_MM - headerHeight - 15;
  
  // Time column
  const timeColumnWidth = 30;
  const appointmentColumnWidth = REMARKABLE_SPECS.CONTENT_WIDTH_MM - timeColumnWidth - 10;
  
  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Time grid - 6:00 to 23:30 (reMarkable Pro optimized)
  const startHour = 6;
  const endHour = 23.5;
  const totalHours = endHour - startHour;
  const hourHeight = contentHeight / totalHours;
  
  // Draw time slots
  for (let hour = startHour; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = hour + (minute / 60);
      const y = contentY + ((time - startHour) * hourHeight);
      
      // Time label
      if (minute === 0) {
        setEInkFont(pdf, 8, 'normal');
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        pdf.text(timeStr, REMARKABLE_SPECS.MARGIN_MM + 2, y + 3);
      }
      
      // Grid line
      pdf.setDrawColor(...REMARKABLE_SPECS.COLORS.LIGHT_GRAY);
      pdf.setLineWidth(minute === 0 ? 0.5 : 0.3);
      pdf.line(
        REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth,
        y,
        REMARKABLE_SPECS.MARGIN_MM + REMARKABLE_SPECS.CONTENT_WIDTH_MM,
        y
      );
    }
  }
  
  // Vertical separator
  pdf.setDrawColor(...REMARKABLE_SPECS.COLORS.BLACK);
  pdf.setLineWidth(1);
  pdf.line(
    REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth,
    contentY,
    REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth,
    contentY + contentHeight
  );
  
  // Events
  dayEvents.forEach((event) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const startTime = eventStart.getHours() + (eventStart.getMinutes() / 60);
    const endTime = eventEnd.getHours() + (eventEnd.getMinutes() / 60);
    
    if (startTime >= startHour && startTime <= endHour) {
      const eventY = contentY + ((startTime - startHour) * hourHeight);
      const eventHeight = Math.max((endTime - startTime) * hourHeight, hourHeight * 0.8);
      
      // Event background
      let fillColor = REMARKABLE_SPECS.COLORS.WHITE;
      let borderColor = REMARKABLE_SPECS.COLORS.BLACK;
      
      if (event.source === 'google') {
        fillColor = REMARKABLE_SPECS.COLORS.LIGHT_GRAY;
        borderColor = REMARKABLE_SPECS.COLORS.BLUE;
      } else if (event.source === 'simplepractice') {
        fillColor = REMARKABLE_SPECS.COLORS.LIGHT_GRAY;
        borderColor = REMARKABLE_SPECS.COLORS.GREEN;
      }
      
      // Event rectangle
      pdf.setFillColor(...fillColor);
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(1.5);
      pdf.rect(
        REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth + 2,
        eventY,
        appointmentColumnWidth - 4,
        eventHeight,
        'FD'
      );
      
      // Event content
      setEInkFont(pdf, 9, 'bold');
      const titleLines = pdf.splitTextToSize(event.title, appointmentColumnWidth - 8);
      pdf.text(titleLines[0] || event.title, REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth + 4, eventY + 6);
      
      // Event time
      setEInkFont(pdf, 7, 'normal');
      const timeStr = `${eventStart.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })}-${eventEnd.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })}`;
      pdf.text(timeStr, REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth + 4, eventY + 12);
      
      // Notes if available
      if (event.notes && eventHeight > 20) {
        setEInkFont(pdf, 6, 'italic');
        const notesLines = pdf.splitTextToSize(event.notes, appointmentColumnWidth - 8);
        notesLines.slice(0, 2).forEach((line, index) => {
          pdf.text(line, REMARKABLE_SPECS.MARGIN_MM + timeColumnWidth + 4, eventY + 18 + (index * 4));
        });
      }
    }
  });
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportWeeklyPackageRemarkable = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number,
  dailyNotes: { [date: string]: string }
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  // First page: Weekly overview
  const weeklyPdfData = await exportWeeklyRemarkable(weekStartDate, weekEndDate, events, weekNumber);
  
  // Add daily pages for each day of the week
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + i);
    
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === currentDate.toDateString();
    });
    
    const dateKey = currentDate.toISOString().split('T')[0];
    const notes = dailyNotes[dateKey] || '';
    
    pdf.addPage();
    const dailyPdfData = await exportDailyRemarkable(currentDate, dayEvents, notes);
    
    // Add daily content to current page
    // Note: This is a simplified approach - in production, you'd merge the PDF data properly
    drawRemarkableBorder(pdf);
    
    // Title
    setEInkFont(pdf, 16, 'bold');
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    pdf.text(`${dayName}, ${dateStr}`, REMARKABLE_SPECS.LANDSCAPE_WIDTH_MM / 2, 20, { align: 'center' });
    
    // Simple event list for package
    let yPosition = 35;
    dayEvents.forEach((event) => {
      if (yPosition < REMARKABLE_SPECS.CONTENT_HEIGHT_MM - 10) {
        setEInkFont(pdf, 8, 'normal');
        const eventStart = new Date(event.startTime);
        const timeStr = eventStart.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        pdf.text(`${timeStr} - ${event.title}`, REMARKABLE_SPECS.MARGIN_MM + 5, yPosition);
        yPosition += 6;
      }
    });
  }
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportMonthlyRemarkable = async (
  monthDate: Date,
  events: CalendarEvent[]
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  // Draw border
  drawRemarkableBorder(pdf);
  
  // Header
  const headerHeight = 20;
  const headerY = REMARKABLE_SPECS.MARGIN_MM;
  
  // Title
  setEInkFont(pdf, 16, 'bold');
  const monthStr = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  pdf.text(`Monthly Overview - ${monthStr}`, REMARKABLE_SPECS.LANDSCAPE_WIDTH_MM / 2, headerY + 12, { align: 'center' });
  
  // Calendar grid
  const gridStartY = headerY + headerHeight + 5;
  const gridHeight = REMARKABLE_SPECS.CONTENT_HEIGHT_MM - headerHeight - 10;
  const cellWidth = REMARKABLE_SPECS.CONTENT_WIDTH_MM / 7;
  const cellHeight = gridHeight / 6; // 6 weeks max in a month view
  
  // Day headers
  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  dayHeaders.forEach((day, index) => {
    setEInkFont(pdf, 8, 'bold');
    pdf.text(
      day,
      REMARKABLE_SPECS.MARGIN_MM + (index * cellWidth) + (cellWidth / 2),
      gridStartY + 6,
      { align: 'center' }
    );
  });
  
  // Calendar grid
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7)); // Start from Monday
  
  // Draw calendar cells
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);
      
      const cellX = REMARKABLE_SPECS.MARGIN_MM + (day * cellWidth);
      const cellY = gridStartY + 10 + (week * cellHeight);
      
      // Cell border
      pdf.setDrawColor(...REMARKABLE_SPECS.COLORS.MEDIUM_GRAY);
      pdf.setLineWidth(0.5);
      pdf.rect(cellX, cellY, cellWidth, cellHeight, 'S');
      
      // Date number
      setEInkFont(pdf, 7, currentDate.getMonth() === monthDate.getMonth() ? 'bold' : 'normal');
      pdf.setTextColor(
        ...(currentDate.getMonth() === monthDate.getMonth() 
          ? REMARKABLE_SPECS.COLORS.BLACK 
          : REMARKABLE_SPECS.COLORS.MEDIUM_GRAY)
      );
      pdf.text(currentDate.getDate().toString(), cellX + 2, cellY + 6);
      
      // Event indicators
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDate.toDateString();
      });
      
      if (dayEvents.length > 0) {
        pdf.setFillColor(...REMARKABLE_SPECS.COLORS.BLACK);
        pdf.circle(cellX + cellWidth - 4, cellY + 4, 1, 'F');
        
        // Event count
        setEInkFont(pdf, 5, 'normal');
        pdf.setTextColor(...REMARKABLE_SPECS.COLORS.BLACK);
        pdf.text(dayEvents.length.toString(), cellX + cellWidth - 8, cellY + 6);
      }
    }
  }
  
  return pdf.output('datauristring').split(',')[1];
};

export const generateRemarkableFilename = (
  type: 'weekly' | 'daily' | 'weekly-package' | 'monthly',
  date: Date
): string => {
  const dateStr = date.toISOString().split('T')[0];
  switch (type) {
    case 'weekly':
      return `remarkable-weekly-${dateStr}.pdf`;
    case 'daily':
      return `remarkable-daily-${dateStr}.pdf`;
    case 'weekly-package':
      return `remarkable-weekly-package-${dateStr}.pdf`;
    case 'monthly':
      return `remarkable-monthly-${dateStr}.pdf`;
    default:
      return `remarkable-planner-${dateStr}.pdf`;
  }
};