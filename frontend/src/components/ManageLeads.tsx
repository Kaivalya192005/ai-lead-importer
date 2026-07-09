'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Plus, MoreVertical, Eye, Copy, Download, 
  Trash2, Mail, Phone, Calendar, Building, MapPin, X, Check 
} from 'lucide-react';
import { CRMLead, CRMStatus, DataSource } from '../types';
import { addAuditLog } from './AuditLog';

// Helper function to dynamically grade lead quality
export function getLeadQuality(lead: CRMLead): 'HOT' | 'GOOD' | 'COLD' {
  const hasPhone = !!lead.mobile_without_country_code && lead.mobile_without_country_code.trim() !== '';
  const hasEmail = !!lead.email && lead.email.trim() !== '';
  const hasBoth = hasPhone && hasEmail;

  const textToSearch = `${lead.description || ''} ${lead.crm_note || ''}`.toLowerCase();
  const interestedKeywords = [
    'interested', 'buy', 'purchase', 'invest', 'plot', 'villa', 'bhk', 
    'immediate', 'schedule', 'visit', 'site visit', 'booking', 'ready'
  ];
  const hasKeywords = interestedKeywords.some(keyword => textToSearch.includes(keyword));

  if (hasBoth && hasKeywords) {
    return 'HOT';
  }
  if (hasBoth) {
    return 'GOOD';
  }
  return 'COLD';
}

export function ManageLeads() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<CRMLead | null>(null);
  
  // Feedback
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form State for Manual Lead Entry
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    city: '',
    notes: ''
  });

  // Load leads from localStorage
  const loadLeads = () => {
    const stored = localStorage.getItem('crm_leads');
    if (stored) {
      try {
        setLeads(JSON.parse(stored));
      } catch (e) {
        setLeads([]);
      }
    } else {
      setLeads([]);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleRefresh = () => {
    loadLeads();
    addAuditLog('Leads Refreshed', 'Manually refreshed leads manager console', 'info');
  };

  // Add a lead manually
  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name) return;
    if (!newLead.email && !newLead.phone) {
      alert('Please provide at least an Email or a Phone number.');
      return;
    }

    const leadToAdd: CRMLead = {
      created_at: new Date().toISOString(),
      name: newLead.name,
      email: newLead.email ? newLead.email.trim().toLowerCase() : null,
      country_code: newLead.phone.startsWith('+') ? newLead.phone.substring(0, 3) : null,
      mobile_without_country_code: newLead.phone.replace(/\D/g, ''),
      company: newLead.company ? newLead.company.trim() : null,
      city: newLead.city ? newLead.city.trim() : null,
      state: null,
      country: null,
      lead_owner: 'System Manually Entered',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      crm_note: newLead.notes ? newLead.notes.trim() : null,
      data_source: 'leads_on_demand',
      possession_time: null,
      description: newLead.notes ? newLead.notes.trim() : null
    };

    const stored = localStorage.getItem('crm_leads');
    const existing: CRMLead[] = stored ? JSON.parse(stored) : [];
    const updated = [leadToAdd, ...existing];
    
    localStorage.setItem('crm_leads', JSON.stringify(updated));
    setLeads(updated);
    
    // Reset Form
    setNewLead({
      name: '',
      email: '',
      phone: '',
      company: '',
      city: '',
      notes: ''
    });
    setShowAddModal(false);

    addAuditLog(
      'Manual Lead Added', 
      `Manually created lead "${leadToAdd.name}" in CRM database.`, 
      'success'
    );
  };

  // Delete a lead
  const handleDeleteLead = (indexToDelete: number) => {
    const lead = leads[indexToDelete];
    const updated = leads.filter((_, idx) => idx !== indexToDelete);
    localStorage.setItem('crm_leads', JSON.stringify(updated));
    setLeads(updated);
    setActiveDropdownId(null);
    addAuditLog('Lead Deleted', `Deleted lead record "${lead.name || 'Unknown'}"`, 'warning');
  };

  // Copy Lead JSON
  const handleCopyJSON = (lead: CRMLead, index: number) => {
    navigator.clipboard.writeText(JSON.stringify(lead, null, 2));
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
    setActiveDropdownId(null);
    addAuditLog('Lead Copied', `Copied JSON schema metadata of "${lead.name}" to clipboard`, 'info');
  };

  // Download Lead JSON file
  const handleDownloadLead = (lead: CRMLead) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lead, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `lead_${lead.name?.replace(/\s+/g, '_') || 'record'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setActiveDropdownId(null);
    addAuditLog('Lead Downloaded', `Downloaded lead schema card of "${lead.name}"`, 'info');
  };

  // Filter leads based on query
  const filteredLeads = leads.filter(lead => {
    const q = searchQuery.toLowerCase();
    const nameMatch = lead.name ? lead.name.toLowerCase().includes(q) : false;
    const emailMatch = lead.email ? lead.email.toLowerCase().includes(q) : false;
    const phoneMatch = lead.mobile_without_country_code ? lead.mobile_without_country_code.includes(q) : false;
    return nameMatch || emailMatch || phoneMatch;
  });

  return (
    <div className="space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-250 dark:border-zinc-800 shadow-sm transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search leads by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700 transition-colors dark:text-zinc-300"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-500 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Main Leads List Grid */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Lead Name</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Contact</th>
                <th className="py-3.5 px-6">Date Created</th>
                <th className="py-3.5 px-6">Company</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Quality</th>
                <th className="py-3.5 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 text-xs text-gray-700 dark:text-zinc-300">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead, idx) => {
                  const quality = getLeadQuality(lead);
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50/30 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="py-4 px-6 font-semibold text-gray-900 dark:text-white">
                        {lead.name || 'Unknown Lead'}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-gray-500 dark:text-zinc-400">
                        {lead.email || '—'}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] text-gray-500 dark:text-zinc-400">
                        {lead.mobile_without_country_code 
                          ? `${lead.country_code || ''} ${lead.mobile_without_country_code}` 
                          : '—'}
                      </td>
                      <td className="py-4 px-6 text-gray-550">
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-4 px-6">
                        {lead.company || '—'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lead.crm_status === 'SALE_DONE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : lead.crm_status === 'DID_NOT_CONNECT'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                            : lead.crm_status === 'BAD_LEAD'
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                            : 'bg-blue-50 text-brand-700 dark:bg-brand-950/20 dark:text-brand-400'
                        }`}>
                          {lead.crm_status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide ${
                          quality === 'HOT'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                            : quality === 'GOOD'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                          {quality}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center relative">
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === idx ? null : idx)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </button>

                        {/* Actions Menu Dropdown */}
                        {activeDropdownId === idx && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActiveDropdownId(null)}
                            />
                            <div className="absolute right-6 top-10 mt-1 w-44 bg-white dark:bg-zinc-950 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-800 py-1.5 z-20 text-left">
                              <button
                                onClick={() => {
                                  setShowDetailsModal(lead);
                                  setActiveDropdownId(null);
                                }}
                                className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-300"
                              >
                                <Eye className="h-3.5 w-3.5 text-gray-400" />
                                <span>View Details</span>
                              </button>
                              <button
                                onClick={() => handleCopyJSON(lead, idx)}
                                className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-300"
                              >
                                {copiedId === idx ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    <span className="text-emerald-500">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5 text-gray-400" />
                                    <span>Copy Lead JSON</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDownloadLead(lead)}
                                className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-300"
                              >
                                <Download className="h-3.5 w-3.5 text-gray-400" />
                                <span>Download Single Lead</span>
                              </button>
                              <div className="border-t border-gray-100 dark:border-zinc-800 my-1" />
                              <button
                                onClick={() => handleDeleteLead(idx)}
                                className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold text-red-650"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Record</span>
                              </button>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-zinc-500 font-medium">
                    No leads found. Create one manually or import from the Lead Importer panel.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal: Add Lead Form */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 shadow-xl rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Create New Lead Card</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-md transition-colors text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={newLead.city}
                  onChange={(e) => setNewLead({ ...newLead, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Notes / Description
                </label>
                <textarea
                  rows={3}
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 transition-all dark:text-white"
                />
              </div>

              <div className="flex justify-end items-center space-x-2 pt-2 border-t border-gray-150 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-50 dark:bg-zinc-850 dark:text-zinc-350 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-brand-600 hover:bg-brand-500 transition-all cursor-pointer"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Details View */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-800 shadow-xl rounded-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Lead Details Card</h3>
              <button 
                onClick={() => setShowDetailsModal(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-md transition-colors text-gray-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header profile row */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">{showDetailsModal.name || 'Unknown Lead'}</h4>
                  <p className="text-xs text-gray-450 dark:text-zinc-500 flex items-center space-x-1.5 mt-0.5">
                    <Building className="h-3.5 w-3.5" />
                    <span>{showDetailsModal.company || 'No Company Details'}</span>
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide ${
                    getLeadQuality(showDetailsModal) === 'HOT'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400'
                      : getLeadQuality(showDetailsModal) === 'GOOD'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {getLeadQuality(showDetailsModal)} Quality
                  </span>
                </div>
              </div>

              {/* General Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-xs">
                    <Mail className="h-4.5 w-4.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Email Address</p>
                      <p className="font-mono text-gray-900 dark:text-white font-medium mt-0.5">{showDetailsModal.email || '—'}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <Phone className="h-4.5 w-4.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Contact Number</p>
                      <p className="font-mono text-gray-900 dark:text-white font-medium mt-0.5">
                        {showDetailsModal.mobile_without_country_code
                          ? `${showDetailsModal.country_code || ''} ${showDetailsModal.mobile_without_country_code}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-xs">
                    <MapPin className="h-4.5 w-4.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Location Info</p>
                      <p className="text-gray-900 dark:text-white font-medium mt-0.5">
                        {[showDetailsModal.city, showDetailsModal.state, showDetailsModal.country].filter(Boolean).join(', ') || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <Calendar className="h-4.5 w-4.5 text-gray-400" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Date Registered</p>
                      <p className="text-gray-900 dark:text-white font-medium mt-0.5">
                        {showDetailsModal.created_at ? new Date(showDetailsModal.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Source tags */}
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-zinc-800 pt-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">CRM Status</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">
                    {showDetailsModal.crm_status?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Lead Source</p>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">
                    {showDetailsModal.data_source?.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Lead Notes */}
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Notes / Conversation Log</p>
                <div className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-xl text-xs text-gray-700 dark:text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">
                  {showDetailsModal.crm_note || showDetailsModal.description || 'No notes added for this lead.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-gray-150 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
              <button
                onClick={() => setShowDetailsModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-650 hover:bg-brand-700 text-white transition-colors cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
