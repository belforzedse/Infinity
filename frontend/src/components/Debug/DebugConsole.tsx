'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
  data?: any;
}

const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [command, setCommand] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const originalConsole = useRef<any>({});

  useEffect(() => {
    // Store original console methods
    originalConsole.current = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    // Override console methods to capture logs
    const createLogHandler = (level: LogEntry['level']) => {
      return (...args: any[]) => {
        const newLog: LogEntry = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
          level,
          message: args.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' '),
          data: args.length === 1 && typeof args[0] === 'object' ? args[0] : args,
        };

        setLogs(prev => [...prev.slice(-99), newLog]); // Keep last 100 logs

        // Call original console method
        originalConsole.current[level]?.(...args);
      };
    };

    console.log = createLogHandler('log');
    console.warn = createLogHandler('warn');
    console.error = createLogHandler('error');
    console.info = createLogHandler('info');

    // Add initial debug message
    console.log('🐛 Debug Console initialized');

    return () => {
      // Restore original console methods
      Object.assign(console, originalConsole.current);
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  const executeCommand = () => {
    if (!command.trim()) return;

    try {
      // Add command to logs
      setLogs(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level: 'info',
        message: `> ${command}`,
      }]);

      // Execute command
      const result = eval(command);

      // Add result to logs
      if (result !== undefined) {
        console.log('Result:', result);
      }
    } catch (error) {
      console.error('Command error:', error);
    }

    setCommand('');
  };

  const clearLogs = () => {
    setLogs([]);
    console.log('🧹 Console cleared');
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center space-x-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded bg-gray-800 px-2 py-1 text-xs text-white"
        >
          <option value="all">All</option>
          <option value="log">Logs</option>
          <option value="warn">Warnings</option>
          <option value="error">Errors</option>
          <option value="info">Info</option>
        </select>
        <button
          onClick={clearLogs}
          className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
        >
          Clear
        </button>
      </div>

      {/* Logs */}
      <div className="max-h-48 overflow-y-auto bg-black rounded p-2 font-mono text-xs">
        {filteredLogs.map((log) => (
          <div key={log.id} className={`mb-1 ${getLogColor(log.level)}`}>
            <span className="text-gray-500 text-xs">
              {log.timestamp.toLocaleTimeString()}
            </span>
            <span className="ml-1">{getLogIcon(log.level)}</span>
            <span className="ml-1">{log.message}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {/* Command Input */}
      <div className="flex space-x-1">
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && executeCommand()}
          placeholder="Execute JavaScript..."
          className="flex-1 rounded bg-gray-800 px-2 py-1 text-xs text-white placeholder-gray-400"
        />
        <button
          onClick={executeCommand}
          className="rounded bg-purple-600 px-3 py-1 text-xs text-white hover:bg-purple-700"
        >
          Run
        </button>
      </div>
    </div>
  );
};

export default DebugConsole;