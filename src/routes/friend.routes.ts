import express from 'express';
import {
  sendFriendRequest,
  respondToFriendRequest,
  getFriendList,
  removeFriend
} from '../controllers/friend.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.use(protect); // All routes require auth

router.get('/', getFriendList);
router.post('/request', sendFriendRequest);
router.patch('/request/:requestId', respondToFriendRequest);
router.delete('/:friendId', removeFriend);

export default router;
