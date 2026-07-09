import { FallbackService } from './fallback.service';

describe('Fallback Rule-Based Mapping Service', () => {
  it('should intelligently map standard column headers based on fallback rules', () => {
    const rawRecords = [
      {
        'Client Name': 'Alice Green',
        'Mail address': 'alice.g@outlook.com',
        'Contact No': '+1 4155552671',
        'Notes/Remarks': 'Villa Preference',
        'Source': 'eden_park'
      }
    ];

    const result = FallbackService.map(rawRecords);
    expect(result.importedLeads).toHaveLength(1);
    
    const lead = result.importedLeads[0];
    expect(lead.name).toBe('Alice Green');
    expect(lead.email).toBe('alice.g@outlook.com');
    expect(lead.country_code).toBe('+1');
    expect(lead.mobile_without_country_code).toBe('4155552671');
    expect(lead.crm_note).toBe('Villa Preference');
    expect(lead.data_source).toBe('eden_park');

    // Verify metadata was generated
    expect(result.mappingMetadata).toHaveLength(5);
    const namesMeta = result.mappingMetadata.find(m => m.targetField === 'name');
    expect(namesMeta).toBeDefined();
    expect(namesMeta!.sourceColumn).toBe('Client Name');
  });

  it('should filter out and skip records that do not contain email or phone numbers', () => {
    const rawRecords = [
      {
        'Client Name': 'No contact info at all',
        'Source': 'eden_park'
      }
    ];

    const result = FallbackService.map(rawRecords);
    expect(result.importedLeads).toHaveLength(0);
    expect(result.skippedLeads).toHaveLength(1);
    expect(result.skippedLeads[0].reason).toContain('Fallback Parser Validation Failed');
  });
});
