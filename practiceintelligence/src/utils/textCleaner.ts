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

  // Remove lock symbols and other problematic characters
  return title
    .replace(/🔒\s*/g, '') // Remove lock emoji
    .replace(/Ø=[\w\s]*/g, '') // Remove corrupted text patterns
    .replace(/!•/g, '') // Remove corrupted symbols
    .replace(/[^\x00-\x7F]/g, (char) => {
      // Keep common unicode characters but remove problematic ones
      const code = char.charCodeAt(0);
      if (code >= 0x2600 && code <= 0x26FF) return ''; // Remove misc symbols
      if (code >= 0x1F600 && code <= 0x1F64F) return ''; // Remove emoticons
      if (code >= 0x1F300 && code <= 0x1F5FF) return ''; // Remove misc symbols
      if (code >= 0x1F680 && code <= 0x1F6FF) return ''; // Remove transport symbols
      return char; // Keep other unicode characters
    })
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