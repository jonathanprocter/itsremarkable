import { CalendarEvent } from "../types/calendar";
import { exportBidirectionalWeeklyPackage } from './bidirectionalLinkedPDFExport';

/**
 * ENHANCED BIDIRECTIONALLY LINKED WEEKLY PACKAGE EXPORT
 * Creates a single PDF with proper clickable navigation using the advanced system:
 * - Page 1: Weekly overview with clickable links to each daily page
 * - Pages 2-8: Daily views with navigation back to weekly and between days
 * - All navigation is clickable and functional within the PDF
 * - Uses the enhanced bidirectional system with proper link implementation
 */

export const exportLinkedWeeklyPackage = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[],
): Promise<string> => {
  try {
    console.log("🔗 ENHANCED BIDIRECTIONAL WEEKLY PACKAGE EXPORT STARTING...");
    console.log(`📅 Week range: ${weekStartDate.toDateString()} to ${weekEndDate.toDateString()}`);
    console.log(`📊 Events count: ${events.length}`);

    // Filter events to only include those in the current week
    const weekStart = new Date(weekStartDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekEndDate);
    weekEnd.setHours(23, 59, 59, 999);

    const weekEvents = events.filter((event) => {
      if (!event.startTime) return false;
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    console.log(`📊 Week Events: ${weekEvents.length} (filtered from ${events.length})`);

    // Use the enhanced bidirectional linked PDF export system
    const filename = await exportBidirectionalWeeklyPackage(weekEvents, weekStartDate);

    console.log("✅ ENHANCED BIDIRECTIONAL WEEKLY PACKAGE EXPORT COMPLETE");
    console.log(`📄 Single PDF file with navigation: ${filename}`);
    console.log("🔗 Includes clickable navigation between all 8 pages");
    console.log("📱 Weekly overview + 7 daily pages with full bidirectional links");

    return filename;
  } catch (error) {
    console.error("❌ ENHANCED BIDIRECTIONAL WEEKLY PACKAGE EXPORT ERROR:", error);
    throw error;
  }
};

/**
 * Alternative export function that matches the existing signature
 * for backward compatibility
 */
export const exportBidirectionalWeeklyPackageLinked = async (
  events: CalendarEvent[],
  weekStart: Date,
): Promise<string> => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return await exportLinkedWeeklyPackage(weekStart, weekEnd, events);
};
