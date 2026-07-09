import { AIService } from './ai.service';
import { FallbackService } from './fallback.service';
import { validateAndNormalizeLead } from '../utils/validation';
import { CRMLead, MappingMetadata, SkippedLead } from '../types';
import { logger } from '../utils/logger';

export class BatchService {
  /**
   * Processes all raw lead records using the optimized single-schema mapping architecture.
   * Sends headers and sample rows to Gemini *once* to retrieve the mapping metadata layout.
   * Then maps and normalizes all records locally, reducing API consumption to a single call.
   * If Gemini fails for any reason, it triggers the Fallback Parser.
   */
  public static async processAll(
    rawRecords: any[],
    batchSize = 50,
    concurrencyLimit = 3,
    customKey?: string
  ): Promise<{
    importedLeadsWithRaw: { lead: CRMLead; raw: any }[];
    skippedLeads: SkippedLead[];
    mappingMetadata: MappingMetadata[];
    processType: 'gemini' | 'fallback';
  }> {
    const totalParsed = rawRecords.length;
    logger.info(`Processing initiated for ${totalParsed} leads using single-schema mapping architecture.`);

    let geminiCallCount = 0;

    try {
      if (rawRecords.length === 0) {
        return {
          importedLeadsWithRaw: [],
          skippedLeads: [],
          mappingMetadata: [],
          processType: 'gemini'
        };
      }

      const headers = Object.keys(rawRecords[0] || {});
      const samples = rawRecords.slice(0, 5); // Extract first 5 sample rows only

      // Call count check before execution
      geminiCallCount++;
      if (geminiCallCount > 1) {
        throw new Error(`Gemini Call Count exceeded safe limit: ${geminiCallCount}`);
      }

      // 1. Call Gemini to get column mappings once
      const mappingMetadata = await AIService.getMappingSchema(headers, samples, customKey);
      
      // Log request counter
      logger.info(`Gemini API calls used: ${geminiCallCount}`);

      const importedLeadsWithRaw: { lead: CRMLead; raw: any }[] = [];
      const skippedLeads: SkippedLead[] = [];

      // 2. Map all records locally using the metadata mappings
      for (const raw of rawRecords) {
        const lead: any = {};
        
        // Initialize all CRM fields to null
        const crmFields = [
          "created_at", "name", "email", "country_code", "mobile_without_country_code",
          "company", "city", "state", "country", "lead_owner", "crm_status", "crm_note",
          "data_source", "possession_time", "description"
        ];
        crmFields.forEach(f => lead[f] = null);
        
        // Apply mappings
        mappingMetadata.forEach((m) => {
          if (m && m.sourceColumn in raw) {
            lead[m.targetField] = raw[m.sourceColumn];
          }
        });

        // Skip rule check: No email and no mobile
        const emailVal = lead.email ? String(lead.email).trim() : '';
        const phoneVal = lead.mobile_without_country_code ? String(lead.mobile_without_country_code).trim() : '';

        if (emailVal === '' && phoneVal === '') {
          skippedLeads.push({
            raw,
            reason: 'Skipped by AI rule: No email or phone contact'
          });
          continue;
        }

        const validated = validateAndNormalizeLead(lead);
        if (validated) {
          importedLeadsWithRaw.push({ lead: validated, raw });
        } else {
          skippedLeads.push({
            raw,
            reason: 'Skipped by backend validation: Missing email and phone number'
          });
        }
      }

      return {
        importedLeadsWithRaw,
        skippedLeads,
        mappingMetadata,
        processType: 'gemini'
      };

    } catch (geminiError) {
      logger.error(`[GEMINI ERROR] Processing failed: ${(geminiError as Error).message}`);
      logger.warn(`Activating Fallback Parser due to Gemini API failure.`);

      const fallbackResult = FallbackService.map(rawRecords);
      
      const importedLeadsWithRaw = fallbackResult.importedLeads.map((lead, idx) => ({
        lead,
        raw: rawRecords[idx]
      }));

      return {
        importedLeadsWithRaw,
        skippedLeads: fallbackResult.skippedLeads,
        mappingMetadata: fallbackResult.mappingMetadata,
        processType: 'fallback'
      };
    }
  }
}
