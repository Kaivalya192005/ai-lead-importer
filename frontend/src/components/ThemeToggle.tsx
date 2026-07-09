'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export function ThemeToggle({ isDark, toggleTheme }: ThemeToggleProps) {
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? (
        <Sun className="h-5 w-5 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-5 w-5 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
