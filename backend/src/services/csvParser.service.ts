import csv from 'csv-parser';
import { Readable } from 'stream';
import { logger } from '../utils/logger';

export class CSVParserService {
  /**
   * Parses a CSV Buffer into an array of key-value objects.
   * Cleans headers and cell values by trimming whitespace and handling Byte Order Marks (BOM).
   */
  public static async parse(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(
          csv({
            mapHeaders: ({ header }) => {
              // Remove UTF-8 BOM if present and trim spaces
              return header.replace(/^\uFEFF/, '').trim();
            },
            mapValues: ({ value }) => {
              const trimmed = value.trim();
              return trimmed === '' ? null : trimmed;
            }
          })
        )
        .on('data', (row) => {
          // Filter out rows that are entirely empty
          const hasValues = Object.values(row).some(val => val !== null && val !== undefined);
          if (hasValues) {
            records.push(row);
          }
        })
        .on('end', () => {
          logger.info(`Successfully parsed CSV buffer. Total raw rows: ${records.length}`);
          resolve(records);
        })
        .on('error', (error) => {
          logger.error('Error during CSV parsing:', error);
          reject(error);
        });
    });
  }
}
