import { CalendarEvent } from '../types/calendar';
import { exportCurrentWeeklyView } from './currentWeeklyExport';
import { exportBrowserReplicaPDF } from './browserReplicaPDF';

/**
 * EXACT TEMPLATE WEEKLY PACKAGE EXPORTER
 * 
 * Uses the EXACT existing template functions AS-IS:
 * - exportCurrentWeeklyView() from currentWeeklyExport.ts
 * - exportBrowserReplicaPDF() from browserReplicaPDF.ts
 * 
 * Creates 8 separate PDF files using the templates exactly as they exist
 */

export class ExactTemplateWeeklyPackageExporter {
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
   * Export weekly package using EXACT existing templates
   */
  async export(): Promise<string> {
    try {
      console.log('📦 EXACT TEMPLATE WEEKLY PACKAGE EXPORT STARTING...');
      console.log('📊 Using EXACT existing templates without ANY modifications');
      
      // Step 1: Call EXACT exportCurrentWeeklyView function
      console.log('📄 Step 1: Calling EXACT exportCurrentWeeklyView function...');
      exportCurrentWeeklyView(this.events, this.weekStart, this.weekEnd);
      
      // Step 2: Call EXACT exportBrowserReplicaPDF for each day
      console.log('📄 Step 2: Calling EXACT exportBrowserReplicaPDF for each day...');
      
      const currentDate = new Date(this.weekStart);
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        console.log(`📄 Creating ${dayName} using EXACT exportBrowserReplicaPDF...`);
        
        // Call the EXACT existing function
        await exportBrowserReplicaPDF(this.events, new Date(currentDate));
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log('✅ EXACT TEMPLATE WEEKLY PACKAGE EXPORT COMPLETED');
      console.log('📄 Generated 8 separate PDF files using EXACT existing templates');
      
      return 'exact-template-weekly-package-completed';
    } catch (error) {
      console.error('❌ Error in exact template weekly package export:', error);
      throw error;
    }
  }
}

/**
 * Export function to call the exact template weekly package
 */
export const exportExactTemplateWeeklyPackage = async (
  events: CalendarEvent[],
  weekStart: Date
): Promise<string> => {
  const exporter = new ExactTemplateWeeklyPackageExporter(events, weekStart);
  return await exporter.export();
};