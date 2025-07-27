import React, { useState, useCallback, useRef } from 'react';

interface TabTransitionOptions {
  enableSoundEffects?: boolean;
  enableHapticFeedback?: boolean;
  transitionDuration?: number;
}

export const useTabTransitions = (options: TabTransitionOptions = {}) => {
  const {
    enableSoundEffects = true,
    enableHapticFeedback = true,
    transitionDuration = 300
  } = options;

  const [activeTab, setActiveTab] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context lazily
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && enableSoundEffects) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('Web Audio API not supported');
      }
    }
  }, [enableSoundEffects]);

  // Play tab click sound
  const playTabClickSound = useCallback(() => {
    if (!enableSoundEffects || !audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Create a pleasant click sound
      oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContextRef.current.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
    } catch (error) {
      console.warn('Failed to play tab click sound:', error);
    }
  }, [enableSoundEffects]);

  // Play tab transition sound
  const playTabTransitionSound = useCallback(() => {
    if (!enableSoundEffects || !audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Create a smooth transition sound
      oscillator.frequency.setValueAtTime(600, audioContextRef.current.currentTime);
      oscillator.frequency.linearRampToValueAtTime(800, audioContextRef.current.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.2);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.2);
    } catch (error) {
      console.warn('Failed to play tab transition sound:', error);
    }
  }, [enableSoundEffects]);

  // Trigger haptic feedback
  const triggerHapticFeedback = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !navigator.vibrate) return;

    const patterns = {
      light: [10],
      medium: [25],
      heavy: [50]
    };

    navigator.vibrate(patterns[intensity]);
  }, [enableHapticFeedback]);

  // Handle tab change with animations and effects
  const handleTabChange = useCallback((newTab: string, event?: React.MouseEvent) => {
    if (newTab === activeTab || isTransitioning) return;

    // Initialize audio context on first user interaction
    initAudioContext();

    setIsTransitioning(true);
    
    // Create ripple effect
    if (event && event.currentTarget) {
      const target = event.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.3);
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1;
      `;
      
      target.style.position = 'relative';
      target.style.overflow = 'hidden';
      target.appendChild(ripple);
      
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, 600);
    }

    // Play sound effects
    playTabClickSound();
    
    // Trigger haptic feedback
    triggerHapticFeedback('light');
    
    // Set new active tab
    setActiveTab(newTab);
    
    // Play transition sound after a short delay
    setTimeout(() => {
      playTabTransitionSound();
    }, 100);
    
    // Reset transition state
    setTimeout(() => {
      setIsTransitioning(false);
    }, transitionDuration);
  }, [activeTab, isTransitioning, initAudioContext, playTabClickSound, playTabTransitionSound, triggerHapticFeedback, transitionDuration]);

  // Create ripple effect styles
  const createRippleStyles = useCallback(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        0% {
          transform: scale(0);
          opacity: 0.6;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }
    `;
    
    if (!document.head.querySelector('style[data-ripple]')) {
      style.setAttribute('data-ripple', 'true');
      document.head.appendChild(style);
    }
  }, []);

  // Initialize ripple styles on mount
  React.useEffect(() => {
    createRippleStyles();
  }, [createRippleStyles]);

  return {
    activeTab,
    isTransitioning,
    handleTabChange,
    setActiveTab
  };
};