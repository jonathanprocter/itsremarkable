
export const performMemoryCleanup = () => {
  try {
    // Clean up any lingering event listeners
    const oldElements = document.querySelectorAll('[data-cleanup]');
    oldElements.forEach(el => el.remove());
    
    // Force garbage collection if available (development only)
    if (window.gc && process.env.NODE_ENV === 'development') {
      window.gc();
    }
    
    // Clear any cached blob URLs
    const blobUrls = (window as any).__blobUrls || [];
    blobUrls.forEach((url: string) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) {
        // Ignore errors
      }
    });
    (window as any).__blobUrls = [];
    
    console.log('✅ Memory cleanup completed');
  } catch (error) {
    console.warn('Memory cleanup warning:', error);
  }
};

// Run cleanup periodically
if (typeof window !== 'undefined') {
  setInterval(performMemoryCleanup, 5 * 60 * 1000); // Every 5 minutes
}
