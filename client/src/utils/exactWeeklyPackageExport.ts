import { CalendarEvent } from '../types/calendar';
import { exportCurrentWeeklyView } from './currentWeeklyExport';
import { exportBrowserReplicaPDF } from './browserReplicaPDF';

/**
 * EXACT WEEKLY PACKAGE EXPORT USING EXISTING TEMPLATES
 * Creates 8-page PDF package using existing exact templates:
 * - Page 1: Weekly Current Weekly Layout (landscape)
 * - Pages 2-8: EXACT Browser HTML Replica daily planners (portrait)
 */
export const exportExactWeeklyPackage = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('🎯 EXACT WEEKLY PACKAGE EXPORT STARTING');
    console.log(`📅 Week: ${weekStartDate.toDateString()} - ${weekEndDate.toDateString()}`);
    console.log(`📊 Events: ${events.length}`);

    // Filter and validate events for the week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStartDate && eventDate <= weekEndDate && 
             event.title && event.startTime && event.endTime;
    });

    console.log(`✅ Valid week events: ${weekEvents.length}`);

    // Count daily events for logging
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(weekStartDate);
      currentDay.setDate(weekStartDate.getDate() + i);
      
      const dayEvents = weekEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDay.toDateString();
      });
      
      console.log(`📅 ${days[i]} ${currentDay.toDateString()}: ${dayEvents.length} events`);
    }

    // Page 1: Export Weekly Current Weekly Layout
    console.log('📄 Page 1: Generating Weekly Current Weekly Layout...');
    exportCurrentWeeklyView(weekEvents, weekStartDate, weekEndDate);

    // Wait a moment to ensure the first export completes
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Pages 2-8: Export daily EXACT Browser HTML Replica pages
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + dayIndex);
      
      console.log(`📄 Page ${dayIndex + 2}: Generating ${days[dayIndex]} EXACT Browser HTML Replica...`);
      
      // Use existing EXACT Browser HTML Replica template for each day
      await exportBrowserReplicaPDF(events, currentDate);
      
      // Wait between exports to prevent conflicts
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('✅ EXACT WEEKLY PACKAGE EXPORT COMPLETE');
    console.log('📄 Total pages: 8 (1 weekly + 7 daily)');
    console.log('📁 Files generated using existing exact templates');

  } catch (error) {
    console.error('❌ EXACT WEEKLY PACKAGE EXPORT ERROR:', error);
    throw error;
  }
};