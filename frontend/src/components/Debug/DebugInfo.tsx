'use client';

import React, { useState, useEffect } from 'react';

const DebugInfo: React.FC = () => {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    const updateInfo = () => {
      const now = new Date();
      setInfo({
        environment: process.env.NODE_ENV,
        nextVersion: process.env.NEXT_PUBLIC_VERSION || 'Unknown',
        timestamp: now.toLocaleString(),
        userAgent: navigator.userAgent,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          pixelRatio: window.devicePixelRatio,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        connection: (navigator as any).connection && {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
        },
        memory: (performance as any).memory && {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
        },
        url: window.location.href,
        referrer: document.referrer,
        cookies: document.cookie.split(';').length - 1,
        localStorage: Object.keys(localStorage).length,
        sessionStorage: Object.keys(sessionStorage).length,
      });
    };

    updateInfo();
    const interval = setInterval(updateInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const InfoRow: React.FC<{ label: string; value: any }> = ({ label, value }) => (
    <div className="flex justify-between border-b border-gray-700 py-1 text-xs">
      <span className="text-gray-400">{label}:</span>
      <span className="text-white max-w-48 truncate">{String(value)}</span>
    </div>
  );

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-purple-400">Environment Info</div>

      <InfoRow label="Environment" value={info.environment} />
      <InfoRow label="Next.js Version" value={info.nextVersion} />
      <InfoRow label="Timestamp" value={info.timestamp} />

      <div className="mt-3 text-sm font-semibold text-purple-400">Browser Info</div>
      <InfoRow label="User Agent" value={info.userAgent?.split(' ')[0]} />
      <InfoRow label="Screen" value={`${info.screen?.width}x${info.screen?.height}`} />
      <InfoRow label="Viewport" value={`${info.viewport?.width}x${info.viewport?.height}`} />
      <InfoRow label="Pixel Ratio" value={info.screen?.pixelRatio} />

      {info.connection && (
        <>
          <div className="mt-3 text-sm font-semibold text-purple-400">Connection</div>
          <InfoRow label="Type" value={info.connection.effectiveType} />
          <InfoRow label="Downlink" value={`${info.connection.downlink} Mbps`} />
          <InfoRow label="RTT" value={`${info.connection.rtt} ms`} />
        </>
      )}

      {info.memory && (
        <>
          <div className="mt-3 text-sm font-semibold text-purple-400">Memory Usage</div>
          <InfoRow label="Used" value={`${info.memory.used} MB`} />
          <InfoRow label="Total" value={`${info.memory.total} MB`} />
          <InfoRow label="Limit" value={`${info.memory.limit} MB`} />
        </>
      )}

      <div className="mt-3 text-sm font-semibold text-purple-400">Page Info</div>
      <InfoRow label="URL" value={info.url} />
      <InfoRow label="Referrer" value={info.referrer || 'Direct'} />
      <InfoRow label="Cookies" value={info.cookies} />
      <InfoRow label="localStorage" value={info.localStorage} />
      <InfoRow label="sessionStorage" value={info.sessionStorage} />
    </div>
  );
};

export default DebugInfo;