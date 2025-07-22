/**
 * Fixed Dynamic Daily Planner PDF Export for reMarkable
 * Comprehensive solution that addresses all issues and integrates with bidirectional linking
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CalendarEvent } from '../types/calendar';
import { format } from 'date-fns';

// US Letter configuration for reMarkable compatibility
const PDF_CONFIG = {
  format: 'letter' as const,
  orientation: 'portrait' as const,
  unit: 'pt' as const,
  compress: false,
  precision: 2,
  dimensions: {
    width: 612,  // 8.5 inches
    height: 792, // 11 inches
    margin: 36   // 0.5 inch margins
  }
};

/**
 * Enhanced Dynamic Daily Planner PDF Export
 * Fixes the finalWidth error and ensures proper reMarkable compatibility
 */
export async function exportFixedDynamicDailyPlannerPDF(
  date: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🚀 Starting Fixed Dynamic Daily Planner PDF Export');
    console.log('📅 Date:', format(date, 'yyyy-MM-dd'));
    console.log('📋 Events:', events.length);

    // Filter events for the selected date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });

    console.log('📊 Day events:', dayEvents.length);

    // Create PDF document
    const pdf = new jsPDF(PDF_CONFIG);
    console.log('✅ PDF document created');

    // Generate complete daily planner layout
    await generateDailyPlannerLayout(pdf, date, dayEvents);

    // Generate filename
    const filename = `Daily_Planner_${format(date, 'yyyy-MM-dd')}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
    
    console.log('✅ Fixed Dynamic Daily Planner PDF exported successfully:', filename);
    
  } catch (error) {
    console.error('❌ Fixed Dynamic Daily Planner PDF export failed:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate complete daily planner layout directly in PDF
 */
async function generateDailyPlannerLayout(
  pdf: jsPDF,
  date: Date,
  events: CalendarEvent[]
): Promise<void> {
  const config = PDF_CONFIG.dimensions;
  const pageWidth = config.width;
  const pageHeight = config.height;
  const margin = config.margin;
  
  // Calculate layout dimensions
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);
  const headerHeight = 120;
  const timeColumnWidth = 80;
  const appointmentColumnWidth = contentWidth - timeColumnWidth;
  
  // Clear background
  pdf.setFillColor(250, 250, 247); // #FAFAF7
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Header Section
  await drawHeader(pdf, date, events, margin, headerHeight, contentWidth);
  
  // Time Grid Section
  const gridStartY = margin + headerHeight;
  const timeSlotHeight = 18;
  const totalSlots = 36; // 6:00 AM to 11:30 PM
  
  await drawTimeGrid(pdf, margin, gridStartY, timeColumnWidth, appointmentColumnWidth, timeSlotHeight, totalSlots);
  
  // Events Section
  await drawEvents(pdf, events, margin, gridStartY, timeColumnWidth, appointmentColumnWidth, timeSlotHeight);
  
  // Footer Section
  await drawFooter(pdf, date, margin, pageHeight);
}

/**
 * Draw header section with navigation and statistics
 */
async function drawHeader(
  pdf: jsPDF,
  date: Date,
  events: CalendarEvent[],
  margin: number,
  headerHeight: number,
  contentWidth: number
): Promise<void> {
  const pageWidth = PDF_CONFIG.dimensions.width;
  
  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(0, 0, 0);
  pdf.text('DAILY PLANNER', pageWidth / 2, margin + 35, { align: 'center' });
  
  // Date
  const dateStr = format(date, 'EEEE, MMMM dd, yyyy');
  pdf.setFontSize(16);
  pdf.text(dateStr, pageWidth / 2, margin + 60, { align: 'center' });
  
  // Event count
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.text(`${events.length} appointments scheduled`, pageWidth / 2, margin + 80, { align: 'center' });
  
  // Navigation buttons (visual representation)
  const navY = margin + headerHeight - 30;
  const buttonWidth = 120;
  const buttonHeight = 20;
  
  // Back to Weekly button
  pdf.setFillColor(240, 240, 240);
  pdf.rect(pageWidth / 2 - buttonWidth / 2, navY, buttonWidth, buttonHeight, 'F');
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(pageWidth / 2 - buttonWidth / 2, navY, buttonWidth, buttonHeight, 'S');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text('← Back to Weekly', pageWidth / 2, navY + 12, { align: 'center' });
  
  // Legend
  await drawLegend(pdf, margin, navY + 30, contentWidth);
}

/**
 * Draw legend for event types
 */
async function drawLegend(
  pdf: jsPDF,
  margin: number,
  y: number,
  contentWidth: number
): Promise<void> {
  const legendItems = [
    { label: 'SimplePractice', color: [100, 149, 237], style: 'solid' },
    { label: 'Google Calendar', color: [34, 197, 94], style: 'dashed' },
    { label: 'Holidays', color: [245, 158, 11], style: 'solid' }
  ];
  
  const itemWidth = contentWidth / 3;
  const boxSize = 12;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  
  legendItems.forEach((item, index) => {
    const x = margin + (index * itemWidth);
    
    // Legend box
    pdf.setFillColor(255, 255, 255);
    pdf.rect(x, y, boxSize, boxSize, 'F');
    
    pdf.setDrawColor(item.color[0], item.color[1], item.color[2]);
    pdf.setLineWidth(1);
    
    if (item.style === 'dashed') {
      pdf.setLineDash([2, 2]);
    }
    
    pdf.rect(x, y, boxSize, boxSize, 'S');
    pdf.setLineDash([]);
    
    // Legend text
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, x + boxSize + 5, y + 8);
  });
}

/**
 * Draw time grid with proper formatting
 */
async function drawTimeGrid(
  pdf: jsPDF,
  margin: number,
  gridStartY: number,
  timeColumnWidth: number,
  appointmentColumnWidth: number,
  timeSlotHeight: number,
  totalSlots: number
): Promise<void> {
  const pageWidth = PDF_CONFIG.dimensions.width;
  
  // Column headers
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setFillColor(240, 240, 240);
  
  // Time column header
  pdf.rect(margin, gridStartY, timeColumnWidth, 25, 'F');
  pdf.setDrawColor(180, 180, 180);
  pdf.rect(margin, gridStartY, timeColumnWidth, 25, 'S');
  pdf.setTextColor(0, 0, 0);
  pdf.text('TIME', margin + timeColumnWidth / 2, gridStartY + 16, { align: 'center' });
  
  // Appointment column header
  pdf.rect(margin + timeColumnWidth, gridStartY, appointmentColumnWidth, 25, 'F');
  pdf.rect(margin + timeColumnWidth, gridStartY, appointmentColumnWidth, 25, 'S');
  pdf.text('APPOINTMENTS', margin + timeColumnWidth + appointmentColumnWidth / 2, gridStartY + 16, { align: 'center' });
  
  // Time slots
  const timeGridStartY = gridStartY + 25;
  
  for (let slot = 0; slot < totalSlots; slot++) {
    const hour = 6 + Math.floor(slot / 2);
    const minute = (slot % 2) * 30;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const slotY = timeGridStartY + (slot * timeSlotHeight);
    const isTopOfHour = minute === 0;
    
    // Time slot background
    pdf.setFillColor(isTopOfHour ? 245 : 248, isTopOfHour ? 245 : 248, isTopOfHour ? 245 : 248);
    pdf.rect(margin, slotY, pageWidth - (margin * 2), timeSlotHeight, 'F');
    
    // Time label
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', isTopOfHour ? 'bold' : 'normal');
    pdf.setFontSize(10);
    pdf.text(timeStr, margin + timeColumnWidth - 5, slotY + 12, { align: 'right' });
    
    // Grid lines
    pdf.setDrawColor(isTopOfHour ? 180 : 220, isTopOfHour ? 180 : 220, isTopOfHour ? 180 : 220);
    pdf.setLineWidth(isTopOfHour ? 1 : 0.5);
    pdf.line(margin, slotY, pageWidth - margin, slotY);
  }
  
  // Vertical separator
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(2);
  pdf.line(margin + timeColumnWidth, gridStartY, margin + timeColumnWidth, timeGridStartY + (totalSlots * timeSlotHeight));
}

/**
 * Draw events in the appointment column
 */
async function drawEvents(
  pdf: jsPDF,
  events: CalendarEvent[],
  margin: number,
  gridStartY: number,
  timeColumnWidth: number,
  appointmentColumnWidth: number,
  timeSlotHeight: number
): Promise<void> {
  const timeGridStartY = gridStartY + 25;
  
  events.forEach(event => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlot >= 0 && startSlot < 36) {
      const eventX = margin + timeColumnWidth + 2;
      const eventY = timeGridStartY + (startSlot * timeSlotHeight) + 1;
      const eventWidth = appointmentColumnWidth - 4;
      const eventHeight = Math.max((endSlot - startSlot) * timeSlotHeight - 2, timeSlotHeight - 2);
      
      // Event background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      
      // Event border based on source
      if (event.source === 'simplepractice' || event.title?.includes('Appointment')) {
        pdf.setDrawColor(100, 149, 237); // SimplePractice blue
        pdf.setLineWidth(1);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
        // Left flag
        pdf.setFillColor(100, 149, 237);
        pdf.rect(eventX, eventY, 4, eventHeight, 'F');
      } else if (event.source === 'google') {
        pdf.setDrawColor(34, 197, 94); // Google Calendar green
        pdf.setLineWidth(1);
        pdf.setLineDash([3, 2]);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
        pdf.setLineDash([]);
      } else {
        pdf.setDrawColor(245, 158, 11); // Holiday orange
        pdf.setLineWidth(1);
        pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      }
      
      // Event text
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      
      const eventTitle = event.title || 'Untitled Event';
      const cleanTitle = eventTitle.replace(' Appointment', '').trim();
      const timeRange = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;
      
      pdf.text(cleanTitle, eventX + 8, eventY + 15);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(event.source || 'Manual', eventX + 8, eventY + 28);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(timeRange, eventX + 8, eventY + 45);
      
      // Event notes and action items (if present)
      if (event.notes || event.actionItems) {
        const hasNotes = event.notes && event.notes.trim();
        const hasActions = event.actionItems && event.actionItems.trim();
        
        if (hasNotes || hasActions) {
          const notesY = eventY + 60;
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          
          if (hasNotes) {
            pdf.text('Notes:', eventX + 8, notesY);
            const noteLines = event.notes!.split('\n').slice(0, 2); // Limit to 2 lines
            noteLines.forEach((line, index) => {
              pdf.text(`• ${line.trim()}`, eventX + 12, notesY + 12 + (index * 10));
            });
          }
          
          if (hasActions) {
            const actionY = hasNotes ? notesY + 35 : notesY;
            pdf.text('Actions:', eventX + 8, actionY);
            const actionLines = event.actionItems!.split('\n').slice(0, 2); // Limit to 2 lines
            actionLines.forEach((line, index) => {
              pdf.text(`• ${line.trim()}`, eventX + 12, actionY + 12 + (index * 10));
            });
          }
        }
      }
    }
  });
}

/**
 * Draw footer with navigation
 */
async function drawFooter(
  pdf: jsPDF,
  date: Date,
  margin: number,
  pageHeight: number
): Promise<void> {
  const pageWidth = PDF_CONFIG.dimensions.width;
  const footerY = pageHeight - margin + 10;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  
  const footerText = `Daily Planner • ${format(date, 'EEEE, MMMM dd, yyyy')}`;
  pdf.text(footerText, pageWidth / 2, footerY, { align: 'center' });
}

// Export compatibility functions
export const exportDynamicDailyPlannerPDF = exportFixedDynamicDailyPlannerPDF;
export const exportDynamicDailyPlannerToPDF = exportFixedDynamicDailyPlannerPDF;