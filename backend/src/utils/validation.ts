import { CRMLead, CRMStatus, DataSource, DuplicateLead } from '../types';

const VALID_STATUSES: Set<CRMStatus> = new Set([
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
]);

const VALID_SOURCES: Set<DataSource> = new Set([
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
]);

/**
 * Validates and normalizes a CRMLead object mapped by the AI or Fallback mapper.
 */
export function validateAndNormalizeLead(rawLead: any): CRMLead | null {
  const name = rawLead.name ? String(rawLead.name).trim() : null;
  
  // 1. Email splitting & validation (first valid as primary, others to note)
  let emailString = rawLead.email ? String(rawLead.email).trim() : null;
  let finalEmail: string | null = null;
  let extraEmails: string[] = [];

  if (emailString) {
    const parts = emailString.split(/[\s,;\/]+/).map(p => p.trim()).filter(p => p.length > 0);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const validEmails = parts.filter(p => emailRegex.test(p));
    if (validEmails.length > 0) {
      finalEmail = validEmails[0].toLowerCase();
      if (validEmails.length > 1) {
        extraEmails = validEmails.slice(1).map(e => e.toLowerCase());
      }
    }
  }

  // 2. Phone splitting & validation (first valid 10 digits as primary, others to note)
  let phoneString = '';
  let countryCodeVal = rawLead.country_code ? String(rawLead.country_code).trim() : null;

  if (rawLead.mobile_without_country_code) {
    phoneString = String(rawLead.mobile_without_country_code).trim();
  } else if (rawLead.phone) {
    phoneString = String(rawLead.phone).trim();
  }

  let finalMobile: string | null = null;
  let extraPhones: string[] = [];

  if (phoneString) {
    const matchPlus = phoneString.match(/^\+(\d{1,4})/);
    if (matchPlus) {
      countryCodeVal = `+${matchPlus[1]}`;
      phoneString = phoneString.replace(`+${matchPlus[1]}`, '').trim();
    }

    const rawDigits = phoneString.replace(/\D/g, '');
    let chunks: string[] = [];
    if (rawDigits.length > 10) {
      for (let i = 0; i < rawDigits.length; i += 10) {
        chunks.push(rawDigits.slice(i, i + 10));
      }
    } else {
      chunks = [rawDigits];
    }

    if (chunks.length > 0) {
      finalMobile = chunks[0];
      if (chunks.length > 1) {
        extraPhones = chunks.slice(1).filter(c => c.length > 0);
      }
    }
  }

  if (!finalEmail && !finalMobile) {
    return null;
  }

  let created_at: string | null = null;
  if (rawLead.created_at) {
    const parsedDate = new Date(rawLead.created_at);
    if (!isNaN(parsedDate.getTime())) {
      created_at = parsedDate.toISOString();
    }
  }
  if (!created_at) {
    created_at = new Date().toISOString();
  }

  let crm_status: CRMStatus | null = null;
  if (rawLead.crm_status && VALID_STATUSES.has(rawLead.crm_status as CRMStatus)) {
    crm_status = rawLead.crm_status as CRMStatus;
  } else {
    crm_status = 'GOOD_LEAD_FOLLOW_UP';
  }

  let data_source: DataSource | null = null;
  if (rawLead.data_source && VALID_SOURCES.has(rawLead.data_source as DataSource)) {
    data_source = rawLead.data_source as DataSource;
  } else {
    data_source = 'leads_on_demand';
  }

  // 3. Construct CRM Note with Additional Contact Info
  let crm_note = rawLead.crm_note ? String(rawLead.crm_note).trim() : '';
  
  if (extraEmails.length > 0) {
    const extraEmailStr = extraEmails.map(e => `Additional Email: ${e}`).join('\n');
    crm_note = crm_note ? `${crm_note}\n${extraEmailStr}` : extraEmailStr;
  }
  
  if (extraPhones.length > 0) {
    const extraPhoneStr = extraPhones.map(p => `Additional Contact: ${p}`).join('\n');
    crm_note = crm_note ? `${crm_note}\n${extraPhoneStr}` : extraPhoneStr;
  }

  return {
    created_at,
    name: name || 'Unknown Lead',
    email: finalEmail,
    country_code: countryCodeVal,
    mobile_without_country_code: finalMobile,
    company: rawLead.company ? String(rawLead.company).trim() : null,
    city: rawLead.city ? String(rawLead.city).trim() : null,
    state: rawLead.state ? String(rawLead.state).trim() : null,
    country: rawLead.country ? String(rawLead.country).trim() : null,
    lead_owner: rawLead.lead_owner ? String(rawLead.lead_owner).trim() : 'System Importer',
    crm_status,
    crm_note: crm_note !== '' ? crm_note : null,
    data_source,
    possession_time: rawLead.possession_time ? String(rawLead.possession_time).trim() : null,
    description: rawLead.description ? String(rawLead.description).trim() : null,
  };
}

/**
 * Global duplicate lead detection.
 * Separates leads into unique and duplicates based on unique email or phone number constraints.
 */
export function deduplicateLeads(
  importedLeadsWithRaw: { lead: CRMLead; raw: any }[]
): {
  uniqueLeads: CRMLead[];
  duplicateLeads: DuplicateLead[];
} {
  const uniqueLeads: CRMLead[] = [];
  const duplicateLeads: DuplicateLead[] = [];

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();

  for (const item of importedLeadsWithRaw) {
    const { lead, raw } = item;
    const email = lead.email ? lead.email.toLowerCase().trim() : null;
    const phone = lead.mobile_without_country_code ? lead.mobile_without_country_code.trim() : null;

    let isDup = false;
    let reason = '';

    if (email && seenEmails.has(email)) {
      isDup = true;
      reason = `Duplicate email detected: ${email}`;
    } else if (phone && seenPhones.has(phone)) {
      isDup = true;
      reason = `Duplicate mobile number detected: ${phone}`;
    }

    if (isDup) {
      duplicateLeads.push({ raw, reason });
    } else {
      if (email) seenEmails.add(email);
      if (phone) seenPhones.add(phone);
      uniqueLeads.push(lead);
    }
  }

  return { uniqueLeads, duplicateLeads };
}
