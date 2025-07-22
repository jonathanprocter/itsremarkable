import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CalendarEvent } from '../types/calendar';

/**
 * Perfect Daily Calendar PDF Export - IMPROVED VERSION
 * Creates pixel-perfect daily calendar based on actual application interface
 * This replaces the manual drawing approach with direct DOM capture
 */

interface DailyPDFOptions {
  selectedDate: Date;
  events: CalendarEvent[];
  showStats?: boolean;
}

export const exportPerfectDailyCalendarPDF = async (options: DailyPDFOptions): Promise<void> => {
  const { selectedDate, events, showStats = true } = options;

  try {
    console.log('🎯 Creating perfect daily calendar PDF that matches application interface exactly...');

    // Filter events for the selected date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
    
    console.log(`📅 Processing ${dayEvents.length} events for ${selectedDate.toDateString()}`);

    // Find the daily calendar view container
    const dailyViewSelectors = [
      '[data-testid="daily-view"]',
      '.daily-calendar-container',
      '.calendar-grid',
      '.daily-view',
      '.time-grid-container',
      '.calendar-day-view',
      '.planner-daily-view'
    ];

    let dailyContainer: HTMLElement | null = null;
    for (const selector of dailyViewSelectors) {
      dailyContainer = document.querySelector(selector) as HTMLElement;
      if (dailyContainer) break;
    }

    if (!dailyContainer) {
      // Fallback: try to find the main calendar container
      const fallbackSelectors = [
        '.calendar-container',
        '.planner-container',
        '[data-testid="calendar-main"]',
        '.main-calendar-view'
      ];
      
      for (const selector of fallbackSelectors) {
        dailyContainer = document.querySelector(selector) as HTMLElement;
        if (dailyContainer) break;
      }
    }

    if (!dailyContainer) {
      throw new Error('Could not find daily calendar container. Please ensure you are viewing the daily calendar.');
    }

    console.log('📍 Found daily calendar container:', dailyContainer.className);

    // Prepare the container for optimal capture
    const originalState = await prepareContainerForCapture(dailyContainer);

    try {
      // Configure html2canvas for high-quality capture
      const canvasOptions = {
        scale: 2, // High DPI for crisp text and graphics
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: dailyContainer.scrollWidth,
        height: dailyContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        removeContainer: false,
        foreignObjectRendering: true,
        ignoreElements: (element: Element) => {
          // Skip elements that shouldn't appear in PDF
          const skipClasses = ['no-print', 'export-button', 'export-controls', 'tooltip'];
          const skipTags = ['SCRIPT', 'STYLE'];
          
          if (skipTags.includes(element.tagName)) return true;
          if (skipClasses.some(cls => element.classList.contains(cls))) return true;
          
          // Skip export buttons
          if (element.tagName === 'BUTTON') {
            const text = element.textContent?.toLowerCase() || '';
            if (text.includes('export') || text.includes('download') || text.includes('pdf')) {
              return true;
            }
          }
          
          return false;
        }
      };

      console.log('📸 Capturing daily calendar interface...');
      
      // Capture the daily calendar
      const canvas = await html2canvas(dailyContainer, canvasOptions);
      
      console.log(`📐 Captured canvas: ${canvas.width}x${canvas.height}`);

      // Create PDF with optimal dimensions
      const pdf = await createPDFFromCanvas(canvas, selectedDate, dayEvents.length, showStats);

      // Save the PDF
      const fileName = `daily-calendar-${selectedDate.toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      console.log('✅ Perfect daily calendar PDF exported successfully');
      console.log(`📄 File saved as: ${fileName}`);

    } finally {
      // Restore original container state
      await restoreContainerState(dailyContainer, originalState);
    }

  } catch (error) {
    console.error('❌ Error exporting perfect daily calendar PDF:', error);
    throw error;
  }
};

/**
 * Prepare container for optimal PDF capture
 */
async function prepareContainerForCapture(container: HTMLElement): Promise<{
  originalStyles: Map<HTMLElement, string>;
  originalScrollPosition: { top: number; left: number };
}> {
  const originalStyles = new Map<HTMLElement, string>();
  const originalScrollPosition = {
    top: container.scrollTop,
    left: container.scrollLeft
  };

  // Ensure all content is loaded and visible
  await ensureContentLoaded(container);

  // Remove animations and transitions for clean capture
  const animatedElements = container.querySelectorAll('*');
  animatedElements.forEach(el => {
    const element = el as HTMLElement;
    const computedStyle = window.getComputedStyle(element);
    
    if (computedStyle.transform !== 'none' || 
        computedStyle.transition !== 'all 0s ease 0s' ||
        computedStyle.animation !== 'none') {
      originalStyles.set(element, element.style.cssText);
      element.style.transform = 'none';
      element.style.transition = 'none';
      element.style.animation = 'none';
    }
  });

  // Ensure container is scrolled to show all content
  container.scrollTop = 0;
  container.scrollLeft = 0;

  // Wait for layout to stabilize
  await new Promise(resolve => setTimeout(resolve, 500));

  return { originalStyles, originalScrollPosition };
}

/**
 * Restore container to original state
 */
async function restoreContainerState(
  container: HTMLElement, 
  state: { originalStyles: Map<HTMLElement, string>; originalScrollPosition: { top: number; left: number } }
): Promise<void> {
  // Restore styles
  state.originalStyles.forEach((style, element) => {
    element.style.cssText = style;
  });

  // Restore scroll position
  container.scrollTop = state.originalScrollPosition.top;
  container.scrollLeft = state.originalScrollPosition.left;

  // Wait for layout to settle
  await new Promise(resolve => setTimeout(resolve, 200));
}

/**
 * Ensure all content in container is loaded
 */
async function ensureContentLoaded(container: HTMLElement): Promise<void> {
  // Wait for images to load
  const images = container.querySelectorAll('img');
  const imagePromises = Array.from(images).map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve; // Don't fail on broken images
      setTimeout(resolve, 2000); // Timeout after 2 seconds
    });
  });

  await Promise.all(imagePromises);

  // Wait for any lazy-loaded content
  await new Promise(resolve => setTimeout(resolve, 300));

  // Trigger any lazy loading by scrolling
  const originalScrollTop = container.scrollTop;
  container.scrollTop = container.scrollHeight;
  await new Promise(resolve => setTimeout(resolve, 200));
  container.scrollTop = 0;
  await new Promise(resolve => setTimeout(resolve, 200));
  container.scrollTop = originalScrollTop;
}

/**
 * Create PDF from captured canvas
 */
async function createPDFFromCanvas(
  canvas: HTMLCanvasElement, 
  date: Date, 
  eventCount: number, 
  showStats: boolean
): Promise<jsPDF> {
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const aspectRatio = imgHeight / imgWidth;
  
  // Standard letter size in points
  const pdfWidth = 612; // 8.5 inches
  const pdfHeight = 792; // 11 inches
  const margin = 30;
  
  // Calculate optimal image size
  const maxContentWidth = pdfWidth - (margin * 2);
  const maxContentHeight = pdfHeight - 120; // Leave space for header and footer
  
  let finalWidth = maxContentWidth;
  let finalHeight = finalWidth * aspectRatio;
  
  // If height exceeds available space, scale down
  if (finalHeight > maxContentHeight) {
    finalHeight = maxContentHeight;
    finalWidth = finalHeight / aspectRatio;
  }

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [pdfWidth, pdfHeight]
  });

  // Add header
  addEnhancedHeader(pdf, date, eventCount);

  // Add the captured calendar image
  const imgData = canvas.toDataURL('image/png', 0.95);
  const startX = (pdfWidth - finalWidth) / 2;
  const startY = 80; // Below header
  
  pdf.addImage(imgData, 'PNG', startX, startY, finalWidth, finalHeight, undefined, 'FAST');

  // Add footer
  addEnhancedFooter(pdf, date, eventCount, showStats);

  return pdf;
}

/**
 * Add enhanced header to PDF
 */
function addEnhancedHeader(pdf: jsPDF, date: Date, eventCount: number): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Header background with subtle gradient effect
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, 0, pageWidth, 70, 'F');
  
  // Header border
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(1);
  pdf.line(0, 70, pageWidth, 70);
  
  // Main title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(30, 41, 59);
  
  const title = `Daily Calendar`;
  const titleWidth = pdf.getTextWidth(title);
  pdf.text(title, (pageWidth - titleWidth) / 2, 25);
  
  // Date subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(71, 85, 105);
  
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const dateWidth = pdf.getTextWidth(dateStr);
  pdf.text(dateStr, (pageWidth - dateWidth) / 2, 45);
  
  // Event count
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(100, 116, 139);
  
  const eventText = `${eventCount} appointment${eventCount !== 1 ? 's' : ''}`;
  const eventWidth = pdf.getTextWidth(eventText);
  pdf.text(eventText, (pageWidth - eventWidth) / 2, 60);
}

/**
 * Add enhanced footer to PDF
 */
function addEnhancedFooter(pdf: jsPDF, date: Date, eventCount: number, showStats: boolean): void {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Footer border
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(1);
  pdf.line(30, pageHeight - 40, pageWidth - 30, pageHeight - 40);
  
  // Export timestamp
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  
  const exportTime = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const leftText = `Exported: ${exportTime}`;
  pdf.text(leftText, 30, pageHeight - 20);
  
  // App branding
  const rightText = 'RemarkablePlannerPro';
  const rightTextWidth = pdf.getTextWidth(rightText);
  pdf.text(rightText, pageWidth - 30 - rightTextWidth, pageHeight - 20);
  
  // Center stats
  if (showStats) {
    const centerText = `${eventCount} appointments`;
    const centerTextWidth = pdf.getTextWidth(centerText);
    pdf.text(centerText, (pageWidth - centerTextWidth) / 2, pageHeight - 20);
  }
}

// Export both named and default exports for compatibility
export default exportPerfectDailyCalendarPDF;