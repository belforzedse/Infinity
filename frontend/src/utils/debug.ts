import React from "react";

// Debug utilities for development mode
export const DEBUG = process.env.NODE_ENV === "development";

// Enhanced console logging
export const log = {
  info: (message: string, ...args: any[]) => {
    if (DEBUG) console.log(`ℹ️ ${message}`, ...args);
  },

  warn: (message: string, ...args: any[]) => {
    if (DEBUG) console.warn(`⚠️ ${message}`, ...args);
  },

  error: (message: string, ...args: any[]) => {
    if (DEBUG) console.error(`❌ ${message}`, ...args);
  },

  success: (message: string, ...args: any[]) => {
    if (DEBUG) console.log(`✅ ${message}`, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    if (DEBUG) console.debug(`🐛 ${message}`, ...args);
  },

  api: (method: string, url: string, data?: any) => {
    if (DEBUG) {
      console.group(`🌐 API ${method.toUpperCase()} ${url}`);
      if (data) console.log("Payload:", data);
      console.groupEnd();
    }
  },

  render: (component: string, props?: any) => {
    if (DEBUG) {
      console.log(`🎨 ${component} rendered`);
      if (props) console.log("Props:", props);
    }
  },

  state: (component: string, state: string, value: any) => {
    if (DEBUG) {
      console.log(`🔄 ${component} state [${state}]:`, value);
    }
  },

  performance: (label: string, duration: number) => {
    if (DEBUG) {
      const status = duration > 100 ? "🐌" : duration > 50 ? "⚡" : "🚀";
      console.log(`${status} ${label}: ${duration.toFixed(2)}ms`);
    }
  },
};

// Component debug wrapper
export function withDebug<T extends React.ComponentType<any>>(
  Component: T,
  componentName?: string,
): T {
  if (!DEBUG) return Component;

  const name = componentName || Component.displayName || Component.name || "Unknown";

  const DebugWrapper = (props: any) => {
    log.render(name, props);

    // Performance timing
    const startTime = performance.now();

    const result = React.createElement(Component, props);

    const endTime = performance.now();
    log.performance(`${name} render`, endTime - startTime);

    return result;
  };

  DebugWrapper.displayName = `Debug(${name})`;
  return DebugWrapper as T;
}

// API debug wrapper
export function debugAPI<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  apiName: string,
): T {
  if (!DEBUG) return apiFunction;

  return (async (...args: any[]) => {
    const startTime = performance.now();
    log.api("CALL", apiName, args);

    try {
      const result = await apiFunction(...args);
      const duration = performance.now() - startTime;
      log.performance(`API ${apiName}`, duration);
      log.success(`API ${apiName} completed`, result);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      log.performance(`API ${apiName} (failed)`, duration);
      log.error(`API ${apiName} failed`, error);
      throw error;
    }
  }) as T;
}

// Local Storage debug wrapper
export const debugStorage = {
  setItem: (key: string, value: any) => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      log.info(`Storage SET [${key}]:`, value);
    } catch (error) {
      log.error(`Storage SET [${key}] failed:`, error);
    }
  },

  getItem: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      const parsed = item ? JSON.parse(item) : null;
      log.info(`Storage GET [${key}]:`, parsed);
      return parsed;
    } catch (error) {
      log.error(`Storage GET [${key}] failed:`, error);
      return null;
    }
  },

  removeItem: (key: string) => {
    localStorage.removeItem(key);
    log.info(`Storage REMOVE [${key}]`);
  },

  clear: () => {
    localStorage.clear();
    log.warn("Storage CLEARED");
  },
};

// Performance measurement utilities
export const perf = {
  mark: (name: string) => {
    if (DEBUG && performance.mark) {
      performance.mark(name);
      log.info(`Performance mark: ${name}`);
    }
  },

  measure: (name: string, startMark: string, endMark?: string) => {
    if (DEBUG && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, "measure")[0];
        log.performance(name, measure.duration);
        return measure.duration;
      } catch (error) {
        log.error(`Performance measure failed: ${name}`, error);
        return 0;
      }
    }
    return 0;
  },

  time: (label: string) => {
    if (DEBUG) console.time(label);
  },

  timeEnd: (label: string) => {
    if (DEBUG) console.timeEnd(label);
  },
};

// Error boundary debug helper
export const debugError = (error: Error, errorInfo: any, component?: string) => {
  if (DEBUG) {
    console.group(`💥 Error Boundary - ${component || "Unknown Component"}`);
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    console.error("Stack:", error.stack);
    console.groupEnd();
  }
};

// Debug breakpoint utility
export const debugBreakpoint = (condition?: boolean, message?: string) => {
  if (DEBUG && (condition === undefined || condition)) {
    console.log(`🛑 Debug breakpoint${message ? `: ${message}` : ""}`);
    debugger; // This will pause execution in DevTools
  }
};

// Memory usage tracker
export const trackMemory = () => {
  if (DEBUG && (performance as any).memory) {
    const memory = (performance as any).memory;
    log.info("Memory Usage:", {
      used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
    });
  }
};

// Bundle size analyzer helper
export const logBundleInfo = () => {
  if (DEBUG) {
    log.info("Bundle Info:", {
      nextVersion: process.env.NEXT_PUBLIC_VERSION || "unknown",
      environment: process.env.NODE_ENV,
      build: process.env.NEXT_PUBLIC_BUILD_ID || "unknown",
    });
  }
};

// Export all debug utilities
const debugUtils = {
  log,
  withDebug,
  debugAPI,
  debugStorage,
  perf,
  debugError,
  debugBreakpoint,
  trackMemory,
  logBundleInfo,
  DEBUG,
};

export default debugUtils;
