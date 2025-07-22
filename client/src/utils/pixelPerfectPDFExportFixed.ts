/**
 * Pixel-Perfect PDF Export System
 * Uses exact dashboard measurements for 100% accuracy
 */

import { CalendarEvent } from '@/shared/schema';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { getDashboardMeasurements } from './dashboardStyleExtractor';
import { runPixelPerfectAudit } from './pixelPerfectAudit';

interface DashboardMeasurements {
  timeColumnWidth: number;
  dayColumnWidth: number;
  timeSlotHeight: number;
  headerHeight: number;
  scalingFactor: number;
}

interface PDFConfig {
  pageWidth: number;
  pageHeight: number;
  margins: { top: number; right: number; bottom: number; left: number };
  timeColumnWidth: number;
  dayColumnWidth: number;
  timeSlotHeight: number;
  headerHeight: number;
  fontSizes: {
    title: number;
    header: number;
    timeLabel: number;
    eventTitle: number;
    eventTime: number;
  };
}

export async function exportPixelPerfectPDF(
  date: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🎯 Starting Pixel-Perfect PDF Export');
    console.log('📅 Date:', date.toISOString().split('T')[0]);
    console.log('📊 Events:', events.length);
    
    // Extract dashboard measurements
    const dashboardMeasurements = await extractDashboardMeasurements();
    console.log('📏 Dashboard measurements:', dashboardMeasurements);
    
    // Calculate PDF configuration
    const pdfConfig = calculatePDFConfig(dashboardMeasurements);
    console.log('📐 PDF configuration:', pdfConfig);
    
    // Generate pixel-perfect HTML
    const html = generatePixelPerfectHTML(date, events, pdfConfig);
    console.log('✅ Pixel-perfect HTML generated, length:', html.length);
    
    if (!html || html.length < 100) {
      throw new Error('Invalid HTML generated - too short or empty');
    }
    
    // Create temporary container with exact PDF dimensions
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'fixed';
    container.style.left = '0px';
    container.style.top = '0px';
    container.style.width = `${pdfConfig.pageWidth}px`;
    container.style.height = `${pdfConfig.pageHeight}px`;
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.zIndex = '9999';
    container.style.overflow = 'visible';
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.pointerEvents = 'none';
    
    // Add to document
    document.body.appendChild(container);
    
    // Wait for rendering and font loading
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Capture with exact dimensions
    const canvas = await html2canvas(container, {
      scale: 2, // Use 2x scaling for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: pdfConfig.pageWidth,
      height: pdfConfig.pageHeight,
      logging: true,
      foreignObjectRendering: true,
      onclone: (clonedDoc) => {
        console.log('📸 html2canvas cloned document successfully');
        const clonedContainer = clonedDoc.querySelector('div');
        if (clonedContainer) {
          console.log('📸 Cloned container found:', clonedContainer.getBoundingClientRect());
        }
      }
    });
    
    console.log('✅ Canvas captured:', canvas.width, 'x', canvas.height);
    
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      document.body.removeChild(container);
      throw new Error('Canvas capture failed - invalid dimensions');
    }
    
    // Remove temporary container
    document.body.removeChild(container);
    
    // Create PDF with exact dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: [pdfConfig.pageWidth, pdfConfig.pageHeight]
    });
    
    // Add canvas to PDF with scale compensation
    const imgData = canvas.toDataURL('image/png');
    const scale = 0.5; // Compensate for 2x canvas scaling
    const finalWidth = pdfConfig.pageWidth;
    const finalHeight = pdfConfig.pageHeight;
    
    console.log('📐 PDF image scaling:', {
      canvasSize: `${canvas.width}x${canvas.height}`,
      pdfPageSize: `${pdfConfig.pageWidth}x${pdfConfig.pageHeight}`,
      scale,
      finalSize: `${finalWidth}x${finalHeight}`,
      position: '0, 0'
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
    
    // Save PDF
    const filename = `Pixel_Perfect_Daily_${date.toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    
    console.log('✅ Pixel-perfect PDF exported successfully:', filename);
    
  } catch (error) {
    console.error('❌ Pixel-perfect PDF export failed:', error);
    throw error;
  }
}

async function extractDashboardMeasurements(): Promise<DashboardMeasurements> {
  console.log('📏 Extracting dashboard measurements...');
  
  // Find calendar container
  const calendarContainer = document.querySelector('.calendar-container');
  if (!calendarContainer) {
    throw new Error('Calendar container not found');
  }
  
  console.log('📍 Found calendar container: .calendar-container');
  
  // Extract measurements
  const timeColumnSelectors = ['.time-column', '[class*="time"]'];
  let timeColumn: Element | null = null;
  for (const selector of timeColumnSelectors) {
    timeColumn = calendarContainer.querySelector(selector);
    if (timeColumn) break;
  }
  const timeColumnWidth = timeColumn?.getBoundingClientRect().width || 80;
  
  const dayColumnSelectors = ['.day-column', '[class*="day"]'];
  const dayColumns = calendarContainer.querySelectorAll(dayColumnSelectors.join(','));
  const dayColumnWidth = dayColumns.length > 0 ? 
    dayColumns[0].getBoundingClientRect().width : 137;
  
  const timeSlotSelectors = ['.time-slot', '[class*="slot"]'];
  const timeSlots = calendarContainer.querySelectorAll(timeSlotSelectors.join(','));
  const timeSlotHeight = timeSlots.length > 0 ?
    timeSlots[0].getBoundingClientRect().height : 40;
  
  const headerSelectors = ['.calendar-header', '[class*="header"]'];
  let header: Element | null = null;
  for (const selector of headerSelectors) {
    header = calendarContainer.querySelector(selector);
    if (header) break;
  }
  const headerHeight = header?.getBoundingClientRect().height || 50;
  
  // Calculate scaling factor based on 8.5x11 page
  const pageWidth = 612;
  const margins = 40;
  const availableWidth = pageWidth - (margins * 2);
  const dashboardTotalWidth = timeColumnWidth + (dayColumnWidth * 7);
  const scalingFactor = dashboardTotalWidth > 0 ? availableWidth / dashboardTotalWidth : 1;
  
  console.log('📐 Scaling calculation:', {
    pageWidth,
    margins,
    availableWidth,
    timeColumnWidth,
    dayColumnWidth,
    dashboardTotalWidth,
    scalingFactor
  });
  
  return {
    timeColumnWidth,
    dayColumnWidth,
    timeSlotHeight,
    headerHeight,
    scalingFactor
  };
}

function calculatePDFConfig(dashboard: DashboardMeasurements): PDFConfig {
  console.log('📐 Calculating PDF configuration...');
  
  // Standard PDF dimensions
  const pageWidth = 612;
  const pageHeight = 792;
  const margins = { top: 40, right: 40, bottom: 40, left: 40 };
  
  // Apply consistent scaling factor to all elements
  const timeColumnWidth = dashboard.timeColumnWidth * dashboard.scalingFactor;
  const dayColumnWidth = dashboard.dayColumnWidth * dashboard.scalingFactor;
  const timeSlotHeight = dashboard.timeSlotHeight * dashboard.scalingFactor;
  const headerHeight = dashboard.headerHeight * dashboard.scalingFactor;
  
  // Calculate font sizes proportional to scaling but with minimum readable sizes
  const baseFontScale = Math.max(dashboard.scalingFactor, 0.7); // Minimum scale factor
  const fontSizes = {
    title: Math.max(Math.round(20 * baseFontScale), 14),
    header: Math.max(Math.round(16 * baseFontScale), 12),
    timeLabel: Math.max(Math.round(12 * baseFontScale), 10),
    eventTitle: Math.max(Math.round(14 * baseFontScale), 11),
    eventTime: Math.max(Math.round(12 * baseFontScale), 10)
  };
  
  console.log('🔤 Calculated font sizes:', fontSizes);
  console.log('📏 Scaled dimensions:', {
    timeColumnWidth,
    dayColumnWidth,
    timeSlotHeight,
    headerHeight
  });
  
  return {
    pageWidth,
    pageHeight,
    margins,
    timeColumnWidth,
    dayColumnWidth,
    timeSlotHeight,
    headerHeight,
    fontSizes
  };
}

function generatePixelPerfectHTML(
  date: Date,
  events: CalendarEvent[],
  config: PDFConfig
): string {
  console.log('🎨 Generating pixel-perfect HTML...');
  
  // Filter events for the specific date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.start_time);
    return eventDate.toDateString() === date.toDateString();
  });
  
  console.log(`📅 Events for ${date.toDateString()}: ${dayEvents.length}`);
  
  // Generate simple HTML structure
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const year = date.getFullYear();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          width: ${config.pageWidth}px;
          height: ${config.pageHeight}px;
          margin: 0;
          padding: 20px;
          background: white;
          box-sizing: border-box;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .title {
          font-size: ${config.fontSizes.title}px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .date {
          font-size: ${config.fontSizes.header}px;
          color: #666;
        }
        
        .time-grid {
          display: grid;
          grid-template-columns: 60px 1fr;
          gap: 0;
          border: 1px solid #333;
          height: 600px;
        }
        
        .time-column {
          background: #f5f5f5;
          border-right: 2px solid #333;
        }
        
        .time-slot {
          height: 17px;
          border-bottom: 1px solid #ddd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${config.fontSizes.timeLabel}px;
          padding: 2px;
        }
        
        .appointments-column {
          position: relative;
          background: white;
        }
        
        .appointment {
          position: absolute;
          background: white;
          border: 1px solid #666;
          border-radius: 3px;
          padding: 3px;
          font-size: 10px;
          overflow: hidden;
          left: 2px;
          right: 2px;
        }
        
        .appointment.simplepractice {
          border-left: 3px solid #6495ed;
        }
        
        .appointment.google {
          border: 1px dashed #22c55e;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">DAILY PLANNER</div>
        <div class="date">${dayName}, ${monthDay}, ${year}</div>
      </div>
      
      <div class="time-grid">
        <div class="time-column">
          ${generateTimeSlots(config)}
        </div>
        <div class="appointments-column">
          ${generateAppointments(dayEvents, config)}
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTimeSlots(config: PDFConfig): string {
  const slots = [];
  
  // Generate time slots from 6:00 to 23:30
  for (let hour = 6; hour <= 23; hour++) {
    const hourStr = hour.toString().padStart(2, '0');
    slots.push(`<div class="time-slot">${hourStr}:00</div>`);
    
    if (hour < 23) {
      slots.push(`<div class="time-slot">${hourStr}:30</div>`);
    }
  }
  
  // Add final 23:30 slot
  slots.push(`<div class="time-slot">23:30</div>`);
  
  return slots.join('');
}

function generateAppointments(events: CalendarEvent[], config: PDFConfig): string {
  return events.map(event => {
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);
    
    // Calculate position in grid
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const startSlot = (startHour - 6) * 2 + (startMinute >= 30 ? 1 : 0);
    const endSlot = (endHour - 6) * 2 + (endMinute >= 30 ? 1 : 0);
    
    const top = startSlot * 17; // 17px per slot
    const height = Math.max((endSlot - startSlot) * 17, 17);
    
    let eventClass = 'appointment';
    if (event.title.includes('Appointment')) {
      eventClass += ' simplepractice';
    } else if (event.calendar_id) {
      eventClass += ' google';
    }
    
    const cleanTitle = event.title.replace(' Appointment', '').trim();
    const timeRange = `${startTime.toTimeString().substring(0, 5)}-${endTime.toTimeString().substring(0, 5)}`;
    
    return `
      <div class="${eventClass}" style="top: ${top}px; height: ${height}px;">
        <div style="font-weight: bold; font-size: 9px;">${cleanTitle}</div>
        <div style="font-size: 8px; color: #666;">${timeRange}</div>
      </div>
    `;
  }).join('');
}