import express from 'express';
import { verifyLeetCodeAccount, proxyGraphQL, captureSnapshot, getHistory } from '../controllers/leetcode.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/verify', protect, verifyLeetCodeAccount);
router.post('/graphql', proxyGraphQL); // Proxy doesn't strictly need auth, or it can
router.post('/snapshot', protect, captureSnapshot);
router.get('/history', protect, getHistory);

export default router;
