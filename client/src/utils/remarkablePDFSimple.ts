import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { generateTimeSlots } from './timeSlots';

// reMarkable Paper Pro optimized dimensions
const REMARKABLE_CONFIG = {
  // Landscape dimensions for optimal viewing
  width: 239, // mm
  height: 179, // mm
  margin: 5,
  contentWidth: 229,
  contentHeight: 169
};

const createRemarkablePDF = () => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [REMARKABLE_CONFIG.width, REMARKABLE_CONFIG.height],
    compress: true
  });
  
  // Set font to helvetica to prevent encoding issues
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
  
  // Set font for e-ink readability
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.5);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.contentHeight, 'S');
  
  // Header
  const headerHeight = 25;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Weekly Planner', REMARKABLE_CONFIG.margin + 5, REMARKABLE_CONFIG.margin + 8);
  
  const monthStart = weekStartDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  const monthEnd = weekEndDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  const weekInfo = `Week ${weekNumber} — ${monthStart} - ${monthEnd}`;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(weekInfo, REMARKABLE_CONFIG.width - REMARKABLE_CONFIG.margin - 5, REMARKABLE_CONFIG.margin + 8, { align: 'right' });
  
  // Header line
  pdf.setLineWidth(1);
  pdf.line(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin + 12, 
           REMARKABLE_CONFIG.width - REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin + 12);
  
  // Calendar grid optimized for reMarkable Pro
  const gridStartY = REMARKABLE_CONFIG.margin + headerHeight + 3;
  const gridHeight = REMARKABLE_CONFIG.contentHeight - headerHeight - 10;
  const timeColumnWidth = 25;
  const dayColumnWidth = (REMARKABLE_CONFIG.contentWidth - timeColumnWidth) / 7;
  
  // Time column header
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Time', REMARKABLE_CONFIG.margin + timeColumnWidth / 2, gridStartY + 8, { align: 'center' });
  
  // Day headers
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  days.forEach((day, index) => {
    const dayX = REMARKABLE_CONFIG.margin + timeColumnWidth + (index * dayColumnWidth);
    
    // Alternating background for e-ink clarity
    if (index % 2 === 0) {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(dayX, gridStartY, dayColumnWidth, gridHeight, 'F');
    }
    
    // Day with full date
    const currentDate = new Date(weekStartDate);
    currentDate.setDate(weekStartDate.getDate() + index);
    const dayHeader = `${day} ${currentDate.getMonth() + 1}/${currentDate.getDate()}`;
    pdf.text(dayHeader, dayX + dayColumnWidth / 2, gridStartY + 8, { align: 'center' });
  });
  
  // Header border line under day headers
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(REMARKABLE_CONFIG.margin, gridStartY + 12, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, gridStartY + 12);
  
  // Grid lines
  pdf.setDrawColor(128, 128, 128);
  pdf.setLineWidth(0.5);
  
  // Vertical lines
  for (let i = 0; i <= 7; i++) {
    const x = REMARKABLE_CONFIG.margin + timeColumnWidth + (i * dayColumnWidth);
    pdf.line(x, gridStartY, x, gridStartY + gridHeight);
  }
  
  // Time slots with detailed labels
  const timeSlots = generateTimeSlots();
  const slotHeight = Math.max(8, (gridHeight - 15) / timeSlots.length); // Smaller slots for more detail
  
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + 15 + (index * slotHeight);
    
    // Time labels for every hour and 30-minute marks
    if (index % 2 === 0) {
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text(slot.time, REMARKABLE_CONFIG.margin + 2, y + 3);
    }
    
    // Horizontal grid lines
    if (index % 2 === 0) {
      // Major lines for hours
      pdf.setDrawColor(128, 128, 128);
      pdf.setLineWidth(0.5);
    } else {
      // Minor lines for 30-minute marks
      pdf.setDrawColor(192, 192, 192);
      pdf.setLineWidth(0.3);
    }
    pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, y, 
             REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, y);
  });
  
  // Events - optimized for e-ink display with conflict resolution
  const drawnEvents: { [key: string]: Array<{ startSlot: number, endSlot: number, position: number }> } = {};
  
  events.forEach((event) => {
    const eventDate = new Date(event.startTime);
    const dayIndex = (eventDate.getDay() + 6) % 7; // Monday = 0
    
    if (dayIndex >= 0 && dayIndex < 7) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const startHour = eventStart.getHours();
      const startMinute = eventStart.getMinutes();
      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
      
      const startSlotIndex = timeSlots.findIndex(slot => 
        slot.hour === startHour && slot.minute === startMinute
      );
      
      if (startSlotIndex >= 0) {
        const endSlotIndex = startSlotIndex + Math.ceil(duration / 30);
        const dayKey = `day-${dayIndex}`;
        
        // Initialize day tracking if not exists
        if (!drawnEvents[dayKey]) {
          drawnEvents[dayKey] = [];
        }
        
        // Find available horizontal position
        let horizontalPosition = 0;
        const maxPositions = 2; // Maximum 2 events side by side
        
        // Check for conflicts with existing events
        for (let pos = 0; pos < maxPositions; pos++) {
          const hasConflict = drawnEvents[dayKey].some(existing => 
            existing.position === pos && 
            existing.startSlot < endSlotIndex && 
            existing.endSlot > startSlotIndex
          );
          
          if (!hasConflict) {
            horizontalPosition = pos;
            break;
          }
        }
        
        // Record this event's position
        drawnEvents[dayKey].push({
          startSlot: startSlotIndex,
          endSlot: endSlotIndex,
          position: horizontalPosition
        });
        
        // Calculate event dimensions with better spacing
        const baseEventWidth = dayColumnWidth - 3; // More margin
        const eventWidth = horizontalPosition > 0 ? (baseEventWidth / 2) - 1 : baseEventWidth;
        const eventX = REMARKABLE_CONFIG.margin + timeColumnWidth + (dayIndex * dayColumnWidth) + 1 + 
                     (horizontalPosition * (eventWidth + 1));
        const eventY = gridStartY + 15 + (startSlotIndex * slotHeight) + 1;
        const eventHeight = Math.max((duration / 30) * slotHeight - 2, slotHeight * 0.6); // Better proportions
        
        // Event styling based on source
        if (event.source === 'google') {
          pdf.setFillColor(220, 220, 220);
          pdf.setDrawColor(0, 102, 204);
        } else if (event.source === 'simplepractice') {
          pdf.setFillColor(230, 230, 230);
          pdf.setDrawColor(51, 153, 51);
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(0, 0, 0);
        }
        
        pdf.setLineWidth(1);
        pdf.rect(eventX + 1, eventY, eventWidth, eventHeight, 'FD');
        
        // Event text - optimized for e-ink
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        
        // Clean appointment text
        let appointmentTitle = event.title
          .replace(/ Appointment$/, '')
          .toUpperCase()
          .trim();
        
        // Adjust title length based on event width
        const maxChars = horizontalPosition > 0 ? 10 : 18; // Shorter for narrow events
        if (appointmentTitle.length > maxChars) {
          appointmentTitle = appointmentTitle.substring(0, maxChars - 3) + '...';
        }
        
        // Position title at top of event block
        pdf.text(appointmentTitle, eventX + 1, eventY + 6);
        
        // Event time range at bottom
        pdf.setFontSize(4);
        pdf.setFont('helvetica', 'normal');
        const startTimeStr = eventStart.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        const endTimeStr = eventEnd.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        });
        const timeRangeStr = `${startTimeStr}-${endTimeStr}`;
        pdf.text(timeRangeStr, eventX + 1, eventY + eventHeight - 1);
      }
    }
  });
  
  // Clean professional layout - no statistics section
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportDailyRemarkable = async (
  selectedDate: Date,
  events: CalendarEvent[],
  dailyNotes: string
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.5);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.contentHeight, 'S');
  
  // Header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Daily Planner - reMarkable Pro', 
           REMARKABLE_CONFIG.width / 2, REMARKABLE_CONFIG.margin + 8, { align: 'center' });
  
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(dateStr, REMARKABLE_CONFIG.width / 2, REMARKABLE_CONFIG.margin + 18, { align: 'center' });
  
  // Content area
  const contentY = REMARKABLE_CONFIG.margin + 25;
  const contentHeight = REMARKABLE_CONFIG.contentHeight - 30;
  const timeColumnWidth = 30;
  
  // Filter and sort events for the day
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Time grid from 6:00 to 23:30
  const startHour = 6;
  const endHour = 23.5;
  const totalHours = endHour - startHour;
  const hourHeight = contentHeight / totalHours;
  
  // Draw time grid
  for (let hour = startHour; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = hour + (minute / 60);
      const y = contentY + ((time - startHour) * hourHeight);
      
      if (minute === 0) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        pdf.text(timeStr, REMARKABLE_CONFIG.margin + 2, y + 3);
      }
      
      pdf.setDrawColor(192, 192, 192);
      pdf.setLineWidth(minute === 0 ? 0.5 : 0.3);
      pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, y,
               REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, y);
    }
  }
  
  // Vertical separator
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, contentY,
           REMARKABLE_CONFIG.margin + timeColumnWidth, contentY + contentHeight);
  
  // Events
  dayEvents.forEach((event) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    const startTime = eventStart.getHours() + (eventStart.getMinutes() / 60);
    const endTime = eventEnd.getHours() + (eventEnd.getMinutes() / 60);
    
    if (startTime >= startHour && startTime <= endHour) {
      const eventY = contentY + ((startTime - startHour) * hourHeight);
      const eventHeight = Math.max((endTime - startTime) * hourHeight, hourHeight * 0.8);
      const appointmentWidth = REMARKABLE_CONFIG.contentWidth - timeColumnWidth - 6;
      
      // Event styling
      if (event.source === 'google') {
        pdf.setFillColor(220, 220, 220);
        pdf.setDrawColor(0, 102, 204);
      } else if (event.source === 'simplepractice') {
        pdf.setFillColor(230, 230, 230);
        pdf.setDrawColor(51, 153, 51);
      } else {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(0, 0, 0);
      }
      
      pdf.setLineWidth(1.5);
      pdf.rect(REMARKABLE_CONFIG.margin + timeColumnWidth + 2, eventY,
               appointmentWidth, eventHeight, 'FD');
      
      // Event text
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(event.title, appointmentWidth - 4);
      pdf.text(titleLines[0] || event.title, 
               REMARKABLE_CONFIG.margin + timeColumnWidth + 4, eventY + 6);
      
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      const timeStr = `${eventStart.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: false 
      })}-${eventEnd.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', hour12: false 
      })}`;
      pdf.text(timeStr, REMARKABLE_CONFIG.margin + timeColumnWidth + 4, eventY + 12);
      
      // Notes if space allows
      if (event.notes && eventHeight > 20) {
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'italic');
        const notesLines = pdf.splitTextToSize(event.notes, appointmentWidth - 4);
        notesLines.slice(0, 2).forEach((line: string, index: number) => {
          pdf.text(line, REMARKABLE_CONFIG.margin + timeColumnWidth + 4, eventY + 18 + (index * 4));
        });
      }
    }
  });
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportMonthlyRemarkable = async (
  monthDate: Date,
  events: CalendarEvent[]
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  // Border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1.5);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.contentHeight, 'S');
  
  // Header
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const monthStr = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  pdf.text(`Monthly Overview - ${monthStr}`, 
           REMARKABLE_CONFIG.width / 2, REMARKABLE_CONFIG.margin + 12, { align: 'center' });
  
  // Calendar grid
  const gridStartY = REMARKABLE_CONFIG.margin + 20;
  const gridHeight = REMARKABLE_CONFIG.contentHeight - 25;
  const cellWidth = REMARKABLE_CONFIG.contentWidth / 7;
  const cellHeight = gridHeight / 6;
  
  // Day headers
  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  
  dayHeaders.forEach((day, index) => {
    pdf.text(day, REMARKABLE_CONFIG.margin + (index * cellWidth) + (cellWidth / 2),
             gridStartY + 6, { align: 'center' });
  });
  
  // Calendar grid
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7));
  
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);
      
      const cellX = REMARKABLE_CONFIG.margin + (day * cellWidth);
      const cellY = gridStartY + 10 + (week * cellHeight);
      
      // Cell border
      pdf.setDrawColor(128, 128, 128);
      pdf.setLineWidth(0.5);
      pdf.rect(cellX, cellY, cellWidth, cellHeight, 'S');
      
      // Date number
      pdf.setFontSize(7);
      pdf.setFont('helvetica', currentDate.getMonth() === monthDate.getMonth() ? 'bold' : 'normal');
      pdf.setTextColor(currentDate.getMonth() === monthDate.getMonth() ? 0 : 128, 128, 128);
      pdf.text(currentDate.getDate().toString(), cellX + 2, cellY + 6);
      
      // Event count indicator
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDate.toDateString();
      });
      
      if (dayEvents.length > 0) {
        pdf.setFillColor(0, 0, 0);
        pdf.circle(cellX + cellWidth - 4, cellY + 4, 1, 'F');
        
        pdf.setFontSize(5);
        pdf.setTextColor(0, 0, 0);
        pdf.text(dayEvents.length.toString(), cellX + cellWidth - 8, cellY + 6);
      }
    }
  }
  
  return pdf.output('datauristring').split(',')[1];
};

export const generateRemarkableFilename = (
  type: 'weekly' | 'daily' | 'monthly',
  date: Date
): string => {
  const dateStr = date.toISOString().split('T')[0];
  return `remarkable-${type}-${dateStr}.pdf`;
};