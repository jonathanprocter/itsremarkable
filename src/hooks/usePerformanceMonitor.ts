import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  domNodes: number;
  componentMounts: number;
  reRenders: number;
}

interface PerformanceMonitorOptions {
  enableMemoryTracking?: boolean;
  enableRenderTracking?: boolean;
  logThreshold?: number; // Log warnings if render time exceeds this (ms)
  sampleRate?: number; // How often to collect metrics (0-1)
}

export const usePerformanceMonitor = (
  componentName: string,
  options: PerformanceMonitorOptions = {}
) => {
  const {
    enableMemoryTracking = true,
    enableRenderTracking = true,
    logThreshold = 16, // 16ms = 60fps threshold
    sampleRate = 1.0
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    domNodes: 0,
    componentMounts: 0,
    reRenders: 0
  });

  const renderStartTime = useRef<number>(0);
  const mountCount = useRef<number>(0);
  const renderCount = useRef<number>(0);
  const isFirstRender = useRef<boolean>(true);

  // Start render timing
  const startRenderTiming = () => {
    if (enableRenderTracking && Math.random() <= sampleRate) {
      renderStartTime.current = performance.now();
    }
  };

  // End render timing and collect metrics
  const endRenderTiming = () => {
    if (!enableRenderTracking || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    renderCount.current += 1;

    // Collect additional metrics
    const domNodes = document.querySelectorAll('*').length;
    let memoryUsage: number | undefined;

    if (enableMemoryTracking && 'memory' in performance) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    const newMetrics: PerformanceMetrics = {
      renderTime,
      memoryUsage,
      domNodes,
      componentMounts: mountCount.current,
      reRenders: renderCount.current
    };

    setMetrics(newMetrics);

    // Performance monitoring (logging disabled)

    renderStartTime.current = 0;
  };

  // Track component mounts
  useEffect(() => {
    if (isFirstRender.current) {
      mountCount.current += 1;
      isFirstRender.current = false;
      console.log(`Component ${componentName} mounted (count: ${mountCount.current})`);
    }
  }, [componentName]);

  // Performance observer for additional metrics
  useEffect(() => {
    if (!enableRenderTracking) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      // Performance measure logging disabled
    });

    try {
      observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    } catch (error) {
      // Performance Observer not supported
    }

    return () => observer.disconnect();
  }, [componentName, enableRenderTracking]);

  // Create performance mark
  const markPerformance = (markName: string) => {
    if (enableRenderTracking) {
      try {
        performance.mark(`${componentName}-${markName}`);
      } catch (error) {
        // Performance marking failed
      }
    }
  };

  // Measure performance between marks
  const measurePerformance = (measureName: string, startMark: string, endMark: string) => {
    if (enableRenderTracking) {
      try {
        performance.measure(
          `${componentName}-${measureName}`,
          `${componentName}-${startMark}`,
          `${componentName}-${endMark}`
        );
      } catch (error) {
        // Performance measurement failed
      }
    }
  };

  // Get current performance metrics
  const getCurrentMetrics = (): PerformanceMetrics => {
    const domNodes = document.querySelectorAll('*').length;
    let memoryUsage: number | undefined;

    if (enableMemoryTracking && 'memory' in performance) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
    }

    return {
      renderTime: metrics.renderTime,
      memoryUsage,
      domNodes,
      componentMounts: mountCount.current,
      reRenders: renderCount.current
    };
  };

  return {
    metrics,
    startRenderTiming,
    endRenderTiming,
    markPerformance,
    measurePerformance,
    getCurrentMetrics
  };
};