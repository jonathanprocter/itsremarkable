import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { generateTimeSlots } from './timeSlots';

// reMarkable Pro configuration
const REMARKABLE_CONFIG = {
  width: 279, // A4 width in mm (landscape) 
  height: 216, // A4 height in mm (landscape)
  margin: 10,
  contentWidth: 259,
  contentHeight: 196
};

const createRemarkablePDF = () => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });
  
  // Set font to helvetica for better compatibility
  pdf.setFont('helvetica', 'normal');
  
  return pdf;
};

export const exportWeeklyRemarkable = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
  weekNumber: number
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  // Set font for readability
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Page border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.contentHeight, 'S');
  
  // Header
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Weekly Planner', REMARKABLE_CONFIG.margin + 5, REMARKABLE_CONFIG.margin + 10);
  
  // Week range in header
  const weekRangeText = `Week ${weekNumber} — ${weekStartDate.getMonth() + 1}/${weekStartDate.getDate()} - ${weekEndDate.getMonth() + 1}/${weekEndDate.getDate()}`;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(weekRangeText, REMARKABLE_CONFIG.width - REMARKABLE_CONFIG.margin - 5, REMARKABLE_CONFIG.margin + 10, { align: 'right' });
  
  // Header separator line
  const headerHeight = 20;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin + headerHeight, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.margin + headerHeight);
  
  // Professional grid structure matching template
  const gridStartY = REMARKABLE_CONFIG.margin + headerHeight + 5;
  const gridHeight = REMARKABLE_CONFIG.contentHeight - headerHeight - 10;
  const timeColumnWidth = 25; // Narrower time column
  const dayColumnWidth = (REMARKABLE_CONFIG.contentWidth - timeColumnWidth) / 7;
  
  // Create week days array
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + i);
    return date;
  });
  
  // Draw main grid structure
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  
  // Outer grid border
  pdf.rect(REMARKABLE_CONFIG.margin, gridStartY, REMARKABLE_CONFIG.contentWidth, gridHeight, 'S');
  
  // Header row background
  pdf.setFillColor(240, 240, 240);
  pdf.rect(REMARKABLE_CONFIG.margin, gridStartY, REMARKABLE_CONFIG.contentWidth, 25, 'F');
  
  // Time column header
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('Time', REMARKABLE_CONFIG.margin + timeColumnWidth / 2, gridStartY + 15, { align: 'center' });
  
  // Day headers with proper formatting
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  days.forEach((day, index) => {
    const dayX = REMARKABLE_CONFIG.margin + timeColumnWidth + (index * dayColumnWidth);
    const dayDate = weekDays[index];
    
    // Day name
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(day, dayX + dayColumnWidth / 2, gridStartY + 8, { align: 'center' });
    
    // Date
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${dayDate.getMonth() + 1}/${dayDate.getDate()}`, 
             dayX + dayColumnWidth / 2, gridStartY + 18, { align: 'center' });
  });
  
  // Vertical dividers
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  
  // Time column divider
  pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, gridStartY, 
           REMARKABLE_CONFIG.margin + timeColumnWidth, gridStartY + gridHeight);
  
  // Day dividers
  for (let i = 1; i < 7; i++) {
    const x = REMARKABLE_CONFIG.margin + timeColumnWidth + (i * dayColumnWidth);
    pdf.line(x, gridStartY, x, gridStartY + gridHeight);
  }
  
  // Header separator line
  pdf.line(REMARKABLE_CONFIG.margin, gridStartY + 25, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, gridStartY + 25);
  
  // Time rows - major hours only for cleaner look
  const majorHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const rowHeight = (gridHeight - 25) / majorHours.length;
  
  majorHours.forEach((hour, index) => {
    const y = gridStartY + 25 + (index * rowHeight);
    
    // Time label
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const timeStr = hour < 10 ? `0${hour}:00` : `${hour}:00`;
    pdf.text(timeStr, REMARKABLE_CONFIG.margin + 2, y + rowHeight / 2 + 2);
    
    // Horizontal grid line
    if (index > 0) {
      pdf.setDrawColor(180, 180, 180);
      pdf.setLineWidth(0.3);
      pdf.line(REMARKABLE_CONFIG.margin, y, 
               REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, y);
    }
  });
  
  // Events positioned in new grid structure
  const drawnEvents: { [key: string]: Array<{ startHour: number, endHour: number, column: number }> } = {};
  
  events.forEach((event) => {
    const eventDate = new Date(event.startTime);
    const dayIndex = (eventDate.getDay() + 6) % 7; // Monday = 0
    
    if (dayIndex >= 0 && dayIndex < 7) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const startHour = eventStart.getHours();
      const endHour = eventEnd.getHours();
      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60); // hours
      
      // Find the row index for this hour
      const hourIndex = majorHours.indexOf(startHour);
      
      if (hourIndex >= 0) {
        const dayKey = `day-${dayIndex}`;
        
        if (!drawnEvents[dayKey]) {
          drawnEvents[dayKey] = [];
        }
        
        // Find available column (max 3 events side by side)
        let column = 0;
        const maxColumns = 3;
        
        for (let col = 0; col < maxColumns; col++) {
          const hasConflict = drawnEvents[dayKey].some(existing => 
            existing.column === col && 
            existing.startHour < endHour && 
            existing.endHour > startHour
          );
          
          if (!hasConflict) {
            column = col;
            break;
          }
        }
        
        drawnEvents[dayKey].push({
          startHour: startHour,
          endHour: endHour,
          column: column
        });
        
        // Calculate event position and size
        const baseEventWidth = dayColumnWidth - 4; // More margin
        const eventWidth = maxColumns > 1 ? (baseEventWidth / maxColumns) - 1 : baseEventWidth;
        const eventX = REMARKABLE_CONFIG.margin + timeColumnWidth + (dayIndex * dayColumnWidth) + 2 + 
                     (column * (eventWidth + 1));
        const eventY = gridStartY + 25 + (hourIndex * rowHeight) + 2;
        const eventHeight = Math.max(duration * rowHeight - 4, rowHeight * 0.7);
        
        // Event background and border based on source
        if (event.source === 'google') {
          pdf.setFillColor(230, 230, 230);
          pdf.setDrawColor(100, 100, 100);
        } else if (event.source === 'simplepractice') {
          pdf.setFillColor(245, 245, 245);
          pdf.setDrawColor(100, 149, 237); // Cornflower blue
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(80, 80, 80);
        }
        
        pdf.setLineWidth(1);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'FD');
        
        // Event text with proper sizing
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        
        // Clean and format title
        let title = event.title
          .replace(/ Appointment$/, '')
          .toUpperCase()
          .trim();
        
        // Adjust length based on column width
        const maxChars = column > 1 ? 8 : (column > 0 ? 12 : 16);
        if (title.length > maxChars) {
          title = title.substring(0, maxChars - 3) + '...';
        }
        
        // Position title
        pdf.text(title, eventX + 2, eventY + 5);
        
        // Time range
        pdf.setFontSize(4);
        pdf.setFont('helvetica', 'normal');
        const startTime = eventStart.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        const endTime = eventEnd.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        const timeRange = `${startTime}-${endTime}`;
        pdf.text(timeRange, eventX + 2, eventY + eventHeight - 2);
      }
    }
  });
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportDailyRemarkable = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  // Set font for readability
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Page border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.contentHeight, 'S');
  
  // Header
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Daily Planner', REMARKABLE_CONFIG.margin + 5, REMARKABLE_CONFIG.margin + 10);
  
  // Date in header
  const dateText = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(dateText, REMARKABLE_CONFIG.width - REMARKABLE_CONFIG.margin - 5, REMARKABLE_CONFIG.margin + 10, { align: 'right' });
  
  // Header separator
  const headerHeight = 20;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin + headerHeight, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.margin + headerHeight);
  
  // Grid setup
  const gridStartY = REMARKABLE_CONFIG.margin + headerHeight + 5;
  const gridHeight = REMARKABLE_CONFIG.contentHeight - headerHeight - 10;
  const timeColumnWidth = 30;
  const appointmentColumnWidth = REMARKABLE_CONFIG.contentWidth - timeColumnWidth;
  
  // Time column header
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Time', REMARKABLE_CONFIG.margin + timeColumnWidth / 2, gridStartY + 8, { align: 'center' });
  
  // Appointments column header
  pdf.text('Appointments', REMARKABLE_CONFIG.margin + timeColumnWidth + appointmentColumnWidth / 2, gridStartY + 8, { align: 'center' });
  
  // Header border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(REMARKABLE_CONFIG.margin, gridStartY + 12, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, gridStartY + 12);
  
  // Time column separator
  pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, gridStartY, 
           REMARKABLE_CONFIG.margin + timeColumnWidth, gridStartY + gridHeight);
  
  // Time slots
  const timeSlots = generateTimeSlots();
  const slotHeight = Math.max(6, (gridHeight - 15) / timeSlots.length);
  
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + 15 + (index * slotHeight);
    
    // Time labels
    if (index % 2 === 0) {
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(slot.time, REMARKABLE_CONFIG.margin + 2, y + 4);
    }
    
    // Horizontal grid lines
    pdf.setDrawColor(index % 2 === 0 ? 150 : 200, index % 2 === 0 ? 150 : 200, index % 2 === 0 ? 150 : 200);
    pdf.setLineWidth(0.2);
    pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, y, 
             REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, y);
  });
  
  // Filter events for this day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  // Draw events
  dayEvents.forEach((event) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    
    const startSlotIndex = timeSlots.findIndex(slot => 
      slot.hour === startHour && slot.minute === startMinute
    );
    
    if (startSlotIndex >= 0) {
      const eventX = REMARKABLE_CONFIG.margin + timeColumnWidth + 2;
      const eventY = gridStartY + 15 + (startSlotIndex * slotHeight);
      const eventWidth = appointmentColumnWidth - 4;
      const eventHeight = Math.max((duration / 30) * slotHeight - 1, slotHeight * 0.8);
      
      // Event background
      if (event.source === 'simplepractice') {
        pdf.setFillColor(245, 245, 245);
        pdf.setDrawColor(100, 149, 237);
      } else {
        pdf.setFillColor(250, 250, 250);
        pdf.setDrawColor(80, 80, 80);
      }
      
      pdf.setLineWidth(0.5);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'FD');
      
      // Event text with improved readability
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      
      let title = event.title.replace(/ Appointment$/, '').toUpperCase().trim();
      
      // Better text wrapping for daily view
      if (title.length > 25) {
        title = title.substring(0, 22) + '...';
      }
      
      pdf.text(title, eventX + 3, eventY + 6);
      
      // Time range with better visibility
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      const timeRange = `${eventStart.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })}-${eventEnd.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      })}`;
      pdf.text(timeRange, eventX + 3, eventY + eventHeight - 3);
    }
  });
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportMonthlyRemarkable = async (
  monthDate: Date,
  events: CalendarEvent[]
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  // Set font for readability
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Page border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.contentHeight, 'S');
  
  // Header
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Monthly Planner', REMARKABLE_CONFIG.margin + 5, REMARKABLE_CONFIG.margin + 10);
  
  // Month and year in header
  const monthText = monthDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(monthText, REMARKABLE_CONFIG.width - REMARKABLE_CONFIG.margin - 5, REMARKABLE_CONFIG.margin + 10, { align: 'right' });
  
  // Simple monthly calendar placeholder
  const headerHeight = 20;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin + headerHeight, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.margin + headerHeight);
  
  // Monthly summary text
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const monthlyEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.getMonth() === monthDate.getMonth() && 
           eventDate.getFullYear() === monthDate.getFullYear();
  });
  
  pdf.text(`Total events this month: ${monthlyEvents.length}`, 
           REMARKABLE_CONFIG.margin + 5, REMARKABLE_CONFIG.margin + 40);
  
  return pdf.output('datauristring').split(',')[1];
};

export const generateRemarkableFilename = (
  type: 'weekly' | 'daily' | 'monthly',
  date: Date
): string => {
  const formattedDate = date.toISOString().split('T')[0];
  return `remarkable-${type}-planner-${formattedDate}`;
};