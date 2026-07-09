'use client';

import React, { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { CSVUpload } from '../components/CSVUpload';
import { CSVPreview } from '../components/CSVPreview';
import { ProcessingUI } from '../components/ProcessingUI';
import { CRMOutputTable } from '../components/CRMOutputTable';
import { AuditLog, addAuditLog } from '../components/AuditLog';
import { Settings } from '../components/Settings';
import { Dashboard } from '../components/Dashboard';
import { ManageLeads } from '../components/ManageLeads';
import { useTheme } from '../hooks/useTheme';
import { CRMLead, SkippedLead, DuplicateLead, MappingMetadata, UploadAPIResponse } from '../types';

type ImportStage = 'dashboard' | 'upload' | 'preview' | 'processing' | 'results' | 'manage' | 'logs' | 'settings';

export default function Home() {
  const { theme, toggleTheme, isDark } = useTheme();
  
  // Dashboard and Import state
  const [stage, setStage] = useState<ImportStage>('dashboard');
  const [fileName, setFileName] = useState<string>('');
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);

  // Processing UI states
  const [processedCount, setProcessedCount] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing mapping system...');

  // Final Outputs
  const [importedLeads, setImportedLeads] = useState<CRMLead[]>([]);
  const [skippedLeads, setSkippedLeads] = useState<SkippedLead[]>([]);
  const [duplicateLeads, setDuplicateLeads] = useState<DuplicateLead[]>([]);
  const [mappingMetadata, setMappingMetadata] = useState<MappingMetadata[]>([]);
  
  // Mappings Telemetry
  const [processType, setProcessType] = useState<'gemini' | 'fallback'>('gemini');
  const [processingTimeMs, setProcessingTimeMs] = useState(0);
  const [averageConfidence, setAverageConfidence] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle client-side file reading success
  const handleUploadSuccess = ({ file, headers, rows }: { file: File; headers: string[]; rows: any[] }) => {
    setFileObject(file);
    setFileName(file.name);
    setParsedHeaders(headers);
    setParsedRows(rows);
    setStage('preview');
    addAuditLog(
      'CSV Uploaded', 
      `Uploaded file "${file.name}" (${file.size} bytes). Detected ${rows.length} rows and ${headers.length} columns.`, 
      'info'
    );
  };

  const handleCancelPreview = () => {
    setFileObject(null);
    setFileName('');
    setParsedHeaders([]);
    setParsedRows([]);
    setStage('upload');
  };

  // Triggered when clicking "Confirm Import"
  const handleConfirmImport = async (batchSize: number, concurrency: number) => {
    if (!fileObject) return;

    setStage('processing');
    setProcessedCount(0);
    setProgressPercent(5);
    setStatusMessage('Preparing multipart payload...');
    
    addAuditLog(
      'AI Processing Started', 
      `Initiated lead mapping for ${parsedRows.length} rows with batch size of ${batchSize}.`, 
      'info'
    );

    // Progress simulation during API processing
    const totalRecords = parsedRows.length;
    const totalBatches = Math.ceil(totalRecords / batchSize);
    
    let simulatedProcessed = 0;
    const interval = setInterval(() => {
      simulatedProcessed += Math.min(batchSize, totalRecords - simulatedProcessed);
      const percent = Math.min(95, Math.round((simulatedProcessed / totalRecords) * 100));
      
      const currentBatch = Math.min(totalBatches, Math.floor(simulatedProcessed / batchSize) + 1);
      
      setProcessedCount(Math.min(simulatedProcessed, totalRecords));
      setProgressPercent(percent);
      setStatusMessage(`Sent Batch ${currentBatch} of ${totalBatches} to Gemini API. Waiting for mappings...`);

      if (simulatedProcessed >= totalRecords) {
        clearInterval(interval);
      }
    }, 1500); // simulate batch speed (1.5s per batch)

    try {
      const formData = new FormData();
      formData.append('file', fileObject);
      formData.append('batchSize', String(batchSize));
      formData.append('concurrency', String(concurrency));

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const headers: HeadersInit = {};
      
      // Inject user key if configured in settings
      const customKey = localStorage.getItem('gemini_api_key');
      if (customKey && customKey.trim() !== '') {
        headers['x-gemini-api-key'] = customKey.trim();
      }

      const response = await fetch(`${apiBaseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: headers
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || 'Server error occurred during processing.');
      }

      const data: UploadAPIResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to map leads.');
      }

      // Complete progress bar
      setProgressPercent(100);
      setProcessedCount(totalRecords);
      setStatusMessage('Lead import completed successfully.');

      setImportedLeads(data.importedLeads);
      setSkippedLeads(data.skippedLeads);
      setDuplicateLeads(data.duplicateLeads);
      setMappingMetadata(data.mappingMetadata);
      setProcessType(data.processType);
      setProcessingTimeMs(data.processingTimeMs);
      setAverageConfidence(data.averageConfidence);
      setStage('results');

      // Save imported leads to global localStorage pool
      const stored = localStorage.getItem('crm_leads');
      const existing: CRMLead[] = stored ? JSON.parse(stored) : [];
      const updated = [...data.importedLeads, ...existing];
      localStorage.setItem('crm_leads', JSON.stringify(updated));

      // Add system audits
      if (data.processType === 'fallback') {
        addAuditLog(
          'Fallback Activated', 
          `AI processing failed. Standard rule-based fallback parser was automatically activated.`, 
          'warning'
        );
      } else {
        addAuditLog(
          'AI Mappings Complete', 
          `Gemini converted leads successfully in ${data.processingTimeMs}ms with average confidence score of ${data.averageConfidence}%.`, 
          'success'
        );
      }

      if (data.totalDuplicates > 0) {
        addAuditLog(
          'Duplicates Removed', 
          `Deduplication checker flagged and removed ${data.totalDuplicates} duplicate leads.`, 
          'warning'
        );
      }

      addAuditLog(
        'Import Completed', 
        `Import summary: ${data.totalImported} imported, ${data.totalSkipped} skipped, ${data.totalDuplicates} duplicates.`, 
        'success'
      );

    } catch (err) {
      clearInterval(interval);
      const errMsg = (err as Error).message || 'An unexpected error occurred.';
      setErrorMessage(errMsg);
      setStage('results');
      addAuditLog('AI Processing Failed', `Import execution crashed: ${errMsg}`, 'error');
    }
  };

  const handleReset = () => {
    setFileObject(null);
    setFileName('');
    setParsedHeaders([]);
    setParsedRows([]);
    setImportedLeads([]);
    setSkippedLeads([]);
    setDuplicateLeads([]);
    setMappingMetadata([]);
    setErrorMessage(null);
    setStage('upload');
  };

  const handleNavigate = (target: 'dashboard' | 'upload' | 'manage' | 'logs' | 'settings') => {
    setStage(target);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-zinc-100 transition-colors duration-200 overflow-hidden">
      {/* Sidebar Layout */}
      <Sidebar currentStage={stage} isDark={isDark} toggleTheme={toggleTheme} onNavigate={handleNavigate} />

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header bar */}
        <header className="h-16 flex items-center px-8 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-colors">
          <div className="flex-1">
            <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase">
              {stage === 'dashboard'
                ? 'CRM Dashboard Analytics'
                : stage === 'manage'
                ? 'Leads Manager Console'
                : stage === 'logs' 
                ? 'System Logs / Audit Trail' 
                : stage === 'settings' 
                ? 'Configuration Settings' 
                : 'Lead Importer / Converter Pipeline'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">Environment: Sandbox</span>
          </div>
        </header>

        {/* Dashboard Shell Frame */}
        <div className="flex-1 p-8 overflow-y-auto min-h-0">
          
          {stage === 'dashboard' && (
            <div className="animate-fade-in">
              <Dashboard />
            </div>
          )}

          {stage === 'upload' && (
            <div className="animate-fade-in">
              <CSVUpload onUploadSuccess={handleUploadSuccess} />
            </div>
          )}

          {stage === 'preview' && (
            <div className="h-full max-h-[calc(100vh-12rem)] animate-fade-in">
              <CSVPreview
                fileName={fileName}
                headers={parsedHeaders}
                rows={parsedRows}
                onConfirm={handleConfirmImport}
                onCancel={handleCancelPreview}
              />
            </div>
          )}

          {stage === 'processing' && (
            <div className="animate-fade-in">
              <ProcessingUI
                totalRecords={parsedRows.length}
                batchSize={50}
                currentProgress={progressPercent}
                processedCount={processedCount}
                statusMessage={statusMessage}
              />
            </div>
          )}

          {stage === 'results' && (
            <div className="animate-fade-in">
              {errorMessage ? (
                <div className="max-w-xl mx-auto py-12 text-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                  <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                    !
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Import Failed</h3>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">{errorMessage}</p>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-500 transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <CRMOutputTable
                  importedLeads={importedLeads}
                  skippedLeads={skippedLeads}
                  duplicateLeads={duplicateLeads}
                  mappingMetadata={mappingMetadata}
                  processType={processType}
                  processingTimeMs={processingTimeMs}
                  averageConfidence={averageConfidence}
                  onReset={handleReset}
                />
              )}
            </div>
          )}

          {stage === 'manage' && (
            <div className="animate-fade-in">
              <ManageLeads />
            </div>
          )}

          {stage === 'logs' && (
            <div className="animate-fade-in">
              <AuditLog />
            </div>
          )}

          {stage === 'settings' && (
            <div className="animate-fade-in">
              <Settings />
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
