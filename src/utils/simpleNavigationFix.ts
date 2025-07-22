let lastFixTime = 0;
const FIX_INTERVAL = 5000; // Only run every 5 seconds

export const simpleNavigationFix = () => {
  const now = Date.now();
  if (now - lastFixTime < FIX_INTERVAL) {
    return; // Skip if run too recently
  }
  lastFixTime = now;

  try {
    // Remove corrupted navigation elements
    const elementsToRemove: Element[] = [];
    document.querySelectorAll('*').forEach(element => {
      const text = element.textContent || '';
      if (text.includes('Ø=') || text.includes('!•') || 
          (text.includes('Page') && text.includes('of 8')) ||
          text.includes('←') && text.includes('Back to Weekly Overview')) {
        elementsToRemove.push(element);
      }
    });

    if (elementsToRemove.length > 0) {
      elementsToRemove.forEach(el => el.remove());
      console.log('🔧 Cleaned up navigation elements');
    }

    // Fix header date format safely
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent?.includes('July 7 - 2025 (day: 13)')) {
        textNodes.push(node as Text);
      }
    }

    if (textNodes.length > 0) {
      textNodes.forEach(textNode => {
        textNode.textContent = textNode.textContent?.replace(
          /July 7 - 2025 \(day: 13\)/g, 
          'July 7 - 13, 2025'
        ) || '';
      });
      console.log('✅ Fixed date format');
    }
  } catch (error) {
    console.error('Navigation fix error:', error);
  }
};

// Run the fix when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', simpleNavigationFix);
  } else {
    // Run after a small delay to ensure DOM is fully rendered
    setTimeout(simpleNavigationFix, 100);
  }
}