/**
 * Dashboard Style Extractor
 * Extracts exact computed CSS values from live dashboard elements
 */

import html2canvas from 'html2canvas';

export interface DashboardMeasurements {
  timeColumnWidth: number;
  dayColumnWidth: number;
  timeSlotHeight: number;
  headerHeight: number;
  containerWidth: number;
  containerHeight: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fonts: {
    timeLabel: string;
    dayHeader: string;
    eventTitle: string;
    eventTime: string;
  };
  colors: {
    background: string;
    gridLines: string;
    timeLabels: string;
    eventText: string;
  };
}

export interface StyleExtractionResult {
  measurements: DashboardMeasurements;
  screenshot?: string;
  extractionTime: number;
  success: boolean;
  errors?: string[];
}

export function extractDashboardStyles(): StyleExtractionResult {
  const startTime = Date.now();
  const errors: string[] = [];

  console.log('🔍 Starting dashboard style extraction...');
  console.log('📋 Available IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));

  // Try multiple selectors to find the calendar grid
  const gridSelectors = [
    '.weekly-grid',
    '.calendar-grid',
    '.time-grid',
    '[class*="grid"]',
    '[class*="calendar"]',
    '[class*="planner"]',
    '.main-content',
    '#calendar-container',
    '#planner-container'
  ];

  let calendarContainer = null;
  for (const selector of gridSelectors) {
    calendarContainer = document.querySelector(selector);
    if (calendarContainer) {
      console.log(`✅ Found calendar grid with selector: ${selector}`);
      break;
    }
  }

  if (!calendarContainer) {
    console.warn('❌ Calendar grid not found with any selector');
    // Try to find any main container as fallback
    calendarContainer = document.querySelector('main, .main, #root > div, [role="main"]');
    if (calendarContainer) {
      console.log('📦 Using fallback container');
    } else {
      console.error('❌ No suitable container found');
      return { measurements: getDefaultMeasurements(), extractionTime: Date.now() - startTime, success: false, errors };
    }
  }

  try {

    // Extract time column measurements
    const timeColumn = calendarContainer.querySelector('.time-column, .time-labels');
    const timeColumnWidth = timeColumn ? timeColumn.getBoundingClientRect().width : 80;

    // Extract day column measurements
    const dayColumns = calendarContainer.querySelectorAll('.day-column, .calendar-day');
    const dayColumnWidth = dayColumns.length > 0 ? dayColumns[0].getBoundingClientRect().width : 110;

    // Extract time slot measurements
    const timeSlots = calendarContainer.querySelectorAll('.time-slot, .calendar-row');
    const timeSlotHeight = timeSlots.length > 0 ? timeSlots[0].getBoundingClientRect().height : 40;

    // Extract header measurements
    const header = calendarContainer.querySelector('.calendar-header, .week-header');
    const headerHeight = header ? header.getBoundingClientRect().height : 60;

    // Extract container measurements
    const containerRect = calendarContainer.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Extract computed styles
    const containerStyle = window.getComputedStyle(calendarContainer);
    const margins = {
      top: parseInt(containerStyle.marginTop) || 0,
      right: parseInt(containerStyle.marginRight) || 0,
      bottom: parseInt(containerStyle.marginBottom) || 0,
      left: parseInt(containerStyle.marginLeft) || 0
    };

    // Extract font information
    const timeLabelElement = calendarContainer.querySelector('.time-label, .hour-label');
    const dayHeaderElement = calendarContainer.querySelector('.day-header, .calendar-day-header');
    const eventElement = calendarContainer.querySelector('.event, .appointment');

    const fonts = {
      timeLabel: timeLabelElement ? window.getComputedStyle(timeLabelElement).fontFamily : 'Arial, sans-serif',
      dayHeader: dayHeaderElement ? window.getComputedStyle(dayHeaderElement).fontFamily : 'Arial, sans-serif',
      eventTitle: eventElement ? window.getComputedStyle(eventElement).fontFamily : 'Arial, sans-serif',
      eventTime: eventElement ? window.getComputedStyle(eventElement).fontFamily : 'Arial, sans-serif'
    };

    // Extract color information
    const colors = {
      background: containerStyle.backgroundColor || '#ffffff',
      gridLines: containerStyle.borderColor || '#e0e0e0',
      timeLabels: timeLabelElement ? window.getComputedStyle(timeLabelElement).color : '#333333',
      eventText: eventElement ? window.getComputedStyle(eventElement).color : '#000000'
    };

    const measurements: DashboardMeasurements = {
      timeColumnWidth,
      dayColumnWidth,
      timeSlotHeight,
      headerHeight,
      containerWidth,
      containerHeight,
      margins,
      fonts,
      colors
    };

    console.log('✅ Dashboard measurements extracted:', measurements);

    return {
      measurements,
      extractionTime: Date.now() - startTime,
      success: true
    };

  } catch (error) {
    console.error('❌ Dashboard style extraction failed:', error);
    errors.push(error instanceof Error ? error.message : 'Unknown error');

    return {
      measurements: getDefaultMeasurements(),
      extractionTime: Date.now() - startTime,
      success: false,
      errors
    };
  }
}

export function getDashboardMeasurements(): DashboardMeasurements {
  const result = extractDashboardStyles();
  return result.measurements;
}

export async function captureScreenshot(): Promise<string | null> {
  try {
    console.log('📸 Capturing dashboard screenshot...');

    const calendarContainer = document.querySelector('.calendar-container, .weekly-calendar, .planner-container');
    if (!calendarContainer) {
      console.error('❌ Calendar container not found for screenshot');
      return null;
    }

    const canvas = await html2canvas(calendarContainer as HTMLElement, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const dataUrl = canvas.toDataURL('image/png');
    console.log('✅ Screenshot captured successfully');

    return dataUrl;

  } catch (error) {
    console.error('❌ Screenshot capture failed:', error);
    return null;
  }
}

function getDefaultMeasurements(): DashboardMeasurements {
  return {
    timeColumnWidth: 80,
    dayColumnWidth: 110,
    timeSlotHeight: 40,
    headerHeight: 60,
    containerWidth: 1200,
    containerHeight: 800,
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    },
    fonts: {
      timeLabel: 'Arial, sans-serif',
      dayHeader: 'Arial, sans-serif',
      eventTitle: 'Arial, sans-serif',
      eventTime: 'Arial, sans-serif'
    },
    colors: {
      background: '#ffffff',
      gridLines: '#e0e0e0',
      timeLabels: '#333333',
      eventText: '#000000'
    }
  };
}

// Style comparison utility function for debugging
export function logStyleComparison(dashboardStyles: any, pdfStyles: any) {
  console.group('🎯 STYLE COMPARISON');
  console.log('📐 Dashboard Measurements:', dashboardStyles);
  console.log('📄 PDF Configuration:', pdfStyles);
  console.groupEnd();
}

// Make functions available globally for browser testing
if (typeof window !== 'undefined') {
  (window as any).extractDashboardStyles = extractDashboardStyles;
  (window as any).getDashboardMeasurements = getDashboardMeasurements;
  (window as any).captureScreenshot = captureScreenshot;
  (window as any).logStyleComparison = logStyleComparison;
}