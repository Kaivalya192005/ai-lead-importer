import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import csvRoutes from './routes/csvRoutes';
import { errorHandler } from './middleware/errorHandler';
import { AIService } from './services/ai.service';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure production CORS list
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
    if (isAllowed || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-api-key']
}));

// Express built-in body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Setup API routes
app.use('/api', csvRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, async () => {
  const isKeyLoaded = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '';
  
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Gemini API key loaded: ${isKeyLoaded ? 'YES' : 'NO'}`);
  
  if (isKeyLoaded) {
    try {
      await AIService.testConnection();
      logger.info(`Gemini connection: SUCCESS`);
    } catch (err) {
      logger.error(`Gemini connection: FAILED - ${(err as Error).message}`);
    }
  } else {
    logger.warn(`Gemini connection: FAILED - API key missing`);
  }
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

export default app;
