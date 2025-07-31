import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { getWeekNumber } from './dateUtils';

// HTML Template Configuration - Full landscape weekly view with all user feedback implemented
const HTML_TEMPLATE_CONFIG = {
  // Page dimensions - A3 landscape for full weekly view
  pageWidth: 1190,
  pageHeight: 842,
  
  // Header sections
  headerHeight: 50,
  statsHeight: 40, 
  legendHeight: 30,
  
  // Grid positioning
  gridStartY: 120,
  timeSlotHeight: 20, // Optimized height for readability
  
  // Time slots configuration - FIXED: extend to 23:30 as requested
  timeSlots: 36,  // 6:00 to 23:30 (17.5 hours * 2 slots per hour)
  startHour: 6,
  endHour: 23,
  endMinute: 30,
  
  // Column widths
  timeColumnWidth: 60,
  dayColumnWidth: 160, // (1170 - 60) / 7 = ~157, rounded to 160
  
  // Colors
  colors: {
    black: { r: 0, g: 0, b: 0 },
    lightGrey: { r: 248, g: 248, b: 248 },
    darkGrey: { r: 220, g: 220, b: 220 }, // DARKENED for hour lines as requested
    borderGrey: { r: 204, g: 204, b: 204 },
    simplePracticeBlue: { r: 66, g: 133, b: 244 },
    googleGreen: { r: 52, g: 168, b: 83 },
    holidayBlue: { r: 66, g: 133, b: 244 }
  }
};

// Generate time slots from 6:00 to 23:30 - FIXED: include 23:30 as requested
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = HTML_TEMPLATE_CONFIG.startHour; hour <= HTML_TEMPLATE_CONFIG.endHour; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    // Add :30 slot for all hours including 23:30
    if (hour < HTML_TEMPLATE_CONFIG.endHour || hour === HTML_TEMPLATE_CONFIG.endHour) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export const exportHTMLTemplatePDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: [792, 612] // 11 x 8.5 inches (landscape)
  });

  // === DRAW ALL SECTIONS ===
  drawHeader(pdf, weekStartDate, weekEndDate);
  drawStats(pdf, events);
  drawLegend(pdf);
  drawCalendarGrid(pdf, weekStartDate, events);

  // Save the PDF
  const filename = `weekly-planner-${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}.pdf`;
  
  try {
    pdf.save(filename);
    console.log(`✅ HTML Template PDF exported: ${filename}`);
    console.log('✅ PDF download should have started automatically');
  } catch (error) {
    console.error('❌ Error saving PDF:', error);
    throw error;
  }
};

function drawHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date): void {
  const margin = 10;
  
  // Main border
  pdf.setLineWidth(3);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margin, margin, HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2), HTML_TEMPLATE_CONFIG.pageHeight - (margin * 2));
  
  // Header background
  const contentWidth = HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2);
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, margin, contentWidth, HTML_TEMPLATE_CONFIG.headerHeight, 'F');
  
  // Header border
  pdf.setLineWidth(3);
  pdf.line(margin, margin + HTML_TEMPLATE_CONFIG.headerHeight, margin + contentWidth, margin + HTML_TEMPLATE_CONFIG.headerHeight);
  
  // Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY PLANNER', HTML_TEMPLATE_CONFIG.pageWidth / 2, margin + 25, { align: 'center' });
  
  // FIXED: Week information with week number as requested in feedback
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  const weekNumber = getWeekNumber(weekStartDate);
  const weekText = `Week ${weekNumber} - ${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  pdf.text(weekText, HTML_TEMPLATE_CONFIG.pageWidth / 2, margin + 45, { align: 'center' });
}

function drawStats(pdf: jsPDF, events: CalendarEvent[]): void {
  const margin = 10;
  const contentWidth = HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2);
  const statsY = margin + HTML_TEMPLATE_CONFIG.headerHeight;
  
  // Stats background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, statsY, contentWidth, HTML_TEMPLATE_CONFIG.statsHeight, 'F');
  
  // Stats border
  pdf.setLineWidth(3);
  pdf.line(margin, statsY + HTML_TEMPLATE_CONFIG.statsHeight, margin + contentWidth, statsY + HTML_TEMPLATE_CONFIG.statsHeight);
  
  // Calculate stats
  const totalEvents = events.length;
  const simplePracticeEvents = events.filter(e => e.title.includes('Appointment')).length;
  const googleEvents = events.filter(e => !e.title.includes('Appointment')).length;
  const totalHours = Math.round(events.reduce((sum, e) => {
    const duration = (e.endTime.getTime() - e.startTime.getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0));
  
  // Display stats
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  
  const statsText = `Total Events: ${totalEvents} | SimplePractice: ${simplePracticeEvents} | Google Calendar: ${googleEvents} | Total Hours: ${totalHours}`;
  pdf.text(statsText, HTML_TEMPLATE_CONFIG.pageWidth / 2, statsY + 25, { align: 'center' });
}

function drawLegend(pdf: jsPDF): void {
  const margin = 10;
  const contentWidth = HTML_TEMPLATE_CONFIG.pageWidth - (margin * 2);
  const legendY = margin + HTML_TEMPLATE_CONFIG.headerHeight + HTML_TEMPLATE_CONFIG.statsHeight;
  
  // Legend background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin, legendY, contentWidth, HTML_TEMPLATE_CONFIG.legendHeight, 'F');
  
  // Legend border
  pdf.setLineWidth(3);
  pdf.line(margin, legendY + HTML_TEMPLATE_CONFIG.legendHeight, margin + contentWidth, legendY + HTML_TEMPLATE_CONFIG.legendHeight);
  
  // Legend items
  const legendItems = [
    { label: 'SimplePractice', color: HTML_TEMPLATE_CONFIG.colors.simplePracticeBlue, style: 'leftBorder' },
    { label: 'Google Calendar', color: HTML_TEMPLATE_CONFIG.colors.googleGreen, style: 'dashed' },
    { label: 'Holidays in United States', color: HTML_TEMPLATE_CONFIG.colors.holidayBlue, style: 'filled' }
  ];
  
  let x = margin + 50;
  legendItems.forEach((item) => {
    if (item.style === 'dashed') {
      pdf.setDrawColor(item.color.r, item.color.g, item.color.b);
      pdf.setLineWidth(2);
      pdf.setLineDashPattern([3, 3], 0);
      pdf.rect(x, legendY + 12, 16, 12);
      pdf.setLineDashPattern([], 0);
    } else if (item.style === 'filled') {
      pdf.setDrawColor(204, 204, 204);
      pdf.setLineWidth(2);
      pdf.rect(x, legendY + 12, 16, 12);
      pdf.setFillColor(item.color.r, item.color.g, item.color.b);
      pdf.rect(x, legendY + 12, 16, 12, 'F');
    } else if (item.style === 'leftBorder') {
      pdf.setDrawColor(204, 204, 204);
      pdf.setLineWidth(2);
      pdf.rect(x, legendY + 12, 16, 12);
      pdf.setDrawColor(item.color.r, item.color.g, item.color.b);
      pdf.setLineWidth(6);
      pdf.line(x, legendY + 12, x, legendY + 24);
    }
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, x + 22, legendY + 18);
    
    x += 120;
  });
}

function drawCalendarGrid(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[]): void {
  const margin = 10;
  const gridY = margin + HTML_TEMPLATE_CONFIG.headerHeight + HTML_TEMPLATE_CONFIG.statsHeight + HTML_TEMPLATE_CONFIG.legendHeight;
  
  // === DAY HEADERS ===
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Time column header
  pdf.setFillColor(HTML_TEMPLATE_CONFIG.colors.lightGrey.r, HTML_TEMPLATE_CONFIG.colors.lightGrey.g, HTML_TEMPLATE_CONFIG.colors.lightGrey.b);
  pdf.rect(margin, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth, 30, 'F');
  pdf.setLineWidth(2);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margin, gridY, HTML_TEMPLATE_CONFIG.timeColumnWidth, 30);
  
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('TIME', margin + HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, gridY + 18, { align: 'center' });
  
  // Day headers
  for (let i = 0; i < 7; i++) {
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (i * HTML_TEMPLATE_CONFIG.dayColumnWidth);
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(dayDate.getDate() + i);
    
    // Day header background
    pdf.setFillColor(HTML_TEMPLATE_CONFIG.colors.lightGrey.r, HTML_TEMPLATE_CONFIG.colors.lightGrey.g, HTML_TEMPLATE_CONFIG.colors.lightGrey.b);
    pdf.rect(x, gridY, HTML_TEMPLATE_CONFIG.dayColumnWidth, 30, 'F');
    
    // Day header borders
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(x, gridY, HTML_TEMPLATE_CONFIG.dayColumnWidth, 30);
    
    // Day name
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayNames[i], x + HTML_TEMPLATE_CONFIG.dayColumnWidth / 2, gridY + 12, { align: 'center' });
    
    // Day date
    pdf.setFontSize(14);
    pdf.text(dayDate.getDate().toString(), x + HTML_TEMPLATE_CONFIG.dayColumnWidth / 2, gridY + 25, { align: 'center' });
  }
  
  // === TIME SLOTS AND GRID ===
  TIME_SLOTS.forEach((timeSlot, index) => {
    const isHour = timeSlot.endsWith(':00');
    const y = gridY + 30 + (index * HTML_TEMPLATE_CONFIG.timeSlotHeight);
    
    // Time column cell
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, y, HTML_TEMPLATE_CONFIG.timeColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight, 'F');
    
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(margin, y, HTML_TEMPLATE_CONFIG.timeColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight);
    
    // Time label
    pdf.setFontSize(isHour ? 9 : 8);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text(timeSlot, margin + HTML_TEMPLATE_CONFIG.timeColumnWidth / 2, y + HTML_TEMPLATE_CONFIG.timeSlotHeight / 2 + 3, { align: 'center' });
    
    // FIXED: Hour lines span entire row as requested in feedback
    if (isHour) {
      // Dark hour line across ENTIRE ROW (not just time column)
      pdf.setLineWidth(2);
      pdf.setDrawColor(HTML_TEMPLATE_CONFIG.colors.darkGrey.r, HTML_TEMPLATE_CONFIG.colors.darkGrey.g, HTML_TEMPLATE_CONFIG.colors.darkGrey.b);
      const fullRowWidth = HTML_TEMPLATE_CONFIG.timeColumnWidth + (7 * HTML_TEMPLATE_CONFIG.dayColumnWidth);
      pdf.line(margin, y, margin + fullRowWidth, y);
      
      // FIXED: Darken background for hour rows as requested
      pdf.setFillColor(HTML_TEMPLATE_CONFIG.colors.darkGrey.r, HTML_TEMPLATE_CONFIG.colors.darkGrey.g, HTML_TEMPLATE_CONFIG.colors.darkGrey.b);
      pdf.rect(margin + HTML_TEMPLATE_CONFIG.timeColumnWidth, y, 7 * HTML_TEMPLATE_CONFIG.dayColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight, 'F');
    }
    
    // Calendar cells for each day
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * HTML_TEMPLATE_CONFIG.dayColumnWidth);
      
      // Cell borders
      pdf.setLineWidth(1);
      pdf.setDrawColor(HTML_TEMPLATE_CONFIG.colors.borderGrey.r, HTML_TEMPLATE_CONFIG.colors.borderGrey.g, HTML_TEMPLATE_CONFIG.colors.borderGrey.b);
      pdf.rect(x, y, HTML_TEMPLATE_CONFIG.dayColumnWidth, HTML_TEMPLATE_CONFIG.timeSlotHeight);
      
      // FIXED: Add vertical day separator lines extending upward as requested
      if (dayIndex === 0 || dayIndex === 6) {
        pdf.setLineWidth(3);
        pdf.setDrawColor(0, 0, 0);
        if (dayIndex === 0) {
          // Left border of first column
          pdf.line(x, gridY, x, y + HTML_TEMPLATE_CONFIG.timeSlotHeight);
        } else {
          // Right border of last column
          pdf.line(x + HTML_TEMPLATE_CONFIG.dayColumnWidth, gridY, x + HTML_TEMPLATE_CONFIG.dayColumnWidth, y + HTML_TEMPLATE_CONFIG.timeSlotHeight);
        }
      }
    }
  });
  
  // === DRAW EVENTS ===
  drawAppointments(pdf, weekStartDate, events, gridY + 30);
}

function drawAppointments(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], gridStartY: number): void {
  const margin = 10;
  
  events.forEach((event) => {
    // Calculate which day this event belongs to
    const eventDate = new Date(event.startTime);
    const weekStart = new Date(weekStartDate);
    const dayIndex = Math.floor((eventDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayIndex < 0 || dayIndex > 6) return; // Skip events outside this week
    
    // Calculate time slot position
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    const endTime = new Date(event.endTime);
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    // Convert to slot indices
    const startSlotIndex = ((startHour - HTML_TEMPLATE_CONFIG.startHour) * 2) + (startMinute >= 30 ? 1 : 0);
    const endSlotIndex = ((endHour - HTML_TEMPLATE_CONFIG.startHour) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlotIndex < 0 || startSlotIndex >= TIME_SLOTS.length) return;
    
    // Calculate position
    const x = margin + HTML_TEMPLATE_CONFIG.timeColumnWidth + (dayIndex * HTML_TEMPLATE_CONFIG.dayColumnWidth) + 2;
    const y = gridStartY + (startSlotIndex * HTML_TEMPLATE_CONFIG.timeSlotHeight) + 2;
    const width = HTML_TEMPLATE_CONFIG.dayColumnWidth - 4;
    const height = Math.max(HTML_TEMPLATE_CONFIG.timeSlotHeight - 4, ((endSlotIndex - startSlotIndex) * HTML_TEMPLATE_CONFIG.timeSlotHeight) - 4);
    
    // Event styling based on source
    if (event.title.includes('Appointment')) {
      // SimplePractice events - light blue with left border
      pdf.setFillColor(235, 245, 255);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(HTML_TEMPLATE_CONFIG.colors.simplePracticeBlue.r, HTML_TEMPLATE_CONFIG.colors.simplePracticeBlue.g, HTML_TEMPLATE_CONFIG.colors.simplePracticeBlue.b);
      pdf.setLineWidth(4);
      pdf.line(x, y, x, y + height);
    } else {
      // Google Calendar events - light green with dashed border
      pdf.setFillColor(240, 255, 240);
      pdf.rect(x, y, width, height, 'F');
      pdf.setDrawColor(HTML_TEMPLATE_CONFIG.colors.googleGreen.r, HTML_TEMPLATE_CONFIG.colors.googleGreen.g, HTML_TEMPLATE_CONFIG.colors.googleGreen.b);
      pdf.setLineWidth(2);
      pdf.setLineDashPattern([3, 3], 0);
      pdf.rect(x, y, width, height);
      pdf.setLineDashPattern([], 0);
    }
    
    // Event text
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    
    // Clean up appointment title
    let displayTitle = event.title.replace(' Appointment', '');
    if (displayTitle.length > 15) {
      displayTitle = displayTitle.substring(0, 15) + '...';
    }
    
    pdf.text(displayTitle, x + 4, y + 10);
    
    // Time stamp
    const timeText = `${eventDate.getHours().toString().padStart(2, '0')}:${eventDate.getMinutes().toString().padStart(2, '0')}-${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    pdf.setFontSize(5);
    pdf.text(timeText, x + 4, y + height - 4);
  });
}