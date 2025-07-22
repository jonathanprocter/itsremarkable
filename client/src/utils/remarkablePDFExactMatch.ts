// reMarkable Pro PDF generator that exactly matches the provided HTML template
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { formatDate, formatWeekRange } from './dateUtils';

// reMarkable Pro exact specifications matching HTML template CSS
const REMARKABLE_CONFIG = {
  // Page dimensions: A4 landscape for better PDF compatibility
  pageWidth: 297, // A4 width in mm
  pageHeight: 210, // A4 height in mm
  margin: 10, // 10mm margin for better proportions
  
  // Content area calculations
  get contentWidth() { return this.pageWidth - (2 * this.margin); },
  get contentHeight() { return this.pageHeight - (2 * this.margin); },
  
  // CSS Grid layout matching HTML template exactly with proper scaling
  get timeColumnWidth() { return this.contentWidth * 0.12; }, // 12% for time column
  get dayColumnWidth() { return (this.contentWidth - this.timeColumnWidth) / 7; }, // Equal 7 columns
  get headerRowHeight() { return this.contentHeight * 0.15; }, // 15% for header
  get hourRowHeight() { return (this.contentHeight - this.headerRowHeight - 40) / 16; }, // Remaining space / 16 hours
  
  // Typography matching template with better scaling
  fonts: {
    header: { size: 14, weight: 'bold' },
    subheader: { size: 8, weight: 'bold' },
    dayHeader: { size: 7, weight: 'bold' },
    dayNumber: { size: 10, weight: 'bold' },
    timeSlot: { size: 6, weight: 'bold' },
    appointmentTitle: { size: 5, weight: 'bold' },
    appointmentTime: { size: 4, weight: 'normal' },
    stats: { size: 7, weight: 'normal' },
    statsNumber: { size: 10, weight: 'bold' },
    legend: { size: 6, weight: 'normal' }
  }
};

export const exportWeeklyRemarkableExact = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🎯 Generating exact HTML template match PDF for reMarkable Pro');
  
  // Create PDF with landscape A4 dimensions for better scaling
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Set Times New Roman font family (e-ink optimized)
  pdf.setFont('helvetica'); // jsPDF equivalent to Times New Roman
  
  // Generate the exact template layout
  await generateWeeklyLayout(pdf, weekStartDate, weekEndDate, events);
  
  // Download with descriptive filename
  const weekRange = formatWeekRange(weekStartDate, weekEndDate);
  const filename = `weekly-planner-remarkable-${weekRange.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
  pdf.save(filename);
  
  console.log('✅ reMarkable Pro PDF generated successfully');
};

async function generateWeeklyLayout(
  pdf: jsPDF, 
  weekStartDate: Date, 
  weekEndDate: Date, 
  events: CalendarEvent[]
) {
  // Filter events for the current week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });

  console.log(`📊 Processing ${weekEvents.length} events for week layout`);

  // 1. HEADER SECTION - "Weekly Planner" + week info
  generateHeader(pdf, weekStartDate, weekEndDate);
  
  // 2. STATISTICS SECTION - 4-column stats grid
  const statsY = generateStatistics(pdf, weekEvents, weekStartDate, weekEndDate);
  
  // 3. LEGEND SECTION - SimplePractice + Google Calendar
  const legendY = generateLegend(pdf, statsY);
  
  // 4. CALENDAR GRID - Exact CSS Grid replication
  generateCalendarGrid(pdf, legendY, weekStartDate, weekEvents);
}

function generateHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date) {
  const { margin, contentWidth, contentHeight, fonts } = REMARKABLE_CONFIG;
  
  // Header container with border (matching HTML template)
  const headerY = margin;
  const headerHeight = contentHeight * 0.12; // 12% of content height for header
  
  // Header background (light gray)
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, headerY, contentWidth, headerHeight, 'F');
  
  // Header border (thick for e-ink)
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(margin, headerY, contentWidth, headerHeight, 'S');
  
  // Main title: "WEEKLY PLANNER"
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(fonts.header.size);
  pdf.setFont('helvetica', 'bold');
  pdf.text('WEEKLY PLANNER', margin + contentWidth / 2, headerY + headerHeight * 0.4, { align: 'center' });
  
  // Week info: "July 7-13, 2025 • Week 28"
  const weekRange = formatWeekRange(weekStartDate, weekEndDate);
  const weekNumber = getWeekNumber(weekStartDate);
  const weekInfo = `${weekRange} • Week ${weekNumber}`;
  
  pdf.setFontSize(fonts.subheader.size);
  pdf.setFont('helvetica', 'bold');
  pdf.text(weekInfo, margin + contentWidth / 2, headerY + headerHeight * 0.7, { align: 'center' });
  
  return headerY + headerHeight;
}

function generateStatistics(pdf: jsPDF, events: CalendarEvent[], weekStartDate: Date, weekEndDate: Date): number {
  const { margin, contentWidth, contentHeight, fonts } = REMARKABLE_CONFIG;
  const headerBottom = margin + (contentHeight * 0.12);
  
  // Calculate real statistics from events
  const totalAppointments = events.length;
  const totalMinutes = events.reduce((total, event) => {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
    return total + duration;
  }, 0);
  const scheduledHours = totalMinutes / 60;
  const dailyAverage = scheduledHours / 7;
  
  // Available time calculation (assuming 16 hours per day, 7 days = 112 hours total)
  const totalAvailableHours = 16 * 7; // 6AM to 10PM = 16 hours
  const availableHours = totalAvailableHours - scheduledHours;
  
  // Stats section
  const statsY = headerBottom;
  const statsHeight = contentHeight * 0.08; // 8% of content height
  const statWidth = contentWidth / 4;
  
  // Stats background
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, statsY, contentWidth, statsHeight, 'F');
  
  // Stats border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(1);
  pdf.rect(margin, statsY, contentWidth, statsHeight, 'S');
  
  // Individual stat cards
  const stats = [
    { number: totalAppointments.toString(), label: 'Total Appointments' },
    { number: `${scheduledHours.toFixed(1)}h`, label: 'Scheduled Time' },
    { number: `${dailyAverage.toFixed(1)}h`, label: 'Daily Average' },
    { number: `${availableHours.toFixed(1)}h`, label: 'Available Time' }
  ];
  
  stats.forEach((stat, index) => {
    const statX = margin + (index * statWidth);
    
    // Stat card border
    if (index < 3) {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(1);
      pdf.line(statX + statWidth, statsY, statX + statWidth, statsY + statsHeight);
    }
    
    // Stat number (large, bold)
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(fonts.statsNumber.size);
    pdf.setFont('helvetica', 'bold');
    pdf.text(stat.number, statX + statWidth / 2, statsY + statsHeight * 0.4, { align: 'center' });
    
    // Stat label
    pdf.setFontSize(fonts.stats.size);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, statX + statWidth / 2, statsY + statsHeight * 0.7, { align: 'center' });
  });
  
  return statsY + statsHeight;
}

function generateLegend(pdf: jsPDF, statsBottom: number): number {
  const { margin, contentWidth, fonts } = REMARKABLE_CONFIG;
  
  const legendY = statsBottom;
  const legendHeight = 15;
  
  // Legend background
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, legendY, contentWidth, legendHeight, 'F');
  
  // Legend border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(3);
  pdf.rect(margin, legendY, contentWidth, legendHeight, 'S');
  
  // Legend items
  const legendItemY = legendY + 10;
  
  // SimplePractice legend
  const simplePracticeX = margin + 20;
  
  // SimplePractice symbol (light gray with thick left border)
  pdf.setFillColor(240, 240, 240);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(simplePracticeX, legendItemY - 4, 12, 8, 'FD');
  
  // Thick left border
  pdf.setLineWidth(4);
  pdf.line(simplePracticeX, legendItemY - 4, simplePracticeX, legendItemY + 4);
  
  // SimplePractice text
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(fonts.legend.size);
  pdf.setFont('helvetica', 'normal');
  pdf.text('SimplePractice', simplePracticeX + 18, legendItemY + 2);
  
  // Google Calendar legend
  const googleX = simplePracticeX + 120;
  
  // Google Calendar symbol (white with dashed border)
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.setLineDashPattern([2, 2]);
  pdf.rect(googleX, legendItemY - 4, 12, 8, 'FD');
  pdf.setLineDashPattern([]);
  
  // Google Calendar text
  pdf.text('Google Calendar', googleX + 18, legendItemY + 2);
  
  return legendY + legendHeight;
}

function generateCalendarGrid(pdf: jsPDF, legendBottom: number, weekStartDate: Date, events: CalendarEvent[]) {
  const { margin, contentWidth, contentHeight, timeColumnWidth, dayColumnWidth, hourRowHeight, fonts } = REMARKABLE_CONFIG;
  
  const gridY = legendBottom;
  const availableHeight = contentHeight - (gridY - margin);
  const gridHeaderHeight = contentHeight * 0.08; // 8% for grid headers
  const gridHeight = availableHeight;
  
  // Grid container border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.rect(margin, gridY, contentWidth, gridHeight, 'S');
  
  // GRID HEADERS
  generateGridHeaders(pdf, gridY, weekStartDate, gridHeaderHeight);
  
  // HOURLY TIME SLOTS (6AM - 9PM = 16 hours)
  const timeGridY = gridY + gridHeaderHeight;
  const timeGridHeight = gridHeight - gridHeaderHeight;
  generateTimeSlots(pdf, timeGridY, timeGridHeight);
  
  // DAY COLUMN SEPARATORS
  generateColumnSeparators(pdf, gridY, gridHeight);
  
  // HOURLY ROW SEPARATORS
  generateRowSeparators(pdf, timeGridY, timeGridHeight);
  
  // APPOINTMENTS positioned in CSS Grid style
  generateAppointments(pdf, timeGridY, timeGridHeight, weekStartDate, events);
}

function generateGridHeaders(pdf: jsPDF, gridY: number, weekStartDate: Date, headerHeight: number) {
  const { margin, timeColumnWidth, dayColumnWidth, fonts } = REMARKABLE_CONFIG;
  
  // Header row background
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, gridY, REMARKABLE_CONFIG.contentWidth, headerHeight, 'F');
  
  // Header row border
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  pdf.line(margin, gridY + headerHeight, margin + REMARKABLE_CONFIG.contentWidth, gridY + headerHeight);
  
  // TIME header
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(fonts.dayHeader.size);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TIME', margin + timeColumnWidth / 2, gridY + headerHeight * 0.6, { align: 'center' });
  
  // Day headers
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    
    const dayX = margin + timeColumnWidth + (i * dayColumnWidth);
    
    // Day name
    pdf.setFontSize(fonts.dayHeader.size);
    pdf.setFont('helvetica', 'bold');
    pdf.text(days[i], dayX + dayColumnWidth / 2, gridY + headerHeight * 0.4, { align: 'center' });
    
    // Day number
    pdf.setFontSize(fonts.dayNumber.size);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayDate.getDate().toString(), dayX + dayColumnWidth / 2, gridY + headerHeight * 0.7, { align: 'center' });
  }
}

function generateTimeSlots(pdf: jsPDF, timeGridY: number, timeGridHeight: number) {
  const { margin, timeColumnWidth, fonts } = REMARKABLE_CONFIG;
  
  // Calculate hour row height based on available space
  const hourRowHeight = timeGridHeight / 16; // 16 hours from 6AM to 9PM
  
  // Generate 16 hourly slots (6AM - 9PM)
  for (let hour = 6; hour <= 21; hour++) {
    const rowIndex = hour - 6;
    const slotY = timeGridY + (rowIndex * hourRowHeight);
    
    // Time slot background
    pdf.setFillColor(248, 248, 248);
    pdf.rect(margin, slotY, timeColumnWidth, hourRowHeight, 'F');
    
    // Time label
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(fonts.timeSlot.size);
    pdf.setFont('helvetica', 'bold');
    pdf.text(timeLabel, margin + timeColumnWidth / 2, slotY + hourRowHeight / 2 + 2, { align: 'center' });
  }
}

function generateColumnSeparators(pdf: jsPDF, gridY: number, gridHeight: number) {
  const { margin, timeColumnWidth, dayColumnWidth } = REMARKABLE_CONFIG;
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  
  // Time column separator (thick)
  pdf.setLineWidth(3);
  pdf.line(margin + timeColumnWidth, gridY, margin + timeColumnWidth, gridY + gridHeight);
  
  // Day column separators
  pdf.setLineWidth(2);
  for (let i = 1; i < 7; i++) {
    const x = margin + timeColumnWidth + (i * dayColumnWidth);
    pdf.line(x, gridY, x, gridY + gridHeight);
  }
}

function generateRowSeparators(pdf: jsPDF, timeGridY: number, timeGridHeight: number) {
  const { margin, contentWidth, hourRowHeight } = REMARKABLE_CONFIG;
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(2);
  
  // Hourly row separators
  for (let i = 1; i < 16; i++) { // 15 separators for 16 hours
    const y = timeGridY + (i * hourRowHeight);
    pdf.line(margin, y, margin + contentWidth, y);
  }
}

function generateAppointments(pdf: jsPDF, timeGridY: number, timeGridHeight: number, weekStartDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, dayColumnWidth, fonts } = REMARKABLE_CONFIG;
  
  // Calculate hour row height based on available space
  const hourRowHeight = timeGridHeight / 16; // 16 hours from 6AM to 9PM
  
  events.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Calculate day index (0 = Monday, 6 = Sunday)
    const dayIndex = Math.floor((eventStart.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayIndex >= 0 && dayIndex < 7) {
      const hour = eventStart.getHours();
      const minute = eventStart.getMinutes();
      const duration = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60); // minutes
      
      // Only show events within business hours (6AM - 9PM)
      if (hour >= 6 && hour <= 21) {
        const hourIndex = hour - 6; // Convert to 0-based index
        
        // Calculate exact position within the hour
        const minuteOffset = (minute / 60) * hourRowHeight;
        
        // Position calculations
        const eventX = margin + timeColumnWidth + (dayIndex * dayColumnWidth) + 2;
        const eventY = timeGridY + (hourIndex * hourRowHeight) + minuteOffset + 1;
        const eventWidth = dayColumnWidth - 4;
        const eventHeight = Math.max((duration / 60) * hourRowHeight - 2, 8);
        
        // Draw appointment based on source type
        if (event.source === 'simplepractice' || event.title.includes('Appointment')) {
          // SimplePractice style (light gray with thick left border)
          pdf.setFillColor(245, 245, 245);
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(2);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'FD');
          
          // Thick left border
          pdf.setLineWidth(6);
          pdf.line(eventX, eventY, eventX, eventY + eventHeight);
        } else {
          // Google Calendar style (white with dashed border)
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(2);
          pdf.setLineDashPattern([3, 3]);
          pdf.rect(eventX, eventY, eventWidth, eventHeight, 'FD');
          pdf.setLineDashPattern([]);
        }
        
        // Appointment text
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(fonts.appointmentTitle.size);
        pdf.setFont('helvetica', 'bold');
        
        // Clean up title (remove "Appointment" suffix, truncate if needed)
        let title = event.title.replace(/ Appointment$/, '').toUpperCase().trim();
        const maxChars = Math.floor(eventWidth / 2.5);
        if (title.length > maxChars) {
          title = title.substring(0, maxChars - 3) + '...';
        }
        
        pdf.text(title, eventX + 3, eventY + 6);
        
        // Time range (if height allows)
        if (eventHeight > 12) {
          pdf.setFontSize(fonts.appointmentTime.size);
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
          
          pdf.text(`${startTime}-${endTime}`, eventX + 3, eventY + eventHeight - 3);
        }
      }
    }
  });
}

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
}

export const generateRemarkableFilename = (type: 'weekly' | 'daily' | 'weekly-package', date: Date): string => {
  const dateStr = formatDate(date);
  return `remarkable-${type}-${dateStr}`;
};