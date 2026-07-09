import { Router } from 'express';
import multer from 'multer';
import { CSVController } from '../controllers/csvController';

const router = Router();

// Configure multer to store uploaded files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/upload
router.post('/upload', upload.single('file'), CSVController.upload);

// GET /api/ai/status
router.get('/ai/status', CSVController.aiStatus);

export default router;
