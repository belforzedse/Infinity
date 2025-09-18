'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DebugInfo from './DebugInfo';
import DebugConsole from './DebugConsole';
import DebugNetwork from './DebugNetwork';
import DebugPerformance from './DebugPerformance';
import DebugState from './DebugState';

interface DebugPanelProps {
  enabled?: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ enabled = process.env.NODE_ENV === 'development' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Keyboard shortcut to toggle debug panel
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - startX,
        y: e.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!enabled) return null;

  const tabs = [
    { id: 'info', label: 'Info', icon: 'ℹ️' },
    { id: 'console', label: 'Console', icon: '💻' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'state', label: 'State', icon: '🔄' },
  ];

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-4 right-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Debug Panel (Ctrl+Shift+D)"
      >
        🐛
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              left: position.x,
              top: position.y,
            }}
            className="fixed z-[9998] w-96 rounded-lg bg-gray-900 text-white shadow-2xl"
          >
            {/* Header */}
            <div
              className="flex cursor-move items-center justify-between border-b border-gray-700 bg-gray-800 p-3 rounded-t-lg"
              onMouseDown={handleMouseDown}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">🐛</span>
                <span className="font-semibold">Debug Panel</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700 bg-gray-800">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-2 py-2 text-xs transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto bg-gray-900 p-3 rounded-b-lg">
              {activeTab === 'info' && <DebugInfo />}
              {activeTab === 'console' && <DebugConsole />}
              {activeTab === 'network' && <DebugNetwork />}
              {activeTab === 'performance' && <DebugPerformance />}
              {activeTab === 'state' && <DebugState />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DebugPanel;