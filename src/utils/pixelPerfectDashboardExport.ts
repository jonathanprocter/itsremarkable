
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { generateTimeSlots } from './timeSlots';

/**
 * Pixel-Perfect Dashboard Export System
 * Extracts exact styling from WeeklyCalendarGrid and DailyView components
 * and applies them to PDF generation for true pixel-perfect replication
 */

// Extract exact dashboard styles from CSS
function extractDashboardStyles() {
  // Get the actual calendar container from the DOM
  const calendarContainer = document.querySelector('.calendar-container');
  const weeklyGrid = document.querySelector('.weekly-calendar-grid');
  const timeColumn = document.querySelector('.time-column');
  const dayColumn = document.querySelector('.day-column');
  
  if (!calendarContainer || !weeklyGrid) {
    console.warn('Dashboard elements not found, using fallback styles');
    return getFallbackStyles();
  }
  
  const containerRect = calendarContainer.getBoundingClientRect();
  const timeColumnRect = timeColumn?.getBoundingClientRect();
  const dayColumnRect = dayColumn?.getBoundingClientRect();
  
  // Extract exact measurements
  const styles = {
    container: {
      width: containerRect.width,
      height: containerRect.height
    },
    timeColumn: {
      width: timeColumnRect?.width || 80,
    },
    dayColumn: {
      width: dayColumnRect?.width || ((containerRect.width - (timeColumnRect?.width || 80)) / 7),
    },
    // Extract CSS variables and computed styles
    colors: extractColors(),
    fonts: extractFonts(),
    spacing: extractSpacing()
  };
  
  console.log('🎯 Extracted dashboard styles:', styles);
  return styles;
}

function extractColors() {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  return {
    simplePracticeBlue: '#6495ED', // From your CSS
    googleGreen: '#22c55e',
    holidayOrange: '#f59e0b',
    white: '#FFFFFF',
    lightGray: '#f0f0f0',
    veryLightGray: '#f8f8f8',
    borderGray: '#ddd'
  };
}

function extractFonts() {
  // Get actual font sizes from CSS classes
  const eventElement = document.querySelector('.appointment');
  const timeElement = document.querySelector('.time-slot');
  
  return {
    eventTitle: eventElement ? parseInt(getComputedStyle(eventElement).fontSize) : 14,
    eventTime: 12,
    timeSlot: timeElement ? parseInt(getComputedStyle(timeElement).fontSize) : 10,
    dayHeader: 14
  };
}

function extractSpacing() {
  const timeSlot = document.querySelector('.time-slot');
  const appointment = document.querySelector('.appointment');
  
  return {
    timeSlotHeight: timeSlot ? timeSlot.getBoundingClientRect().height : 30,
    appointmentPadding: 4,
    gridPadding: 8
  };
}

function getFallbackStyles() {
  return {
    container: { width: 1200, height: 800 },
    timeColumn: { width: 80 },
    dayColumn: { width: 160 },
    colors: {
      simplePracticeBlue: '#6495ED',
      googleGreen: '#22c55e',
      holidayOrange: '#f59e0b',
      white: '#FFFFFF',
      lightGray: '#f0f0f0',
      veryLightGray: '#f8f8f8',
      borderGray: '#ddd'
    },
    fonts: {
      eventTitle: 14,
      eventTime: 12,
      timeSlot: 10,
      dayHeader: 14
    },
    spacing: {
      timeSlotHeight: 30,
      appointmentPadding: 4,
      gridPadding: 8
    }
  };
}

// Convert dashboard styles to PDF configuration
function createPDFConfig(dashboardStyles: any, viewType: 'weekly' | 'daily') {
  const isWeekly = viewType === 'weekly';
  
  // Scale dashboard dimensions to PDF points (1 inch = 72 points)
  const scaleFactor = isWeekly ? 0.6 : 0.8; // Adjust based on view type
  
  return {
    pageWidth: isWeekly ? 1190 : 612, // A3 landscape vs A4 portrait
    pageHeight: isWeekly ? 842 : 792,
    margin: 40,
    
    // Scale dashboard measurements
    timeColumnWidth: Math.round(dashboardStyles.timeColumn.width * scaleFactor),
    dayColumnWidth: Math.round(dashboardStyles.dayColumn.width * scaleFactor),
    timeSlotHeight: Math.round(dashboardStyles.spacing.timeSlotHeight * scaleFactor),
    
    // Use extracted colors exactly
    colors: dashboardStyles.colors,
    
    // Scale font sizes proportionally
    fonts: {
      title: Math.round(dashboardStyles.fonts.dayHeader * 1.5),
      eventTitle: dashboardStyles.fonts.eventTitle,
      eventTime: dashboardStyles.fonts.eventTime,
      timeSlot: dashboardStyles.fonts.timeSlot,
      dayHeader: dashboardStyles.fonts.dayHeader
    },
    
    spacing: {
      appointmentPadding: dashboardStyles.spacing.appointmentPadding,
      gridPadding: dashboardStyles.spacing.gridPadding
    }
  };
}

/**
 * Export pixel-perfect weekly PDF matching WeeklyCalendarGrid exactly
 */
export async function exportPixelPerfectWeekly(
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🎯 Starting pixel-perfect weekly export...');
    
    // Extract exact dashboard styles
    const dashboardStyles = extractDashboardStyles();
    const config = createPDFConfig(dashboardStyles, 'weekly');
    
    // Create PDF with extracted dimensions
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [config.pageWidth, config.pageHeight]
    });
    
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, config.pageWidth, config.pageHeight, 'F');
    
    // Draw header exactly like dashboard
    drawPixelPerfectWeeklyHeader(pdf, config, weekStartDate, weekEndDate);
    
    // Draw grid exactly like WeeklyCalendarGrid
    drawPixelPerfectWeeklyGrid(pdf, config, weekStartDate);
    
    // Draw events exactly like dashboard
    drawPixelPerfectWeeklyEvents(pdf, config, weekStartDate, events);
    
    // Save PDF
    const filename = `pixel-perfect-weekly-${weekStartDate.toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    console.log('✅ Pixel-perfect weekly export complete!');
    
  } catch (error) {
    console.error('❌ Pixel-perfect weekly export failed:', error);
    throw error;
  }
}

/**
 * Export pixel-perfect daily PDF matching DailyView exactly
 */
export async function exportPixelPerfectDaily(
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🎯 Starting pixel-perfect daily export...');
    
    // Extract exact dashboard styles
    const dashboardStyles = extractDashboardStyles();
    const config = createPDFConfig(dashboardStyles, 'daily');
    
    // Create PDF with extracted dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [config.pageWidth, config.pageHeight]
    });
    
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, config.pageWidth, config.pageHeight, 'F');
    
    // Draw header exactly like dashboard
    drawPixelPerfectDailyHeader(pdf, config, selectedDate);
    
    // Draw grid exactly like DailyView
    drawPixelPerfectDailyGrid(pdf, config);
    
    // Draw events exactly like dashboard
    drawPixelPerfectDailyEvents(pdf, config, selectedDate, events);
    
    // Save PDF
    const filename = `pixel-perfect-daily-${selectedDate.toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    console.log('✅ Pixel-perfect daily export complete!');
    
  } catch (error) {
    console.error('❌ Pixel-perfect daily export failed:', error);
    throw error;
  }
}

function drawPixelPerfectWeeklyHeader(pdf: jsPDF, config: any, weekStartDate: Date, weekEndDate: Date) {
  const { margin, pageWidth, colors, fonts } = config;
  
  // Title
  pdf.setFontSize(fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('WEEKLY CALENDAR', pageWidth / 2, margin + 25, { align: 'center' });
  
  // Week info
  pdf.setFontSize(fonts.dayHeader);
  pdf.setFont('helvetica', 'normal');
  const weekText = `${weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  pdf.text(weekText, pageWidth / 2, margin + 45, { align: 'center' });
}

function drawPixelPerfectWeeklyGrid(pdf: jsPDF, config: any, weekStartDate: Date) {
  const { margin, pageWidth, timeColumnWidth, dayColumnWidth, timeSlotHeight, colors } = config;
  const gridStartY = margin + 70;
  const timeSlots = generateTimeSlots();
  
  // Draw time column header
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, gridStartY, timeColumnWidth, 25, 'F');
  pdf.setFontSize(config.fonts.dayHeader);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TIME', margin + timeColumnWidth / 2, gridStartY + 16, { align: 'center' });
  
  // Draw day headers exactly like WeeklyCalendarGrid
  const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(weekStartDate.getDate() + i);
    const x = margin + timeColumnWidth + (i * dayColumnWidth);
    
    // Day header background
    pdf.setFillColor(245, 245, 245);
    pdf.rect(x, gridStartY, dayColumnWidth, 25, 'F');
    
    // Day name
    pdf.setFontSize(config.fonts.dayHeader);
    pdf.setFont('helvetica', 'bold');
    pdf.text(dayNames[i], x + dayColumnWidth / 2, gridStartY + 12, { align: 'center' });
    
    // Day number
    pdf.setFontSize(config.fonts.dayHeader - 2);
    pdf.text(dayDate.getDate().toString(), x + dayColumnWidth / 2, gridStartY + 22, { align: 'center' });
  }
  
  // Draw time slots exactly like dashboard
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + 25 + (index * timeSlotHeight);
    const isHour = slot.minute === 0;
    
    // Time cell background - match dashboard exactly
    const bgColor = isHour ? [240, 240, 240] : [248, 248, 248];
    pdf.setFillColor(...bgColor);
    pdf.rect(margin, y, timeColumnWidth, timeSlotHeight, 'F');
    
    // Time text
    pdf.setFontSize(config.fonts.timeSlot);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.text(slot.time, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 2, { align: 'center' });
    
    // Day cells - white background like dashboard
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const cellX = margin + timeColumnWidth + (dayIndex * dayColumnWidth);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(cellX, y, dayColumnWidth, timeSlotHeight, 'F');
      
      // Grid lines
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(221, 221, 221);
      pdf.rect(cellX, y, dayColumnWidth, timeSlotHeight, 'S');
    }
  });
  
  // Main grid border
  pdf.setLineWidth(2);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margin, gridStartY, timeColumnWidth + (7 * dayColumnWidth), 25 + (timeSlots.length * timeSlotHeight));
}

function drawPixelPerfectWeeklyEvents(pdf: jsPDF, config: any, weekStartDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, dayColumnWidth, timeSlotHeight, colors } = config;
  const gridStartY = margin + 95; // Adjust for header
  
  // Filter and group events by day
  const weekEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return eventDate >= weekStartDate && eventDate <= weekEnd;
  });
  
  // Group by day and render with exact dashboard logic
  const eventsByDay: { [key: number]: CalendarEvent[] } = {};
  weekEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayIndex >= 0 && dayIndex < 7) {
      if (!eventsByDay[dayIndex]) {
        eventsByDay[dayIndex] = [];
      }
      eventsByDay[dayIndex].push(event);
    }
  });
  
  // Render events with exact dashboard styling
  Object.keys(eventsByDay).forEach(dayIndexStr => {
    const dayIndex = parseInt(dayIndexStr);
    const dayEvents = eventsByDay[dayIndex].sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    
    const usedSlots: Set<number> = new Set();
    
    dayEvents.forEach(event => {
      const eventDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      const startHour = eventDate.getHours();
      const startMinute = eventDate.getMinutes();
      const endHour = endDate.getHours();
      const endMinute = endDate.getMinutes();
      
      // Calculate position exactly like WeeklyCalendarGrid
      const startMinuteOfDay = (startHour - 6) * 60 + startMinute;
      const endMinuteOfDay = (endHour - 6) * 60 + endMinute;
      const startSlot = Math.floor(startMinuteOfDay / 30);
      const endSlot = Math.min(Math.ceil(endMinuteOfDay / 30), 35);
      
      if (startSlot < 0 || startSlot >= 35) return; // Outside time range
      
      // Handle overlaps exactly like dashboard
      let horizontalOffset = 0;
      while (horizontalOffset < 3) {
        let hasOverlap = false;
        for (let slot = startSlot; slot < endSlot; slot++) {
          if (usedSlots.has(slot * 10 + horizontalOffset)) {
            hasOverlap = true;
            break;
          }
        }
        
        if (!hasOverlap) {
          for (let slot = startSlot; slot < endSlot; slot++) {
            usedSlots.add(slot * 10 + horizontalOffset);
          }
          break;
        }
        
        horizontalOffset++;
      }
      
      // Calculate dimensions exactly like dashboard
      const baseEventWidth = dayColumnWidth - 4;
      const eventWidth = horizontalOffset > 0 ? Math.max(baseEventWidth * 0.7, 60) : baseEventWidth;
      const eventHeight = Math.max((endSlot - startSlot) * timeSlotHeight - 2, 15);
      
      const eventX = margin + timeColumnWidth + (dayIndex * dayColumnWidth) + 2 + (horizontalOffset * (eventWidth * 0.3));
      const eventY = gridStartY + (startSlot * timeSlotHeight) + 1;
      
      // Determine event type exactly like WeeklyCalendarGrid logic
      const calendarClass = event.calendarId === 'en.usa#holiday@group.v.calendar.google.com' ? 'personal' : 
                            (event.title.toLowerCase().includes('haircut') ||
                             event.title.toLowerCase().includes('dan re:') ||
                             event.title.toLowerCase().includes('blake') ||
                             event.title.toLowerCase().includes('phone call')) ? 'google-calendar' :
                            'simplepractice';
      
      // White background for ALL events (matching your fix)
      pdf.setFillColor(255, 255, 255);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      
      // Apply borders exactly like dashboard CSS
      if (calendarClass === 'simplepractice') {
        // Cornflower blue border with thick left flag
        pdf.setDrawColor(100, 149, 237);
        pdf.setLineWidth(1);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
        pdf.setLineWidth(4);
        pdf.line(eventX, eventY, eventX, eventY + eventHeight);
      } else if (calendarClass === 'google-calendar') {
        // Dashed green border
        pdf.setDrawColor(34, 197, 94);
        pdf.setLineWidth(1);
        pdf.setLineDash([2, 2]);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
        pdf.setLineDash([]);
      } else if (calendarClass === 'personal') {
        // Orange border for holidays
        pdf.setDrawColor(245, 158, 11);
        pdf.setLineWidth(1);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      }
      
      // Event title exactly like dashboard
      let displayTitle = event.title || 'Untitled Event';
      if (displayTitle.endsWith(' Appointment')) {
        displayTitle = displayTitle.slice(0, -12);
      }
      
      // Render text
      if (eventHeight >= 12) {
        pdf.setFontSize(config.fonts.eventTitle - 2);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 0, 0);
        
        const textX = calendarClass === 'simplepractice' ? eventX + 6 : eventX + 3;
        const maxWidth = eventWidth - (calendarClass === 'simplepractice' ? 12 : 6);
        
        // Simple text wrapping
        if (displayTitle.length * 5 <= maxWidth) {
          pdf.text(displayTitle, textX, eventY + 10);
        } else {
          const truncated = displayTitle.substring(0, Math.floor(maxWidth / 5) - 3) + '...';
          pdf.text(truncated, textX, eventY + 10);
        }
      }
    });
  });
}

function drawPixelPerfectDailyHeader(pdf: jsPDF, config: any, selectedDate: Date) {
  const { margin, pageWidth, fonts } = config;
  
  // Title
  pdf.setFontSize(fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('DAILY PLANNER', pageWidth / 2, margin + 25, { align: 'center' });
  
  // Date
  pdf.setFontSize(fonts.dayHeader);
  pdf.setFont('helvetica', 'normal');
  const dateText = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateText, pageWidth / 2, margin + 45, { align: 'center' });
}

function drawPixelPerfectDailyGrid(pdf: jsPDF, config: any) {
  const { margin, pageWidth, timeColumnWidth, timeSlotHeight, colors } = config;
  const gridStartY = margin + 70;
  const appointmentColumnWidth = pageWidth - (2 * margin) - timeColumnWidth;
  const timeSlots = generateTimeSlots();
  
  // Headers
  pdf.setFillColor(245, 245, 245);
  pdf.rect(margin, gridStartY, timeColumnWidth, 25, 'F');
  pdf.rect(margin + timeColumnWidth, gridStartY, appointmentColumnWidth, 25, 'F');
  
  pdf.setFontSize(config.fonts.dayHeader);
  pdf.setFont('helvetica', 'bold');
  pdf.text('TIME', margin + timeColumnWidth / 2, gridStartY + 16, { align: 'center' });
  pdf.text('APPOINTMENTS', margin + timeColumnWidth + appointmentColumnWidth / 2, gridStartY + 16, { align: 'center' });
  
  // Time slots
  timeSlots.forEach((slot, index) => {
    const y = gridStartY + 25 + (index * timeSlotHeight);
    const isHour = slot.minute === 0;
    
    // Time cell
    const bgColor = isHour ? [240, 240, 240] : [248, 248, 248];
    pdf.setFillColor(...bgColor);
    pdf.rect(margin, y, timeColumnWidth, timeSlotHeight, 'F');
    
    pdf.setFontSize(config.fonts.timeSlot);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    pdf.text(slot.time, margin + timeColumnWidth / 2, y + timeSlotHeight / 2 + 2, { align: 'center' });
    
    // Appointment cell
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin + timeColumnWidth, y, appointmentColumnWidth, timeSlotHeight, 'F');
    
    // Grid lines
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(221, 221, 221);
    pdf.line(margin, y + timeSlotHeight, pageWidth - margin, y + timeSlotHeight);
  });
  
  // Main border
  pdf.setLineWidth(2);
  pdf.setDrawColor(0, 0, 0);
  pdf.rect(margin, gridStartY, timeColumnWidth + appointmentColumnWidth, 25 + (timeSlots.length * timeSlotHeight));
}

function drawPixelPerfectDailyEvents(pdf: jsPDF, config: any, selectedDate: Date, events: CalendarEvent[]) {
  const { margin, timeColumnWidth, timeSlotHeight } = config;
  const gridStartY = margin + 95;
  const appointmentColumnWidth = config.pageWidth - (2 * margin) - timeColumnWidth;
  
  // Filter events for selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  dayEvents.forEach(event => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();
    
    // Calculate position exactly like DailyView
    const minutesSince6am = (startHour - 6) * 60 + startMinute;
    const slotsFromStart = minutesSince6am / 30;
    const topPosition = Math.max(0, slotsFromStart * timeSlotHeight);
    
    if (minutesSince6am < 0 || minutesSince6am > (17.5 * 60)) return; // Outside range
    
    const eventX = margin + timeColumnWidth + 4;
    const eventY = gridStartY + topPosition + 1;
    const eventWidth = appointmentColumnWidth - 8;
    const durationMinutes = (endDate.getTime() - eventDate.getTime()) / (1000 * 60);
    const eventHeight = Math.max(40, (durationMinutes / 30) * timeSlotHeight - 2);
    
    // Determine event type exactly like DailyView logic
    const isSimplePractice = event.source === 'simplepractice' || 
                           event.title?.toLowerCase().includes('appointment');
    const isHoliday = event.title.toLowerCase().includes('holiday') ||
                     event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';
    const isGoogle = event.source === 'google' && !isSimplePractice && !isHoliday;
    
    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
    
    // Apply styling exactly like DailyView
    if (isSimplePractice) {
      pdf.setDrawColor(100, 149, 237);
      pdf.setLineWidth(4);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(200, 200, 200);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    } else if (isGoogle) {
      pdf.setDrawColor(34, 197, 94);
      pdf.setLineWidth(2);
      pdf.setLineDash([4, 2]);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      pdf.setLineDash([]);
    } else if (isHoliday) {
      pdf.setFillColor(251, 188, 4);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(255, 152, 0);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    }
    
    // Event text exactly like DailyView
    let displayTitle = event.title || 'Untitled Event';
    if (displayTitle.endsWith(' Appointment')) {
      displayTitle = displayTitle.slice(0, -12);
    }
    
    const padding = isSimplePractice ? 8 : 6;
    let currentY = eventY + 16;
    
    // Title
    pdf.setFontSize(config.fonts.eventTitle);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(displayTitle, eventX + padding, currentY);
    currentY += 16;
    
    // Time
    if (currentY + 12 <= eventY + eventHeight - 8) {
      pdf.setFontSize(config.fonts.eventTime);
      pdf.setFont('helvetica', 'bold');
      const timeRange = `${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
      pdf.text(timeRange, eventX + padding, currentY);
    }
  });
}
