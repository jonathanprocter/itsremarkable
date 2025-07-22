
import { CalendarEvent } from '../types/calendar';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PDFConfig {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  timeColumnWidth: number;
  headerHeight: number;
  timeSlotHeight: number;
  startHour: number;
  endHour: number;
}

const PDF_CONFIG: PDFConfig = {
  pageWidth: 612, // US Letter width
  pageHeight: 1584, // Extended height to fit full day (2x normal to prevent cutoff)
  margin: 20,
  timeColumnWidth: 80,
  headerHeight: 60,
  timeSlotHeight: 40,
  startHour: 6,
  endHour: 23
};

export const exportComprehensiveDailyPDF = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('🎯 Starting Comprehensive Daily PDF Export...');
    console.log(`📅 Date: ${selectedDate.toDateString()}`);
    console.log(`📊 Total events: ${events.length}`);

    // Filter events for the selected date
    const dayEvents = filterEventsForDate(events, selectedDate);
    console.log(`📋 Events for this date: ${dayEvents.length}`);

    // Create the PDF document with extended height
    const pdf = new jsPDF('portrait', 'pt', [PDF_CONFIG.pageWidth, PDF_CONFIG.pageHeight]);
    
    // Generate the comprehensive daily view
    await generateComprehensiveDailyView(pdf, selectedDate, dayEvents);
    
    // Save the PDF
    const fileName = `comprehensive-daily-${formatDateForFilename(selectedDate)}.pdf`;
    pdf.save(fileName);
    
    console.log(`✅ Comprehensive daily PDF exported: ${fileName}`);
  } catch (error) {
    console.error('❌ Error exporting comprehensive daily PDF:', error);
    throw error;
  }
};

const filterEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const targetDateStr = date.toISOString().split('T')[0];
  
  return events.filter(event => {
    const eventDate = new Date(event.startTime).toISOString().split('T')[0];
    return eventDate === targetDateStr;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
};

const generateComprehensiveDailyView = async (
  pdf: jsPDF,
  date: Date,
  events: CalendarEvent[]
): Promise<void> => {
  const { pageWidth, margin, timeColumnWidth, headerHeight, timeSlotHeight, startHour, endHour } = PDF_CONFIG;
  
  // Set font
  pdf.setFont('helvetica', 'normal');
  
  // 1. HEADER SECTION - only render once at top
  drawHeader(pdf, date, events.length);
  
  // 2. TIME GRID BACKGROUND - consistent light grey throughout
  drawTimeGridBackground(pdf);
  
  // 3. TIME LABELS - left column with proper alignment
  drawTimeLabels(pdf);
  
  // 4. APPOINTMENTS - properly aligned to time slots
  drawAppointments(pdf, events);
  
  // 5. FOOTER/NAVIGATION - ensure it's included at bottom
  drawFooterNavigation(pdf);
};

const drawHeader = (pdf: jsPDF, date: Date, eventCount: number): void => {
  const { pageWidth, margin, headerHeight } = PDF_CONFIG;
  
  // Header background
  pdf.setFillColor(248, 249, 250);
  pdf.rect(margin, margin, pageWidth - 2 * margin, headerHeight, 'F');
  
  // Date title
  pdf.setFontSize(24);
  pdf.setTextColor(34, 34, 34);
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  pdf.text(dateStr, margin + 20, margin + 35);
  
  // Event count
  pdf.setFontSize(12);
  pdf.setTextColor(107, 114, 128);
  pdf.text(`${eventCount} appointments`, margin + 20, margin + 55);
};

const drawTimeGridBackground = (pdf: jsPDF): void => {
  const { pageWidth, margin, timeColumnWidth, headerHeight, timeSlotHeight, startHour, endHour } = PDF_CONFIG;
  
  // CRITICAL: Light grey background for entire time column - no dark blue!
  pdf.setFillColor(248, 250, 252); // Very light grey
  
  const gridStartY = margin + headerHeight + 20;
  const totalSlots = (endHour - startHour + 1) * 2; // 30-minute slots
  const totalGridHeight = totalSlots * timeSlotHeight;
  
  // Fill entire left time column with consistent light grey
  pdf.rect(margin, gridStartY, timeColumnWidth, totalGridHeight, 'F');
  
  // Main content area background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(margin + timeColumnWidth, gridStartY, pageWidth - margin - timeColumnWidth - margin, totalGridHeight, 'F');
  
  // Draw grid lines
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(0.5);
  
  // Horizontal lines for each time slot
  for (let i = 0; i <= totalSlots; i++) {
    const y = gridStartY + i * timeSlotHeight;
    pdf.line(margin, y, pageWidth - margin, y);
  }
  
  // Vertical line separating time column from content
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, gridStartY + totalGridHeight);
};

const drawTimeLabels = (pdf: jsPDF): void => {
  const { margin, timeColumnWidth, headerHeight, timeSlotHeight, startHour, endHour } = PDF_CONFIG;
  
  pdf.setFontSize(11);
  pdf.setTextColor(75, 85, 99);
  
  const gridStartY = margin + headerHeight + 20;
  
  // Draw time labels for each hour
  for (let hour = startHour; hour <= endHour; hour++) {
    const timeStr = `${hour.toString().padStart(2, '0')}:00`;
    const slotIndex = (hour - startHour) * 2;
    const y = gridStartY + slotIndex * timeSlotHeight + 25;
    
    // Center text in time column
    const textWidth = pdf.getTextWidth(timeStr);
    const x = margin + (timeColumnWidth - textWidth) / 2;
    pdf.text(timeStr, x, y);
  }
};

const drawAppointments = (pdf: jsPDF, events: CalendarEvent[]): void => {
  const { pageWidth, margin, timeColumnWidth, headerHeight, timeSlotHeight, startHour } = PDF_CONFIG;
  
  const gridStartY = margin + headerHeight + 20;
  const appointmentAreaWidth = pageWidth - margin - timeColumnWidth - margin - 20;
  
  events.forEach((event, index) => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    // Calculate position based on exact time alignment
    const startHours = startTime.getHours() + startTime.getMinutes() / 60;
    const endHours = endTime.getHours() + endTime.getMinutes() / 60;
    
    const startSlot = (startHours - startHour) * 2;
    const duration = endHours - startHours;
    const slotHeight = duration * 2 * timeSlotHeight;
    
    // Position precisely aligned with time grid
    const x = margin + timeColumnWidth + 10;
    const y = gridStartY + startSlot * timeSlotHeight + 2;
    const height = Math.max(slotHeight - 4, 60); // Minimum readable height
    
    // Draw appointment background
    const color = getAppointmentColor(event.source);
    pdf.setFillColor(color.r, color.g, color.b);
    pdf.rect(x, y, appointmentAreaWidth - 20, height, 'F');
    
    // Draw appointment border
    pdf.setDrawColor(color.r - 20, color.g - 20, color.b - 20);
    pdf.setLineWidth(1);
    pdf.rect(x, y, appointmentAreaWidth - 20, height, 'S');
    
    // Draw appointment content
    drawAppointmentContent(pdf, event, x + 10, y + 15, appointmentAreaWidth - 40, height - 20);
  });
};

const drawAppointmentContent = (
  pdf: jsPDF,
  event: CalendarEvent,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
): void => {
  // Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(34, 34, 34);
  
  const cleanTitle = event.title.replace(/[^\w\s-]/gi, '').trim();
  const titleLines = pdf.splitTextToSize(cleanTitle, maxWidth - 20);
  pdf.text(titleLines[0], x, y);
  
  // Time
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const timeStr = `${formatTime(startTime)} - ${formatTime(endTime)}`;
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text(timeStr, x, y + 20);
  
  // Notes and Action Items if present
  let currentY = y + 40;
  
  if (event.notes && event.notes.trim()) {
    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    pdf.text('Notes:', x, currentY);
    currentY += 15;
    
    const notesLines = pdf.splitTextToSize(event.notes.trim(), maxWidth - 20);
    pdf.text(notesLines, x + 10, currentY);
    currentY += notesLines.length * 12 + 10;
  }
  
  if (event.actionItems && event.actionItems.trim()) {
    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    pdf.text('Action Items:', x, currentY);
    currentY += 15;
    
    const actionLines = pdf.splitTextToSize(event.actionItems.trim(), maxWidth - 20);
    pdf.text(actionLines, x + 10, currentY);
  }
};

const drawFooterNavigation = (pdf: jsPDF): void => {
  const { pageWidth, pageHeight, margin } = PDF_CONFIG;
  
  // Footer background - ensure it's at the very bottom
  const footerHeight = 50;
  const footerY = pageHeight - footerHeight - margin;
  
  pdf.setFillColor(248, 249, 250);
  pdf.rect(margin, footerY, pageWidth - 2 * margin, footerHeight, 'F');
  
  // Navigation buttons
  pdf.setFontSize(12);
  pdf.setTextColor(34, 34, 34);
  pdf.text('← Previous Day', margin + 20, footerY + 25);
  pdf.text('Weekly Overview', margin + 150, footerY + 25);
  pdf.text('Next Day →', margin + 280, footerY + 25);
  
  // Border
  pdf.setDrawColor(229, 231, 235);
  pdf.setLineWidth(1);
  pdf.rect(margin, footerY, pageWidth - 2 * margin, footerHeight, 'S');
};

const getAppointmentColor = (source: string): { r: number; g: number; b: number } => {
  switch (source) {
    case 'google':
      return { r: 219, g: 234, b: 254 }; // Light blue
    case 'simplepractice':
      return { r: 220, g: 252, b: 231 }; // Light green
    default:
      return { r: 249, g: 250, b: 251 }; // Light grey
  }
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatDateForFilename = (date: Date): string => {
  return date.toISOString().split('T')[0];
};
