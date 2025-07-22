/**
 * Comprehensive emoji and symbol cleaning for PDF export
 * Removes all problematic characters that cause rendering issues
 */

export function cleanTitleForPDF(title: string): string {
  if (!title) return '';
  
  return title
    // Remove lock symbols specifically
    .replace(/🔒\s*/g, '')
    // Remove all emoji ranges
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport symbols
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical symbols
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric shapes
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental arrows
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    // Remove corrupted text patterns
    .replace(/Ø=[\w\s]*/g, '')
    .replace(/!•/g, '')
    // Remove "Appointment" suffix if present
    .replace(/\s+Appointment\s*$/i, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanEventTitle(title: string): string {
  return cleanTitleForPDF(title);
}

export function cleanTextForPDF(text: string): string {
  return cleanTitleForPDF(text);
}