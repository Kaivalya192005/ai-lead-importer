'use client';

import React from 'react';
import { UploadCloud, LayoutDashboard, Settings, HelpCircle, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  currentStage: string;
  isDark: boolean;
  toggleTheme: () => void;
  onNavigate: (stage: 'dashboard' | 'upload' | 'manage' | 'logs' | 'settings') => void;
}

export function Sidebar({ currentStage, isDark, toggleTheme, onNavigate }: SidebarProps) {
  const isImporterActive = ['upload', 'preview', 'processing', 'results'].includes(currentStage);

  const links = [
    { 
      name: 'Dashboard', 
      icon: LayoutDashboard, 
      active: currentStage === 'dashboard', 
      onClick: () => onNavigate('dashboard') 
    },
    { 
      name: 'Lead Importer', 
      icon: UploadCloud, 
      active: isImporterActive, 
      onClick: () => onNavigate('upload') 
    },
    { 
      name: 'Manage Leads', 
      icon: FileSpreadsheet, 
      active: currentStage === 'manage', 
      onClick: () => onNavigate('manage') 
    },
    { 
      name: 'Audit Logs', 
      icon: ShieldAlert, 
      active: currentStage === 'logs', 
      onClick: () => onNavigate('logs') 
    },
    { 
      name: 'Settings', 
      icon: Settings, 
      active: currentStage === 'settings', 
      onClick: () => onNavigate('settings') 
    },
  ];

  const [status, setStatus] = React.useState<'checking' | 'connected' | 'offline'>('checking');

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const headers: HeadersInit = {};
        const customKey = localStorage.getItem('gemini_api_key');
        if (customKey && customKey.trim() !== '') {
          headers['x-gemini-api-key'] = customKey.trim();
        }

        const res = await fetch(`${apiBaseUrl}/api/ai/status?t=${Date.now()}`, { 
          headers,
          cache: 'no-store'
        });
        const data = await res.json();
        if (data.status === 'connected') {
          setStatus('connected');
        } else {
          setStatus('offline');
        }
      } catch (err) {
        setStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [currentStage]);

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col h-screen select-none transition-colors duration-200">
      {/* Brand Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-800 space-x-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-violet-400 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">
          G
        </div>
        <span className="font-semibold text-gray-900 dark:text-white text-md tracking-tight">
          GrowEasy Importer
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-7">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider px-3 mb-2">
            Workspace
          </p>
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.name}
                onClick={link.onClick}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  link.active
                    ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${link.active ? 'text-brand-500' : 'text-gray-400 dark:text-zinc-500'}`} />
                <span>{link.name}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider px-3 mb-2">
            System Status
          </p>
          <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-100 dark:border-zinc-800/40">
            {status === 'connected' ? (
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">🟢 Gemini AI Connected</span>
                </div>
                <p className="text-[9px] text-gray-450 dark:text-zinc-500">Ready for AI Mapping</p>
              </div>
            ) : status === 'checking' ? (
              <div className="flex items-center space-x-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium">Checking connection...</span>
              </div>
            ) : (
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">🟡 Fallback Mode Active</span>
                </div>
                <p className="text-[9px] text-gray-450 dark:text-zinc-500">Using Rule-Based Parser</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer controls */}
      <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300">
            CW
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">CRM Workspace</span>
            <span className="text-[10px] text-gray-500 dark:text-zinc-400">Admin Console</span>
          </div>
        </div>
        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />
      </div>
    </aside>
  );
}
