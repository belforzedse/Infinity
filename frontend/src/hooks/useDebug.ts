'use client';

import { useEffect, useState } from 'react';

interface DebugOptions {
  logRenders?: boolean;
  logProps?: boolean;
  logStateChanges?: boolean;
  performanceProfiling?: boolean;
}

export const useDebug = (componentName: string, options: DebugOptions = {}) => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState<number>(0);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const startTime = performance.now();
    setRenderCount(prev => prev + 1);

    if (options.logRenders) {
      console.log(`🔄 ${componentName} rendered (count: ${renderCount + 1})`);
    }

    if (options.performanceProfiling) {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      setLastRenderTime(renderTime);

      if (renderTime > 16) { // > 16ms is slow for 60fps
        console.warn(`🐌 ${componentName} slow render: ${renderTime.toFixed(2)}ms`);
      }
    }
  }, [options.logRenders, options.performanceProfiling, componentName, renderCount]);

  const logProps = (props: any) => {
    if (process.env.NODE_ENV !== 'development' || !options.logProps) return;
    console.log(`📝 ${componentName} props:`, props);
  };

  const logStateChange = (stateName: string, oldValue: any, newValue: any) => {
    if (process.env.NODE_ENV !== 'development' || !options.logStateChanges) return;
    console.log(`🔄 ${componentName} state change [${stateName}]:`, {
      from: oldValue,
      to: newValue,
    });
  };

  const measure = (name: string, fn: () => any) => {
    if (process.env.NODE_ENV !== 'development') return fn();

    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();

    console.log(`⏱️ ${componentName}.${name}: ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  };

  const trace = (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'development') return;
    console.log(`🔍 ${componentName}: ${message}`, data || '');
  };

  return {
    renderCount,
    lastRenderTime,
    logProps,
    logStateChange,
    measure,
    trace,
  };
};

// Global debug utilities
export const debugUtils = {
  // Log component lifecycle
  logMount: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${componentName} mounted`);
    }
  },

  logUnmount: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`💀 ${componentName} unmounted`);
    }
  },

  // Performance timing
  startTimer: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(label);
    }
  },

  endTimer: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(label);
    }
  },

  // Error boundary helper
  logError: (error: Error, errorInfo?: any, componentName?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`❌ Error in ${componentName || 'Unknown Component'}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.trace();
      console.groupEnd();
    }
  },

  // API call debugging
  logApiCall: (method: string, url: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🌐 API ${method.toUpperCase()} ${url}`);
      if (data) console.log('Data:', data);
      console.groupEnd();
    }
  },

  logApiResponse: (url: string, response: any, duration?: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`📥 API Response ${url}`);
      console.log('Response:', response);
      if (duration) console.log(`Duration: ${duration}ms`);
      console.groupEnd();
    }
  },

  logApiError: (url: string, error: any, duration?: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`❌ API Error ${url}`);
      console.error('Error:', error);
      if (duration) console.log(`Duration: ${duration}ms`);
      console.groupEnd();
    }
  },
};