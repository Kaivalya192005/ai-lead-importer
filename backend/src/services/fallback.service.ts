import { CRMLead, MappingMetadata, SkippedLead } from '../types';
import { validateAndNormalizeLead } from '../utils/validation';
import { logger } from '../utils/logger';

export class FallbackService {
  /**
   * Intelligently maps raw columns to CRM fields using standard rules.
   * Fired if the Gemini AI API fails.
   */
  public static map(rawRecords: any[]): {
    importedLeads: CRMLead[];
    skippedLeads: SkippedLead[];
    mappingMetadata: MappingMetadata[];
  } {
    logger.info(`Rule-Based Fallback Mapper activated for ${rawRecords.length} records.`);
    
    if (rawRecords.length === 0) {
      return { importedLeads: [], skippedLeads: [], mappingMetadata: [] };
    }

    // Identify mapping configuration based on first row headers
    const sampleRecord = rawRecords[0];
    const headers = Object.keys(sampleRecord);
    
    const mappings: { [source: string]: keyof CRMLead } = {};
    const mappingMetadata: MappingMetadata[] = [];

    // Helper patterns
    const namePattern = /name|fullname|customer|client/i;
    const phonePattern = /phone|mobile|contact|whatsapp/i;
    const emailPattern = /email|mail/i;
    const companyPattern = /company|business/i;
    const cityPattern = /location|city/i;
    const statePattern = /state|province/i;
    const countryPattern = /country/i;
    const sourcePattern = /source|origin/i;
    const commentPattern = /comment|note|remark/i;

    headers.forEach((header) => {
      if (namePattern.test(header) && !mappings['name']) {
        mappings[header] = 'name';
        mappingMetadata.push({
          sourceColumn: header,
          targetField: 'name',
          confidence: 100,
          reason: 'Rule-based mapping fallback (matched name pattern)'
        });
      } else if (emailPattern.test(header) && !mappings['email']) {
        mappings[header] = 'email';
        mappingMetadata.push({
          sourceColumn: header,
          targetField: 'email',
          confidence: 100,
          reason: 'Rule-based mapping fallback (matched email pattern)'
        });
      } else if (phonePattern.test(header) && !mappings['mobile_without_country_code']) {
        mappings[header] = 'mobile_without_country_code';
        mappingMetadata.push({
          sourceColumn: header,
          targetField: 'mobile_without_country_code',
          confidence: 100,
          reason: 'Rule-based mapping fallback (matched phone pattern)'
        });
      } else if (companyPattern.test(header) && !mappings['company']) {
        mappings[header] = 'company';
        mappingMetadata.push({
          sourceColumn: header,
          targetField: 'company',
          confidence: 100,
          reason: 'Rule-based mapping fallback (matched company pattern)'
        });
      } else if (cityPattern.test(header) && !mappings['city']) {
        mappings[header] = 'city';
        mappingMetadata.push({
          sourceColumn: header,
          targetField: 'city',
          confidence: 100,
          reason: 'Rule-based mapping fallback (matched city pattern)'
        });
      } else if (statePattern.test(header) && !mappings['state']) {
        mappings[header] = 'state';
        mappingMetadata.push({
          sourceColumn: header,
          targetField: 'state',
          confidence: 100,
          reason: 'Rule-based mapping fallback (matched state pattern)'
        });
      } else if (countryPattern.test(header) && !mappings['country']) {
        mappings[header] = 'country';
        mappingMetadata.push({
          sourceColumn: header,
          targetField: 'country',
          confidence: 100,
          reason: 'Rule-based mapping fallback (matched country pattern)'
        });
      } else if (sourcePattern.test(header) && !mappings['data_source']) {
        mappings[header] = 'data_source';
        mappingMetadata.push({
          sourceColumn: header,
          targetField: 'data_source',
          confidence: 100,
          reason: 'Rule-based mapping fallback (matched source pattern)'
        });
      } else if (commentPattern.test(header) && !mappings['crm_note']) {
        mappings[header] = 'crm_note';
        mappingMetadata.push({
          sourceColumn: header,
          targetField: 'crm_note',
          confidence: 100,
          reason: 'Rule-based mapping fallback (matched comment pattern)'
        });
      }
    });

    const importedLeads: CRMLead[] = [];
    const skippedLeads: SkippedLead[] = [];

    // Map each raw record based on inferred mappings
    rawRecords.forEach((record, index) => {
      const mappedRecord: any = {
        created_at: new Date().toISOString(),
        lead_owner: 'Rule Fallback Mapper',
        crm_status: 'GOOD_LEAD_FOLLOW_UP',
      };

      // Apply mapping translations
      Object.keys(mappings).forEach((sourceCol) => {
        const targetField = mappings[sourceCol];
        const val = record[sourceCol];
        
        if (targetField === 'mobile_without_country_code' && val) {
          // Attempt basic phone splitting: extract country code starting with +
          const phoneString = String(val).trim();
          const matchPlus = phoneString.match(/^\+(\d{1,4})/);
          if (matchPlus) {
            mappedRecord['country_code'] = `+${matchPlus[1]}`;
            mappedRecord['mobile_without_country_code'] = phoneString.replace(`+${matchPlus[1]}`, '').replace(/\D/g, '');
          } else {
            mappedRecord['country_code'] = null;
            mappedRecord['mobile_without_country_code'] = phoneString.replace(/\D/g, '');
          }
        } else {
          mappedRecord[targetField] = val;
        }
      });

      // Parse dates if key matches created_at
      const dateKeys = Object.keys(record).filter(k => /date|time/i.test(k));
      if (dateKeys.length > 0 && record[dateKeys[0]]) {
        const d = new Date(record[dateKeys[0]]);
        if (!isNaN(d.getTime())) {
          mappedRecord['created_at'] = d.toISOString();
        }
      }

      // Check validation
      const validated = validateAndNormalizeLead(mappedRecord);
      if (validated) {
        importedLeads.push(validated);
      } else {
        skippedLeads.push({
          raw: record,
          reason: 'Fallback Parser Validation Failed: Lacked email and phone contact'
        });
      }
    });

    logger.info(`Fallback mapper processed ${rawRecords.length} records. Unique valid: ${importedLeads.length}, Skipped: ${skippedLeads.length}`);

    return {
      importedLeads,
      skippedLeads,
      mappingMetadata
    };
  }
}
