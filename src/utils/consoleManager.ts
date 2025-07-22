export class ConsoleManager {
  private static logHistory = new Map<string, number>();
  private static lastLogTime = new Map<string, number>();
  private static readonly THROTTLE_TIME = 1000; // 1 second
  private static readonly MAX_SAME_LOGS = 3;

  static throttledLog(message: string, data?: any, type: 'log' | 'warn' | 'error' = 'log') {
    const now = Date.now();
    const key = typeof message === 'string' ? message : JSON.stringify(message);
    
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

// Disable console throttling for connection debugging
if (process.env.NODE_ENV === 'development') {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (message: any, ...args: any[]) => {
    // Allow all logs through for connection debugging
    originalLog(message, ...args);
  };

  console.warn = (message: any, ...args: any[]) => {
    // Allow all warnings through
    originalWarn(message, ...args);
  };

  console.error = (message: any, ...args: any[]) => {
    // Always allow all errors through for debugging
    originalError(message, ...args);
  };
}