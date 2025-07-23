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
    console.log(`📊 Total Events: ${events.length}`);

    // Filter events to only include those in the current week to reduce payload size
    const weekStart = new Date(weekStartDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekEndDate);
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekEvents = events.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    console.log(`📊 Week Events: ${weekEvents.length} (filtered from ${events.length})`);

    // Prepare data for Python PyMyPDF script - send events as array, not stringified
    const weekStartISO = weekStartDate.toISOString();
    const weekEndISO = weekEndDate.toISOString();

    // Call Python script via backend endpoint
    const response = await fetch('/api/export/pymypdf-bidirectional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: weekEvents,  // Send as array, not pre-stringified
        weekStart: weekStartISO,
        weekEnd: weekEndISO
      })
    });

    if (!response.ok) {
      throw new Error(`PyMyPDF export failed: ${response.statusText}`);
    }

    const result = await response.json();
    const filename = result.filename;

    // Download the generated file (PDF or TXT) - use simple filename, not encoded
    const downloadUrl = `/api/download/${filename}`;
    console.log(`📥 Downloading file: ${downloadUrl}`);
    
    const downloadResponse = await fetch(downloadUrl);
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
      console.log(`✅ Successfully downloaded: ${filename}`);
    } else {
      console.error(`❌ Download failed: ${downloadResponse.statusText}`);
      throw new Error(`Download failed: ${downloadResponse.statusText}`);
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