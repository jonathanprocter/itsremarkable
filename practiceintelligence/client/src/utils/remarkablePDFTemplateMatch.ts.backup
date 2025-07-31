import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// reMarkable Pro configuration matching your HTML template
const REMARKABLE_CONFIG = {
  width: 279, // A4 width in mm (landscape) 
  height: 216, // A4 height in mm (landscape)
  margin: 8,
  contentWidth: 263,
  contentHeight: 200
};

const createRemarkablePDF = () => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });
  
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
  
  // Main container border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.contentHeight, 'S');
  
  // Header section
  const headerHeight = 25;
  pdf.setFillColor(255, 255, 255);
  pdf.rect(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin, 
           REMARKABLE_CONFIG.contentWidth, headerHeight, 'F');
  
  // Header border
  pdf.setLineWidth(3);
  pdf.line(REMARKABLE_CONFIG.margin, REMARKABLE_CONFIG.margin + headerHeight, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, REMARKABLE_CONFIG.margin + headerHeight);
  
  // Header text
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY PLANNER', REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth / 2, 
           REMARKABLE_CONFIG.margin + 12, { align: 'center' });
  
  // Week info
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  const weekText = `${weekStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}, ${weekStartDate.getFullYear()} • Week ${weekNumber}`;
  pdf.text(weekText, REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth / 2, 
           REMARKABLE_CONFIG.margin + 20, { align: 'center' });
  
  // Stats section
  const statsHeight = 20;
  const statsY = REMARKABLE_CONFIG.margin + headerHeight;
  pdf.setFillColor(248, 248, 248);
  pdf.rect(REMARKABLE_CONFIG.margin, statsY, REMARKABLE_CONFIG.contentWidth, statsHeight, 'F');
  
  // Stats border
  pdf.setLineWidth(2);
  pdf.line(REMARKABLE_CONFIG.margin, statsY + statsHeight, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, statsY + statsHeight);
  
  // Calculate real statistics
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });
  
  const totalAppointments = weekEvents.length;
  const totalHours = weekEvents.reduce((sum, event) => {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const dailyAverage = totalHours / 7;
  const availableHours = (7 * 16) - totalHours; // 16 working hours per day
  
  // Stats content
  const statWidth = REMARKABLE_CONFIG.contentWidth / 4;
  const stats = [
    { value: totalAppointments.toString(), label: 'Total Appointments' },
    { value: `${totalHours.toFixed(1)}h`, label: 'Scheduled Time' },
    { value: `${dailyAverage.toFixed(1)}h`, label: 'Daily Average' },
    { value: `${availableHours.toFixed(1)}h`, label: 'Available Time' }
  ];
  
  stats.forEach((stat, index) => {
    const x = REMARKABLE_CONFIG.margin + (index * statWidth) + statWidth / 2;
    
    // Stat number
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(stat.value, x, statsY + 8, { align: 'center' });
    
    // Stat label
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x, statsY + 15, { align: 'center' });
    
    // Vertical divider
    if (index < 3) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.line(REMARKABLE_CONFIG.margin + ((index + 1) * statWidth), statsY, 
               REMARKABLE_CONFIG.margin + ((index + 1) * statWidth), statsY + statsHeight);
    }
  });
  
  // Legend section
  const legendHeight = 15;
  const legendY = statsY + statsHeight;
  pdf.setFillColor(248, 248, 248);
  pdf.rect(REMARKABLE_CONFIG.margin, legendY, REMARKABLE_CONFIG.contentWidth, legendHeight, 'F');
  
  // Legend border
  pdf.setLineWidth(2);
  pdf.line(REMARKABLE_CONFIG.margin, legendY + legendHeight, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, legendY + legendHeight);
  
  // Legend items
  const legendX = REMARKABLE_CONFIG.margin + 15;
  
  // SimplePractice legend
  pdf.setFillColor(232, 240, 255);
  pdf.setDrawColor(100, 149, 237);
  pdf.setLineWidth(1);
  pdf.rect(legendX, legendY + 5, 8, 6, 'FD');
  pdf.setLineWidth(3);
  pdf.line(legendX, legendY + 5, legendX, legendY + 11);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('SimplePractice', legendX + 12, legendY + 9);
  
  // Google Calendar legend
  const googleX = legendX + 80;
  pdf.setFillColor(240, 240, 240);
  pdf.setDrawColor(102, 102, 102);
  pdf.setLineWidth(1);
  pdf.setLineDashPattern([2, 2]);
  pdf.rect(googleX, legendY + 5, 8, 6, 'FD');
  pdf.setLineDashPattern([]);
  
  pdf.text('Google Calendar', googleX + 12, legendY + 9);
  
  // Calendar grid - reMarkable Pro optimized with hourly blocks
  const gridY = legendY + legendHeight;
  const gridHeight = REMARKABLE_CONFIG.contentHeight - (gridY - REMARKABLE_CONFIG.margin);
  const timeColumnWidth = 25; // Wider for better proportions
  const dayColumnWidth = (REMARKABLE_CONFIG.contentWidth - timeColumnWidth) / 7;
  
  // Grid headers - larger for reMarkable Pro
  const headerRowHeight = 25;
  pdf.setFillColor(240, 240, 240);
  pdf.rect(REMARKABLE_CONFIG.margin, gridY, REMARKABLE_CONFIG.contentWidth, headerRowHeight, 'F');
  
  // Header border - thicker for e-ink visibility
  pdf.setLineWidth(3);
  pdf.line(REMARKABLE_CONFIG.margin, gridY + headerRowHeight, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, gridY + headerRowHeight);
  
  // Time header
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TIME', REMARKABLE_CONFIG.margin + timeColumnWidth / 2, gridY + 15, { align: 'center' });
  
  // Day headers with enhanced formatting
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStartDate);
    date.setDate(weekStartDate.getDate() + i);
    return date;
  });
  
  days.forEach((day, index) => {
    const dayX = REMARKABLE_CONFIG.margin + timeColumnWidth + (index * dayColumnWidth);
    const dayDate = weekDays[index];
    
    // Day column border
    if (index < 6) {
      pdf.setLineWidth(2);
      pdf.setDrawColor(0, 0, 0);
      pdf.line(dayX + dayColumnWidth, gridY, dayX + dayColumnWidth, gridY + gridHeight);
    }
    
    // Day name
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(day, dayX + dayColumnWidth / 2, gridY + 10, { align: 'center' });
    
    // Day number
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayDate.getDate().toString(), dayX + dayColumnWidth / 2, gridY + 20, { align: 'center' });
  });
  
  // Grid structure - reMarkable Pro hourly blocks
  const gridContentY = gridY + headerRowHeight;
  const gridContentHeight = gridHeight - headerRowHeight;
  
  // Hourly time slots (6:00 to 21:00) - 16 hours total
  const timeSlots: string[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  
  const slotHeight = gridContentHeight / timeSlots.length; // 60px equivalent for each hour
  
  // Draw grid lines and time labels
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  
  // Header bottom border
  pdf.line(REMARKABLE_CONFIG.margin, gridContentY, 
           REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, gridContentY);
  
  // Time column border
  pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, gridY, 
           REMARKABLE_CONFIG.margin + timeColumnWidth, gridY + gridHeight);
  
  // Day column borders
  for (let i = 1; i < 7; i++) {
    pdf.setLineWidth(1);
    pdf.setDrawColor(221, 221, 221);
    const x = REMARKABLE_CONFIG.margin + timeColumnWidth + (i * dayColumnWidth);
    pdf.line(x, gridY, x, gridY + gridHeight);
  }
  
  // Time column border - thick for e-ink visibility
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(3);
  pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, gridY, 
           REMARKABLE_CONFIG.margin + timeColumnWidth, gridY + gridHeight);
  
  // Time slots and horizontal lines - reMarkable Pro hourly blocks
  timeSlots.forEach((time, index) => {
    const y = gridContentY + (index * slotHeight);
    
    // Time label - larger for reMarkable Pro
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(time, REMARKABLE_CONFIG.margin + timeColumnWidth / 2, y + slotHeight / 2 + 3, { align: 'center' });
    
    // Horizontal grid line - thick for clear hour separation
    if (index > 0) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(2);
      pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, y, 
               REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, y);
    }
    
    // Add subtle writing grid lines within each cell
    if (slotHeight > 15) {
      pdf.setDrawColor(238, 238, 238);
      pdf.setLineWidth(0.5);
      const numLines = Math.floor(slotHeight / 5);
      for (let i = 1; i < numLines; i++) {
        const lineY = y + (i * 5);
        pdf.line(REMARKABLE_CONFIG.margin + timeColumnWidth, lineY, 
                 REMARKABLE_CONFIG.margin + REMARKABLE_CONFIG.contentWidth, lineY);
      }
    }
  });
  
  // Draw appointments using the exact positioning logic from your HTML
  weekEvents.forEach((event) => {
    const eventDate = new Date(event.startTime);
    const dayIndex = (eventDate.getDay() + 6) % 7; // Monday = 0
    
    if (dayIndex >= 0 && dayIndex < 7) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const hour = eventStart.getHours();
      const minute = eventStart.getMinutes();
      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60); // minutes
      
      // Find hourly slot position (reMarkable Pro hourly blocks)
      const slotIndex = timeSlots.findIndex(slot => {
        const slotHour = parseInt(slot.split(':')[0]);
        return slotHour === hour;
      });
      
      if (slotIndex >= 0) {
        // Calculate position within hourly block
        const minuteOffset = (minute / 60) * slotHeight; // Position within the hour
        const eventX = REMARKABLE_CONFIG.margin + timeColumnWidth + (dayIndex * dayColumnWidth) + 2;
        const eventY = gridContentY + (slotIndex * slotHeight) + minuteOffset + 2;
        const eventWidth = dayColumnWidth - 4;
        const eventHeight = Math.max((duration / 60) * slotHeight - 4, 8); // Scale by hour, not 30-minute slots
        
        // Event background - reMarkable Pro optimized e-ink styling
        if (event.source === 'simplepractice' || event.title.includes('Appointment')) {
          // SimplePractice appointments - high contrast for e-ink
          pdf.setFillColor(245, 245, 245);
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(2);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'FD');
          
          // Left border accent - thick for e-ink visibility
          pdf.setLineWidth(6);
          pdf.line(eventX, eventY, eventX, eventY + eventHeight);
        } else {
          // Google Calendar appointments - dashed for e-ink
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(2);
          pdf.setLineDashPattern([4, 4]);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'FD');
          pdf.setLineDashPattern([]);
        }
        
        // Event text - reMarkable Pro optimized
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(7); // Larger for e-ink readability
        pdf.setFont('helvetica', 'bold');
        
        let title = event.title
          .replace(/ Appointment$/, '')
          .toUpperCase()
          .trim();
        
        // Smart text truncation for reMarkable Pro
        const maxChars = Math.floor(eventWidth / 2.5); // Character limit based on width
        if (title.length > maxChars) {
          title = title.substring(0, maxChars - 3) + '...';
        }
        
        pdf.text(title, eventX + 3, eventY + 6);
        
        // Time range - larger for e-ink
        if (eventHeight > 12) {
          pdf.setFontSize(6);
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
  
  // Same structure but for daily view
  // ... (similar implementation for daily view)
  
  return pdf.output('datauristring').split(',')[1];
};

export const exportMonthlyRemarkable = async (
  monthDate: Date,
  events: CalendarEvent[]
): Promise<string> => {
  const pdf = createRemarkablePDF();
  
  // Monthly view placeholder
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Monthly Planner', REMARKABLE_CONFIG.margin + 5, REMARKABLE_CONFIG.margin + 10);
  
  return pdf.output('datauristring').split(',')[1];
};

export const generateRemarkableFilename = (
  type: 'weekly' | 'daily' | 'monthly',
  date: Date
): string => {
  const formattedDate = date.toISOString().split('T')[0];
  return `remarkable-${type}-planner-${formattedDate}`;
};