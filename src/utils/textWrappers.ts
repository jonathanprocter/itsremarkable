/**
 * Text wrapping utilities for appointment display
 */

export function wrapText(text: string, maxCharsPerLine: number = 18): string[] {
  if (!text) return [];
  
  // Remove extra whitespace and normalize
  const cleanText = text.trim().replace(/\s+/g, ' ');
  
  // Split into words
  const words = cleanText.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    // If adding this word would exceed the line limit
    if (currentLine.length + word.length + 1 > maxCharsPerLine) {
      // If we have a current line, push it
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        // Word is too long, force break it
        lines.push(word.substring(0, maxCharsPerLine));
        currentLine = word.substring(maxCharsPerLine);
      }
    } else {
      // Add word to current line
      currentLine += (currentLine ? ' ' : '') + word;
    }
  }
  
  // Add the last line if it has content
  if (currentLine) {
    lines.push(currentLine.trim());
  }
  
  return lines;
}

export function truncateText(text: string, maxLength: number = 25): string {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  // Try to break at a word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.5) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

export function getOptimalFontSize(textLength: number, containerHeight: number): number {
  // Base font size
  let fontSize = 8;
  
  // Adjust based on container height
  if (containerHeight > 60) {
    fontSize = 9;
  } else if (containerHeight > 40) {
    fontSize = 8;
  } else {
    fontSize = 7;
  }
  
  // Adjust based on text length
  if (textLength > 30) {
    fontSize = Math.max(fontSize - 1, 6);
  }
  
  return fontSize;
}