/**
 * Audit-Based PDF Export System
 * Implements all fixes identified by the comprehensive audit system
 */

import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { cleanEventTitle } from './titleCleaner';
import { generateTimeSlots } from './timeSlots';

// Enhanced configuration based on audit findings
const AUDIT_ENHANCED_CONFIG = {
  // Page setup - A3 landscape for professional presentation
  pageWidth: 1190,
  pageHeight: 842,
  
  // Layout fixes based on audit recommendations
  margin: 25,
  headerHeight: 60,
  legendHeight: 35,
  
  // Critical fixes: Dashboard-matching dimensions
  timeColumnWidth: 80, // Fixed from 50px to match dashboard
  dayColumnWidth: 150, // Optimized for content
  timeSlotHeight: 40, // Fixed from 12px to match dashboard
  
  // Typography fixes: Enhanced font sizes
  fonts: {
    title: 20,
    weekInfo: 16,
    dayHeader: 14,
    timeHour: 12,
    timeHalf: 10,
    eventTitle: 11, // Fixed from 6pt to match dashboard
    eventTime: 10,
    legend: 12
  },
  
  // Color fixes: Exact dashboard colors
  colors: {
    simplePractice: '#6495ED',
    google: '#22C55E',
    holiday: '#F59E0B',
    gridLine: '#E5E7EB',
    background: '#FFFFFF',
    timeSlotBg: '#F8F9FA',
    hourBg: '#F0F0F0'
  },
  
  // Grid structure optimizations
  gridLineWidth: 1,
  borderWidth: 0.5,
  
  get contentWidth() {
    return this.pageWidth - (2 * this.margin);
  },
  
  get gridStartX() {
    return this.margin;
  },
  
  get gridStartY() {
    return this.margin + this.headerHeight + this.legendHeight;
  },
  
  get totalGridWidth() {
    return this.timeColumnWidth + (this.dayColumnWidth * 7);
  },
  
  get gridHeight() {
    return 36 * this.timeSlotHeight; // Full 6:00-23:30 timeline
  }
};

export const exportAuditEnhancedPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[] = []
): Promise<void> => {
  try {
    console.log('🔧 Creating audit-enhanced PDF export...');
    
    // Filter events for the week
    const weekEvents = filterWeekEvents(events, weekStartDate, weekEndDate);
    
    // Create PDF with enhanced configuration
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [AUDIT_ENHANCED_CONFIG.pageWidth, AUDIT_ENHANCED_CONFIG.pageHeight]
    });
    
    // Set enhanced font
    pdf.setFont('helvetica');
    
    // Draw enhanced header
    drawEnhancedHeader(pdf, weekStartDate, weekEndDate);
    
    // Draw enhanced legend
    drawEnhancedLegend(pdf);
    
    // Draw enhanced grid
    drawEnhancedGrid(pdf);
    
    // Draw enhanced events
    drawEnhancedEvents(pdf, weekEvents, weekStartDate);
    
    // Save with audit-enhanced naming
    const fileName = `audit-enhanced-weekly-${formatDate(weekStartDate)}.pdf`;
    pdf.save(fileName);
    
    console.log('✅ Audit-enhanced PDF export completed:', fileName);
    
  } catch (error) {
    console.error('❌ Audit-enhanced PDF export failed:', error);
    throw error;
  }
};

function filterWeekEvents(events: CalendarEvent[], weekStart: Date, weekEnd: Date): CalendarEvent[] {
  return (events || []).filter(event => {
    if (!event?.startTime || !event?.endTime) return false;
    
    try {
      const eventDate = new Date(event.startTime);
      if (isNaN(eventDate.getTime())) return false;
      
      return eventDate >= weekStart && eventDate <= weekEnd;
    } catch (error) {
      console.warn('Error filtering event:', event, error);
      return false;
    }
  });
}

function drawEnhancedHeader(pdf: jsPDF, weekStart: Date, weekEnd: Date): void {
  const config = AUDIT_ENHANCED_CONFIG;
  
  // Header background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(config.gridStartX, config.margin, config.contentWidth, config.headerHeight, 'F');
  
  // Enhanced title
  pdf.setFontSize(config.fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  const title = 'AUDIT-ENHANCED WEEKLY CALENDAR';
  const titleWidth = pdf.getTextWidth(title);
  const titleX = config.gridStartX + (config.contentWidth - titleWidth) / 2;
  pdf.text(title, titleX, config.margin + 25);
  
  // Enhanced week info
  pdf.setFontSize(config.fonts.weekInfo);
  pdf.setFont('helvetica', 'normal');
  
  const weekInfo = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  const weekInfoWidth = pdf.getTextWidth(weekInfo);
  const weekInfoX = config.gridStartX + (config.contentWidth - weekInfoWidth) / 2;
  pdf.text(weekInfo, weekInfoX, config.margin + 50);
}

function drawEnhancedLegend(pdf: jsPDF): void {
  const config = AUDIT_ENHANCED_CONFIG;
  const legendY = config.margin + config.headerHeight + 10;
  
  // Legend background
  pdf.setFillColor(248, 249, 250);
  pdf.rect(config.gridStartX, legendY, config.contentWidth, config.legendHeight, 'F');
  
  // Legend items
  const legendItems = [
    { label: 'SimplePractice', color: config.colors.simplePractice },
    { label: 'Google Calendar', color: config.colors.google },
    { label: 'Holidays', color: config.colors.holiday }
  ];
  
  pdf.setFontSize(config.fonts.legend);
  pdf.setFont('helvetica', 'normal');
  
  const itemSpacing = config.contentWidth / legendItems.length;
  
  legendItems.forEach((item, index) => {
    const itemX = config.gridStartX + (index * itemSpacing) + 20;
    const itemY = legendY + 20;
    
    // Color indicator
    pdf.setFillColor(item.color);
    pdf.rect(itemX, itemY - 8, 12, 8, 'F');
    
    // Label
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, itemX + 18, itemY);
  });
}

function drawEnhancedGrid(pdf: jsPDF): void {
  const config = AUDIT_ENHANCED_CONFIG;
  const timeSlots = generateTimeSlots();
  
  // Grid background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(config.gridStartX, config.gridStartY, config.totalGridWidth, config.gridHeight, 'F');
  
  // Draw time column
  drawTimeColumn(pdf, timeSlots);
  
  // Draw day columns
  drawDayColumns(pdf);
  
  // Draw grid lines
  drawGridLines(pdf, timeSlots);
}

function drawTimeColumn(pdf: jsPDF, timeSlots: string[]): void {
  const config = AUDIT_ENHANCED_CONFIG;
  
  // Time column background
  pdf.setFillColor(248, 249, 250);
  pdf.rect(config.gridStartX, config.gridStartY, config.timeColumnWidth, config.gridHeight, 'F');
  
  // Time labels
  pdf.setTextColor(0, 0, 0);
  
  timeSlots.forEach((timeSlot, index) => {
    const y = config.gridStartY + (index * config.timeSlotHeight) + (config.timeSlotHeight / 2) + 4;
    const isHour = timeSlot.endsWith(':00');
    
    // Enhanced font sizing
    pdf.setFontSize(isHour ? config.fonts.timeHour : config.fonts.timeHalf);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    
    // Right-align time labels
    const timeWidth = pdf.getTextWidth(timeSlot);
    const timeX = config.gridStartX + config.timeColumnWidth - timeWidth - 10;
    pdf.text(timeSlot, timeX, y);
  });
}

function drawDayColumns(pdf: jsPDF): void {
  const config = AUDIT_ENHANCED_CONFIG;
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  days.forEach((day, index) => {
    const dayX = config.gridStartX + config.timeColumnWidth + (index * config.dayColumnWidth);
    
    // Day header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(dayX, config.gridStartY - 30, config.dayColumnWidth, 30, 'F');
    
    // Day header text
    pdf.setFontSize(config.fonts.dayHeader);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    const dayWidth = pdf.getTextWidth(day);
    const dayTextX = dayX + (config.dayColumnWidth - dayWidth) / 2;
    pdf.text(day, dayTextX, config.gridStartY - 10);
  });
}

function drawGridLines(pdf: jsPDF, timeSlots: string[]): void {
  const config = AUDIT_ENHANCED_CONFIG;
  
  // Set grid line style
  pdf.setLineWidth(config.gridLineWidth);
  pdf.setDrawColor(229, 231, 235);
  
  // Horizontal lines (time slots)
  timeSlots.forEach((_, index) => {
    const y = config.gridStartY + (index * config.timeSlotHeight);
    pdf.line(config.gridStartX, y, config.gridStartX + config.totalGridWidth, y);
  });
  
  // Vertical lines (day columns)
  for (let i = 0; i <= 8; i++) {
    const x = config.gridStartX + (i === 0 ? 0 : config.timeColumnWidth + ((i - 1) * config.dayColumnWidth));
    pdf.line(x, config.gridStartY, x, config.gridStartY + config.gridHeight);
  }
}

function drawEnhancedEvents(pdf: jsPDF, events: CalendarEvent[], weekStart: Date): void {
  const config = AUDIT_ENHANCED_CONFIG;
  
  events.forEach(event => {
    if (!event.startTime || !event.endTime) return;
    
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Calculate position
    const dayIndex = Math.floor((eventStart.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000));
    if (dayIndex < 0 || dayIndex > 6) return;
    
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    const endHour = eventEnd.getHours();
    const endMinute = eventEnd.getMinutes();
    
    // Calculate slot positions
    const startSlot = ((startHour - 6) * 2) + (startMinute >= 30 ? 1 : 0);
    const endSlot = ((endHour - 6) * 2) + (endMinute >= 30 ? 1 : 0);
    
    if (startSlot < 0 || endSlot < 0) return;
    
    // Calculate dimensions
    const eventX = config.gridStartX + config.timeColumnWidth + (dayIndex * config.dayColumnWidth) + 2;
    const eventY = config.gridStartY + (startSlot * config.timeSlotHeight) + 2;
    const eventWidth = config.dayColumnWidth - 4;
    const eventHeight = Math.max(config.timeSlotHeight - 4, (endSlot - startSlot) * config.timeSlotHeight - 4);
    
    // Draw event background
    const eventColor = getEventColor(event.source);
    pdf.setFillColor(eventColor.r, eventColor.g, eventColor.b);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
    
    // Draw event border
    pdf.setLineWidth(1);
    pdf.setDrawColor(eventColor.r * 0.8, eventColor.g * 0.8, eventColor.b * 0.8);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    
    // Draw event text
    pdf.setFontSize(config.fonts.eventTitle);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    const cleanTitle = cleanEventTitle(event.title || '');
    const titleLines = wrapText(pdf, cleanTitle, eventWidth - 8);
    
    titleLines.forEach((line, index) => {
      if (index < 3) { // Limit to 3 lines
        pdf.text(line, eventX + 4, eventY + 12 + (index * 12));
      }
    });
    
    // Draw event time
    if (titleLines.length < 3) {
      pdf.setFontSize(config.fonts.eventTime);
      pdf.setFont('helvetica', 'normal');
      const timeStr = `${formatTime(eventStart)} - ${formatTime(eventEnd)}`;
      pdf.text(timeStr, eventX + 4, eventY + eventHeight - 8);
    }
  });
}

function getEventColor(source: string): { r: number; g: number; b: number } {
  const colors = {
    'simplepractice': { r: 100, g: 149, b: 237 },
    'google': { r: 34, g: 197, b: 94 },
    'manual': { r: 245, g: 158, b: 11 },
    'default': { r: 156, g: 163, b: 175 }
  };
  
  return colors[source] || colors.default;
}

function wrapText(pdf: jsPDF, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const testWidth = pdf.getTextWidth(testLine);
    
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}