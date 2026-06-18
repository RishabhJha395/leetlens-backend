import express from 'express';
import { generateReport } from '../controllers/report.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/pdf', generateReport);

export default router;
