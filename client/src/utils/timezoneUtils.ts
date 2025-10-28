/**
 * Timezone Utilities for EST/New York Time
 * All date/time operations should use these utilities to ensure consistency
 */

const EST_TIMEZONE = 'America/New_York';

/**
 * Convert any date to EST and return as Date object
 */
export function toEST(date: Date | string): Date {
  const inputDate = typeof date === 'string' ? new Date(date) : date;

  // Convert to EST timezone string, then parse back to Date
  const estString = inputDate.toLocaleString('en-US', {
    timeZone: EST_TIMEZONE,
  });

  return new Date(estString);
}

/**
 * Get current date/time in EST
 */
export function nowEST(): Date {
  return toEST(new Date());
}

/**
 * Compare if two dates are the same day in EST
 */
export function isSameDayEST(date1: Date | string, date2: Date | string): boolean {
  const d1 = toEST(date1);
  const d2 = toEST(date2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if a date is today in EST
 */
export function isTodayEST(date: Date | string): boolean {
  return isSameDayEST(date, nowEST());
}

/**
 * Format date to YYYY-MM-DD in EST
 */
export function formatDateEST(date: Date | string): string {
  const estDate = toEST(date);
  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Format time in 24-hour (military) format in EST
 */
export function formatTime24EST(date: Date | string): string {
  const estDate = toEST(date);

  return estDate.toLocaleTimeString('en-US', {
    timeZone: EST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format date and time in EST with 24-hour format
 */
export function formatDateTimeEST(date: Date | string): string {
  const estDate = toEST(date);

  return estDate.toLocaleString('en-US', {
    timeZone: EST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Get start of day (00:00:00) in EST
 */
export function startOfDayEST(date: Date | string): Date {
  const estDate = toEST(date);
  estDate.setHours(0, 0, 0, 0);
  return estDate;
}

/**
 * Get end of day (23:59:59) in EST
 */
export function endOfDayEST(date: Date | string): Date {
  const estDate = toEST(date);
  estDate.setHours(23, 59, 59, 999);
  return estDate;
}

/**
 * Convert Date to ISO string but in EST timezone
 * Useful for API calls that expect ISO format
 */
export function toISOStringEST(date: Date | string): string {
  const estDate = toEST(date);

  const year = estDate.getFullYear();
  const month = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  const hours = String(estDate.getHours()).padStart(2, '0');
  const minutes = String(estDate.getMinutes()).padStart(2, '0');
  const seconds = String(estDate.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Filter events for a specific date in EST
 */
export function filterEventsForDateEST(events: Array<{ startTime: Date | string }>, targetDate: Date | string): Array<{ startTime: Date | string }> {
  return events.filter(event => isSameDayEST(event.startTime, targetDate));
}

/**
 * Get date string in format used by toDateString() but in EST
 * Example: "Mon Jan 01 2024"
 */
export function toDateStringEST(date: Date | string): string {
  const estDate = toEST(date);
  return estDate.toLocaleDateString('en-US', {
    timeZone: EST_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/**
 * Parse a date string and ensure it's interpreted as EST
 */
export function parseDateEST(dateString: string): Date {
  // If the string doesn't have timezone info, assume it's EST
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-')) {
    return toEST(dateString + ' EST');
  }
  return toEST(dateString);
}

/**
 * Get hours in 24-hour format for EST
 */
export function getHoursEST(date: Date | string): number {
  const estDate = toEST(date);
  return estDate.getHours();
}

/**
 * Get minutes in EST
 */
export function getMinutesEST(date: Date | string): number {
  const estDate = toEST(date);
  return estDate.getMinutes();
}
