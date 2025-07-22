import { CalendarEvent } from '../types/calendar';
import { exportBidirectionalWeeklyPackage } from './bidirectionalLinkedPDFExport';

/**
 * BIDIRECTIONALLY LINKED WEEKLY PACKAGE EXPORT
 * Creates a single PDF with clickable navigation between all pages:
 * - Page 1: Weekly overview with links to each daily page
 * - Pages 2-8: Daily views with navigation back to weekly and between days
 * - All navigation is clickable and functional within the PDF
 */

export const exportLinkedWeeklyPackage = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<string> => {
  try {
    console.log('🔗 BIDIRECTIONAL WEEKLY PACKAGE EXPORT STARTING');
    console.log(`📅 Week: ${weekStartDate.toDateString()} - ${weekEndDate.toDateString()}`);
    console.log(`📊 Events: ${events.length}`);

    // Use the enhanced bidirectional PDF export
    const filename = await exportBidirectionalWeeklyPackage(events, weekStartDate);

    console.log('✅ BIDIRECTIONAL WEEKLY PACKAGE EXPORT COMPLETE');
    console.log(`📄 Single PDF file: ${filename}`);
    console.log('🔗 Includes clickable navigation between all 8 pages');
    console.log('📱 Weekly overview + 7 daily pages with full navigation');

    return filename;

  } catch (error) {
    console.error('❌ BIDIRECTIONAL WEEKLY PACKAGE EXPORT ERROR:', error);
    throw error;
  }
};

/**
 * Alternative export function that matches the existing signature
 * for backward compatibility
 */
export const exportBidirectionalWeeklyPackageLinked = async (
  events: CalendarEvent[],
  weekStart: Date
): Promise<string> => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return await exportLinkedWeeklyPackage(weekStart, weekEnd, events);
};