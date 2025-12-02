"use client";

import React, { useState, useEffect } from "react";

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: "good" | "warning" | "poor";
}

const DebugPerformance: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [vitals, setVitals] = useState<any>({});
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const updateMetrics = () => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");

      const newMetrics: PerformanceMetric[] = [];

      if (navigation) {
        // DNS Lookup Time
        const dnsTime = navigation.domainLookupEnd - navigation.domainLookupStart;
        newMetrics.push({
          name: "DNS Lookup",
          value: Math.round(dnsTime),
          unit: "ms",
          status: dnsTime < 100 ? "good" : dnsTime < 300 ? "warning" : "poor",
        });

        // Connection Time
        const connectTime = navigation.connectEnd - navigation.connectStart;
        newMetrics.push({
          name: "Connection",
          value: Math.round(connectTime),
          unit: "ms",
          status: connectTime < 100 ? "good" : connectTime < 300 ? "warning" : "poor",
        });

        // Time to First Byte
        const ttfb = navigation.responseStart - navigation.requestStart;
        newMetrics.push({
          name: "TTFB",
          value: Math.round(ttfb),
          unit: "ms",
          status: ttfb < 200 ? "good" : ttfb < 500 ? "warning" : "poor",
        });

        // DOM Content Loaded
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        newMetrics.push({
          name: "DOM Ready",
          value: Math.round(domContentLoaded),
          unit: "ms",
          status: domContentLoaded < 1500 ? "good" : domContentLoaded < 3000 ? "warning" : "poor",
        });

        // Page Load Time
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        newMetrics.push({
          name: "Load Time",
          value: Math.round(loadTime),
          unit: "ms",
          status: loadTime < 2500 ? "good" : loadTime < 4000 ? "warning" : "poor",
        });
      }

      // Paint timings
      const fcp = paint.find((entry) => entry.name === "first-contentful-paint");
      if (fcp) {
        newMetrics.push({
          name: "First Contentful Paint",
          value: Math.round(fcp.startTime),
          unit: "ms",
          status: fcp.startTime < 1800 ? "good" : fcp.startTime < 3000 ? "warning" : "poor",
        });
      }

      const lcp = paint.find((entry) => entry.name === "largest-contentful-paint");
      if (lcp) {
        newMetrics.push({
          name: "Largest Contentful Paint",
          value: Math.round(lcp.startTime),
          unit: "ms",
          status: lcp.startTime < 2500 ? "good" : lcp.startTime < 4000 ? "warning" : "poor",
        });
      }

      // Memory usage
      if ((performance as any).memory) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        newMetrics.push({
          name: "Memory Used",
          value: usedMB,
          unit: "MB",
          status: usedMB < 50 ? "good" : usedMB < 100 ? "warning" : "poor",
        });
      }

      setMetrics(newMetrics);

      // Web Vitals (if available)
      if ("web-vitals" in window) {
        // This would need the web-vitals library to be installed
        // For now, we'll show placeholder data
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  // Frame rate monitoring
  useEffect(() => {
    let frameCount = 0;
    let startTime = performance.now();
    let animationId: number;

    const countFrames = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - startTime >= 1000) {
        setVitals((prev: any) => ({
          ...prev,
          fps: frameCount,
        }));
        frameCount = 0;
        startTime = currentTime;
      }

      animationId = requestAnimationFrame(countFrames);
    };

    animationId = requestAnimationFrame(countFrames);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const getStatusColor = (status: PerformanceMetric["status"]) => {
    switch (status) {
      case "good":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "poor":
        return "text-red-400";
    }
  };

  const getStatusIcon = (status: PerformanceMetric["status"]) => {
    switch (status) {
      case "good":
        return "✅";
      case "warning":
        return "⚠️";
      case "poor":
        return "❌";
    }
  };

  const runPerformanceTest = () => {
    const startTime = performance.now();

    // Simulate some work
    let _result = 0;
    for (let i = 0; i < 1000000; i++) {
      _result += Math.random();
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    console.log(`Performance test completed in ${duration}ms`);
  };

  return (
    <div className="space-y-3">
      {/* Quick Stats */}
      <div className="text-xs grid grid-cols-3 gap-2">
        <div className="rounded bg-gray-800 p-2 text-center">
          <div className="text-gray-400">FPS</div>
          <div className="font-semibold text-white">{vitals.fps || "—"}</div>
        </div>
        <div className="rounded bg-gray-800 p-2 text-center">
          <div className="text-gray-400">Renders</div>
          <div className="font-semibold text-white">{renderCount}</div>
        </div>
        <div className="rounded bg-gray-800 p-2 text-center">
          <div className="text-gray-400">Timing</div>
          <div className="font-semibold text-white">{metrics.length}</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="text-xs flex items-center justify-between rounded bg-gray-800 p-2"
          >
            <div className="flex items-center space-x-2">
              <span>{getStatusIcon(metric.status)}</span>
              <span className="text-gray-300">{metric.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className={`font-semibold ${getStatusColor(metric.status)}`}>
                {metric.value}
              </span>
              <span className="text-gray-400">{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Actions */}
      <div className="space-y-1">
        <button
          onClick={runPerformanceTest}
          className="text-xs w-full rounded bg-purple-600 px-3 py-2 text-white hover:bg-purple-700"
        >
          Run Performance Test
        </button>

        <button
          onClick={() => {
            if (performance.mark) {
              performance.mark("debug-mark");
              console.log("Performance mark created: debug-mark");
            }
          }}
          className="text-xs w-full rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
        >
          Create Performance Mark
        </button>

        <button
          onClick={() => {
            performance.clearMarks();
            performance.clearMeasures();
            console.log("Performance marks and measures cleared");
          }}
          className="text-xs w-full rounded bg-gray-600 px-3 py-2 text-white hover:bg-gray-700"
        >
          Clear Marks & Measures
        </button>
      </div>

      {/* Performance Tips */}
      <div className="text-xs text-gray-400">
        <div className="mb-1 font-semibold">Performance Tips:</div>
        <ul className="text-xs space-y-1">
          <li>• FCP should be &lt; 1.8s</li>
          <li>• LCP should be &lt; 2.5s</li>
          <li>• TTFB should be &lt; 200ms</li>
          <li>• Memory usage should be &lt; 50MB</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugPerformance;
