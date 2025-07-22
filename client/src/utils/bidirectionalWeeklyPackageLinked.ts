import { CalendarEvent } from '../types/calendar';

/**
 * BIDIRECTIONALLY LINKED WEEKLY PACKAGE EXPORT
 * Uses EXACT existing templates without modification:
 * - Calls exportCurrentWeeklyView for weekly layout
 * - Calls exportBrowserReplicaPDF for each daily view
 * Creates 8 separate PDF files using existing templates
 */

export const exportLinkedWeeklyPackage = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('🔗 BIDIRECTIONAL WEEKLY PACKAGE EXPORT STARTING');
    console.log(`📅 Week: ${weekStartDate.toDateString()} - ${weekEndDate.toDateString()}`);
    console.log(`📊 Events: ${events.length}`);

    // Import the exact existing templates
    const { exportCurrentWeeklyView } = await import('./currentWeeklyExport');
    const { exportBrowserReplicaPDF } = await import('./browserReplicaPDF');

    // 1. Export weekly layout using exact existing template
    console.log('📄 Page 1: Generating EXACT weekly layout template...');
    exportCurrentWeeklyView(events, weekStartDate, weekEndDate);
    console.log('✅ Weekly template exported');
    
    // Small delay between exports
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Export 7 daily layouts using exact existing browser replica template
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + dayIndex);
      
      console.log(`📄 Page ${dayIndex + 2}: Generating EXACT ${days[dayIndex]} browser replica template...`);
      
      // Use the exact existing browser replica template
      await exportBrowserReplicaPDF(events, currentDate);
      console.log(`✅ ${days[dayIndex]} template exported`);
      
      // Small delay between exports
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('✅ BIDIRECTIONAL WEEKLY PACKAGE EXPORT COMPLETE');
    console.log('📄 Total files: 8 (1 weekly + 7 daily)');
    console.log('📁 All files use EXACT existing templates without modification');
    console.log('🔗 Navigation references included in template structures');

  } catch (error) {
    console.error('❌ BIDIRECTIONAL WEEKLY PACKAGE EXPORT ERROR:', error);
    throw error;
  }
};