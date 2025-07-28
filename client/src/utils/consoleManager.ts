export class ConsoleManager {
  private static logHistory = new Map<string, number>();
  private static lastLogTime = new Map<string, number>();
  private static readonly THROTTLE_TIME = 10000; // 10 seconds
  private static readonly MAX_SAME_LOGS = 1; // Only allow 1 log before suppression

  static throttledLog(message: string, data?: any, type: 'log' | 'warn' | 'error' = 'log') {
    const now = Date.now();
    const key = typeof message === 'string' ? message : JSON.stringify(message);
    
    // Suppress common repetitive messages
    if (message.includes('Auth status check') || 
        message.includes('📊 Event breakdown') ||
        message.includes('hasValidTokens') ||
        message.includes('Event breakdown (Live Sync + DB)') ||
        message.includes('📅') ||
        message.includes('✅') ||
        message.includes('🔧') ||
        message.includes('📊')) {
      // Only log these messages every 2 minutes
      const suppressKey = `suppress-${key}`;
      const lastSuppressTime = this.lastLogTime.get(suppressKey) || 0;
      
      if (now - lastSuppressTime < 120000) {
        return; // Suppress for 2 minutes
      }
      
      this.lastLogTime.set(suppressKey, now);
    }
    
    // Check if we've logged this message recently
    const lastTime = this.lastLogTime.get(key) || 0;
    const logCount = this.logHistory.get(key) || 0;
    
    if (now - lastTime < this.THROTTLE_TIME) {
      // Update count but don't log
      this.logHistory.set(key, logCount + 1);
      return;
    }
    
    // Reset count and log
    this.logHistory.set(key, 1);
    this.lastLogTime.set(key, now);
    
    // Show suppression message if we had multiple attempts
    if (logCount > this.MAX_SAME_LOGS) {
      console[type](`${message} (suppressed ${logCount - 1} duplicate logs)`, data);
    } else {
      console[type](message, data);
    }
  }

  static clearHistory() {
    this.logHistory.clear();
    this.lastLogTime.clear();
  }
}

// Enhanced error handling for development
if (process.env.NODE_ENV === 'development') {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    console.error('Promise:', event.promise);
    // Prevent the default behavior (logging to console twice)
    event.preventDefault();
  });

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    console.error('Message:', event.message);
    console.error('Source:', event.filename, 'Line:', event.lineno);
  });

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (message: any, ...args: any[]) => {
    // Filter out vite connection messages to reduce noise
    if (typeof message === 'string' && (
      message.includes('[vite] connecting') ||
      message.includes('[vite] connected') ||
      message.includes('[vite] failed to connect')
    )) {
      return; // Suppress vite connection spam
    }
    originalLog(message, ...args);
  };

  console.warn = (message: any, ...args: any[]) => {
    originalWarn(message, ...args);
  };

  console.error = (message: any, ...args: any[]) => {
    originalError(message, ...args);
  };
}