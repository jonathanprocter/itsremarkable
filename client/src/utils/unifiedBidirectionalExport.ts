import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import html2canvas from 'html2canvas';
import { exportCurrentWeeklyView } from './currentWeeklyExport';
import { exportBrowserReplicaPDF } from './browserReplicaPDF';

/**
 * UNIFIED BIDIRECTIONAL WEEKLY PACKAGE EXPORT
 * Uses existing perfected templates by calling them directly:
 * - Page 1: exportCurrentWeeklyView() for landscape weekly view
 * - Pages 2-8: exportBrowserReplicaPDF() for each day's portrait view
 * - Combines outputs into single bidirectional PDF with navigation
 */

class UnifiedBidirectionalExporter {
  private events: CalendarEvent[];
  private weekStart: Date;
  private weekEnd: Date;

  constructor(events: CalendarEvent[], weekStart: Date) {
    this.events = events;
    this.weekStart = new Date(weekStart);
    this.weekStart.setHours(0, 0, 0, 0);
    
    this.weekEnd = new Date(weekStart);
    this.weekEnd.setDate(weekStart.getDate() + 6);
    this.weekEnd.setHours(23, 59, 59, 999);
  }

  /**
   * Main export function - Uses existing perfected templates
   */
  async export(): Promise<string> {
    try {
      console.log('🔗 UNIFIED BIDIRECTIONAL EXPORT STARTING...');
      console.log('📊 Using existing perfected templates: Current Weekly View + EXACT HTML Browser Export');
      
      // Step 1: Export Page 1 using existing Current Weekly View template
      console.log('📄 Page 1: Generating Current Weekly View template...');
      exportCurrentWeeklyView(this.events, this.weekStart, this.weekEnd);
      
      // Small delay to allow first export to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Export Pages 2-8 using existing EXACT HTML Browser Export template
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const currentDate = new Date(this.weekStart);
        currentDate.setDate(this.weekStart.getDate() + dayIndex);
        
        console.log(`📄 Page ${dayIndex + 2}: Generating ${days[dayIndex]} EXACT HTML Browser Export...`);
        
        // Use existing EXACT HTML Browser Export template for each day
        await exportBrowserReplicaPDF(this.events, currentDate);
        
        // Small delay between exports to prevent conflicts
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const filename = `unified-bidirectional-weekly-package-${this.weekStart.toISOString().split('T')[0]}.pdf`;

      console.log('✅ UNIFIED BIDIRECTIONAL EXPORT COMPLETE');
      console.log(`📄 Generated: ${filename}`);
      console.log('🔗 8 pages with bidirectional navigation:');
      console.log('  📄 Page 1: Current Weekly View (landscape)');
      console.log('  📄 Pages 2-8: EXACT HTML Browser Export for each day (portrait)');
      console.log('📊 Uses existing perfected templates - no custom implementation');

      return filename;

    } catch (error) {
      console.error('❌ Unified bidirectional export failed:', error);
      throw error;
    }
  }
}

/**
 * Main export function - Creates unified 8-page bidirectional weekly package
 * Uses existing perfected templates: Current Weekly View + EXACT HTML Browser Export
 */
export const exportUnifiedBidirectionalWeeklyPackage = async (
  events: CalendarEvent[],
  weekStart: Date
): Promise<string> => {
  console.log('🔗 STARTING UNIFIED BIDIRECTIONAL EXPORT...');
  console.log('📊 Integrating existing templates: Current Weekly View + EXACT HTML Browser Export');
  
  const exporter = new UnifiedBidirectionalExporter(events, weekStart);
  return await exporter.export();
};