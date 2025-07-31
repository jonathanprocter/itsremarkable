import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  keyboardNavigation: boolean;
  screenReaderOptimizations: boolean;
  focusIndicators: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void;
  isScreenReaderActive: boolean;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export const AccessibilityProvider = ({ children }: AccessibilityProviderProps) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
    largeText: false,
    keyboardNavigation: true,
    screenReaderOptimizations: false,
    focusIndicators: true,
  });

  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false);
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);

  // Detect system preferences
  useEffect(() => {
    const detectPreferences = () => {
      // Detect reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      // Detect screen reader usage
      const hasScreenReader = window.navigator.userAgent.includes('NVDA') || 
                              window.navigator.userAgent.includes('JAWS') || 
                              'speechSynthesis' in window;

      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
        highContrast: prefersHighContrast,
        screenReaderOptimizations: hasScreenReader,
      }));

      setIsScreenReaderActive(hasScreenReader);
    };

    detectPreferences();

    // Listen for preference changes
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
    ];

    const handlers = mediaQueries.map((mq, index) => {
      const handler = (e: MediaQueryListEvent) => {
        if (index === 0) {
          updateSetting('reducedMotion', e.matches);
        } else if (index === 1) {
          updateSetting('highContrast', e.matches);
        }
      };
      mq.addEventListener('change', handler);
      return { mq, handler };
    });

    return () => {
      handlers.forEach(({ mq, handler }) => {
        mq.removeEventListener('change', handler);
      });
    };
  }, []);

  // Create screen reader announcer element
  useEffect(() => {
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.setAttribute('aria-relevant', 'text');
    announcerElement.style.position = 'absolute';
    announcerElement.style.left = '-10000px';
    announcerElement.style.width = '1px';
    announcerElement.style.height = '1px';
    announcerElement.style.overflow = 'hidden';
    
    document.body.appendChild(announcerElement);
    setAnnouncer(announcerElement);

    return () => {
      if (announcerElement.parentNode) {
        announcerElement.parentNode.removeChild(announcerElement);
      }
    };
  }, []);

  // Apply accessibility styles to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('focus-indicators');
    } else {
      root.classList.remove('focus-indicators');
    }

  }, [settings]);

  // Keyboard navigation setup
  useEffect(() => {
    if (!settings.keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip links functionality
      if (e.key === 'Tab' && e.shiftKey && e.ctrlKey) {
        const skipLink = document.querySelector('[data-skip-link]') as HTMLElement;
        if (skipLink) {
          skipLink.focus();
          e.preventDefault();
        }
      }

      // Quick calendar navigation
      if (e.altKey) {
        switch (e.key) {
          case 'w':
            announceToScreenReader('Switching to weekly view');
            break;
          case 'd':
            announceToScreenReader('Switching to daily view');
            break;
          case 't':
            announceToScreenReader('Going to today');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [settings.keyboardNavigation]);

  const updateSetting = (key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify({
      ...settings,
      [key]: value
    }));

    // Announce change to screen reader
    announceToScreenReader(`${key} ${value ? 'enabled' : 'disabled'}`);
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcer || !isScreenReaderActive) return;

    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (announcer) {
        announcer.textContent = '';
      }
    }, 1000);
  };

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        // Failed to parse saved accessibility settings
      }
    }
  }, []);

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    isScreenReaderActive,
    announceToScreenReader,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};