import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { CRMLead, CRMStatus, DataSource, MappingMetadata, SkippedLead } from '../types';
import { logger } from '../utils/logger';
import { validateAndNormalizeLead } from '../utils/validation';

export class AIService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static getClient(customKey?: string): GoogleGenerativeAI {
    const keyToUse = customKey || process.env.GEMINI_API_KEY;
    if (!keyToUse || keyToUse.trim() === '') {
      throw new Error('Gemini API key missing');
    }
    return new GoogleGenerativeAI(keyToUse);
  }

  /**
   * Tests the connection to Gemini API by sending a simple prompt.
   */
  public static async testConnection(customKey?: string): Promise<void> {
    const client = this.getClient(customKey);
    const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    await model.generateContent('Return OK');
  }

  /**
   * Helper function to execute async task with retries and exponential backoff
   */
  private static async retryWithBackoff<T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      logger.warn(`AI request failed. Retrying in ${delay}ms... Details: ${(error as Error).message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return this.retryWithBackoff(operation, retries - 1, delay * 2);
    }
  }

  /**
   * Identifies column mappings by sending only CSV headers and a few sample rows to Gemini.
   */
  public static async getMappingSchema(
    headers: string[],
    samples: any[],
    customKey?: string
  ): Promise<MappingMetadata[]> {
    const systemInstruction = `
You are a Senior Data Engineer & AI Specialist. Your task is to analyze the headers and sample rows of an uploaded CSV file, and map them to a standardized CRM lead structure.

TARGET CRM FIELDS:
- created_at: Date (ISO 8601 string, e.g., "2026-07-07T11:05:06Z"). If not present or invalid, use current time.
- name: Full name of lead.
- email: Primary email.
- country_code: Phone country code starting with '+' (e.g. "+91", "+1").
- mobile_without_country_code: Cleaned mobile number digits (e.g. "9876543210").
- company: Company name if available.
- city: City.
- state: State.
- country: Country name.
- lead_owner: Assigned owner if specified, or null.
- crm_status: MUST ONLY be one of: ["GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE"]. Map intelligently based on notes or status strings. Default is "GOOD_LEAD_FOLLOW_UP".
- crm_note: General notes, summary of comments, or overflow/extra emails and phone numbers.
- data_source: MUST ONLY be one of: ["leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots"]. Map from lead source columns or select the best match. Default is "leads_on_demand".
- possession_time: Preferred possession timeline if mentioned (e.g. "next month", "immediate").
- description: Additional descriptions or project preference details.

Choose the best matching CSV column for each target CRM field. You do not need to map every CSV column, only those that represent CRM fields. If a target CRM field has no matching column in the CSV, do not map it.

RESPONSE FORMAT:
You must return a single flat JSON object where the keys are the exact CSV headers and the values are the mapped target CRM fields. Do not include markdown wraps.

Example response:
{
  "Client Name": "name",
  "Whatsapp": "mobile_without_country_code",
  "Remarks": "crm_note"
}
`;

    const client = this.getClient(customKey);
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json'
      },
      systemInstruction: systemInstruction
    });

    const prompt = `
Analyze these CSV columns and first 5 sample rows:
Headers: ${JSON.stringify(headers)}
Samples: ${JSON.stringify(samples, null, 2)}
`;

    const executeRequest = async () => {
      logger.info('Gemini request started');
      try {
        const response = await model.generateContent(prompt);
        const responseText = response.response.text();
        logger.info('Gemini response received');
        
        const parsedJSON = JSON.parse(responseText.trim());
        logger.info('Gemini JSON parsed successfully');

        // Convert the flat key-value object to MappingMetadata[] structure
        const mappingMetadata: MappingMetadata[] = Object.entries(parsedJSON).map(([sourceColumn, targetField]) => {
          return {
            sourceColumn,
            targetField: String(targetField),
            confidence: 100,
            reason: `Mapped to ${targetField} via Gemini AI`
          };
        });

        return mappingMetadata;
      } catch (error) {
        logger.error(`Gemini error message: ${(error as Error).message}`);
        throw error;
      }
    };

    return await this.retryWithBackoff(executeRequest);
  }
}
