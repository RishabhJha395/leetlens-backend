import express from 'express';
import {
  createGoal,
  getGoals,
  updateGoalProgress,
  deleteGoal
} from '../controllers/goal.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect); // All routes require auth

router.route('/')
  .get(getGoals)
  .post(createGoal);

router.route('/:id')
  .patch(updateGoalProgress)
  .delete(deleteGoal);

export default router;
