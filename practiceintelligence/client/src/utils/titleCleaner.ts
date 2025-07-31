/**
 * Title cleaner utility for consistent event title processing
 */

export function cleanEventTitle(title: string): string {
  if (!title) return '';
  
  // Remove common suffixes while preserving the core title
  let cleanTitle = title
    .replace(/\s+Appointment$/i, '')
    .replace(/\s+Meeting$/i, '')
    .replace(/\s+Event$/i, '')
    .trim();
  
  // If the title becomes empty or too short, use original
  if (cleanTitle.length < 2) {
    cleanTitle = title;
  }
  
  return cleanTitle;
}

export function formatEventTitle(title: string, maxLength: number = 30): string {
  const cleanTitle = cleanEventTitle(title);
  
  if (cleanTitle.length <= maxLength) {
    return cleanTitle;
  }
  
  // Truncate and add ellipsis
  return cleanTitle.substring(0, maxLength - 3) + '...';
}

export function cleanTextForPDF(text: string): string {
  if (!text) return '';
  
  // Remove special characters and normalize for PDF rendering
  return text
    .replace(/[^\w\s\-\.,:;!?'"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}