'use client';

import React, { useState } from 'react';
import { CRMLead, SkippedLead, DuplicateLead, MappingMetadata } from '../types';
import { 
  CheckCircle, AlertTriangle, Download, RefreshCw, Mail, Phone, Calendar, 
  User, ShieldAlert, Cpu, Sparkles, Clock, ChevronDown, ChevronUp, Copy, HelpCircle 
} from 'lucide-react';
import { addAuditLog } from './AuditLog';

interface CRMOutputTableProps {
  importedLeads: CRMLead[];
  skippedLeads: SkippedLead[];
  duplicateLeads: DuplicateLead[];
  mappingMetadata: MappingMetadata[];
  processType: 'gemini' | 'fallback';
  processingTimeMs: number;
  averageConfidence: number;
  onReset: () => void;
}

export function CRMOutputTable({
  importedLeads,
  skippedLeads,
  duplicateLeads,
  mappingMetadata,
  processType,
  processingTimeMs,
  averageConfidence,
  onReset,
}: CRMOutputTableProps) {
  const [activeTab, setActiveTab] = useState<'imported' | 'skipped' | 'duplicate'>('imported');
  const [showMetadata, setShowMetadata] = useState(true);

  // Excel-compatible CSV generation
  const downloadExcelCSV = () => {
    const headers = [
      'created_at',
      'name',
      'email',
      'country_code',
      'mobile_without_country_code',
      'company',
      'city',
      'state',
      'country',
      'lead_owner',
      'crm_status',
      'crm_note',
      'data_source',
      'possession_time',
      'description'
    ];

    // Helper to escape values for Excel CSV compatibility
    const escapeCSVCell = (val: any): string => {
      if (val === null || val === undefined) return '';
      let strVal = String(val);
      // Escape double quotes by doubling them
      if (strVal.includes('"') || strVal.includes(',') || strVal.includes('\n') || strVal.includes('\r')) {
        strVal = `"${strVal.replace(/"/g, '""')}"`;
      }
      return strVal;
    };

    // Header line
    const csvRows = [headers.join(',')];

    // Data lines
    importedLeads.forEach((lead) => {
      const row = headers.map(header => escapeCSVCell(lead[header as keyof CRMLead]));
      csvRows.push(row.join(','));
    });

    // Excel UTF-8 BOM character prefix to force correct cell separation in Excel
    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `groweasy_crm_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('CSV Exported', `Downloaded Excel-compatible CSV containing ${importedLeads.length} leads.`, 'success');
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
    if (score >= 70) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20';
    return 'text-red-500 bg-red-50 dark:bg-red-950/20';
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      
      {/* Fallback Parser Banner / Gemini Process Indicator */}
      <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
        processType === 'fallback'
          ? 'bg-amber-50/60 dark:bg-amber-950/10 border-amber-200/50 dark:border-amber-900/20 text-amber-850 dark:text-amber-400'
          : 'bg-indigo-50/40 dark:bg-zinc-900/30 border-indigo-150/40 dark:border-zinc-800 text-indigo-900 dark:text-brand-400'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
            processType === 'fallback' ? 'bg-amber-100 dark:bg-amber-950/30' : 'bg-brand-100 dark:bg-brand-950/30'
          }`}>
            {processType === 'fallback' ? <AlertTriangle className="h-4.5 w-4.5" /> : <Sparkles className="h-4.5 w-4.5" />}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">
              {processType === 'fallback' ? 'Fallback Parser Activated' : 'Gemini AI Processing Complete'}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
              {processType === 'fallback'
                ? 'Gemini was unavailable. Standard mapping rules were successfully applied to parse contacts.'
                : 'Generative mapping completed schema transformation with structured JSON validation.'}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
          processType === 'fallback' 
            ? 'bg-amber-150/40 border-amber-200 dark:border-amber-900/40' 
            : 'bg-brand-150/40 border-brand-200 dark:border-brand-900/40'
        }`}>
          {processType === 'fallback' ? 'FALLBACK_MODE' : 'AI_MODE'}
        </span>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm transition-colors text-left">
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Total Records</p>
          <p className="text-xl font-extrabold text-gray-900 dark:text-white mt-1.5">
            {(importedLeads.length + skippedLeads.length + duplicateLeads.length).toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm border-l-4 border-l-emerald-500 transition-colors text-left">
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Imported leads</p>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1.5">
            {importedLeads.length.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm border-l-4 border-l-amber-500 transition-colors text-left">
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Skipped leads</p>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5">
            {skippedLeads.length.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm border-l-4 border-l-orange-500 transition-colors text-left">
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Duplicate leads</p>
          <p className="text-xl font-extrabold text-orange-600 dark:text-orange-400 mt-1.5">
            {duplicateLeads.length.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm border-l-4 border-l-brand-500 transition-colors text-left">
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide flex items-center">
            <span>AI Confidence</span>
          </p>
          <p className="text-xl font-extrabold text-brand-600 dark:text-brand-400 mt-1.5">
            {processType === 'fallback' ? '100%' : `${averageConfidence}%`}
            <span className="text-[9px] font-normal text-gray-400 block dark:text-zinc-500">
              {processType === 'fallback' ? 'Rule-Based Fallback' : 'Gemini score average'}
            </span>
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm border-l-4 border-l-indigo-400 transition-colors text-left">
          <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wide">Duration</p>
          <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1.5">
            {(processingTimeMs / 1000).toFixed(2)}s
          </p>
        </div>

      </div>

      {/* AI Mapping Intelligence Accordion Panel */}
      {mappingMetadata.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-colors">
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-150 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20 text-left"
          >
            <div className="flex items-center space-x-2">
              <Cpu className="h-4.5 w-4.5 text-brand-500" />
              <span className="text-xs font-bold text-gray-900 dark:text-white">AI Mapping Intelligence (Confidence Breakdown)</span>
            </div>
            {showMetadata ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>

          {showMetadata && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {mappingMetadata.map((meta, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-gray-150 dark:border-zinc-850 bg-gray-50/20 dark:bg-zinc-900/10 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-brand-600 dark:text-brand-400 truncate max-w-[130px]" title={meta.sourceColumn}>
                        {meta.sourceColumn}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">→</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-brand-50 dark:bg-brand-950/20 rounded text-brand-700 dark:text-brand-300">
                        {meta.targetField}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 leading-relaxed mt-2.5">
                      {meta.reason}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-zinc-850 pt-2.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Confidence</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getConfidenceColor(meta.confidence)}`}>
                      {meta.confidence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 gap-4 transition-colors">
        
        <div className="flex space-x-1 bg-gray-105 dark:bg-zinc-800/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('imported')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'imported'
                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Imported ({importedLeads.length})
          </button>
          <button
            onClick={() => setActiveTab('skipped')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'skipped'
                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Skipped ({skippedLeads.length})
          </button>
          <button
            onClick={() => setActiveTab('duplicate')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
              activeTab === 'duplicate'
                ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Duplicates ({duplicateLeads.length})
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={downloadExcelCSV}
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download CRM CSV</span>
          </button>
          <button
            onClick={onReset}
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg text-gray-750 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Import Another File</span>
          </button>
        </div>

      </div>

      {/* Tables inspectors */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        
        {activeTab === 'imported' && (
          importedLeads.length === 0 ? (
            <div className="p-16 text-center text-gray-500 dark:text-zinc-400">
              <p className="text-sm font-semibold">No leads were imported.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500">
                    <th className="px-6 py-3">Lead</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Details</th>
                    <th className="px-6 py-3">Metadata</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/40 text-xs text-gray-600 dark:text-zinc-400">
                  {importedLeads.map((lead, i) => (
                    <tr key={i} className="hover:bg-gray-50/40 dark:hover:bg-zinc-900/30">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-white flex items-center">
                            <User className="h-3 w-3 text-zinc-400 mr-1.5 shrink-0" />
                            {lead.name}
                          </span>
                          <span className="text-[10px] text-gray-450 dark:text-zinc-500 mt-0.5">{lead.company || 'No Company'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-0.5">
                          {lead.email && (
                            <span className="flex items-center text-gray-500 dark:text-zinc-400">
                              <Mail className="h-3.5 w-3.5 text-zinc-400 mr-1.5 shrink-0" />
                              {lead.email}
                            </span>
                          )}
                          {lead.mobile_without_country_code && (
                            <span className="flex items-center text-gray-500 dark:text-zinc-400">
                              <Phone className="h-3.5 w-3.5 text-zinc-400 mr-1.5 shrink-0" />
                              {lead.country_code || ''} {lead.mobile_without_country_code}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex flex-col">
                          <span className="truncate block max-w-[200px]" title={lead.crm_note || lead.description || ''}>
                            {lead.crm_note || lead.description || 'No notes'}
                          </span>
                          {lead.possession_time && (
                            <span className="text-[9px] text-brand-600 dark:text-brand-400 font-semibold mt-1">
                              Timeline: {lead.possession_time}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="capitalize font-medium">{lead.data_source?.replace(/_/g, ' ') || 'leads_on_demand'}</span>
                          <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1 shrink-0" />
                            {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          lead.crm_status === 'SALE_DONE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : lead.crm_status === 'GOOD_LEAD_FOLLOW_UP'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                            : lead.crm_status === 'DID_NOT_CONNECT'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                        }`}>
                          {lead.crm_status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'skipped' && (
          skippedLeads.length === 0 ? (
            <div className="p-16 text-center text-gray-500 dark:text-zinc-400">
              <p className="text-sm font-semibold">No records were skipped.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500">
                    <th className="px-6 py-3 w-1/3">Reason for Skip</th>
                    <th className="px-6 py-3">Raw Content JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/40 text-xs text-gray-650 dark:text-zinc-400 font-mono">
                  {skippedLeads.map((skipped, i) => (
                    <tr key={i} className="hover:bg-gray-50/40 dark:hover:bg-zinc-900/30">
                      <td className="px-6 py-4 font-sans font-medium text-amber-700 dark:text-amber-400">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                          <span>{skipped.reason}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-gray-400 dark:text-zinc-500 truncate max-w-md">
                        {JSON.stringify(skipped.raw)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'duplicate' && (
          duplicateLeads.length === 0 ? (
            <div className="p-16 text-center text-gray-500 dark:text-zinc-400">
              <p className="text-sm font-semibold">No duplicate leads detected.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500">
                    <th className="px-6 py-3 w-1/3">Reason for Skip</th>
                    <th className="px-6 py-3">Raw Content JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/40 text-xs text-gray-650 dark:text-zinc-400 font-mono">
                  {duplicateLeads.map((dup, i) => (
                    <tr key={i} className="hover:bg-gray-50/40 dark:hover:bg-zinc-900/30">
                      <td className="px-6 py-4 font-sans font-medium text-orange-605 dark:text-orange-400">
                        <div className="flex items-start space-x-2">
                          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
                          <span>{dup.reason}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-gray-400 dark:text-zinc-500 truncate max-w-md">
                        {JSON.stringify(dup.raw)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

      </div>
    </div>
  );
}
