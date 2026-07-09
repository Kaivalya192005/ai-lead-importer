'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, RefreshCw } from 'lucide-react';
import { parseCSVClient } from '../utils/csvParser';

interface CSVUploadProps {
  onUploadSuccess: (data: { file: File; headers: string[]; rows: any[] }) => void;
}

export function CSVUpload({ onUploadSuccess }: CSVUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setError(null);
    setIsLoading(true);

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv') {
      setError('Invalid file format. Only .csv files are allowed.');
      setIsLoading(false);
      return;
    }

    if (file.size === 0) {
      setError('The uploaded CSV file is empty and contains no data.');
      setIsLoading(false);
      return;
    }

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxFileSize) {
      setError('File size too large. Maximum allowed size is 10MB.');
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('File content is empty.');
        }

        const { headers, rows } = parseCSVClient(text);
        if (headers.length === 0) {
          throw new Error('No column headers detected in the CSV.');
        }

        onUploadSuccess({ file, headers, rows });
      } catch (err) {
        setError((err as Error).message || 'Failed to parse the CSV file.');
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error reading the file.');
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          AI CRM Lead Importer
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
          Upload any CSV file. Our generative AI matches column mappings, normalizes contacts, and cleans details automatically.
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer flex flex-col items-center justify-center transition-all duration-300 ${
          isDragActive
            ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-950/20'
            : 'border-gray-300 dark:border-zinc-800 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-zinc-900/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={isLoading}
        />

        {isLoading ? (
          <div className="space-y-4">
            <RefreshCw className="h-12 w-12 text-brand-500 animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-600 dark:text-zinc-300">Reading CSV file...</p>
          </div>
        ) : (
          <>
            <div className="h-16 w-16 rounded-2xl bg-brand-50 dark:bg-zinc-900 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-105 transition-transform duration-200 shadow-sm mb-6">
              <Upload className="h-7 w-7" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Drag & drop your CSV file here
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">
              or click to browse your local files (Max size: 10MB)
            </p>

            <span className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 transition-colors duration-150">
              Browse Files
            </span>
          </>
        )}
      </div>

      {error && (
        <div className="mt-6 flex items-center space-x-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Helpful Hint / Specs */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
          <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
            AI Smart Mapping
          </h4>
          <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
            CSV columns like "Customer Name", "Ph", or "Lead Source" are automatically cleaned, mapped to standard fields, and loaded.
          </p>
        </div>

        <div className="p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
          <h4 className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide mb-2">
            SaaS Ready Deduplication
          </h4>
          <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
            Multiple emails/phone numbers in single cells are processed. The primary goes to mobile, others are appended to CRM notes.
          </p>
        </div>
      </div>
    </div>
  );
}
