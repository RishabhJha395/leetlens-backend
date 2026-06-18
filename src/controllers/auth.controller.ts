import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, IUser } from '../models/User';
import { AuthService } from '../services/auth.service';
import { LeetCodeService } from '../services/leetcode.service';
import { AppError } from '../utils/AppError';
import { sendEmail } from '../utils/sendEmail';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendTokenResponse = (user: IUser, statusCode: number, res: Response, accessToken: string, refreshToken: string) => {
  const cookieOptions = {
    expires: new Date(Date.now() + parseInt(process.env.JWT_REFRESH_EXPIRES_IN || '7') * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  };

  res.cookie('jwt', refreshToken, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    tokens: {
      accessToken,
      refreshToken
    },
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      leetcodeUsername: user.leetcodeUsername,
      isVerified: user.isVerified,
      avatar: user.avatar,
      verificationToken: user.isVerified ? undefined : user.verificationToken,
    },
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, leetcodeUsername } = req.body;

    if (!leetcodeUsername) {
      return next(new AppError('Please provide your LeetCode username to register.', 400));
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email is already in use', 400));
    }

    const existingLeetcode = await User.findOne({ leetcodeUsername });
    if (existingLeetcode) {
      if (existingLeetcode.isVerified) {
        return next(new AppError('This LeetCode account is already linked to another verified user', 400));
      } else {
        existingLeetcode.leetcodeUsername = undefined;
        await existingLeetcode.save({ validateBeforeSave: false });
      }
    }

    const verificationToken = `LL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const newUser = await User.create({
      name,
      email,
      password,
      leetcodeUsername,
      verificationToken,
    });

    const { accessToken, refreshToken } = await AuthService.generateTokens(newUser);

    sendTokenResponse(newUser, 201, res, accessToken, refreshToken);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    const { accessToken, refreshToken } = await AuthService.generateTokens(user);

    sendTokenResponse(user, 200, res, accessToken, refreshToken);
  } catch (error) {
    next(error);
  }
};

export const googleLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, googleId, avatar } = req.body;

    if (!email || !googleId) {
      return next(new AppError('Please provide email and Google ID', 400));
    }

    let user = await User.findOne({ email });

    if (user) {
      // Link google ID if not linked
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      // Create new user via Google
      const verificationToken = `LL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      user = await User.create({
        name,
        email,
        googleId,
        avatar,
        isVerified: false,
        verificationToken
      });
    }

    const { accessToken, refreshToken } = await AuthService.generateTokens(user);
    sendTokenResponse(user, 200, res, accessToken, refreshToken);
  } catch (error) {
    next(error);
  }
};

export const verifyLeetCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById((req as any).user.id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.isVerified) {
      return res.status(200).json({ status: 'success', message: 'User is already verified' });
    }

    let usernameToVerify = user.leetcodeUsername;
    
    // If not set on user, they must provide it now
    if (!usernameToVerify) {
      if (!req.body.leetcodeUsername) {
        return next(new AppError('Please provide your LeetCode username', 400));
      }
      
      // Ensure no one else has claimed this leetcode account
      const existing = await User.findOne({ leetcodeUsername: req.body.leetcodeUsername });
      if (existing && existing.id !== user.id) {
        if (existing.isVerified) {
          return next(new AppError('This LeetCode account is already linked to another verified user', 400));
        } else {
          existing.leetcodeUsername = undefined;
          await existing.save({ validateBeforeSave: false });
        }
      }
      
      usernameToVerify = req.body.leetcodeUsername;
    }

    if (!user.verificationToken) {
      return next(new AppError('Verification token is missing', 400));
    }

    const bio = await LeetCodeService.getUserBio(usernameToVerify as string);

    if (bio.includes(user.verificationToken)) {
      user.leetcodeUsername = usernameToVerify;
      user.isVerified = true;
      user.verifiedAt = new Date();
      await user.save({ validateBeforeSave: false });

      return res.status(200).json({ status: 'success', message: 'LeetCode profile verified successfully', user });
    }

    return next(new AppError('Verification token not found in your LeetCode bio. Please add it and try again.', 400));
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('Refresh token required', 401));
    }

    const user = await AuthService.verifyRefreshToken(refreshToken);
    const tokens = await AuthService.generateTokens(user);

    // Delete old refresh token to prevent reuse (Optional, for stricter security)
    await AuthService.clearRefreshToken(refreshToken);

    sendTokenResponse(user, 200, res, tokens.accessToken, tokens.refreshToken);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await AuthService.clearRefreshToken(refreshToken);
    }
    
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    });
    
    res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};

export const logoutAllDevices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuthService.clearAllRefreshTokens((req as any).user.id);
    
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    });

    res.status(200).json({ status: 'success', message: 'Logged out of all devices' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide an email address.', 400));
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError('Please provide a valid email address.', 400));
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('Email not registered.', 404));
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : 'http://localhost:5173';
    const resetURL = `${clientUrl}/reset-password/${resetToken}`;

    const message = `Forgot your password? Click the link below to securely reset it:\n\n${resetURL}\n\nThis link is valid for 10 minutes.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'LeetLens Password Reset (Valid for 10 min)',
        message,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
        ...(process.env.NODE_ENV === 'development' && { resetURL })
      });
    } catch (err) {
      try {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
      } catch (saveErr) {
        console.error('Failed to clear reset token on email fail:', saveErr);
      }

      console.error('CRITICAL: Email send failed on Render. Check Gmail App Passwords:', err);

      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          status: 'success',
          message: 'Email failed to send, but here is your link (Dev Mode)',
          resetURL
        });
      }

      return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resetToken = req.params.token;

    const user = await User.findOne({
      passwordResetToken: resetToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', 400));
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const { accessToken, refreshToken } = await AuthService.generateTokens(user);
    sendTokenResponse(user, 200, res, accessToken, refreshToken);
  } catch (error) {
    next(error);
  }
};
