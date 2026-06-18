import { Request, Response, NextFunction } from 'express';
import { Goal } from '../models/Goal';
import { AppError } from '../utils/AppError';

export const createGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, targetProblems, startDate, endDate } = req.body;

    const newGoal = await Goal.create({
      user: req.user.id,
      type,
      targetProblems,
      startDate,
      endDate
    });

    res.status(201).json({ status: 'success', data: newGoal });
  } catch (error) {
    next(error);
  }
};

export const getGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ status: 'success', count: goals.length, data: goals });
  } catch (error) {
    next(error);
  }
};

export const updateGoalProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { completedProblems } = req.body;

    const goal = await Goal.findOne({ _id: id, user: req.user.id });
    if (!goal) {
      return next(new AppError('Goal not found', 404));
    }

    goal.completedProblems = completedProblems;
    await goal.save(); // This triggers the pre-save hook to update isCompleted

    res.status(200).json({ status: 'success', data: goal });
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const goal = await Goal.findOneAndDelete({ _id: id, user: req.user.id });

    if (!goal) {
      return next(new AppError('Goal not found', 404));
    }

    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
