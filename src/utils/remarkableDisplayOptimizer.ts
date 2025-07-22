// reMarkable Pro Display Optimizer
// Optimizes the web application display for the reMarkable Pro's e-ink screen

export const REMARKABLE_PRO_CONFIG = {
  // Display specifications
  resolution: {
    width: 2160,
    height: 1620,
    ppi: 229
  },
  // Physical dimensions (mm)
  display: {
    width: 179,
    height: 239,
    diagonal: 11.8
  },
  // E-ink optimized colors
  colors: {
    primary: '#000000',      // Pure black for maximum contrast
    secondary: '#404040',    // Dark gray for secondary text
    accent: '#666666',       // Medium gray for borders
    background: '#ffffff',   // Pure white background
    lightGray: '#f0f0f0',   // Light gray for subtle backgrounds
    blue: '#0066cc',        // High contrast blue
    green: '#339933',       // High contrast green
    red: '#cc3333'          // High contrast red
  },
  // Optimal font sizes for e-ink readability
  typography: {
    heading1: '24px',
    heading2: '20px',
    heading3: '18px',
    body: '16px',
    small: '14px',
    caption: '12px'
  },
  // Layout optimizations
  layout: {
    minTouchTarget: '44px',  // Minimum touch target for stylus
    optimalLineHeight: 1.5,  // Optimal line height for reading
    maxLineLength: '80ch',   // Maximum line length for readability
    gridSpacing: '8px'       // Consistent spacing unit
  }
};

// Apply reMarkable Pro optimizations to the application
export const applyRemarkableOptimizations = () => {
  const root = document.documentElement;
  
  // Set CSS custom properties for reMarkable Pro
  root.style.setProperty('--remarkable-width', `${REMARKABLE_PRO_CONFIG.resolution.width}px`);
  root.style.setProperty('--remarkable-height', `${REMARKABLE_PRO_CONFIG.resolution.height}px`);
  root.style.setProperty('--remarkable-primary', REMARKABLE_PRO_CONFIG.colors.primary);
  root.style.setProperty('--remarkable-secondary', REMARKABLE_PRO_CONFIG.colors.secondary);
  root.style.setProperty('--remarkable-accent', REMARKABLE_PRO_CONFIG.colors.accent);
  root.style.setProperty('--remarkable-background', REMARKABLE_PRO_CONFIG.colors.background);
  root.style.setProperty('--remarkable-light-gray', REMARKABLE_PRO_CONFIG.colors.lightGray);
  root.style.setProperty('--remarkable-blue', REMARKABLE_PRO_CONFIG.colors.blue);
  root.style.setProperty('--remarkable-green', REMARKABLE_PRO_CONFIG.colors.green);
  root.style.setProperty('--remarkable-red', REMARKABLE_PRO_CONFIG.colors.red);
  
  // Typography optimizations
  root.style.setProperty('--remarkable-h1', REMARKABLE_PRO_CONFIG.typography.heading1);
  root.style.setProperty('--remarkable-h2', REMARKABLE_PRO_CONFIG.typography.heading2);
  root.style.setProperty('--remarkable-h3', REMARKABLE_PRO_CONFIG.typography.heading3);
  root.style.setProperty('--remarkable-body', REMARKABLE_PRO_CONFIG.typography.body);
  root.style.setProperty('--remarkable-small', REMARKABLE_PRO_CONFIG.typography.small);
  root.style.setProperty('--remarkable-caption', REMARKABLE_PRO_CONFIG.typography.caption);
  
  // Layout optimizations
  root.style.setProperty('--remarkable-touch-target', REMARKABLE_PRO_CONFIG.layout.minTouchTarget);
  root.style.setProperty('--remarkable-line-height', REMARKABLE_PRO_CONFIG.layout.optimalLineHeight.toString());
  root.style.setProperty('--remarkable-max-line', REMARKABLE_PRO_CONFIG.layout.maxLineLength);
  root.style.setProperty('--remarkable-spacing', REMARKABLE_PRO_CONFIG.layout.gridSpacing);
  
  // Add reMarkable Pro optimized class to body
  document.body.classList.add('remarkable-optimized');
  
  // Set application width to match reMarkable Pro (1404px as mentioned in replit.md)
  const app = document.querySelector('#root') as HTMLElement;
  if (app) {
    app.style.maxWidth = '1404px';
    app.style.margin = '0 auto';
    app.style.backgroundColor = REMARKABLE_PRO_CONFIG.colors.background;
  }
};

// E-ink refresh optimization
export const optimizeForEink = () => {
  // Reduce animation durations for e-ink display
  const style = document.createElement('style');
  style.textContent = `
    .remarkable-optimized * {
      transition-duration: 0.1s !important;
      animation-duration: 0.1s !important;
    }
    
    .remarkable-optimized .hover\\:* {
      transition: none !important;
    }
    
    /* High contrast borders for e-ink */
    .remarkable-optimized .border {
      border-color: var(--remarkable-accent) !important;
    }
    
    /* Optimized text contrast */
    .remarkable-optimized .text-gray-600 {
      color: var(--remarkable-secondary) !important;
    }
    
    .remarkable-optimized .text-gray-800,
    .remarkable-optimized .text-gray-900 {
      color: var(--remarkable-primary) !important;
    }
    
    /* Button optimizations for stylus */
    .remarkable-optimized button {
      min-height: var(--remarkable-touch-target);
      min-width: var(--remarkable-touch-target);
      border: 2px solid var(--remarkable-accent);
      background: var(--remarkable-background);
      color: var(--remarkable-primary);
    }
    
    .remarkable-optimized button:hover {
      background: var(--remarkable-light-gray);
      border-color: var(--remarkable-primary);
    }
    
    /* Calendar grid optimizations */
    .remarkable-optimized .calendar-grid {
      border: 2px solid var(--remarkable-primary);
    }
    
    .remarkable-optimized .time-slot {
      border: 1px solid var(--remarkable-accent);
      min-height: 40px;
    }
    
    .remarkable-optimized .appointment {
      border: 2px solid var(--remarkable-primary);
      background: var(--remarkable-background);
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    .remarkable-optimized .appointment-name {
      font-size: 6px !important;
      line-height: 1.0 !important;
      font-weight: bold;
      word-wrap: break-word;
      overflow-wrap: break-word;
      hyphens: auto;
    }
    
    .remarkable-optimized .appointment-time {
      font-size: 5px !important;
      line-height: 1.0 !important;
      opacity: 0.8;
    }
    
    /* SimplePractice event styling */
    .remarkable-optimized .appointment.simplepractice {
      border-color: var(--remarkable-blue);
      background: var(--remarkable-light-gray);
      border-left: 8px solid var(--remarkable-blue);
      box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    /* Google Calendar event styling */
    .remarkable-optimized .appointment.google-calendar {
      border-color: var(--remarkable-accent);
      background: var(--remarkable-background);
      border-left: 4px solid var(--remarkable-green);
      border-style: dashed;
      box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    /* Personal event styling */
    .remarkable-optimized .appointment.personal {
      border-color: var(--remarkable-primary);
      background: var(--remarkable-light-gray);
      border-style: double;
      border-width: 3px;
    }
    
    /* Typography optimizations */
    .remarkable-optimized h1 {
      font-size: var(--remarkable-h1);
      color: var(--remarkable-primary);
      font-weight: bold;
    }
    
    .remarkable-optimized h2 {
      font-size: var(--remarkable-h2);
      color: var(--remarkable-primary);
      font-weight: bold;
    }
    
    .remarkable-optimized h3 {
      font-size: var(--remarkable-h3);
      color: var(--remarkable-primary);
      font-weight: 600;
    }
    
    .remarkable-optimized p,
    .remarkable-optimized span,
    .remarkable-optimized div {
      font-size: var(--remarkable-body);
      line-height: var(--remarkable-line-height);
      color: var(--remarkable-primary);
    }
    
    .remarkable-optimized .text-sm {
      font-size: var(--remarkable-small);
    }
    
    .remarkable-optimized .text-xs {
      font-size: var(--remarkable-caption);
    }
    
    /* Sidebar optimizations */
    .remarkable-optimized .sidebar-section {
      border: 1px solid var(--remarkable-accent);
      padding: var(--remarkable-spacing);
      margin-bottom: var(--remarkable-spacing);
      background: var(--remarkable-background);
    }
    
    /* Export button special styling */
    .remarkable-optimized .export-button {
      background: var(--remarkable-blue);
      color: white;
      border: 2px solid var(--remarkable-primary);
      font-weight: bold;
      padding: 8px 16px;
    }
    
    .remarkable-optimized .export-button:hover {
      background: var(--remarkable-primary);
      color: white;
    }
    
    /* Calendar legend optimizations */
    .remarkable-optimized .calendar-legend {
      border: 2px solid var(--remarkable-accent);
      background: var(--remarkable-background);
      padding: var(--remarkable-spacing);
    }
    
    .remarkable-optimized .calendar-legend .checkbox {
      width: 20px;
      height: 20px;
      border: 2px solid var(--remarkable-primary);
    }
    
    /* Daily view time grid */
    .remarkable-optimized .daily-time-grid {
      border-right: 2px solid var(--remarkable-primary);
    }
    
    .remarkable-optimized .daily-time-slot {
      border-bottom: 1px solid var(--remarkable-accent);
      min-height: 30px;
      font-size: var(--remarkable-small);
    }
    
    /* Weekly view optimizations */
    .remarkable-optimized .weekly-day-header {
      border: 2px solid var(--remarkable-primary);
      background: var(--remarkable-light-gray);
      font-weight: bold;
      text-align: center;
      padding: 8px;
    }
    
    .remarkable-optimized .weekly-time-column {
      border-right: 2px solid var(--remarkable-primary);
      background: var(--remarkable-background);
    }
    
    /* Focus styles for stylus interaction */
    .remarkable-optimized *:focus {
      outline: 3px solid var(--remarkable-primary);
      outline-offset: 2px;
    }
    
    /* Disable text selection for better stylus experience */
    .remarkable-optimized .no-select {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  `;
  
  document.head.appendChild(style);
};

// Check if running on reMarkable Pro (detection heuristics)
export const isRemarkablePro = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  
  // Check for reMarkable specific indicators
  const isRemarkableUA = userAgent.includes('remarkable') || 
                        userAgent.includes('e-ink') ||
                        userAgent.includes('webkit') && screenWidth === 2160;
  
  // Check for reMarkable Pro resolution
  const isRemarkableResolution = (screenWidth === 2160 && screenHeight === 1620) ||
                                (screenWidth === 1620 && screenHeight === 2160);
  
  // Check for specific reMarkable Pro user agent patterns
  const hasEinkIndicators = window.devicePixelRatio === 1 && isRemarkableResolution;
  
  return isRemarkableUA || isRemarkableResolution || hasEinkIndicators;
};

// Initialize reMarkable Pro optimizations
export const initializeRemarkableOptimizations = () => {
  // Always apply optimizations since this is specifically for reMarkable Pro
  applyRemarkableOptimizations();
  optimizeForEink();
  
  // Log optimization status
  console.log('reMarkable Pro optimizations applied:', {
    resolution: `${REMARKABLE_PRO_CONFIG.resolution.width}x${REMARKABLE_PRO_CONFIG.resolution.height}`,
    ppi: REMARKABLE_PRO_CONFIG.resolution.ppi,
    isDetected: isRemarkablePro()
  });
  
  // Add performance optimizations for e-ink
  if (typeof window !== 'undefined') {
    // Disable smooth scrolling on reMarkable Pro
    document.documentElement.style.scrollBehavior = 'auto';
    
    // Optimize for e-ink refresh rates
    document.body.style.imageRendering = 'crisp-edges';
    document.body.style.textRendering = 'optimizeSpeed';
  }
};