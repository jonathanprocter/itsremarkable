import { CalendarEvent } from '../types/calendar';

/**
 * PYMYPDF BIDIRECTIONALLY LINKED WEEKLY PACKAGE EXPORT
 * Creates a single PDF with clickable navigation using PyMyPDF backend:
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
    console.log('🔗 PYMYPDF BIDIRECTIONAL WEEKLY PACKAGE EXPORT STARTING');
    console.log(`📅 Week: ${weekStartDate.toDateString()} - ${weekEndDate.toDateString()}`);
    console.log(`📊 Events: ${events.length}`);

    // Prepare data for Python PyMyPDF script
    const eventsJson = JSON.stringify(events);
    const weekStartISO = weekStartDate.toISOString();
    const weekEndISO = weekEndDate.toISOString();

    // Call Python script via backend endpoint
    const response = await fetch('/api/export/pymypdf-bidirectional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: eventsJson,
        weekStart: weekStartISO,
        weekEnd: weekEndISO
      })
    });

    if (!response.ok) {
      throw new Error(`PyMyPDF export failed: ${response.statusText}`);
    }

    const result = await response.json();
    const filename = result.filename;

    // Download the generated PDF
    const downloadResponse = await fetch(`/api/download/${filename}`);
    if (downloadResponse.ok) {
      const blob = await downloadResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }

    console.log('✅ PYMYPDF BIDIRECTIONAL WEEKLY PACKAGE EXPORT COMPLETE');
    console.log(`📄 Single PDF file: ${filename}`);
    console.log('🔗 Includes clickable navigation between all 8 pages');
    console.log('📱 Weekly overview + 7 daily pages with full navigation');

    return filename;

  } catch (error) {
    console.error('❌ PYMYPDF BIDIRECTIONAL WEEKLY PACKAGE EXPORT ERROR:', error);
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