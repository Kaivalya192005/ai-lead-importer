'use client';

import React from 'react';
import { Cpu, RefreshCw, Layers, CheckCircle2, Circle } from 'lucide-react';

interface ProcessingUIProps {
  totalRecords: number;
  batchSize: number;
  currentProgress: number; // percent (0 to 100)
  processedCount: number;
  statusMessage: string;
}

export function ProcessingUI({
  totalRecords,
  batchSize,
  currentProgress,
  processedCount,
  statusMessage,
}: ProcessingUIProps) {
  const totalBatches = Math.ceil(totalRecords / batchSize);
  const currentBatch = Math.min(totalBatches, Math.floor(processedCount / batchSize) + 1);

  const isFallbackActivated = statusMessage.toLowerCase().includes('fallback');

  // List of processing milestones
  const steps = [
    { label: 'Uploading CSV file', threshold: 10 },
    { label: 'Parsing file buffer and reading rows', threshold: 25 },
    { label: 'Analyzing column alignment schema', threshold: 45 },
    { 
      label: isFallbackActivated ? 'Fallback Rule-Based Parser Activated' : 'Gemini AI Intelligent Mapping', 
      threshold: 65,
      isHighlight: isFallbackActivated
    },
    { label: 'Cleaning and normalizing contacts data', threshold: 80 },
    { label: 'Removing duplicates globally', threshold: 90 },
    { label: 'Finalizing CRM output payload', threshold: 98 },
  ];

  return (
    <div className="w-full max-w-xl mx-auto py-8 text-center animate-fade-in">
      
      {/* Animated CPU Ring */}
      <div className="relative flex items-center justify-center h-24 w-24 mx-auto mb-8">
        <div className="absolute inset-0 rounded-3xl bg-brand-500/10 dark:bg-brand-500/5 animate-ping duration-1000" />
        <div className="absolute inset-2 rounded-2xl bg-brand-500/20 dark:bg-brand-500/10 animate-pulse" />
        <div className="relative h-14 w-14 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
          <Cpu className="h-6 w-6 animate-pulse" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        CRM Lead Importing Pipeline
      </h2>
      <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-md mx-auto mb-6">
        Please wait while our services validate file headers, parse rows, and structure data.
      </p>

      {/* Main Process Checklist Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm mb-6 text-left transition-colors">
        
        {/* Progress header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider flex items-center space-x-1">
            <Layers className="h-3 w-3 text-brand-500" />
            <span>Import Milestones</span>
          </span>
          <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
            {currentProgress}% Completed
          </span>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-2 bg-gray-100 dark:bg-zinc-850 rounded-full overflow-hidden mb-6">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isFallbackActivated 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                : 'bg-gradient-to-r from-brand-500 to-indigo-500'
            }`}
            style={{ width: `${currentProgress}%` }}
          />
        </div>

        {/* Milestone Steps checklist */}
        <div className="space-y-3.5 mb-2">
          {steps.map((step, idx) => {
            const isCompleted = currentProgress >= step.threshold;
            const isActive = currentProgress < step.threshold && (idx === 0 || currentProgress >= steps[idx - 1].threshold);
            
            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-200 ${
                  isCompleted
                    ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/10 text-gray-700 dark:text-zinc-300'
                    : isActive
                    ? 'bg-brand-50/25 dark:bg-zinc-850/40 border-brand-100 dark:border-zinc-800 text-gray-900 dark:text-white font-medium scale-[1.01]'
                    : 'bg-transparent border-transparent text-gray-450 dark:text-zinc-600'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  {isCompleted ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 animate-scale-in" />
                  ) : isActive ? (
                    <RefreshCw className="h-4.5 w-4.5 text-brand-500 animate-spin shrink-0" />
                  ) : (
                    <Circle className="h-4.5 w-4.5 text-gray-300 dark:text-zinc-850 shrink-0" />
                  )}
                  <span className={`text-xs truncate ${step.isHighlight ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}>
                    {step.label}
                  </span>
                </div>
                {isActive && (
                  <span className="text-[10px] text-brand-600 dark:text-brand-400 animate-pulse font-mono">
                    Working...
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Log monitor screen */}
      <div className="bg-zinc-950 dark:bg-black rounded-xl p-4 text-left border border-zinc-800 dark:border-zinc-900/60 font-mono text-[10px] text-zinc-550 flex flex-col space-y-1 shadow-inner">
        <div className="flex items-center justify-between text-zinc-600 border-b border-zinc-900 pb-1.5 mb-1.5">
          <span>PIPELINE LOGS</span>
          <span className="animate-pulse">{isFallbackActivated ? 'FALLBACK ACTIVE' : 'GEMINI ACTIVE'}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-zinc-600">
          <span>&gt;</span>
          <span>[SYSTEM] Loaded pipeline configurations...</span>
        </div>
        <div className={`flex items-center space-x-1.5 ${isFallbackActivated ? 'text-amber-500' : 'text-brand-400'}`}>
          <span>&gt;</span>
          <span>{isFallbackActivated ? '[FALLBACK] Swapped to rule-based regex mapper.' : '[AI_ENGINE] Mapping columns using Gemini.'}</span>
        </div>
        <div className="flex items-center space-x-1.5 text-emerald-450">
          <span>&gt;</span>
          <span className="truncate">[PIPELINE] {statusMessage}</span>
        </div>
      </div>
    </div>
  );
}
