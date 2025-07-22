import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { formatWeekRange } from './dateUtils';

// EXACT CSS Grid replication from HTML template with precise positioning
const CSS_GRID_SPECS = {
  // Page: 11" x 8.5" landscape, 0.4" margins (matching CSS @page)
  pageWidth: 279.4,    // 11" in mm
  pageHeight: 215.9,   // 8.5" in mm
  margin: 10.16,       // 0.4" in mm (matching CSS @page margin)
  
  // CSS pixel to mm conversion (96 DPI standard)
  pxToMm: 25.4 / 96,   // 0.264583mm per pixel
  
  // Exact CSS Grid dimensions from template
  timeColumnPx: 100,   // 100px time column
  dayHeaderPx: 80,     // 80px day header row
  hourSlotPx: 60,      // 60px per hour slot
  totalHours: 18,      // 18 hours (6AM-11:30PM)
  
  // CRITICAL: Exact appointment positioning from CSS classes
  // .appointment.time-06-00 { top: 80px; }
  // .appointment.time-07-00 { top: 140px; }
  // etc. - each hour increases by 60px, extending to 23:30
  timeSlotPositions: {
    6: 80,   // 6AM at 80px
    7: 140,  // 7AM at 140px
    8: 200,  // 8AM at 200px
    9: 260,  // 9AM at 260px
    10: 320, // 10AM at 320px
    11: 380, // 11AM at 380px
    12: 440, // 12PM at 440px
    13: 500, // 1PM at 500px
    14: 560, // 2PM at 560px
    15: 620, // 3PM at 620px
    16: 680, // 4PM at 680px
    17: 740, // 5PM at 740px
    18: 800, // 6PM at 800px
    19: 860, // 7PM at 860px
    20: 920, // 8PM at 920px
    21: 980, // 9PM at 980px
    22: 1040, // 10PM at 1040px
    23: 1100  // 11PM at 1100px (extends to 23:30)
  },
  
  // Duration height classes from CSS
  durationHeights: {
    30: 25,  // .duration-30 { height: 25px; }
    60: 50,  // .duration-60 { height: 50px; }
    90: 75   // .duration-90 { height: 75px; }
  },
  
  // Convert to mm
  get timeColumnMm() { return this.timeColumnPx * this.pxToMm; },
  get dayHeaderMm() { return this.dayHeaderPx * this.pxToMm; },
  get hourSlotMm() { return this.hourSlotPx * this.pxToMm; },
  
  // Content dimensions
  get contentWidth() { return this.pageWidth - (2 * this.margin); },
  get contentHeight() { return this.pageHeight - (2 * this.margin); },
  
  // Day columns: exact calculation from CSS
  // .appointment.col-mon { left: 102px; width: calc((100% - 102px) / 7 - 6px); }
  get dayColumnMm() { return (this.contentWidth - this.timeColumnMm) / 7; },
  
  // Header space above grid
  headerSpace: 20,  // Compact header
  
  // Typography exactly matching template font sizes
  fonts: {
    title: { size: 16, family: 'times', weight: 'bold' },
    weekInfo: { size: 12, family: 'times', weight: 'bold' },
    dayName: { size: 14, family: 'times', weight: 'bold' },
    dayDate: { size: 20, family: 'times', weight: 'bold' },
    timeLabel: { size: 14, family: 'times', weight: 'bold' },
    appointmentText: { size: 8, family: 'times', weight: 'bold' },  // .appointment-text
    appointmentTime: { size: 7, family: 'times', weight: 'normal' } // .appointment-time
  },
  
  // E-ink optimized styling
  borderWidth: 0.8,  // 3px borders converted to mm
  lightGray: [248, 248, 248] as [number, number, number],  // #f8f8f8
  mediumGray: [240, 240, 240] as [number, number, number], // #f0f0f0
  darkGray: [224, 224, 224] as [number, number, number], // #e0e0e0
  appointmentGray: [245, 245, 245] as [number, number, number], // #f5f5f5
  black: [0, 0, 0] as [number, number, number]
};

export const exportRemarkableProPerfect = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('🎯 Creating EXACT CSS Grid PDF matching HTML template');
    console.log(`📊 Processing ${events.length} events for exact CSS Grid layout`);
    
    // Create PDF with exact reMarkable Pro dimensions
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [CSS_GRID_SPECS.pageWidth, CSS_GRID_SPECS.pageHeight]
    });
    
    // Set Times New Roman font for entire document
    pdf.setFont(CSS_GRID_SPECS.fonts.title.family, CSS_GRID_SPECS.fonts.title.weight);
    
    // Generate exact CSS Grid layout
    await generateExactCSSGrid(pdf, weekStartDate, weekEndDate, events);
    
    // Save with descriptive filename
    const filename = `remarkable-pro-perfect-${weekStartDate.toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    console.log('✅ EXACT CSS Grid PDF generated matching HTML template');
  } catch (error) {
    console.error('❌ PDF Generation Error:', error);
    throw error;
  }
};

async function generateExactCSSGrid(
  pdf: jsPDF,
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> {
  const { margin, contentWidth, headerSpace } = CSS_GRID_SPECS;
  let currentY = margin;
  
  // 1. Compact header (title + stats)
  currentY = generateCompactHeader(pdf, weekStartDate, weekEndDate, currentY);
  
  // 2. EXACT CSS Grid replication
  currentY = generateCSSGridStructure(pdf, weekStartDate, events, currentY);
}

function generateCompactHeader(pdf: jsPDF, weekStartDate: Date, weekEndDate: Date, startY: number): number {
  const { contentWidth, margin, fonts } = CSS_GRID_SPECS;
  const centerX = margin + (contentWidth / 2);
  
  // Title
  pdf.setFont(fonts.title.family, fonts.title.weight);
  pdf.setFontSize(fonts.title.size);
  pdf.text('WEEKLY PLANNER', centerX, startY + 5, { align: 'center' });
  
  // Week range
  const weekRange = formatWeekRange(weekStartDate, weekEndDate);
  pdf.setFontSize(fonts.stats.size);
  pdf.text(weekRange, centerX, startY + 10, { align: 'center' });
  
  return startY + CSS_GRID_SPECS.headerSpace;
}

function generateCSSGridStructure(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], startY: number): number {
  const { margin, timeColumnMm, dayColumnMm, dayHeaderMm, hourSlotMm, totalHours, fonts, borderWidth } = CSS_GRID_SPECS;
  
  // Grid starting position
  const gridStartX = margin;
  const gridStartY = startY;
  
  // Draw time column header (top-left cell)
  pdf.setFillColor(...CSS_GRID_SPECS.lightGray);
  pdf.rect(gridStartX, gridStartY, timeColumnMm, dayHeaderMm, 'F');
  pdf.setLineWidth(borderWidth);
  pdf.rect(gridStartX, gridStartY, timeColumnMm, dayHeaderMm, 'S');
  
  // Draw day headers (top row)
  generateDayHeaders(pdf, weekStartDate, gridStartX + timeColumnMm, gridStartY, dayColumnMm, dayHeaderMm);
  
  // Draw time slots (left column)
  generateTimeSlots(pdf, gridStartX, gridStartY + dayHeaderMm, timeColumnMm, hourSlotMm, totalHours);
  
  // Draw day grid cells
  generateDayGrid(pdf, gridStartX + timeColumnMm, gridStartY + dayHeaderMm, dayColumnMm, hourSlotMm, totalHours);
  
  // Draw appointments in exact grid positions
  generateAppointments(pdf, weekStartDate, events, gridStartX + timeColumnMm, gridStartY + dayHeaderMm, dayColumnMm, hourSlotMm);
  
  return gridStartY + dayHeaderMm + (totalHours * hourSlotMm);
}

function generateDayHeaders(pdf: jsPDF, weekStartDate: Date, startX: number, startY: number, dayWidth: number, headerHeight: number): void {
  const { fonts, borderWidth } = CSS_GRID_SPECS;
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    
    const x = startX + (i * dayWidth);
    const centerX = x + (dayWidth / 2);
    
    // Header background
    pdf.setFillColor(...CSS_GRID_SPECS.lightGray);
    pdf.rect(x, startY, dayWidth, headerHeight, 'F');
    
    // Header border
    pdf.setLineWidth(borderWidth);
    pdf.rect(x, startY, dayWidth, headerHeight, 'S');
    
    // Day name
    pdf.setFont(fonts.dayName.family, fonts.dayName.weight);
    pdf.setFontSize(fonts.dayName.size);
    pdf.text(dayNames[i], centerX, startY + 12, { align: 'center' });
    
    // Day date
    pdf.setFont(fonts.dayDate.family, fonts.dayDate.weight);
    pdf.setFontSize(fonts.dayDate.size);
    pdf.text(dayDate.getDate().toString(), centerX, startY + 18, { align: 'center' });
  }
}

function generateTimeSlots(pdf: jsPDF, startX: number, startY: number, timeWidth: number, hourHeight: number, totalHours: number): void {
  const { fonts, borderWidth } = CSS_GRID_SPECS;
  
  for (let hour = 0; hour < totalHours; hour++) {
    const actualHour = 6 + hour; // Start at 6AM
    const y = startY + (hour * hourHeight);
    const centerX = startX + (timeWidth / 2);
    
    // Time slot background
    pdf.setFillColor(...CSS_GRID_SPECS.darkGray);
    pdf.rect(startX, y, timeWidth, hourHeight, 'F');
    
    // Time slot border
    pdf.setLineWidth(borderWidth);
    pdf.rect(startX, y, timeWidth, hourHeight, 'S');
    
    // Top of hour label (larger font - 14pt)
    pdf.setFont(fonts.timeLabel.family, fonts.timeLabel.weight); // Using timeLabel (14pt)
    pdf.setFontSize(fonts.timeLabel.size);
    const hourLabel = `${actualHour.toString().padStart(2, '0')}:00`;
    pdf.text(hourLabel, centerX, y + (hourHeight * 0.3), { align: 'center' });
    
    // 30-minute mark label (smaller font - 7pt)
    pdf.setFont(fonts.appointmentTime.family, fonts.appointmentTime.weight); // Using appointmentTime (7pt)
    pdf.setFontSize(fonts.appointmentTime.size);
    const halfHourLabel = `${actualHour.toString().padStart(2, '0')}:30`;
    pdf.text(halfHourLabel, centerX, y + (hourHeight * 0.7), { align: 'center' });
  }
}

function generateDayGrid(pdf: jsPDF, startX: number, startY: number, dayWidth: number, hourHeight: number, totalHours: number): void {
  const { borderWidth } = CSS_GRID_SPECS;
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < totalHours; hour++) {
      const x = startX + (day * dayWidth);
      const y = startY + (hour * hourHeight);
      
      // Grid cell border
      pdf.setLineWidth(borderWidth);
      pdf.rect(x, y, dayWidth, hourHeight, 'S');
    }
  }
}

function generateAppointments(pdf: jsPDF, weekStartDate: Date, events: CalendarEvent[], gridStartX: number, gridStartY: number, dayWidth: number, hourHeight: number): void {
  const { fonts, timeSlotPositions, durationHeights, pxToMm, appointmentGray, black } = CSS_GRID_SPECS;
  
  // Filter events for this week
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return eventDate >= weekStartDate && eventDate <= weekEnd;
  });
  
  weekEvents.forEach(event => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Calculate day position (0-6)
    const dayIndex = Math.floor((eventStart.getTime() - weekStartDate.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIndex < 0 || dayIndex > 6) return;
    
    // Get exact hour (6-23 for extended range to 23:30)
    const startHour = eventStart.getHours();
    if (startHour < 6 || startHour > 23) return;
    
    // Use exact CSS positioning values
    const cssTopPosition = timeSlotPositions[startHour as keyof typeof timeSlotPositions];
    if (!cssTopPosition) return;
    
    // Convert CSS pixel position to PDF mm position
    const appointmentY = gridStartY + (cssTopPosition * pxToMm);
    
    // Calculate appointment X position for day column
    // CSS: .appointment.col-mon { left: 102px; width: calc((100% - 102px) / 7 - 6px); }
    const appointmentX = gridStartX + (dayIndex * dayWidth) + (1 * pxToMm); // 1px padding
    const appointmentWidth = dayWidth - (6 * pxToMm); // -6px from CSS
    
    // Calculate duration and height
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    let appointmentHeight: number;
    
    if (durationMinutes <= 30) {
      appointmentHeight = durationHeights[30] * pxToMm;
    } else if (durationMinutes <= 60) {
      appointmentHeight = durationHeights[60] * pxToMm;
    } else {
      appointmentHeight = durationHeights[90] * pxToMm;
    }
    
    // Draw appointment background (matching CSS .appointment.simplepractice)
    pdf.setFillColor(...appointmentGray);
    pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight, 'F');
    
    // Draw appointment border (2px solid black + 6px left border for SimplePractice)
    pdf.setDrawColor(...black);
    pdf.setLineWidth(0.5);
    pdf.rect(appointmentX, appointmentY, appointmentWidth, appointmentHeight, 'S');
    
    // Thick left border for SimplePractice appointments
    if (event.title.includes('Appointment')) {
      pdf.setLineWidth(1.5); // 6px in CSS
      pdf.line(appointmentX, appointmentY, appointmentX, appointmentY + appointmentHeight);
    }
    
    // Clean appointment title (.appointment-text styling)
    let cleanTitle = event.title;
    if (cleanTitle.includes(' Appointment')) {
      cleanTitle = cleanTitle.replace(' Appointment', '');
    }
    
    // Appointment text (font-size: 8px, font-weight: bold, text-transform: uppercase)
    pdf.setFont(fonts.appointmentText.family, fonts.appointmentText.weight);
    pdf.setFontSize(fonts.appointmentText.size);
    pdf.setTextColor(...black);
    
    // Truncate text to fit width
    const maxWidth = appointmentWidth - (3 * pxToMm); // 3px padding
    pdf.text(cleanTitle.toUpperCase(), appointmentX + (3 * pxToMm), appointmentY + (4 * pxToMm), { 
      maxWidth: maxWidth 
    });
    
    // Appointment time (.appointment-time styling: font-size: 7px, margin-top: 1px)
    pdf.setFont(fonts.appointmentTime.family, fonts.appointmentTime.weight);
    pdf.setFontSize(fonts.appointmentTime.size);
    const timeText = `${eventStart.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })}`;
    pdf.text(timeText, appointmentX + (3 * pxToMm), appointmentY + appointmentHeight - (2 * pxToMm));
  });
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export const generateRemarkableProFilename = (date: Date): string => {
  return `remarkable-pro-perfect-${date.toISOString().split('T')[0]}.pdf`;
};

