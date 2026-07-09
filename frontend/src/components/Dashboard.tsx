'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Flame, Sparkles, AlertCircle, TrendingUp, Compass, 
  MapPin, CheckCircle, Clock, ShieldAlert, BarChart3 
} from 'lucide-react';
import { CRMLead } from '../types';
import { getLeadQuality } from './ManageLeads';

export function Dashboard() {
  const [leads, setLeads] = useState<CRMLead[]>([]);
  
  useEffect(() => {
    const stored = localStorage.getItem('crm_leads');
    if (stored) {
      try {
        setLeads(JSON.parse(stored));
      } catch (e) {
        setLeads([]);
      }
    }
  }, []);

  // Compute metrics
  const totalLeads = leads.length;
  
  const hotLeads = leads.filter(l => getLeadQuality(l) === 'HOT').length;
  const goodLeads = leads.filter(l => getLeadQuality(l) === 'GOOD').length;
  const coldLeads = leads.filter(l => getLeadQuality(l) === 'COLD').length;

  // Status distributions
  const saleDone = leads.filter(l => l.crm_status === 'SALE_DONE').length;
  const followUp = leads.filter(l => l.crm_status === 'GOOD_LEAD_FOLLOW_UP').length;
  const noConnect = leads.filter(l => l.crm_status === 'DID_NOT_CONNECT').length;
  const badLead = leads.filter(l => l.crm_status === 'BAD_LEAD').length;

  // Source distributions
  const sources: Record<string, number> = {};
  leads.forEach(l => {
    const src = l.data_source || 'leads_on_demand';
    sources[src] = (sources[src] || 0) + 1;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md flex items-center space-x-4">
          <div className="p-3 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 rounded-xl">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Total CRM Leads</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{totalLeads}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md flex items-center space-x-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Hot Leads</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{hotLeads}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Good Leads</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{goodLeads}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md flex items-center space-x-4">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 rounded-xl">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Cold Leads</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">{coldLeads}</p>
          </div>
        </div>
      </div>

      {/* Grid Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quality Distribution */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <BarChart3 className="h-4.5 w-4.5 text-brand-500" />
            <span>Lead Quality Analytics</span>
          </h4>

          {totalLeads > 0 ? (
            <div className="space-y-4">
              {/* HOT */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-rose-600 dark:text-rose-450">Hot (High Intent Contacts)</span>
                  <span className="text-gray-500">{hotLeads} ({Math.round((hotLeads / totalLeads) * 100)}%)</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-500" 
                    style={{ width: `${(hotLeads / totalLeads) * 100}%` }}
                  />
                </div>
              </div>

              {/* GOOD */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-450">Good (Valid Contacts)</span>
                  <span className="text-gray-500">{goodLeads} ({Math.round((goodLeads / totalLeads) * 100)}%)</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500" 
                    style={{ width: `${(goodLeads / totalLeads) * 100}%` }}
                  />
                </div>
              </div>

              {/* COLD */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-zinc-650 dark:text-zinc-400">Cold (Missing Contact Details)</span>
                  <span className="text-gray-500">{coldLeads} ({Math.round((coldLeads / totalLeads) * 100)}%)</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-zinc-400 dark:bg-zinc-600 transition-all duration-500" 
                    style={{ width: `${(coldLeads / totalLeads) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-gray-400 dark:text-zinc-500">
              No leads data available to map quality breakdown.
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <CheckCircle className="h-4.5 w-4.5 text-brand-500" />
            <span>CRM Pipeline Statuses</span>
          </h4>

          {totalLeads > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 text-center">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-450 uppercase tracking-wider block">Sale Done</span>
                <span className="text-2xl font-black text-emerald-800 dark:text-emerald-400 block mt-1">{saleDone}</span>
              </div>
              <div className="p-4 bg-blue-50/50 dark:bg-brand-950/10 rounded-xl border border-blue-100/50 dark:border-brand-900/30 text-center">
                <span className="text-[10px] font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider block">Follow Up</span>
                <span className="text-2xl font-black text-brand-800 dark:text-brand-400 block mt-1">{followUp}</span>
              </div>
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-100/50 dark:border-amber-900/30 text-center">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-450 uppercase tracking-wider block">No Connect</span>
                <span className="text-2xl font-black text-amber-800 dark:text-amber-400 block mt-1">{noConnect}</span>
              </div>
              <div className="p-4 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-100/50 dark:border-red-900/30 text-center">
                <span className="text-[10px] font-bold text-red-700 dark:text-red-450 uppercase tracking-wider block">Bad Lead</span>
                <span className="text-2xl font-black text-red-800 dark:text-red-400 block mt-1">{badLead}</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-gray-400 dark:text-zinc-500">
              No leads data available to map status.
            </div>
          )}
        </div>
      </div>

      {/* Data Sources Breakdown */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <Compass className="h-4.5 w-4.5 text-brand-500" />
          <span>Marketing & Campaign Data Sources</span>
        </h4>

        {totalLeads > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'].map(src => {
              const count = sources[src] || 0;
              const percent = Math.round((count / totalLeads) * 100) || 0;
              
              return (
                <div key={src} className="p-4 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-100 dark:border-zinc-900 text-center flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-550 uppercase tracking-wider block">
                      {src.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white block mt-1.5">{count}</span>
                  </div>
                  <span className="text-[10px] text-gray-450 dark:text-zinc-500 block mt-2 font-semibold">
                    {percent}% shares
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-gray-400 dark:text-zinc-500">
            No source distributions recorded.
          </div>
        )}
      </div>

      {/* Recent Activity List */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm transition-colors">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Clock className="h-4.5 w-4.5 text-brand-500" />
          <span>Recent Lead Ingestions</span>
        </h4>

        {leads.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800">
            {leads.slice(0, 5).map((l, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    getLeadQuality(l) === 'HOT'
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'
                      : getLeadQuality(l) === 'GOOD'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'
                  }`}>
                    {l.name ? l.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white block">{l.name || 'Unknown Lead'}</span>
                    <span className="text-[10px] text-gray-450 dark:text-zinc-500 block mt-0.5">{l.email || 'No email contact'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-gray-400 dark:text-zinc-500 text-[10px]">
                    {l.created_at ? new Date(l.created_at).toLocaleDateString() : '—'}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    l.crm_status === 'SALE_DONE'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : 'bg-blue-50 text-brand-700 dark:bg-brand-950/20'
                  }`}>
                    {l.crm_status?.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">
            No recent lead additions found. Use Lead Importer to load new templates.
          </p>
        )}
      </div>
    </div>
  );
}
