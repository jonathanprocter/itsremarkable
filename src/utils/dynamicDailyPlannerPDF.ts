/**
 * Dynamic Daily Planner PDF Export
 * Creates PDF from the dynamic daily planner HTML generator
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { DynamicDailyPlannerGenerator } from './dynamicDailyPlannerGenerator';
import { CalendarEvent } from '../types/calendar';
import { format } from 'date-fns';

export async function exportDynamicDailyPlannerPDF(
  date: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🚀 Starting Dynamic Daily Planner PDF Export');
    console.log('📅 Date:', format(date, 'yyyy-MM-dd'));
    console.log('📋 Events:', events.length);

    // Run comprehensive audit first
    console.log('🔍 Running pre-export audit...');
    try {
      const { runDynamicDailyAudit } = await import('./dynamicDailyAudit');
      const auditResult = await runDynamicDailyAudit(date, events);
      
      if (auditResult.overallScore < 70) {
        console.warn('⚠️  AUDIT WARNING: Score below 70% (' + auditResult.overallScore + '%)');
        console.warn('⚠️  Critical issues found:', auditResult.issues.filter(i => i.severity === 'critical').length);
      } else {
        console.log('✅ AUDIT PASSED: Score ' + auditResult.overallScore + '%');
      }
    } catch (auditError) {
      console.warn('⚠️  Audit system not available, continuing with export...');
    }

    // Create the planner generator
    const generator = new DynamicDailyPlannerGenerator();
    
    // Generate the complete HTML
    const html = generator.generateCompleteDailyPlannerHTML(date, events);
    console.log('✅ HTML generated, length:', html.length);
    
    // Create a new window/popup to render the HTML cleanly with proper height for full timeline
    const popupWindow = window.open('', '_blank', 'width=816,height=1740,scrollbars=no');
    
    if (!popupWindow) {
      throw new Error('Failed to open popup window for PDF generation. Please allow popups for this site.');
    }
    
    console.log('✅ Popup window opened successfully');
    
    try {
      // Write the HTML to the popup window
      popupWindow.document.write(html);
      popupWindow.document.close();
      
      console.log('✅ HTML written to popup window');
      
      // Wait for the popup to load completely with better error handling
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Popup window load timeout'));
        }, 15000); // Increased timeout
        
        const checkReady = () => {
          if (popupWindow.document.readyState === 'complete') {
            clearTimeout(timeout);
            resolve(null);
          } else {
            setTimeout(checkReady, 100);
          }
        };
        
        checkReady();
      });
      
      // Additional wait for fonts and rendering
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (popupError) {
      popupWindow.close();
      throw new Error(`Popup rendering failed: ${popupError.message}`);
    }
    
    // Find the content in the popup
    const content = popupWindow.document.body;
    console.log('✅ Content element found in popup:', content.tagName);
    
    // Calculate proper height for 36 time slots (06:00 to 23:30)
    const headerHeight = 200; // Header section height
    const timeSlotHeight = 40; // Each time slot height
    const totalTimeSlots = 36; // 06:00 to 23:30
    const calculatedHeight = headerHeight + (totalTimeSlots * timeSlotHeight) + 100; // Extra padding
    
    console.log('🔧 PDF SCALING CALCULATION:');
    console.log('🔧 Header height:', headerHeight);
    console.log('🔧 Time slot height:', timeSlotHeight);
    console.log('🔧 Total time slots:', totalTimeSlots);
    console.log('🔧 Calculated height:', calculatedHeight);
    
    // Capture canvas with US Letter proportions for perfect fit
    const canvas = await html2canvas(content, {
      scale: 1.0, // Reduced scale to prevent memory issues
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#FAFAF7',
      width: 612, // US Letter width in points
      height: 792, // US Letter height in points
      logging: true, // Enable logging for debugging
      foreignObjectRendering: true, // Use foreign object rendering
      removeContainer: false,
      imageTimeout: 15000,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc) => {
        try {
          // Ensure styling is preserved and appointments fill cells
          const style = clonedDoc.createElement('style');
          style.textContent = `
            body { 
              font-family: Georgia, serif !important; 
              background: #FAFAF7 !important; 
              margin: 0 !important; 
              padding: 20px !important;
              width: 612px !important;
              height: 792px !important;
              overflow: hidden !important;
            }
            * { box-sizing: border-box !important; }
            .appointment { 
              width: 100% !important; 
              margin: 0 !important; 
              padding: 4px !important;
              background: #fff !important;
              border: 1px solid #ddd !important;
            }
            .timeline-slot { 
              width: 100% !important; 
              height: 40px !important;
              border-bottom: 1px solid #eee !important;
            }
            .daily-planner { 
              max-width: none !important; 
              width: 100% !important; 
              height: 100% !important;
            }
          `;
          clonedDoc.head.appendChild(style);
          console.log('✅ US Letter styles applied to cloned document');
        } catch (styleError) {
          console.warn('⚠️ Could not apply custom styles to cloned document:', styleError);
        }
      }
    });
    
    console.log('✅ Canvas created:', canvas.width, 'x', canvas.height);
    
    // Verify canvas has content before closing popup
    if (canvas.width === 0 || canvas.height === 0) {
      popupWindow.close();
      throw new Error('Canvas has no content - check HTML rendering');
    }
    
    console.log('✅ Canvas verified with content:', canvas.width, 'x', canvas.height);
    
    // Close the popup window
    try {
      popupWindow.close();
    } catch (closeError) {
      console.warn('⚠️ Could not close popup window:', closeError);
    }
    
    // Create PDF with US Letter portrait settings - exactly 8.5 x 11 inches
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'letter', // Use standard US Letter format
      compress: false,
      precision: 2
    });
    
    console.log('✅ PDF document created');
    
    // Calculate dimensions to perfectly fit US Letter portrait
    const pageWidth = 612; // 8.5 inches * 72 pts/inch
    const pageHeight = 792; // 11 inches * 72 pts/inch
    const margins = 36; // 0.5 inch margins for print safety
    const availableWidth = pageWidth - (margins * 2); // 540 pts
    const availableHeight = pageHeight - (margins * 2); // 720 pts
    
    // Force canvas to exactly match page dimensions for perfect fit
    const targetWidth = availableWidth;
    const targetHeight = availableHeight;
    
    // Center the content on the page with margins
    const x = margins;
    const y = margins;
    
    console.log('✅ Calculated dimensions:', { targetWidth, targetHeight, x, y });
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', 0.95); // Slightly reduced quality for smaller file
    console.log('✅ Canvas converted to image data, length:', imgData.length);
    
    if (imgData.length < 1000) {
      throw new Error('Canvas image data is too small - likely empty canvas');
    }
    
    try {
      // Add the canvas image to PDF - stretch to fill available space
      pdf.addImage(imgData, 'PNG', x, y, targetWidth, targetHeight, '', 'FAST');
      console.log('✅ Image added to PDF');
    } catch (imageError) {
      throw new Error(`Failed to add image to PDF: ${imageError.message}`);
    }
    
    // Generate filename
    const filename = `Daily_Planner_${format(date, 'yyyy-MM-dd')}.pdf`;
    
    // Save the PDF
    pdf.save(filename);
    
    console.log('✅ Dynamic Daily Planner PDF exported successfully:', filename);
    
  } catch (error) {
    console.error('❌ Dynamic Daily Planner PDF export failed:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error information
    if (error.name === 'SecurityError') {
      console.error('Security error - popup blocked or cross-origin issue');
    } else if (error.name === 'TypeError') {
      console.error('Type error - likely HTML2Canvas or jsPDF issue');
    }
    
    throw new Error(`PDF export failed: ${error.message || 'Unknown error'}`);
  }
}

// Export function with correct name for compatibility
export const exportDynamicDailyPlannerToPDF = exportDynamicDailyPlannerPDF;

export async function exportDynamicDailyPlannerHTML(
  date: Date,
  events: CalendarEvent[]
): Promise<string> {
  try {
    console.log('🚀 Starting Dynamic Daily Planner HTML Export');
    
    // Create the planner generator
    const generator = new DynamicDailyPlannerGenerator();
    
    // Generate the complete HTML
    const html = generator.generateCompleteDailyPlannerHTML(date, events);
    
    // Create a blob and download
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daily_Planner_${format(date, 'yyyy-MM-dd')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log('✅ Dynamic Daily Planner HTML exported successfully');
    
    return html;
    
  } catch (error) {
    console.error('❌ Dynamic Daily Planner HTML export failed:', error);
    throw error;
  }
}

export async function previewDynamicDailyPlanner(
  date: Date,
  events: CalendarEvent[]
): Promise<void> {
  try {
    console.log('🚀 Starting Dynamic Daily Planner Preview');
    
    // Create the planner generator
    const generator = new DynamicDailyPlannerGenerator();
    
    // Generate the complete HTML
    const html = generator.generateCompleteDailyPlannerHTML(date, events);
    
    // Open in a new window
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
    
    console.log('✅ Dynamic Daily Planner preview opened');
    
  } catch (error) {
    console.error('❌ Dynamic Daily Planner preview failed:', error);
    throw error;
  }
}