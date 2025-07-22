export const cleanText = (text: string): string => {
  if (!text) return '';

  return text
    .replace(/🔒\s*/g, '') // Remove lock symbol and following space
    .replace(/[\u{1F500}-\u{1F6FF}]/gu, '') // Remove emoji symbols
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Remove misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Remove dingbats
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Remove more emoji ranges
    .replace(/Ø=ÜÅ/g, '') // Remove corrupted symbols
    .replace(/Ø=Ý/g, '') // Remove more corrupted symbols
    .replace(/[!•]/g, '') // Remove exclamation and bullet points
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

export const cleanEventTitle = (title: string): string => {
  if (!title) return '';

  // Use comprehensive emoji cleaning for consistency
  return title
    .replace(/🔒\s*/g, '') // Remove lock emoji
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc symbols
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport symbols
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical symbols
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric shapes
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental arrows
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
    .replace(/Ø=[\w\s]*/g, '') // Remove corrupted text patterns
    .replace(/!•/g, '') // Remove corrupted symbols
    .replace(/\s+Appointment\s*$/i, '') // Remove "Appointment" suffix
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

// Clean all text content in the DOM
export const cleanAllTextContent = () => {
  document.querySelectorAll('*').forEach(element => {
    if (element.textContent && element.children.length === 0) {
      const cleanedText = cleanText(element.textContent);
      if (cleanedText !== element.textContent) {
        element.textContent = cleanedText;
      }
    }
  });
};