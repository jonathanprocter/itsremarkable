/**
 * 100% Pixel-Perfect PDF Export System
 * Uses exact dashboard measurements for perfect visual matching
 */

import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { pixelPerfectAuditSystem } from './pixelPerfectAuditSystem';
import { cleanEventTitle } from './titleCleaner';
import { generateTimeSlots } from './timeSlots';

export const export100PercentPixelPerfectPDF = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[] = []
): Promise<void> => {
  try {
    console.log('🎯 Creating 100% pixel-perfect PDF export...');
    
    // Extract exact dashboard measurements
    const measurements = await pixelPerfectAuditSystem.extractDashboardMeasurements();
    const config = pixelPerfectAuditSystem.generatePixelPerfectConfig();
    
    console.log('📏 Using exact dashboard measurements:', measurements);
    
    // Filter events for the week
    const weekEvents = filterWeekEvents(events, weekStartDate, weekEndDate);
    
    // Create PDF with exact dashboard configuration
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [config.pageWidth, config.pageHeight]
    });
    
    // Set font to match dashboard
    pdf.setFont('helvetica');
    
    // Draw components with exact measurements
    drawPixelPerfectHeader(pdf, weekStartDate, weekEndDate, config);
    drawPixelPerfectLegend(pdf, config);
    drawPixelPerfectGrid(pdf, config);
    drawPixelPerfectEvents(pdf, weekEvents, weekStartDate, config);
    
    // Save with timestamp
    const fileName = `pixel-perfect-weekly-${formatDate(weekStartDate)}.pdf`;
    pdf.save(fileName);
    
    // Run post-export audit
    const auditResult = await pixelPerfectAuditSystem.runPixelPerfectAudit(config);
    console.log(`✅ 100% Pixel-Perfect PDF Export Complete: ${auditResult.score}% accuracy`);
    
    // Display audit results
    displayAuditResults(auditResult);
    
  } catch (error) {
    console.error('❌ 100% Pixel-Perfect PDF export failed:', error);
    throw error;
  }
};

function drawPixelPerfectHeader(pdf: jsPDF, weekStart: Date, weekEnd: Date, config: any): void {
  // Header background with exact measurements
  pdf.setFillColor(255, 255, 255);
  pdf.rect(config.gridStartX, config.margins.page, config.contentWidth, config.headerHeight, 'F');
  
  // Title with exact font size
  pdf.setFontSize(config.fonts.title);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  
  const title = '100% PIXEL-PERFECT WEEKLY CALENDAR';
  const titleWidth = pdf.getTextWidth(title);
  const titleX = config.gridStartX + (config.contentWidth - titleWidth) / 2;
  pdf.text(title, titleX, config.margins.page + 25);
  
  // Week info with exact font size
  pdf.setFontSize(config.fonts.weekInfo);
  pdf.setFont('helvetica', 'normal');
  
  const weekInfo = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  const weekInfoWidth = pdf.getTextWidth(weekInfo);
  const weekInfoX = config.gridStartX + (config.contentWidth - weekInfoWidth) / 2;
  pdf.text(weekInfo, weekInfoX, config.margins.page + 50);
}

function drawPixelPerfectLegend(pdf: jsPDF, config: any): void {
  const legendY = config.margins.page + config.headerHeight + 10;
  
  // Legend background
  pdf.setFillColor(248, 249, 250);
  pdf.rect(config.gridStartX, legendY, config.contentWidth, 35, 'F');
  
  // Legend items with exact colors
  const legendItems = [
    { label: 'SimplePractice', color: config.colors.simplePractice },
    { label: 'Google Calendar', color: config.colors.google },
    { label: 'Holidays', color: config.colors.holiday }
  ];
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  const itemSpacing = config.contentWidth / legendItems.length;
  
  legendItems.forEach((item, index) => {
    const itemX = config.gridStartX + (index * itemSpacing) + 20;
    const itemY = legendY + 20;
    
    // Color indicator with exact colors
    pdf.setFillColor(item.color);
    pdf.rect(itemX, itemY - 8, 12, 8, 'F');
    
    // Label
    pdf.setTextColor(0, 0, 0);
    pdf.text(item.label, itemX + 18, itemY);
  });
}

function drawPixelPerfectGrid(pdf: jsPDF, config: any): void {
  const timeSlots = generateTimeSlots();
  
  // Grid background
  pdf.setFillColor(255, 255, 255);
  pdf.rect(config.gridStartX, config.gridStartY, config.totalGridWidth, config.gridHeight, 'F');
  
  // Draw time column with exact measurements
  drawPixelPerfectTimeColumn(pdf, timeSlots, config);
  
  // Draw day columns with exact measurements
  drawPixelPerfectDayColumns(pdf, config);
  
  // Draw grid lines with exact measurements
  drawPixelPerfectGridLines(pdf, timeSlots, config);
}

function drawPixelPerfectTimeColumn(pdf: jsPDF, timeSlots: string[], config: any): void {
  // Time column background
  pdf.setFillColor(248, 249, 250);
  pdf.rect(config.gridStartX, config.gridStartY, config.timeColumnWidth, config.gridHeight, 'F');
  
  // Time labels with exact font sizes
  pdf.setTextColor(0, 0, 0);
  
  timeSlots.forEach((timeSlot, index) => {
    const y = config.gridStartY + (index * config.timeSlotHeight) + (config.timeSlotHeight / 2) + 4;
    const isHour = timeSlot.endsWith(':00');
    
    // Use exact dashboard font sizes
    pdf.setFontSize(isHour ? config.fonts.timeHour : config.fonts.timeHalf);
    pdf.setFont('helvetica', isHour ? 'bold' : 'normal');
    
    // Right-align time labels
    const timeWidth = pdf.getTextWidth(timeSlot);
    const timeX = config.gridStartX + config.timeColumnWidth - timeWidth - 10;
    pdf.text(timeSlot, timeX, y);
  });
}

function drawPixelPerfectDayColumns(pdf: jsPDF, config: any): void {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  days.forEach((day, index) => {
    const dayX = config.gridStartX + config.timeColumnWidth + (index * config.dayColumnWidth);
    
    // Day header background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(dayX, config.gridStartY - 30, config.dayColumnWidth, 30, 'F');
    
    // Day header text with exact font size
    pdf.setFontSize(config.fonts.dayHeader);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    const dayWidth = pdf.getTextWidth(day);
    const dayTextX = dayX + (config.dayColumnWidth - dayWidth) / 2;
    pdf.text(day, dayTextX, config.gridStartY - 10);
  });
}

function drawPixelPerfectGridLines(pdf: jsPDF, timeSlots: string[], config: any): void {
  // Set exact grid line width
  pdf.setLineWidth(config.borderWidths.grid);
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

function drawPixelPerfectEvents(pdf: jsPDF, events: CalendarEvent[], weekStart: Date, config: any): void {
  events.forEach(event => {
    if (!event.startTime || !event.endTime) return;
    
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    // Calculate position with exact measurements
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
    
    // Calculate dimensions with exact measurements
    const eventX = config.gridStartX + config.timeColumnWidth + (dayIndex * config.dayColumnWidth) + config.margins.cell;
    const eventY = config.gridStartY + (startSlot * config.timeSlotHeight) + config.margins.cell;
    const eventWidth = config.dayColumnWidth - (config.margins.cell * 2);
    const eventHeight = Math.max(config.timeSlotHeight - (config.margins.cell * 2), (endSlot - startSlot) * config.timeSlotHeight - (config.margins.cell * 2));
    
    // Draw event background with exact colors
    const eventColor = getPixelPerfectEventColor(event.source, config);
    pdf.setFillColor(eventColor.r, eventColor.g, eventColor.b);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
    
    // Draw event border with exact width
    pdf.setLineWidth(config.borderWidths.event);
    pdf.setDrawColor(eventColor.r * 0.8, eventColor.g * 0.8, eventColor.b * 0.8);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    
    // Draw event text with exact font sizes
    pdf.setFontSize(config.fonts.eventTitle);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    
    const cleanTitle = cleanEventTitle(event.title || '');
    const titleLines = wrapTextPixelPerfect(pdf, cleanTitle, eventWidth - (config.margins.text * 2));
    
    titleLines.forEach((line, index) => {
      if (index < 3) { // Limit to 3 lines
        pdf.text(line, eventX + config.margins.text, eventY + 12 + (index * 12));
      }
    });
    
    // Draw event time with exact font size
    if (titleLines.length < 3) {
      pdf.setFontSize(config.fonts.eventTime);
      pdf.setFont('helvetica', 'normal');
      const timeStr = `${formatTime(eventStart)} - ${formatTime(eventEnd)}`;
      pdf.text(timeStr, eventX + config.margins.text, eventY + eventHeight - 8);
    }
  });
}

function getPixelPerfectEventColor(source: string, config: any): { r: number; g: number; b: number } {
  const colorMap = {
    'simplepractice': hexToRgb(config.colors.simplePractice),
    'google': hexToRgb(config.colors.google),
    'manual': hexToRgb(config.colors.holiday),
    'default': { r: 156, g: 163, b: 175 }
  };
  
  return colorMap[source] || colorMap.default;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function wrapTextPixelPerfect(pdf: jsPDF, text: string, maxWidth: number): string[] {
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

function displayAuditResults(auditResult: any): void {
  console.log('🎯 100% PIXEL-PERFECT AUDIT RESULTS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 Pixel-Perfect Score: ${auditResult.score}%`);
  console.log(`🔍 Inconsistencies Found: ${auditResult.inconsistencies.length}`);
  console.log(`📅 Timestamp: ${auditResult.timestamp.toLocaleString()}`);
  
  if (auditResult.inconsistencies.length > 0) {
    console.log('');
    console.log('🚨 INCONSISTENCIES TO FIX:');
    auditResult.inconsistencies.forEach((inc, index) => {
      const icon = inc.severity === 'CRITICAL' ? '🚨' : inc.severity === 'MAJOR' ? '⚠️' : '💡';
      console.log(`${icon} ${index + 1}. ${inc.property}: Dashboard(${inc.dashboardValue}) vs PDF(${inc.pdfValue}) - ${inc.fix}`);
    });
  }
  
  if (auditResult.score === 100) {
    console.log('🎉 PERFECT SCORE ACHIEVED! 100% pixel-perfect accuracy!');
  } else {
    console.log(`🎯 Target: 100% | Current: ${auditResult.score}% | Improvement needed: ${100 - auditResult.score} points`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}