import express from 'express';
import {
  register,
  login,
  refresh,
  logout,
  logoutAllDevices,
  forgotPassword,
  resetPassword,
  verifyLeetCode,
  googleLogin
} from '../controllers/auth.controller';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);
router.post('/verify-leetcode', protect, verifyLeetCode);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAllDevices);

router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);

// Google OAuth routes would go here

export default router;
