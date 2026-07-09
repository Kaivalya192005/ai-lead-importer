'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, Trash2, Calendar, FileText, CheckCircle, AlertTriangle, Layers } from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const storedLogs = localStorage.getItem('audit_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (e) {
        console.error('Failed to parse audit logs', e);
      }
    }
  }, []);

  const handleClearLogs = () => {
    localStorage.removeItem('audit_logs');
    setLogs([]);
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'error':
        return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      default:
        return <Layers className="h-4 w-4 text-blue-500" />;
    }
  };

  // Helper utility to insert logs from other files
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-gray-250 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <ShieldAlert className="h-5.5 w-5.5 text-brand-500" />
            <span>Workspace Audit Logs</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Historical trace of CSV operations, AI mappings, duplicates filtered, and system logs.
          </p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={handleClearLogs}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/20 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear Trail</span>
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        {logs.length === 0 ? (
          <div className="p-16 text-center text-gray-500 dark:text-zinc-400">
            <ShieldAlert className="h-10 w-10 mx-auto text-zinc-400 dark:text-zinc-600 mb-4" />
            <p className="text-sm font-semibold">No audit logs logged yet.</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Start importing files to record system activity.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500">
                  <th className="px-6 py-3 w-[180px]">Timestamp</th>
                  <th className="px-6 py-3 w-[150px]">Event</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3 w-[100px]">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/40 text-xs text-gray-600 dark:text-zinc-400">
                {logs.slice().reverse().map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/40 dark:hover:bg-zinc-900/30">
                    <td className="px-6 py-4 font-mono text-[10px] text-gray-400 dark:text-zinc-500 flex items-center">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 max-w-sm truncate text-gray-500 dark:text-zinc-400 font-medium">
                      {log.details}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 border rounded text-[10px] font-bold ${getTypeStyles(log.type)}`}>
                        {getIcon(log.type)}
                        <span className="capitalize">{log.type}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Global utility to log an event to localStorage
 */
export function addAuditLog(action: string, details: string, type: 'info' | 'success' | 'warning' | 'error') {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem('audit_logs');
  let currentLogs: AuditLogEntry[] = [];
  
  if (stored) {
    try {
      currentLogs = JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }

  const newLog: AuditLogEntry = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    action,
    details,
    type,
  };

  currentLogs.push(newLog);
  // Cap at 100 entries to prevent localStorage bloat
  if (currentLogs.length > 100) {
    currentLogs = currentLogs.slice(currentLogs.length - 100);
  }
  localStorage.setItem('audit_logs', JSON.stringify(currentLogs));
}
