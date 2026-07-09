import { validateAndNormalizeLead, deduplicateLeads } from './validation';
import { CRMLead } from '../types';

describe('Lead Validation and Normalization', () => {
  it('should successfully normalize a valid lead', () => {
    const raw = {
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      country_code: '+91',
      mobile_without_country_code: '987-654-3210',
      crm_status: 'SALE_DONE',
      data_source: 'eden_park'
    };

    const result = validateAndNormalizeLead(raw);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Rahul Sharma');
    expect(result!.email).toBe('rahul@gmail.com');
    expect(result!.country_code).toBe('+91');
    expect(result!.mobile_without_country_code).toBe('9876543210');
    expect(result!.crm_status).toBe('SALE_DONE');
    expect(result!.data_source).toBe('eden_park');
  });

  it('should skip a lead if email and phone numbers are both missing', () => {
    const raw = {
      name: 'No Contact Info',
      company: 'Acme Corp'
    };

    const result = validateAndNormalizeLead(raw);
    expect(result).toBeNull();
  });

  it('should fall back to standard statuses and sources if invalid ones are supplied', () => {
    const raw = {
      name: 'Priya Sharma',
      email: 'priya@gmail.com',
      crm_status: 'UNKNOWN_STATUS',
      data_source: 'INVALID_SOURCE'
    };

    const result = validateAndNormalizeLead(raw);
    expect(result).not.toBeNull();
    expect(result!.crm_status).toBe('GOOD_LEAD_FOLLOW_UP'); // Default fallback
    expect(result!.data_source).toBe('leads_on_demand'); // Default fallback
  });

  it('should normalize invalid emails to null and still pass if phone is present', () => {
    const raw = {
      name: 'Bad Email Format',
      email: 'not-an-email',
      mobile_without_country_code: '9876543210'
    };

    const result = validateAndNormalizeLead(raw);
    expect(result).not.toBeNull();
    expect(result!.email).toBeNull();
    expect(result!.mobile_without_country_code).toBe('9876543210');
  });
});

describe('Global Duplicate Lead Detection', () => {
  it('should separate duplicate emails and duplicate phones from unique records', () => {
    const lead1: CRMLead = {
      created_at: '2026-07-07T11:05:06Z',
      name: 'Rahul Sharma',
      email: 'rahul@gmail.com',
      country_code: '+91',
      mobile_without_country_code: '9876543210',
      company: 'GrowEasy',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      lead_owner: 'System',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      crm_note: null,
      data_source: 'leads_on_demand',
      possession_time: null,
      description: null
    };

    const lead2: CRMLead = {
      ...lead1,
      name: 'Rahul Duplicate Email',
      mobile_without_country_code: '9876543211' // different phone, same email
    };

    const lead3: CRMLead = {
      ...lead1,
      name: 'Priya Unique',
      email: 'priya@gmail.com',
      mobile_without_country_code: '9876543212' // unique email & phone
    };

    const lead4: CRMLead = {
      ...lead1,
      name: 'Priya Duplicate Phone',
      email: 'priya.dup@gmail.com',
      mobile_without_country_code: '9876543210' // same phone as lead1
    };

    const items = [
      { lead: lead1, raw: { original: 'row1' } },
      { lead: lead2, raw: { original: 'row2' } },
      { lead: lead3, raw: { original: 'row3' } },
      { lead: lead4, raw: { original: 'row4' } }
    ];

    const result = deduplicateLeads(items);
    
    // Validate unique records (lead1 and lead3 should pass)
    expect(result.uniqueLeads).toHaveLength(2);
    expect(result.uniqueLeads[0].name).toBe('Rahul Sharma');
    expect(result.uniqueLeads[1].name).toBe('Priya Unique');

    // Validate duplicate records (lead2 and lead4 should fail)
    expect(result.duplicateLeads).toHaveLength(2);
    expect(result.duplicateLeads[0].reason).toBe('Duplicate email detected: rahul@gmail.com');
    expect(result.duplicateLeads[0].raw).toEqual({ original: 'row2' });
    expect(result.duplicateLeads[1].reason).toBe('Duplicate mobile number detected: 9876543210');
    expect(result.duplicateLeads[1].raw).toEqual({ original: 'row4' });
  });
});
