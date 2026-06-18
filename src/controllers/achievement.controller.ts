import { Request, Response, NextFunction } from 'express';
import { Achievement } from '../models/Achievement';

export const getAchievements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const achievements = await Achievement.find({ user: req.user.id }).sort('-unlockedAt');
    res.status(200).json({ status: 'success', count: achievements.length, data: achievements });
  } catch (error) {
    next(error);
  }
};
