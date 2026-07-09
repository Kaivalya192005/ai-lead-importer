import { Request, Response, NextFunction } from 'express';
import { CSVParserService } from '../services/csvParser.service';
import { BatchService } from '../services/batch.service';
import { deduplicateLeads } from '../utils/validation';
import { AIService } from '../services/ai.service';
import { logger } from '../utils/logger';

export class CSVController {
  /**
   * Upload, parse, clean, map, and deduplicate CSV leads.
   */
  public static upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();
    try {
      logger.info('Received file upload request');

      if (!req.file) {
        logger.warn('Upload attempt without a file');
        res.status(400).json({
          success: false,
          error: 'No file uploaded. Please upload a valid CSV file using the key name "file".'
        });
        return;
      }

      // 1. Strong Validation: Extension Check
      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'csv' && req.file.mimetype !== 'text/csv') {
        logger.warn(`Invalid file type rejected: ${req.file.originalname}`);
        res.status(400).json({
          success: false,
          error: 'File extension invalid. Only .csv files are supported.'
        });
        return;
      }

      // 2. Strong Validation: File Size limit (10MB max)
      const maxFileSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxFileSize) {
        logger.warn(`File size exceeds 10MB limit: ${req.file.size} bytes`);
        res.status(400).json({
          success: false,
          error: 'File size too large. Maximum allowed size is 10MB.'
        });
        return;
      }

      // 3. Strong Validation: Empty File Check
      if (req.file.size === 0 || !req.file.buffer || req.file.buffer.length === 0) {
        logger.warn('Uploaded file is empty');
        res.status(400).json({
          success: false,
          error: 'The uploaded CSV file is empty and contains no data.'
        });
        return;
      }

      let batchSize = 50;
      if (req.body.batchSize) {
        const parsedSize = parseInt(req.body.batchSize, 10);
        if (!isNaN(parsedSize) && parsedSize > 0) {
          batchSize = parsedSize;
        }
      }

      let concurrency = 3;
      if (req.body.concurrency) {
        const parsedConcurrency = parseInt(req.body.concurrency, 10);
        if (!isNaN(parsedConcurrency) && parsedConcurrency > 0) {
          concurrency = parsedConcurrency;
        }
      }

      logger.info(`Parsing CSV file: ${req.file.originalname} (${req.file.size} bytes)`);
      
      let rawRecords: any[] = [];
      try {
        rawRecords = await CSVParserService.parse(req.file.buffer);
      } catch (parseError) {
        logger.error('CSV Parsing failed due to corrupted file content:', parseError);
        res.status(400).json({
          success: false,
          error: 'Corrupted CSV file. Please verify columns formatting and character encoding.'
        });
        return;
      }

      if (rawRecords.length === 0) {
        res.json({
          success: true,
          totalParsed: 0,
          totalImported: 0,
          totalSkipped: 0,
          totalDuplicates: 0,
          averageConfidence: 100,
          processType: 'fallback',
          processingTimeMs: Date.now() - startTime,
          importedLeads: [],
          skippedLeads: [],
          duplicateLeads: [],
          mappingMetadata: []
        });
        return;
      }

      // 4. Batch & Mapping execution (Gemini with Fallback Mapper integration)
      logger.info(`Processing ${rawRecords.length} records. Fallback parser active if AI fails.`);
      const customKey = req.headers['x-gemini-api-key'] as string | undefined;
      const { importedLeadsWithRaw, skippedLeads, mappingMetadata, processType } = 
        await BatchService.processAll(rawRecords, batchSize, concurrency, customKey);

      // 5. Global Duplicate Lead Detection
      logger.info(`Deduplicating ${importedLeadsWithRaw.length} unique leads globally.`);
      const { uniqueLeads, duplicateLeads } = deduplicateLeads(importedLeadsWithRaw);

      // Calculate confidence average
      const confidenceScores = mappingMetadata.map(m => m.confidence);
      const averageConfidence = confidenceScores.length > 0
        ? Math.round(confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length)
        : 100;

      const processingTimeMs = Date.now() - startTime;
      logger.info(`Request fully processed in ${processingTimeMs}ms. Mapped: ${uniqueLeads.length}, Duplicates: ${duplicateLeads.length}, Skipped: ${skippedLeads.length}`);

      res.json({
        success: true,
        totalParsed: rawRecords.length,
        totalImported: uniqueLeads.length,
        totalSkipped: skippedLeads.length,
        totalDuplicates: duplicateLeads.length,
        averageConfidence,
        processType,
        processingTimeMs,
        importedLeads: uniqueLeads,
        skippedLeads,
        duplicateLeads,
        mappingMetadata
      });
    } catch (error) {
      logger.error('Error during CSV upload controller execution:', error);
      next(error);
    }
  };

  /**
   * Health check for the Gemini API connection.
   */
  public static aiStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customKey = req.headers['x-gemini-api-key'] as string | undefined;
      await AIService.testConnection(customKey);
      
      res.json({
        status: 'connected',
        provider: 'Gemini',
        mode: 'AI'
      });
    } catch (error) {
      res.json({
        status: 'offline',
        mode: 'fallback',
        reason: (error as Error).message || 'API connection failure'
      });
    }
  };
}
