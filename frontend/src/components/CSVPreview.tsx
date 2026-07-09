'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, ArrowLeft, Database, Sliders, ShieldAlert } from 'lucide-react';

interface CSVPreviewProps {
  fileName: string;
  headers: string[];
  rows: any[];
  onConfirm: (batchSize: number, concurrency: number) => void;
  onCancel: () => void;
}

export function CSVPreview({ fileName, headers, rows, onConfirm, onCancel }: CSVPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);
  
  // Custom Batching Controls
  const [batchSize, setBatchSize] = useState(50);
  const [concurrency, setConcurrency] = useState(3);

  const rowHeight = 40; // in px
  const buffer = 10;    // buffer rows above/below

  // Handle resizing of viewport height
  useEffect(() => {
    if (containerRef.current) {
      setViewportHeight(containerRef.current.clientHeight);
      
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setViewportHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Virtualization Calculations
  const { visibleRows, totalHeight, offsetY, startIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
    const end = Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / rowHeight) + buffer);
    
    return {
      visibleRows: rows.slice(start, end),
      totalHeight: rows.length * rowHeight,
      offsetY: start * rowHeight,
      startIndex: start
    };
  }, [rows, scrollTop, viewportHeight]);

  // Define static column width to ensure alignment
  const colWidth = 'w-[180px] shrink-0 px-4 py-2 text-xs truncate';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-200">
      
      {/* Top Banner Control */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/10 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Previewing: <span className="font-mono text-xs px-2 py-0.5 bg-gray-100 dark:bg-zinc-850 rounded text-brand-600 dark:text-brand-400">{fileName}</span>
            </h2>
          </div>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 ml-8">
            Total records parsed: <strong className="text-gray-700 dark:text-zinc-200">{rows.length.toLocaleString()}</strong>.
          </p>
        </div>

        {/* Batch configuration panel */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-gray-400" />
            <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400">Batch Size:</label>
            <input
              type="number"
              min="1"
              max="500"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 50))}
              className="w-16 px-2 py-1 text-xs border rounded-md border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white font-mono"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400">Concurrency:</label>
            <input
              type="number"
              min="1"
              max="10"
              value={concurrency}
              onChange={(e) => setConcurrency(Math.max(1, parseInt(e.target.value) || 3))}
              className="w-12 px-2 py-1 text-xs border rounded-md border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white font-mono"
            />
          </div>

          <button
            onClick={() => onConfirm(batchSize, concurrency)}
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-500 dark:bg-brand-600 dark:hover:bg-brand-500 transition-colors shadow-md shadow-brand-500/10 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Confirm Import</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-x-auto flex flex-col min-w-full">
        {/* Sticky Table Header */}
        <div className="flex min-w-max border-b border-gray-200 dark:border-zinc-850 bg-gray-50 dark:bg-zinc-900/50 z-20 sticky top-0 font-semibold text-gray-700 dark:text-zinc-300">
          <div className="w-[80px] shrink-0 px-4 py-2 text-xs uppercase tracking-wider text-gray-400 text-center">#</div>
          {headers.map((header) => (
            <div key={header} className={colWidth}>
              {header}
            </div>
          ))}
        </div>

        {/* Scrollable Area for Virtual Rows */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto min-w-max"
          style={{ height: '100%', position: 'relative' }}
        >
          {/* Virtual scroll spacer */}
          <div style={{ height: `${totalHeight}px`, width: '100%', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />

          {/* Rendered leads list */}
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {visibleRows.map((row, index) => {
              const actualIndex = startIndex + index;
              return (
                <div
                  key={actualIndex}
                  className={`flex border-b border-gray-100 dark:border-zinc-900/40 hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 items-center text-gray-600 dark:text-zinc-400`}
                  style={{ height: `${rowHeight}px` }}
                >
                  <div className="w-[80px] shrink-0 px-4 py-2 text-[10px] font-mono text-gray-400 dark:text-zinc-500 text-center">
                    {(actualIndex + 1).toLocaleString()}
                  </div>
                  {headers.map((header) => (
                    <div key={header} className={colWidth}>
                      {row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Table Footer Stats */}
      <div className="px-6 py-3.5 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/40 dark:bg-zinc-900/20 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
        <span className="flex items-center space-x-1.5">
          <Database className="h-3.5 w-3.5 text-zinc-400" />
          <span>Showing {visibleRows.length} rendered rows</span>
        </span>
        <span className="font-mono text-[10px]">Viewport virtual buffer size: +{buffer * 2} rows</span>
      </div>
    </div>
  );
}
