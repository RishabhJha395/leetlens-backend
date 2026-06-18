import express from 'express';
import {
  saveAIReport,
  getAIReports,
  getLatestAIReport,
  generateReport
} from '../controllers/ai.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAIReports)
  .post(saveAIReport);

router.get('/latest', getLatestAIReport);
router.post('/generate', generateReport);

export default router;
