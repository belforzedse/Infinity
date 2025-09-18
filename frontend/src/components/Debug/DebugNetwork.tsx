'use client';

import React, { useState, useEffect } from 'react';

interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  statusText: string;
  duration: number;
  timestamp: Date;
  size?: number;
  type?: string;
}

const DebugNetwork: React.FC = () => {
  const [requests, setRequests] = useState<NetworkRequest[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const originalFetch = window.fetch;
    const requestStartTimes = new Map<string, number>();

    // Override fetch to track network requests
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : input.toString();
      const method = init?.method || (input instanceof Request ? input.method : 'GET');
      const requestId = Math.random().toString(36).substr(2, 9);
      const startTime = performance.now();

      requestStartTimes.set(requestId, startTime);

      try {
        const response = await originalFetch(input, init);
        const duration = performance.now() - startTime;

        // Get response size if available
        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength) : undefined;
        const type = response.headers.get('content-type') || undefined;

        const networkRequest: NetworkRequest = {
          id: requestId,
          url: url.length > 50 ? '...' + url.slice(-50) : url,
          method: method.toUpperCase(),
          status: response.status,
          statusText: response.statusText,
          duration: Math.round(duration),
          timestamp: new Date(),
          size,
          type: type?.split(';')[0],
        };

        setRequests(prev => [...prev.slice(-49), networkRequest]); // Keep last 50 requests

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        const networkRequest: NetworkRequest = {
          id: requestId,
          url: url.length > 50 ? '...' + url.slice(-50) : url,
          method: method.toUpperCase(),
          status: 0,
          statusText: 'Network Error',
          duration: Math.round(duration),
          timestamp: new Date(),
        };

        setRequests(prev => [...prev.slice(-49), networkRequest]);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const filteredRequests = requests.filter(request => {
    switch (filter) {
      case 'success':
        return request.status >= 200 && request.status < 300;
      case 'error':
        return request.status >= 400 || request.status === 0;
      case 'slow':
        return request.duration > 1000;
      default:
        return true;
    }
  });

  const getStatusColor = (status: number) => {
    if (status === 0) return 'text-red-400';
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 300 && status < 400) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-blue-400';
      case 'POST': return 'text-green-400';
      case 'PUT': return 'text-orange-400';
      case 'DELETE': return 'text-red-400';
      case 'PATCH': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const clearRequests = () => {
    setRequests([]);
  };

  const totalRequests = requests.length;
  const successfulRequests = requests.filter(r => r.status >= 200 && r.status < 300).length;
  const failedRequests = requests.filter(r => r.status >= 400 || r.status === 0).length;
  const avgDuration = requests.length > 0
    ? Math.round(requests.reduce((sum, r) => sum + r.duration, 0) / requests.length)
    : 0;

  return (
    <div className="space-y-2">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-gray-800 p-2">
          <div className="text-gray-400">Total Requests</div>
          <div className="text-white font-semibold">{totalRequests}</div>
        </div>
        <div className="rounded bg-gray-800 p-2">
          <div className="text-gray-400">Avg Duration</div>
          <div className="text-white font-semibold">{avgDuration}ms</div>
        </div>
        <div className="rounded bg-gray-800 p-2">
          <div className="text-gray-400">Success</div>
          <div className="text-green-400 font-semibold">{successfulRequests}</div>
        </div>
        <div className="rounded bg-gray-800 p-2">
          <div className="text-gray-400">Failed</div>
          <div className="text-red-400 font-semibold">{failedRequests}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded bg-gray-800 px-2 py-1 text-xs text-white"
        >
          <option value="all">All</option>
          <option value="success">Success (2xx)</option>
          <option value="error">Errors (4xx/5xx)</option>
          <option value="slow">Slow (>1s)</option>
        </select>
        <button
          onClick={clearRequests}
          className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
        >
          Clear
        </button>
      </div>

      {/* Requests List */}
      <div className="max-h-48 overflow-y-auto">
        {filteredRequests.length === 0 ? (
          <div className="text-center text-gray-400 text-xs py-4">
            No network requests captured yet
          </div>
        ) : (
          filteredRequests.slice().reverse().map((request) => (
            <div
              key={request.id}
              className="border-b border-gray-700 p-2 hover:bg-gray-800 rounded"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className={`font-mono font-semibold ${getMethodColor(request.method)}`}>
                    {request.method}
                  </span>
                  <span className={`font-semibold ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                  <span className="text-gray-300 truncate flex-1" title={request.url}>
                    {request.url}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400 ml-2">
                  <span>{request.duration}ms</span>
                  {request.size && <span>{formatSize(request.size)}</span>}
                </div>
              </div>
              {request.type && (
                <div className="text-xs text-gray-500 mt-1">
                  {request.type}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DebugNetwork;