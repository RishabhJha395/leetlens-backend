import express from 'express';
import { getAchievements } from '../controllers/achievement.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect);

router.get('/', getAchievements);

export default router;
