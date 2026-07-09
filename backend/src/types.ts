export type CRMStatus = 
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE';

export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots';

export interface CRMLead {
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: CRMStatus | null;
  crm_note: string | null;
  data_source: DataSource | null;
  possession_time: string | null;
  description: string | null;
}

export interface MappingMetadata {
  sourceColumn: string;
  targetField: string;
  confidence: number; // percentage (0 - 100)
  reason: string;
}

export interface SkippedLead {
  raw: any;
  reason: string;
}

export interface DuplicateLead {
  raw: any;
  reason: string;
}

export interface BatchProcessingResult {
  importedLeads: CRMLead[];
  skippedLeads: SkippedLead[];
  duplicateLeads: DuplicateLead[];
  mappingMetadata: MappingMetadata[];
  stats: {
    totalParsed: number;
    totalImported: number;
    totalSkipped: number;
    totalDuplicates: number;
    averageConfidence: number;
  };
}
