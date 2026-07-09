'use client';

import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Sliders, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { addAuditLog } from './AuditLog';

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [batchSize, setBatchSize] = useState(50);
  const [concurrency, setConcurrency] = useState(3);
  const [showKey, setShowKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load current preferences from localStorage
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    const savedBatch = localStorage.getItem('default_batch_size');
    const savedConcurrency = localStorage.getItem('default_concurrency');

    setApiKey(savedKey);
    if (savedBatch) setBatchSize(parseInt(savedBatch, 10));
    if (savedConcurrency) setConcurrency(parseInt(savedConcurrency, 10));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    localStorage.setItem('gemini_api_key', apiKey.trim());
    localStorage.setItem('default_batch_size', String(batchSize));
    localStorage.setItem('default_concurrency', String(concurrency));

    addAuditLog(
      'Settings Updated', 
      `Saved API settings. Batch size: ${batchSize}, Concurrency: ${concurrency}. API key configured: ${apiKey.trim() !== '' ? 'Yes' : 'No'}`, 
      'success'
    );

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 animate-fade-in">
      
      {/* Title */}
      <div className="border-b border-gray-200 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
          <SettingsIcon className="h-5.5 w-5.5 text-brand-500" />
          <span>Application Settings</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Configure API credentials, concurrency speed, and default batch chunking sizes.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6 shadow-sm transition-colors">
        
        {/* Gemini API Key */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center space-x-1.5">
            <Key className="h-4 w-4 text-brand-500" />
            <span>Google Gemini API Key</span>
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AI Studio API key (AIzaSy...)"
              className="w-full pl-3 pr-10 py-2 text-xs border rounded-lg border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500">
            If left blank, the application will fallback to the server environment's `GEMINI_API_KEY`.
          </p>
        </div>

        {/* Batch Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-zinc-850">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center space-x-1.5">
              <Sliders className="h-4 w-4 text-brand-500" />
              <span>Default Batch Size</span>
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, parseInt(e.target.value) || 50))}
              className="w-full px-3 py-2 text-xs border rounded-lg border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
            <p className="text-[9px] text-gray-450 dark:text-zinc-500">Number of leads processed per Gemini prompt.</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center space-x-1.5">
              <Sliders className="h-4 w-4 text-brand-500" />
              <span>Default Concurrency</span>
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={concurrency}
              onChange={(e) => setConcurrency(Math.max(1, parseInt(e.target.value) || 3))}
              className="w-full px-3 py-2 text-xs border rounded-lg border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all"
            />
            <p className="text-[9px] text-gray-450 dark:text-zinc-500">Maximum concurrent API threads triggered in parallel.</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-850">
          <div className="flex items-center">
            {isSaved && (
              <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-fade-in">
                <CheckCircle className="h-4 w-4 animate-scale-in" />
                <span>Preferences saved successfully!</span>
              </span>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-5 py-2.5 text-xs font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-500 transition-colors shadow-md shadow-brand-500/10 cursor-pointer"
          >
            Save Settings
          </button>
        </div>

      </form>
    </div>
  );
}
