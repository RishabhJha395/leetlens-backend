import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { LeetCodeService } from '../services/leetcode.service';
import { AppError } from '../utils/AppError';
import axios from 'axios';
import { UserSnapshot } from '../models/UserSnapshot';

export const verifyLeetCodeAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.isVerified) {
      return res.status(400).json({ status: 'fail', message: 'Account is already verified.' });
    }

    if (!user.leetcodeUsername) {
      return next(new AppError('No LeetCode username associated with this account.', 400));
    }

    if (!user.verificationToken) {
      return next(new AppError('No verification token found. Please contact support.', 400));
    }

    // Fetch the bio
    const bio = await LeetCodeService.getUserBio(user.leetcodeUsername);

    // Search for token in bio
    if (bio && bio.includes(user.verificationToken)) {
      user.isVerified = true;
      user.verifiedAt = new Date();
      user.verificationToken = undefined; // Remove token
      await user.save();

      return res.status(200).json({
        status: 'success',
        message: 'LeetCode account successfully verified!',
        user: {
          id: user._id,
          leetcodeUsername: user.leetcodeUsername,
          isVerified: user.isVerified,
          verifiedAt: user.verifiedAt,
        }
      });
    } else {
      return res.status(400).json({
        status: 'fail',
        message: 'Token not found. Please update your LeetCode profile bio and try again.',
      });
    }
  } catch (error) {
    next(error);
  }
};

export const proxyGraphQL = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await axios.post('https://leetcode.com/graphql', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    res.status(200).json(response.data);
  } catch (error: any) {
    next(new AppError(error.message || 'Error proxying GraphQL request', 500));
  }
};

export const captureSnapshot = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { problemsSolved, contestRating, globalRanking, reputation } = req.body;
    
    const today = new Date().toISOString().split('T')[0];

    let snapshot = await UserSnapshot.findOne({ user: userId, date: today });
    if (!snapshot) {
      snapshot = await UserSnapshot.create({
        user: userId,
        date: today,
        problemsSolved,
        contestRating,
        globalRanking,
        reputation
      });
    } else {
      // Update if already exists today
      snapshot.problemsSolved = problemsSolved;
      snapshot.contestRating = contestRating;
      snapshot.globalRanking = globalRanking;
      snapshot.reputation = reputation;
      await snapshot.save();
    }

    res.status(200).json({ status: 'success', data: snapshot });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const history = await UserSnapshot.find({ user: userId }).sort({ date: 1 });
    res.status(200).json({ status: 'success', data: history });
  } catch (error) {
    next(error);
  }
};
