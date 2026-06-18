import { Request, Response, NextFunction } from 'express';
import { Friendship } from '../models/Friendship';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';

export const sendFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetUsername } = req.body;
    const requesterId = req.user.id;

    if (!targetUsername) {
      return next(new AppError('Please provide a target username.', 400));
    }

    const targetUser = await User.findOne({ leetcodeUsername: targetUsername });
    if (!targetUser) {
      return next(new AppError('User not found.', 404));
    }

    if (targetUser._id.toString() === requesterId) {
      return next(new AppError('You cannot send a friend request to yourself.', 400));
    }

    // Check if friendship already exists
    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: targetUser._id },
        { requester: targetUser._id, recipient: requesterId }
      ]
    });

    if (existing) {
      return next(new AppError('Friend request already exists or you are already friends.', 400));
    }

    const request = await Friendship.create({
      requester: requesterId,
      recipient: targetUser._id,
      status: 'pending'
    });

    res.status(201).json({ status: 'success', data: request });
  } catch (error) {
    next(error);
  }
};

export const respondToFriendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body; // 'accepted' or 'rejected'
    const userId = req.user.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return next(new AppError('Invalid status. Use accepted or rejected.', 400));
    }

    const request = await Friendship.findById(requestId);
    if (!request) {
      return next(new AppError('Friend request not found.', 404));
    }

    if (request.recipient.toString() !== userId) {
      return next(new AppError('You are not authorized to respond to this request.', 403));
    }

    if (request.status !== 'pending') {
      return next(new AppError('Request has already been processed.', 400));
    }

    request.status = status;
    await request.save();

    res.status(200).json({ status: 'success', data: request });
  } catch (error) {
    next(error);
  }
};

export const getFriendList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;

    const friendships = await Friendship.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted'
    }).populate('requester recipient', 'name leetcodeUsername avatar');

    const friends = friendships.map(f => {
      // Return the other user
      if ((f.requester as any)._id.toString() === userId) {
        return f.recipient;
      }
      return f.requester;
    });

    res.status(200).json({ status: 'success', count: friends.length, data: friends });
  } catch (error) {
    next(error);
  }
};

export const removeFriend = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { friendId } = req.params; // The User ID of the friend
    const userId = req.user.id;

    const result = await Friendship.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId, status: 'accepted' },
        { requester: friendId, recipient: userId, status: 'accepted' }
      ]
    });

    if (!result) {
      return next(new AppError('Friendship not found.', 404));
    }

    res.status(204).json({ status: 'success', data: null });
  } catch (error) {
    next(error);
  }
};
